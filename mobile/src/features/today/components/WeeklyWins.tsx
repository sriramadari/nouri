import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { Card, Icon, Text } from '@/components/ui';
import { api } from '@/lib/api/endpoints';
import type { Targets } from '@/lib/api/types';
import { localDateKey } from '@/lib/dates';
import { MIN_DAYS_FOR_WINS, weeklyWins } from '@/lib/health/weekly-wins';
import { colors, radii, spacing } from '@/theme';

/** A positive look back at the last 7 days. Hidden until there is a week worth talking about. */
export function WeeklyWins({ targets }: { targets: Targets }) {
  const { data } = useQuery({ queryKey: ['week', localDateKey()], queryFn: api.getWeekSummary });
  if (!data) return null;
  const wins = weeklyWins(data.days, targets);
  if (wins.daysLogged < MIN_DAYS_FOR_WINS) return null;

  return (
    <Card accessible accessibilityLabel={`This week. ${wins.headline}`}>
      <View style={styles.title}>
        <Icon name="sparkles" size={18} color="accent" />
        <Text variant="label" color="textSecondary">
          THIS WEEK
        </Text>
      </View>
      <Text variant="heading">{wins.headline}</Text>
      <View style={styles.days} accessibilityElementsHidden>
        {data.days.map((day) => (
          <View
            key={day.date}
            style={[
              styles.day,
              { backgroundColor: day.meals > 0 ? colors.primarySoft : colors.ringTrack },
            ]}
          />
        ))}
      </View>
      <View style={styles.stats}>
        <Stat value={`${wins.daysLogged}/7`} label="days logged" />
        <Stat value={String(wins.proteinDays)} label="protein days" />
        <Stat
          value={wins.averageCalories === null ? '–' : wins.averageCalories.toLocaleString('en-IN')}
          label="avg kcal"
        />
      </View>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="heading">{value}</Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  days: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.xs },
  day: { flex: 1, height: 8, borderRadius: radii.pill },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', gap: spacing.xxs, flex: 1 },
});
