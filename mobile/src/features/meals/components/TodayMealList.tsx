import { StyleSheet, View } from 'react-native';

import { Button, Card, ErrorState, Icon, type IconName, Skeleton, Text } from '@/components/ui';
import type { MealSource } from '@/lib/api/types';
import { formatTime } from '@/lib/dates';
import { colors, radii, spacing } from '@/theme';

import type { TodayMeal } from '../use-today-meals';
import type { ApiError } from '@/lib/api/api-error';

const SOURCE_ICONS: Record<MealSource, IconName> = {
  PHOTO: 'camera',
  VOICE: 'mic',
  MANUAL: 'edit',
};

interface TodayMealListProps {
  meals: TodayMeal[];
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  /** Opens logging from the day one empty state. */
  onLogFirst: () => void;
}

/** Today's meals in order, including ones still waiting to sync. */
export function TodayMealList({
  meals,
  isLoading,
  error,
  onRetry,
  onLogFirst,
}: TodayMealListProps) {
  return (
    <View style={styles.section}>
      <Text variant="heading" accessibilityRole="header">
        Today’s meals
      </Text>

      {isLoading ? (
        <>
          <Skeleton height={64} radius={radii.lg} />
          <Skeleton height={64} radius={radii.lg} />
        </>
      ) : null}

      {error && meals.length === 0 ? (
        <ErrorState
          offline={error.isConnectionProblem}
          message={
            error.isConnectionProblem
              ? 'Today’s meals will appear when you’re back online. You can still log meals.'
              : error.message
          }
          onRetry={onRetry}
        />
      ) : null}

      {!isLoading && !error && meals.length === 0 ? (
        <Card style={styles.empty}>
          <Text color="textSecondary">
            Nothing logged yet. Your first snap takes about 5 seconds.
          </Text>
          <Button label="Log your first meal" icon="camera" onPress={onLogFirst} />
        </Card>
      ) : null}

      {meals.map((meal) => (
        <Card
          key={meal.key}
          style={styles.row}
          accessible
          accessibilityLabel={`${formatTime(meal.eatenAt)}, ${meal.items.map((i) => i.name).join(', ')}, ${meal.totals.calories} calories${meal.pending ? ', waiting to sync' : ''}`}
        >
          <View style={styles.icon}>
            <Icon name={SOURCE_ICONS[meal.source]} size={20} color="primary" />
          </View>
          <View style={styles.body}>
            <Text variant="bodyStrong" numberOfLines={2}>
              {meal.items.map((item) => item.name).join(', ')}
            </Text>
            <Text variant="caption" color={meal.pending ? 'warning' : 'textSecondary'}>
              {formatTime(meal.eatenAt)}
              {meal.pending ? ' · Waiting to sync' : ''}
            </Text>
          </View>
          <Text variant="bodyStrong">{meal.totals.calories} kcal</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'flex-start', gap: spacing.md },
  section: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.xxs },
});
