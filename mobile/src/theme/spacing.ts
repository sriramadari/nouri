/** 4 point spacing scale. Use these instead of raw numbers for padding, margins and gaps. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** Minimum touch target from platform guidelines. */
export const MIN_TAP_TARGET = 48;
