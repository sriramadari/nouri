import { ActivityIndicator, Pressable, type PressableProps, StyleSheet, View } from 'react-native';

import { colors, type ColorToken, MIN_TAP_TARGET, radii, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<
  Variant,
  { background: ColorToken; pressed: ColorToken; text: ColorToken; border?: ColorToken }
> = {
  primary: { background: 'primary', pressed: 'primaryPressed', text: 'textOnPrimary' },
  secondary: { background: 'surface', pressed: 'surfaceMuted', text: 'primary', border: 'border' },
  ghost: { background: 'background', pressed: 'surfaceMuted', text: 'primary' },
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  icon?: IconName;
  /** Shows a spinner and blocks presses, e.g. while saving. */
  loading?: boolean;
  /** Stretch to the container width; otherwise the button hugs its label and is centred. */
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  disabled,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const tone = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors[pressed ? tone.pressed : tone.background],
          borderColor: tone.border ? colors[tone.border] : 'transparent',
          opacity: disabled && !loading ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'center',
        },
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors[tone.text]} />
        ) : (
          icon && <Icon name={icon} size={20} color={tone.text} />
        )}
        <Text variant="bodyStrong" color={tone.text}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TAP_TARGET,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
