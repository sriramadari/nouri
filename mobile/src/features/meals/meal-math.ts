import { randomUUID } from 'expo-crypto';

import type { CreateMealInput, MealDraft, MealItem, MealSource, Nutrition } from '@/lib/api/types';

/** One food in the review sheet: what the AI (or the person) said, plus their portion tweak. */
export interface EditableItem {
  key: string;
  name: string;
  portion: string;
  /** Nutrition for the portion as described, before scaling. */
  base: Nutrition;
  /** Portion multiplier chosen by the person, e.g. 1.5 for "a bit more". */
  scale: number;
  confidence?: number;
  /** Highlighted until the person confirms or changes it. */
  needsReview: boolean;
}

export interface EditableMeal {
  /** Created once per meal and reused on every save attempt, so retries never duplicate. */
  clientRequestId: string;
  source: MealSource;
  transcript?: string;
  items: EditableItem[];
}

export const PORTION_STEPS = [0.5, 1, 1.5, 2, 3] as const;

export function fromDraft(draft: MealDraft): EditableMeal {
  return {
    clientRequestId: randomUUID(),
    source: draft.source,
    transcript: draft.transcript,
    items: draft.items.map((item) => ({
      key: randomUUID(),
      name: item.name,
      portion: item.portion,
      base: pickNutrition(item),
      scale: 1,
      confidence: item.confidence,
      needsReview: item.needsReview,
    })),
  };
}

export function emptyManualMeal(): EditableMeal {
  return { clientRequestId: randomUUID(), source: 'MANUAL', items: [] };
}

export function manualItem(name: string, calories: number, proteinG: number): EditableItem {
  return {
    key: randomUUID(),
    name: name.trim(),
    portion: '1 serving',
    base: { calories, proteinG, carbsG: 0, fatG: 0 },
    scale: 1,
    needsReview: false,
  };
}

export function itemNutrition(item: EditableItem): Nutrition {
  return {
    calories: Math.round(item.base.calories * item.scale),
    proteinG: roundToTenth(item.base.proteinG * item.scale),
    carbsG: roundToTenth(item.base.carbsG * item.scale),
    fatG: roundToTenth(item.base.fatG * item.scale),
  };
}

export function sumNutrition(parts: Nutrition[]): Nutrition {
  return parts.reduce(
    (total, part) => ({
      calories: total.calories + part.calories,
      proteinG: roundToTenth(total.proteinG + part.proteinG),
      carbsG: roundToTenth(total.carbsG + part.carbsG),
      fatG: roundToTenth(total.fatG + part.fatG),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export const mealTotals = (meal: EditableMeal) => sumNutrition(meal.items.map(itemNutrition));

/** Moves the portion one step smaller or bigger, staying within the allowed steps. */
export function stepPortion(scale: number, direction: -1 | 1): number {
  const index = PORTION_STEPS.findIndex((step) => step >= scale);
  const current = index === -1 ? PORTION_STEPS.length - 1 : index;
  const next = Math.min(Math.max(current + direction, 0), PORTION_STEPS.length - 1);
  return PORTION_STEPS[next] ?? scale;
}

/** "1 katori (150 g)" scaled by 1.5 reads "1 katori (150 g) × 1.5". */
export function portionLabel(item: Pick<EditableItem, 'portion' | 'scale'>): string {
  return item.scale === 1 ? item.portion : `${item.portion} × ${item.scale}`;
}

export function toCreateMealInput(meal: EditableMeal, eatenAt: Date = new Date()): CreateMealInput {
  return {
    clientRequestId: meal.clientRequestId,
    eatenAt: eatenAt.toISOString(),
    source: meal.source,
    items: meal.items.map((item): MealItem => ({
      name: item.name,
      portion: portionLabel(item),
      ...itemNutrition(item),
      // A person who reviewed and kept an item has confirmed it.
      ...(item.confidence === undefined
        ? {}
        : { confidence: item.needsReview ? item.confidence : Math.max(item.confidence, 0.9) }),
    })),
  };
}

function pickNutrition({ calories, proteinG, carbsG, fatG }: Nutrition): Nutrition {
  return { calories, proteinG, carbsG, fatG };
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
