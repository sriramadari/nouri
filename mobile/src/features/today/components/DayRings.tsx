import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, ProgressRing, Text } from '@/components/ui';
import type { Nutrition, Targets } from '@/lib/api/types';
import { spacing } from '@/theme';

const kcal = (value: number) => Math.round(value).toLocaleString('en-IN');

/** Calories and protein against today's targets, showing what is left rather than what is used. */
export function DayRings({ eaten, targets }: { eaten: Nutrition; targets: Targets }) {
  const caloriesLeft = targets.calories - eaten.calories;
  const proteinLeft = Math.round(targets.proteinG - eaten.proteinG);

  return (
    <Card style={styles.card}>
      <View style={styles.rings}>
        <ProgressRing
          value={eaten.calories}
          max={targets.calories}
          size={150}
          color={caloriesLeft < 0 ? 'warning' : 'primarySoft'}
          accessibilityLabel={`${kcal(eaten.calories)} of ${kcal(targets.calories)} calories eaten`}
        >
          <Text variant="title">{kcal(Math.abs(caloriesLeft))}</Text>
          <Text variant="caption" color="textSecondary">
            {caloriesLeft < 0 ? 'kcal over' : 'kcal left'}
          </Text>
        </ProgressRing>
        <ProgressRing
          value={eaten.proteinG}
          max={targets.proteinG}
          size={112}
          strokeWidth={11}
          color="accent"
          accessibilityLabel={`${Math.round(eaten.proteinG)} of ${targets.proteinG} grams of protein`}
        >
          <Text variant="heading">{proteinLeft > 0 ? `${proteinLeft} g` : 'Done'}</Text>
          <Text variant="caption" color="textSecondary">
            {proteinLeft > 0 ? 'protein to go' : 'protein'}
          </Text>
        </ProgressRing>
      </View>
      <View style={styles.footer}>
        <Text variant="caption" color="textSecondary" style={styles.summary}>
          {kcal(eaten.calories)} of {kcal(targets.calories)} kcal · {Math.round(eaten.proteinG)} of{' '}
          {targets.proteinG} g protein
        </Text>
        <Link href="/plan" asChild>
          <Button label="Plan" variant="ghost" icon="chevronRight" />
        </Link>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  rings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary: { flexShrink: 1 },
});
