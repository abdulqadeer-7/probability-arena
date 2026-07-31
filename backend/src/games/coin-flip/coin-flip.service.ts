import { Injectable } from '@nestjs/common';
import { GameEngineService } from '../game-engine.service';

export interface CoinFlipResult {
  result: 'heads' | 'tails';
}

@Injectable()
export class CoinFlipService {
  constructor(private readonly gameEngine: GameEngineService) {}

  flipCoin(): 'heads' | 'tails' {
    return Math.random() < 0.5 ? 'heads' : 'tails';
  }

  generateResult(serverSeed: string, clientSeed: string, nonce: number): CoinFlipResult {
    const raw = this.gameEngine.computeResult(serverSeed, clientSeed, nonce, {
      maxValue: 1,
      minValue: 0,
    });
    return { result: raw === 0 ? 'heads' : 'tails' };
  }
}
