import { StyleSheet, View } from 'react-native';

import { BrandMark, Card, type CardProps, Text } from '@/components/ui';
import type { DaySlot as Slot } from '@/lib/health/assistant';
import { colors, radii, spacing } from '@/theme';

interface AssistantCardProps {
  message: string;
  why: string;
  tone: 'welcome' | 'nudge' | 'praise';
  slot: Slot;
}

// The card's colour follows the day (turmeric morning, leaf afternoon, dusk evening), so the
// assistant visibly checks in at a new moment instead of showing the same box all day.
const SLOT_TONES: Record<Slot, NonNullable<CardProps['tone']>> = {
  MORNING: 'brandTint',
  AFTERNOON: 'leafTint',
  EVENING: 'duskTint',
};
const SLOT_LABELS: Record<Slot, string> = {
  MORNING: 'Morning check in',
  AFTERNOON: 'Afternoon nudge',
  EVENING: 'Evening recap',
};

/** The assistant speaking first: one message for this moment of the day, always with a why. */
export function AssistantCard({ message, why, tone, slot }: AssistantCardProps) {
  return (
    <Card
      tone={tone === 'praise' ? 'leafTint' : SLOT_TONES[slot]}
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Katori says: ${message}. ${why}`}
    >
      <View style={styles.from}>
        <View style={styles.avatar}>
          <BrandMark size={26} />
        </View>
        <View>
          <Text variant="bodyStrong">Katori</Text>
          <Text variant="caption" color="textSecondary">
            {tone === 'praise' ? 'Well done' : SLOT_LABELS[slot]}
          </Text>
        </View>
      </View>
      <Text variant="heading">{message}</Text>
      <View style={styles.why}>
        <Text variant="eyebrow" color="textSecondary">
          Why
        </Text>
        <Text color="textSecondary" style={styles.whyText}>
          {why}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, borderWidth: 0 },
  from: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  why: { flexDirection: 'row', gap: spacing.sm, alignItems: 'baseline' },
  whyText: { flex: 1 },
});
