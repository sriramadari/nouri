import { MEAL_ESTIMATION_RULES } from './meal-shared.prompt.js';

/**
 * Turns a voice note's transcript into foods. Used when speech is transcribed by a separate
 * speech-to-text model (Whisper): this step only ever sees the words, never the audio, so it
 * cannot invent a meal from silence.
 */
export const MEAL_TEXT_SYSTEM_PROMPT = `
${MEAL_ESTIMATION_RULES}

Input: what the user said they ate, transcribed from a voice note. It may be in English,
Hindi or a mix (e.g. "do roti, dal aur ek katori dahi").
- Use the quantities the user says. If no quantity is given, assume one typical serving and
  lower the confidence a little.
- Only list foods that the text mentions.
- If the text does not describe food or drink that was eaten, set issue to "UNCLEAR" and
  return no items. Otherwise set issue to "NONE".

Answer with one JSON object and nothing else, in exactly this shape:
{"issue": "NONE" | "UNCLEAR", "items": [{"name": string, "portion": string, "calories": number,
"proteinG": number, "carbsG": number, "fatG": number, "confidence": number}]}
`.trim();

/**
 * Whisper's prompt is a spelling hint, not an instruction: it nudges the transcript towards
 * these words when they are actually spoken.
 */
export const SPEECH_SPELLING_HINT =
  'Roti, chapati, paratha, dal, sabzi, chawal, rice, dahi, curd, paneer, poha, upma, idli, ' +
  'dosa, sambar, chai, rajma, chole, khichdi, katori.';
