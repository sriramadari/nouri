import { Platform, type ViewStyle } from 'react-native';

import { colors } from './colors';

/** One soft elevation for cards and sheets; heavy shadows would fight the calm look. */
export const cardShadow: ViewStyle = Platform.select({
  android: { elevation: 2 },
  default: {
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
