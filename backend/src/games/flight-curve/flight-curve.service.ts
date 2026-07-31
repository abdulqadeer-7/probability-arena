import { Injectable } from '@nestjs/common';
import { GameEngineService } from '../game-engine.service';

export interface FlightRound {
  crashPoint: number;
  trajectory: number[];
}

@Injectable()
export class FlightCurveService {
  private readonly HOUSE_EDGE = 0.01;

  constructor(private readonly gameEngine: GameEngineService) {}

  generateFlightRound(): FlightRound {
    const crashPoint = this.generateCrashPoint();
    const trajectory = this.generateTrajectory(crashPoint);
    return { crashPoint, trajectory };
  }

  private generateCrashPoint(): number {
    const rand = Math.random();
    const crashPoint = 1 / (1 - this.HOUSE_EDGE - rand * (1 - this.HOUSE_EDGE));
    return Math.max(1.01, parseFloat(crashPoint.toFixed(2)));
  }

  private generateTrajectory(crashPoint: number): number[] {
    const trajectory: number[] = [1.0];
    const steps = 100;
    const increment = (crashPoint - 1.0) / steps;
    for (let i = 1; i <= steps; i++) {
      const value = 1.0 + increment * i;
      trajectory.push(parseFloat(value.toFixed(2)));
      if (value >= crashPoint) break;
    }
    return trajectory;
  }

  calculatePayout(betAmount: number, crashPoint: number, cashOutAt: number): number {
    if (cashOutAt <= 0 || cashOutAt >= crashPoint) {
      return 0;
    }
    return parseFloat((betAmount * cashOutAt).toFixed(2));
  }

  generateResult(serverSeed: string, clientSeed: string, nonce: number): FlightRound {
    const raw = this.gameEngine.computeResult(serverSeed, clientSeed, nonce, {
      maxValue: 9999,
      minValue: 1,
    });
    const crashPoint = Math.max(1.01, parseFloat((1 + raw / 1000).toFixed(2)));
    const trajectory = this.generateTrajectory(crashPoint);
    return { crashPoint, trajectory };
  }
}
