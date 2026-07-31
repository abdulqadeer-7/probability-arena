import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';

jest.mock('argon2');

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;
  let redis: any;
  let jwtService: any;

  const mockTx = {
    user: {
      create: jest.fn(),
    },
    practiceWallet: {
      create: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    displayName: 'TestUser',
    passwordHash: 'hashed-password',
    role: 'USER',
    avatarUrl: null,
    isVerified: false,
    deletedAt: null,
  };

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    refreshToken: 'refresh-token-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const mockPrisma = {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      practiceWallet: {
        create: jest.fn(),
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    jwtService = module.get(JwtService);

    mockTx.user.create.mockReset().mockResolvedValue(mockUser);
    mockTx.practiceWallet.create.mockReset().mockResolvedValue({ id: 'wallet-1', userId: 'user-1' });
    prisma.$transaction.mockReset().mockImplementation(async (cb: any) => cb(mockTx));
    prisma.user.findUnique.mockReset();
    prisma.user.create.mockReset();
    prisma.user.update.mockReset();
    prisma.session.create.mockReset().mockResolvedValue(mockSession);
    prisma.session.findFirst.mockReset();
    prisma.session.delete.mockReset();
    prisma.session.deleteMany.mockReset();
    redis.get.mockReset();
    redis.set.mockReset();
    redis.del.mockReset();

    (argon2.hash as jest.Mock).mockReset();
    (argon2.verify as jest.Mock).mockReset();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'StrongPass1',
      displayName: 'TestUser',
      acceptTerms: true,
    };

    it('creates user and wallet, returns expected data', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      redis.set.mockResolvedValue('OK');

      const result = await authService.register(registerDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(argon2.hash).toHaveBeenCalledWith(registerDto.password);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockTx.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          passwordHash: 'hashed-password',
          displayName: registerDto.displayName,
        },
      });
      expect(mockTx.practiceWallet.create).toHaveBeenCalledWith({
        data: { userId: mockUser.id },
      });
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^email_verify:/),
        mockUser.id,
        'EX',
        86400,
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
      });
    });

    it('throws ConflictException on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException if terms not accepted', async () => {
      const dto = { ...registerDto, acceptTerms: false };

      await expect(authService.register(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('returns user object on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('test@example.com', 'StrongPass1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.passwordHash, 'StrongPass1');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        isVerified: mockUser.isVerified,
      });
    });

    it('returns null on invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });

    it('returns null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.validateUser('missing@example.com', 'pass');

      expect(result).toBeNull();
    });

    it('returns null if user is deleted', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      const result = await authService.validateUser('deleted@example.com', 'pass');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns tokens and user', async () => {
      jwtService.sign.mockReturnValue('mock-jwt-token');
      prisma.session.create.mockResolvedValue(mockSession);

      const result = await authService.login(mockUser);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(mockUser.id);
      expect(prisma.session.create).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('returns new tokens on valid refresh', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', iat: 123, exp: 456 });
      prisma.session.findFirst.mockResolvedValue(mockSession);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-jwt-token');
      prisma.session.create.mockResolvedValue({ ...mockSession, refreshToken: 'new-refresh' });

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: expect.any(String),
      });
      expect(prisma.session.findFirst).toHaveBeenCalledWith({
        where: { refreshToken: 'valid-refresh-token' },
      });
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: mockSession.id },
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('throws UnauthorizedException on invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt error');
      });

      await expect(
        authService.refreshTokens('bad-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if session not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      prisma.session.findFirst.mockResolvedValue(null);

      await expect(
        authService.refreshTokens('orphan-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if user is deleted', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      prisma.session.findFirst.mockResolvedValue(mockSession);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      await expect(
        authService.refreshTokens('token-for-deleted'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('deletes session', async () => {
      prisma.session.deleteMany.mockResolvedValue({ count: 1 });

      await authService.logout('user-1', 'refresh-token-1');

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', refreshToken: 'refresh-token-1' },
      });
    });
  });

  describe('verifyEmail', () => {
    it('verifies with valid token', async () => {
      redis.get.mockResolvedValue('user-1');
      prisma.user.update.mockResolvedValue(mockUser);
      redis.del.mockResolvedValue(1);

      const result = await authService.verifyEmail('valid-token');

      expect(redis.get).toHaveBeenCalledWith('email_verify:valid-token');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isVerified: true },
      });
      expect(redis.del).toHaveBeenCalledWith('email_verify:valid-token');
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('throws BadRequestException on invalid token', async () => {
      redis.get.mockResolvedValue(null);

      await expect(authService.verifyEmail('bad-token')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('returns success message when email exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      redis.set.mockResolvedValue('OK');

      const result = await authService.forgotPassword('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^password_reset:/),
        'user-1',
        'EX',
        900,
      );
      expect(result.message).toContain('reset link');
    });

    it('returns success message even if email not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.forgotPassword('missing@example.com');

      expect(result.message).toContain('reset link');
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      redis.get.mockResolvedValue('user-1');
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed');
      prisma.user.update.mockResolvedValue(mockUser);
      redis.del.mockResolvedValue(1);
      prisma.session.deleteMany.mockResolvedValue({ count: 1 });

      const result = await authService.resetPassword('valid-token', 'NewPass1');

      expect(redis.get).toHaveBeenCalledWith('password_reset:valid-token');
      expect(argon2.hash).toHaveBeenCalledWith('NewPass1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hashed' },
      });
      expect(redis.del).toHaveBeenCalledWith('password_reset:valid-token');
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual({ message: 'Password reset successful' });
    });

    it('throws BadRequestException on invalid token', async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        authService.resetPassword('bad-token', 'NewPass1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
