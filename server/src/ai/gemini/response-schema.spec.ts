import { z } from 'zod';

import { toResponseSchema } from './response-schema.js';

describe('toResponseSchema', () => {
  const schema = z.object({
    name: z.string().min(1).max(80).describe('Food name'),
    maximum: z.number().min(0).max(10),
    tags: z.array(z.string()).max(5),
    value: z.number().nullable(),
  });

  it('drops validation keywords but keeps shape, descriptions and field names', () => {
    expect(toResponseSchema(schema)).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Food name' },
        maximum: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } },
        value: { type: ['number', 'null'] },
      },
      required: ['name', 'maximum', 'tags', 'value'],
      additionalProperties: false,
    });
  });

  it('builds each schema once', () => {
    expect(toResponseSchema(schema)).toBe(toResponseSchema(schema));
  });
});
