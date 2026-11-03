import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TAP_TARGET, radii, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface OptionCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** Optional picture on the left, e.g. a goal icon, so options can be told apart at a glance. */
  leading?: ReactNode;
}

/** One choice in a single choice list, with a large tap target and a clear selected state. */
export function OptionCard({ title, description, selected, onPress, leading }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected
            ? colors.brandTint
            : pressed
              ? colors.surfaceMuted
              : colors.surface,
        },
      ]}
    >
      {leading ? (
        <View style={[styles.leading, selected && styles.leadingSelected]}>{leading}</View>
      ) : null}
      <View style={styles.text}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" color="textSecondary">
            {description}
          </Text>
        ) : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <Icon name="check" size={16} color="textOnPrimary" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TAP_TARGET + 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
  },
  text: { flex: 1, gap: spacing.xxs },
  leading: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingSelected: { backgroundColor: colors.surface },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
