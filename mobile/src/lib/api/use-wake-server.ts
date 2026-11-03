import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useToast } from '@/components/ui';

import { wakeServer } from './client';

/** Only mention the wait when it is noticeable; a warm server answers in well under a second. */
const SLOW_WAKE_MS = 4_000;

/**
 * Wakes the server when the app opens or comes back to the foreground, and tells the person
 * honestly when that takes a while instead of showing errors.
 */
export function useWakeServer(): void {
  const showToast = useToast((state) => state.show);

  useEffect(() => {
    const wake = () => {
      let done = false;
      const slow = setTimeout(() => {
        if (!done) showToast('Waking up Katori. The first load can take about 30 seconds.', 'info');
      }, SLOW_WAKE_MS);
      wakeServer().finally(() => {
        done = true;
        clearTimeout(slow);
      });
    };

    wake();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') wake();
    });
    return () => subscription.remove();
  }, [showToast]);
}
