import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';

import { createTestApp } from './support/create-test-app.js';

const DEVICE = 'device-meals-0001';

describe('Meals (e2e, MockProvider)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('analyses an uploaded photo into an unsaved draft', async () => {
    const res = await request(app.getHttpServer())
      .post('/meals/analyze')
      .set('x-device-id', DEVICE)
      .attach('file', Buffer.from('fake-jpeg-bytes'), {
        filename: 'lunch.jpg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    expect(res.body).toMatchObject({ source: 'PHOTO', needsReview: true });
    expect(res.body.totals.calories).toBe(570);
  });

  it('analyses a voice note recorded on a phone', async () => {
    const res = await request(app.getHttpServer())
      .post('/meals/analyze')
      .set('x-device-id', DEVICE)
      .attach('file', Buffer.from('fake-m4a-bytes'), {
        filename: 'note.m4a',
        contentType: 'audio/x-m4a',
      })
      .expect(200);

    expect(res.body.source).toBe('VOICE');
  });

  it('rejects a missing file and an unsupported type with clear codes', async () => {
    const server = app.getHttpServer();
    const missing = await request(server)
      .post('/meals/analyze')
      .set('x-device-id', DEVICE)
      .expect(400);
    expect(missing.body.error.code).toBe('FILE_MISSING');

    const wrongType = await request(server)
      .post('/meals/analyze')
      .set('x-device-id', DEVICE)
      .attach('file', Buffer.from('%PDF'), { filename: 'menu.pdf', contentType: 'application/pdf' })
      .expect(415);
    expect(wrongType.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('saves a meal once even when the request is retried, and lists it for the local day', async () => {
    const server = app.getHttpServer();
    const meal = {
      clientRequestId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      eatenAt: '2026-11-02T07:30:00.000+05:30',
      source: 'VOICE',
      items: [
        { name: 'Roti', portion: '2 medium', calories: 240, proteinG: 8, carbsG: 44, fatG: 4 },
      ],
    };

    const first = await request(server)
      .post('/meals')
      .set('x-device-id', DEVICE)
      .send(meal)
      .expect(201);
    const retry = await request(server)
      .post('/meals')
      .set('x-device-id', DEVICE)
      .send(meal)
      .expect(201);
    expect(retry.body.id).toBe(first.body.id);

    const day = await request(server)
      .get('/meals?date=2026-11-02&tzOffsetMinutes=330')
      .set('x-device-id', DEVICE)
      .expect(200);
    expect(day.body.meals).toHaveLength(1);
    expect(day.body.totals.calories).toBe(240);
  });

  it('rejects a meal without items', async () => {
    const res = await request(app.getHttpServer())
      .post('/meals')
      .set('x-device-id', DEVICE)
      .send({
        clientRequestId: '6f1c3b6e-2b8a-4c9d-8e7f-1a2b3c4d5e6f',
        eatenAt: '2026-11-02T07:30:00Z',
        source: 'MANUAL',
        items: [],
      })
      .expect(400);
    expect(res.body.error.details[0].field).toBe('items');
  });
});
