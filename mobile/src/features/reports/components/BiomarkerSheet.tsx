import { StyleSheet, View } from 'react-native';

import { AdaptiveSheet, Card, Text } from '@/components/ui';
import type { Biomarker } from '@/lib/api/types';
import { colors, radii, spacing } from '@/theme';

import { rangePosition, severityOf } from '../severity';
import { SEVERITY_COLORS, StatusPill } from './BiomarkerRow';

function rangeText({ refLow, refHigh, unit }: Biomarker): string {
  if (refLow !== null && refHigh !== null) return `${refLow} to ${refHigh} ${unit}`;
  if (refHigh !== null) return `below ${refHigh} ${unit}`;
  if (refLow !== null) return `above ${refLow} ${unit}`;
  return 'not printed on the report';
}

/** One result, explained: where it sits, why it matters, and one thing to eat. */
export function BiomarkerSheet({
  marker,
  onClose,
}: {
  marker: Biomarker | null;
  onClose: () => void;
}) {
  return (
    <AdaptiveSheet visible={marker !== null} onClose={onClose} title={marker?.name ?? ''}>
      {marker ? <BiomarkerDetail marker={marker} /> : null}
    </AdaptiveSheet>
  );
}

function BiomarkerDetail({ marker }: { marker: Biomarker }) {
  const position = rangePosition(marker);
  const tone = SEVERITY_COLORS[severityOf(marker)];
  const inRange = marker.status === 'NORMAL';

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text variant="display">
          {marker.value}
          <Text variant="heading" color="textSecondary">
            {' '}
            {marker.unit}
          </Text>
        </Text>
        <StatusPill marker={marker} />
      </View>

      <View
        accessible
        accessibilityLabel={`Healthy range ${rangeText(marker)}`}
        style={styles.track}
      >
        {position.low !== null || position.high !== null ? (
          <View
            style={[
              styles.healthy,
              {
                left: `${(position.low ?? 0) * 100}%`,
                right: `${(1 - (position.high ?? 1)) * 100}%`,
              },
            ]}
          />
        ) : null}
        <View
          style={[
            styles.marker,
            { left: `${position.value * 100}%`, backgroundColor: colors[tone.fg] },
          ]}
        />
      </View>
      <Text variant="caption" color="textSecondary">
        Healthy range: {rangeText(marker)}
      </Text>

      {inRange ? (
        <Card tone="primaryTint">
          <Text>In a healthy range. Keep doing what you’re doing.</Text>
        </Card>
      ) : (
        <>
          {marker.why ? (
            <View style={styles.block}>
              <Text variant="label" color="textSecondary">
                WHY IT MATTERS
              </Text>
              <Text>{marker.why}</Text>
            </View>
          ) : null}
          {marker.action ? (
            <Card tone="accentTint">
              <Text variant="label" color="textSecondary">
                ONE THING TO TRY
              </Text>
              <Text variant="bodyStrong">{marker.action}</Text>
            </Card>
          ) : null}
        </>
      )}

      {marker.key === null ? (
        <Text variant="caption" color="textMuted">
          Nouri compared this result with the range printed by your lab.
        </Text>
      ) : null}
      <Text variant="caption" color="textMuted">
        This is guidance, not a diagnosis. Talk to your doctor about results that worry you.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  track: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.ringTrack,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  healthy: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.successTint,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radii.pill,
  },
  marker: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  block: { gap: spacing.xs },
});
