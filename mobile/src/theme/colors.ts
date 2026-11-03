/**
 * Colour tokens. Components read colours from here and never hard code them.
 *
 * The palette comes from an Indian kitchen rather than a fitness app: warm paper, ink for
 * text and main buttons, turmeric (haldi) as the brand colour and curry leaf green for
 * protein. Status colours for lab results stay the familiar green, amber and red. Text and
 * button colours meet WCAG AA contrast on the background.
 */
export const colors = {
  background: '#FBF7F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F4EEE4',
  border: '#E9E1D3',
  overlay: 'rgba(34, 28, 23, 0.4)',

  textPrimary: '#221C17',
  textSecondary: '#5F554B',
  textMuted: '#8C8175',
  textOnPrimary: '#FFF9F0',
  /** Secondary text on ink surfaces such as the logging dock. */
  textOnPrimaryMuted: '#C9BEB0',

  /** Main buttons, selected states and links: ink, so turmeric can stay a highlight. */
  primary: '#221C17',
  primaryPressed: '#3A3129',
  /** Turmeric: the brand colour, the calorie ring and the assistant's mark. */
  brand: '#E39B2D',
  brandTint: '#FCEFD8',
  /** Darker turmeric that is readable as text on paper. */
  brandText: '#9A5F0A',

  /** Curry leaf green: the protein ring and positive progress. */
  leaf: '#3F8A5A',
  leafTint: '#E3F1E6',

  /** Evening tint for the assistant card. */
  dusk: '#5B5A9A',
  duskTint: '#ECEBF7',

  success: '#2F8A5B',
  successTint: '#E2F3E9',
  warning: '#B7791F',
  warningTint: '#FBF0D9',
  danger: '#C2493D',
  dangerTint: '#FBE4E1',

  /** Track behind progress rings. */
  ringTrack: '#F0E8DA',
  skeleton: '#EEE7DB',
} as const;

export type ColorToken = keyof typeof colors;
