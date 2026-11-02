import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import type { Streak } from '@/lib/api/types';
import { colors, radii, spacing } from '@/theme';

/** A small, honest motivator: the flame is lit only on days with a logged meal. */
export function StreakBadge({ streak }: { streak: Streak }) {
  const lit = streak.loggedToday;
  const label =
    streak.current === 0
      ? 'Start a streak'
      : `${streak.current}-day streak${lit ? '' : ' · log today'}`;

  return (
    <View
      style={[styles.badge, { backgroundColor: lit ? colors.accentTint : colors.surfaceMuted }]}
      accessible
      accessibilityLabel={
        streak.current === 0
          ? 'No streak yet. Log a meal to start one.'
          : `${streak.current} day streak${lit ? '' : '. Log a meal today to keep it.'} Best ${streak.best} days.`
      }
    >
      <Icon name="flame" size={16} color={lit ? 'accent' : 'textMuted'} />
      <Text variant="label" color={lit ? 'textPrimary' : 'textSecondary'}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
  },
});
