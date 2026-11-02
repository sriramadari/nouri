import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { AiModule } from './ai/ai.module.js';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter.js';
import { DeviceGuard } from './common/identity/device.guard.js';
import { validateEnv } from './config/env.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { InsightsModule } from './insights/insights.module.js';
import { MealsModule } from './meals/meals.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    DatabaseModule,
    AiModule,
    HealthModule,
    UsersModule,
    MealsModule,
    ReportsModule,
    InsightsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: DeviceGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
