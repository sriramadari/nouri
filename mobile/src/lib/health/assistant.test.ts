import { type AssistantInput, isDailyGoalHit, pickAssistantMessage, slotFor } from './assistant';

const base: AssistantInput = {
  name: 'Asha',
  goal: 'LOSE_WEIGHT',
  slot: 'AFTERNOON',
  eaten: { calories: 600, proteinG: 40 },
  targets: { calories: 1400, proteinG: 80 },
  mealsLogged: 2,
  flaggedMarkers: [],
  isFirstDay: false,
};

describe('slotFor', () => {
  it('splits the day into morning, afternoon and evening', () => {
    expect(slotFor(new Date(2026, 10, 3, 8))).toBe('MORNING');
    expect(slotFor(new Date(2026, 10, 3, 13))).toBe('AFTERNOON');
    expect(slotFor(new Date(2026, 10, 3, 19))).toBe('EVENING');
  });
});

describe('pickAssistantMessage', () => {
  it('welcomes a brand new user instead of judging an empty day', () => {
    expect(pickAssistantMessage({ ...base, isFirstDay: true, mealsLogged: 0 })).toMatchObject({
      tone: 'welcome',
      message: 'Welcome, Asha. Snap your first meal',
    });
  });

  it('nudges a protein breakfast, with a sugar reason when the lab flagged sugar', () => {
    const result = pickAssistantMessage({
      ...base,
      slot: 'MORNING',
      mealsLogged: 0,
      eaten: { calories: 0, proteinG: 0 },
      flaggedMarkers: [{ key: 'HBA1C', name: 'HbA1c', status: 'HIGH' }],
    });
    expect(result.message).toBe('Start with protein at breakfast');
    expect(result.why).toContain('sugar');
  });

  it('notices low protein in the afternoon, with the real numbers', () => {
    const result = pickAssistantMessage({ ...base, eaten: { calories: 700, proteinG: 20 } });
    expect(result.message).toBe('Asha, you’re low on protein today');
    expect(result.why).toContain('20 of 80 g');
  });

  it('suggests a light dinner when most calories are gone by afternoon', () => {
    expect(pickAssistantMessage({ ...base, eaten: { calories: 1200, proteinG: 60 } }).message).toBe(
      'Keep dinner light tonight',
    );
  });

  it('celebrates an evening goal hit and is kind about an over day', () => {
    const evening = { ...base, slot: 'EVENING' as const };
    expect(
      pickAssistantMessage({ ...evening, eaten: { calories: 1380, proteinG: 82 } }).message,
    ).toBe('Goal hit today');
    expect(
      pickAssistantMessage({ ...evening, eaten: { calories: 1700, proteinG: 70 } }).message,
    ).toBe('A little over today, and that’s okay');
  });
});

describe('goal hit at any time of day', () => {
  it('praises a goal hit even in the morning', () => {
    const result = pickAssistantMessage({
      ...base,
      slot: 'MORNING',
      eaten: { calories: 1350, proteinG: 85 },
    });
    expect(result).toMatchObject({ tone: 'praise', message: 'Goal hit today' });
  });

  it('says protein is done instead of "0 g left"', () => {
    const result = pickAssistantMessage({
      ...base,
      slot: 'MORNING',
      eaten: { calories: 500, proteinG: 85 },
    });
    expect(result.why).toContain('protein is already done');
  });
});

describe('isDailyGoalHit', () => {
  const targets = { calories: 1400, proteinG: 80 };
  it('needs the protein target within the calorie budget', () => {
    expect(isDailyGoalHit({ calories: 1400, proteinG: 80 }, targets)).toBe(true);
    expect(isDailyGoalHit({ calories: 1500, proteinG: 90 }, targets)).toBe(false); // over by >5%
    expect(isDailyGoalHit({ calories: 1300, proteinG: 70 }, targets)).toBe(false); // protein short
    expect(isDailyGoalHit({ calories: 400, proteinG: 80 }, targets)).toBe(false); // barely ate
  });
});
