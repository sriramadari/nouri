import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, type ColorToken } from '@/theme';

/**
 * A small hand picked icon set drawn with SVG paths (24 x 24, stroke based). Only the icons
 * the app uses ship in the bundle, unlike a full icon font.
 */
const ICONS = {
  today: (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  health: (
    <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
  ),
  camera: (
    <>
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <Circle cx={12} cy={13} r={3} />
    </>
  ),
  mic: (
    <>
      <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  close: <Path d="M18 6 6 18M6 6l12 12" />,
  check: <Path d="M20 6 9 17l-5-5" />,
  alert: (
    <>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 8v4M12 16h.01" />
    </>
  ),
  refresh: (
    <>
      <Path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <Path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16" />
      <Path d="M8 16H3v5" />
    </>
  ),
  chevronRight: <Path d="m9 18 6-6-6-6" />,
  chevronLeft: <Path d="m15 18-6-6 6-6" />,
  minus: <Path d="M5 12h14" />,
  image: (
    <>
      <Path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <Circle cx={9} cy={9} r={2} />
      <Path d="m21 15-5-5L5 21" />
    </>
  ),
  edit: <Path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  file: (
    <>
      <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <Path d="M14 2v5h6M9 13h6M9 17h6" />
    </>
  ),
  cloudOff: (
    <>
      <Path d="m2 2 20 20" />
      <Path d="M5.8 5.8A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 2.4-.7M21.5 15.2A4.5 4.5 0 0 0 17.5 10h-1.8A7 7 0 0 0 10 5.1" />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorToken;
  strokeWidth?: number;
}

/** Decorative by default: pair it with text or an accessibilityLabel on the parent. */
export function Icon({ name, size = 24, color = 'textPrimary', strokeWidth = 2 }: IconProps) {
  // Hidden from screen readers on the wrapper: react-native-svg would pass these props
  // straight to the DOM on web, where they are not valid attributes.
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors[color]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[name]}
      </Svg>
    </View>
  );
}
