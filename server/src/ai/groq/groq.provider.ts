import { Logger } from '@nestjs/common';
import { z } from 'zod';

import type { AiProvider } from '../ai-provider.js';
import { AiError } from '../ai.errors.js';
import { mealAnalysisSchema, type VoiceMealAnalysis } from '../ai.schemas.js';
import { MEAL_TEXT_SYSTEM_PROMPT, SPEECH_SPELLING_HINT } from '../prompts/meal-text.prompt.js';

const BASE_URL = 'https://api.groq.com/openai/v1';
/** One retry for a malformed answer, as in the Gemini provider. */
const ATTEMPTS = 2;
/**
 * Whisper rates each segment's chance of being silence. Above this for every segment means
 * nobody spoke; Whisper is known to "hear" phrases like "Thank you." in pure silence.
 */
const NO_SPEECH_THRESHOLD = 0.5;

export interface GroqOptions {
  apiKey: string;
  /** Speech to text, e.g. "whisper-large-v3-turbo". */
  speechModel: string;
  /** Turns the transcript into foods, e.g. "openai/gpt-oss-120b". */
  textModel: string;
  /** Total time for one voice note, shared by both calls. */
  timeoutMs: number;
}

/** The one network call this provider needs, injected so tests can fake it. */
export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

const transcriptionSchema = z.object({
  text: z.string(),
  segments: z.array(z.object({ no_speech_prob: z.number() })).optional(),
});

const chatSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});

/**
 * Voice notes through open models on Groq's free tier: Whisper writes down what was said,
 * then an open text model turns those words into foods. Implements only the voice part of
 * AiProvider; photos and reports stay with a vision model (see RoutingAiProvider).
 */
export class GroqVoiceProvider implements Pick<AiProvider, 'parseMealVoice'> {
  private readonly logger = new Logger(GroqVoiceProvider.name);

  constructor(
    private readonly options: GroqOptions,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  async parseMealVoice(audio: Buffer, mimeType: string): Promise<VoiceMealAnalysis> {
    const deadline = Date.now() + this.options.timeoutMs;

    const heard = await this.transcribe(audio, mimeType, deadline);
    if (!heard.speechDetected) {
      return { speechDetected: false, transcript: '', issue: 'UNCLEAR', items: [] };
    }

    const meal = await this.parseTranscript(heard.transcript, deadline);
    return { speechDetected: true, transcript: heard.transcript, ...meal };
  }

  private async transcribe(audio: Buffer, mimeType: string, deadline: number) {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), fileName(mimeType));
    form.append('model', this.options.speechModel);
    form.append('response_format', 'verbose_json');
    form.append('temperature', '0');
    form.append('prompt', SPEECH_SPELLING_HINT);

    const body = await this.post('/audio/transcriptions', form, deadline, 'voice transcript');
    const parsed = transcriptionSchema.safeParse(body);
    if (!parsed.success) {
      throw new AiError('INVALID_RESPONSE', 'The transcription answer had an unexpected shape.');
    }

    const transcript = parsed.data.text.trim();
    const segments = parsed.data.segments ?? [];
    const someoneSpoke =
      segments.length === 0 ||
      segments.some((segment) => segment.no_speech_prob < NO_SPEECH_THRESHOLD);
    return { speechDetected: transcript.length > 0 && someoneSpoke, transcript };
  }

  private async parseTranscript(transcript: string, deadline: number) {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const body = await this.post(
        '/chat/completions',
        JSON.stringify({
          model: this.options.textModel,
          messages: [
            { role: 'system', content: MEAL_TEXT_SYSTEM_PROMPT },
            { role: 'user', content: transcript },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          // Estimating a meal needs little reasoning; low effort keeps the answer fast.
          reasoning_effort: 'low',
        }),
        deadline,
        'meal text',
      );

      const content = chatSchema.safeParse(body).data?.choices[0]?.message.content ?? '';
      const meal = mealAnalysisSchema.safeParse(safeJson(content));
      if (meal.success) return meal.data;
      this.logger.warn(
        `meal text: ${this.options.textModel} attempt ${attempt} returned invalid JSON`,
      );
    }
    throw new AiError('INVALID_RESPONSE', 'The meal text answer did not match the schema.');
  }

  /** Sends one request within the shared deadline and maps failures to AiError. */
  private async post(
    path: string,
    body: FormData | string,
    deadline: number,
    label: string,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(deadline - Date.now(), 1));
    try {
      const response = await this.fetchFn(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          ...(typeof body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        },
        body,
        signal: controller.signal,
      });
      if (!response.ok) throw await httpError(response, label);
      return await response.json();
    } catch (error) {
      if (error instanceof AiError) throw error;
      if (controller.signal.aborted) {
        throw new AiError('TIMEOUT', `${label} via Groq timed out.`, { cause: error });
      }
      throw new AiError('UNAVAILABLE', `${label} via Groq could not be reached.`, {
        cause: error,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

async function httpError(response: Response, label: string): Promise<AiError> {
  const detail = (await response.text().catch(() => '')).slice(0, 200);
  const message = `${label} via Groq failed (HTTP ${response.status}). ${detail}`;
  // Only these mean the input itself was refused (bad or oversized file). Everything else,
  // including a wrong key (401/403), rate limits (429) and outages (5xx), is our side.
  const badInput = [400, 413, 415, 422].includes(response.status);
  return new AiError(badInput ? 'REJECTED' : 'UNAVAILABLE', message);
}

function fileName(mimeType: string): string {
  if (mimeType.includes('webm')) return 'note.webm';
  if (mimeType.includes('wav')) return 'note.wav';
  if (mimeType.includes('ogg')) return 'note.ogg';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'note.mp3';
  return 'note.m4a';
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
