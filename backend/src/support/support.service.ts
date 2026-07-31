import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, subject: string, message: string) {
    return this.prisma.supportTicket.create({
      data: { userId, subject, message },
    });
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { items, total, page, limit, totalPages };
  }

  async findById(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  async addMessage(userId: string, ticketId: string, message: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const updatedMessage = `${ticket.message}\n\n[${new Date().toISOString()}] ${message}`;

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { message: updatedMessage },
    });
  }
}
