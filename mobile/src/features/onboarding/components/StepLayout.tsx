import { useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components/ui';
import { colors, MAX_CONTENT_WIDTH, MIN_TAP_TARGET, radii, spacing } from '@/theme';

import { type OnboardingStep, useOnboardingDraft } from '../onboarding-draft';
import { COUNTED_STEPS, useStepNavigation } from '../steps';

interface StepLayoutProps {
  step: OnboardingStep;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Called by the main button; the step validates and moves on. */
  onContinue: () => void;
  continueLabel?: string;
  continueLoading?: boolean;
  /** Extra actions under the main button, e.g. "Skip for now". */
  secondary?: ReactNode;
}

/** Shared frame for every onboarding card: back, progress, one question, one main action. */
export function StepLayout({
  step,
  title,
  subtitle,
  children,
  onContinue,
  continueLabel = 'Continue',
  continueLoading = false,
  secondary,
}: StepLayoutProps) {
  const { stepNumber, goBack } = useStepNavigation(step);
  const update = useOnboardingDraft((state) => state.update);
  const counted = stepNumber <= COUNTED_STEPS;

  // Remember where the person is, so a restart resumes here with every answer intact.
  useFocusEffect(
    useCallback(() => {
      update({ lastStep: step });
    }, [step, update]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={styles.back}
          >
            <Icon name="chevronLeft" />
          </Pressable>
          {/* One segment per question, so the person can see how short this is. */}
          <View
            style={styles.segments}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={
              counted ? `Step ${stepNumber} of ${COUNTED_STEPS}` : 'Optional step'
            }
          >
            {Array.from({ length: COUNTED_STEPS }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.segment,
                  index < stepNumber && styles.segmentDone,
                  index === stepNumber - 1 && styles.segmentCurrent,
                ]}
              />
            ))}
          </View>
          <View style={styles.back} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text variant="eyebrow" color="brandText">
            {counted ? `Step ${stepNumber} of ${COUNTED_STEPS}` : 'Optional · last step'}
          </Text>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text color="textSecondary">{subtitle}</Text> : null}
          <View style={styles.content}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label={continueLabel} onPress={onContinue} loading={continueLoading} fullWidth />
          {secondary}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  back: {
    width: MIN_TAP_TARGET,
    height: MIN_TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segments: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 5, borderRadius: radii.pill, backgroundColor: colors.ringTrack },
  segmentDone: { backgroundColor: colors.textPrimary },
  segmentCurrent: { backgroundColor: colors.brand },
  body: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.sm, flexGrow: 1 },
  content: { marginTop: spacing.lg, gap: spacing.md },
  footer: { padding: spacing.lg, gap: spacing.sm },
});
