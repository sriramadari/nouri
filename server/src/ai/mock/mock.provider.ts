import type { AiProvider } from '../ai-provider.js';
import type {
  Insight,
  InsightContext,
  MealAnalysis,
  ReportExtraction,
  VoiceMealAnalysis,
} from '../ai.schemas.js';
import { MOCK_PHOTO_MEAL, MOCK_REPORT, MOCK_VOICE_MEAL } from './mock.fixtures.js';

/**
 * Realistic canned answers for tests and offline development (AI_PROVIDER=mock).
 * Returns copies so callers can never mutate the shared fixtures.
 */
export class MockProvider implements AiProvider {
  async analyzeMealImage(): Promise<MealAnalysis> {
    return structuredClone(MOCK_PHOTO_MEAL);
  }

  async parseMealVoice(): Promise<VoiceMealAnalysis> {
    return structuredClone(MOCK_VOICE_MEAL);
  }

  async extractReport(): Promise<ReportExtraction> {
    return structuredClone(MOCK_REPORT);
  }

  async generateInsight(context: InsightContext): Promise<Insight> {
    return { ...context.draft };
  }
}
