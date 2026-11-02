import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';

import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/database/prisma.service.js';
import { MealsRepository } from '../../src/meals/meals.repository.js';
import { UsersRepository } from '../../src/users/users.repository.js';
import { InMemoryMealsRepository, InMemoryUsersRepository } from './in-memory-repositories.js';

/** The real app (guards, pipes, filter, MockProvider) with in memory persistence. */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(UsersRepository)
    .useClass(InMemoryUsersRepository)
    .overrideProvider(MealsRepository)
    .useClass(InMemoryMealsRepository)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  await app.init();
  return app;
}
