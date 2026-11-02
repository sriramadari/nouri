import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

/**
 * Server state cache. The API client already retries, so React Query does not retry again;
 * data counts as fresh for 30 s to avoid refetching on every screen focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000 },
    mutations: { retry: false },
  },
});

// Refetch stale data when the app comes back to the foreground (the browser handles this on web).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
}
