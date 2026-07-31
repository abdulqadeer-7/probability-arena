import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveChallenges() {
    const now = new Date();
    return this.prisma.challenge.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: 'asc' },
    });
  }

  async getMyProgress(userId: string) {
    const challenges = await this.getActiveChallenges();
    const challengeIds = challenges.map((c) => c.id);

    const progress = await this.prisma.challengeProgress.findMany({
      where: { userId, challengeId: { in: challengeIds } },
    });

    const progressMap = new Map(progress.map((p) => [p.challengeId, p]));

    return challenges.map((challenge) => {
      const p = progressMap.get(challenge.id);
      const reqs = challenge.requirements as Record<string, any>;
      let currentProgress = 0;
      let target = 1;

      if (reqs?.target) {
        target = Number(reqs.target);
      }

      if (p) {
        const prog = p.progress as Record<string, any>;
        currentProgress = Number(prog?.current ?? 0);
      }

      const percentage = Math.min(100, Math.round((currentProgress / target) * 100));

      return {
        ...challenge,
        rewardPoints: Number(challenge.rewardPoints),
        progress: {
          current: currentProgress,
          target,
          percentage,
          isCompleted: p?.isCompleted ?? false,
          completedAt: p?.completedAt ?? null,
        },
      };
    });
  }

  async updateProgress(userId: string, challengeSlug: string, progress: number) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { slug: challengeSlug },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const existing = await this.prisma.challengeProgress.upsert({
      where: {
        userId_challengeId: { userId, challengeId: challenge.id },
      },
      update: {
        progress: { current: progress },
      },
      create: {
        userId,
        challengeId: challenge.id,
        progress: { current: progress },
      },
    });

    const reqs = challenge.requirements as Record<string, any>;
    const target = Number(reqs?.target ?? 1);

    if (progress >= target && !existing.isCompleted) {
      await this.prisma.challengeProgress.update({
        where: { id: existing.id },
        data: { isCompleted: true, completedAt: new Date() },
      });
    }

    return existing;
  }

  async claimReward(userId: string, challengeId: string) {
    const progress = await this.prisma.challengeProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
      include: { challenge: true },
    });

    if (!progress) {
      throw new NotFoundException('Challenge progress not found');
    }

    if (!progress.isCompleted) {
      throw new BadRequestException('Challenge not yet completed');
    }

    if (progress.completedAt && progress.challenge.rewardPoints > 0) {
      const wallet = await this.prisma.practiceWallet.findUnique({ where: { userId } });
      if (wallet) {
        await this.prisma.practiceWallet.update({
          where: { userId },
          data: {
            balance: { increment: Number(progress.challenge.rewardPoints) },
            totalEarned: { increment: Number(progress.challenge.rewardPoints) },
          },
        });
      }
    }

    return { message: 'Reward claimed successfully', points: Number(progress.challenge.rewardPoints) };
  }
}
