import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/endpoints';
import type { Streak } from '@/lib/api/types';
import { localDateKey } from '@/lib/dates';

/**
 * The server's streak, adjusted for meals logged today but not synced yet, so an offline
 * meal keeps the flame lit straight away.
 */
export function useStreak(mealsToday: number): Streak | null {
  const { data } = useQuery({ queryKey: ['streak', localDateKey()], queryFn: api.getStreak });
  if (!data) return null;
  if (!data.loggedToday && mealsToday > 0) {
    const current = data.current + 1;
    return { current, best: Math.max(data.best, current), loggedToday: true };
  }
  return data;
}
