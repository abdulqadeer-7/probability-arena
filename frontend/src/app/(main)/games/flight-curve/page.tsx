'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  TrendingUp,
  Timer,
  Zap,
  Volume2,
  VolumeX,
  BarChart3,
  History,
  Lightbulb,
} from 'lucide-react';
import { useGameStore } from '@/store/game-store';
import { cn, formatCurrency, randomId } from '@/lib/utils';
import { BalanceDisplay } from '@/components/games/BalanceDisplay';
import { BetControls } from '@/components/games/BetControls';
import { RoundHistory } from '@/components/games/RoundHistory';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

type RoundStatus = 'waiting' | 'flying' | 'crashed';

interface GameStats {
  totalRounds: number;
  biggestWin: number;
  averageMultiplier: number;
}

export default function FlightCurvePage() {
  const { wallet, updateWallet, addRound } = useGameStore();
  const [status, setStatus] = useState<RoundStatus>('waiting');
  const [multiplier, setMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(1);
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2);
  const [cashedOut, setCashedOut] = useState(false);
  const [autoBet, setAutoBet] = useState(false);
  const [maxAutoRounds, setMaxAutoRounds] = useState(10);
  const [autoRoundsLeft, setAutoRoundsLeft] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GameStats>({ totalRounds: 0, biggestWin: 0, averageMultiplier: 0 });
  const [volatility, setVolatility] = useState(50);

  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCrashPoint = useCallback(() => {
    const v = volatility / 100;
    const r = Math.random();
    return Math.max(1.01, 1 + (r * 10 * (0.5 + v)));
  }, [volatility]);

  const startRound = useCallback((amount: number, _auto?: boolean, _rounds?: number) => {
    if (!wallet || wallet.balance < amount) return;
    setBetAmount(amount);
    setLoading(true);
    setError(null);
    setCashedOut(false);
    setMultiplier(1);

    const cp = generateCrashPoint();
    setCrashPoint(cp);

    setTimeout(() => {
      setStatus('flying');
      setLoading(false);
      startTimeRef.current = performance.now();
      updateWallet({ ...wallet, balance: wallet.balance - amount });

      const animate = (now: number) => {
        const elapsed = (now - startTimeRef.current) / 1000;
        const m = 1 + elapsed * (0.5 + (volatility / 200));
        setMultiplier(m);

        drawCanvas(m, cp);

        if (m >= cp) {
          setStatus('crashed');
          const round = {
            id: randomId(),
            gameId: 'flight-curve',
            userId: wallet.userId,
            betAmount: amount,
            payoutMultiplier: 0,
            result: 'lose' as const,
            payout: 0,
            gameData: { crashPoint: cp, cashedOut: false },
            createdAt: new Date().toISOString(),
          };
          addRound(round);
          setStats((s) => ({
            ...s,
            totalRounds: s.totalRounds + 1,
          }));
          return;
        }
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    }, 1500);
  }, [wallet, volatility, generateCrashPoint, addRound, updateWallet]);

  const cashOut = useCallback(() => {
    if (status !== 'flying' || cashedOut || !wallet) return;
    setCashedOut(true);
    cancelAnimationFrame(animRef.current);
    setStatus('waiting');

    const payout = Math.floor(betAmount * multiplier);
    updateWallet({ ...wallet, balance: wallet.balance + payout });
    const round = {
      id: randomId(),
      gameId: 'flight-curve',
      userId: wallet.userId,
      betAmount,
      payoutMultiplier: multiplier,
      result: 'win' as const,
      payout,
      gameData: { crashPoint, cashedOut: true },
      createdAt: new Date().toISOString(),
    };
    addRound(round);
    setStats((s) => ({
      totalRounds: s.totalRounds + 1,
      biggestWin: Math.max(s.biggestWin, payout),
      averageMultiplier: (s.averageMultiplier * s.totalRounds + multiplier) / (s.totalRounds + 1),
    }));
  }, [status, cashedOut, wallet, betAmount, multiplier, crashPoint, addRound, updateWallet]);

  useEffect(() => {
    if (status === 'flying' && autoCashout > 0 && multiplier >= autoCashout && !cashedOut) {
      cashOut();
    }
  }, [multiplier, autoCashout, cashOut, status, cashedOut]);

  useEffect(() => {
    if (autoBet && status === 'waiting' && autoRoundsLeft > 0 && !cashedOut) {
      const timer = setTimeout(() => {
        startRound(betAmount, true, autoRoundsLeft);
        setAutoRoundsLeft((r) => r - 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (autoRoundsLeft <= 0) setAutoBet(false);
  }, [autoBet, status, autoRoundsLeft, betAmount, startRound]);

  const drawCanvas = (m: number, cp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(m / cp, 1);
    const pathY = h - progress * (h - 60) - 30;

    ctx.beginPath();
    ctx.strokeStyle = progress >= 0.9 ? '#ef4444' : '#06b6d4';
    ctx.lineWidth = 3;
    ctx.moveTo(0, h - 20);
    for (let x = 0; x <= w; x += 4) {
      const p = x / w;
      const y = h - (p * (h - 60)) - 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (progress >= 0.9) {
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#ef444480';
      ctx.lineWidth = 2;
      ctx.moveTo(0, pathY);
      ctx.lineTo(w, pathY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.fillStyle = progress >= 0.9 ? '#ef4444' : '#06b6d4';
    ctx.arc(w * progress, pathY, 6, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 0.9) {
      const flameGrad = ctx.createRadialGradient(w * progress - 10, pathY + 15, 2, w * progress - 10, pathY + 25, 20);
      flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
      flameGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.beginPath();
      ctx.fillStyle = flameGrad;
      ctx.ellipse(w * progress - 10, pathY + 25, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      const resize = () => {
        const parent = canvasRef.current?.parentElement;
        if (parent) {
          canvasRef.current!.width = parent.clientWidth;
          canvasRef.current!.height = 300;
        }
      };
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
  }, []);

  const handlePlaceBet = (amount: number, auto?: boolean, rounds?: number) => {
    if (status === 'waiting') {
      if (auto && rounds) {
        setAutoBet(true);
        setAutoRoundsLeft(rounds);
        setBetAmount(amount);
        startRound(amount);
        setAutoRoundsLeft((r) => r - 1);
      } else {
        startRound(amount);
      }
    }
  };

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Rocket className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="text-gradient">Flight Curve</span>
              </h1>
              <p className="text-sm text-gray-400">Timing & Probability of Risk</p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex h-9 w-9 items-center justify-center rounded-lg glass text-gray-400 hover:text-white transition-colors"
            aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
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
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full rounded-lg bg-gray-950/50"
                style={{ height: 300 }}
                aria-label="Flight curve visualization"
              />

              <div className="absolute top-4 left-4">
                <Badge
                  variant={
                    status === 'flying' ? 'success' : status === 'crashed' ? 'danger' : 'default'
                  }
                  size="md"
                  dot
                >
                  {status === 'waiting'
                    ? 'Waiting'
                    : status === 'flying'
                      ? 'In Flight'
                      : 'Crashed'}
                </Badge>
              </div>

              <AnimatePresence>
                {status === 'flying' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                  >
                    <motion.span
                      key={multiplier.toFixed(2)}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-6xl sm:text-7xl font-black tabular-nums"
                      style={{ color: multiplier >= crashPoint * 0.9 ? '#ef4444' : '#22d3ee' }}
                    >
                      {multiplier.toFixed(2)}x
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {status === 'crashed' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-950/60 rounded-lg"
                >
                  <div className="text-center">
                    <p className="text-4xl font-black text-red-400 mb-2">CRASHED</p>
                    <p className="text-gray-400">at {crashPoint.toFixed(2)}x</p>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {status === 'flying' && !cashedOut ? (
                  <motion.button
                    key="cashout"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cashOut}
                    className="px-12 py-4 rounded-2xl bg-gradient-to-r from-aero-500 to-accent-500 text-white font-bold text-xl shadow-lg shadow-aero-500/30 animate-glow"
                    aria-label={`Cash out at ${multiplier.toFixed(2)}x for ${formatCurrency(Math.floor(betAmount * multiplier))}`}
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="h-5 w-5" aria-hidden="true" />
                      Cash Out ({formatCurrency(Math.floor(betAmount * multiplier))})
                    </span>
                  </motion.button>
                ) : status === 'waiting' ? (
                  <p className="text-gray-400 flex items-center gap-2">
                    <Timer className="h-4 w-4" aria-hidden="true" />
                    Place a bet to start the round
                  </p>
                ) : (
                  <motion.button
                    key="next"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setStatus('waiting')}
                    className="px-8 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                  >
                    Next Round
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <TrendingUp className="h-5 w-5 text-aero-400 mx-auto mb-1" aria-hidden="true" />
              <p className="text-xs text-gray-500">Total Rounds</p>
              <p className="text-xl font-bold tabular-nums">{stats.totalRounds}</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <BarChart3 className="h-5 w-5 text-green-400 mx-auto mb-1" aria-hidden="true" />
              <p className="text-xs text-gray-500">Biggest Win</p>
              <p className="text-xl font-bold tabular-nums text-green-400">{formatCurrency(stats.biggestWin)}</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" aria-hidden="true" />
              <p className="text-xs text-gray-500">Avg Multiplier</p>
              <p className="text-xl font-bold tabular-nums">{stats.averageMultiplier.toFixed(2)}x</p>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <label htmlFor="auto-cashout" className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-300">Auto Cashout Multiplier</span>
              <span className="text-aero-400 font-mono font-bold">{autoCashout.toFixed(1)}x</span>
            </label>
            <input
              id="auto-cashout"
              type="range"
              min="1.1"
              max="10"
              step="0.1"
              value={autoCashout}
              onChange={(e) => setAutoCashout(parseFloat(e.target.value))}
              disabled={status === 'flying'}
              className="w-full accent-aero-500"
              aria-label="Auto cashout at multiplier"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1.1x</span>
              <span>10x</span>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <label htmlFor="volatility" className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-300">Volatility (Simulation)</span>
              <span className="text-yellow-400 font-mono">{volatility}%</span>
            </label>
            <input
              id="volatility"
              type="range"
              min="10"
              max="100"
              step="1"
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              disabled={status === 'flying'}
              className="w-full accent-yellow-500"
              aria-label="Adjust simulation volatility"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          <RoundHistory />
        </div>

        <div className="space-y-6">
          <BalanceDisplay />
          <BetControls
            onPlaceBet={handlePlaceBet}
            disabled={status !== 'waiting' || loading}
            isPlaying={status === 'flying'}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-400" aria-hidden="true" />
              Probability Lesson
            </h3>
            <div className="text-xs text-gray-400 space-y-2">
              <p>
                <strong>Independent Events:</strong> Each round's crash point is independent of previous rounds.
                The probability of crashing at any given multiplier does not change based on past results.
              </p>
              <p>
                <strong>Expected Value:</strong> The house edge comes from the fact that the average crash point
                is calibrated to pay out slightly less than fair odds. This demonstrates how probability
                guarantees profit for the house over many rounds.
              </p>
              <p className="text-yellow-300/70 mt-2">
                Try the volatility slider above to see how risk affects crash point distribution.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
