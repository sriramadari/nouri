import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Small, purposeful taps of feedback. Silent on web and when unsupported. */
export const haptics = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

function run(effect: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  effect().catch(() => undefined);
}
