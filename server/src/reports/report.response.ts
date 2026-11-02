import type { BiomarkerStatus, ReportStatus } from '../generated/prisma/enums.js';
import type { SkipReason } from './biomarkers/normalize.js';
import type { ReportWithBiomarkers } from './reports.repository.js';

export interface BiomarkerResponse {
  id: string;
  key: string | null;
  name: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  status: BiomarkerStatus;
  why: string | null;
  action: string | null;
}

export interface ReportResponse {
  id: string;
  uploadedAt: string;
  status: ReportStatus;
  /** Flagged markers first, so the app can show what matters at the top. */
  biomarkers: BiomarkerResponse[];
  flaggedCount: number;
  /** Rows that were read but could not be used. Only present right after an upload. */
  skipped?: { name: string; reason: SkipReason }[];
}

export function toReportResponse(report: ReportWithBiomarkers): ReportResponse {
  const biomarkers = report.biomarkers
    .map(({ reportId: _reportId, ...marker }) => marker)
    .sort((a, b) => Number(b.status !== 'NORMAL') - Number(a.status !== 'NORMAL'));

  return {
    id: report.id,
    uploadedAt: report.uploadedAt.toISOString(),
    status: report.status,
    biomarkers,
    flaggedCount: biomarkers.filter((marker) => marker.status !== 'NORMAL').length,
  };
}
