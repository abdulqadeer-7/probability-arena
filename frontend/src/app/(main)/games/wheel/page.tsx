'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Settings2,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useGameStore } from '@/store/game-store';
import { cn, formatCurrency, randomId } from '@/lib/utils';
import { BalanceDisplay } from '@/components/games/BalanceDisplay';
import { BetControls } from '@/components/games/BetControls';
import { RoundHistory } from '@/components/games/RoundHistory';
import { ErrorState } from '@/components/ui/ErrorState';

const DEFAULT_COLORS = [
  '#06b6d4', '#f59e0b', '#ef4444', '#22c55e',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16', '#e11d48', '#0ea5e9',
];

interface Segment {
  label: string;
  color: string;
  weight: number;
}

function createSegments(count: number, equal: boolean): Segment[] {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  return Array.from({ length: count }, (_, i) => ({
    label: labels[i % labels.length],
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    weight: equal ? 1 : Math.max(0.1, Math.random() * 2),
  }));
}

function pickSegment(segments: Segment[]): Segment {
  const totalWeight = segments.reduce((a, s) => a + s.weight, 0);
  let r = Math.random() * totalWeight;
  for (const seg of segments) {
    r -= seg.weight;
    if (r <= 0) return seg;
  }
  return segments[segments.length - 1];
}

const SEGMENT_OPTIONS = [4, 6, 8, 10, 12];

