import { calculateBmi, calculateBmr, calculateTargets, type TargetInput } from './targets';

// Same cases as server/src/users/targets.spec.ts, so both copies of the formula stay in step.
const base: TargetInput = {
  sex: 'MALE',
  age: 28,
  heightCm: 175,
  weightKg: 80,
  activityLevel: 'SEDENTARY',
  goal: 'EAT_BETTER',
};

describe('calculateBmr', () => {
  it('applies Mifflin St Jeor for men and women', () => {
    expect(calculateBmr(base)).toBeCloseTo(1758.75);
    expect(
      calculateBmr({ ...base, sex: 'FEMALE', weightKg: 60, heightCm: 162, age: 30 }),
    ).toBeCloseTo(1301.5);
  });
});

describe('calculateTargets', () => {
  it('keeps maintenance calories when eating better', () => {
    expect(calculateTargets(base)).toMatchObject({
      calories: 2100,
      proteinG: 80,
      maintenanceCalories: 2100,
      deficit: 0,
    });
  });

  it('scales calories with activity level', () => {
    expect(calculateTargets({ ...base, activityLevel: 'MODERATE' }).calories).toBe(2750);
  });

  it('applies a 500 kcal deficit and higher protein for weight loss', () => {
    expect(calculateTargets({ ...base, goal: 'LOSE_WEIGHT' })).toMatchObject({
      calories: 1600,
      proteinG: 95,
      deficit: 500,
    });
  });

  it('never drops below the safety floor, and reports the smaller deficit honestly', () => {
    const result = calculateTargets({
      sex: 'FEMALE',
      age: 35,
      heightCm: 150,
      weightKg: 45,
      activityLevel: 'SEDENTARY',
      goal: 'LOSE_WEIGHT',
    });
    expect(result.calories).toBe(1200);
    expect(result.deficit).toBe(50); // maintenance 1250 → floor 1200
  });

  it('matches the server for the onboarding example used in the API tests', () => {
    const asha: TargetInput = {
      sex: 'FEMALE',
      age: 28,
      heightCm: 160,
      weightKg: 68,
      activityLevel: 'LIGHT',
      goal: 'LOSE_WEIGHT',
    };
    expect(calculateTargets(asha)).toMatchObject({ calories: 1400, proteinG: 80 });
  });
});

describe('calculateBmi', () => {
  it('computes kg/m² to one decimal', () => {
    expect(calculateBmi(160, 68)).toBe(26.6);
  });
});
