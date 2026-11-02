import type { MealDraft } from '@/lib/api/types';

import {
  type EditableMeal,
  fromDraft,
  manualItem,
  mealTotals,
  portionLabel,
  stepPortion,
  toCreateMealInput,
} from './meal-math';

const draft: MealDraft = {
  source: 'PHOTO',
  items: [
    {
      name: 'Roti',
      portion: '2 medium',
      calories: 240,
      proteinG: 8,
      carbsG: 44,
      fatG: 4,
      confidence: 0.92,
      needsReview: false,
    },
    {
      name: 'Aloo gobi',
      portion: '1 katori',
      calories: 150,
      proteinG: 3,
      carbsG: 16,
      fatG: 8,
      confidence: 0.55,
      needsReview: true,
    },
  ],
  totals: { calories: 390, proteinG: 11, carbsG: 60, fatG: 12 },
  confidence: 0.55,
  needsReview: true,
};

describe('meal math', () => {
  it('turns a draft into editable items with one idempotency key', () => {
    const meal = fromDraft(draft);
    expect(meal.clientRequestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(meal.items.map((item) => item.scale)).toEqual([1, 1]);
    expect(mealTotals(meal)).toEqual({ calories: 390, proteinG: 11, carbsG: 60, fatG: 12 });
  });

  it('scales a portion and the totals with it', () => {
    const meal = fromDraft(draft);
    meal.items[0]!.scale = 1.5;
    expect(mealTotals(meal).calories).toBe(240 * 1.5 + 150);
    expect(portionLabel(meal.items[0]!)).toBe('2 medium × 1.5');
  });

  it('steps portions through the allowed sizes and stops at the ends', () => {
    expect(stepPortion(1, 1)).toBe(1.5);
    expect(stepPortion(1, -1)).toBe(0.5);
    expect(stepPortion(0.5, -1)).toBe(0.5);
    expect(stepPortion(3, 1)).toBe(3);
  });

  it('builds the save payload with scaled values and keeps the same key on every call', () => {
    const meal: EditableMeal = fromDraft(draft);
    meal.items[1]!.needsReview = false; // the person confirmed the doubtful item
    const first = toCreateMealInput(meal, new Date('2026-11-03T07:30:00Z'));
    const retry = toCreateMealInput(meal, new Date('2026-11-03T07:30:05Z'));

    expect(first.clientRequestId).toBe(retry.clientRequestId);
    expect(first.eatenAt).toBe('2026-11-03T07:30:00.000Z');
    expect(first.items[1]).toMatchObject({ name: 'Aloo gobi', calories: 150, confidence: 0.9 });
  });

  it('adds hand entered items without a confidence', () => {
    const item = manualItem('  Masala chai ', 90, 3);
    expect(item).toMatchObject({ name: 'Masala chai', base: { calories: 90, proteinG: 3 } });
    const payload = toCreateMealInput({ clientRequestId: 'id', source: 'MANUAL', items: [item] });
    expect(payload.items[0]).not.toHaveProperty('confidence');
  });
});
