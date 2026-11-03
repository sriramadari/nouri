import { Inject, Injectable, Logger } from '@nestjs/common';

import { AI_PROVIDER, type AiProvider } from '../ai/ai-provider.js';
import type { Insight } from '../ai/ai.schemas.js';
import type { User } from '../generated/prisma/client.js';
import { InsightsRepository } from './insights.repository.js';
import type { PhraseInsightInput } from './insights.schemas.js';

export interface PhrasedInsight extends Insight {
  /** "ai" when the model phrased it, "rules" when the draft was used as the fallback. */
  source: 'ai' | 'rules';
}

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    private readonly insights: InsightsRepository,
  ) {}

  /**
   * Phrases the rules engine's message warmly. Never fails: if the AI is slow or down, the
   * deterministic draft is returned as is, so the assistant card always has something to say.
   */
  async phrase(user: User, input: PhraseInsightInput): Promise<PhrasedInsight> {
    let result: PhrasedInsight = { ...input.draft, source: 'rules' };

    if (user.name && user.goal && user.calorieTarget && user.proteinTarget) {
      try {
        const phrased = await this.ai.generateInsight({
          userName: user.name,
          goal: user.goal,
          slot: input.slot,
          caloriesEaten: input.facts.caloriesEaten,
          calorieTarget: user.calorieTarget,
          proteinEaten: input.facts.proteinEaten,
          proteinTarget: user.proteinTarget,
          flaggedMarkers: input.facts.flaggedMarkers,
          draft: input.draft,
        });
        result = { ...phrased, source: 'ai' };
      } catch (error) {
        this.logger.warn(`Insight fell back to the rules draft: ${String(error)}`);
      }
    }

    await this.insights
      .saveLatest(user.id, input.date, input.slot, { message: result.message, why: result.why })
      .catch((error: unknown) => this.logger.warn(`Could not store insight: ${String(error)}`));
    return result;
  }
}
