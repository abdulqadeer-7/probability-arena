'use client';

import { useState, useCallback, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw, Zap, Play } from 'lucide-react';
import { useGameStore } from '@/store/game-store';
import { cn, formatCurrency } from '@/lib/utils';

const QUICK_AMOUNTS = [10, 50, 100, 500];
const AUTO_BET_ROUNDS = [5, 10, 25, 50];

interface BetControlsProps {
  minBet?: number;
  maxBet?: number;
  onPlaceBet: (amount: number, autoBet?: boolean, autoBetRounds?: number) => void;
  disabled?: boolean;
  isPlaying?: boolean;
}

export function BetControls({
  minBet = 1,
  maxBet = 10000,
  onPlaceBet,
  disabled = false,
  isPlaying = false,
}: BetControlsProps) {
  const wallet = useGameStore((s) => s.wallet);
  const [betAmount, setBetAmount] = useState(10);
  const [autoBet, setAutoBet] = useState(false);
  const [autoBetRounds, setAutoBetRounds] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const balance = wallet?.balance ?? 0;

  const validate = useCallback(
    (amount: number): string | null => {
      if (amount < minBet) return `Minimum bet is ${formatCurrency(minBet)}`;
      if (amount > maxBet) return `Maximum bet is ${formatCurrency(maxBet)}`;
      if (amount > balance) return `Insufficient balance. You have ${formatCurrency(balance)}`;
      return null;
    },
    [minBet, maxBet, balance],
  );

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    const num = val ? parseInt(val, 10) : 0;
    setBetAmount(num);
    setError(validate(num));
  };

  const adjustBet = (delta: number) => {
    const newAmount = Math.max(minBet, Math.min(maxBet, betAmount + delta));
    setBetAmount(newAmount);
    setError(validate(newAmount));
  };

  const setQuickAmount = (amount: number) => {
    setBetAmount(amount);
    setError(validate(amount));
  };

  const handlePlaceBet = () => {
    const err = validate(betAmount);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onPlaceBet(betAmount, autoBet, autoBetRounds);
  };

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <label htmlFor="bet-amount" className="text-sm font-medium text-gray-300">
          Bet Amount
        </label>
        <span className="text-sm text-gray-400 tabular-nums">
          Balance: <span className="text-accent-400 font-medium">{formatCurrency(balance)}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => adjustBet(-5)}
          disabled={disabled || betAmount <= minBet}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
          aria-label="Decrease bet by 5"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="relative flex-1">
          <input
            id="bet-amount"
            type="text"
            inputMode="numeric"
            value={betAmount || ''}
            onChange={handleAmountChange}
            disabled={disabled}
            className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-center text-lg font-bold tabular-nums text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aero-500 disabled:opacity-50"
            placeholder="0"
            aria-describedby={error ? 'bet-error' : undefined}
            aria-invalid={!!error}
          />
        </div>

        <button
          onClick={() => adjustBet(5)}
          disabled={disabled || betAmount >= maxBet}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
          aria-label="Increase bet by 5"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id="bet-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => setQuickAmount(amount)}
            disabled={disabled}
            className={cn(
              'flex-1 min-w-[60px] px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              betAmount === amount
                ? 'bg-aero-500/20 text-aero-400 border border-aero-500/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5',
              disabled && 'opacity-50',
            )}
            aria-label={`Set bet to ${formatCurrency(amount)}`}
          >
            {formatCurrency(amount)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        <label className="flex items-center gap-2 cursor-pointer" aria-label="Enable auto-bet mode">
          <input
            type="checkbox"
            checked={autoBet}
            onChange={() => setAutoBet(!autoBet)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className={cn(
            'h-5 w-9 rounded-full transition-colors duration-200',
            autoBet ? 'bg-aero-500' : 'bg-white/10',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-aero-500',
          )}>
            <div className={cn(
              'h-4 w-4 mt-0.5 ml-0.5 rounded-full bg-white shadow transition-transform duration-200',
              autoBet && 'translate-x-4',
            )} />
          </div>
          <span className="text-sm text-gray-300 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Auto-Bet
          </span>
        </label>

        <AnimatePresence>
          {autoBet && (
            <motion.select
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              value={autoBetRounds}
              onChange={(e) => setAutoBetRounds(Number(e.target.value))}
              disabled={disabled}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-aero-500"
              aria-label="Auto-bet rounds"
            >
              {AUTO_BET_ROUNDS.map((r) => (
                <option key={r} value={r}>{r} rounds</option>
              ))}
            </motion.select>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={handlePlaceBet}
        disabled={disabled || !!error || balance < betAmount}
        className={cn(
          'w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all',
          isPlaying
            ? 'bg-red-500/20 text-red-400'
            : 'bg-gradient-to-r from-aero-500 to-accent-500 text-white shadow-lg shadow-aero-500/20',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
        aria-label={isPlaying ? 'Round in progress' : 'Place bet'}
      >
        {isPlaying ? (
          <>
            <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
            In Progress
          </>
        ) : (
          <>
            <Play className="h-4 w-4" aria-hidden="true" />
            {autoBet ? `Start Auto-Bet (${autoBetRounds} rounds)` : 'Place Bet'}
          </>
        )}
      </motion.button>
    </div>
  );
}
