'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stars,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Zap,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useGameStore } from '@/store/game-store';
import { cn, formatCurrency, randomId } from '@/lib/utils';
import { BalanceDisplay } from '@/components/games/BalanceDisplay';
import { BetControls } from '@/components/games/BetControls';
import { RoundHistory } from '@/components/games/RoundHistory';
import { ErrorState } from '@/components/ui/ErrorState';

const SYMBOLS = ['🪐', '🚀', '⭐', '💫', '🌙', '🎯', '🔮'] as const;
const SYMBOL_MULTIPLIERS: Record<string, number> = {
  '🪐': 10, '🚀': 7, '⭐': 5, '💫': 4, '🌙': 3, '🎯': 2, '🔮': 1.5,
};
const REEL_COUNT_OPTIONS = [3, 5];

function spinReels(count: number): string[] {
  return Array.from({ length: count }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

function checkWin(reels: string[]): { win: boolean; multiplier: number; matched: string } | null {
  const first = reels[0];
  if (reels.every((s) => s === first)) {
    return { win: true, multiplier: SYMBOL_MULTIPLIERS[first] || 1, matched: first };
  }
  return null;
}

function getRTPExplanation(): string {
  return 'RTP (Return to Player) represents the theoretical percentage of all wagered money a slot pays back over time. For example, 96% RTP means for every 100 points wagered, 96 points are returned on average. This is calculated over millions of spins and does not guarantee short-term results.';
}

export default function SlotsPage() {
  const { wallet, updateWallet, addRound } = useGameStore();
  const [reelCount, setReelCount] = useState(3);
  const [reels, setReels] = useState<string[]>(Array(reelCount).fill('⭐'));
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ win: boolean; multiplier: number; matched: string } | null>(null);
  const [history, setHistory] = useState<{ reels: string[]; won: boolean; payout: number }[]>([]);
  const [showPayTable, setShowPayTable] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [autoSpinLeft, setAutoSpinLeft] = useState(0);
  const [winAnim, setWinAnim] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spinTimeout = useRef<ReturnType<typeof setTimeout>>();

  const spinDuration = turboMode ? 400 : 800;

  const performSpin = useCallback((amount: number) => {
    if (!wallet || wallet.balance < amount) return;
    setSpinning(true);
    setResult(null);
    setError(null);

    const iterations = turboMode ? 8 : 16;
    let count = 0;

    const cycle = () => {
      setReels(spinReels(reelCount));
      count++;
      if (count < iterations) {
        spinTimeout.current = setTimeout(cycle, spinDuration / iterations);
      } else {
        const final = spinReels(reelCount);
        setReels(final);
        setSpinning(false);

        const outcome = checkWin(final);
        setResult(outcome);

        const won = outcome?.win ?? false;
        const multiplier = outcome?.multiplier ?? 0;
        const payout = won ? Math.floor(amount * multiplier) : 0;

        updateWallet({
          ...wallet,
          balance: wallet.balance + payout,
        });

        addRound({
          id: randomId(),
          gameId: 'slots',
          userId: wallet.userId,
          betAmount: amount,
          payoutMultiplier: multiplier,
          result: won ? 'win' : 'lose',
          payout,
          gameData: { reels: final, matched: outcome?.matched },
          createdAt: new Date().toISOString(),
        });

        setHistory((h) => [{ reels: final, won, payout }, ...h].slice(0, 30));

        if (won) {
          setWinAnim(true);
          setTimeout(() => setWinAnim(false), 2000);
        }
      }
    };
    cycle();
  }, [wallet, reelCount, turboMode, updateWallet, addRound]);

  const handlePlaceBet = useCallback((amount: number, auto?: boolean, rounds?: number) => {
    if (auto && rounds) {
      setAutoSpin(true);
      setAutoSpinLeft(rounds);
      performSpin(amount);
      setAutoSpinLeft((r) => r - 1);
    } else {
      performSpin(amount);
    }
  }, [performSpin]);

  const totalSpins = history.length;
  const wins = history.filter((h) => h.won).length;
  const totalPayout = history.reduce((a, h) => a + h.payout, 0);

  const spinCount = useRef(0);

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600">
              <Stars className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="text-gradient">Slot Simulator</span>
              </h1>
              <p className="text-sm text-gray-400">RTP & Random Outcomes</p>
            </div>
          </div>
          <button
            onClick={() => setTurboMode(!turboMode)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
              turboMode ? 'bg-aero-500/20 text-aero-400 border-aero-500/30' : 'bg-white/5 text-gray-400 border-white/10',
            )}
            aria-label={`Turbo mode ${turboMode ? 'on' : 'off'}`}
            aria-pressed={turboMode}
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Turbo
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
            <div className="flex items-center justify-center gap-2 mb-6">
              {REEL_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => { setReelCount(n); setReels(Array(n).fill('⭐')); }}
                  disabled={spinning}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    reelCount === n ? 'bg-aero-500/20 text-aero-400 border border-aero-500/30' : 'bg-white/5 text-gray-400',
                    spinning && 'opacity-50 cursor-not-allowed',
                  )}
                  aria-pressed={reelCount === n}
                >
                  {n} Reels
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
              {reels.map((symbol, i) => (
                <motion.div
                  key={`${i}-${spinning ? Math.random() : symbol}`}
                  animate={spinning ? { rotateX: [0, 360] } : {}}
                  transition={spinning ? { duration: 0.3, repeat: Infinity } : { duration: 0.3 }}
                  className={cn(
                    'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border-2',
                    spinning ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/10',
                    result?.win && !spinning && 'border-green-400/50 bg-green-500/10',
                  )}
                  role="img"
                  aria-label={spinning ? 'Spinning' : `Symbol ${symbol}`}
                >
                  {symbol}
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {winAnim && result?.win && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="text-center py-4"
                >
                  <motion.p
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-3xl sm:text-4xl font-black text-green-400"
                  >
                    YOU WIN! {result.matched} {result.multiplier}x
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {!spinning && result && !result.win && (
              <p className="text-center text-gray-400 text-sm">No match this spin.</p>
            )}

            <div className="mt-4">
              <button
                onClick={() => setShowPayTable(!showPayTable)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                aria-expanded={showPayTable}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Pay Table {showPayTable ? '▲' : '▼'}
              </button>
              <AnimatePresence>
                {showPayTable && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                      {SYMBOLS.map((sym) => (
                        <div key={sym} className="glass rounded-lg p-2 flex items-center gap-2 text-sm">
                          <span className="text-lg">{sym}</span>
                          <span className="text-gray-300">{SYMBOL_MULTIPLIERS[sym]}x</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <TrendingUp className="h-5 w-5 text-aero-400 mx-auto mb-1" aria-hidden="true" />
              <p className="text-xs text-gray-500">Total Spins</p>
              <p className="text-xl font-bold tabular-nums">{totalSpins}</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <BarChart3 className="h-5 w-5 text-green-400 mx-auto mb-1" aria-hidden="true" />
              <p className="text-xs text-gray-500">Win Rate</p>
              <p className="text-xl font-bold tabular-nums text-green-400">
                {totalSpins > 0 ? ((wins / totalSpins) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <RefreshCw className="h-5 w-5 text-yellow-400 mx-auto mb-1" aria-hidden="true" />
              <p className="text-xs text-gray-500">Total Payout</p>
              <p className="text-xl font-bold tabular-nums text-yellow-400">{formatCurrency(totalPayout)}</p>
            </div>
          </div>

          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4"
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                <Stars className="h-4 w-4 text-pink-400" aria-hidden="true" />
                Recent Spins
              </h3>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                {history.map((h, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs',
                      h.won ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-400',
                    )}
                  >
                    {h.reels.join(' ')}
                    {h.won && <span className="font-bold">+{formatCurrency(h.payout)}</span>}
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
            onPlaceBet={handlePlaceBet}
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
              RTP Explained
            </h3>
            <div className="text-xs text-gray-400 space-y-2">
              <p>{getRTPExplanation()}</p>
              <p>
                <strong>House Edge:</strong> The payouts are calibrated to give the house a statistical
                advantage. Over many spins, the house will always win in the long run.
              </p>
              <p>
                <strong>Each spin is independent.</strong> Past results do not influence future outcomes.
                The slot has no memory.
              </p>
              <p className="text-yellow-300/70">
                Symbols: 🪐(10x) 🚀(7x) ⭐(5x) 💫(4x) 🌙(3x) 🎯(2x) 🔮(1.5x)
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
