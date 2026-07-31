import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { WalletService } from '../../src/wallet/wallet.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { CurrentUser } from '../../src/common/decorators/current-user.decorator';
import * as cookieParser from 'cookie-parser';

describe('Wallet Integration', () => {
  let app: INestApplication;

  const mockWallet = {
    id: 'wallet-id',
    userId: 'test-user-id',
    balance: 10000,
    totalEarned: 10000,
    totalSpent: 0,
    lastResetAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockTransactions = [
    {
      id: 'tx-1',
      walletId: 'wallet-id',
      amount: 10000,
      type: 'CREDIT',
      reason: 'SIGNUP_BONUS',
      referenceId: null,
      createdAt: new Date('2025-01-01'),
    },
    {
      id: 'tx-2',
      walletId: 'wallet-id',
      amount: 500,
      type: 'DEBIT',
      reason: 'GAME_WAGER',
      referenceId: 'round-1',
      createdAt: new Date('2025-01-02'),
    },
  ];

  const mockWalletService = {
    getBalance: jest.fn().mockResolvedValue(mockWallet),
    resetBalance: jest.fn().mockResolvedValue({
      ...mockWallet,
      balance: 10000,
      lastResetAt: new Date(),
    }),
    getTransactions: jest.fn(),
    getStats: jest.fn().mockResolvedValue({
      totalWagered: 5000,
      totalWon: 3000,
      netResult: -2000,
      gamesPlayed: 42,
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WalletService)
      .useValue(mockWalletService)
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/wallet/balance', () => {
    it('returns wallet', async () => {
      mockWalletService.getBalance.mockResolvedValueOnce(mockWallet);

      const res = await request(app.getHttpServer())
        .get('/api/wallet/balance')
        .expect(200);

      expect(res.body).toHaveProperty('id', mockWallet.id);
      expect(res.body).toHaveProperty('balance');
      expect(res.body).toHaveProperty('userId', mockWallet.userId);
      expect(mockWalletService.getBalance).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('POST /api/wallet/reset', () => {
    it('resets balance', async () => {
      mockWalletService.resetBalance.mockResolvedValueOnce({
        ...mockWallet,
        balance: 10000,
        lastResetAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .post('/api/wallet/reset')
        .expect(200);

      expect(res.body).toHaveProperty('balance', 10000);
      expect(mockWalletService.resetBalance).toHaveBeenCalledWith(
        'test-user-id',
      );
    });
  });

  describe('GET /api/wallet/transactions', () => {
    it('returns paginated transactions', async () => {
      mockWalletService.getTransactions.mockResolvedValueOnce({
        data: mockTransactions,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app.getHttpServer())
        .get('/api/wallet/transactions')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveLength(2);
      expect(res.body).toHaveProperty('total', 2);
      expect(res.body).toHaveProperty('page', 1);
      expect(mockWalletService.getTransactions).toHaveBeenCalledWith(
        'test-user-id',
        1,
        10,
      );
    });

    it('handles empty transactions', async () => {
      mockWalletService.getTransactions.mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const res = await request(app.getHttpServer())
        .get('/api/wallet/transactions')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('uses default pagination when no query provided', async () => {
      mockWalletService.getTransactions.mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await request(app.getHttpServer())
        .get('/api/wallet/transactions')
        .expect(200);

      expect(mockWalletService.getTransactions).toHaveBeenCalledWith(
        'test-user-id',
        1,
        10,
      );
    });
  });
});
