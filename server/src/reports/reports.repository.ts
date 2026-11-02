import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { NormalizedMarker } from './biomarkers/normalize.js';

const withBiomarkers = { biomarkers: { orderBy: { name: 'asc' } } } as const;

export type ReportWithBiomarkers = Prisma.ReportGetPayload<{ include: typeof withBiomarkers }>;

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Records the upload first, so failed extractions are visible too. */
  async startReport(userId: string): Promise<string> {
    const report = await this.prisma.report.create({ data: { userId }, select: { id: true } });
    return report.id;
  }

  /** Stores the markers and marks the report complete in one transaction. */
  completeReport(reportId: string, markers: NormalizedMarker[]): Promise<ReportWithBiomarkers> {
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'COMPLETED', biomarkers: { createMany: { data: markers } } },
      include: withBiomarkers,
    });
  }

  async failReport(reportId: string): Promise<void> {
    await this.prisma.report.update({ where: { id: reportId }, data: { status: 'FAILED' } });
  }

  findLatestCompleted(userId: string): Promise<ReportWithBiomarkers | null> {
    return this.prisma.report.findFirst({
      where: { userId, status: 'COMPLETED' },
      orderBy: { uploadedAt: 'desc' },
      include: withBiomarkers,
    });
  }
}
