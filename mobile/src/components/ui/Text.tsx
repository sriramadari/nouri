import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, type ColorToken, typography, type TypographyVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
}

/** The only text component in the app, so every string uses the type scale and colour tokens. */
export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      style={[typography[variant], { color: colors[color], textAlign: align }, style]}
      {...props}
    />
  );
}
