import type { ExtractedMarker } from '../../ai/ai.schemas.js';
import { MOCK_REPORT } from '../../ai/mock/mock.fixtures.js';
import { findDefinition, normalizeMarkers } from './normalize.js';

const row = (overrides: Partial<ExtractedMarker>): ExtractedMarker => ({
  name: 'LDL Cholesterol',
  value: 120,
  unit: 'mg/dL',
  refLow: null,
  refHigh: null,
  ...overrides,
});

describe('findDefinition', () => {
  it.each([
    ['Glycosylated Haemoglobin (HbA1c)', 'HBA1C'],
    ['Glucose - Fasting', 'FASTING_GLUCOSE'],
    ['FBS', 'FASTING_GLUCOSE'],
    ['Cholesterol - LDL', 'LDL'],
    ['HDL-C', 'HDL'],
    ['Serum Triglycerides', 'TRIGLYCERIDES'],
    ['25-OH Vitamin D (Total)', 'VITAMIN_D'],
    ['Vitamin B12 (Cyanocobalamin)', 'B12'],
    ['Haemoglobin', 'HEMOGLOBIN'],
    ['Hb', 'HEMOGLOBIN'],
  ])('recognises "%s" as %s', (name, key) => {
    expect(findDefinition(name)?.key).toBe(key);
  });

  it.each(['LDL/HDL Ratio', 'Mean Corpuscular Haemoglobin', 'TSH'])(
    'does not mistake "%s" for a tracked marker',
    (name) => {
      expect(findDefinition(name)).toBeUndefined();
    },
  );
});

describe('normalizeMarkers', () => {
  it('converts mmol/L glucose and its lab range to mg/dL', () => {
    const { markers } = normalizeMarkers(
      [row({ name: 'Glucose Fasting', value: 6.2, unit: 'mmol/L', refLow: 3.9, refHigh: 5.6 })],
      null,
    );
    expect(markers[0]).toMatchObject({
      key: 'FASTING_GLUCOSE',
      value: 111.7,
      unit: 'mg/dL',
      refLow: 70.3,
      refHigh: 100.9,
      status: 'HIGH',
    });
    expect(markers[0]?.action).toBeTruthy();
  });

  it('converts HbA1c from mmol/mol to percent', () => {
    const { markers } = normalizeMarkers(
      [row({ name: 'HbA1c', value: 48, unit: 'mmol/mol' })],
      null,
    );
    expect(markers[0]).toMatchObject({ value: 6.5, unit: '%', status: 'HIGH' });
  });

  it('uses the default range when the lab printed none', () => {
    const { markers } = normalizeMarkers([row({ value: 142 })], null);
    expect(markers[0]).toMatchObject({ refHigh: 100, status: 'HIGH' });
  });

  it('uses a sex specific default range for HDL', () => {
    const hdl = [row({ name: 'HDL', value: 45 })];
    expect(normalizeMarkers(hdl, 'MALE').markers[0]?.status).toBe('NORMAL');
    expect(normalizeMarkers(hdl, 'FEMALE').markers[0]?.status).toBe('LOW');
  });

  it('gives no advice for markers in range', () => {
    const { markers } = normalizeMarkers([row({ value: 80 })], null);
    expect(markers[0]).toMatchObject({ status: 'NORMAL', why: null, action: null });
  });

  it('skips unreadable values and unknown markers without a range, and says why', () => {
    const { markers, skipped } = normalizeMarkers(
      [row({ value: null }), row({ name: 'Lipase', value: 30, unit: 'U/L' })],
      null,
    );
    expect(markers).toEqual([]);
    expect(skipped).toEqual([
      { name: 'LDL Cholesterol', reason: 'VALUE_UNREADABLE' },
      { name: 'Lipase', reason: 'NO_REFERENCE_RANGE' },
    ]);
  });

  it('keeps unknown markers that have a lab range, with generic guidance', () => {
    const { markers } = normalizeMarkers(
      [row({ name: 'TSH', value: 6.1, unit: 'µIU/mL', refLow: 0.4, refHigh: 4.2 })],
      null,
    );
    expect(markers[0]).toMatchObject({ key: null, name: 'TSH', status: 'HIGH' });
    expect(markers[0]?.action).toContain('doctor');
  });

  it('falls back to the lab range when a known marker uses an unknown unit', () => {
    const { markers } = normalizeMarkers(
      [row({ value: 3.1, unit: 'weird-unit', refLow: null, refHigh: 2.6 })],
      null,
    );
    expect(markers[0]).toMatchObject({
      key: 'LDL',
      value: 3.1,
      unit: 'weird-unit',
      status: 'HIGH',
    });
  });

  it('keeps only the first reading when a marker repeats', () => {
    const { markers } = normalizeMarkers([row({ value: 142 }), row({ value: 90 })], null);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.value).toBe(142);
  });

  it('handles the full mock report', () => {
    const { markers, skipped } = normalizeMarkers(MOCK_REPORT.markers, 'FEMALE');
    const flagged = markers.filter((m) => m.status !== 'NORMAL').map((m) => m.key);
    // HDL 44 is NORMAL: the lab printed "> 40", and the lab's own range beats our default of 50.
    expect(flagged).toEqual(['HBA1C', 'FASTING_GLUCOSE', 'LDL', 'TRIGLYCERIDES', 'VITAMIN_D']);
    expect(skipped).toEqual([{ name: 'Vitamin B12', reason: 'VALUE_UNREADABLE' }]);
  });
});
