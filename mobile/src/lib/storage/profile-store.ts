import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Profile, Targets } from '../api/types';
import type { FlaggedMarker } from '../health/focus-areas';
import { persistStorage } from './persist';

/**
 * The finished profile and plan, kept on the device so the app works offline and opens
 * straight to Today after a restart. The server holds the same profile for its own logic.
 */
interface ProfileState {
  profile: Profile | null;
  targets: Targets | null;
  /** Out of range lab results that shape the focus areas. */
  flaggedMarkers: FlaggedMarker[];
  /** When onboarding finished; day one gets a welcome instead of judgement. */
  onboardedAt: string | null;
  /** True until the server has confirmed the latest profile (e.g. saved while offline). */
  needsSync: boolean;
  completeOnboarding: (profile: Profile, targets: Targets, flaggedMarkers: FlaggedMarker[]) => void;
  markSynced: (targets: Targets) => void;
  /** Forgets the profile on this phone, which sends the person back to onboarding. */
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      targets: null,
      flaggedMarkers: [],
      onboardedAt: null,
      needsSync: false,
      completeOnboarding: (profile, targets, flaggedMarkers) =>
        set({
          profile,
          targets,
          flaggedMarkers,
          onboardedAt: new Date().toISOString(),
          needsSync: true,
        }),
      // The server recalculates targets; its numbers win if the two copies ever differ.
      markSynced: (targets) => set({ targets, needsSync: false }),
      reset: () =>
        set({
          profile: null,
          targets: null,
          flaggedMarkers: [],
          onboardedAt: null,
          needsSync: false,
        }),
    }),
    { name: 'nouri.profile', storage: persistStorage },
  ),
);
