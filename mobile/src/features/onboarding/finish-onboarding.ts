import { type Href, useRouter } from 'expo-router';
import { useCallback } from 'react';

import type { Profile } from '@/lib/api/types';
import { calculateTargets } from '@/lib/health/targets';
import { useProfileStore } from '@/lib/storage/profile-store';

import { type OnboardingDraft, useOnboardingDraft } from './onboarding-draft';
import { firstIncompleteStep, stepHref } from './steps';

export function draftToProfile(draft: OnboardingDraft): Profile | null {
  const { name, age, sex, heightCm, weightKg, activityLevel, goal } = draft;
  if (firstIncompleteStep(draft) !== null) return null;
  return {
    name: name.trim(),
    age: age!,
    sex: sex!,
    heightCm: heightCm!,
    weightKg: weightKg!,
    activityLevel: activityLevel!,
    goal: goal!,
  };
}

/**
 * Saves the profile on the phone and shows the plan straight away, even offline. The server
 * copy is synced in the background by useProfileSync.
 */
export function useFinishOnboarding() {
  const router = useRouter();

  return useCallback(() => {
    const draft = useOnboardingDraft.getState();
    const profile = draftToProfile(draft);
    if (!profile) {
      // An answer went missing (e.g. after a restart); send the person back to it.
      router.replace(stepHref(firstIncompleteStep(draft) ?? 'name'));
      return;
    }

    const { calories, proteinG } = calculateTargets(profile);
    useProfileStore
      .getState()
      .completeOnboarding(profile, { calories, proteinG }, draft.flaggedMarkers);
    router.replace('/plan?welcome=1' as Href);
    draft.reset();
  }, [router]);
}
