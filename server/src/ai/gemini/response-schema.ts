import { z, type ZodType } from 'zod';

/**
 * Validation keywords some Gemini models reject. The schema sent to the model only needs to
 * describe the shape; Zod still enforces every limit on the answer afterwards.
 */
const UNSUPPORTED_KEYWORDS = new Set([
  '$schema',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
]);

const cache = new WeakMap<ZodType, unknown>();

/** JSON Schema for Gemini's structured output, built once per Zod schema. */
export function toResponseSchema(schema: ZodType): unknown {
  let jsonSchema = cache.get(schema);
  if (!jsonSchema) {
    jsonSchema = stripKeywords(z.toJSONSchema(schema));
    cache.set(schema, jsonSchema);
  }
  return jsonSchema;
}

function stripKeywords(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripKeywords);
  if (node === null || typeof node !== 'object') return node;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (UNSUPPORTED_KEYWORDS.has(key)) continue;
    // Under "properties" the keys are field names, not keywords, so keep them all.
    result[key] =
      key === 'properties'
        ? Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([field, sub]) => [
              field,
              stripKeywords(sub),
            ]),
          )
        : stripKeywords(value);
  }
  return result;
}
