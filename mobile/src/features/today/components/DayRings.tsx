import { Link } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Card, Icon, ProgressRing, Text } from '@/components/ui';
import type { Nutrition, Targets } from '@/lib/api/types';
import { colors, type ColorToken, radii, spacing } from '@/theme';

const kcal = (value: number) => Math.round(value).toLocaleString('en-IN');

const RING_GAP = 6;

/**
 * Today's "katori": calories as the outer ring and protein as the inner one, nested like a
 * bowl seen from above. The centre shows what is left, not what is used, because "how much
 * more can I eat" is the question people actually ask.
 */
export function DayRings({ eaten, targets }: { eaten: Nutrition; targets: Targets }) {
  // Smaller rings on narrow phones (e.g. 320 px wide) so the legend still fits beside them.
  const compact = useWindowDimensions().width < 380;
  const outer = compact ? 136 : 164;
  const stroke = compact ? 12 : 14;
  const inner = outer - 2 * (stroke + RING_GAP);
  const caloriesLeft = targets.calories - eaten.calories;
  const proteinLeft = Math.round(targets.proteinG - eaten.proteinG);
  const over = caloriesLeft < 0;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={{ width: outer, height: outer }}>
          <ProgressRing
            value={eaten.calories}
            max={targets.calories}
            size={outer}
            strokeWidth={stroke}
            color={over ? 'warning' : 'brand'}
            accessibilityLabel={`${kcal(eaten.calories)} of ${kcal(targets.calories)} calories eaten`}
          />
          <View style={[styles.inner, { padding: stroke + RING_GAP }]}>
            <ProgressRing
              value={eaten.proteinG}
              max={targets.proteinG}
              size={inner}
              strokeWidth={stroke - 2}
              color="leaf"
              accessibilityLabel={`${Math.round(eaten.proteinG)} of ${targets.proteinG} grams of protein`}
            >
              <Text variant={compact ? 'heading' : 'title'}>{kcal(Math.abs(caloriesLeft))}</Text>
              <Text variant="caption" color="textSecondary">
                {over ? 'kcal over' : 'kcal left'}
              </Text>
            </ProgressRing>
          </View>
        </View>

        <View style={styles.legend}>
          <LegendRow
            color="brand"
            label="Calories"
            value={`${kcal(eaten.calories)} / ${kcal(targets.calories)}`}
          />
          <LegendRow
            color="leaf"
            label="Protein"
            value={`${Math.round(eaten.proteinG)} / ${targets.proteinG} g`}
            note={proteinLeft > 0 ? `${proteinLeft} g to go` : 'Target reached'}
          />
        </View>
      </View>

      <Link href="/plan" asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="See how your plan was worked out"
          // A plain style object: Link passes it through on web, where a style function is lost.
          style={styles.planLink}
        >
          <Text variant="label" color="textSecondary">
            How these targets were set
          </Text>
          <Icon name="chevronRight" size={16} color="textSecondary" />
        </Pressable>
      </Link>
    </Card>
  );
}

function LegendRow({
  color,
  label,
  value,
  note,
}: {
  color: ColorToken;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: colors[color] }]} />
      <View style={styles.legendText}>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
        <Text variant="bodyStrong">{value}</Text>
        {note ? (
          <Text variant="caption" color="textSecondary">
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  inner: { ...StyleSheet.absoluteFill },
  legend: { flex: 1, gap: spacing.lg },
  legendRow: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: radii.pill, marginTop: 4 },
  legendText: { flex: 1 },
  planLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
