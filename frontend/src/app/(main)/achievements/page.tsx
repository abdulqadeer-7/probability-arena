'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { get } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tabs } from '@/components/ui/Tabs';
import {
  Trophy, Lock, Sparkles, Filter, Award, Star,
  Gamepad2, BookOpen, Target, Zap, TrendingUp,
} from 'lucide-react';
import type { UserAchievement, Achievement } from '@/types';

const categoryIcons: Record<string, typeof Trophy> = {
  games: Gamepad2,
  learning: BookOpen,
  skill: Target,
  dedication: Zap,
  special: Star,
};

const categoryColors: Record<string, string> = {
  games: 'text-aero-400 bg-aero-500/10 border-aero-500/20',
  learning: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  skill: 'text-green-400 bg-green-500/10 border-green-500/20',
  dedication: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
  special: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

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

function getCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const data = await get<UserAchievement[]>('/achievements');
        setAchievements(data);
        const recent = data.filter((a) => {
          if (!a.isCompleted || !a.completedAt) return false;
          const completedDate = new Date(a.completedAt);
          const now = new Date();
          return (now.getTime() - completedDate.getTime()) < 3600000;
        });
        setNewlyUnlocked(recent.map((a) => a.achievementId));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load achievements');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(achievements.map((a) => a.achievement.category));
    return Array.from(cats);
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    if (!activeCategory) return achievements;
    return achievements.filter((a) => a.achievement.category === activeCategory);
  }, [achievements, activeCategory]);

  const stats = useMemo(() => {
    const total = achievements.length;
    const completed = achievements.filter((a) => a.isCompleted).length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [achievements]);

  if (isLoading) {
    return <AchievementsSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <ErrorState title="Failed to load achievements" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-8"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-gray-100">Achievements</h1>
          <p className="mt-1 text-gray-400">Track your progress and earn rewards</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-accent-500/10 p-3">
                <Trophy className="h-8 w-8 text-accent-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-100">
                  {stats.completed} / {stats.total}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-aero-400">{stats.percentage}%</p>
              </div>
            </div>
            <ProgressBar value={stats.percentage} className="mt-4" />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeCategory === null ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveCategory(null)}
            iconLeft={<Filter className="h-4 w-4" />}
          >
            All
          </Button>
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] || Trophy;
            return (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                iconLeft={<Icon className="h-4 w-4" />}
              >
                {getCategoryLabel(cat)}
              </Button>
            );
          })}
        </motion.div>

        {filteredAchievements.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={Award}
              title="No achievements found"
              description={activeCategory ? 'No achievements in this category' : 'Start playing to earn achievements'}
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {filteredAchievements.map((ua) => {
                const Icon = categoryIcons[ua.achievement.category] || Trophy;
                const isNew = newlyUnlocked.includes(ua.achievementId);
                const catColor = categoryColors[ua.achievement.category] || categoryColors.games;

                return (
                  <motion.div
                    key={ua.achievementId}
                    variants={itemVariants}
                    layout
                    initial={isNew ? { scale: 0.8, opacity: 0 } : false}
                    animate={
                      isNew
                        ? { scale: [0.8, 1.05, 1], opacity: 1 }
                        : { opacity: 1, y: 0 }
                    }
                    transition={
                      isNew
                        ? { duration: 0.6, ease: 'easeOut' }
                        : { duration: 0.4 }
                    }
                  >
                    <Card
                      className={cn(
                        'relative overflow-hidden',
                        !ua.isCompleted && 'opacity-60',
                      )}
                    >
                      {isNew && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <Sparkles className="h-5 w-5 text-yellow-400" />
                        </motion.div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-xl p-2.5', ua.isCompleted ? catColor.split(' ').slice(1).join(' ') : 'bg-white/5')}>
                          {ua.isCompleted ? (
                            <Icon className={cn('h-5 w-5', catColor.split(' ')[0])} />
                          ) : (
                            <Lock className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-100 truncate">
                            {ua.achievement.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {ua.achievement.description}
                          </p>
                        </div>
                      </div>

                      {ua.isCompleted ? (
                        <div className="mt-3 flex items-center justify-between">
                          <Badge variant="success" size="sm" dot>Completed</Badge>
                          {ua.completedAt && (
                            <span className="text-xs text-gray-500">{formatDate(ua.completedAt)}</span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 space-y-1.5">
                          <ProgressBar
                            value={ua.progress}
                            max={100}
                            showPercentage
                            variant="default"
                          />
                        </div>
                      )}

                      {ua.achievement.rewardPoints > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-accent-400">
                          <Star className="h-3 w-3" />
                          {ua.achievement.rewardPoints} pts
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Practice points have no monetary value. Achievements are for recognition only.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function AchievementsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-28 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-16 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
