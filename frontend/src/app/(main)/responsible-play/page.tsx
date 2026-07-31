'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { get } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import {
  Heart, Clock, Shield, Plus, Minus, Lock,
  Timer, Gamepad2, BarChart3, ExternalLink,
  Coffee, AlertTriangle, Info,
} from 'lucide-react';

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

interface SessionStats {
  totalTimePlayed: number;
  totalGamesPlayed: number;
  averageSessionLength: number;
  currentSessionLength: number;
}

const cooldownOptions = [
  { value: 'none', label: 'No cooldown' },
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

const selfLockOptions = [
  { value: 'none', label: 'No lock' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const supportResources = [
  {
    name: 'BeGambleAware',
    description: 'Free, confidential help for anyone affected by gambling',
    url: 'https://www.begambleaware.org',
  },
  {
    name: 'GamCare',
    description: 'Free information, support and counselling for problem gamblers',
    url: 'https://www.gamcare.org.uk',
  },
  {
    name: 'National Council on Problem Gambling',
    description: '24/7 confidential helpline for problem gambling',
    url: 'https://www.ncpgambling.org',
  },
];

export default function ResponsiblePlayPage() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionTimer, setSessionTimer] = useState(60);
  const [sessionEnabled, setSessionEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(1000);
  const [dailyLimitEnabled, setDailyLimitEnabled] = useState(false);
  const [breakReminder, setBreakReminder] = useState(30);
  const [breakEnabled, setBreakEnabled] = useState(false);
  const [cooldown, setCooldown] = useState('none');
  const [selfLock, setSelfLock] = useState('none');
  const [selfLockConfirmed, setSelfLockConfirmed] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await get<SessionStats>('/profile/stats');
        setStats(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSelfLock = () => {
    if (selfLock !== 'none' && !selfLockConfirmed) {
      setSelfLockConfirmed(true);
    }
  };

  if (isLoading) {
    return <ResponsibleSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <ErrorState title="Failed to load" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-4xl space-y-8"
      >
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-400" />
            <h1 className="text-3xl font-bold text-gray-100">Responsible Play</h1>
          </div>
          <p className="text-gray-400">
            We are committed to providing a safe and responsible gaming environment
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center p-4">
            <Clock className="h-5 w-5 text-aero-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{stats ? formatTime(stats.totalTimePlayed) : '...'}</p>
            <p className="text-xs text-gray-400">Total Time</p>
          </Card>
          <Card className="text-center p-4">
            <Gamepad2 className="h-5 w-5 text-accent-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{stats?.totalGamesPlayed ?? '...'}</p>
            <p className="text-xs text-gray-400">Games Played</p>
          </Card>
          <Card className="text-center p-4">
            <BarChart3 className="h-5 w-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{stats ? formatTime(stats.averageSessionLength) : '...'}</p>
            <p className="text-xs text-gray-400">Avg Session</p>
          </Card>
          <Card className="text-center p-4">
            <Timer className="h-5 w-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{stats ? formatTime(stats.currentSessionLength) : '...'}</p>
            <p className="text-xs text-gray-400">Current Session</p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Safety Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-aero-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Session Timer</p>
                    <p className="text-xs text-gray-400">Get reminded after playing for a set time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <button
                      onClick={() => setSessionTimer(Math.max(15, sessionTimer - 15))}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      aria-label="Decrease session timer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-200 w-16 text-center">{sessionTimer} min</span>
                    <button
                      onClick={() => setSessionTimer(Math.min(480, sessionTimer + 15))}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      aria-label="Increase session timer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Toggle checked={sessionEnabled} onChange={(e) => setSessionEnabled(e.target.checked)} label="Enable session timer" srLabel />
                </div>
              </div>

              <div className="border-t border-white/10 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-accent-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Daily Practice Point Limit</p>
                    <p className="text-xs text-gray-400">Stop playing after reaching a daily limit</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value) || 0)}
                    className="w-20 text-sm"
                    min={100}
                    max={100000}
                    disabled={!dailyLimitEnabled}
                  />
                  <Toggle checked={dailyLimitEnabled} onChange={(e) => setDailyLimitEnabled(e.target.checked)} label="Enable daily limit" srLabel />
                </div>
              </div>

              <div className="border-t border-white/10 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coffee className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Break Reminder</p>
                    <p className="text-xs text-gray-400">Take regular breaks between sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <button
                      onClick={() => setBreakReminder(Math.max(5, breakReminder - 5))}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      aria-label="Decrease break reminder"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-200 w-16 text-center">{breakReminder} min</span>
                    <button
                      onClick={() => setBreakReminder(Math.min(120, breakReminder + 5))}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      aria-label="Increase break reminder"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Toggle checked={breakEnabled} onChange={(e) => setBreakEnabled(e.target.checked)} label="Enable break reminders" srLabel />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Account Cooldown</h2>
            <p className="text-sm text-gray-400 mb-4">
              Temporarily restrict your account for a set period
            </p>
            <Select value={cooldown} onChange={(e) => setCooldown(e.target.value)}>
              {cooldownOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            {cooldown !== 'none' && (
              <Button className="mt-3" variant="warning" fullWidth>
                Start Cooldown
              </Button>
            )}
          </Card>

          <Card className="border-red-500/20">
            <h2 className="text-lg font-semibold text-red-300 mb-4">Self-Lock</h2>
            <p className="text-sm text-gray-400 mb-4">
              Permanently lock yourself out for a chosen duration. This action is irreversible until the period ends.
            </p>
            <Select value={selfLock} onChange={(e) => setSelfLock(e.target.value)}>
              {selfLockOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            {selfLock !== 'none' && (
              <div className="mt-3 space-y-2">
                {!selfLockConfirmed ? (
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleSelfLock}
                    iconLeft={<Lock className="h-4 w-4" />}
                  >
                    Lock Account
                  </Button>
                ) : (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                    <p className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Are you sure? This will lock your account for the selected period.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="danger" size="sm" onClick={() => setSelfLockConfirmed(false)}>
                        Confirm Lock
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelfLock('none'); setSelfLockConfirmed(false); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Support Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {supportResources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-200 group-hover:text-aero-400 transition-colors">
                      {resource.name}
                    </h3>
                    <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-aero-400 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-400">{resource.description}</p>
                </a>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-accent-500/20 bg-accent-500/5">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400 space-y-2">
                <p>
                  AeroArcade is a real-money gaming platform. Set your deposit limits, take breaks when needed,
                  and never gamble more than you can afford to lose.
                </p>
                <p>
                  We provide various tools to help you stay in control, including deposit limits, session timers,
                  and self-exclusion. If you feel your gaming is becoming a problem, please use these features
                  or contact one of the support resources above.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Play responsibly. Must be 18+ to play.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ResponsibleSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
