import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  /** Secondary line, e.g. a portion or calories. */
  detail?: string;
  /** Highlights the chip for confirmation, e.g. a low confidence food. */
  needsReview?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}

export function Chip({ label, detail, needsReview = false, onPress, onRemove }: ChipProps) {
  const accessibilityLabel = [label, detail, needsReview ? 'please check' : undefined]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors[needsReview ? 'warningTint' : 'surface'],
          borderColor: colors[needsReview ? 'warning' : 'border'],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={accessibilityLabel}
        style={styles.body}
      >
        <Text variant="bodyStrong">{label}</Text>
        {detail ? (
          <Text variant="caption" color="textSecondary">
            {detail}
          </Text>
        ) : null}
      </Pressable>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          hitSlop={8}
          style={styles.remove}
        >
          <Icon name="close" size={16} color="textSecondary" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 48,
  },
  body: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  remove: {
    padding: spacing.sm,
    paddingRight: spacing.md,
  },
});
