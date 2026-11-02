import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import type { User } from '../src/generated/prisma/client.js';
import type { Targets } from '../src/users/targets.js';
import type { UpsertProfileInput } from '../src/users/users.schemas.js';
import { UsersRepository } from '../src/users/users.repository.js';

/** In memory stand in for the Prisma backed repository, so this test needs no database. */
class InMemoryUsersRepository {
  private readonly byDevice = new Map<string, User>();

  async findOrCreateByDeviceId(deviceId: string): Promise<User> {
    const existing = this.byDevice.get(deviceId);
    if (existing) return existing;
    const user = {
      id: `user-${this.byDevice.size + 1}`,
      deviceId,
      name: null,
      age: null,
      sex: null,
      heightCm: null,
      weightKg: null,
      activityLevel: null,
      goal: null,
      calorieTarget: null,
      proteinTarget: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } satisfies User;
    this.byDevice.set(deviceId, user);
    return user;
  }

  async updateProfile(userId: string, profile: UpsertProfileInput, targets: Targets) {
    const user = [...this.byDevice.values()].find((u) => u.id === userId)!;
    const updated: User = {
      ...user,
      ...profile,
      calorieTarget: targets.calories,
      proteinTarget: targets.proteinG,
    };
    this.byDevice.set(user.deviceId, updated);
    return updated;
  }
}

const profile = {
  name: 'Asha',
  age: 28,
  sex: 'FEMALE',
  heightCm: 160,
  weightKg: 68,
  activityLevel: 'LIGHT',
  goal: 'LOSE_WEIGHT',
};

describe('Users (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(UsersRepository)
      .useClass(InMemoryUsersRepository)
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without a device id in the standard error shape', async () => {
    const res = await request(app.getHttpServer()).get('/users/me').expect(401);
    expect(res.body).toEqual({
      error: { code: 'DEVICE_ID_MISSING', message: 'The x-device-id header is required.' },
    });
  });

  it('returns an empty profile for a new device', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('x-device-id', 'device-new-0001')
      .expect(200);
    expect(res.body).toMatchObject({ profile: null, targets: null });
  });

  it('saves a profile and returns server calculated targets', async () => {
    const server = app.getHttpServer();
    const saved = await request(server)
      .post('/users/me')
      .set('x-device-id', 'device-asha-0001')
      .send(profile)
      .expect(201);
    expect(saved.body.profile).toEqual(profile);
    // BMR 1379 x 1.375 = 1896 - 500 = 1396 -> 1400 kcal; 68 kg x 1.2 = 81.6 -> 80 g protein
    expect(saved.body.targets).toEqual({ calories: 1400, proteinG: 80 });

    const read = await request(server)
      .get('/users/me')
      .set('x-device-id', 'device-asha-0001')
      .expect(200);
    expect(read.body).toEqual(saved.body);
  });

  it('lists every invalid field', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/me')
      .set('x-device-id', 'device-asha-0001')
      .send({ ...profile, age: 12, goal: 'GET_RICH' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(['age', 'goal']);
  });
});
