import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.achievement.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findMyAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async checkAndUnlock(userId: string) {
    const [achievements, unlocked] = await Promise.all([
      this.prisma.achievement.findMany(),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
    ]);

    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
    const stats = await this.getUserStats(userId);
    const newlyUnlocked: string[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const criteria = achievement.criteria as Record<string, any>;
      let met = false;

      switch (criteria.type) {
        case 'first_game':
          met = stats.totalGames >= 1;
          break;
        case 'total_games':
          met = stats.totalGames >= (criteria.threshold ?? 0);
          break;
        case 'total_wins':
          met = stats.totalWins >= (criteria.threshold ?? 0);
          break;
        case 'win_streak':
          met = stats.bestStreak >= (criteria.threshold ?? 0);
          break;
        case 'high_multiplier':
          met = stats.highestMultiplier >= (criteria.threshold ?? 0);
          break;
        case 'total_earnings':
          met = stats.totalEarnings >= (criteria.threshold ?? 0);
          break;
      }

      if (met) {
        await this.prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });

        await this.prisma.notification.create({
          data: {
            userId,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `You unlocked: ${achievement.name}`,
            link: '/achievements',
          },
        });

        newlyUnlocked.push(achievement.id);
      }
    }

    return newlyUnlocked;
  }

  async getProgress(userId: string) {
    const [achievements, unlocked, stats] = await Promise.all([
      this.prisma.achievement.findMany({ orderBy: { createdAt: 'asc' } }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true, unlockedAt: true },
      }),
      this.getUserStats(userId),
    ]);

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

    return achievements.map((a) => {
      const criteria = a.criteria as Record<string, any>;
      const isUnlocked = unlockedMap.has(a.id);
      let progress = 0;

      if (isUnlocked) {
        progress = 100;
      } else {
        switch (criteria.type) {
          case 'first_game':
            progress = stats.totalGames >= 1 ? 100 : 0;
            break;
          case 'total_games': {
            const threshold = criteria.threshold ?? 1;
            progress = Math.min(100, Math.round((stats.totalGames / threshold) * 100));
            break;
          }
          case 'total_wins': {
            const threshold = criteria.threshold ?? 1;
            progress = Math.min(100, Math.round((stats.totalWins / threshold) * 100));
            break;
          }
          case 'win_streak': {
            const threshold = criteria.threshold ?? 1;
            progress = Math.min(100, Math.round((stats.bestStreak / threshold) * 100));
            break;
          }
          case 'high_multiplier': {
            const threshold = criteria.threshold ?? 1;
            progress = Math.min(100, Math.round((stats.highestMultiplier / threshold) * 100));
            break;
          }
          case 'total_earnings': {
            const threshold = criteria.threshold ?? 1;
            progress = Math.min(100, Math.round((stats.totalEarnings / threshold) * 100));
            break;
          }
        }
      }

      return {
        ...a,
        rewardPoints: Number(a.rewardPoints),
        isUnlocked,
        unlockedAt: isUnlocked ? unlockedMap.get(a.id) : null,
        progress,
      };
    });
  }

  private async getUserStats(userId: string) {
    const rounds = await this.prisma.gameRound.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'asc' },
    });

    let totalGames = rounds.length;
    let totalWins = 0;
    let totalEarnings = 0;
    let highestMultiplier = 0;
    let bestStreak = 0;
    let currentStreak = 0;

    for (const round of rounds) {
      const multiplier = Number(round.multiplier ?? 0);
      const payout = Number(round.payout ?? 0);

      if (multiplier > highestMultiplier) {
        highestMultiplier = multiplier;
      }

      if (payout > 0) {
        totalWins++;
        currentStreak++;
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
        }
        totalEarnings += payout - Number(round.betAmount);
      } else {
        currentStreak = 0;
      }
    }

    return { totalGames, totalWins, totalEarnings, highestMultiplier, bestStreak };
  }
}
