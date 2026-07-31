import { Injectable } from '@nestjs/common';
import { GameEngineService } from '../game-engine.service';

export interface WheelSegment {
  label: string;
  probability: number;
  multiplier: number;
}

export interface WheelResult {
  segment: WheelSegment;
  index: number;
}

@Injectable()
export class WheelService {
  constructor(private readonly gameEngine: GameEngineService) {}

  spin(segments: WheelSegment[]): { segment: WheelSegment; index: number } {
    const rand = Math.random();
    let cumulative = 0;

    for (let i = 0; i < segments.length; i++) {
      cumulative += segments[i].probability;
      if (rand < cumulative) {
        return { segment: segments[i], index: i };
      }
    }

    return { segment: segments[segments.length - 1], index: segments.length - 1 };
  }

  generateSegments(count: number, equal: boolean = true): WheelSegment[] {
    if (equal) {
      const prob = 1 / count;
      return Array.from({ length: count }, (_, i) => ({
        label: `Segment ${i + 1}`,
        probability: prob,
        multiplier: count,
      }));
    }

    const segments: WheelSegment[] = [
      { label: 'Low', probability: 0.5, multiplier: 2 },
      { label: 'Medium', probability: 0.3, multiplier: 5 },
      { label: 'High', probability: 0.15, multiplier: 10 },
      { label: 'Jackpot', probability: 0.05, multiplier: 50 },
    ];

    return segments.slice(0, count);
  }

  generateResult(serverSeed: string, clientSeed: string, nonce: number): WheelResult {
    const segments = this.generateSegments(8, false);
    const raw = this.gameEngine.computeResult(serverSeed, clientSeed, nonce, {
      maxValue: 9999,
      minValue: 0,
    });
    const rand = raw / 10000;
    let cumulative = 0;

    for (let i = 0; i < segments.length; i++) {
      cumulative += segments[i].probability;
      if (rand < cumulative) {
        return { segment: segments[i], index: i };
      }
    }

    return { segment: segments[segments.length - 1], index: segments.length - 1 };
  }
}
