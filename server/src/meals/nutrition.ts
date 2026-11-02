export interface Nutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const ZERO_NUTRITION: Nutrition = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

/** Items below this confidence are flagged so the user confirms them before saving. */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

/** Totals are always summed in code from the items, never taken from the AI or the client. */
export function sumNutrition(items: Nutrition[]): Nutrition {
  const total = items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      proteinG: sum.proteinG + item.proteinG,
      carbsG: sum.carbsG + item.carbsG,
      fatG: sum.fatG + item.fatG,
    }),
    ZERO_NUTRITION,
  );
  return {
    calories: Math.round(total.calories),
    proteinG: roundToTenth(total.proteinG),
    carbsG: roundToTenth(total.carbsG),
    fatG: roundToTenth(total.fatG),
  };
}

/** The meal's confidence is its weakest item: one doubtful item makes the meal doubtful. */
export function overallConfidence(items: { confidence?: number }[]): number | null {
  const known = items.map((item) => item.confidence).filter((c): c is number => c !== undefined);
  return known.length > 0 ? Math.min(...known) : null;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
