import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  /** One clear next step. */
  action?: { label: string; icon?: IconName; onPress: () => void };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Icon name={icon} size={32} color="primary" />
      </View>
      <Text variant="heading" align="center" accessibilityRole="header">
        {title}
      </Text>
      <Text color="textSecondary" align="center">
        {message}
      </Text>
      {action ? <Button label={action.label} icon={action.icon} onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
