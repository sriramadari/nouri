import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { Prisma, type Meal } from '../generated/prisma/client.js';
import type { MealSource } from '../generated/prisma/enums.js';
import type { Nutrition } from './nutrition.js';
import type { SavedMealItem } from './meals.schemas.js';

export interface NewMeal extends Nutrition {
  userId: string;
  clientRequestId: string;
  eatenAt: Date;
  source: MealSource;
  items: SavedMealItem[];
  confidence: number | null;
}

@Injectable()
export class MealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts the meal once. If the same clientRequestId was already saved (a retry or a double
   * tap), returns the existing row instead of creating a duplicate.
   */
  async createOnce(meal: NewMeal): Promise<{ meal: Meal; created: boolean }> {
    try {
      return { meal: await this.prisma.meal.create({ data: meal }), created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const existing = await this.prisma.meal.findUniqueOrThrow({
        where: {
          userId_clientRequestId: { userId: meal.userId, clientRequestId: meal.clientRequestId },
        },
      });
      return { meal: existing, created: false };
    }
  }

  /** Distinct local days (YYYY-MM-DD) that have at least one meal, for the streak. */
  async findLoggedDays(userId: string, tzOffsetMinutes: number): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char("eatenAt" + make_interval(mins => ${tzOffsetMinutes}), 'YYYY-MM-DD') AS day
      FROM "Meal"
      WHERE "userId" = ${userId}
    `;
    return rows.map((row) => row.day);
  }

  findBetween(userId: string, from: Date, to: Date): Promise<Meal[]> {
    return this.prisma.meal.findMany({
      where: { userId, eatenAt: { gte: from, lt: to } },
      orderBy: { eatenAt: 'asc' },
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
