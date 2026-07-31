'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { get } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Users,
  UserCheck,
  Gamepad2,
  Coins,
  Activity,
  Server,
  Settings,
  BarChart3,
  LifeBuoy,
  AlertTriangle,
} from 'lucide-react';
import type { User } from '@/types';

interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  totalPracticePoints: number;
  recentRegistrations: User[];
  serverHealth: {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    activeConnections: number;
    responseTime: number;
  };
}

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

function OverviewCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="rounded-xl bg-aero-500/10 p-3">
            <Icon className="h-5 w-5 text-aero-400" />
          </div>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
        </div>
        <p className="mt-4 text-2xl font-bold text-gray-100">{value}</p>
        <p className="mt-1 text-sm text-gray-400">{label}</p>
      </Card>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const overview = await get<AdminOverview>('/admin/overview');
        setData(overview);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.role !== 'admin') {
    router.push('/dashboard');
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-2xl" />
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
            <CardTitle>Failed to load</CardTitle>
            <CardDescription>{error || 'Unable to load admin dashboard'}</CardDescription>
          </CardHeader>
          <Button onClick={() => window.location.reload()}>Retry</Button>
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
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">Overview of the platform</p>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewCard icon={Users} label="Total Users" value={data.totalUsers} />
          <OverviewCard icon={UserCheck} label="Active Users" value={data.activeUsers} />
          <OverviewCard icon={Gamepad2} label="Total Games" value={data.totalGames} />
          <OverviewCard
            icon={Coins}
            label="Total Practice Points"
            value={data.totalPracticePoints.toLocaleString()}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Registrations */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-aero-400" />
                  Recent Registrations
                </CardTitle>
                <CardDescription>Latest users to join the platform</CardDescription>
              </CardHeader>
              <div className="space-y-2">
                {data.recentRegistrations.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">No recent registrations</p>
                ) : (
                  data.recentRegistrations.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aero-500/20 text-xs font-medium text-aero-400">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{u.displayName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={u.isVerified ? 'success' : 'warning'}
                        >
                          {u.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          {/* Server Health */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-aero-400" />
                  Server Health
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <span className="text-sm text-gray-400">Status</span>
                  <Badge
                    variant={
                      data.serverHealth.status === 'healthy'
                        ? 'success'
                        : data.serverHealth.status === 'degraded'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {data.serverHealth.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <span className="text-sm text-gray-400">Uptime</span>
                  <span className="text-sm font-medium text-gray-200">
                    {Math.floor(data.serverHealth.uptime / 86400)}d{' '}
                    {Math.floor((data.serverHealth.uptime % 86400) / 3600)}h
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <span className="text-sm text-gray-400">Active Connections</span>
                  <span className="text-sm font-medium text-gray-200">
                    {data.serverHealth.activeConnections}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <span className="text-sm text-gray-400">Response Time</span>
                  <span className="text-sm font-medium text-gray-200">
                    {data.serverHealth.responseTime}ms
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-aero-400" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <div className="space-y-2">
                <Link href="/admin/users">
                  <Button variant="secondary" className="w-full justify-start">
                    <Users className="h-4 w-4" />
                    User Management
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="secondary" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/admin/games">
                  <Button variant="secondary" className="w-full justify-start">
                    <Gamepad2 className="h-4 w-4" />
                    Game Management
                  </Button>
                </Link>
                <Link href="/admin/support">
                  <Button variant="secondary" className="w-full justify-start">
                    <LifeBuoy className="h-4 w-4" />
                    Support Tickets
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
