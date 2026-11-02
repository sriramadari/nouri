export interface Streak {
  /** Consecutive days with at least one meal, ending today (or yesterday if today is empty). */
  current: number;
  best: number;
  loggedToday: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Streak from the distinct local days that have a meal (YYYY-MM-DD, any order).
 * A streak stays alive until the end of today: not logging yet today does not break it.
 */
export function computeStreak(loggedDays: string[], today: string): Streak {
  const days = new Set(loggedDays);
  const loggedToday = days.has(today);

  let current = 0;
  for (let day = loggedToday ? today : shift(today, -1); days.has(day); day = shift(day, -1)) {
    current += 1;
  }

  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of [...days].sort()) {
    run = previous !== null && shift(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }

  return { current, best: Math.max(best, current), loggedToday };
}

function shift(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}
