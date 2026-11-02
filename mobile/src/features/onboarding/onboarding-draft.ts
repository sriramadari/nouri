import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ActivityLevel, Goal, Sex } from '@/lib/api/types';
import type { FlaggedMarker } from '@/lib/health/focus-areas';
import { persistStorage } from '@/lib/storage/persist';

export type OnboardingStep = 'name' | 'about' | 'body' | 'activity' | 'goal' | 'report';

/** Answers so far. Persisted, so going back or restarting the app never loses them. */
export interface OnboardingDraft {
  name: string;
  age: number | null;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  heightUnit: 'cm' | 'ftin';
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  /** Out of range results if a report was uploaded during onboarding. */
  flaggedMarkers: FlaggedMarker[];
  /** Where to resume after an app restart. */
  lastStep: OnboardingStep;
}

const EMPTY_DRAFT: OnboardingDraft = {
  name: '',
  age: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  heightUnit: 'cm',
  activityLevel: null,
  goal: null,
  flaggedMarkers: [],
  lastStep: 'name',
};

interface OnboardingDraftState extends OnboardingDraft {
  update: (changes: Partial<OnboardingDraft>) => void;
  reset: () => void;
}

export const useOnboardingDraft = create<OnboardingDraftState>()(
  persist(
    (set) => ({
      ...EMPTY_DRAFT,
      update: (changes) => set(changes),
      reset: () => set(EMPTY_DRAFT),
    }),
    { name: 'nouri.onboardingDraft', storage: persistStorage },
  ),
);
