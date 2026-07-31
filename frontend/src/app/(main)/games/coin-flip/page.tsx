'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Play,
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

type Side = 'heads' | 'tails';

function flipCoin(): Side {
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

export default function CoinFlipPage() {
  const { wallet, updateWallet, addRound } = useGameStore();
  const [selected, setSelected] = useState<Side>('heads');
  const [result, setResult] = useState<Side | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [history, setHistory] = useState<Side[]>([]);
  const [streak, setStreak] = useState(0);
  const [streakSide, setStreakSide] = useState<Side | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headsCount = history.filter((h) => h === 'heads').length;
  const tailsCount = history.filter((h) => h === 'tails').length;
  const totalFlips = history.length;

  const handlePlaceBet = useCallback((amount: number) => {
    if (!wallet || wallet.balance < amount) return;
    setFlipping(true);
    setError(null);

    setTimeout(() => {
      const outcome = flipCoin();
      setResult(outcome);
      setFlipping(false);

      const won = outcome === selected;
      const multiplier = 2;
      const payout = won ? amount * multiplier : 0;

      updateWallet({
        ...wallet,
        balance: wallet.balance + payout,
      });

      addRound({
        id: randomId(),
        gameId: 'coin-flip',
        userId: wallet.userId,
        betAmount: amount,
        payoutMultiplier: won ? multiplier : 0,
        result: won ? 'win' : 'lose',
        payout: won ? payout : 0,
        gameData: { outcome, selected },
        createdAt: new Date().toISOString(),
      });

      setHistory((h) => [outcome, ...h].slice(0, 50));

      if (streakSide === outcome) {
        setStreak((s) => s + 1);
      } else {
        setStreak(1);
        setStreakSide(outcome);
      }
    }, 1200);
  }, [wallet, selected, updateWallet, addRound, streakSide]);

  const runSimulation = useCallback((count: number) => {
    const simResults: Side[] = [];
    for (let i = 0; i < count; i++) {
      simResults.push(flipCoin());
    }
    const h = simResults.filter((r) => r === 'heads').length;
    const t = count - h;
    setSimData({ heads: h, tails: t, total: count });
  }, []);

  const [simData, setSimData] = useState<{ heads: number; tails: number; total: number } | null>(null);

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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600">
            <Coins className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="text-gradient">Coin Flip</span>
            </h1>
            <p className="text-sm text-gray-400">50/50 Probability & Independence</p>
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
            <div className="flex items-center justify-center gap-4 mb-6">
              {(['heads', 'tails'] as Side[]).map((side) => (
                <button
                  key={side}
                  onClick={() => { setSelected(side); setResult(null); }}
                  disabled={flipping}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl transition-all border',
                    selected === side
                      ? 'bg-aero-500/20 border-aero-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20',
                    flipping && 'opacity-50 cursor-not-allowed',
                  )}
                  aria-pressed={selected === side}
                  aria-label={`Bet on ${side}`}
                >
                  <div className={cn(
                    'w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-transform',
                    side === 'heads' ? 'bg-yellow-400' : 'bg-gray-300',
                  )}>
                    <span className={cn(
                      'text-lg sm:text-xl font-black',
                      side === 'heads' ? 'text-yellow-800' : 'text-gray-700',
                    )}>
                      {side === 'heads' ? 'H' : 'T'}
                    </span>
                  </div>
                  <span className={cn(
                    'text-sm font-bold capitalize',
                    selected === side ? 'text-aero-400' : 'text-gray-400',
                  )}>
                    {side}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center h-48 sm:h-56">
              <AnimatePresence mode="wait">
                {flipping ? (
                  <motion.div
                    key="flipping"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    animate={{ rotateY: [0, 180, 360, 540, 720] }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-2xl flex items-center justify-center"
                  >
                    <span className="text-2xl font-black text-yellow-800">?</span>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key={result}
                    initial={{ scale: 0, rotateY: -180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={cn(
                      'w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-2xl',
                      result === 'heads' ? 'bg-yellow-400' : 'bg-gray-300',
                    )}
                    role="img"
                    aria-label={`Result: ${result}`}
                  >
                    <span className={cn(
                      'text-2xl sm:text-3xl font-black',
                      result === 'heads' ? 'text-yellow-800' : 'text-gray-700',
                    )}>
                      {result === 'heads' ? 'H' : 'T'}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 shadow-2xl flex items-center justify-center"
                  >
                    <Coins className="h-12 w-12 text-yellow-800" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {result && !flipping && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'text-center text-xl font-bold mt-4',
                  result === selected ? 'text-green-400' : 'text-red-400',
                )}
              >
                {result === selected ? 'You won!' : 'You lost!'}
                <span className="text-sm text-gray-400 ml-2">
                  ({result === 'heads' ? 'Heads' : 'Tails'})
                </span>
              </motion.p>
            )}

            {totalFlips > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="glass rounded-lg p-3">
                  <p className="text-xs text-gray-500">Streak</p>
                  <p className="text-lg font-bold text-yellow-400">{streak}</p>
                  <p className="text-xs text-gray-500 capitalize">{streakSide || ''}</p>
                </div>
                <div className="glass rounded-lg p-3">
                  <p className="text-xs text-gray-500">Heads</p>
                  <p className="text-lg font-bold tabular-nums">{headsCount}</p>
                  <p className="text-xs text-gray-500">{totalFlips > 0 ? ((headsCount / totalFlips) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="glass rounded-lg p-3">
                  <p className="text-xs text-gray-500">Tails</p>
                  <p className="text-lg font-bold tabular-nums">{tailsCount}</p>
                  <p className="text-xs text-gray-500">{totalFlips > 0 ? ((tailsCount / totalFlips) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <BarChart3 className="h-4 w-4 text-aero-400" aria-hidden="true" />
              Simulation Mode
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {[10, 100, 1000].map((count) => (
                <button
                  key={count}
                  onClick={() => runSimulation(count)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-sm text-gray-300 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <Play className="inline h-3 w-3 mr-1" aria-hidden="true" />
                  {count} Flips
                </button>
              ))}
            </div>
            {simData && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Heads', count: simData.heads },
                    { name: 'Tails', count: simData.tails },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      <Cell fill="#fbbf24" />
                      <Cell fill="#9ca3af" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Expected: 50/50 | Heads: {((simData.heads / simData.total) * 100).toFixed(1)}% | Tails: {((simData.tails / simData.total) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </motion.div>

          {totalFlips > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4"
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                <Coins className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                Recent Flips
              </h3>
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 20).map((side, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      side === 'heads' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-400/20 text-gray-400',
                    )}
                    title={`${side === 'heads' ? 'Heads' : 'Tails'}`}
                  >
                    {side === 'heads' ? 'H' : 'T'}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          <RoundHistory />
        </div>

        <div className="space-y-6">
          <BalanceDisplay />
          <BetControls onPlaceBet={(amount) => handlePlaceBet(amount)} disabled={flipping} isPlaying={flipping} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-400" aria-hidden="true" />
              Independent Events
            </h3>
            <div className="text-xs text-gray-400 space-y-2">
              <p>
                Every coin flip is <strong>independent</strong> — previous results have no effect on future outcomes.
                The probability is exactly 50/50 every time.
              </p>
              <p>
                <strong>Gambler's Fallacy:</strong> After 10 heads in a row, tails is NOT "due". The next flip is
                still 50/50. This is one of the most misunderstood probability concepts.
              </p>
              <p>
                <strong>Law of Large Numbers:</strong> While short runs can be streaky, over thousands of flips,
                the ratio approaches 50/50. Try the simulation above!
              </p>
              <p className="text-yellow-300/70 mt-2">
                Your current streak: {streak} {streakSide} in a row
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
