import { rangePosition, severityOf, statusLabel } from './severity';

const marker = (
  status: 'LOW' | 'NORMAL' | 'HIGH',
  value: number,
  refLow: number | null,
  refHigh: number | null,
) => ({
  status,
  value,
  refLow,
  refHigh,
});

describe('report severity', () => {
  it('colours slightly out of range amber and clearly out red', () => {
    expect(severityOf(marker('NORMAL', 90, 70, 100))).toBe('normal');
    expect(severityOf(marker('HIGH', 6.1, 4, 5.6))).toBe('mild'); // HbA1c 6.1 vs 5.6 (9% over)
    expect(severityOf(marker('HIGH', 148, null, 100))).toBe('marked'); // LDL 148 vs 100
    expect(severityOf(marker('LOW', 14.2, 30, 100))).toBe('marked'); // vitamin D
    expect(severityOf(marker('LOW', 11.4, 12, 15))).toBe('mild'); // hemoglobin
  });

  it('labels status in plain words', () => {
    expect(statusLabel(marker('NORMAL', 90, 70, 100))).toBe('In range');
    expect(statusLabel(marker('HIGH', 6.1, 4, 5.6))).toBe('Slightly high');
    expect(statusLabel(marker('LOW', 14.2, 30, 100))).toBe('Low');
  });

  it('places the value on a track around the range, clamped to the ends', () => {
    const inRange = rangePosition(marker('NORMAL', 85, 70, 100));
    expect(inRange.low!).toBeLessThan(inRange.value);
    expect(inRange.value).toBeLessThan(inRange.high!);
    const way = rangePosition(marker('HIGH', 400, null, 100));
    expect(way.value).toBe(1);
    expect(way.low).toBeNull();
  });
});
