'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { get } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BookOpen, Filter, GraduationCap, Brain, Lightbulb, Users, Clock, ChevronRight } from 'lucide-react';
import type { EducationalLesson, UserAchievement } from '@/types';

const categoryMeta = {
  probability: { icon: Brain, label: 'Basics', color: 'text-aero-400', bg: 'bg-aero-500/10' },
  strategy: { icon: Lightbulb, label: 'Strategy', color: 'text-accent-400', bg: 'bg-accent-500/10' },
  game_rules: { icon: BookOpen, label: 'Theory', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  bankroll: { icon: Users, label: 'Psychology', color: 'text-green-400', bg: 'bg-green-500/10' },
};

const difficultyConfig = {
  beginner: { label: 'Beginner', variant: 'success' as const },
  intermediate: { label: 'Intermediate', variant: 'warning' as const },
  advanced: { label: 'Advanced', variant: 'danger' as const },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function LearnPage() {
  const [lessons, setLessons] = useState<EducationalLesson[]>([]);
  const [progress, setProgress] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonsData, progressData] = await Promise.all([
          get<EducationalLesson[]>('/learn/lessons', { isPublished: true }),
          get<UserAchievement[]>('/achievements'),
        ]);
        setLessons(lessonsData);
        setProgress(progressData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(lessons.map((l) => l.category));
    return Array.from(cats);
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    if (!activeCategory) return lessons;
    return lessons.filter((l) => l.category === activeCategory);
  }, [lessons, activeCategory]);

  const getLessonProgress = (lessonId: string) => {
    const prog = progress.find((p) => p.achievementId === lessonId);
    return prog ? { progress: prog.progress, completed: prog.isCompleted } : null;
  };

  if (isLoading) {
    return <LearnSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <ErrorState title="Failed to load lessons" description={error} onRetry={() => window.location.reload()} />
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
          <h1 className="text-3xl font-bold text-gray-100">Probability Learning Centre</h1>
          <p className="mt-2 text-gray-400">Master probability through interactive lessons and quizzes</p>
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
            const meta = categoryMeta[cat as keyof typeof categoryMeta] || categoryMeta.probability;
            return (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
              >
                {meta.label}
              </Button>
            );
          })}
        </motion.div>

        {filteredLessons.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={GraduationCap}
              title="No lessons found"
              description={activeCategory ? 'No lessons in this category yet' : 'Lessons are being prepared'}
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLessons.map((lesson) => {
              const meta = categoryMeta[lesson.category as keyof typeof categoryMeta] || categoryMeta.probability;
              const diff = difficultyConfig[lesson.difficulty] || difficultyConfig.beginner;
              const Icon = meta.icon;
              const lessonProg = getLessonProgress(lesson.id);

              return (
                <motion.div key={lesson.id} variants={itemVariants} layout>
                  <Link href={`/learn/${lesson.slug}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aero-500 rounded-xl">
                    <Card variant="interactive" className="h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('rounded-xl p-3', meta.bg)}>
                          <Icon className={cn('h-6 w-6', meta.color)} />
                        </div>
                        <Badge variant={diff.variant} size="sm">{diff.label}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-100 mb-1">{lesson.title}</h3>
                      <p className="text-sm text-gray-400 mb-4 flex-1 line-clamp-2">{lesson.description}</p>
                      <div className="space-y-3 mt-auto">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {lesson.estimatedMinutes} min
                          </span>
                          <Badge variant="info" size="sm">{meta.label}</Badge>
                        </div>
                        {lessonProg && (
                          <ProgressBar
                            value={lessonProg.progress}
                            max={100}
                            variant={lessonProg.completed ? 'success' : 'default'}
                            showPercentage
                          />
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-gray-500">
                            {lessonProg?.completed ? 'Completed' : lessonProg ? 'In progress' : 'Not started'}
                          </span>
                          <ChevronRight className="h-4 w-4 text-aero-400" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Practice points have no monetary value. Learn at your own pace.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function LearnSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-16 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
