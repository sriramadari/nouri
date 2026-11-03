import { type Href, useRouter } from 'expo-router';

import type { OnboardingDraft, OnboardingStep } from './onboarding-draft';

/** The order of the card steps. The last one (report) is optional and not counted. */
export const STEPS: OnboardingStep[] = ['name', 'about', 'body', 'activity', 'goal', 'report'];
export const COUNTED_STEPS = 5;

export const stepHref = (step: OnboardingStep) => `/onboarding/${step}` as Href;
const WELCOME_HREF = '/onboarding/welcome' as Href;

export function useStepNavigation(step: OnboardingStep) {
  const router = useRouter();
  const index = STEPS.indexOf(step);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  return {
    stepNumber: index + 1,
    goNext: next ? () => router.push(stepHref(next)) : undefined,
    // After an app restart there is no history, so back falls back to the previous step
    // (or the welcome screen from the first question).
    goBack: () => {
      const fallback = previous ? stepHref(previous) : WELCOME_HREF;
      if (router.canGoBack()) router.back();
      else router.replace(fallback);
    },
  };
}

/** The first step still missing an answer, or null when the profile is complete. */
export function firstIncompleteStep(draft: OnboardingDraft): OnboardingStep | null {
  if (!draft.name.trim()) return 'name';
  if (draft.age === null || draft.sex === null) return 'about';
  if (draft.heightCm === null || draft.weightKg === null) return 'body';
  if (draft.activityLevel === null) return 'activity';
  if (draft.goal === null) return 'goal';
  return null;
}
