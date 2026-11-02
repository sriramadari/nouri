import type { Meal } from '../generated/prisma/client.js';
import type { MealSource } from '../generated/prisma/enums.js';
import { LOW_CONFIDENCE_THRESHOLD, type Nutrition } from './nutrition.js';
import type { SavedMealItem } from './meals.schemas.js';

export interface DraftItem extends SavedMealItem {
  /** True when the AI was unsure, so the app asks the user to check it. */
  needsReview: boolean;
}

/** An analysed meal that has not been saved yet. */
export interface MealDraft {
  source: MealSource;
  items: DraftItem[];
  totals: Nutrition;
  confidence: number | null;
  needsReview: boolean;
  /** For voice notes: what Nouri heard, shown so the user can spot a mishearing. */
  transcript?: string;
}

export interface MealResponse {
  id: string;
  clientRequestId: string;
  eatenAt: string;
  source: MealSource;
  items: SavedMealItem[];
  totals: Nutrition;
  confidence: number | null;
}

export interface DayMealsResponse {
  date: string;
  meals: MealResponse[];
  totals: Nutrition;
}

export function toDraftItem(item: SavedMealItem): DraftItem {
  return {
    ...item,
    needsReview: item.confidence !== undefined && item.confidence < LOW_CONFIDENCE_THRESHOLD,
  };
}

export function toMealResponse(meal: Meal): MealResponse {
  return {
    id: meal.id,
    clientRequestId: meal.clientRequestId,
    eatenAt: meal.eatenAt.toISOString(),
    source: meal.source,
    // Written only by MealsService from validated input, so the stored shape is known.
    items: meal.items as unknown as SavedMealItem[],
    totals: {
      calories: meal.calories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
    },
    confidence: meal.confidence,
  };
}
