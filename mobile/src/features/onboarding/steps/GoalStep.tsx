import { Icon, OptionCard, Text } from '@/components/ui';

import { StepLayout } from '../components/StepLayout';
import { GOAL_OPTIONS } from '../options';
import { useOnboardingDraft } from '../onboarding-draft';
import { useStepNavigation } from '../steps';
import { useFieldErrors } from '../use-field-errors';

export function GoalStep() {
  const { goal, update } = useOnboardingDraft();
  const { goNext } = useStepNavigation('goal');
  const { errors, submit } = useFieldErrors(() => ({
    goal: goal ? null : 'Pick the goal that matters most right now.',
  }));

  return (
    <StepLayout
      step="goal"
      title="What matters most right now?"
      subtitle="One goal keeps things simple. Katori shapes your plan around it."
      onContinue={() => submit() && goNext?.()}
    >
      {GOAL_OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          title={option.title}
          description={option.description}
          selected={goal === option.value}
          onPress={() => update({ goal: option.value })}
          leading={
            <Icon
              name={option.icon}
              color={goal === option.value ? 'brandText' : 'textSecondary'}
            />
          }
        />
      ))}
      {errors.goal ? (
        <Text variant="caption" color="danger" accessibilityRole="alert">
          {errors.goal}
        </Text>
      ) : null}
    </StepLayout>
  );
}
