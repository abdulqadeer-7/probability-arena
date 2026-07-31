import { Injectable } from '@nestjs/common';
import { GameEngineService } from '../game-engine.service';

export const SLOT_SYMBOLS = ['🪐', '🚀', '⭐', '💫', '🌙', '🎯', '🔮'];

const PAYTABLE: Record<string, { three: number; two: number }> = {
  '🪐': { three: 100, two: 10 },
  '🚀': { three: 50, two: 5 },
  '⭐': { three: 25, two: 3 },
  '💫': { three: 15, two: 2 },
  '🌙': { three: 10, two: 1.5 },
  '🎯': { three: 5, two: 1 },
  '🔮': { three: 3, two: 0.5 },
};

export interface SlotResult {
  symbols: string[][];
  payout: number;
  winningLines: number[];
}

@Injectable()
export class SlotsService {
  private readonly REEL_COUNT = 5;
  private readonly ROW_COUNT = 3;

  constructor(private readonly gameEngine: GameEngineService) {}

  spin(reels: number = this.REEL_COUNT, symbols: string[] = SLOT_SYMBOLS): string[][] {
    const grid: string[][] = [];
    for (let row = 0; row < this.ROW_COUNT; row++) {
      const rowSymbols: string[] = [];
      for (let col = 0; col < reels; col++) {
        const idx = Math.floor(Math.random() * symbols.length);
        rowSymbols.push(symbols[idx]);
      }
      grid.push(rowSymbols);
    }
    return grid;
  }

  calculatePayout(symbols: string[][], lines: number, bet: number): number {
    if (symbols.length === 0 || lines === 0 || bet === 0) return 0;

    let totalPayout = 0;
    const linesToCheck = Math.min(lines, this.ROW_COUNT);

    for (let line = 0; line < linesToCheck; line++) {
      const row = symbols[line];
      if (!row || row.length === 0) continue;

      const firstSymbol = row[0];
      let count = 1;

      for (let col = 1; col < row.length; col++) {
        if (row[col] === firstSymbol) {
          count++;
        } else {
          break;
        }
      }

      const payline = PAYTABLE[firstSymbol];
      if (payline) {
        if (count >= 3) {
          totalPayout += bet * payline.three;
        } else if (count === 2) {
          totalPayout += bet * payline.two;
        }
      }
    }

    return parseFloat(totalPayout.toFixed(2));
  }

  generateResult(serverSeed: string, clientSeed: string, nonce: number): SlotResult {
    const grid = this.spin();
    const winningLines: number[] = [];

    for (let line = 0; line < this.ROW_COUNT; line++) {
      const row = grid[line];
      if (row[0] === row[1] && row[1] === row[2]) {
        winningLines.push(line);
      }
    }

    const payout = this.calculatePayout(grid, this.ROW_COUNT, 1);
    return { symbols: grid, payout, winningLines };
  }
}
