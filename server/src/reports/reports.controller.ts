import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../common/identity/current-user.decorator.js';
import {
  IMAGE_TYPES,
  MB,
  PDF_TYPES,
  requireUpload,
  UPLOAD_FIELD,
} from '../common/files/uploads.js';
import type { User } from '../generated/prisma/client.js';
import type { ReportResponse } from './report.response.js';
import { ReportsService } from './reports.service.js';

/** Multi page PDFs from labs are often a few MB. */
const MAX_REPORT_UPLOAD_BYTES = 15 * MB;

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Multipart upload of a report photo or PDF. Extracts, stores and returns the markers. */
  @Post()
  @UseInterceptors(FileInterceptor(UPLOAD_FIELD, { limits: { fileSize: MAX_REPORT_UPLOAD_BYTES } }))
  upload(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ReportResponse> {
    return this.reportsService.upload(
      user,
      requireUpload(file, [...IMAGE_TYPES, ...PDF_TYPES], 'report photo or PDF'),
    );
  }

  @Get('latest')
  latest(@CurrentUser() user: User): Promise<ReportResponse> {
    return this.reportsService.latest(user);
  }
}
