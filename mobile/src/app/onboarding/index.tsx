import { Redirect } from 'expo-router';

import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { stepHref } from '@/features/onboarding/steps';

/** A fresh start opens the welcome screen; otherwise resume where the person left off. */
export default function OnboardingIndex() {
  const lastStep = useOnboardingDraft((state) => state.lastStep);
  const hasStarted = useOnboardingDraft((state) => state.name.trim() !== '');
  if (lastStep === 'name' && !hasStarted) return <Redirect href="/onboarding/welcome" />;
  return <Redirect href={stepHref(lastStep)} />;
}
