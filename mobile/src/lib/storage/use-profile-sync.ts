import { useEffect } from 'react';

import { api } from '../api/endpoints';
import { useProfileStore } from './profile-store';

/**
 * Sends the profile to the server whenever it has unsynced changes. If the phone is offline
 * the flag stays set and the next app launch tries again; the app works locally meanwhile.
 */
export function useProfileSync(): void {
  const profile = useProfileStore((state) => state.profile);
  const needsSync = useProfileStore((state) => state.needsSync);
  const markSynced = useProfileStore((state) => state.markSynced);

  useEffect(() => {
    if (!profile || !needsSync) return;
    let cancelled = false;
    api
      .saveMe(profile)
      .then((saved) => {
        if (!cancelled && saved.targets) markSynced(saved.targets);
      })
      .catch(() => {
        // Stays marked as unsynced; retried on the next launch.
      });
    return () => {
      cancelled = true;
    };
  }, [profile, needsSync, markSynced]);
}
