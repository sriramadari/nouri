import type { TextStyle } from 'react-native';

/**
 * Type scale. System fonts only: they look native on each platform and add nothing to the
 * bundle. Sizes stay readable for a quick glance while walking.
 */
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 16, fontWeight: '600', letterSpacing: 0.3 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
