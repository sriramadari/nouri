import { z } from 'zod';

import { insightSchema } from '../ai/ai.schemas.js';
import { InsightSlot } from '../generated/prisma/enums.js';

/**
 * The phone's rules engine decides what to say; this endpoint only asks the AI to say it
 * warmly. The numbers travel with the draft so the AI can keep them exact.
 */
export const phraseInsightSchema = z.object({
  date: z.iso.date(),
  slot: z.enum(InsightSlot),
  draft: insightSchema,
  facts: z.object({
    caloriesEaten: z.number().int().min(0).max(20_000),
    proteinEaten: z.number().min(0).max(1_000),
    flaggedMarkers: z.array(z.string().max(60)).max(20).default([]),
  }),
});

export type PhraseInsightInput = z.infer<typeof phraseInsightSchema>;
