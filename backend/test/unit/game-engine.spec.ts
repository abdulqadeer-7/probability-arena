import { GameEngineService, GameType } from '../../src/games/game-engine.service';

describe('GameEngineService', () => {
  let engine: GameEngineService;

  beforeEach(() => {
    engine = new GameEngineService();
  });

  describe('generateServerSeed', () => {
    it('returns 64 character hex string', () => {
      const seed = engine.generateServerSeed();
      expect(seed).toMatch(/^[0-9a-f]{64}$/);
    });

    it('returns different seeds on consecutive calls', () => {
      const seed1 = engine.generateServerSeed();
      const seed2 = engine.generateServerSeed();
      expect(seed1).not.toBe(seed2);
    });
  });

  describe('generateClientSeed', () => {
    it('returns 32 character hex string', () => {
      const seed = engine.generateClientSeed();
      expect(seed).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('computeResult', () => {
    it('returns deterministic result for same seeds and nonce', () => {
      const serverSeed = engine.generateServerSeed();
      const clientSeed = engine.generateClientSeed();
      const nonce = 1;

      const result1 = engine.computeResult(serverSeed, clientSeed, nonce);
      const result2 = engine.computeResult(serverSeed, clientSeed, nonce);

      expect(result1).toBe(result2);
    });

    it('returns different results for different nonces', () => {
      const serverSeed = engine.generateServerSeed();
      const clientSeed = engine.generateClientSeed();

      const result1 = engine.computeResult(serverSeed, clientSeed, 1);
      const result2 = engine.computeResult(serverSeed, clientSeed, 2);

      expect(result1).not.toBe(result2);
    });

    it('returns different results for different client seeds', () => {
      const serverSeed = engine.generateServerSeed();

      const result1 = engine.computeResult(serverSeed, 'client-a', 1);
      const result2 = engine.computeResult(serverSeed, 'client-b', 1);

      expect(result1).not.toBe(result2);
    });

    it('returns value within default range [0, 10000]', () => {
      const serverSeed = engine.generateServerSeed();
      const clientSeed = engine.generateClientSeed();

      for (let nonce = 0; nonce < 100; nonce++) {
        const result = engine.computeResult(serverSeed, clientSeed, nonce);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(10000);
      }
    });

    it('respects custom min/max values', () => {
      const serverSeed = engine.generateServerSeed();
      const clientSeed = engine.generateClientSeed();

      const result = engine.computeResult(serverSeed, clientSeed, 1, {
        minValue: 1,
        maxValue: 6,
      });

      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('returns integer result', () => {
      const result = engine.computeResult('a'.repeat(64), 'b'.repeat(32), 5);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('calculateMultiplier', () => {
    it('returns number >= 1 for any game type', () => {
      const values = Object.values(GameType);
      for (const gameType of values) {
        const mult = engine.calculateMultiplier(50, gameType as GameType);
        expect(mult).toBeGreaterThanOrEqual(1);
      }
    });

    it('returns 2.0 for COIN_FLIP', () => {
      expect(engine.calculateMultiplier(0, GameType.COIN_FLIP)).toBe(2.0);
    });

    it('returns higher multiplier for DICE when result > 50', () => {
      const over = engine.calculateMultiplier(75, GameType.DICE);
      const under = engine.calculateMultiplier(25, GameType.DICE);
      expect(over).toBe(2.0);
      expect(under).toBe(1.96);
    });
  });

  describe('verifyFairness', () => {
    it('returns true for valid round', () => {
      const serverSeed = engine.generateServerSeed();
      const clientSeed = engine.generateClientSeed();
      const nonce = 42;

      const result = engine.computeResult(serverSeed, clientSeed, nonce);
      const verified = engine.verifyFairness(
        serverSeed,
        clientSeed,
        nonce,
        result,
      );

      expect(verified).toBe(true);
    });

    it('returns false for tampered result', () => {
      const serverSeed = engine.generateServerSeed();
      const clientSeed = engine.generateClientSeed();

      const verified = engine.verifyFairness(
        serverSeed,
        clientSeed,
        1,
        999999,
      );

      expect(verified).toBe(false);
    });
  });

  describe('Statistical: uniform distribution', () => {
    it('over 10000 runs, distribution is approximately uniform', () => {
      const serverSeed = engine.generateServerSeed();
      const clientSeed = engine.generateClientSeed();
      const runs = 10000;
      const binCount = 10;
      const bins = new Array(binCount).fill(0);
      const expectedPerBin = runs / binCount;
      const tolerance = 0.2;

      for (let nonce = 0; nonce < runs; nonce++) {
        const result = engine.computeResult(serverSeed, clientSeed, nonce, {
          minValue: 0,
          maxValue: binCount - 1,
        });
        bins[result]++;
      }

      for (let i = 0; i < binCount; i++) {
        const deviation = Math.abs(bins[i] - expectedPerBin) / expectedPerBin;
        expect(deviation).toBeLessThan(tolerance);
      }
    });
  });
});
