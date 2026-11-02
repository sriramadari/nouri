import { useSyncExternalStore } from 'react';

interface PersistedStore {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

/**
 * Creates a hook that is true once every given persisted store has loaded from disk.
 * Rendering before that would briefly show onboarding to someone who already finished it.
 * Built once at module level so the subscription stays stable across renders.
 */
export function createHydrationHook(...stores: PersistedStore[]): () => boolean {
  const subscribe = (onChange: () => void) => {
    const unsubscribers = stores.map((store) => store.persist.onFinishHydration(onChange));
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
  const isHydrated = () => stores.every((store) => store.persist.hasHydrated());

  return () => useSyncExternalStore(subscribe, isHydrated, isHydrated);
}
