import { ApiError } from '@/lib/api/api-error';
import { api } from '@/lib/api/endpoints';
import type { CreateMealInput, MealResponse } from '@/lib/api/types';
import { useOfflineQueue } from '@/lib/storage/offline-queue';

import { saveMeal } from './meal-sync';

jest.mock('@/lib/api/endpoints', () => ({ api: { saveMeal: jest.fn() } }));
const saveMealApi = api.saveMeal as jest.MockedFunction<typeof api.saveMeal>;

const meal: CreateMealInput = {
  clientRequestId: '6f1c3b6e-2b8a-4c9d-8e7f-1a2b3c4d5e6f',
  eatenAt: '2026-11-03T07:30:00.000Z',
  source: 'MANUAL',
  items: [{ name: 'Poha', portion: '1 plate', calories: 250, proteinG: 5, carbsG: 45, fatG: 6 }],
};

const saved = {
  ...meal,
  id: 'meal-1',
  totals: { calories: 250, proteinG: 5, carbsG: 45, fatG: 6 },
  confidence: null,
} as MealResponse;

beforeEach(() => {
  saveMealApi.mockReset();
  useOfflineQueue.setState({ pending: [], failed: [] });
});

describe('saveMeal (offline first)', () => {
  it('saves straight away when online and leaves nothing queued', async () => {
    saveMealApi.mockResolvedValue(saved);
    await expect(saveMeal(meal)).resolves.toBe('saved');
    expect(useOfflineQueue.getState().pending).toEqual([]);
  });

  it('keeps the meal on the phone when offline, then syncs it later with the same key', async () => {
    saveMealApi.mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'Offline'));
    await expect(saveMeal(meal)).resolves.toBe('queued');
    expect(useOfflineQueue.getState().pending.map((job) => job.id)).toEqual([meal.clientRequestId]);

    saveMealApi.mockResolvedValue(saved);
    await expect(saveMeal(meal)).resolves.toBe('saved'); // e.g. the retry after reconnecting
    expect(
      saveMealApi.mock.calls.every(([sent]) => sent.clientRequestId === meal.clientRequestId),
    ).toBe(true);
    expect(useOfflineQueue.getState().pending).toEqual([]);
  });

  it('reports a meal the server refuses instead of retrying it forever', async () => {
    saveMealApi.mockRejectedValue(new ApiError(400, 'VALIDATION_FAILED', 'Add at least one food.'));
    await expect(saveMeal(meal)).rejects.toMatchObject({
      code: 'MEAL_REJECTED',
      message: 'Add at least one food.',
    });
    expect(useOfflineQueue.getState().pending).toEqual([]);
  });
});
