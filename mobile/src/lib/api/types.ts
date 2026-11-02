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
