import { z } from 'zod';

/**
 * Every environment variable the server reads, validated once at startup.
 * A missing or malformed value stops the boot with a clear message instead of
 * failing later on the first request.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    /** Neon pooled connection (hostname contains -pooler). Used by the running app. */
    DATABASE_URL: z.url(),
    AI_PROVIDER: z.enum(['gemini', 'mock']).default('gemini'),
    GEMINI_API_KEY: z.string().min(1).optional(),
  })
  .refine((env) => env.AI_PROVIDER !== 'gemini' || env.GEMINI_API_KEY, {
    message: 'GEMINI_API_KEY is required when AI_PROVIDER is "gemini"',
    path: ['GEMINI_API_KEY'],
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}
