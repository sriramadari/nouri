import { calculateBmr, calculateTargets, type TargetInput } from './targets.js';

const base: TargetInput = {
  sex: 'MALE',
  age: 28,
  heightCm: 175,
  weightKg: 80,
  activityLevel: 'SEDENTARY',
  goal: 'EAT_BETTER',
};

describe('calculateBmr', () => {
  it('applies Mifflin St Jeor for men', () => {
    // 10*80 + 6.25*175 - 5*28 + 5 = 1758.75
    expect(calculateBmr(base)).toBeCloseTo(1758.75);
  });

  it('applies Mifflin St Jeor for women', () => {
    // 10*60 + 6.25*162 - 5*30 - 161 = 1301.5
    expect(
      calculateBmr({ ...base, sex: 'FEMALE', weightKg: 60, heightCm: 162, age: 30 }),
    ).toBeCloseTo(1301.5);
  });
});

describe('calculateTargets', () => {
  it('keeps maintenance calories when eating better', () => {
    // 1758.75 * 1.2 = 2110.5 -> rounded to nearest 50
    expect(calculateTargets(base)).toEqual({ calories: 2100, proteinG: 80 });
  });

  it('scales calories with activity level', () => {
    // 1758.75 * 1.55 = 2726.06 -> 2750
    expect(calculateTargets({ ...base, activityLevel: 'MODERATE' }).calories).toBe(2750);
  });

  it('applies a 500 kcal deficit and higher protein for weight loss', () => {
    // 2110.5 - 500 = 1610.5 -> 1600; protein 80 * 1.2 = 96 -> 95
    expect(calculateTargets({ ...base, goal: 'LOSE_WEIGHT' })).toEqual({
      calories: 1600,
      proteinG: 95,
    });
  });

  it('never drops below the safety floor', () => {
    const smallWoman: TargetInput = {
      sex: 'FEMALE',
      age: 35,
      heightCm: 150,
      weightKg: 45,
      activityLevel: 'SEDENTARY',
      goal: 'LOSE_WEIGHT',
    };
    // BMR 1050.5 * 1.2 = 1260.6 - 500 = 760.6, floored to 1200
    expect(calculateTargets(smallWoman).calories).toBe(1200);
  });

  it('keeps maintenance calories when controlling sugar', () => {
    expect(calculateTargets({ ...base, goal: 'CONTROL_SUGAR' }).calories).toBe(2100);
  });
});
