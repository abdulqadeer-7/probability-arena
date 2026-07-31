'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Info } from 'lucide-react';
import { useGameStore } from '@/store/game-store';
import { cn } from '@/lib/utils';

export function BalanceDisplay() {
  const wallet = useGameStore((s) => s.wallet);
  const [displayBalance, setDisplayBalance] = useState(wallet?.balance ?? 0);
  const prevBalance = useRef(wallet?.balance ?? 0);

  useEffect(() => {
    if (wallet && wallet.balance !== prevBalance.current) {
      const diff = wallet.balance - prevBalance.current;
      const steps = Math.max(Math.abs(diff), 20);
      const increment = diff / steps;
      let current = prevBalance.current;
      const timer = setInterval(() => {
        current += increment;
        if (Math.abs(current - wallet.balance) < 1) {
          current = wallet.balance;
          clearInterval(timer);
        }
        setDisplayBalance(Math.round(current));
      }, 20);
      prevBalance.current = wallet.balance;
      return () => clearInterval(timer);
    }
  }, [wallet?.balance]);

  if (!wallet) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/20">
          <Coins className="h-5 w-5 text-accent-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400">Balance</p>
          <motion.p
            className="text-2xl font-bold tabular-nums"
            key={displayBalance}
          >
            {displayBalance.toLocaleString()}
          </motion.p>
        </div>
      </div>
      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-yellow-500/10 p-2">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-yellow-400" aria-hidden="true" />
        <p className={cn('text-xs leading-relaxed text-yellow-300/80')}>
          Play responsibly. Set your limits and never chase losses.
        </p>
      </div>
    </motion.div>
  );
}
