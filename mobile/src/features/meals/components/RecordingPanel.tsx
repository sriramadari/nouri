import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button, Icon, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { MAX_RECORDING_MS } from '../use-voice-recorder';

interface RecordingPanelProps {
  durationMillis: number;
  onStop: () => void;
  onCancel: () => void;
}

const formatSeconds = (ms: number) => `0:${String(Math.floor(ms / 1000)).padStart(2, '0')}`;

/** Live recording: a gently pulsing mic, a visible timer and the limit, Stop and Cancel. */
export function RecordingPanel({ durationMillis, onStop, onCancel }: RecordingPanelProps) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) pulse.value = withRepeat(withTiming(1.15, { duration: 700 }), -1, true);
  }, [pulse, reduceMotion]);

  // Stop automatically at the limit (once), so a forgotten recording never runs on.
  const autoStopped = useRef(false);
  useEffect(() => {
    if (durationMillis >= MAX_RECORDING_MS && !autoStopped.current) {
      autoStopped.current = true;
      onStop();
    }
  }, [durationMillis, onStop]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.container}>
      <Text color="textSecondary" align="center">
        Say what you ate, like “two rotis, dal and a bowl of curd”.
      </Text>
      <Animated.View style={[styles.mic, pulseStyle]}>
        <Icon name="mic" size={40} color="textOnPrimary" />
      </Animated.View>
      <Text
        variant="display"
        align="center"
        accessibilityLabel={`Recording, ${Math.floor(durationMillis / 1000)} seconds`}
        accessibilityLiveRegion="polite"
      >
        {formatSeconds(durationMillis)}
      </Text>
      <Text variant="caption" color="textMuted" align="center">
        Up to {MAX_RECORDING_MS / 1000} seconds
      </Text>
      <Button label="Done" icon="check" onPress={onStop} fullWidth />
      <Button label="Cancel" variant="ghost" onPress={onCancel} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md },
  mic: {
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
});
