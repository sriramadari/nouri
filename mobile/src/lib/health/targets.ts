import type { ActivityLevel, Goal, Sex } from '../api/types';

export interface TargetInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface TargetBreakdown {
  /** Daily calorie target. */
  calories: number;
  /** Daily protein target in grams. */
  proteinG: number;
  /** Energy the body uses at rest (Mifflin St Jeor). */
  bmr: number;
  /** Energy used on a normal day including activity. */
  maintenanceCalories: number;
  /** Calories removed for the goal (0 unless losing weight). */
  deficit: number;
}

/**
 * The same formula and constants as server/src/users/targets.ts. The server stays the source
 * of truth; this copy lets the plan appear instantly, offline, and explain itself.
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const WEIGHT_LOSS_DEFICIT_KCAL = 500;
const MIN_CALORIES: Record<Sex, number> = { MALE: 1500, FEMALE: 1200 };
const PROTEIN_PER_KG: Record<Goal, number> = {
  LOSE_WEIGHT: 1.2,
  CONTROL_SUGAR: 1.0,
  EAT_BETTER: 1.0,
};

export function calculateBmr({ sex, age, heightCm, weightKg }: TargetInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'MALE' ? base + 5 : base - 161;
}

export function calculateTargets(input: TargetInput): TargetBreakdown {
  const bmr = calculateBmr(input);
  const maintenance = bmr * ACTIVITY_FACTORS[input.activityLevel];
  const goalCalories =
    input.goal === 'LOSE_WEIGHT'
      ? Math.max(maintenance - WEIGHT_LOSS_DEFICIT_KCAL, MIN_CALORIES[input.sex])
      : maintenance;
  const calories = roundTo(goalCalories, 50);
  const maintenanceCalories = roundTo(maintenance, 50);

  return {
    calories,
    proteinG: roundTo(input.weightKg * PROTEIN_PER_KG[input.goal], 5),
    bmr: Math.round(bmr),
    maintenanceCalories,
    deficit: Math.max(maintenanceCalories - calories, 0),
  };
}

/** Body mass index, kg/m². */
export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}
