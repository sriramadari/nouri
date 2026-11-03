import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

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
      <View style={styles.intro}>
        <Text variant="label" color="primary">
          YOUR PLAN
        </Text>
        <Text variant="title" accessibilityRole="header">
          {profile.name}, here’s your plan
        </Text>
        <Text color="textSecondary">Goal: {goalTitle(profile.goal).toLowerCase()}</Text>
      </View>

      <View style={styles.targets}>
        <TargetCard value={formatNumber(targets.calories)} unit="kcal a day" label="Calories" />
        <TargetCard value={String(targets.proteinG)} unit="g a day" label="Protein" />
      </View>

      <Card>
        <Text variant="heading">How Katori worked this out</Text>
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

      <View style={styles.focus}>
        <Text variant="heading" accessibilityRole="header">
          Your focus
        </Text>
        {focusAreas.map((area, index) => (
          <Card key={area.id} style={styles.focusCard}>
            <View style={styles.number}>
              <Text variant="label" color="textOnPrimary">
                {index + 1}
              </Text>
            </View>
            <View style={styles.focusText}>
              <Text variant="bodyStrong">{area.title}</Text>
              <Text color="textSecondary">{area.why}</Text>
            </View>
          </Card>
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

function TargetCard({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <Card style={styles.targetCard} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <Text variant="label" color="textSecondary">
        {label.toUpperCase()}
      </Text>
      <Text variant="display" color="primary">
        {value}
      </Text>
      <Text color="textSecondary">{unit}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs },
  targets: { flexDirection: 'row', gap: spacing.md },
  targetCard: { flex: 1, gap: spacing.xxs },
  focus: { gap: spacing.md },
  focusCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  number: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusText: { flex: 1, gap: spacing.xxs },
});
