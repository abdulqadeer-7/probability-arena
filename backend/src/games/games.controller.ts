import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { GameEngineService, GameType } from './game-engine.service';
import { BetDto } from './dto/bet.dto';

@Controller('games')
export class GamesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameEngine: GameEngineService,
  ) {}

  @Get()
  async listActiveGames() {
    const games = await this.prisma.game.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        config: true,
        createdAt: true,
        _count: { select: { rounds: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return games.map((game) => ({
      ...game,
      config: this.gameEngine.getGameConfig(game.slug),
      totalRounds: game._count.rounds,
    }));
  }

  @Get(':slug')
  async getGameDetails(@Param('slug') slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        isActive: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }

    return {
      ...game,
      config: this.gameEngine.getGameConfig(slug),
    };
  }

  @Post(':slug/bet')
  @UseGuards(AuthGuard('jwt'))
  async placeBet(
    @Param('slug') slug: string,
    @Body() dto: BetDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    if (!userId) throw new BadRequestException('User not authenticated');
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }

    const config = this.gameEngine.getGameConfig(slug);
    if (dto.amount < config.minBet || dto.amount > config.maxBet) {
      throw new BadRequestException(
        `Bet amount must be between ${config.minBet} and ${config.maxBet}`,
      );
    }

    const serverSeed = this.gameEngine.generateServerSeed();
    const clientSeed = dto.clientSeed || this.gameEngine.generateClientSeed();
    const nonce = Date.now();

    const rawResult = this.gameEngine.computeResult(serverSeed, clientSeed, nonce);
    const multiplier = this.gameEngine.calculateMultiplier(rawResult, slug as GameType);
    const payout = dto.amount * multiplier;

    const round = await this.prisma.gameRound.create({
      data: {
        gameId: game.id,
        userId,
        betAmount: dto.amount,
        multiplier,
        payout,
        result: { rawResult, multiplier },
        seed: serverSeed,
        status: 'COMPLETED',
      },
    });

    await this.prisma.gameResult.create({
      data: {
        roundId: round.id,
        gameId: game.id,
        serverSeed,
        clientSeed,
        nonce,
        resultValue: rawResult.toString(),
        resultData: { rawResult, multiplier, payout },
      },
    });

    return {
      roundId: round.id,
      result: rawResult,
      multiplier,
      payout,
      serverSeed,
      clientSeed,
      nonce,
    };
  }

  @Get(':slug/history')
  async getRoundHistory(@Param('slug') slug: string, @Query('limit') limit?: string) {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) throw new NotFoundException('Game not found');

    const take = Math.min(parseInt(limit || '50', 10), 100);

    const rounds = await this.prisma.gameRound.findMany({
      where: { gameId: game.id },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        betAmount: true,
        multiplier: true,
        payout: true,
        result: true,
        status: true,
        createdAt: true,
        user: { select: { displayName: true, avatarUrl: true } },
      },
    });

    return rounds;
  }

  @Get(':slug/stats')
  async getGameStats(@Param('slug') slug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) throw new NotFoundException('Game not found');

    const [totalRounds, totalBets, totalPayouts, recentRounds] = await Promise.all([
      this.prisma.gameRound.count({ where: { gameId: game.id } }),
      this.prisma.gameRound.aggregate({
        where: { gameId: game.id },
        _sum: { betAmount: true },
      }),
      this.prisma.gameRound.aggregate({
        where: { gameId: game.id, status: 'COMPLETED' },
        _sum: { payout: true },
      }),
      this.prisma.gameRound.findMany({
        where: { gameId: game.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          betAmount: true,
          multiplier: true,
          payout: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalRounds,
      totalBets: totalBets._sum.betAmount || 0,
      totalPayouts: totalPayouts._sum.payout || 0,
      rtp:
        Number(totalBets._sum.betAmount || 0) > 0
          ? Number(totalPayouts._sum.payout || 0) / Number(totalBets._sum.betAmount)
          : 0,
      recentRounds,
    };
  }
}
