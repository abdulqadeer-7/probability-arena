'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuthStore } from '@/store/auth-store';
import { get } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Gamepad2, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

interface AnalyticsData {
  registrationsOverTime: { date: string; count: number }[];
  gamesPlayedOverTime: { date: string; count: number }[];
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalGamesPlayed: number;
    totalPracticePointsEarned: number;
    dailyActiveUsers: number;
    averageGamesPerUser: number;
  };
}

const dateRanges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="p-5">
        <div className="mb-3 inline-flex rounded-xl bg-aero-500/10 p-3">
          <Icon className="h-5 w-5 text-aero-400" />
        </div>
        <p className="text-2xl font-bold text-gray-100">{value}</p>
        <p className="mt-1 text-sm text-gray-400">{label}</p>
      </Card>
    </motion.div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  const fetchAnalytics = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await get<AnalyticsData>('/admin/analytics', { days });
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [days, user]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-9 w-48" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4">
        <Card className="max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <CardHeader>
            <CardTitle>Failed to load analytics</CardTitle>
            <CardDescription>{error || 'Unable to load analytics data'}</CardDescription>
          </CardHeader>
          <Button onClick={fetchAnalytics}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">Analytics</h1>
            <p className="mt-1 text-sm text-gray-400">Platform metrics and trends</p>
          </div>
          <div className="flex gap-2">
            {dateRanges.map((range) => (
              <Button
                key={range.value}
                variant={days === range.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setDays(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Total Users"
            value={data.metrics.totalUsers.toLocaleString()}
          />
          <MetricCard
            icon={TrendingUp}
            label="Daily Active Users"
            value={data.metrics.dailyActiveUsers.toLocaleString()}
          />
          <MetricCard
            icon={Gamepad2}
            label="Total Games Played"
            value={data.metrics.totalGamesPlayed.toLocaleString()}
          />
          <MetricCard
            icon={DollarSign}
            label="Practice Points Earned"
            value={data.metrics.totalPracticePointsEarned.toLocaleString()}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Registrations Line Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Registrations Over Time</CardTitle>
                <CardDescription>New user sign-ups per day</CardDescription>
              </CardHeader>
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.registrationsOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#f3f4f6',
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ fill: '#06b6d4', r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Registrations"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Games Played Bar Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Games Played Over Time</CardTitle>
                <CardDescription>Total game rounds played per day</CardDescription>
              </CardHeader>
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.gamesPlayedOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#f3f4f6',
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Games Played" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Additional Metrics */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Additional Metrics</CardTitle>
              <CardDescription>More insights about platform usage</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-800/50 p-4">
                <p className="text-sm text-gray-400">Active Users</p>
                <p className="mt-1 text-xl font-bold text-gray-100">
                  {data.metrics.activeUsers.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">Users active in selected period</p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-4">
                <p className="text-sm text-gray-400">Avg Games Per User</p>
                <p className="mt-1 text-xl font-bold text-gray-100">
                  {data.metrics.averageGamesPerUser.toFixed(1)}
                </p>
                <p className="mt-1 text-xs text-gray-500">Average per user in selected period</p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-4">
                <p className="text-sm text-gray-400">Practice Points Earned</p>
                <p className="mt-1 text-xl font-bold text-gray-100">
                  {data.metrics.totalPracticePointsEarned.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">Total points earned in selected period</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
