import { useWindowDimensions } from 'react-native';

/** Above this width (tablets, desktop web) sheets become centred dialogs and content is capped. */
export const WIDE_SCREEN_MIN_WIDTH = 768;

/** Readable content width on large screens. */
export const MAX_CONTENT_WIDTH = 560;

export function useIsWideScreen(): boolean {
  return useWindowDimensions().width >= WIDE_SCREEN_MIN_WIDTH;
}
