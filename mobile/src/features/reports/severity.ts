import type { Biomarker } from '@/lib/api/types';

export type Severity = 'normal' | 'mild' | 'marked';

/** Within 10% beyond the range counts as "slightly"; further out is clearly out of range. */
const MILD_LIMIT = 0.1;

/**
 * Turns LOW / NORMAL / HIGH into the three status colours: green (in range), amber
 * (slightly out) and red (clearly out), so the list shows what matters most at a glance.
 */
export function severityOf(
  marker: Pick<Biomarker, 'status' | 'value' | 'refLow' | 'refHigh'>,
): Severity {
  if (marker.status === 'NORMAL') return 'normal';
  const bound = marker.status === 'HIGH' ? marker.refHigh : marker.refLow;
  if (bound === null || bound === 0) return 'marked';
  const distance = Math.abs(marker.value - bound) / Math.abs(bound);
  return distance <= MILD_LIMIT ? 'mild' : 'marked';
}

export function statusLabel(
  marker: Pick<Biomarker, 'status' | 'value' | 'refLow' | 'refHigh'>,
): string {
  if (marker.status === 'NORMAL') return 'In range';
  const slightly = severityOf(marker) === 'mild' ? 'Slightly ' : '';
  const word = marker.status === 'HIGH' ? 'high' : 'low';
  return slightly ? `${slightly}${word}` : word[0]!.toUpperCase() + word.slice(1);
}

/** Where the value sits on a 0..1 track drawn from the reference range (with margin). */
export function rangePosition(marker: Pick<Biomarker, 'value' | 'refLow' | 'refHigh'>): {
  value: number;
  low: number | null;
  high: number | null;
} {
  const low = marker.refLow;
  const high = marker.refHigh;
  const span =
    low !== null && high !== null ? high - low : Math.abs(high ?? low ?? marker.value) || 1;
  const min = (low ?? (high ?? marker.value) - span) - span * 0.5;
  const max = (high ?? (low ?? marker.value) + span) + span * 0.5;
  const at = (x: number) => Math.min(Math.max((x - min) / (max - min), 0), 1);
  return {
    value: at(marker.value),
    low: low === null ? null : at(low),
    high: high === null ? null : at(high),
  };
}
