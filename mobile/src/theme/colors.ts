/**
 * Colour tokens. Components read colours from here and never hard code them.
 * Light, calm and warm: off white background, soft green primary, warm accent for
 * celebrations, clear status colours for lab results. Text and button colours meet
 * WCAG AA contrast on the background.
 */
export const colors = {
  background: '#FAF8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F0EA',
  border: '#E6E1D8',
  overlay: 'rgba(31, 42, 36, 0.35)',

  textPrimary: '#1F2A24',
  textSecondary: '#55645C',
  textMuted: '#7D8A83',
  textOnPrimary: '#FFFFFF',

  /** Buttons and links. Deep enough for white text on top. */
  primary: '#2F7D57',
  primaryPressed: '#256848',
  /** Lighter green for rings, highlights and selected states. */
  primarySoft: '#5FAE85',
  primaryTint: '#E4F1E9',

  /** Warm accent for celebrations, streaks and the protein ring. */
  accent: '#E8894A',
  accentTint: '#FCEBDD',

  success: '#2F8A5B',
  successTint: '#E2F3E9',
  warning: '#B7791F',
  warningTint: '#FBF0D9',
  danger: '#C2493D',
  dangerTint: '#FBE4E1',

  /** Track behind progress rings. */
  ringTrack: '#ECE7DE',
  skeleton: '#ECE8E1',
} as const;

export type ColorToken = keyof typeof colors;
