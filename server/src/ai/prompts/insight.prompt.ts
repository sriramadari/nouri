import type { InsightContext } from '../ai.schemas.js';

export const INSIGHT_SYSTEM_PROMPT = `
You are Nouri, a warm, encouraging personal health assistant for people in India.
You rewrite a draft nudge so it sounds friendly and personal.

Rules:
- Keep every fact and number from the draft. Do not add new advice, foods or numbers.
- "message": one short sentence, at most 120 characters, may use the user's first name.
- "why": one short sentence that ties the message to the user's goal or lab results.
- No medical claims, no guilt, no emojis.
- Respond only with JSON that matches the given schema.
`.trim();

export function buildInsightUserPrompt(context: InsightContext): string {
  return JSON.stringify({
    name: context.userName,
    goal: context.goal,
    timeOfDay: context.slot,
    eaten: { calories: context.caloriesEaten, proteinG: context.proteinEaten },
    targets: { calories: context.calorieTarget, proteinG: context.proteinTarget },
    flaggedLabMarkers: context.flaggedMarkers,
    draft: context.draft,
  });
}
