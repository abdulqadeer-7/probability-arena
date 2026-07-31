import { Injectable } from '@nestjs/common';
import { GameEngineService } from '../game-engine.service';

export interface DiceResult {
  total: number;
  dice: number[];
}

@Injectable()
export class DiceService {
  constructor(private readonly gameEngine: GameEngineService) {}

  rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  rollDice(rolls: number, sides: number): number[] {
    return Array.from({ length: rolls }, () => this.rollDie(sides));
  }

  generateResult(serverSeed: string, clientSeed: string, nonce: number): DiceResult {
    const raw = this.gameEngine.computeResult(serverSeed, clientSeed, nonce, {
      maxValue: 9999,
      minValue: 0,
    });
    const rawStr = raw.toString().padStart(4, '0');
    const die1 = (parseInt(rawStr.substring(0, 2), 10) % 6) + 1;
    const die2 = (parseInt(rawStr.substring(2, 4), 10) % 6) + 1;
    const dice = [die1, die2];
    return { total: die1 + die2, dice };
  }
}
