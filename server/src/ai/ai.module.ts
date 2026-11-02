import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import type { Env } from '../config/env.schema.js';
import { AI_PROVIDER, type AiProvider } from './ai-provider.js';
import { GeminiProvider } from './gemini/gemini.provider.js';
import { MockProvider } from './mock/mock.provider.js';

/** Picks the AI provider from config. Nothing outside this file knows which one is live. */
function createAiProvider(config: ConfigService<Env, true>): AiProvider {
  if (config.get('AI_PROVIDER', { infer: true }) === 'mock') return new MockProvider();

  const client = new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY', { infer: true }) });
  return new GeminiProvider(
    {
      models: config.get('GEMINI_MODELS', { infer: true }),
      timeoutMs: config.get('AI_TIMEOUT_MS', { infer: true }),
    },
    (params) => client.models.generateContent(params),
  );
}

@Global()
@Module({
  providers: [{ provide: AI_PROVIDER, useFactory: createAiProvider, inject: [ConfigService] }],
  exports: [AI_PROVIDER],
})
export class AiModule {}
