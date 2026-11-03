import { StyleSheet, View } from 'react-native';

import { Card, Icon, Text } from '@/components/ui';
import { spacing } from '@/theme';

interface AssistantCardProps {
  message: string;
  why: string;
  tone: 'welcome' | 'nudge' | 'praise';
}

/** The assistant speaking first: one message for this moment of the day, always with a why. */
export function AssistantCard({ message, why, tone }: AssistantCardProps) {
  return (
    <Card
      tone={tone === 'praise' ? 'leafTint' : 'brandTint'}
      accessibilityRole="summary"
      accessibilityLabel={`Katori says: ${message}. ${why}`}
    >
      <View style={styles.label}>
        <Icon name="sparkles" size={16} color={tone === 'praise' ? 'primary' : 'brand'} />
        <Text variant="label" color={tone === 'praise' ? 'primary' : 'textSecondary'}>
          KATORI
        </Text>
      </View>
      <Text variant="heading">{message}</Text>
      <Text color="textSecondary">{why}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
