import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardPeriod } from '@prisma/client';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(
    gameId?: string,
    period?: LeaderboardPeriod,
    limit = 50,
    offset = 0,
  ) {
    const where: any = {};

    if (gameId) where.gameId = gameId;
    if (period) where.period = period;

    const [entries, total] = await Promise.all([
      this.prisma.leaderboardEntry.findMany({
        where,
        orderBy: { score: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.leaderboardEntry.count({ where }),
    ]);

    const items = entries.map((entry, index) => ({
      rank: offset + index + 1,
      ...entry,
      score: Number(entry.score),
    }));

    const totalPages = Math.ceil(total / limit);

    return { items, total, page: Math.floor(offset / limit) + 1, limit, totalPages };
  }

  async updateScore(userId: string, gameId: string, score: number, period: LeaderboardPeriod) {
    const existing = await this.prisma.leaderboardEntry.findFirst({
      where: { userId, gameId, period },
    });

    if (existing) {
      const newScore = Math.max(Number(existing.score), score);
      return this.prisma.leaderboardEntry.update({
        where: { id: existing.id },
        data: { score: newScore, achievedAt: new Date() },
      });
    }

    return this.prisma.leaderboardEntry.create({
      data: { userId, gameId, score, period },
    });
  }

  async getMyRank(userId: string, gameId?: string, period?: LeaderboardPeriod) {
    const where: any = {};

    if (gameId) where.gameId = gameId;
    if (period) where.period = period;

    const entries = await this.prisma.leaderboardEntry.findMany({
      where,
      orderBy: { score: 'desc' },
      select: { id: true, userId: true, score: true },
    });

    const myEntries = entries.filter((e) => e.userId === userId);

    if (myEntries.length === 0) {
      return { rank: null, score: 0 };
    }

    const bestScore = Math.max(...myEntries.map((e) => Number(e.score)));
    const rank = entries.findIndex((e) => e.userId === userId && Number(e.score) === bestScore) + 1;

    return { rank, score: bestScore };
  }
}
