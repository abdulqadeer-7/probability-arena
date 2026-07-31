import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.acceptTerms) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          displayName: dto.displayName,
        },
      });

      await tx.practiceWallet.create({
        data: { userId: newUser.id },
      });

      return newUser;
    });

    const verificationToken = uuidv4();
    await this.redis.set(`email_verify:${verificationToken}`, user.id, 'EX', 86400);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    };
  }

  async login(user: any) {
    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
      });

      const session = await this.prisma.session.findFirst({
        where: { refreshToken },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedException('User not found');
      }

      await this.prisma.session.delete({ where: { id: session.id } });

      return this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      });
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: { userId, refreshToken },
    });
  }

  async generateTokens(user: any) {
    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = this.generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
    };
  }

  private generateAccessToken(payload: {
    sub: string;
    email: string;
    role: string;
  }): string {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  private generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
        expiresIn: '7d',
      },
    );
  }

  async verifyEmail(token: string) {
    const userId = await this.redis.get(`email_verify:${token}`);

    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    await this.redis.del(`email_verify:${token}`);

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const resetToken = uuidv4();
    await this.redis.set(`password_reset:${resetToken}`, user.id, 'EX', 900);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.redis.get(`password_reset:${token}`);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.redis.del(`password_reset:${token}`);

    await this.prisma.session.deleteMany({ where: { userId } });

    return { message: 'Password reset successful' };
  }

  async setup2fa(userId: string) {
    const secret = crypto.randomBytes(20).toString('hex');
    await this.redis.set(`2fa_setup:${userId}`, secret, 'EX', 300);

    return {
      secret,
      uri: `otpauth://totp/AeroArcade:${userId}?secret=${secret}&issuer=AeroArcade`,
    };
  }

  async verify2fa(userId: string, token: string) {
    const storedSecret = await this.redis.get(`2fa_setup:${userId}`);

    if (!storedSecret) {
      throw new BadRequestException('2FA setup not initiated or expired');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: storedSecret },
    });

    await this.redis.del(`2fa_setup:${userId}`);

    return { message: '2FA enabled successfully' };
  }
}
