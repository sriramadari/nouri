import { computeStreak } from './streak.js';

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-11-01', '2026-11-02', '2026-11-03'], '2026-11-03')).toEqual({
      current: 3,
      best: 3,
      loggedToday: true,
    });
  });

  it('keeps the streak alive until today ends', () => {
    expect(computeStreak(['2026-11-01', '2026-11-02'], '2026-11-03')).toMatchObject({
      current: 2,
      loggedToday: false,
    });
  });

  it('resets after a missed day but remembers the best run', () => {
    expect(
      computeStreak(
        ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-11-03'],
        '2026-11-03',
      ),
    ).toEqual({ current: 1, best: 4, loggedToday: true });
  });

  it('handles a new user and month boundaries', () => {
    expect(computeStreak([], '2026-11-03')).toEqual({ current: 0, best: 0, loggedToday: false });
    expect(computeStreak(['2026-10-31', '2026-11-01'], '2026-11-01').current).toBe(2);
  });
});
