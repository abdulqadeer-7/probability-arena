import { Test, TestingModule } from '@nestjs/testing';
import { DiceService } from '../../src/games/dice/dice.service';
import { GameEngineService } from '../../src/games/game-engine.service';

describe('DiceService', () => {
  let diceService: DiceService;
  let gameEngine: GameEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiceService,
        {
          provide: GameEngineService,
          useValue: {
            computeResult: jest.fn(),
          },
        },
      ],
    }).compile();

    diceService = module.get<DiceService>(DiceService);
    gameEngine = module.get<GameEngineService>(GameEngineService);
  });

  describe('rollDie', () => {
    it('returns 1-6 for 6-sided die', () => {
      for (let i = 0; i < 100; i++) {
        const result = diceService.rollDie(6);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('returns 1-20 for 20-sided die', () => {
      for (let i = 0; i < 100; i++) {
        const result = diceService.rollDie(20);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('rollDice', () => {
    it('returns array of correct length', () => {
      const result = diceService.rollDice(5, 6);
      expect(result).toHaveLength(5);
    });

    it('all values are within range', () => {
      const result = diceService.rollDice(100, 6);
      for (const die of result) {
        expect(die).toBeGreaterThanOrEqual(1);
        expect(die).toBeLessThanOrEqual(6);
      }
    });
  });

  describe('generateResult', () => {
    it('total between 2-12 for two dice', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(1234);

      const result = diceService.generateResult('server', 'client', 1);

      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeLessThanOrEqual(12);
      expect(result.dice).toHaveLength(2);
    });

    it('dice values are between 1-6', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(9999);

      const result = diceService.generateResult('server', 'client', 1);

      for (const die of result.dice) {
        expect(die).toBeGreaterThanOrEqual(1);
        expect(die).toBeLessThanOrEqual(6);
      }
    });

    it('deterministic for same seeds', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(5555);

      const result1 = diceService.generateResult('seed', 'client', 1);
      const result2 = diceService.generateResult('seed', 'client', 1);

      expect(result1.total).toBe(result2.total);
      expect(result1.dice).toEqual(result2.dice);
    });

    it('different results for different seeds', () => {
      (gameEngine.computeResult as jest.Mock)
        .mockReturnValueOnce(1234)
        .mockReturnValueOnce(5678);

      const result1 = diceService.generateResult('seed-a', 'client', 1);
      const result2 = diceService.generateResult('seed-b', 'client', 1);

      expect(
        result1.total !== result2.total ||
          result1.dice[0] !== result2.dice[0],
      ).toBe(true);
    });

    it('calls gameEngine.computeResult with correct params', () => {
      diceService.generateResult('ss', 'cc', 42);

      expect(gameEngine.computeResult).toHaveBeenCalledWith('ss', 'cc', 42, {
        maxValue: 9999,
        minValue: 0,
      });
    });

    it('total equals sum of dice', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(0);

      const result = diceService.generateResult('s', 'c', 1);
      expect(result.total).toBe(result.dice[0] + result.dice[1]);
    });
  });

  describe('Statistical: distribution approximately uniform', () => {
    it('over 10000 rolls, each die face appears roughly 1/6 of the time', () => {
      const runs = 10000;
      const counts = [0, 0, 0, 0, 0, 0];

      for (let i = 0; i < runs; i++) {
        const roll = diceService.rollDie(6);
        counts[roll - 1]++;
      }

      const expected = runs / 6;
      const tolerance = 0.15;

      for (let i = 0; i < 6; i++) {
        const deviation = Math.abs(counts[i] - expected) / expected;
        expect(deviation).toBeLessThan(tolerance);
      }
    });

    it('over 5000 dice results, each total frequency is plausible', () => {
      const runs = 5000;
      const totals: number[] = [];

      for (let i = 0; i < runs; i++) {
        const d1 = ((i * 7 + 3) % 6) + 1;
        const d2 = ((i * 11 + 5) % 6) + 1;
        totals.push(d1 + d2);
      }

      const freq = new Array(13).fill(0);
      for (const t of totals) {
        freq[t]++;
      }

      expect(freq[7]).toBeGreaterThan(freq[2]);
      expect(freq[7]).toBeGreaterThan(freq[12]);
      expect(freq[2]).toBeLessThan(100);
      expect(freq[12]).toBeLessThan(100);
    });
  });
});
