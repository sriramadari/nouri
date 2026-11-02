import { AiError } from '../ai/ai.errors.js';
import { MockProvider } from '../ai/mock/mock.provider.js';
import type { User } from '../generated/prisma/client.js';
import type { InsightsRepository } from './insights.repository.js';
import { InsightsService } from './insights.service.js';

const user = {
  id: 'user-1',
  name: 'Asha',
  goal: 'LOSE_WEIGHT',
  calorieTarget: 1400,
  proteinTarget: 80,
} as User;

const input = {
  date: '2026-11-03',
  slot: 'AFTERNOON' as const,
  draft: { message: 'Add protein to dinner.', why: 'You are at 20 of 80 g.' },
  facts: { caloriesEaten: 600, proteinEaten: 20, flaggedMarkers: [] },
};

function setup(ai = new MockProvider()) {
  const saveLatest = vi.fn().mockResolvedValue(undefined);
  const service = new InsightsService(ai, { saveLatest } as unknown as InsightsRepository);
  return { service, saveLatest, ai };
}

describe('InsightsService', () => {
  it('returns the AI phrasing and stores it', async () => {
    const { service, saveLatest, ai } = setup();
    vi.spyOn(ai, 'generateInsight').mockResolvedValue({
      message: 'Asha, dinner is your protein moment.',
      why: 'You are at 20 of 80 g.',
    });

    await expect(service.phrase(user, input)).resolves.toMatchObject({
      source: 'ai',
      message: 'Asha, dinner is your protein moment.',
    });
    expect(saveLatest).toHaveBeenCalledWith(
      'user-1',
      '2026-11-03',
      'AFTERNOON',
      expect.objectContaining({ source: 'ai' }),
    );
  });

  it('falls back to the rules draft when the AI fails', async () => {
    const { service, ai } = setup();
    vi.spyOn(ai, 'generateInsight').mockRejectedValue(new AiError('TIMEOUT', 'slow'));

    await expect(service.phrase(user, input)).resolves.toEqual({ ...input.draft, source: 'rules' });
  });

  it('uses the draft for a user without a finished profile', async () => {
    const { service, ai } = setup();
    const spy = vi.spyOn(ai, 'generateInsight');
    await expect(service.phrase({ id: 'u2' } as User, input)).resolves.toMatchObject({
      source: 'rules',
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
