import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

const PIECES = 36;
const DURATION_MS = 2600;
const PALETTE = [
  colors.accent,
  colors.primarySoft,
  colors.warning,
  colors.primary,
  colors.accentTint,
];

interface ConfettiProps {
  /** Starts a burst each time this changes to a new value. */
  burstKey: string | null;
  onDone?: () => void;
}

/**
 * A short burst of falling confetti for a real win (daily goal hit). Drawn with plain views,
 * no animation library or Lottie file. Skipped entirely when the person prefers reduced motion.
 */
export function Confetti({ burstKey, onDone }: ConfettiProps) {
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => makePieces(burstKey ?? '', width), [burstKey, width]);

  useEffect(() => {
    if (!burstKey) return;
    const timer = setTimeout(() => onDone?.(), reduceMotion ? 0 : DURATION_MS + 600);
    return () => clearTimeout(timer);
  }, [burstKey, onDone, reduceMotion]);

  if (!burstKey || reduceMotion) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      {pieces.map((piece, index) => (
        <Piece key={`${burstKey}-${index}`} {...piece} fall={height + 40} />
      ))}
    </View>
  );
}

/**
 * Scatters pieces with a small seeded generator, so rendering stays pure: the same burst
 * always looks the same, and a new burst key gives a new pattern.
 */
function makePieces(seedText: string, width: number) {
  let seed = [...seedText].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 7);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return ((seed >>> 0) % 10_000) / 10_000;
  };
  return Array.from({ length: PIECES }, (_, i) => ({
    x: random() * width,
    drift: (random() - 0.5) * 120,
    delay: random() * 500,
    spin: (random() > 0.5 ? 1 : -1) * (360 + random() * 360),
    color: PALETTE[i % PALETTE.length]!,
    size: 6 + random() * 6,
  }));
}

function Piece({
  x,
  drift,
  delay,
  spin,
  color,
  size,
  fall,
}: {
  x: number;
  drift: number;
  delay: number;
  spin: number;
  color: string;
  size: number;
  fall: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: DURATION_MS, easing: Easing.in(Easing.quad) }),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.3,
    transform: [
      { translateX: x + drift * progress.value },
      { translateY: -20 + fall * progress.value },
      { rotate: `${spin * progress.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[styles.piece, { width: size, height: size * 0.5, backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, left: 0, borderRadius: 2 },
});
