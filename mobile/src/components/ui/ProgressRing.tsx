import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors, type ColorToken } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** Amount so far, e.g. calories eaten. */
  value: number;
  /** Goal, e.g. the daily calorie target. */
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: ColorToken;
  /** Content in the middle of the ring, e.g. the remaining amount. */
  children?: ReactNode;
  /** Read by screen readers instead of the drawing, e.g. "820 of 1,600 calories". */
  accessibilityLabel: string;
}

/**
 * Circular progress drawn with SVG (no chart library). Fills smoothly when the value
 * changes, or jumps straight there when the user prefers reduced motion.
 */
export function ProgressRing({
  value,
  max,
  size = 160,
  strokeWidth = 14,
  color = 'brand',
  children,
  accessibilityLabel,
}: ProgressRingProps) {
  const reduceMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const progress = useSharedValue(reduceMotion ? target : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress, reduceMotion, target]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: Math.round(max), now: Math.round(Math.min(value, max)) }}
    >
      {/* Rotated so progress starts at 12 o'clock. */}
      <Svg width={size} height={size} style={styles.rotated}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.ringTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotated: { transform: [{ rotate: '-90deg' }] },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
