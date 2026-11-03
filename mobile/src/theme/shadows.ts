import { Platform, type ViewStyle } from 'react-native';

import { colors } from './colors';

/**
 * Cards sit on paper with a hairline edge and a faint warm shadow, like a plate on a table.
 * Heavy shadows would fight the calm look.
 */
export const cardShadow: ViewStyle = Platform.select({
  android: { elevation: 1 },
  default: {
    shadowColor: colors.brandText,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
});
