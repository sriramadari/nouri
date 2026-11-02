import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  /** Offline gets its own icon so the cause is clear at a glance. */
  offline?: boolean;
}

export function ErrorState({ title, message, onRetry, offline = false }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.badge}>
        <Icon name={offline ? 'cloudOff' : 'alert'} size={32} color="danger" />
      </View>
      <Text variant="heading" align="center">
        {title ?? (offline ? 'You’re offline' : 'Something went wrong')}
      </Text>
      <Text color="textSecondary" align="center">
        {message}
      </Text>
      {onRetry ? (
        <Button label="Try again" icon="refresh" variant="secondary" onPress={onRetry} />
      ) : null}
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
    backgroundColor: colors.dangerTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
