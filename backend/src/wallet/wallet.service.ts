import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.practiceWallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async deductBalance(userId: string, amount: number, reason?: string) {
    const wallet = await this.prisma.practiceWallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }
    return this.prisma.practiceWallet.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        totalSpent: { increment: amount },
      },
    });
  }

  async addBalance(userId: string, amount: number, reason?: string) {
    const wallet = await this.prisma.practiceWallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return this.prisma.practiceWallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount },
      },
    });
  }

  async resetBalance(userId: string) {
    const wallet = await this.prisma.practiceWallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return this.prisma.practiceWallet.update({
      where: { userId },
      data: {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        lastResetAt: new Date(),
      },
    });
  }

  async getTransactions(userId: string, page = 1, limit = 10) {
    const wallet = await this.prisma.practiceWallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.practiceTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.practiceTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);
    return { items, total, page, limit };
  }

  async getStats(userId: string) {
    const wallet = await this.prisma.practiceWallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
    };
  }
}
