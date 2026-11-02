import { z } from 'zod';

/**
 * Contracts for everything the AI returns. Every provider response is parsed with these
 * schemas before the rest of the app sees it, so a malformed answer can never reach the
 * database or the user. The same schemas are sent to Gemini as its JSON response format.
 */

export const mealItemSchema = z.object({
  name: z.string().min(1).max(80).describe('Food name as an Indian user would say it, e.g. "Roti"'),
  portion: z.string().min(1).max(60).describe('Human portion, e.g. "2 medium", "1 katori (150 g)"'),
  calories: z.number().min(0).max(3000),
  proteinG: z.number().min(0).max(300),
  carbsG: z.number().min(0).max(500),
  fatG: z.number().min(0).max(300),
  confidence: z.number().min(0).max(1).describe('How sure you are about this item, 0 to 1'),
});

export const mealAnalysisSchema = z.object({
  issue: z
    .enum(['NONE', 'NOT_FOOD', 'UNCLEAR'])
    .describe('NOT_FOOD if no food is present, UNCLEAR if too blurry or vague to estimate'),
  items: z.array(mealItemSchema).max(20),
});

/**
 * Step one of voice logging: only listen. Kept separate from estimation because a model asked
 * for both at once will invent a meal out of silence.
 */
export const transcriptionSchema = z.object({
  speechDetected: z
    .boolean()
    .describe('false if the audio is silent, only noise, or has no human voice'),
  transcript: z
    .string()
    .max(500)
    .describe(
      'Exactly what the speaker said, in the original language. Empty if nothing was said.',
    ),
});

/** What a provider returns for a voice note: what it heard plus the meal it parsed from it. */
export const voiceMealAnalysisSchema = transcriptionSchema.extend(mealAnalysisSchema.shape);

export const extractedMarkerSchema = z.object({
  name: z.string().min(1).max(80).describe('Marker name exactly as printed on the report'),
  value: z.number().nullable().describe('Numeric result, or null if it cannot be read'),
  unit: z.string().max(30).describe('Unit exactly as printed, empty string if none'),
  refLow: z.number().nullable().describe('Lower bound of the printed reference range'),
  refHigh: z.number().nullable().describe('Upper bound of the printed reference range'),
});

export const reportExtractionSchema = z.object({
  issue: z
    .enum(['NONE', 'NOT_A_REPORT', 'UNREADABLE'])
    .describe('NOT_A_REPORT if this is not a lab report, UNREADABLE if too blurry to read'),
  markers: z.array(extractedMarkerSchema).max(80),
});

export const insightSchema = z.object({
  message: z.string().min(1).max(160),
  why: z.string().min(1).max(200),
});

export type MealItem = z.infer<typeof mealItemSchema>;
export type MealAnalysis = z.infer<typeof mealAnalysisSchema>;
export type Transcription = z.infer<typeof transcriptionSchema>;
export type VoiceMealAnalysis = z.infer<typeof voiceMealAnalysisSchema>;
export type ExtractedMarker = z.infer<typeof extractedMarkerSchema>;
export type ReportExtraction = z.infer<typeof reportExtractionSchema>;
export type Insight = z.infer<typeof insightSchema>;

/** Facts the rules engine has already decided; the AI only rewrites them warmly. */
export interface InsightContext {
  userName: string;
  goal: 'LOSE_WEIGHT' | 'CONTROL_SUGAR' | 'EAT_BETTER';
  slot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  caloriesEaten: number;
  calorieTarget: number;
  proteinEaten: number;
  proteinTarget: number;
  flaggedMarkers: string[];
  /** The deterministic message, used as the fallback if the AI call fails. */
  draft: Insight;
}
