import type { ActivityLevel, Goal } from '@/lib/api/types';

/** Choices shown in onboarding, also used to describe the plan in the same words. */
export const ACTIVITY_OPTIONS: { value: ActivityLevel; title: string; description: string }[] = [
  { value: 'SEDENTARY', title: 'Mostly sitting', description: 'Desk job, little exercise' },
  {
    value: 'LIGHT',
    title: 'Lightly active',
    description: 'Walks or light workouts 1 to 3 days a week',
  },
  { value: 'MODERATE', title: 'Moderately active', description: 'Exercise 3 to 5 days a week' },
  { value: 'ACTIVE', title: 'Very active', description: 'Hard exercise 6 to 7 days a week' },
  {
    value: 'VERY_ACTIVE',
    title: 'Athlete level',
    description: 'Physical job or training twice a day',
  },
];

export const GOAL_OPTIONS: { value: Goal; title: string; description: string }[] = [
  { value: 'LOSE_WEIGHT', title: 'Lose weight', description: 'Steadily, about 0.5 kg a week' },
  {
    value: 'CONTROL_SUGAR',
    title: 'Control blood sugar',
    description: 'Steadier energy and a better HbA1c',
  },
  {
    value: 'EAT_BETTER',
    title: 'Eat better',
    description: 'More protein, more balance, more energy',
  },
];

export const activityTitle = (level: ActivityLevel) =>
  ACTIVITY_OPTIONS.find((option) => option.value === level)?.title ?? level;

export const goalTitle = (goal: Goal) =>
  GOAL_OPTIONS.find((option) => option.value === goal)?.title ?? goal;
