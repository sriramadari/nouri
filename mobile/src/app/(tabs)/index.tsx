import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { MealLogger } from '@/features/meals/components/MealLogger';
import { TodayMealList } from '@/features/meals/components/TodayMealList';
import { useTodayMeals } from '@/features/meals/use-today-meals';
import { useProfileStore } from '@/lib/storage/profile-store';
import { spacing } from '@/theme';

/** Today. Rings and the assistant card arrive with flow 3. */
export default function TodayScreen() {
  const name = useProfileStore((state) => state.profile?.name);
  const targets = useProfileStore((state) => state.targets);
  const today = useTodayMeals();

  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        Hi, {name}
      </Text>
      {targets ? (
        <Card tone="primaryTint">
          <Text variant="label" color="primary">
            TODAY
          </Text>
          <Text variant="heading">
            {today.totals.calories.toLocaleString('en-IN')} of{' '}
            {targets.calories.toLocaleString('en-IN')} kcal · {Math.round(today.totals.proteinG)} of{' '}
            {targets.proteinG} g protein
          </Text>
          <View style={styles.planLink}>
            <Link href="/plan" asChild>
              <Button label="See your plan" variant="secondary" icon="chevronRight" />
            </Link>
          </View>
        </Card>
      ) : null}
      <MealLogger />
      <TodayMealList
        meals={today.meals}
        isLoading={today.isLoading}
        error={today.error}
        onRetry={() => today.refetch()}
      />
      {__DEV__ ? (
        <Link href="/dev" asChild>
          <Button label="Open UI kit (dev only)" variant="ghost" icon="chevronRight" />
        </Link>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  planLink: { alignItems: 'flex-start', marginTop: spacing.xs },
});
