import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './persist';

const KEEP_LAST = 42; // about two weeks of three meals a day

/** When meals were eaten recently, so reminders can follow the person's real rhythm. */
interface MealTimesState {
  eatenAt: string[];
  record: (iso: string) => void;
}

export const useMealTimes = create<MealTimesState>()(
  persist(
    (set) => ({
      eatenAt: [],
      record: (iso) => set((state) => ({ eatenAt: [...state.eatenAt, iso].slice(-KEEP_LAST) })),
    }),
    { name: 'nouri.mealTimes', storage: persistStorage },
  ),
);
