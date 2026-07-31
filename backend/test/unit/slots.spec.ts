import { Test, TestingModule } from '@nestjs/testing';
import { SlotsService, SLOT_SYMBOLS, SlotResult } from '../../src/games/slots/slots.service';
import { GameEngineService } from '../../src/games/game-engine.service';

describe('SlotsService', () => {
  let slotsService: SlotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotsService,
        {
          provide: GameEngineService,
          useValue: {
            computeResult: jest.fn(),
          },
        },
      ],
    }).compile();

    slotsService = module.get<SlotsService>(SlotsService);
  });

  describe('spin', () => {
    it('returns correct number of reels (columns)', () => {
      const result = slotsService.spin(5);
      expect(result).toHaveLength(3);
      for (const row of result) {
        expect(row).toHaveLength(5);
      }
    });

    it('returns correct number of symbols per reel (rows)', () => {
      const result = slotsService.spin(3);
      expect(result).toHaveLength(3);
      for (const row of result) {
        expect(row).toHaveLength(3);
      }
    });

    it('all symbols are from the defined set', () => {
      const result = slotsService.spin(5);
      for (const row of result) {
        for (const symbol of row) {
          expect(SLOT_SYMBOLS).toContain(symbol);
        }
      }
    });

    it('allows custom symbol set', () => {
      const customSymbols = ['A', 'B', 'C'];
      const result = slotsService.spin(3, customSymbols);
      for (const row of result) {
        for (const symbol of row) {
          expect(customSymbols).toContain(symbol);
        }
      }
    });
  });

  describe('calculatePayout', () => {
    it('returns 0 for no match', () => {
      const grid = [
        ['🪐', '🚀', '⭐', '💫', '🌙'],
        ['🚀', '⭐', '💫', '🌙', '🎯'],
        ['⭐', '💫', '🌙', '🎯', '🔮'],
      ];
      const payout = slotsService.calculatePayout(grid, 3, 10);
      expect(payout).toBe(0);
    });

    it('returns > 0 for matching symbols in a row', () => {
      const grid = [
        ['🪐', '🪐', '🪐', '🪐', '🪐'],
        ['🚀', '🚀', '⭐', '💫', '🌙'],
        ['⭐', '💫', '🌙', '🎯', '🔮'],
      ];
      const payout = slotsService.calculatePayout(grid, 3, 10);
      expect(payout).toBeGreaterThan(0);
    });

    it('calculates three-of-a-kind correctly for planet symbol', () => {
      const grid = [['🪐', '🪐', '🪐', 'A', 'B']];
      const payout = slotsService.calculatePayout(grid, 1, 10);
      expect(payout).toBe(1000);
    });

    it('calculates two-of-a-kind correctly', () => {
      const grid = [['⭐', '⭐', 'A', 'B', 'C']];
      const payout = slotsService.calculatePayout(grid, 1, 10);
      expect(payout).toBe(30);
    });

    it('returns 0 for empty grid', () => {
      expect(slotsService.calculatePayout([], 1, 10)).toBe(0);
    });

    it('returns 0 when bet is 0', () => {
      const grid = [['🪐', '🪐', '🪐', '🪐', '🪐']];
      expect(slotsService.calculatePayout(grid, 1, 0)).toBe(0);
    });

    it('returns 0 when lines is 0', () => {
      const grid = [['🪐', '🪐', '🪐', '🪐', '🪐']];
      expect(slotsService.calculatePayout(grid, 0, 10)).toBe(0);
    });

    it('only matches consecutive symbols from start', () => {
      const grid = [['🚀', '⭐', '⭐', '⭐', '⭐']];
      const payout = slotsService.calculatePayout(grid, 1, 10);
      expect(payout).toBe(50);
    });

    it('handles multiple paylines', () => {
      const grid = [
        ['🪐', '🪐', '🪐', '🪐', '🪐'],
        ['🚀', '🚀', '🚀', '🚀', '🚀'],
        ['A', 'B', 'C', 'D', 'E'],
      ];
      const payout = slotsService.calculatePayout(grid, 2, 1);
      expect(payout).toBe(150);
    });

    it('limits paylines to available rows', () => {
      const grid = [['🪐', '🪐', '🪐', '🪐', '🪐']];
      const payout = slotsService.calculatePayout(grid, 10, 1);
      expect(payout).toBe(100);
    });
  });

  describe('generateResult', () => {
    it('returns SlotResult with correct structure', () => {
      const result = slotsService.generateResult('server', 'client', 1);
      expect(result).toHaveProperty('symbols');
      expect(result).toHaveProperty('payout');
      expect(result).toHaveProperty('winningLines');
      expect(Array.isArray(result.symbols)).toBe(true);
      expect(Array.isArray(result.winningLines)).toBe(true);
    });

    it('symbols grid matches dimensions', () => {
      const result = slotsService.generateResult('server', 'client', 1);
      expect(result.symbols).toHaveLength(3);
      for (const row of result.symbols) {
        expect(row).toHaveLength(5);
      }
    });

    it('payout is non-negative', () => {
      for (let i = 0; i < 50; i++) {
        const result = slotsService.generateResult(`s${i}`, 'c', i);
        expect(result.payout).toBeGreaterThanOrEqual(0);
      }
    });

    it('winningLines only contains valid row indices', () => {
      const result = slotsService.generateResult('s', 'c', 1);
      for (const line of result.winningLines) {
        expect(line).toBeGreaterThanOrEqual(0);
        expect(line).toBeLessThan(3);
      }
    });

    it('winning lines match payout', () => {
      const symbols: string[][] = [
        ['🪐', '🪐', '🪐', '🪐', '🪐'],
        ['A', 'B', 'C', 'D', 'E'],
        ['🚀', '🚀', '🚀', '🚀', '🚀'],
      ];

      jest.spyOn(slotsService as any, 'spin').mockReturnValue(symbols);

      const result = slotsService.generateResult('s', 'c', 1);
      expect(result.winningLines).toEqual([0, 2]);
      expect(result.payout).toBe(150);
    });
  });
});
