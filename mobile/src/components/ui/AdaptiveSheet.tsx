import { type ReactNode, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { cardShadow, colors, radii, spacing, useIsWideScreen } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface AdaptiveSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Primary action, e.g. a Save button. Always pinned to the bottom so it stays in reach. */
  footer?: ReactNode;
}

const SLIDE_MS = 260;
/** Dragging the sheet down further than this (or flicking it) closes it. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
/** Far enough to start fully off screen on any phone. */
const OFFSCREEN = 900;

/**
 * The platform appropriate way to show a focused task: a bottom sheet on phones (thumb
 * reachable, swipe down to dismiss) and a centred dialog on tablets and desktop web, where a
 * sheet stretched across a wide screen looks and feels wrong. Callers never know which.
 *
 * Built on React Native's Modal with Reanimated and Gesture Handler, which the app already
 * ships, so it behaves the same on Android, iOS and the web.
 */
export function AdaptiveSheet(props: AdaptiveSheetProps) {
  const isWide = useIsWideScreen();
  return isWide ? <CenteredDialog {...props} /> : <BottomSheet {...props} />;
}

function BottomSheet({ visible, onClose, title, children, footer }: AdaptiveSheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  // Stays mounted while the closing slide plays, then unmounts.
  const [mounted, setMounted] = useState(visible);
  const offset = useSharedValue(OFFSCREEN);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    const duration = reduceMotion ? 0 : SLIDE_MS;
    if (visible) {
      offset.set(withTiming(0, { duration, easing: Easing.out(Easing.cubic) }));
    } else {
      offset.set(
        withTiming(OFFSCREEN, { duration }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, reduceMotion, offset]);

  // Swipe down on the handle or title to close, like a native sheet.
  const drag = Gesture.Pan()
    .onUpdate((event) => {
      offset.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        offset.set(withTiming(0, { duration: 180 }));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: 1 - offset.get() / OFFSCREEN }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Gestures inside an Android Modal need their own root view. */}
      <GestureHandlerRootView style={styles.fill}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
            <Pressable
              style={styles.fill}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            />
          </Animated.View>

          <Animated.View
            style={[styles.sheet, { paddingBottom: footer ? 0 : insets.bottom }, sheetStyle]}
            accessibilityViewIsModal
          >
            <GestureDetector gesture={drag}>
              <View style={styles.dragArea}>
                <View style={styles.handle} />
                <View style={styles.headerPadding}>
                  <SheetHeader title={title} onClose={onClose} />
                </View>
              </View>
            </GestureDetector>
            <ScrollView
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {footer ? (
              <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
                {footer}
              </View>
            ) : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

function CenteredDialog({ visible, onClose, title, children, footer }: AdaptiveSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.fill, styles.backdrop, styles.centered]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.dialogBody}>
            <SheetHeader title={title} onClose={onClose} />
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={styles.header}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={12}
        style={styles.close}
      >
        <Icon name="close" color="textSecondary" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    ...cardShadow,
  },
  dragArea: { paddingTop: spacing.sm },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  headerPadding: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  sheetBody: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
  close: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  dialogBody: { padding: spacing.lg, gap: spacing.lg },
});
