import { Injectable } from '@nestjs/common';

import { isUniqueViolation } from '../database/prisma-errors.js';
import { PrismaService } from '../database/prisma.service.js';
import type { Meal } from '../generated/prisma/client.js';
import type { MealSource } from '../generated/prisma/enums.js';
import type { Nutrition } from './nutrition.js';
import type { SavedMealItem } from './meals.schemas.js';

export interface DayTotals {
  date: string;
  meals: number;
  calories: number;
  proteinG: number;
}

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

  /** Calories, protein and meal count per local day since `from`. */
  async sumByDay(userId: string, from: Date, tzOffsetMinutes: number): Promise<DayTotals[]> {
    const rows = await this.prisma.$queryRaw<
      { day: string; meals: bigint; calories: bigint | null; protein: number | null }[]
    >`
      SELECT to_char("eatenAt" + make_interval(mins => ${tzOffsetMinutes}), 'YYYY-MM-DD') AS day,
             COUNT(*) AS meals,
             SUM("calories") AS calories,
             SUM("proteinG") AS protein
      FROM "Meal"
      WHERE "userId" = ${userId} AND "eatenAt" >= ${from}
      GROUP BY day
      ORDER BY day
    `;
    return rows.map((row) => ({
      date: row.day,
      meals: Number(row.meals),
      calories: Number(row.calories ?? 0),
      proteinG: Math.round((row.protein ?? 0) * 10) / 10,
    }));
  }

  findBetween(userId: string, from: Date, to: Date): Promise<Meal[]> {
    return this.prisma.meal.findMany({
      where: { userId, eatenAt: { gte: from, lt: to } },
      orderBy: { eatenAt: 'asc' },
    });
  }
}
