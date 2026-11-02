/**
 * Response shapes of the Nouri API, mirrored from server/src. Kept by hand because the app and
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
  /** Stable id for markers Nouri understands, e.g. "LDL"; null for others. */
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
