import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database connection timeout')), 10000),
        ),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Prisma initial connection failed: ${message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
