import { z } from 'zod';

import { mealItemSchema } from '../ai/ai.schemas.js';
import { MealSource } from '../generated/prisma/enums.js';

/** Five minutes of slack for phones whose clocks run slightly fast. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/** Items the user saves. Confidence is optional because hand added items have none. */
export const savedMealItemSchema = mealItemSchema.extend({
  confidence: mealItemSchema.shape.confidence.optional(),
});

export const createMealSchema = z.object({
  /** Generated on the phone before the first attempt and reused on every retry. */
  clientRequestId: z.uuid(),
  eatenAt: z.iso
    .datetime({ offset: true })
    .refine(
      (value) => Date.parse(value) <= Date.now() + CLOCK_SKEW_MS,
      'eatenAt is in the future.',
    ),
  source: z.enum(MealSource),
  items: z.array(savedMealItemSchema).min(1, 'Add at least one food.').max(20),
});

export const listMealsQuerySchema = z.object({
  date: z.iso.date(),
  /**
   * Minutes ahead of UTC on the phone, so "today" means the user's local day.
   * Defaults to India (UTC+5:30), the app's home market.
   */
  tzOffsetMinutes: z.coerce.number().int().min(-720).max(840).default(330),
});

export const streakQuerySchema = z.object({
  tzOffsetMinutes: z.coerce.number().int().min(-720).max(840).default(330),
});

export const summaryQuerySchema = streakQuerySchema.extend({
  days: z.coerce.number().int().min(1).max(31).default(7),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type StreakQuery = z.infer<typeof streakQuerySchema>;
export type SavedMealItem = z.infer<typeof savedMealItemSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type ListMealsQuery = z.infer<typeof listMealsQuerySchema>;
