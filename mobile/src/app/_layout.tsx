import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ErrorBoundaryProps, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ui';
import { queryClient } from '@/lib/api/query-client';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Last line of defence: if a screen crashes while rendering, show a calm message with a way
 * back instead of a blank or red screen. Expo Router uses this export automatically.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  if (__DEV__) console.error(error);
  return (
    <SafeAreaView style={styles.errorScreen}>
      <ErrorState
        title="Nouri hit a snag"
        message="Something unexpected happened on this screen. Your data is safe."
        onRetry={retry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  errorScreen: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
});
