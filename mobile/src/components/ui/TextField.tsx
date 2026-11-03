import {
  type ComponentRef,
  type ComponentType,
  createContext,
  type Ref,
  useContext,
  useState,
} from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { colors, MIN_TAP_TARGET, radii, spacing } from '@/theme';

import { Text } from './Text';

/**
 * Lets a container swap the input implementation. The native bottom sheet provides its own
 * input so the keyboard pushes the sheet up instead of covering the field.
 */
export const TextInputComponentContext = createContext<ComponentType<TextInputProps> | null>(null);

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Shown under the field in red and announced to screen readers. */
  error?: string | null;
  /** Unit shown inside the field, e.g. "kg". */
  suffix?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({
  label,
  error,
  suffix,
  ref,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const Input = (useContext(TextInputComponentContext) ?? TextInput) as typeof TextInput;
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={[styles.field, { borderColor }]}>
        <Input
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? undefined}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {suffix ? (
          <Text color="textSecondary" style={styles.suffix}>
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text
          variant="caption"
          color="danger"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TAP_TARGET + 8,
    borderWidth: 1.5,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    // Lets the input shrink in narrow rows so the unit suffix is never squeezed or cut off.
    minWidth: 0,
    // The field's own border already darkens on focus; drop the browser's second outline.
    outlineWidth: 0,
    // Bold system font: easy to read while typing, and the serif stays for headlines.
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  suffix: { marginLeft: spacing.sm, flexShrink: 0 },
});
