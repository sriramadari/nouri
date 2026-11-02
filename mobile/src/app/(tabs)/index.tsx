import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Screen, Text } from '@/components/ui';
import { useProfileStore } from '@/lib/storage/profile-store';
import { spacing } from '@/theme';

/** Today. Rings, the assistant card and the meal timeline arrive with flows 2 and 3. */
export default function TodayScreen() {
  const name = useProfileStore((state) => state.profile?.name);
  const targets = useProfileStore((state) => state.targets);

  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        Hi, {name}
      </Text>
      {targets ? (
        <Card tone="primaryTint">
          <Text variant="label" color="primary">
            TODAY’S TARGET
          </Text>
          <Text variant="heading">
            {targets.calories.toLocaleString('en-IN')} kcal · {targets.proteinG} g protein
          </Text>
          <View style={styles.planLink}>
            <Link href="/plan" asChild>
              <Button label="See your plan" variant="secondary" icon="chevronRight" />
            </Link>
          </View>
        </Card>
      ) : null}
      <EmptyState
        icon="today"
        title="Your day starts here"
        message="Snap or speak your meals and Nouri will track your progress."
      />
      {__DEV__ ? (
        <Link href="/dev" asChild>
          <Button label="Open UI kit (dev only)" variant="ghost" icon="chevronRight" />
        </Link>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  planLink: { alignItems: 'flex-start', marginTop: spacing.xs },
});
