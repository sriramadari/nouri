import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';

import { createTestApp } from './support/create-test-app.js';

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
    app = await createTestApp();
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
