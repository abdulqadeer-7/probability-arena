'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dice1,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Calculator,
  Shuffle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useGameStore } from '@/store/game-store';
import { cn, formatCurrency, randomId } from '@/lib/utils';
import { BalanceDisplay } from '@/components/games/BalanceDisplay';
import { BetControls } from '@/components/games/BetControls';
import { RoundHistory } from '@/components/games/RoundHistory';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';

type DiceMode = 'one' | 'two';
type Prediction = 'over' | 'under' | 'exact';

function rollDice(mode: DiceMode): number[] {
  if (mode === 'one') return [Math.floor(Math.random() * 6) + 1];
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

function getProbability(target: number, mode: DiceMode, pred: Prediction): number {
  if (mode === 'one') {
    switch (pred) {
      case 'exact': return 1 / 6;
      case 'over': return (6 - target) / 6;
      case 'under': return (target - 1) / 6;
    }
  } else {
    const total = 36;
    let favorable = 0;
    for (let a = 1; a <= 6; a++) {
      for (let b = 1; b <= 6; b++) {
        const sum = a + b;
        if (pred === 'exact' && sum === target) favorable++;
        else if (pred === 'over' && sum > target) favorable++;
        else if (pred === 'under' && sum < target) favorable++;
      }
    }
    return favorable / total;
  }
}

function getDiceFace(value: number) {
  const dots: [number, number][] = [];
  const positions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };
  return positions[value] || [];
}

