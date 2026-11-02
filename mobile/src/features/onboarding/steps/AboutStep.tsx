import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OptionCard, Text, TextField } from '@/components/ui';
import type { Sex } from '@/lib/api/types';
import { spacing } from '@/theme';

import { StepLayout } from '../components/StepLayout';
import { useOnboardingDraft } from '../onboarding-draft';
import { useStepNavigation } from '../steps';
import { useFieldErrors } from '../use-field-errors';
import { parseNumber, validateAge } from '../validation';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'FEMALE', label: 'Female' },
  { value: 'MALE', label: 'Male' },
];

export function AboutStep() {
  const { name, age, sex, update } = useOnboardingDraft();
  const [ageText, setAgeText] = useState(age === null ? '' : String(age));
  const { goNext } = useStepNavigation('about');
  const { errors, submit } = useFieldErrors(() => ({
    age: validateAge(parseNumber(ageText)),
    sex: sex ? null : 'Please choose one.',
  }));

  const onContinue = () => {
    if (submit()) goNext?.();
  };

  return (
    <StepLayout
      step="about"
      title={`Nice to meet you, ${name.trim()}`}
      subtitle="A little about you, so your targets fit your body."
      onContinue={onContinue}
    >
      <TextField
        label="Age"
        value={ageText}
        onChangeText={(text) => {
          setAgeText(text);
          update({ age: parseNumber(text) });
        }}
        error={errors.age}
        suffix="years"
        keyboardType="number-pad"
        autoFocus
        maxLength={3}
      />
      <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel="Sex">
        <Text variant="label" color="textSecondary">
          Sex
        </Text>
        {SEX_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            title={option.label}
            selected={sex === option.value}
            onPress={() => update({ sex: option.value })}
          />
        ))}
        <Text variant="caption" color={errors.sex ? 'danger' : 'textSecondary'}>
          {errors.sex ?? 'Used only to calculate how much energy your body needs.'}
        </Text>
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
});
