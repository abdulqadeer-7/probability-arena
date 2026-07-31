'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, History, TrendingUp, TrendingDown } from 'lucide-react';
import { useGameStore } from '@/store/game-store';
import { cn, formatCurrency, formatDate, randomId } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

interface RoundHistoryProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function RoundHistory({ loading, error, onRetry }: RoundHistoryProps) {
  const roundHistory = useGameStore((s) => s.roundHistory);

  if (error) {
    return (
      <ErrorState
        title="Failed to load history"
        description={error}
        onRetry={onRetry}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton variant="text" width="120px" height={20} />
        </div>
        {Array.from({ length: 5 }).map(() => (
          <Skeleton key={randomId()} variant="card" height={48} />
        ))}
      </div>
    );
  }

  if (roundHistory.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No rounds played yet"
        description="Place your first bet to see your round history here."
      />
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
        <History className="h-4 w-4 text-aero-400" aria-hidden="true" />
        Round History
        <span className="text-xs text-gray-500 font-normal">({roundHistory.length})</span>
      </h3>

      <div className="overflow-x-auto scrollbar-thin -mx-4 px-4">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left pb-2 pr-2 font-medium">Round</th>
              <th className="text-right pb-2 pr-2 font-medium">Bet</th>
              <th className="text-right pb-2 pr-2 font-medium">Multiplier</th>
              <th className="text-right pb-2 pr-2 font-medium">Payout</th>
              <th className="text-right pb-2 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {roundHistory.slice(0, 20).map((round) => (
                <motion.tr
                  key={round.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'border-t border-white/5',
                    round.result === 'win' ? 'bg-green-500/5' : '',
                    round.result === 'lose' ? 'bg-red-500/5' : '',
                  )}
                >
                  <td className="py-2 pr-2 text-gray-400 font-mono text-xs">
                    {round.id.slice(0, 8)}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums text-gray-200">
                    {formatCurrency(round.betAmount)}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5',
                        round.payoutMultiplier >= 2
                          ? 'text-green-400'
                          : round.payoutMultiplier > 1
                            ? 'text-yellow-400'
                            : 'text-gray-400',
                      )}
                    >
                      {round.payoutMultiplier > 1 ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {round.payoutMultiplier.toFixed(2)}x
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums font-medium">
                    <span
                      className={cn(
                        round.result === 'win'
                          ? 'text-green-400'
                          : round.result === 'lose'
                            ? 'text-red-400'
                            : 'text-gray-400',
                      )}
                    >
                      {round.result === 'win' ? '+' : ''}
                      {formatCurrency(round.payout)}
                    </span>
                  </td>
                  <td className="py-2 text-right text-gray-500 text-xs whitespace-nowrap">
                    <span className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatDate(round.createdAt)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
