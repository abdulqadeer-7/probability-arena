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
}
