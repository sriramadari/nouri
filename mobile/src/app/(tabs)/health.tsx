import { EmptyState, Screen, Text } from '@/components/ui';

/** Health. The blood report reader arrives with flow 4. */
export default function HealthScreen() {
  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        Health
      </Text>
      <EmptyState
        icon="health"
        title="Your lab results, explained"
        message="Soon you'll upload a blood report and Nouri will tell you what each number means for your food."
      />
    </Screen>
  );
}
