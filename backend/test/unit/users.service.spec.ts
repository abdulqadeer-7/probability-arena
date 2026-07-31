import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';

jest.mock('argon2');

describe('UsersService', () => {
  let usersService: UsersService;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
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
    preferences: null,
  };

  const mockUserWithRelations = {
    ...mockUser,
    preferences: null,
    practiceWallet: null,
    gameRounds: [],
    userAchievements: [],
    challengeProgress: [],
    leaderboardEntries: [],
    supportTickets: [],
    notifications: [],
    quizAttempts: [],
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      session: {
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);

    prisma.user.findUnique.mockReset();
    prisma.user.findFirst.mockReset();
    prisma.user.update.mockReset();
    prisma.session.deleteMany.mockReset();

    (argon2.hash as jest.Mock).mockReset();
    (argon2.verify as jest.Mock).mockReset();
  });

  describe('findByEmail', () => {
    it('returns user without password', async () => {
      const safeUser = {
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        role: mockUser.role,
        isVerified: mockUser.isVerified,
        isGuest: mockUser.isGuest,
        createdAt: mockUser.createdAt,
      };
      prisma.user.findUnique.mockResolvedValue(safeUser);

      const result = await usersService.findByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.objectContaining({
          id: true,
          email: true,
          displayName: true,
        }),
      });
      expect(result).toEqual(safeUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('returns null when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await usersService.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user', async () => {
      const safeUser = {
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        role: mockUser.role,
        isVerified: mockUser.isVerified,
        isGuest: mockUser.isGuest,
        deletedAt: null,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        preferences: mockUser.preferences,
      };
      prisma.user.findUnique.mockResolvedValue(safeUser);

      const result = await usersService.findById('user-1');

      expect(result).toEqual(safeUser);
    });

    it('throws NotFoundException if user is deleted', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(usersService.findById('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates display name', async () => {
      const dto = { displayName: 'NewName' };
      const updatedUser = {
        id: mockUser.id,
        email: mockUser.email,
        displayName: 'NewName',
        avatarUrl: null,
        role: 'USER',
        isVerified: false,
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await usersService.updateProfile('user-1', dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { displayName: 'NewName', id: { not: 'user-1' } },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { displayName: 'NewName' },
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedUser);
    });

    it('throws ConflictException on duplicate display name', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.findFirst.mockResolvedValue({ id: 'other-user', displayName: 'TakenName' });

      await expect(
        usersService.updateProfile('user-1', { displayName: 'TakenName' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.updateProfile('missing', { displayName: 'Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    const currentPassword = 'CurrentPass1';
    const newPassword = 'NewPass1';

    it('updates password with valid current password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.session.deleteMany.mockResolvedValue({ count: 3 });

      const result = await usersService.updatePassword(
        'user-1',
        currentPassword,
        newPassword,
      );

      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.passwordHash,
        currentPassword,
      );
      expect(argon2.hash).toHaveBeenCalledWith(newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hashed-password' },
      });
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual({ message: 'Password updated successfully' });
    });

    it('throws ForbiddenException on wrong current password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        usersService.updatePassword('user-1', 'wrong', newPassword),
      ).rejects.toThrow(ForbiddenException);

      expect(argon2.hash).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.updatePassword('missing', 'pass', 'newPass'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('sets deletedAt', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      const result = await usersService.deleteAccount('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('throws NotFoundException if already deleted', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(usersService.deleteAccount('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.deleteAccount('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('exportData', () => {
    it('returns user data without sensitive fields', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithRelations);

      const result = await usersService.exportData('user-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('twoFactorSecret');
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });
    });

    it('throws NotFoundException if user deleted', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUserWithRelations,
        deletedAt: new Date(),
      });

      await expect(usersService.exportData('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
