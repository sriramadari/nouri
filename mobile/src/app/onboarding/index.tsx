import { Redirect } from 'expo-router';

import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { stepHref } from '@/features/onboarding/steps';

/** Resume where the person left off; their answers are already saved. */
export default function OnboardingIndex() {
  const lastStep = useOnboardingDraft((state) => state.lastStep);
  return <Redirect href={stepHref(lastStep)} />;
}
