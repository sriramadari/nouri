import type { AiProvider } from '../ai/ai-provider.js';
import { MockProvider } from '../ai/mock/mock.provider.js';
import type { Meal, User } from '../generated/prisma/client.js';
import type { MealsRepository, NewMeal } from './meals.repository.js';
import { MealsService, startOfLocalDay } from './meals.service.js';

const user = { id: 'user-1' } as User;
const photo = { buffer: Buffer.from('jpeg'), mimetype: 'image/jpeg' };
const voice = { buffer: Buffer.from('m4a'), mimetype: 'audio/mp4' };

/** Minimal in memory repository that enforces the same uniqueness rule as the database. */
function fakeRepository() {
  const rows: Meal[] = [];
  const repository = {
    async createOnce(meal: NewMeal) {
      const existing = rows.find(
        (row) => row.userId === meal.userId && row.clientRequestId === meal.clientRequestId,
      );
      if (existing) return { meal: existing, created: false };
      const row = {
        ...meal,
        id: `meal-${rows.length + 1}`,
        createdAt: new Date(),
      } as unknown as Meal;
      rows.push(row);
      return { meal: row, created: true };
    },
    async findBetween(_userId: string, from: Date, to: Date) {
      return rows.filter((row) => row.eatenAt >= from && row.eatenAt < to);
    },
  };
  return { rows, repository: repository as unknown as MealsRepository };
}

function service(ai: AiProvider = new MockProvider()) {
  const { rows, repository } = fakeRepository();
  return { rows, meals: new MealsService(ai, repository) };
}

describe('MealsService.analyze', () => {
  it('builds a photo draft with totals summed in code and doubtful items flagged', async () => {
    const draft = await service().meals.analyze(photo);

    expect(draft.source).toBe('PHOTO');
    expect(draft.totals).toEqual({ calories: 570, proteinG: 20, carbsG: 82, fatG: 18 });
    expect(draft.items.find((item) => item.name === 'Aloo gobi')?.needsReview).toBe(true);
    expect(draft.needsReview).toBe(true);
    expect(draft.confidence).toBe(0.55);
  });

  it('routes audio to voice parsing', async () => {
    const draft = await service().meals.analyze(voice);
    expect(draft.source).toBe('VOICE');
    expect(draft.items.map((item) => item.name)).toEqual(['Roti', 'Dal', 'Curd']);
    expect(draft.transcript).toBe('Two rotis, dal and a bowl of curd');
    expect(draft.needsReview).toBe(false);
  });

  it('rejects a photo without food', async () => {
    const ai = new MockProvider();
    vi.spyOn(ai, 'analyzeMealImage').mockResolvedValue({ issue: 'NOT_FOOD', items: [] });
    await expect(service(ai).meals.analyze(photo)).rejects.toMatchObject({
      code: 'MEAL_NOT_RECOGNIZED',
    });
  });

  it('asks the user to repeat an unclear voice note', async () => {
    const ai = new MockProvider();
    vi.spyOn(ai, 'parseMealVoice').mockResolvedValue({
      speechDetected: true,
      transcript: 'umm',
      issue: 'UNCLEAR',
      items: [],
    });
    await expect(service(ai).meals.analyze(voice)).rejects.toMatchObject({
      code: 'VOICE_NOT_UNDERSTOOD',
    });
  });

  it.each([
    ['no speech detected', false, 'ek bowl aloo matar ki sabji'],
    ['an empty transcript', true, '  '],
  ])(
    'rejects a note with %s even when the model invents a meal',
    async (_case, speechDetected, transcript) => {
      const ai = new MockProvider();
      vi.spyOn(ai, 'parseMealVoice').mockResolvedValue({
        speechDetected,
        transcript,
        issue: 'NONE',
        items: [
          {
            name: 'Paratha',
            portion: '2',
            calories: 520,
            proteinG: 8,
            carbsG: 60,
            fatG: 28,
            confidence: 0.9,
          },
        ],
      });
      await expect(service(ai).meals.analyze(voice)).rejects.toMatchObject({
        code: 'VOICE_NOT_UNDERSTOOD',
      });
    },
  );
});

describe('MealsService.save', () => {
  const input = {
    clientRequestId: '9b2c1a52-3a4e-4a7e-9a59-0d7a3f3c1e11',
    eatenAt: '2026-11-02T07:30:00.000Z',
    source: 'MANUAL' as const,
    items: [
      { name: 'Poha', portion: '1 plate', calories: 250, proteinG: 5, carbsG: 45, fatG: 6 },
      {
        name: 'Chai',
        portion: '1 cup',
        calories: 90,
        proteinG: 3,
        carbsG: 12,
        fatG: 3,
        confidence: 0.9,
      },
    ],
  };

  it('stores totals computed from the items', async () => {
    const { meals } = service();
    const saved = await meals.save(user, input);
    expect(saved.totals).toEqual({ calories: 340, proteinG: 8, carbsG: 57, fatG: 9 });
    expect(saved.confidence).toBe(0.9);
  });

  it('is idempotent for the same clientRequestId', async () => {
    const { meals, rows } = service();
    const first = await meals.save(user, input);
    const retry = await meals.save(user, input);
    expect(retry.id).toBe(first.id);
    expect(rows).toHaveLength(1);
  });
});

describe('startOfLocalDay', () => {
  it('starts an Indian day at 18:30 UTC the evening before', () => {
    expect(startOfLocalDay('2026-11-02', 330).toISOString()).toBe('2026-11-01T18:30:00.000Z');
  });

  it('handles zones behind UTC', () => {
    expect(startOfLocalDay('2026-11-02', -300).toISOString()).toBe('2026-11-02T05:00:00.000Z');
  });
});

describe('MealsService.summary', () => {
  it('returns every day of the window, oldest first, with empty days as zeros', async () => {
    const sumByDay = vi
      .fn()
      .mockResolvedValue([{ date: '2026-11-02', meals: 2, calories: 1500, proteinG: 70 }]);
    const meals = new MealsService(new MockProvider(), { sumByDay } as unknown as MealsRepository);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T06:00:00Z')); // 11:30 in India

    const { days } = await meals.summary(user, { days: 3, tzOffsetMinutes: 330 });

    expect(days.map((day) => day.date)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
    expect(days[1]).toMatchObject({ meals: 2, calories: 1500 });
    expect(days[2]).toMatchObject({ meals: 0, calories: 0 });
    expect(sumByDay).toHaveBeenCalledWith('user-1', new Date('2026-10-31T18:30:00.000Z'), 330);
    vi.useRealTimers();
  });
});
