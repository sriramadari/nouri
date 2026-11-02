import { StyleSheet, View, type ViewProps } from 'react-native';

import { cardShadow, colors, type ColorToken, radii, spacing } from '@/theme';

export interface CardProps extends ViewProps {
  tone?: Extract<
    ColorToken,
    'surface' | 'primaryTint' | 'accentTint' | 'warningTint' | 'dangerTint'
  >;
}

export function Card({ tone = 'surface', style, ...props }: CardProps) {
  return <View style={[styles.card, { backgroundColor: colors[tone] }, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
});
