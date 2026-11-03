import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, TextField } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { StepLayout } from '../components/StepLayout';
import { useOnboardingDraft } from '../onboarding-draft';
import { useStepNavigation } from '../steps';
import { useFieldErrors } from '../use-field-errors';
import {
  cmToFeetInches,
  feetInchesToCm,
  parseNumber,
  validateHeight,
  validateWeight,
} from '../validation';

type HeightUnit = 'cm' | 'ftin';

export function BodyStep() {
  const { heightCm, weightKg, heightUnit, update } = useOnboardingDraft();
  const initialFeet = heightCm === null ? null : cmToFeetInches(heightCm);
  const [cmText, setCmText] = useState(heightCm === null ? '' : String(Math.round(heightCm)));
  const [feetText, setFeetText] = useState(initialFeet ? String(initialFeet.feet) : '');
  const [inchesText, setInchesText] = useState(initialFeet ? String(initialFeet.inches) : '');
  const [weightText, setWeightText] = useState(weightKg === null ? '' : String(weightKg));
  const { goNext } = useStepNavigation('body');
  const { errors, submit } = useFieldErrors(() => ({
    height: validateHeight(heightCm),
    weight: validateWeight(weightKg),
  }));

  const setFeetInches = (feet: string, inches: string) => {
    setFeetText(feet);
    setInchesText(inches);
    const parsedFeet = parseNumber(feet);
    update({
      heightCm: parsedFeet === null ? null : feetInchesToCm(parsedFeet, parseNumber(inches) ?? 0),
    });
  };

  const switchUnit = (unit: HeightUnit) => {
    // Carry the height across, so switching units never loses the answer.
    if (heightCm !== null) {
      const { feet, inches } = cmToFeetInches(heightCm);
      setCmText(String(Math.round(heightCm)));
      setFeetText(String(feet));
      setInchesText(String(inches));
    }
    update({ heightUnit: unit });
  };

  const onContinue = () => {
    if (submit()) goNext?.();
  };

  return (
    <StepLayout
      step="body"
      title="Your height and weight"
      subtitle="Katori uses these to work out your daily calories. Rough numbers are fine."
      onContinue={onContinue}
    >
      <View style={styles.labelRow}>
        <Text variant="label" color="textSecondary">
          Height
        </Text>
        <UnitToggle value={heightUnit} onChange={switchUnit} />
      </View>
      {heightUnit === 'cm' ? (
        <TextField
          label="Height in centimetres"
          value={cmText}
          onChangeText={(text) => {
            setCmText(text);
            update({ heightCm: parseNumber(text) });
          }}
          error={errors.height}
          suffix="cm"
          keyboardType="decimal-pad"
          maxLength={5}
        />
      ) : (
        <View style={styles.row}>
          <TextField
            label="Feet"
            value={feetText}
            onChangeText={(text) => setFeetInches(text, inchesText)}
            error={errors.height}
            suffix="ft"
            keyboardType="number-pad"
            maxLength={1}
          />
          <TextField
            label="Inches"
            value={inchesText}
            onChangeText={(text) => setFeetInches(feetText, text)}
            suffix="in"
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      )}
      <TextField
        label="Weight"
        value={weightText}
        onChangeText={(text) => {
          setWeightText(text);
          update({ weightKg: parseNumber(text) });
        }}
        error={errors.weight}
        suffix="kg"
        keyboardType="decimal-pad"
        maxLength={5}
      />
    </StepLayout>
  );
}

function UnitToggle({
  value,
  onChange,
}: {
  value: HeightUnit;
  onChange: (unit: HeightUnit) => void;
}) {
  const options: { unit: HeightUnit; label: string }[] = [
    { unit: 'cm', label: 'cm' },
    { unit: 'ftin', label: 'ft / in' },
  ];
  return (
    <View style={styles.toggle} accessibilityRole="radiogroup" accessibilityLabel="Height unit">
      {options.map(({ unit, label }) => (
        <Pressable
          key={unit}
          onPress={() => onChange(unit)}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === unit }}
          hitSlop={6}
          style={[styles.toggleOption, value === unit && styles.toggleSelected]}
        >
          <Text variant="label" color={value === unit ? 'textOnPrimary' : 'textSecondary'}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: spacing.md },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: spacing.xxs,
  },
  toggleOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
  },
  toggleSelected: { backgroundColor: colors.primary },
});
