import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { UpdateGameConfigDto } from './dto/update-game-config.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ToggleFeatureFlagDto } from './dto/toggle-feature-flag.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    return Number(value);
  }

  async listUsers(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          isGuest: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              gameRounds: true,
              supportTickets: true,
              accountRestrictions: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
        practiceWallet: true,
        accountRestrictions: true,
        _count: {
          select: {
            gameRounds: true,
            supportTickets: true,
            sessions: true,
            notifications: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    if (user.practiceWallet) {
      user.practiceWallet.balance = this.toNumber(user.practiceWallet.balance) as any;
      user.practiceWallet.totalEarned = this.toNumber(user.practiceWallet.totalEarned) as any;
      user.practiceWallet.totalSpent = this.toNumber(user.practiceWallet.totalSpent) as any;
    }

    return user;
  }

  async suspendUser(adminId: string, userId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.accountRestriction.findFirst({
      where: { userId, type: 'SUSPENSION' as any },
    });

    if (existing) {
      throw new BadRequestException('User is already suspended');
    }

    await this.prisma.accountRestriction.create({
      data: { userId, type: 'SUSPENSION' as any, reason: 'Suspended by administrator' },
    });

    await this.logAction(adminId, 'SUSPEND_USER', 'User', userId, { action: 'suspended' }, ipAddress);

    return { message: 'User suspended successfully' };
  }

  async unsuspendUser(adminId: string, userId: string, ipAddress?: string) {
    const restriction = await this.prisma.accountRestriction.findFirst({
      where: { userId, type: 'SUSPENSION' as any },
    });

    if (!restriction) {
      throw new NotFoundException('User is not suspended');
    }

    await this.prisma.accountRestriction.delete({ where: { id: restriction.id } });

    await this.logAction(adminId, 'UNSUSPEND_USER', 'User', userId, { action: 'unsuspended' }, ipAddress);

    return { message: 'User unsuspended successfully' };
  }

  async softDeleteUser(adminId: string, userId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    await this.logAction(adminId, 'DELETE_USER', 'User', userId, { action: 'soft_deleted' }, ipAddress);

    return { message: 'User deleted successfully' };
  }

  async getAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, activeUserGroups, totalGamesPlayed] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.gameRound.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.gameRound.count(),
    ]);

    const [earnedResult, spentResult] = await Promise.all([
      this.prisma.practiceTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'CREDIT' as any },
      }),
      this.prisma.practiceTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'DEBIT' as any },
      }),
    ]);

    return {
      totalUsers,
      activeUsers: activeUserGroups.length,
      totalGamesPlayed,
      totalPointsEarned: this.toNumber(earnedResult._sum.amount),
      totalPointsSpent: this.toNumber(spentResult._sum.amount),
    };
  }

  async listGames() {
    const games = await this.prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rounds: true } },
      },
    });
    return { data: games };
  }

  async updateGameConfig(id: string, dto: UpdateGameConfigDto) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.prisma.game.update({
      where: { id },
      data: {
        ...(dto.config !== undefined && { config: dto.config }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async listSupportTickets(query: { page?: number; limit?: number; status?: string; priority?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateSupportTicket(id: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes }),
      },
    });
  }

  async listAnnouncements() {
    const announcements = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data: announcements };
  }

  async createAnnouncement(dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
      },
    });
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
      },
    });
  }

  async deleteAnnouncement(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted successfully' };
  }

  async listFeatureFlags() {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    return { data: flags };
  }

  async toggleFeatureFlag(id: string, dto: ToggleFeatureFlagDto) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    return this.prisma.featureFlag.update({
      where: { id },
      data: { enabled: dto.enabled },
    });
  }

  async listAuditLogs(query: { page?: number; limit?: number; entityType?: string; adminId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.adminId) where.adminId = query.adminId;

    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, email: true, displayName: true } },
        },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getHealth() {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    try {
      await this.redis.ping();
    } catch {
      redisStatus = 'unhealthy';
    }

    return {
      status: dbStatus === 'healthy' && redisStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: { database: dbStatus, redis: redisStatus },
    };
  }

  async logAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId?: string,
    changes?: Record<string, any>,
    ipAddress?: string,
  ) {
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId: entityId || '',
        changes: changes || {},
        ipAddress,
      },
    });
  }
}
