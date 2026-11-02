import {
  insightSchema,
  mealAnalysisSchema,
  reportExtractionSchema,
  voiceMealAnalysisSchema,
} from '../ai.schemas.js';
import { MockProvider } from './mock.provider.js';

describe('MockProvider', () => {
  const mock = new MockProvider();

  it('returns fixtures that satisfy the same contracts as a real provider', async () => {
    expect(mealAnalysisSchema.safeParse(await mock.analyzeMealImage()).success).toBe(true);
    expect(voiceMealAnalysisSchema.safeParse(await mock.parseMealVoice()).success).toBe(true);
    expect(reportExtractionSchema.safeParse(await mock.extractReport()).success).toBe(true);
  });

  it('returns a fresh copy each time', async () => {
    const first = await mock.analyzeMealImage();
    first.items.length = 0;
    expect((await mock.analyzeMealImage()).items.length).toBeGreaterThan(0);
  });

  it('echoes the rules engine draft as the insight', async () => {
    const draft = { message: 'Add a protein to lunch.', why: 'You are 40 g short.' };
    const insight = await mock.generateInsight({
      userName: 'Asha',
      goal: 'LOSE_WEIGHT',
      slot: 'AFTERNOON',
      caloriesEaten: 600,
      calorieTarget: 1400,
      proteinEaten: 20,
      proteinTarget: 80,
      flaggedMarkers: [],
      draft,
    });
    expect(insightSchema.parse(insight)).toEqual(draft);
  });
});
