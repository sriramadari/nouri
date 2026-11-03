import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import type { InsightSlot } from '../generated/prisma/enums.js';

@Injectable()
export class InsightsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Keeps the latest message per user, day and time slot (a history of what Katori said). */
  async saveLatest(
    userId: string,
    date: string,
    slot: InsightSlot,
    insight: { message: string; why: string },
  ): Promise<void> {
    const day = new Date(`${date}T00:00:00Z`);
    await this.prisma.insight.upsert({
      where: { userId_date_slot: { userId, date: day, slot } },
      create: { userId, date: day, slot, ...insight },
      update: insight,
    });
  }
}
