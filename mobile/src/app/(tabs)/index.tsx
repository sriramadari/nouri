import { Link } from 'expo-router';

import { Button, EmptyState, Screen, Text } from '@/components/ui';

/** Today. Rings, the assistant card and the meal timeline arrive with flows 2 and 3. */
export default function TodayScreen() {
  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        Today
      </Text>
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
