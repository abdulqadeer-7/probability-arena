import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Injectable, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { GameEngineService } from './game-engine.service';
import { FlightCurveService } from './flight-curve/flight-curve.service';
import { DiceService } from './dice/dice.service';
import { CoinFlipService } from './coin-flip/coin-flip.service';
import { SlotsService } from './slots/slots.service';
import { WheelService } from './wheel/wheel.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  namespace: '/games',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeRounds = new Map<string, Map<string, any>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly gameEngine: GameEngineService,
    private readonly flightCurve: FlightCurveService,
    private readonly dice: DiceService,
    private readonly coinFlip: CoinFlipService,
    private readonly slots: SlotsService,
    private readonly wheel: WheelService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        this.extractTokenFromCookie(client.handshake.headers.cookie);

      if (!token) {
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, displayName: true },
      });

      if (!user) {
        client.emit('error', { message: 'User not found' });
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.user = user;
      await this.redis.sadd(`ws:users:${user.id}`, client.id);
      client.emit('authenticated', { userId: user.id });
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      await this.redis.srem(`ws:users:${client.userId}`, client.id);
      const rooms = Array.from(client.rooms).filter((r) => r !== client.id);
      for (const room of rooms) {
        const roundMap = this.activeRounds.get(room);
        if (roundMap) {
          roundMap.delete(client.userId);
          if (roundMap.size === 0) {
            this.activeRounds.delete(room);
          }
        }
      }
    }
  }

  @SubscribeMessage('join_round')
  async handleJoinRound(client: AuthenticatedSocket, data: { gameSlug: string }) {
    if (!client.userId) throw new WsException('Not authenticated');

    const room = `game:${data.gameSlug}`;
    await client.join(room);

    if (!this.activeRounds.has(room)) {
      this.activeRounds.set(room, new Map());
    }

    this.server.to(room).emit('round_update', {
      gameSlug: data.gameSlug,
      players: this.activeRounds.get(room)?.size || 0,
    });
  }

  @SubscribeMessage('place_bet')
  async handlePlaceBet(
    client: AuthenticatedSocket,
    data: { gameSlug: string; amount: number; clientSeed?: string },
  ) {
    if (!client.userId) throw new WsException('Not authenticated');

    const user = client.user;
    const serverSeed = this.gameEngine.generateServerSeed();
    const clientSeed = data.clientSeed || this.gameEngine.generateClientSeed();
    const nonce = Date.now();

    const room = `game:${data.gameSlug}`;

    let result: any;
    let roundData: any;

    switch (data.gameSlug) {
      case 'dice':
        result = this.dice.generateResult(serverSeed, clientSeed, nonce);
        roundData = { total: result.total, dice: result.dice };
        break;
      case 'coin_flip':
        result = this.coinFlip.generateResult(serverSeed, clientSeed, nonce);
        roundData = { result: result.result };
        break;
      case 'slots':
        result = this.slots.generateResult(serverSeed, clientSeed, nonce);
        roundData = { symbols: result.symbols, payout: result.payout, winningLines: result.winningLines };
        break;
      case 'wheel':
        result = this.wheel.generateResult(serverSeed, clientSeed, nonce);
        roundData = { segment: result.segment, index: result.index };
        break;
      case 'flight_curve':
        result = this.flightCurve.generateResult(serverSeed, clientSeed, nonce);
        roundData = { crashPoint: result.crashPoint, trajectory: result.trajectory };
        break;
      case 'card_trainer':
        result = { drawn: [], remaining: [] };
        roundData = { message: 'Card trainer is an educational tool' };
        break;
      default:
        throw new WsException('Invalid game slug');
    }

    const multiplier = this.gameEngine.calculateMultiplier(
      typeof result.total !== 'undefined' ? result.total : 0,
      data.gameSlug as any,
    );

    try {
      const round = await this.prisma.gameRound.create({
        data: {
          game: { connect: { slug: data.gameSlug } },
          user: { connect: { id: user.id } },
          betAmount: data.amount || 0,
          multiplier,
          result: roundData,
          seed: serverSeed,
        },
      });

      await this.prisma.gameResult.create({
        data: {
          round: { connect: { id: round.id } },
          game: { connect: { slug: data.gameSlug } },
          serverSeed,
          clientSeed,
          nonce,
          resultValue: JSON.stringify(result),
          resultData: roundData,
        },
      });

      this.server.to(room).emit('game_started', {
        roundId: round.id,
        gameSlug: data.gameSlug,
        result: roundData,
      });

      this.server.to(room).emit('round_result', {
        roundId: round.id,
        gameSlug: data.gameSlug,
        result: roundData,
        serverSeed,
        clientSeed,
        nonce,
        multiplier,
      });

      await this.redis.publish(
        'game:events',
        JSON.stringify({
          type: 'round_completed',
          gameSlug: data.gameSlug,
          roundId: round.id,
          userId: user.id,
          result: roundData,
        }),
      );
    } catch (error) {
      throw new WsException(`Failed to place bet: ${error.message}`);
    }
  }

  @SubscribeMessage('cash_out')
  async handleCashOut(
    client: AuthenticatedSocket,
    data: { roundId: string; cashOutAt: number },
  ) {
    if (!client.userId) throw new WsException('Not authenticated');

    const round = await this.prisma.gameRound.findUnique({
      where: { id: data.roundId },
    });

    if (!round) throw new WsException('Round not found');

    const payout = this.flightCurve.calculatePayout(
      Number(round.betAmount),
      Number(round.multiplier || 0),
      data.cashOutAt,
    );

    const updated = await this.prisma.gameRound.update({
      where: { id: data.roundId },
      data: {
        payout,
        multiplier: data.cashOutAt,
        status: 'COMPLETED',
      },
    });

    client.emit('game_ended', {
      roundId: data.roundId,
      cashOutAt: data.cashOutAt,
      payout,
      status: 'COMPLETED',
    });
  }

  private extractTokenFromCookie(cookie?: string): string | null {
    if (!cookie) return null;
    const match = cookie.match(/access_token=([^;]+)/);
    return match ? match[1] : null;
  }
}
