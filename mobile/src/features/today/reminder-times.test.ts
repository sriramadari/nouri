import { DEFAULT_TIMES, learnReminderTimes, slotOfTime } from './reminder-times';

const at = (day: number, hour: number, minute: number) =>
  new Date(2026, 10, day, hour, minute).toISOString();

describe('reminder times', () => {
  it('uses defaults before Katori has learned anything', () => {
    expect(learnReminderTimes([])).toEqual(DEFAULT_TIMES);
  });

  it('learns the median time per meal, rounded to 5 minutes', () => {
    const times = learnReminderTimes([
      at(1, 9, 2),
      at(2, 9, 14),
      at(3, 9, 31),
      at(1, 14, 0),
      at(2, 14, 10),
    ]);
    expect(times.breakfast).toEqual({ hour: 9, minute: 15 });
    expect(times.lunch).toEqual({ hour: 14, minute: 5 });
    expect(times.dinner).toEqual(DEFAULT_TIMES.dinner); // not enough dinners yet
  });

  it('ignores one odd meal time', () => {
    expect(learnReminderTimes([at(1, 13, 0), at(2, 13, 0), at(3, 16, 30)]).lunch).toEqual({
      hour: 13,
      minute: 0,
    });
  });

  it('maps hours to meal slots', () => {
    expect(slotOfTime(new Date(2026, 10, 3, 7))).toBe('breakfast');
    expect(slotOfTime(new Date(2026, 10, 3, 12))).toBe('lunch');
    expect(slotOfTime(new Date(2026, 10, 3, 21))).toBe('dinner');
    expect(slotOfTime(new Date(2026, 10, 3, 2))).toBeNull();
  });
});
