import type {
  Insight,
  InsightContext,
  MealAnalysis,
  ReportExtraction,
  VoiceMealAnalysis,
} from './ai.schemas.js';

/** DI token. Services inject `@Inject(AI_PROVIDER) ai: AiProvider` and never a concrete class. */
export const AI_PROVIDER = Symbol('AI_PROVIDER');

/**
 * Everything Nouri needs from a model. Services depend on this interface only, so the
 * provider (Gemini today, anything else tomorrow, a mock in tests) is swapped by config.
 */
export interface AiProvider {
  analyzeMealImage(image: Buffer, mimeType: string): Promise<MealAnalysis>;
  parseMealVoice(audio: Buffer, mimeType: string): Promise<VoiceMealAnalysis>;
  extractReport(file: Buffer, mimeType: string): Promise<ReportExtraction>;
  generateInsight(context: InsightContext): Promise<Insight>;
}
