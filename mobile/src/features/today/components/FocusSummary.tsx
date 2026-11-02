import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Icon, Text } from '@/components/ui';
import type { FocusArea } from '@/lib/health/focus-areas';
import { spacing } from '@/theme';

/** The plan's focus areas, kept in view on Today. They update when a lab report arrives. */
export function FocusSummary({ areas }: { areas: FocusArea[] }) {
  return (
    <Link href="/plan" asChild>
      <Pressable accessibilityRole="link" accessibilityLabel="Your focus. Open your plan">
        <Card>
          <View style={styles.header}>
            <Text variant="heading">Your focus</Text>
            <Icon name="chevronRight" color="textMuted" />
          </View>
          {areas.map((area, index) => (
            <Text key={area.id} color="textSecondary">
              {index + 1}. {area.title}
            </Text>
          ))}
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
});
