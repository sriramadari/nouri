import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from '@/lib/storage/persist';

/**
 * Celebrations happen once per goal day. `celebratedOn` is remembered across restarts;
 * `playing` is the burst on screen right now and is never persisted.
 */
interface CelebrationState {
  celebratedOn: string | null;
  playing: string | null;
  start: (dateKey: string) => void;
  finish: () => void;
}

export const useCelebration = create<CelebrationState>()(
  persist(
    (set) => ({
      celebratedOn: null,
      playing: null,
      start: (dateKey) => set({ celebratedOn: dateKey, playing: dateKey }),
      finish: () => set({ playing: null }),
    }),
    {
      name: 'nouri.celebration',
      storage: persistStorage,
      partialize: (state) => ({ celebratedOn: state.celebratedOn }),
    },
  ),
);
