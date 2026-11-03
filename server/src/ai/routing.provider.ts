import type { AiProvider } from './ai-provider.js';
import type {
  Insight,
  InsightContext,
  MealAnalysis,
  ReportExtraction,
  VoiceMealAnalysis,
} from './ai.schemas.js';

/**
 * Sends each task to the provider best suited to it: voice to a speech model, everything
 * else (photos, reports, insights) to the main vision model. Services still see one
 * AiProvider, so adding or swapping a provider never touches them.
 */
export class RoutingAiProvider implements AiProvider {
  constructor(
    private readonly main: AiProvider,
    private readonly voice: Pick<AiProvider, 'parseMealVoice'>,
  ) {}

  analyzeMealImage(image: Buffer, mimeType: string): Promise<MealAnalysis> {
    return this.main.analyzeMealImage(image, mimeType);
  }

  parseMealVoice(audio: Buffer, mimeType: string): Promise<VoiceMealAnalysis> {
    return this.voice.parseMealVoice(audio, mimeType);
  }

  extractReport(file: Buffer, mimeType: string): Promise<ReportExtraction> {
    return this.main.extractReport(file, mimeType);
  }

  generateInsight(context: InsightContext): Promise<Insight> {
    return this.main.generateInsight(context);
  }
}
