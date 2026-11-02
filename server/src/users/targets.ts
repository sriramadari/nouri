import type { ActivityLevel, Goal, Sex } from '../generated/prisma/enums.js';

export interface TargetInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface Targets {
  calories: number;
  proteinG: number;
}

/** Standard multipliers that turn resting energy (BMR) into daily energy use (TDEE). */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

/** About 0.5 kg of fat loss per week. */
const WEIGHT_LOSS_DEFICIT_KCAL = 500;

/** Common safety floors so a deficit never drops intake too low. */
const MIN_CALORIES: Record<Sex, number> = { MALE: 1500, FEMALE: 1200 };

/** Grams of protein per kg of body weight. Higher in a deficit to protect muscle. */
const PROTEIN_PER_KG: Record<Goal, number> = {
  LOSE_WEIGHT: 1.2,
  CONTROL_SUGAR: 1.0,
  EAT_BETTER: 1.0,
};

/** Mifflin St Jeor equation: resting energy use in kcal per day. */
export function calculateBmr({ sex, age, heightCm, weightKg }: TargetInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'MALE' ? base + 5 : base - 161;
}

/**
 * Daily calorie and protein targets. Deterministic on purpose: the same profile always
 * gives the same plan, and the numbers can be explained line by line.
 * Only weight loss gets a calorie deficit; sugar control and eating better keep
 * maintenance calories and focus on what is eaten instead.
 */
export function calculateTargets(input: TargetInput): Targets {
  const maintenance = calculateBmr(input) * ACTIVITY_FACTORS[input.activityLevel];
  const goalCalories =
    input.goal === 'LOSE_WEIGHT'
      ? Math.max(maintenance - WEIGHT_LOSS_DEFICIT_KCAL, MIN_CALORIES[input.sex])
      : maintenance;

  return {
    calories: roundTo(goalCalories, 50),
    proteinG: roundTo(input.weightKg * PROTEIN_PER_KG[input.goal], 5),
  };
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}
