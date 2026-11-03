import type { ExtractedMarker } from '../../ai/ai.schemas.js';
import type { BiomarkerStatus, Sex } from '../../generated/prisma/enums.js';
import {
  GUIDANCE_FOR_UNKNOWN_MARKER,
  type MarkerDefinition,
  type MarkerKey,
  MARKERS,
  type Range,
} from './catalog.js';

export interface NormalizedMarker {
  key: MarkerKey | null;
  name: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  status: BiomarkerStatus;
  why: string | null;
  action: string | null;
}

/** An extracted row whose value could be read. */
type Reading = ExtractedMarker & { value: number };

export type SkipReason = 'VALUE_UNREADABLE' | 'NO_REFERENCE_RANGE';

export interface NormalizationResult {
  markers: NormalizedMarker[];
  skipped: { name: string; reason: SkipReason }[];
}

/**
 * Turns raw extracted rows into Katori's markers: matches names to known markers, converts
 * units, decides LOW / NORMAL / HIGH and attaches guidance. Pure and deterministic.
 */
export function normalizeMarkers(raw: ExtractedMarker[], sex: Sex | null): NormalizationResult {
  const result: NormalizationResult = { markers: [], skipped: [] };
  const seen = new Set<MarkerKey>();

  for (const row of raw) {
    if (row.value === null) {
      result.skipped.push({ name: row.name, reason: 'VALUE_UNREADABLE' });
      continue;
    }

    const reading: Reading = { ...row, value: row.value };
    const definition = findDefinition(reading.name);
    // Reports sometimes repeat a marker (e.g. on a summary page); keep the first reading.
    if (definition && seen.has(definition.key)) continue;

    const marker = definition
      ? normalizeKnown(definition, reading, sex)
      : normalizeUnknown(reading);

    if (!marker) {
      result.skipped.push({ name: row.name, reason: 'NO_REFERENCE_RANGE' });
      continue;
    }
    if (definition) seen.add(definition.key);
    result.markers.push(marker);
  }

  return result;
}

export function findDefinition(printedName: string): MarkerDefinition | undefined {
  const name = printedName
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();
  if (name.includes('ratio')) return undefined; // "LDL/HDL ratio" is not LDL
  return MARKERS.find((marker) => marker.aliases.some((alias) => alias.test(name)));
}

function normalizeKnown(
  definition: MarkerDefinition,
  row: Reading,
  sex: Sex | null,
): NormalizedMarker | null {
  // Labs sometimes omit the unit; assume the standard one rather than discard the result.
  const convert = row.unit.trim()
    ? definition.conversions[normalizeUnit(row.unit)]
    : (value: number) => value;

  // Unknown unit: we cannot compare with our ranges, so trust only the lab's own range.
  if (!convert) return normalizeUnknown(row, definition);

  const labRange: Range = {
    low: row.refLow === null ? null : convert(row.refLow),
    high: row.refHigh === null ? null : convert(row.refHigh),
  };
  const range =
    labRange.low !== null || labRange.high !== null ? labRange : definition.defaultRange(sex);
  const value = convert(row.value);
  const status = statusFor(value, range);
  const guidance = status === 'NORMAL' ? undefined : definition.guidance[status];

  return {
    key: definition.key,
    name: definition.displayName,
    value: round(value),
    unit: definition.unit,
    refLow: range.low === null ? null : round(range.low),
    refHigh: range.high === null ? null : round(range.high),
    status,
    why: guidance?.why ?? null,
    action: guidance?.action ?? null,
  };
}

/** Markers Katori doesn't track are kept only when the lab printed a range to judge them by. */
function normalizeUnknown(row: Reading, definition?: MarkerDefinition): NormalizedMarker | null {
  if (row.refLow === null && row.refHigh === null) return null;
  const status = statusFor(row.value, { low: row.refLow, high: row.refHigh });
  const guidance =
    status === 'NORMAL' ? undefined : (definition?.guidance[status] ?? GUIDANCE_FOR_UNKNOWN_MARKER);

  return {
    key: definition?.key ?? null,
    name: definition?.displayName ?? row.name,
    value: row.value,
    unit: row.unit,
    refLow: row.refLow,
    refHigh: row.refHigh,
    status,
    why: guidance?.why ?? null,
    action: guidance?.action ?? null,
  };
}

function statusFor(value: number, range: Range): BiomarkerStatus {
  if (range.low !== null && value < range.low) return 'LOW';
  if (range.high !== null && value > range.high) return 'HIGH';
  return 'NORMAL';
}

/** "mg / dL" → "mg/dl", "µg/L" → "ug/l", "mcg/l" → "ug/l". */
function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/\s+/g, '').replace(/[µμ]/g, 'u').replace(/^mcg/, 'ug');
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
