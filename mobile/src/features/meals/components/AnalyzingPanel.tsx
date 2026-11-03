import { StyleSheet, View } from 'react-native';

import { Skeleton, Text } from '@/components/ui';
import { radii, spacing } from '@/theme';

/** Skeleton chips while the AI works, so the sheet already looks like its result. */
export function AnalyzingPanel({ source }: { source: 'PHOTO' | 'VOICE' }) {
  return (
    <View style={styles.container} accessibilityLabel="Analysing your meal" accessible>
      <Text color="textSecondary">
        {source === 'PHOTO'
          ? 'Katori is looking at your plate…'
          : 'Katori is listening to your note…'}
      </Text>
      <View style={styles.chips}>
        <Skeleton width={120} height={52} radius={radii.md} />
        <Skeleton width={150} height={52} radius={radii.md} />
        <Skeleton width={100} height={52} radius={radii.md} />
      </View>
      <Skeleton width="50%" height={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
