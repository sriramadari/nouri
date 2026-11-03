import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Screen, Text } from '@/components/ui';
import { buildFocusAreas } from '@/lib/health/focus-areas';
import { calculateTargets } from '@/lib/health/targets';
import { useProfileStore } from '@/lib/storage/profile-store';
import { colors, radii, spacing } from '@/theme';

import { activityTitle, goalTitle } from './options';

const formatNumber = (value: number) => value.toLocaleString('en-IN');

/**
 * The payoff of onboarding: two clear numbers, how they were worked out, and the 2 or 3
 * things to focus on, each with a reason. Also reachable later from Today.
 */
export function PlanScreen() {
  const router = useRouter();
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const profile = useProfileStore((state) => state.profile);
  const targets = useProfileStore((state) => state.targets);
  const flaggedMarkers = useProfileStore((state) => state.flaggedMarkers);

  if (!profile || !targets) return <Redirect href="/onboarding" />;

  const breakdown = calculateTargets(profile);
  const focusAreas = buildFocusAreas({
    goal: profile.goal,
    activityLevel: profile.activityLevel,
    calorieTarget: targets.calories,
    proteinTarget: targets.proteinG,
    flaggedMarkers,
  });
  const isFirstVisit = welcome === '1';

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.intro}>
        <Text variant="eyebrow" color="brandText">
          Your plan · {goalTitle(profile.goal)}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {profile.name}, this is your daily katori
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.hero}>
        <TargetFigure value={formatNumber(targets.calories)} unit="kcal" label="Calories a day" />
        <View style={styles.heroDivider} />
        <TargetFigure value={String(targets.proteinG)} unit="grams" label="Protein a day" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Card tone="surfaceMuted" style={styles.maths}>
          <Text variant="eyebrow" color="textSecondary">
            How Katori worked this out
          </Text>
          <Text color="textSecondary">
            Your body uses about {formatNumber(breakdown.bmr)} kcal at rest and about{' '}
            {formatNumber(breakdown.maintenanceCalories)} kcal on a typical day (
            {activityTitle(profile.activityLevel).toLowerCase()}).{' '}
            {caloriesReason(breakdown.deficit, targets.calories, profile.goal === 'LOSE_WEIGHT')}
          </Text>
          <Text color="textSecondary">
            Protein is {profile.goal === 'LOSE_WEIGHT' ? '1.2' : '1'} g for each kg you weigh
            {profile.goal === 'LOSE_WEIGHT' ? ', a little higher to protect muscle.' : '.'}
          </Text>
        </Card>
      </Animated.View>

      <View style={styles.focus}>
        <Text variant="heading" accessibilityRole="header">
          Focus on these, in this order
        </Text>
        {focusAreas.map((area, index) => (
          <Animated.View
            key={area.id}
            entering={FadeInDown.delay(450 + index * 120).duration(500)}
            style={styles.focusRow}
          >
            <Text variant="display" color="brand" style={styles.numeral}>
              {index + 1}
            </Text>
            <View style={styles.focusText}>
              <Text variant="bodyStrong">{area.title}</Text>
              <Text color="textSecondary">{area.why}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Button
        label={isFirstVisit ? 'Start my day' : 'Done'}
        onPress={() => (router.canGoBack() && !isFirstVisit ? router.back() : router.replace('/'))}
        fullWidth
      />
    </Screen>
  );
}

function caloriesReason(deficit: number, calories: number, losingWeight: boolean): string {
  if (!losingWeight) return 'Your target matches that, so your energy stays steady.';
  if (deficit >= 500) return `Eating ${deficit} kcal less than that loses about 0.5 kg a week.`;
  return `Katori keeps you at a safe minimum of ${formatNumber(calories)} kcal, so you still lose steadily.`;
}

function TargetFigure({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <View style={styles.figure} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <Text variant="eyebrow" color="textOnPrimaryMuted">
        {label}
      </Text>
      <Text variant="display" color="textOnPrimary">
        {value}
      </Text>
      <Text variant="heading" color="brand">
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs },
  hero: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
  },
  heroDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.textOnPrimaryMuted },
  figure: { flex: 1, gap: spacing.xs },
  maths: { borderWidth: 0, shadowOpacity: 0, elevation: 0 },
  focus: { gap: spacing.lg },
  focusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  numeral: { width: 32, lineHeight: 42 },
  focusText: { flex: 1, gap: spacing.xxs, paddingTop: spacing.xs },
});
