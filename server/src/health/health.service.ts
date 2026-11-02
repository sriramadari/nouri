import { Injectable, Logger } from '@nestjs/common';

import { HealthRepository } from './health.repository.js';

/** Long enough for Neon to wake from scale to zero, short enough for a health probe. */
const DATABASE_CHECK_TIMEOUT_MS = 8_000;

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'connected' | 'disconnected';
  uptimeSeconds: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly health: HealthRepository) {}

  async check(): Promise<HealthStatus> {
    const databaseUp = await this.isDatabaseReachable();
    return {
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'connected' : 'disconnected',
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  private async isDatabaseReachable(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Database check timed out')),
        DATABASE_CHECK_TIMEOUT_MS,
      );
    });

    try {
      await Promise.race([this.health.pingDatabase(), timeout]);
      return true;
    } catch (error) {
      this.logger.warn(`Database check failed: ${error instanceof Error ? error.message : error}`);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
