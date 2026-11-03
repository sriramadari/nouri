import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFooter,
  type BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import {
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardShadow, colors, MIN_TAP_TARGET, radii, spacing, useIsWideScreen } from '@/theme';

import { Icon } from './Icon';
import { TextInputComponentContext } from './TextField';
import { Text } from './Text';

export interface AdaptiveSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Primary action, e.g. a Save button. Always pinned to the bottom so it stays in reach. */
  footer?: ReactNode;
}

/**
 * The platform appropriate way to show a focused task: a bottom sheet on phones (thumb
 * reachable, swipe to dismiss) and a centred dialog on tablets and desktop web, where a
 * sheet stretched across a wide screen looks and feels wrong. Callers never know which.
 *
 * Narrow web (a phone browser) gets a simple bottom anchored modal: the gesture driven sheet
 * is built for native and mis-sizes its footer in the browser.
 */
export function AdaptiveSheet(props: AdaptiveSheetProps) {
  const isWide = useIsWideScreen();
  if (isWide) return <ModalSheet {...props} placement="center" />;
  if (Platform.OS === 'web') return <ModalSheet {...props} placement="bottom" />;
  return <BottomSheet {...props} />;
}

function BottomSheet({ visible, onClose, title, children, footer }: AdaptiveSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  // Android back button closes the sheet first, like every native sheet does.
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const renderFooter = useCallback(
    (footerProps: BottomSheetFooterProps) => (
      <BottomSheetFooter {...footerProps} bottomInset={insets.bottom}>
        <View style={styles.sheetFooter}>{footer}</View>
      </BottomSheetFooter>
    ),
    [footer, insets.bottom],
  );

  // The pinned footer floats over the content, so leave room for it below the last item.
  const footerSpace = footer ? MIN_TAP_TARGET + spacing.lg * 2 : 0;

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      footerComponent={footer ? renderFooter : undefined}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      accessibilityLabel={title}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + spacing.lg + footerSpace },
        ]}
      >
        <SheetHeader title={title} onClose={onClose} />
        <TextInputComponentContext.Provider value={BottomSheetTextInput}>
          {children}
        </TextInputComponentContext.Provider>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function ModalSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  placement,
}: AdaptiveSheetProps & { placement: 'center' | 'bottom' }) {
  const isBottom = placement === 'bottom';
  return (
    <Modal
      visible={visible}
      transparent
      animationType={isBottom ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, isBottom && styles.overlayBottom]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={[styles.dialog, isBottom && styles.dialogBottom]} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.body}>
            <SheetHeader title={title} onClose={onClose} />
            {children}
          </ScrollView>
          {footer ? <View style={styles.dialogFooter}>{footer}</View> : null}
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
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  handle: { backgroundColor: colors.border, width: 40 },
  body: { padding: spacing.lg, gap: spacing.lg },
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
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  overlayBottom: { justifyContent: 'flex-end', padding: 0 },
  dialogBottom: {
    maxWidth: undefined,
    maxHeight: '90%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dialogFooter: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
