import type { TextStyle } from 'react-native';

/**
 * Two typefaces with clear jobs. Fraunces, a warm serif, is used for headlines and the big
 * numbers, so the app reads like a friendly food column instead of a spreadsheet. Body text
 * stays on the system font: it looks native on each platform and adds nothing to the bundle.
 * Only two Fraunces weights ship (about 70 KB each).
 */
export const fonts = {
  serif: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
} as const;

// Custom font files carry their own weight, so serif styles leave fontWeight unset;
// otherwise Android would fake a bolder version of an already bold file.
export const typography = {
  display: { fontFamily: fonts.serifBold, fontSize: 40, lineHeight: 46, letterSpacing: -0.8 },
  title: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 16, fontWeight: '600', letterSpacing: 0.2 },
  /** Small capitals above a section, e.g. "YOUR PLAN". */
  eyebrow: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