export default function WheelPage() {
  const { wallet, updateWallet, addRound } = useGameStore();
  const [segCount, setSegCount] = useState(8);
  const [equalMode, setEqualMode] = useState(true);
  const [segments, setSegments] = useState(() => createSegments(8, true));
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Segment | null>(null);
  const [history, setHistory] = useState<{ segment: Segment; count: number }[]>([]);
  const [showClassroomDemo, setShowClassroomDemo] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoResults, setDemoResults] = useState<Record<string, number>>({});
  const [demoSpins, setDemoSpins] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSegments(createSegments(segCount, equalMode));
    setResult(null);
    setRotation(0);
    setHistory([]);
  }, [segCount, equalMode]);

  const segmentAngle = 360 / segments.length;

  const handlePlaceBet = useCallback((amount: number) => {
    if (!wallet || wallet.balance < amount || spinning) return;
    setSpinning(true);
    setError(null);

    const picked = pickSegment(segments);
    const segIndex = segments.indexOf(picked);
    const targetRotation = 720 + (segIndex * segmentAngle) + Math.random() * segmentAngle;

    updateWallet({
      ...wallet,
      balance: wallet.balance - amount,
    });

    setTimeout(() => {
      setRotation((r) => r + targetRotation);
    }, 100);

    setTimeout(() => {
      setSpinning(false);
      setResult(picked);

      const fairOdds = 1 / segments.length;
      const actualOdds = picked.weight / segments.reduce((a, s) => a + s.weight, 0);
      const multiplier = equalMode ? segments.length : (1 / actualOdds);
      const won = Math.random() < actualOdds;
      const payout = won ? Math.floor(amount * multiplier) : 0;

      updateWallet({
        ...wallet,
        balance: wallet.balance + payout,
      });

      addRound({
        id: randomId(),
        gameId: 'wheel',
        userId: wallet.userId,
        betAmount: amount,
        payoutMultiplier: multiplier,
        result: won ? 'win' : 'lose',
        payout: won ? payout : 0,
        gameData: { segment: picked.label, segIndex },
        createdAt: new Date().toISOString(),
      });

      setHistory((h) => {
        const existing = [...h];
        const idx = existing.findIndex((e) => e.segment.label === picked.label);
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], count: existing[idx].count + 1 };
        } else {
          existing.push({ segment: picked, count: 1 });
        }
        return existing;
      });
    }, 3000 + targetRotation * 2);
  }, [wallet, segments, equalMode, spinning, segmentAngle, updateWallet, addRound]);

  const runClassroomDemo = useCallback((spins: number) => {
    setDemoMode(true);
    setDemoSpins(spins);
    const results: Record<string, number> = {};
    for (let i = 0; i < spins; i++) {
      const picked = pickSegment(segments);
      results[picked.label] = (results[picked.label] || 0) + 1;
    }
    setDemoResults(results);
  }, [segments]);

  const chartData = useMemo(() => {
    if (!demoMode || Object.keys(demoResults).length === 0) return [];
    return segments.map((seg) => {
      const observed = demoResults[seg.label] || 0;
      const expected = seg.weight / segments.reduce((a, s) => a + s.weight, 0) * demoSpins;
      return {
        name: seg.label,
        observed,
        expected: Math.round(expected),
        color: seg.color,
      };
    });
  }, [demoResults, segments, demoSpins, demoMode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ErrorState title="Something went wrong" description={error} onRetry={() => setError(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600">
              <Circle className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="text-gradient">Wheel Simulator</span>
              </h1>
              <p className="text-sm text-gray-400">Probability & Expected Value on a Spinning Wheel</p>
            </div>
          </div>
          <button
            onClick={() => setShowClassroomDemo(!showClassroomDemo)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
              showClassroomDemo ? 'bg-aero-500/20 text-aero-400 border-aero-500/30' : 'bg-white/5 text-gray-400 border-white/10',
            )}
            aria-label="Toggle classroom demo mode"
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            Demo
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              {SEGMENT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setSegCount(n)}
                  disabled={spinning}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    segCount === n ? 'bg-aero-500/20 text-aero-400 border border-aero-500/30' : 'bg-white/5 text-gray-400',
                    spinning && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {n} Seg
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={() => setEqualMode(!equalMode)}
                disabled={spinning}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  equalMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-400',
                  spinning && 'opacity-50 cursor-not-allowed',
                )}
                aria-pressed={equalMode}
              >
                {equalMode ? 'Equal' : 'Weighted'}
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-6" style={{ minHeight: 280 }}>
              <svg
                viewBox="0 0 200 200"
                className="w-64 h-64 sm:w-72 sm:h-72"
                style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none' }}
                role="img"
                aria-label={spinning ? 'Wheel spinning' : `Wheel with ${segments.length} segments`}
              >
                {segments.map((seg, i) => {
                  const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
                  const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
                  const x1 = 100 + 90 * Math.cos(startAngle);
                  const y1 = 100 + 90 * Math.sin(startAngle);
                  const x2 = 100 + 90 * Math.cos(endAngle);
                  const y2 = 100 + 90 * Math.sin(endAngle);
                  const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
                  const labelX = 100 + 60 * Math.cos(midAngle);
                  const labelY = 100 + 60 * Math.sin(midAngle);
                  const largeArc = segmentAngle > 180 ? 1 : 0;

                  return (
                    <g key={i}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={seg.color}
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="1"
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${(i + 0.5) * segmentAngle}, ${labelX}, ${labelY})`}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="8" fill="#1f2937" stroke="white" strokeWidth="2" />
              </svg>
              <div className="absolute top-0 right-4 sm:right-8 w-0 h-0"
                style={{ borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '20px solid #f59e0b' }}
                aria-hidden="true"
              />
            </div>

            <AnimatePresence>
              {result && !spinning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-lg font-bold">
                    Landed on <span style={{ color: result.color }}>{result.label}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Probability: {((result.weight / segments.reduce((a, s) => a + s.weight, 0)) * 100).toFixed(1)}%
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {segments.map((seg) => {
                const totalW = segments.reduce((a, s) => a + s.weight, 0);
                const prob = ((seg.weight / totalW) * 100).toFixed(1);
                return (
                  <div
                    key={seg.label}
                    className="glass rounded-lg p-2 text-center text-xs"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: seg.color }}
                      aria-hidden="true"
                    />
                    <span className="text-gray-300">{seg.label}</span>
                    <span className="text-gray-500 ml-1">{prob}%</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <AnimatePresence>
            {showClassroomDemo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass rounded-xl p-4"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                  <BarChart3 className="h-4 w-4 text-aero-400" aria-hidden="true" />
                  Classroom Demo — Probability vs Actual
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[100, 500, 1000].map((n) => (
                    <button
                      key={n}
                      onClick={() => runClassroomDemo(n)}
                      className="px-4 py-2 rounded-lg bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {n} Spins
                    </button>
                  ))}
                  {demoMode && (
                    <button
                      onClick={() => { setDemoMode(false); setDemoResults({}); setDemoSpins(0); }}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <RotateCcw className="inline h-3 w-3 mr-1" aria-hidden="true" />
                      Reset
                    </button>
                  )}
                </div>
                {chartData.length > 0 && (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        />
                        <Bar dataKey="observed" name="Observed" radius={[4, 4, 0, 0]} fill="#22d3ee" />
                        <Bar dataKey="expected" name="Expected" radius={[4, 4, 0, 0]} fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Comparing observed vs expected frequencies over {demoSpins} spins
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4"
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                <Circle className="h-4 w-4 text-green-400" aria-hidden="true" />
                Segment History
              </h3>
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 20).map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{ backgroundColor: `${h.segment.color}20`, color: h.segment.color }}
                  >
                    {h.segment.label} ({h.count})
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          <RoundHistory />
        </div>

        <div className="space-y-6">
          <BalanceDisplay />
          <BetControls
            onPlaceBet={(amount) => handlePlaceBet(amount)}
            disabled={spinning}
            isPlaying={spinning}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-400" aria-hidden="true" />
              Wheel Probability
            </h3>
            <div className="text-xs text-gray-400 space-y-2">
              <p>
                <strong>Equal Mode:</strong> Each segment has equal probability. With {segCount} segments,
                each has a {((1 / segCount) * 100).toFixed(1)}% chance.
              </p>
              <p>
                <strong>Weighted Mode:</strong> Segments have different probabilities. The wheel uses
                weighted random selection to demonstrate unequal probability distributions.
              </p>
              <p>
                <strong>Expected Value:</strong> The payout is calculated based on the actual probability.
                Fair odds would be 1/probability. The difference between fair odds and actual payout
                represents the house edge.
              </p>
              <p className="text-yellow-300/70">
                Try Classroom Demo mode to see how actual results converge to expected probabilities
                over many spins (Law of Large Numbers).
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
