import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { cardShadow, colors, type ColorToken, radii, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Tone = 'success' | 'info' | 'offline';

const TONES: Record<Tone, { icon: IconName; color: ColorToken }> = {
  success: { icon: 'check', color: 'success' },
  info: { icon: 'alert', color: 'textSecondary' },
  offline: { icon: 'cloudOff', color: 'warning' },
};

const VISIBLE_MS = 3500;

interface ToastState {
  toast: { id: number; message: string; tone: Tone } | null;
  show: (message: string, tone?: Tone) => void;
  hide: () => void;
}

/** A short, non blocking confirmation, e.g. "Saved. Katori will sync it when you're online." */
export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (message, tone = 'success') => set({ toast: { id: Date.now(), message, tone } }),
  hide: () => set({ toast: null }),
}));

/** Rendered once near the root; shows the latest toast above the tab bar. */
export function ToastHost() {
  const toast = useToast((state) => state.toast);
  const hide = useToast((state) => state.hide);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (!toast) return null;
  const tone = TONES[toast.tone];

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 72 }]}>
      <Animated.View
        key={toast.id}
        entering={FadeInDown}
        exiting={FadeOutDown}
        style={styles.toast}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Icon name={tone.icon} size={18} color={tone.color} />
        <Text variant="bodyStrong" style={styles.message}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 480,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  message: { flexShrink: 1 },
});
