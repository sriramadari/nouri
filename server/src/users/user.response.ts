import type { ActivityLevel, Goal, Sex } from '../generated/prisma/enums.js';
import type { User } from '../generated/prisma/client.js';

/** What the API returns for a user. Profile and targets are null until onboarding is done. */
export interface UserResponse {
  id: string;
  profile: {
    name: string;
    age: number;
    sex: Sex;
    heightCm: number;
    weightKg: number;
    activityLevel: ActivityLevel;
    goal: Goal;
  } | null;
  targets: { calories: number; proteinG: number } | null;
  createdAt: string;
}

export function toUserResponse(user: User): UserResponse {
  const { name, age, sex, heightCm, weightKg, activityLevel, goal } = user;
  const hasProfile =
    name !== null &&
    age !== null &&
    sex !== null &&
    heightCm !== null &&
    weightKg !== null &&
    activityLevel !== null &&
    goal !== null;

  return {
    id: user.id,
    profile: hasProfile ? { name, age, sex, heightCm, weightKg, activityLevel, goal } : null,
    targets:
      user.calorieTarget !== null && user.proteinTarget !== null
        ? { calories: user.calorieTarget, proteinG: user.proteinTarget }
        : null,
    createdAt: user.createdAt.toISOString(),
  };
}
