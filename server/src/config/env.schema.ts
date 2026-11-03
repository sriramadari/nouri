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
    /** Total time for one AI task across the model chain; the app waits 75 s for a meal. */
    AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(60_000),
    /**
     * Who reads voice notes. "groq" uses open models (Whisper, then an open text model) on
     * Groq's free tier, which has far higher limits than Gemini's for this; "gemini" keeps
     * voice on the main provider. Ignored when AI_PROVIDER is "mock".
     */
    AI_VOICE_PROVIDER: z.enum(['gemini', 'groq']).default('gemini'),
    GROQ_API_KEY: z.string().min(1).optional(),
    GROQ_SPEECH_MODEL: z.string().min(1).default('whisper-large-v3-turbo'),
    GROQ_TEXT_MODEL: z.string().min(1).default('openai/gpt-oss-120b'),
  })
  .refine((env) => env.AI_PROVIDER !== 'gemini' || env.GEMINI_API_KEY, {
    message: 'GEMINI_API_KEY is required when AI_PROVIDER is "gemini"',
    path: ['GEMINI_API_KEY'],
  })
  .refine(
    (env) => env.AI_PROVIDER === 'mock' || env.AI_VOICE_PROVIDER !== 'groq' || env.GROQ_API_KEY,
    {
      message: 'GROQ_API_KEY is required when AI_VOICE_PROVIDER is "groq"',
      path: ['GROQ_API_KEY'],
    },
  );

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
