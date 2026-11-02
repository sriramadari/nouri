import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '../common/identity/public.decorator.js';
import { HealthService, type HealthStatus } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** 200 when everything is reachable, 503 when the database is down (for uptime monitors). */
  @Public()
  @Get()
  async getHealth(@Res({ passthrough: true }) res: Response): Promise<HealthStatus> {
    const health = await this.healthService.check();
    res.status(health.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return health;
  }
}