function DiceVisual({ value, rolling }: { value: number; rolling: boolean }) {
  const dots = useMemo(() => getDiceFace(value), [value]);

  return (
    <motion.div
      animate={rolling ? { rotateX: [0, 360], rotateY: [0, 360] } : { rotateX: 0, rotateY: 0 }}
      transition={rolling ? { duration: 0.6, repeat: 2, ease: 'easeInOut' } : { duration: 0.3 }}
      className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl shadow-xl"
      style={{ transformStyle: 'preserve-3d' }}
      role="img"
      aria-label={`Dice showing ${value}`}
    >
      <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200" />
      {dots.map((pos, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 bg-gray-800 rounded-full"
          style={{ left: `${pos[0]}%`, top: `${pos[1]}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </motion.div>
  );
}

const PREDICTION_OPTIONS: { value: Prediction; label: string }[] = [
  { value: 'over', label: 'Over' },
  { value: 'under', label: 'Under' },
  { value: 'exact', label: 'Exact' },
];

export default function DicePage() {
  const { wallet, updateWallet, addRound } = useGameStore();
  const [mode, setMode] = useState<DiceMode>('one');
  const [prediction, setPrediction] = useState<Prediction>('over');
  const [target, setTarget] = useState(7);
  const [rolling, setRolling] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [outcomeHistory, setOutcomeHistory] = useState<{ round: number; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const roundCount = useRef(0);

  const maxTarget = mode === 'one' ? 6 : 12;
  const prob = useMemo(() => getProbability(target, mode, prediction), [target, mode, prediction]);

  const handlePlaceBet = useCallback((amount: number) => {
    if (!wallet || wallet.balance < amount) return;
    setRolling(true);
    setError(null);

    setTimeout(() => {
      const dice = rollDice(mode);
      const sum = dice.reduce((a, b) => a + b, 0);
      setResults(dice);
      setRolling(false);

      roundCount.current += 1;

      let won = false;
      if (prediction === 'exact') won = sum === target;
      else if (prediction === 'over') won = sum > target;
      else won = sum < target;

      const multiplier = prob > 0 ? 1 / prob : 0;
      const payout = won ? Math.floor(amount * multiplier) : 0;

      updateWallet({
        ...wallet,
        balance: wallet.balance + (won ? payout : -amount) + amount,
      });

      addRound({
        id: randomId(),
        gameId: 'dice',
        userId: wallet.userId,
        betAmount: amount,
        payoutMultiplier: multiplier,
        result: won ? 'win' : 'lose',
        payout: won ? payout : 0,
        gameData: { dice, sum, target, prediction },
        createdAt: new Date().toISOString(),
      });

      setOutcomeHistory((h) => [...h, { round: roundCount.current, value: sum }].slice(-50));
    }, 1000);
  }, [wallet, mode, prediction, target, prob, updateWallet, addRound]);

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
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600">
            <Dice1 className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="text-gradient">Dice Roll</span>
            </h1>
            <p className="text-sm text-gray-400">Probability & Distribution Explorer</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setMode('one'); setTarget(3); }}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', mode === 'one' ? 'bg-aero-500/20 text-aero-400 border border-aero-500/30' : 'bg-white/5 text-gray-400')}
                  aria-pressed={mode === 'one'}
                >
                  One Die
                </button>
                <button
                  onClick={() => { setMode('two'); setTarget(7); }}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', mode === 'two' ? 'bg-aero-500/20 text-aero-400 border border-aero-500/30' : 'bg-white/5 text-gray-400')}
                  aria-pressed={mode === 'two'}
                >
                  Two Dice
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
              {results.length > 0 ? (
                results.map((val, i) => (
                  <DiceVisual key={i} value={val} rolling={rolling} />
                ))
              ) : (
                mode === 'one' ? (
                  <DiceVisual value={5} rolling={false} />
                ) : (
                  <>
                    <DiceVisual value={3} rolling={false} />
                    <DiceVisual value={4} rolling={false} />
                  </>
                )
              )}
            </div>

            {rolling && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-aero-400 font-medium"
              >
                <Shuffle className="inline h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                Rolling...
              </motion.p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {PREDICTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPrediction(opt.value)}
                  disabled={rolling}
                  className={cn(
                    'px-4 py-2.5 rounded-lg text-sm font-bold transition-all border',
                    prediction === opt.value
                      ? 'bg-aero-500/20 text-aero-400 border-aero-500/30'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-gray-200',
                    rolling && 'opacity-50 cursor-not-allowed',
                  )}
                  aria-pressed={prediction === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label htmlFor="dice-target" className="text-sm text-gray-400 mb-1 block">
                Target {mode === 'two' ? 'Sum' : 'Number'}: <span className="text-white font-bold">{target}</span>
              </label>
              <input
                id="dice-target"
                type="range"
                min={mode === 'one' ? 1 : 2}
                max={maxTarget}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                disabled={rolling}
                className="w-full accent-aero-500"
                aria-label="Select target number"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{mode === 'one' ? 1 : 2}</span>
                <span>{maxTarget}</span>
              </div>
            </div>

            <div className="glass rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Probability of winning</p>
              <p className="text-2xl font-bold text-aero-400">{(prob * 100).toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">
                1 in {prob > 0 ? Math.round(1 / prob) : '∞'} chance
              </p>
            </div>
          </motion.div>

          {outcomeHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4"
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                <BarChart3 className="h-4 w-4 text-aero-400" aria-hidden="true" />
                Outcome History (Last {outcomeHistory.length} Rounds)
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={outcomeHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="round" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis domain={[mode === 'one' ? 0 : 2, maxTarget]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#d1d5db' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          <RoundHistory />
        </div>

        <div className="space-y-6">
          <BalanceDisplay />
          <BetControls onPlaceBet={(amount) => handlePlaceBet(amount)} disabled={rolling} isPlaying={rolling} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Calculator className="h-4 w-4 text-purple-400" aria-hidden="true" />
              Expected Value
            </h3>
            <div className="text-xs text-gray-400 space-y-2">
              <p>
                <strong>Fair Payout:</strong> 1 / {prob.toFixed(3)} = {(1 / prob).toFixed(2)}x
              </p>
              <p>
                <strong>House Edge:</strong> The payout includes a built-in house edge to ensure
                sustainable gameplay. Check the payout table for exact odds.
              </p>
              {mode === 'two' && (
                <p className="text-yellow-300/70">
                  With two dice, there are 36 possible outcomes. Sum of 7 is the most likely (6/36 = 16.7%),
                  while 2 and 12 are the least likely (1/36 = 2.8% each).
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <TrendingUp className="h-4 w-4 text-green-400" aria-hidden="true" />
              Practice Statistics
            </h3>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Rounds Played: {outcomeHistory.length}</p>
              {outcomeHistory.length > 0 && (
                <>
                  <p>Average Outcome: {(outcomeHistory.reduce((a, b) => a + b.value, 0) / outcomeHistory.length).toFixed(1)}</p>
                  <p>Expected Avg ({mode === 'one' ? '3.5' : '7'}): Theoretical value vs observed</p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
