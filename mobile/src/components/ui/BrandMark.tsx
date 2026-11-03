import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * The Katori mark: a small turmeric bowl with a curry leaf. Used as the assistant's face on
 * cards and on the welcome screen, so the app's voice always has the same look.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Path d="M24 19C24 13 27.5 8.5 33 7.5C33 13 29.5 17.8 24 19Z" fill={colors.leaf} />
        <Path d="M7 22H41C41 31 33.4 38 24 38C14.6 38 7 31 7 22Z" fill={colors.brand} />
        <Path
          d="M5.5 22H42.5M18 41.5H30"
          stroke={colors.textPrimary}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
