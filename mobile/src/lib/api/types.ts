/**
 * Response shapes of the Katori API, mirrored from server/src. Kept by hand because the app and
 * server ship separately; a shared package would be the next step if the API grows.
 */

export type Sex = 'MALE' | 'FEMALE';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
export type Goal = 'LOSE_WEIGHT' | 'CONTROL_SUGAR' | 'EAT_BETTER';

export interface Profile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface Targets {
  calories: number;
  proteinG: number;
}

export interface UserResponse {
  id: string;
  profile: Profile | null;
  targets: Targets | null;
  createdAt: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'connected' | 'disconnected';
  uptimeSeconds: number;
}

export type BiomarkerStatus = 'LOW' | 'NORMAL' | 'HIGH';

export interface Biomarker {
  id: string;
  /** Stable id for markers Katori understands, e.g. "LDL"; null for others. */
  key: string | null;
  name: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  status: BiomarkerStatus;
  why: string | null;
  action: string | null;
}

export interface ReportResponse {
  id: string;
  uploadedAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  /** Flagged markers first. */
  biomarkers: Biomarker[];
  flaggedCount: number;
  skipped?: { name: string; reason: 'VALUE_UNREADABLE' | 'NO_REFERENCE_RANGE' }[];
}

export type MealSource = 'PHOTO' | 'VOICE' | 'MANUAL';

export interface Nutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealItem extends Nutrition {
  name: string;
  portion: string;
  /** 0 to 1; absent for items added by hand. */
  confidence?: number;
}

/** An analysed meal that has not been saved yet. */
export interface MealDraft {
  source: MealSource;
  items: (MealItem & { needsReview: boolean })[];
  totals: Nutrition;
  confidence: number | null;
  needsReview: boolean;
  /** For voice notes: what Katori heard. */
  transcript?: string;
}

export interface CreateMealInput {
  /** Generated once per meal on the phone; makes saving safe to retry. */
  clientRequestId: string;
  eatenAt: string;
  source: MealSource;
  items: MealItem[];
}

export interface MealResponse {
  id: string;
  clientRequestId: string;
  eatenAt: string;
  source: MealSource;
  items: MealItem[];
  totals: Nutrition;
  confidence: number | null;
}

export interface DayMeals {
  date: string;
  meals: MealResponse[];
  totals: Nutrition;
}

export interface Streak {
  current: number;
  best: number;
  loggedToday: boolean;
}

export interface PhrasedInsight {
  message: string;
  why: string;
  source: 'ai' | 'rules';
}

export interface PhraseInsightInput {
  date: string;
  slot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  draft: { message: string; why: string };
  facts: { caloriesEaten: number; proteinEaten: number; flaggedMarkers: string[] };
}

export interface DayTotals {
  date: string;
  meals: number;
  calories: number;
  proteinG: number;
}
