import { buildFocusAreas, type FocusInput } from './focus-areas';

const base: FocusInput = {
  goal: 'LOSE_WEIGHT',
  activityLevel: 'MODERATE',
  calorieTarget: 1600,
  proteinTarget: 95,
};

const ids = (input: FocusInput) => buildFocusAreas(input).map((area) => area.id);

describe('buildFocusAreas', () => {
  it('gives weight loss a calorie and a protein focus, with the real numbers', () => {
    const areas = buildFocusAreas(base);
    expect(areas.map((a) => a.title)).toEqual(['Stay near 1,600 kcal', 'Reach 95 g protein']);
    expect(areas.every((a) => a.why.length > 0)).toBe(true);
  });

  it('adds a walking habit for people who mostly sit', () => {
    expect(ids({ ...base, activityLevel: 'SEDENTARY' })).toEqual(['calories', 'protein', 'walk']);
  });

  it('puts lab results first and caps the list at three', () => {
    const result = ids({
      ...base,
      flaggedMarkers: [
        { key: 'LDL', name: 'LDL cholesterol', status: 'HIGH' },
        { key: 'VITAMIN_D', name: 'Vitamin D', status: 'LOW' },
      ],
    });
    expect(result).toEqual(['heart-fats', 'vitamin-d', 'calories']);
  });

  it('names the flagged marker in the why', () => {
    const [first] = buildFocusAreas({
      ...base,
      flaggedMarkers: [{ key: 'HBA1C', name: 'HbA1c', status: 'HIGH' }],
    });
    expect(first).toMatchObject({ id: 'steady-sugar' });
    expect(first?.why).toContain('HbA1c');
  });

  it('never shows the same theme twice (lab sugar and the sugar goal)', () => {
    const result = ids({
      ...base,
      goal: 'CONTROL_SUGAR',
      flaggedMarkers: [{ key: 'FASTING_GLUCOSE', name: 'Fasting glucose', status: 'HIGH' }],
    });
    expect(result).toEqual(['steady-sugar', 'protein']);
  });

  it('ignores markers that are flagged in the harmless direction', () => {
    expect(ids({ ...base, flaggedMarkers: [{ key: 'HDL', name: 'HDL', status: 'HIGH' }] })).toEqual(
      ['calories', 'protein'],
    );
  });

  it('gives eating better a protein and vegetables focus', () => {
    expect(ids({ ...base, goal: 'EAT_BETTER' })).toEqual(['protein', 'vegetables']);
  });
});
