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
    /**
     * Comma separated, tried in order. A later model is used only when an earlier one is
     * overloaded, out of quota, retired or slow. Each model has its own free tier quota.
     */
    GEMINI_MODELS: z
      .string()
      .default('gemini-3.5-flash,gemini-3.8-flash,gemini-3.5-flash-lite')
      .transform((list) =>
        list
          .split(',')
          .map((model) => model.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.string()).min(1, 'List at least one Gemini model.')),
    /** Per call limit. Successful answers take 4 to 8 seconds; a hung model should not hold users for long. */
    AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(20_000),
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
