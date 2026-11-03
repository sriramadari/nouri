import { Inject, Injectable } from '@nestjs/common';

import { AI_PROVIDER, type AiProvider } from '../ai/ai-provider.js';
import type { MealAnalysis } from '../ai/ai.schemas.js';
import { AppError } from '../common/errors/app-error.js';
import { IMAGE_TYPES } from '../common/files/uploads.js';
import type { User } from '../generated/prisma/client.js';
import {
  type DayMealsResponse,
  type MealDraft,
  type MealResponse,
  toDraftItem,
  toMealResponse,
} from './meal.response.js';
import { type DayTotals, MealsRepository } from './meals.repository.js';
import type {
  CreateMealInput,
  ListMealsQuery,
  StreakQuery,
  SummaryQuery,
} from './meals.schemas.js';
import { overallConfidence, sumNutrition } from './nutrition.js';
import { computeStreak, type Streak } from './streak.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MealUpload {
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class MealsService {
  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    private readonly meals: MealsRepository,
  ) {}

  /** Turns a photo or voice note into an editable draft. Nothing is saved yet. */
  async analyze(upload: MealUpload): Promise<MealDraft> {
    if (IMAGE_TYPES.includes(upload.mimetype)) {
      const analysis = await this.ai.analyzeMealImage(upload.buffer, upload.mimetype);
      assertUsable(analysis, true);
      return toDraft('PHOTO', analysis);
    }

    const analysis = await this.ai.parseMealVoice(upload.buffer, upload.mimetype);
    // Models can invent a meal from silence, so a usable note needs both a yes on speech and
    // actual words. Either missing means nothing was said, whatever items came back.
    const heardNothing = !analysis.speechDetected || analysis.transcript.trim().length === 0;
    assertUsable(heardNothing ? { issue: 'UNCLEAR', items: [] } : analysis, false);
    return { ...toDraft('VOICE', analysis), transcript: analysis.transcript.trim() };
  }

  /** Saves a confirmed meal. Safe to call again with the same clientRequestId. */
  async save(user: User, input: CreateMealInput): Promise<MealResponse> {
    const { meal } = await this.meals.createOnce({
      userId: user.id,
      clientRequestId: input.clientRequestId,
      eatenAt: new Date(input.eatenAt),
      source: input.source,
      items: input.items,
      confidence: overallConfidence(input.items),
      ...sumNutrition(input.items),
    });
    return toMealResponse(meal);
  }

  async streak(user: User, query: StreakQuery): Promise<Streak> {
    const days = await this.meals.findLoggedDays(user.id, query.tzOffsetMinutes);
    return computeStreak(days, localToday(query.tzOffsetMinutes));
  }

  /**
   * Totals for each of the last `days` local days, oldest first, with empty days filled in
   * as zeros so the app can show a full week.
   */
  async summary(user: User, query: SummaryQuery): Promise<{ days: DayTotals[] }> {
    const today = localToday(query.tzOffsetMinutes);
    const dates = Array.from({ length: query.days }, (_, i) =>
      new Date(Date.parse(`${today}T00:00:00Z`) - (query.days - 1 - i) * DAY_MS)
        .toISOString()
        .slice(0, 10),
    );
    const totals = await this.meals.sumByDay(
      user.id,
      startOfLocalDay(dates[0]!, query.tzOffsetMinutes),
      query.tzOffsetMinutes,
    );
    const byDate = new Map(totals.map((day) => [day.date, day]));
    return {
      days: dates.map((date) => byDate.get(date) ?? { date, meals: 0, calories: 0, proteinG: 0 }),
    };
  }

  /** Meals for one local calendar day, with the day's totals. */
  async listForDay(user: User, query: ListMealsQuery): Promise<DayMealsResponse> {
    const from = startOfLocalDay(query.date, query.tzOffsetMinutes);
    const meals = (
      await this.meals.findBetween(user.id, from, new Date(from.getTime() + DAY_MS))
    ).map(toMealResponse);
    return { date: query.date, meals, totals: sumNutrition(meals.map((meal) => meal.totals)) };
  }
}

function toDraft(source: 'PHOTO' | 'VOICE', analysis: MealAnalysis): MealDraft {
  const items = analysis.items.map(toDraftItem);
  return {
    source,
    items,
    totals: sumNutrition(items),
    confidence: overallConfidence(items),
    needsReview: items.some((item) => item.needsReview),
  };
}

export function localToday(tzOffsetMinutes: number, now: Date = new Date()): string {
  return new Date(now.getTime() + tzOffsetMinutes * 60 * 1000).toISOString().slice(0, 10);
}

function assertUsable(analysis: MealAnalysis, isPhoto: boolean): void {
  if (analysis.issue === 'NOT_FOOD') {
    throw new AppError(
      'MEAL_NOT_RECOGNIZED',
      isPhoto
        ? "That doesn't look like food. Try another photo or add it by hand."
        : "That didn't sound like a meal. Try again or add it by hand.",
    );
  }
  if (analysis.issue === 'UNCLEAR' || analysis.items.length === 0) {
    throw isPhoto
      ? new AppError(
          'MEAL_NOT_RECOGNIZED',
          "Katori couldn't make out the food. Try a clearer, well lit photo or add it by hand.",
        )
      : new AppError(
          'VOICE_NOT_UNDERSTOOD',
          'Katori couldn\'t catch that. Try again, for example "two rotis, dal and curd".',
        );
  }
}

/** UTC instant when the given local date starts, e.g. 2026-11-02 at UTC+5:30 → 2026-11-01T18:30Z. */
export function startOfLocalDay(date: string, tzOffsetMinutes: number): Date {
  return new Date(Date.parse(`${date}T00:00:00Z`) - tzOffsetMinutes * 60 * 1000);
}
