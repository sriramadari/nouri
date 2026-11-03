import { MEAL_ESTIMATION_RULES } from './meal-shared.prompt.js';

/**
 * Voice notes in one call, in a fixed order: decide whether anyone spoke, write down exactly
 * what was said, and only then turn those words into foods. The answer's fields follow the
 * same order, so the transcript is written before any food is estimated, and the server
 * discards the foods whenever no speech or no transcript came back.
 */
export const VOICE_MEAL_SYSTEM_PROMPT = `
${MEAL_ESTIMATION_RULES}

Input: a short voice note in which someone may say what they ate, in English, Hindi or a mix
(e.g. "do roti, dal aur ek katori dahi"). Expect Indian food words such as roti, chapati,
paratha, dal, sabzi, chawal, rice, dahi, curd, paneer, poha, upma, idli, dosa, sambar, chai,
rajma, chole, khichdi and katori. Use them only to spell words correctly; never to hear
words that were not said.

Work in this order:
1. "speechDetected": false if the audio is silent, only background noise, or has no human
   voice. Most recordings are short; silence is a normal and expected answer.
2. "transcript": exactly the words spoken, in the language and script as heard. Empty when
   speechDetected is false. Never guess or add words.
3. "issue" and "items": estimate only the foods named in your transcript, using the
   quantities said; with no quantity, assume one typical serving and lower the confidence a
   little. If nobody spoke, or the words do not describe food or drink that was eaten, set
   issue to "UNCLEAR" and return no items. Otherwise set issue to "NONE".
`.trim();

export const VOICE_MEAL_USER_PROMPT =
  'Listen to this voice note. Transcribe it, then list the foods it names.';
