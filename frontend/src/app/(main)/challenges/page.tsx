'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { get, post } from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tabs } from '@/components/ui/Tabs';
import {
  Swords, Gift, Clock, CheckCircle2, Zap,
  Sparkles, RotateCcw, Trophy,
} from 'lucide-react';
import type { ChallengeProgress } from '@/types';

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

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completedAnimation, setCompletedAnimation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const data = await get<ChallengeProgress[]>('/challenges/active');
        setChallenges(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load challenges');
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  const handleClaim = async (progressId: string) => {
    setClaimingId(progressId);
    try {
      await post(`/challenges/${progressId}/claim`);
      setCompletedAnimation(progressId);
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === progressId ? { ...c, isCompleted: true } : c,
        ),
      );
      setTimeout(() => setCompletedAnimation(null), 2000);
    } catch {
      // handled by toast
    } finally {
      setClaimingId(null);
    }
  };

  const dailyChallenges = challenges.filter((c) => c.challenge.type === 'daily');
  const weeklyChallenges = challenges.filter((c) => c.challenge.type === 'weekly');

  if (isLoading) {
    return <ChallengesSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
        <ErrorState title="Failed to load challenges" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const hasAny = dailyChallenges.length > 0 || weeklyChallenges.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-4xl space-y-8"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-gray-100">Daily Challenges</h1>
          <p className="mt-1 text-gray-400">Complete challenges to earn bonus practice points</p>
        </motion.div>

        <Tabs
          tabs={[
            {
              id: 'daily',
              label: `Daily (${dailyChallenges.length})`,
              content: (
                <ChallengeList
                  challenges={dailyChallenges}
                  onClaim={handleClaim}
                  claimingId={claimingId}
                  completedAnimation={completedAnimation}
                />
              ),
            },
            {
              id: 'weekly',
              label: `Weekly (${weeklyChallenges.length})`,
              content: (
                <ChallengeList
                  challenges={weeklyChallenges}
                  onClaim={handleClaim}
                  claimingId={claimingId}
                  completedAnimation={completedAnimation}
                />
              ),
            },
          ]}
          defaultTab="daily"
          onChange={setActiveTab}
        />

        {!hasAny && (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={Swords}
              title="No challenges available"
              description="Check back later for new challenges"
            />
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="rounded-xl bg-aero-500/5 border border-aero-500/20 p-6 text-center">
          <p className="text-xs text-gray-500">Practice points have no monetary value. Challenges reset daily/weekly.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ChallengeList({
  challenges,
  onClaim,
  claimingId,
  completedAnimation,
}: {
  challenges: ChallengeProgress[];
  onClaim: (id: string) => void;
  claimingId: string | null;
  completedAnimation: string | null;
}) {
  if (challenges.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No challenges in this period"
        description="New challenges will appear here"
      />
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {challenges.map((cp) => {
          const progressPct = Math.min((cp.progress / cp.target) * 100, 100);
          const canClaim = cp.isCompleted || progressPct >= 100;
          const isAnimating = completedAnimation === cp.id;

          return (
            <motion.div
              key={cp.id}
              variants={itemVariants}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card
                className={cn(
                  'relative overflow-hidden',
                  canClaim && 'border-accent-500/30',
                  isAnimating && 'ring-2 ring-accent-500/50',
                )}
              >
                {isAnimating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-2 right-2"
                  >
                    <Sparkles className="h-6 w-6 text-accent-400" />
                  </motion.div>
                )}

                <div className="flex items-start gap-4">
                  <div className={cn(
                    'rounded-xl p-3 shrink-0',
                    canClaim ? 'bg-accent-500/10' : 'bg-white/5',
                  )}>
                    <Swords className={cn('h-6 w-6', canClaim ? 'text-accent-400' : 'text-gray-500')} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-100">
                          {cp.challenge.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {cp.challenge.description}
                        </p>
                      </div>
                      <Badge variant="warning" className="shrink-0">
                        <Gift className="h-3.5 w-3.5 mr-1" />
                        +{formatCurrency(cp.challenge.rewardPoints)}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <ProgressBar
                        value={cp.progress}
                        max={cp.target}
                        showPercentage
                        variant={canClaim ? 'success' : 'default'}
                        label={`${cp.progress} / ${cp.target}`}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {cp.challenge.endsAt ? (
                          <>Ends {formatDate(cp.challenge.endsAt)}</>
                        ) : (
                          <>No deadline</>
                        )}
                      </div>
                      {canClaim && !cp.isCompleted && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => onClaim(cp.id)}
                          loading={claimingId === cp.id}
                          iconLeft={<CheckCircle2 className="h-4 w-4" />}
                        >
                          Claim Reward
                        </Button>
                      )}
                      {cp.isCompleted && (
                        <Badge variant="success" dot>Completed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ChallengesSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-1 border-b border-white/10 pb-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
