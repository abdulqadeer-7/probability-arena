'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { get } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { usePreferencesStore } from '@/store/preferences-store';
import {
  Trophy, Medal, Crown, Eye, EyeOff, Gamepad2,
  TrendingUp, Users,
} from 'lucide-react';
import type { LeaderboardEntry, Game } from '@/types';

const periods = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'all', label: 'All Time' },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'all'>('daily');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hideLeaderboard, setHideLeaderboard] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const limit = 20;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [entriesData, gamesData] = await Promise.all([
          get<{ data: LeaderboardEntry[]; pagination: { totalPages: number } }>('/leaderboard', {
            period,
            gameId: gameFilter !== 'all' ? gameFilter : undefined,
            page,
            limit,
          }),
          get<Game[]>('/games', { isActive: true }),
        ]);
        setEntries(entriesData.data);
        setTotalPages(entriesData.pagination.totalPages);
        setGames(gamesData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [period, gameFilter, page]);

  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod);
    setPage(1);
  };

  const rankIcons: Record<number, typeof Crown> = {
    1: Crown,
    2: Medal,
    3: Medal,
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getRowStyle = (userId: string) => {
    if (userId === currentUserId) return 'bg-aero-500/10 border-aero-500/30';
    return 'bg-white/5 border-white/10';
  };

  if (hideLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl text-center py-20">
          <Card className="p-8">
            <EyeOff className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Leaderboard Hidden</h2>
            <p className="text-gray-400 mb-6">You have chosen to hide the leaderboard. You can show it again anytime.</p>
            <Button onClick={() => setHideLeaderboard(false)} iconLeft={<Eye className="h-4 w-4" />}>
              Show Leaderboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <ErrorState title="Failed to load leaderboard" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-5xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Leaderboard</h1>
            <p className="mt-1 text-sm text-gray-400">
              Based on non-redeemable practice scores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              checked={hideLeaderboard}
              onChange={(e) => setHideLeaderboard(e.target.checked)}
              label="Hide Leaderboard"
              srLabel
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aero-500 focus-visible:ring-inset',
                  period === p.id
                    ? 'bg-aero-500/20 text-aero-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
                )}
                aria-pressed={period === p.id}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Select
            value={gameFilter}
            onChange={(e) => { setGameFilter(e.target.value); setPage(1); }}
            aria-label="Filter by game"
            className="sm:w-48"
          >
            <option value="all">All Games</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </Select>
        </motion.div>

        {entries.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={Users}
              title="No entries yet"
              description="Be the first to make it to the leaderboard!"
            />
          </motion.div>
        ) : (
          <>
            <motion.div variants={itemVariants} className="space-y-2">
              {entries.map((entry) => {
                const RankIcon = rankIcons[entry.rank];
                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border p-4 transition-colors',
                      getRowStyle(entry.userId),
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 shrink-0">
                      {RankIcon ? (
                        <RankIcon className={cn('h-6 w-6', getRankStyle(entry.rank))} />
                      ) : (
                        <span className={cn('text-sm font-bold', getRankStyle(entry.rank))}>
                          {entry.rank}
                        </span>
                      )}
                    </div>
                    <Avatar
                      name={entry.displayName}
                      src={entry.avatarUrl}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100 truncate">
                        {entry.displayName}
                        {entry.userId === currentUserId && (
                          <Badge variant="info" size="sm" className="ml-2">You</Badge>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">@{entry.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-aero-400">
                        {formatCurrency(entry.score)} pts
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.gamesPlayed} games
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </motion.div>
          </>
        )}

        <motion.div variants={itemVariants} className="rounded-xl bg-accent-500/5 border border-accent-500/20 p-4 text-center">
          <p className="text-xs text-gray-500">
            Practice points have no monetary value. Leaderboard is based on non-redeemable practice scores only.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
