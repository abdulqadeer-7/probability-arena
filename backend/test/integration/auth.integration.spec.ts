import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import * as cookieParser from 'cookie-parser';

describe('Auth Integration', () => {
  let app: INestApplication;
  let prisma: any;
  let redis: any;
  let jwtService: any;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    displayName: 'TestUser',
    avatarUrl: null,
    role: 'USER',
    isVerified: false,
    isGuest: false,
    twoFactorSecret: null,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

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

  const mockTx = {
    user: { create: jest.fn() },
    practiceWallet: { create: jest.fn() },
  };

  const mockPrisma = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    practiceWallet: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  beforeAll(async () => {
    mockTx.user.create.mockResolvedValue(mockUser);
    mockTx.practiceWallet.create.mockResolvedValue(mockWallet);
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(mockUser);
    mockPrisma.session.create.mockResolvedValue({
      id: 'session-1',
      userId: 'test-user-id',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    mockPrisma.session.findFirst.mockResolvedValue({
      id: 'session-1',
      userId: 'test-user-id',
      refreshToken: 'refresh-token',
    });
    mockRedis.get.mockResolvedValue('test-user-id');
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(RedisService)
      .useValue(mockRedis)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
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

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('creates user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: 'StrongPass1',
          displayName: 'NewUser',
          acceptTerms: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'new@example.com');
      expect(res.body).toHaveProperty('displayName', 'NewUser');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('returns 409 on duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass1',
          displayName: 'AnotherUser',
          acceptTerms: true,
        })
        .expect(409);
    });

    it('returns 400 if terms not accepted', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'no-terms@example.com',
          password: 'StrongPass1',
          displayName: 'NoTerms',
          acceptTerms: false,
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates and returns cookies', async () => {
      mockJwtService.sign.mockReturnValue('access-token');

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'StrongPass1' })
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears cookies', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', ['refresh_token=some-token'])
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('refreshes tokens', async () => {
      mockJwtService.verify.mockReturnValueOnce({
        sub: 'test-user-id',
        iat: 123,
        exp: Date.now() / 1000 + 86400,
      });
      mockPrisma.session.findFirst.mockResolvedValueOnce({
        id: 'session-1',
        refreshToken: 'valid-refresh',
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=valid-refresh'])
        .expect(200);

      expect(res.body).toHaveProperty('user');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('verifies with valid token', async () => {
      mockRedis.get.mockResolvedValueOnce('test-user-id');
      mockPrisma.user.update.mockResolvedValueOnce({
        ...mockUser,
        isVerified: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(res.body).toHaveProperty(
        'message',
        'Email verified successfully',
      );
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user profile when authenticated', async () => {
      mockJwtService.verify.mockReturnValueOnce({
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'USER',
      });

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', ['access_token=valid-token'])
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
