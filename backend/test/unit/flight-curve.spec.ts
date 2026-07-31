import { Test, TestingModule } from '@nestjs/testing';
import { FlightCurveService } from '../../src/games/flight-curve/flight-curve.service';
import { GameEngineService } from '../../src/games/game-engine.service';

describe('FlightCurveService', () => {
  let flightCurveService: FlightCurveService;
  let gameEngine: GameEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightCurveService,
        {
          provide: GameEngineService,
          useValue: {
            computeResult: jest.fn().mockReturnValue(5000),
          },
        },
      ],
    }).compile();

    flightCurveService = module.get<FlightCurveService>(FlightCurveService);
    gameEngine = module.get<GameEngineService>(GameEngineService);
  });

  describe('generateFlightRound', () => {
    it('crashPoint >= 1', () => {
      for (let i = 0; i < 100; i++) {
        const round = flightCurveService.generateFlightRound();
        expect(round.crashPoint).toBeGreaterThanOrEqual(1);
      }
    });

    it('crashPoint is rounded to 2 decimal places', () => {
      for (let i = 0; i < 50; i++) {
        const round = flightCurveService.generateFlightRound();
        const decimalParts = round.crashPoint.toString().split('.');
        if (decimalParts.length === 2) {
          expect(decimalParts[1].length).toBeLessThanOrEqual(2);
        }
      }
    });

    it('trajectory is array of numbers starting at 1.0', () => {
      const round = flightCurveService.generateFlightRound();
      expect(Array.isArray(round.trajectory)).toBe(true);
      expect(round.trajectory.length).toBeGreaterThan(0);
      expect(round.trajectory[0]).toBe(1.0);
    });

    it('trajectory values are non-decreasing', () => {
      for (let i = 0; i < 20; i++) {
        const round = flightCurveService.generateFlightRound();
        for (let j = 1; j < round.trajectory.length; j++) {
          expect(round.trajectory[j]).toBeGreaterThanOrEqual(
            round.trajectory[j - 1],
          );
        }
      }
    });

    it('trajectory does not exceed crashPoint', () => {
      for (let i = 0; i < 20; i++) {
        const round = flightCurveService.generateFlightRound();
        for (const val of round.trajectory) {
          expect(val).toBeLessThanOrEqual(round.crashPoint);
        }
      }
    });
  });

  describe('calculatePayout', () => {
    it('returns bet * cashOutAt when cashOutAt < crashPoint', () => {
      const payout = flightCurveService.calculatePayout(100, 2.5, 2.0);
      expect(payout).toBe(200.0);
    });

    it('returns 0 when cashOutAt >= crashPoint', () => {
      const payout = flightCurveService.calculatePayout(100, 2.0, 2.0);
      expect(payout).toBe(0);
    });

    it('returns 0 when cashOutAt <= 0', () => {
      const payout = flightCurveService.calculatePayout(100, 2.5, 0);
      expect(payout).toBe(0);
    });

    it('returns 0 when cashOutAt exceeds crashPoint', () => {
      const payout = flightCurveService.calculatePayout(100, 1.5, 3.0);
      expect(payout).toBe(0);
    });

    it('handles zero bet amount', () => {
      const payout = flightCurveService.calculatePayout(0, 3.0, 2.0);
      expect(payout).toBe(0);
    });
  });

  describe('generateResult', () => {
    it('returns deterministic result for same seeds', () => {
      const result1 = flightCurveService.generateResult(
        'server-seed',
        'client-seed',
        1,
      );
      const result2 = flightCurveService.generateResult(
        'server-seed',
        'client-seed',
        1,
      );

      expect(result1.crashPoint).toBe(result2.crashPoint);
      expect(result1.trajectory).toEqual(result2.trajectory);
    });

    it('returns different result for different nonces', () => {
      (gameEngine.computeResult as jest.Mock)
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(8000);

      const result1 = flightCurveService.generateResult('s', 'c', 1);
      const result2 = flightCurveService.generateResult('s', 'c', 2);

      expect(result1.crashPoint).not.toBe(result2.crashPoint);
    });

    it('calls gameEngine.computeResult with correct params', () => {
      flightCurveService.generateResult('ss', 'cc', 42);

      expect(gameEngine.computeResult).toHaveBeenCalledWith('ss', 'cc', 42, {
        maxValue: 9999,
        minValue: 1,
      });
    });

    it('crashPoint is at least 1.01', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(1);

      const result = flightCurveService.generateResult('s', 'c', 1);
      expect(result.crashPoint).toBeGreaterThanOrEqual(1.01);
    });
  });

  describe('Statistical: average crash point', () => {
    it('average crash point over 1000 rounds is reasonable', () => {
      const rounds = 1000;
      let sum = 0;
      for (let i = 0; i < rounds; i++) {
        const round = flightCurveService.generateFlightRound();
        sum += round.crashPoint;
      }
      const avg = sum / rounds;
      expect(avg).toBeGreaterThan(1);
      expect(avg).toBeLessThan(100);
    });
  });
});
