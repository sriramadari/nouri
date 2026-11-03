import { OptionCard, Text } from '@/components/ui';

import { LevelBars } from '../components/LevelBars';
import { StepLayout } from '../components/StepLayout';
import { ACTIVITY_OPTIONS } from '../options';
import { useOnboardingDraft } from '../onboarding-draft';
import { useStepNavigation } from '../steps';
import { useFieldErrors } from '../use-field-errors';

export function ActivityStep() {
  const { activityLevel, update } = useOnboardingDraft();
  const { goNext } = useStepNavigation('activity');
  const { errors, submit } = useFieldErrors(() => ({
    activity: activityLevel ? null : 'Pick the one closest to a normal week.',
  }));

  return (
    <StepLayout
      step="activity"
      title="How active is a normal week?"
      subtitle="Be honest, not hopeful. You can change it later."
      onContinue={() => submit() && goNext?.()}
    >
      {ACTIVITY_OPTIONS.map((option, index) => (
        <OptionCard
          key={option.value}
          title={option.title}
          description={option.description}
          selected={activityLevel === option.value}
          onPress={() => update({ activityLevel: option.value })}
          leading={
            <LevelBars
              level={index + 1}
              of={ACTIVITY_OPTIONS.length}
              active={activityLevel === option.value}
            />
          }
        />
      ))}
      {errors.activity ? (
        <Text variant="caption" color="danger" accessibilityRole="alert">
          {errors.activity}
        </Text>
      ) : null}
    </StepLayout>
  );
}
