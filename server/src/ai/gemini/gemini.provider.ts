import { Logger } from '@nestjs/common';
import { ApiError, type GenerateContentParameters, type Part, ThinkingLevel } from '@google/genai';
import type { ZodType } from 'zod';

import type { AiProvider } from '../ai-provider.js';
import { AiError } from '../ai.errors.js';
import {
  type Insight,
  type InsightContext,
  insightSchema,
  type MealAnalysis,
  mealAnalysisSchema,
  type ReportExtraction,
  reportExtractionSchema,
  transcriptionSchema,
  type VoiceMealAnalysis,
} from '../ai.schemas.js';
import { buildInsightUserPrompt, INSIGHT_SYSTEM_PROMPT } from '../prompts/insight.prompt.js';
import { MEAL_IMAGE_SYSTEM_PROMPT, MEAL_IMAGE_USER_PROMPT } from '../prompts/meal-image.prompt.js';
import {
  MEAL_TEXT_SYSTEM_PROMPT,
  TRANSCRIBE_SYSTEM_PROMPT,
  TRANSCRIBE_USER_PROMPT,
} from '../prompts/meal-voice.prompt.js';
import { REPORT_SYSTEM_PROMPT, REPORT_USER_PROMPT } from '../prompts/report.prompt.js';
import { toResponseSchema } from './response-schema.js';

/** The one SDK call this provider needs, injected so tests can fake it. */
export type GenerateContentFn = (params: GenerateContentParameters) => Promise<{ text?: string }>;

export interface GeminiOptions {
  /** Tried in order. Later models are only used when an earlier one is overloaded or slow. */
  models: string[];
  timeoutMs: number;
}

interface JsonRequest<T> {
  task: string;
  schema: ZodType<T>;
  systemInstruction: string;
  parts: Part[];
}

/** One retry for a malformed answer, as agreed in the AI contract. */
const ATTEMPTS_PER_MODEL = 2;

export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(
    private readonly options: GeminiOptions,
    private readonly generateContent: GenerateContentFn,
  ) {}

  analyzeMealImage(image: Buffer, mimeType: string): Promise<MealAnalysis> {
    return this.generateJson({
      task: 'meal image',
      schema: mealAnalysisSchema,
      systemInstruction: MEAL_IMAGE_SYSTEM_PROMPT,
      parts: [mediaPart(image, mimeType), { text: MEAL_IMAGE_USER_PROMPT }],
    });
  }

  /** Two calls on purpose: listen first, then estimate only from words that were heard. */
  async parseMealVoice(audio: Buffer, mimeType: string): Promise<VoiceMealAnalysis> {
    const heard = await this.generateJson({
      task: 'voice transcript',
      schema: transcriptionSchema,
      systemInstruction: TRANSCRIBE_SYSTEM_PROMPT,
      parts: [mediaPart(audio, mimeType), { text: TRANSCRIBE_USER_PROMPT }],
    });
    if (!heard.speechDetected || heard.transcript.trim().length === 0) {
      return { ...heard, issue: 'UNCLEAR', items: [] };
    }

    const meal = await this.generateJson({
      task: 'meal text',
      schema: mealAnalysisSchema,
      systemInstruction: MEAL_TEXT_SYSTEM_PROMPT,
      parts: [{ text: heard.transcript }],
    });
    return { ...heard, ...meal };
  }

  extractReport(file: Buffer, mimeType: string): Promise<ReportExtraction> {
    return this.generateJson({
      task: 'report',
      schema: reportExtractionSchema,
      systemInstruction: REPORT_SYSTEM_PROMPT,
      parts: [mediaPart(file, mimeType), { text: REPORT_USER_PROMPT }],
    });
  }

  generateInsight(context: InsightContext): Promise<Insight> {
    return this.generateJson({
      task: 'insight',
      schema: insightSchema,
      systemInstruction: INSIGHT_SYSTEM_PROMPT,
      parts: [{ text: buildInsightUserPrompt(context) }],
    });
  }

  /** Tries each model in turn, moving on only when a model is overloaded or times out. */
  private async generateJson<T>(request: JsonRequest<T>): Promise<T> {
    let lastError: AiError | undefined;

    for (const model of this.options.models) {
      try {
        return await this.generateWithModel(model, request);
      } catch (error) {
        const retryable =
          error instanceof AiError &&
          (error.failure === 'TIMEOUT' || error.failure === 'UNAVAILABLE');
        if (!retryable) throw error;
        this.logger.warn(`${error.message} Trying the next model.`);
        lastError = error;
      }
    }

    throw lastError ?? new AiError('UNAVAILABLE', 'No AI model is configured.');
  }

  /** Calls one model and validates the answer, retrying once if it is malformed. */
  private async generateWithModel<T>(model: string, request: JsonRequest<T>): Promise<T> {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      const text = await this.callModel(model, request);
      const parsed = parseJson(text, request.schema);
      if (parsed.success) return parsed.data;
      this.logger.warn(`${request.task}: ${model} attempt ${attempt} returned invalid JSON`);
    }
    throw new AiError('INVALID_RESPONSE', `The ${request.task} answer did not match the schema.`);
  }

  private async callModel<T>(model: string, request: JsonRequest<T>): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await this.generateContent({
        model,
        contents: [{ role: 'user', parts: request.parts }],
        config: {
          systemInstruction: request.systemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema: toResponseSchema(request.schema),
          // Extraction and estimation need little reasoning; low thinking keeps answers fast.
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: controller.signal,
        },
      });
      return response.text ?? '';
    } catch (error) {
      throw toAiError(error, controller.signal.aborted, `${request.task} via ${model}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

function mediaPart(data: Buffer, mimeType: string): Part {
  return { inlineData: { data: data.toString('base64'), mimeType } };
}

function parseJson<T>(text: string, schema: ZodType<T>) {
  try {
    return schema.safeParse(JSON.parse(text));
  } catch {
    return { success: false as const };
  }
}

function toAiError(error: unknown, timedOut: boolean, label: string): AiError {
  if (timedOut) return new AiError('TIMEOUT', `${label} timed out.`, { cause: error });
  // 404 means the model was retired and 429 means rate limited: both are worth the next model.
  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
  if (isClientError && error.status !== 404 && error.status !== 429) {
    return new AiError('REJECTED', `${label} was rejected (${error.status}).`, { cause: error });
  }
  const reason = error instanceof ApiError ? `HTTP ${error.status}` : 'network error';
  return new AiError('UNAVAILABLE', `${label} is unavailable (${reason}).`, { cause: error });
}
