import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ErrorBoundaryProps, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, ToastHost } from '@/components/ui';
import { useMealSync } from '@/features/meals/meal-sync';
import { useMealReminders } from '@/features/today/meal-reminders';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { queryClient } from '@/lib/api/query-client';
import { useProfileStore } from '@/lib/storage/profile-store';
import { createHydrationHook } from '@/lib/storage/use-hydrated';
import { useProfileSync } from '@/lib/storage/use-profile-sync';
import { colors } from '@/theme';

// Keep the splash screen up until saved data has loaded, so nothing flickers.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const useStoresHydrated = createHydrationHook(useProfileStore, useOnboardingDraft);

export default function RootLayout() {
  const hydrated = useStoresHydrated();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          {hydrated ? <AppNavigator /> : null}
          <ToastHost />
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Onboarding and the main app are mutually exclusive: until a profile exists only onboarding
 * is reachable, and afterwards it is gone. Expo Router redirects automatically.
 */
function AppNavigator() {
  const hasProfile = useProfileStore((state) => state.profile !== null);
  useProfileSync();
  useMealSync();
  useMealReminders();

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      {/* Explicit redirects: the implicit fallback can land on any open screen (even /dev). */}
      <Stack.Protected guard={hasProfile} redirectTo="/onboarding">
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!hasProfile} redirectTo="/">
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Screen name="plan" />
      <Stack.Screen name="dev" />
    </Stack>
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
