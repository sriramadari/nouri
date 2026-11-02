import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import type { Env } from '../config/env.schema.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * The single Prisma client for the app. Only repositories inject it.
 *
 * Uses node-postgres through Prisma's driver adapter: the server is a long running
 * process, so a regular connection pool (pointed at Neon's pooled endpoint) fits better
 * than the serverless HTTP driver.
 *
 * Connections open lazily on the first query, so the server still boots (and /health can
 * report the problem) when the database is briefly unreachable.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
        // Neon can take a moment to wake from scale to zero.
        connectionTimeoutMillis: 10_000,
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
