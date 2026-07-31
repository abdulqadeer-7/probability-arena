import { Test, TestingModule } from '@nestjs/testing';
import { CoinFlipService } from '../../src/games/coin-flip/coin-flip.service';
import { GameEngineService } from '../../src/games/game-engine.service';

describe('CoinFlipService', () => {
  let coinFlipService: CoinFlipService;
  let gameEngine: GameEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinFlipService,
        {
          provide: GameEngineService,
          useValue: {
            computeResult: jest.fn(),
          },
        },
      ],
    }).compile();

    coinFlipService = module.get<CoinFlipService>(CoinFlipService);
    gameEngine = module.get<GameEngineService>(GameEngineService);
  });

  describe('flipCoin', () => {
    it('returns heads or tails', () => {
      for (let i = 0; i < 100; i++) {
        const result = coinFlipService.flipCoin();
        expect(['heads', 'tails']).toContain(result);
      }
    });
  });

  describe('generateResult', () => {
    it('returns expected format', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(0);

      const result = coinFlipService.generateResult('server', 'client', 1);

      expect(result).toHaveProperty('result');
      expect(['heads', 'tails']).toContain(result.result);
    });

    it('returns heads when computeResult returns 0', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(0);

      const result = coinFlipService.generateResult('s', 'c', 1);

      expect(result.result).toBe('heads');
    });

    it('returns tails when computeResult returns 1', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(1);

      const result = coinFlipService.generateResult('s', 'c', 1);

      expect(result.result).toBe('tails');
    });

    it('calls gameEngine.computeResult with correct params', () => {
      coinFlipService.generateResult('ss', 'cc', 42);

      expect(gameEngine.computeResult).toHaveBeenCalledWith('ss', 'cc', 42, {
        maxValue: 1,
        minValue: 0,
      });
    });

    it('deterministic for same seeds', () => {
      (gameEngine.computeResult as jest.Mock).mockReturnValue(0);

      const r1 = coinFlipService.generateResult('seed', 'client', 1);
      const r2 = coinFlipService.generateResult('seed', 'client', 1);

      expect(r1.result).toBe(r2.result);
    });

    it('different results for different nonces', () => {
      (gameEngine.computeResult as jest.Mock)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1);

      const r1 = coinFlipService.generateResult('s', 'c', 1);
      const r2 = coinFlipService.generateResult('s', 'c', 2);

      expect(r1.result).not.toBe(r2.result);
    });
  });

  describe('Statistical: approximately 50/50 over 1000 flips', () => {
    it('heads and tails each appear between 40-60%', () => {
      const runs = 1000;
      let heads = 0;

      for (let i = 0; i < runs; i++) {
        if (coinFlipService.flipCoin() === 'heads') {
          heads++;
        }
      }

      const ratio = heads / runs;
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.6);
    });
  });
});
