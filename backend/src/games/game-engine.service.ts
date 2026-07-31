import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export enum GameType {
  DICE = 'dice',
  COIN_FLIP = 'coin_flip',
  SLOTS = 'slots',
  WHEEL = 'wheel',
  FLIGHT_CURVE = 'flight_curve',
  CARD_TRAINER = 'card_trainer',
}

export enum GameCategory {
  CLASSIC = 'classic',
  TRAINER = 'trainer',
  ARCADE = 'arcade',
}

export interface GameConfig {
  minBet: number;
  maxBet: number;
  houseEdge: number;
  rtp: number;
  maxMultiplier: number;
  customConfig?: Record<string, any>;
}

@Injectable()
export class GameEngineService {
  generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateClientSeed(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  computeResult(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    gameConfig?: { maxValue?: number; minValue?: number },
  ): number {
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(`${clientSeed}:${nonce}`);
    const hash = hmac.digest('hex');
    const hex = hash.substring(0, 13);
    const decimal = parseInt(hex, 16);
    const max = gameConfig?.maxValue ?? 10000;
    const min = gameConfig?.minValue ?? 0;
    return min + (decimal % (max - min + 1));
  }

  calculateMultiplier(resultValue: number, gameType: GameType): number {
    switch (gameType) {
      case GameType.DICE:
        return resultValue > 50 ? 2.0 : 1.96;
      case GameType.COIN_FLIP:
        return 2.0;
      case GameType.FLIGHT_CURVE:
        return Math.max(1.0, resultValue / 100);
      case GameType.SLOTS:
      case GameType.WHEEL:
        return resultValue / 100;
      case GameType.CARD_TRAINER:
        return 1.0;
      default:
        return 1.0;
    }
  }

  verifyFairness(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    result: number,
    gameConfig?: { maxValue?: number; minValue?: number },
  ): boolean {
    const computed = this.computeResult(serverSeed, clientSeed, nonce, gameConfig);
    return computed === result;
  }

  getGameConfig(gameSlug: string): GameConfig {
    const configs: Record<string, GameConfig> = {
      dice: {
        minBet: 1,
        maxBet: 10000,
        houseEdge: 0.02,
        rtp: 0.98,
        maxMultiplier: 100,
      },
      coin_flip: {
        minBet: 1,
        maxBet: 5000,
        houseEdge: 0.01,
        rtp: 0.99,
        maxMultiplier: 2,
      },
      slots: {
        minBet: 1,
        maxBet: 2500,
        houseEdge: 0.05,
        rtp: 0.95,
        maxMultiplier: 1000,
      },
      wheel: {
        minBet: 1,
        maxBet: 10000,
        houseEdge: 0.03,
        rtp: 0.97,
        maxMultiplier: 36,
      },
      flight_curve: {
        minBet: 1,
        maxBet: 5000,
        houseEdge: 0.01,
        rtp: 0.99,
        maxMultiplier: 10000,
      },
      card_trainer: {
        minBet: 0,
        maxBet: 0,
        houseEdge: 0,
        rtp: 1,
        maxMultiplier: 1,
      },
    };
    return configs[gameSlug] || configs.dice;
  }
}
