import { Inject, Injectable } from '@nestjs/common';

import { AI_PROVIDER, type AiProvider } from '../ai/ai-provider.js';
import { AppError } from '../common/errors/app-error.js';
import type { User } from '../generated/prisma/client.js';
import { normalizeMarkers } from './biomarkers/normalize.js';
import { type ReportResponse, toReportResponse } from './report.response.js';
import { ReportsRepository } from './reports.repository.js';

export interface ReportUpload {
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    private readonly reports: ReportsRepository,
  ) {}

  /**
   * Reads a blood report: the AI only extracts printed values; matching, unit conversion,
   * status and guidance are deterministic code.
   */
  async upload(user: User, upload: ReportUpload): Promise<ReportResponse> {
    const reportId = await this.reports.startReport(user.id);

    try {
      const extraction = await this.ai.extractReport(upload.buffer, upload.mimetype);
      if (extraction.issue === 'NOT_A_REPORT') {
        throw new AppError(
          'REPORT_UNREADABLE',
          "That doesn't look like a blood test report. Try a photo or PDF of your lab results.",
        );
      }

      const { markers, skipped } = normalizeMarkers(extraction.markers, user.sex);
      if (markers.length === 0) {
        throw new AppError(
          'REPORT_UNREADABLE',
          "Katori couldn't read any results. Try a sharper, well lit photo with the whole page in view.",
          { skipped },
        );
      }

      const report = await this.reports.completeReport(reportId, markers);
      return { ...toReportResponse(report), skipped };
    } catch (error) {
      await this.reports.failReport(reportId);
      throw error;
    }
  }

  async latest(user: User): Promise<ReportResponse> {
    const report = await this.reports.findLatestCompleted(user.id);
    if (!report) throw new AppError('NOT_FOUND', 'No blood report uploaded yet.');
    return toReportResponse(report);
  }
}
