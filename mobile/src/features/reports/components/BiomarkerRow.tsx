import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import type { Biomarker } from '@/lib/api/types';
import { colors, type ColorToken, radii, spacing } from '@/theme';

import { type Severity, severityOf, statusLabel } from '../severity';

export const SEVERITY_COLORS: Record<Severity, { fg: ColorToken; bg: ColorToken }> = {
  normal: { fg: 'success', bg: 'successTint' },
  mild: { fg: 'warning', bg: 'warningTint' },
  marked: { fg: 'danger', bg: 'dangerTint' },
};

export function StatusPill({ marker }: { marker: Biomarker }) {
  const tone = SEVERITY_COLORS[severityOf(marker)];
  return (
    <View style={[styles.pill, { backgroundColor: colors[tone.bg] }]}>
      <View style={[styles.dot, { backgroundColor: colors[tone.fg] }]} />
      <Text variant="label" color={tone.fg}>
        {statusLabel(marker)}
      </Text>
    </View>
  );
}

export function BiomarkerRow({ marker, onPress }: { marker: Biomarker; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${marker.name}, ${marker.value} ${marker.unit}, ${statusLabel(marker)}. Open details`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text variant="bodyStrong">{marker.name}</Text>
        <Text color="textSecondary">
          {marker.value} {marker.unit}
        </Text>
      </View>
      <StatusPill marker={marker} />
      <Icon name="chevronRight" size={20} color="textMuted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  text: { flex: 1, gap: spacing.xxs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  dot: { width: 8, height: 8, borderRadius: radii.pill },
});
