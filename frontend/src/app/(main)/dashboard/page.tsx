'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { get } from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Wallet,
  Gamepad2,
  TrendingUp,
  Clock,
  Trophy,
  Swords,
  BarChart3,
  BookOpen,
  Users,
  Activity,
} from 'lucide-react';
import type { PracticeWallet, GameResult, UserAchievement, ChallengeProgress } from '@/types';

interface DashboardData {
  wallet: PracticeWallet;
  stats: {
    totalGames: number;
    winRate: number;
    totalTimePlayed: number;
  };
  recentGames: GameResult[];
  achievements: UserAchievement[];
  challenges: ChallengeProgress[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="flex items-center gap-4 p-4">
        <div className={cn('rounded-xl bg-aero-500/10 p-3', className)}>
          <Icon className="h-5 w-5 text-aero-400" />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-100">{value}</p>
        </div>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [wallet, stats, recentGames, achievements, challenges] = await Promise.all([
          get<PracticeWallet>('/wallet'),
          get<DashboardData['stats']>('/stats'),
          get<GameResult[]>('/games/recent', { limit: 10 }),
          get<UserAchievement[]>('/achievements', { limit: 3 }),
          get<ChallengeProgress[]>('/challenges/active'),
        ]);
        setData({ wallet, stats, recentGames, achievements, challenges });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return <DashboardError error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        {/* Welcome */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">
            Welcome back, {user?.displayName || 'Player'}
          </h1>
          <p className="mt-1 text-sm text-gray-400">Here&apos;s your gaming overview</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-aero-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-aero-500/10 via-transparent to-accent-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Practice Points</p>
                <p className="mt-1 text-4xl font-bold text-aero-400">
                  {formatCurrency(data.wallet.balance)}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Practice points have no monetary value
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/learn">
                  <Button variant="secondary" size="sm">
                    <BookOpen className="h-4 w-4" />
                    Learn
                  </Button>
                </Link>
                <Link href="/games">
                  <Button size="sm">
                    <Gamepad2 className="h-4 w-4" />
                    Play Games
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Gamepad2}
            label="Total Games"
            value={data.stats.totalGames}
          />
          <StatCard
            icon={TrendingUp}
            label="Win Rate"
            value={`${(data.stats.winRate * 100).toFixed(1)}%`}
          />
          <StatCard
            icon={Clock}
            label="Time Played"
            value={`${Math.round(data.stats.totalTimePlayed / 3600)}h`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-aero-400" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your last 10 game rounds</CardDescription>
              </CardHeader>
              <div className="space-y-2">
                {data.recentGames.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">No games played yet</p>
                ) : (
                  data.recentGames.map((game) => (
                    <div
                      key={game.roundId}
                      className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3 transition-colors hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            game.result === 'win'
                              ? 'bg-green-400'
                              : game.result === 'lose'
                              ? 'bg-red-400'
                              : 'bg-yellow-400'
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-200">{game.gameName}</p>
                          <p className="text-xs text-gray-400">{formatDate(game.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-200">
                          {formatCurrency(game.betAmount)} pts
                        </p>
                        <p
                          className={cn(
                            'text-xs font-medium',
                            game.result === 'win'
                              ? 'text-green-400'
                              : game.result === 'lose'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          )}
                        >
                          {game.result === 'win'
                            ? `+${formatCurrency(game.payout)}`
                            : game.result === 'lose'
                            ? '-0'
                            : 'Draw'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent-400" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {data.achievements.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">
                    No achievements yet. Start playing!
                  </p>
                ) : (
                  data.achievements.map((ua) => (
                    <div
                      key={ua.id}
                      className="flex items-center gap-3 rounded-lg bg-gray-800/50 p-3"
                    >
                      <Trophy className="h-8 w-8 shrink-0 text-accent-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-200">
                          {ua.achievement.name}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {ua.achievement.description}
                        </p>
                      </div>
                      {ua.isCompleted && (
                        <Badge variant="success">Done</Badge>
                      )}
                    </div>
                  ))
                )}
                <Link
                  href="/achievements"
                  className="block text-center text-xs text-aero-400 hover:text-aero-300 transition-colors"
                >
                  View all achievements
                </Link>
              </div>
            </Card>

            {/* Active Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-accent-400" />
                  Active Challenges
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {data.challenges.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">No active challenges</p>
                ) : (
                  data.challenges.map((cp) => (
                    <div
                      key={cp.id}
                      className="rounded-lg bg-gray-800/50 p-3"
                    >
                      <p className="text-sm font-medium text-gray-200">{cp.challenge.title}</p>
                      <p className="mt-1 text-xs text-gray-400">{cp.challenge.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Progress</span>
                          <span>{Math.round((cp.progress / cp.target) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-700">
                          <div
                            className="h-full rounded-full bg-aero-500 transition-all duration-500"
                            style={{ width: `${Math.min((cp.progress / cp.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <Link
                  href="/challenges"
                  className="block text-center text-xs text-aero-400 hover:text-aero-300 transition-colors"
                >
                  View all challenges
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions (Mobile) */}
        <motion.div variants={itemVariants} className="flex gap-3 sm:hidden">
          <Link href="/games" className="flex-1">
            <Button variant="primary" className="w-full">
              <Gamepad2 className="h-4 w-4" />
              Play Games
            </Button>
          </Link>
          <Link href="/learn" className="flex-1">
            <Button variant="secondary" className="w-full">
              <BookOpen className="h-4 w-4" />
              Learn
            </Button>
          </Link>
          <Link href="/leaderboard" className="flex-1">
            <Button variant="secondary" className="w-full">
              <BarChart3 className="h-4 w-4" />
              Leaderboard
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-5 w-40" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardError({ error: errorMsg }: { error: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4">
      <Card className="max-w-md p-8 text-center">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            {errorMsg || 'Failed to load your dashboard. Please try again.'}
          </CardDescription>
        </CardHeader>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try again
        </Button>
      </Card>
    </div>
  );
}
