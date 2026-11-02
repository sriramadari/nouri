export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface ClockTime {
  hour: number;
  minute: number;
}

/** Sensible defaults for India until Nouri has learned the person's own rhythm. */
export const DEFAULT_TIMES: Record<MealSlot, ClockTime> = {
  breakfast: { hour: 8, minute: 30 },
  lunch: { hour: 13, minute: 30 },
  dinner: { hour: 20, minute: 30 },
};

/** Which local hours count as which meal. */
const SLOT_HOURS: Record<MealSlot, [number, number]> = {
  breakfast: [4, 11],
  lunch: [11, 17],
  dinner: [17, 24],
};

/** Below this many meals in a slot, keep the default rather than guess from noise. */
const MIN_SAMPLES = 2;

export function slotOfTime(date: Date): MealSlot | null {
  const hour = date.getHours();
  const slot = (Object.keys(SLOT_HOURS) as MealSlot[]).find(
    (key) => hour >= SLOT_HOURS[key][0] && hour < SLOT_HOURS[key][1],
  );
  return slot ?? null;
}

/**
 * Learns usual meal times from when meals were logged: the median time per slot, rounded to
 * 5 minutes. The median ignores the odd late lunch better than the average would.
 */
export function learnReminderTimes(loggedAt: string[]): Record<MealSlot, ClockTime> {
  const minutesBySlot: Record<MealSlot, number[]> = { breakfast: [], lunch: [], dinner: [] };
  for (const iso of loggedAt) {
    const date = new Date(iso);
    const slot = slotOfTime(date);
    if (slot) minutesBySlot[slot].push(date.getHours() * 60 + date.getMinutes());
  }

  const result = { ...DEFAULT_TIMES };
  for (const slot of Object.keys(minutesBySlot) as MealSlot[]) {
    const samples = minutesBySlot[slot].sort((a, b) => a - b);
    if (samples.length < MIN_SAMPLES) continue;
    const middle = Math.floor(samples.length / 2);
    const median =
      samples.length % 2 ? samples[middle]! : (samples[middle - 1]! + samples[middle]!) / 2;
    const rounded = Math.round(median / 5) * 5;
    result[slot] = { hour: Math.floor(rounded / 60), minute: rounded % 60 };
  }
  return result;
}
