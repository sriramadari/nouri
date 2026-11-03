import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Icon, Screen, Text } from '@/components/ui';
import { formatTime } from '@/lib/dates';
import { spacing } from '@/theme';

import { MealLogger } from './components/MealLogger';
import { useTodayMeals } from './use-today-meals';

/** Names the meal people are most likely logging right now, so the screen feels personal. */
function likelyMeal(hour: number): string {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 19) return 'a snack';
  return 'dinner';
}

/**
 * The centre tab: one place to log a meal. Snap is the hero, Speak sits right under it, and
 * the gallery and typing are there for when neither fits. After saving, Today opens so the
 * person sees their rings move.
 */
export function LogMealScreen() {
  const router = useRouter();
  const today = useTodayMeals();
  const now = new Date();

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="eyebrow" color="brandText">
          Logging {likelyMeal(now.getHours())} · {formatTime(now.toISOString())}
        </Text>
        <Text variant="title" accessibilityRole="header">
          What did you eat?
        </Text>
        <Text color="textSecondary">Snap the plate or say it. Katori does the counting.</Text>
      </View>

      <MealLogger onSaved={() => router.navigate('/')} />

      <Card tone="surfaceMuted" style={styles.tip}>
        <Icon name="sparkles" size={18} color="brandText" />
        <Text variant="caption" color="textSecondary" style={styles.tipText}>
          Speaking? Say portions the way you would to a friend: “two rotis, a katori of dal and some
          curd”. Hindi or English both work.
        </Text>
      </Card>

      {today.meals.length > 0 ? (
        <Text variant="caption" color="textMuted" align="center">
          So far today: {today.meals.length} {today.meals.length === 1 ? 'meal' : 'meals'} ·{' '}
          {Math.round(today.totals.calories).toLocaleString('en-IN')} kcal
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  tipText: { flex: 1 },
});
