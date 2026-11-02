import { MEAL_ESTIMATION_RULES } from './meal-shared.prompt.js';

export const MEAL_IMAGE_SYSTEM_PROMPT = `
${MEAL_ESTIMATION_RULES}

Input: one photo of a meal.
- Estimate portion size from plate, bowl and hand size cues.
- If the photo has no food or drink, set issue to "NOT_FOOD" and return no items.
- If the photo is too blurry, dark or cropped to identify the food, set issue to "UNCLEAR"
  and return no items.
- Otherwise set issue to "NONE".
`.trim();

export const MEAL_IMAGE_USER_PROMPT =
  'Identify the foods in this photo and estimate their nutrition.';
