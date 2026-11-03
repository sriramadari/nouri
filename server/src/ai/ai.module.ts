import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import type { Env } from '../config/env.schema.js';
import { AI_PROVIDER, type AiProvider } from './ai-provider.js';
import { GeminiProvider } from './gemini/gemini.provider.js';
import { GroqVoiceProvider } from './groq/groq.provider.js';
import { MockProvider } from './mock/mock.provider.js';
import { RoutingAiProvider } from './routing.provider.js';

/** Picks the AI provider from config. Nothing outside this file knows which one is live. */
function createAiProvider(config: ConfigService<Env, true>): AiProvider {
  if (config.get('AI_PROVIDER', { infer: true }) === 'mock') return new MockProvider();

  const timeoutMs = config.get('AI_TIMEOUT_MS', { infer: true });
  const client = new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY', { infer: true }) });
  const gemini = new GeminiProvider(
    { models: config.get('GEMINI_MODELS', { infer: true }), timeoutMs },
    (params) => client.models.generateContent(params),
  );
  if (config.get('AI_VOICE_PROVIDER', { infer: true }) !== 'groq') return gemini;

  const voice = new GroqVoiceProvider({
    apiKey: config.get('GROQ_API_KEY', { infer: true }) ?? '',
    speechModel: config.get('GROQ_SPEECH_MODEL', { infer: true }),
    textModel: config.get('GROQ_TEXT_MODEL', { infer: true }),
    timeoutMs,
  });
  return new RoutingAiProvider(gemini, voice);
}

@Global()
@Module({
  providers: [{ provide: AI_PROVIDER, useFactory: createAiProvider, inject: [ConfigService] }],
  exports: [AI_PROVIDER],
})
export class AiModule {}
