import { TextField } from '@/components/ui';

import { StepLayout } from '../components/StepLayout';
import { useOnboardingDraft } from '../onboarding-draft';
import { useStepNavigation } from '../steps';
import { useFieldErrors } from '../use-field-errors';
import { validateName } from '../validation';

export function NameStep() {
  const name = useOnboardingDraft((state) => state.name);
  const update = useOnboardingDraft((state) => state.update);
  const { goNext } = useStepNavigation('name');
  const { errors, submit } = useFieldErrors(() => ({ name: validateName(name) }));

  const onContinue = () => {
    if (!submit()) return;
    update({ name: name.trim() });
    goNext?.();
  };

  return (
    <StepLayout
      step="name"
      title="First, what should I call you?"
      subtitle="I’ll use it when I check in during the day."
      onContinue={onContinue}
    >
      <TextField
        label="Your first name"
        value={name}
        onChangeText={(text) => update({ name: text })}
        error={errors.name}
        autoFocus
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
        onSubmitEditing={onContinue}
        maxLength={50}
      />
    </StepLayout>
  );
}
