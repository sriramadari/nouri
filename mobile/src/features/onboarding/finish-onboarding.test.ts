import { draftToProfile } from './finish-onboarding';
import type { OnboardingDraft } from './onboarding-draft';
import { firstIncompleteStep } from './steps';

const complete: OnboardingDraft = {
  name: '  Asha ',
  age: 28,
  sex: 'FEMALE',
  heightCm: 160,
  weightKg: 68,
  heightUnit: 'cm',
  activityLevel: 'LIGHT',
  goal: 'LOSE_WEIGHT',
  flaggedMarkers: [],
  lastStep: 'report',
};

describe('finishing onboarding', () => {
  it('builds the profile the API expects, with the name trimmed', () => {
    expect(draftToProfile(complete)).toEqual({
      name: 'Asha',
      age: 28,
      sex: 'FEMALE',
      heightCm: 160,
      weightKg: 68,
      activityLevel: 'LIGHT',
      goal: 'LOSE_WEIGHT',
    });
  });

  it('finds the first step with a missing answer', () => {
    expect(firstIncompleteStep(complete)).toBeNull();
    expect(firstIncompleteStep({ ...complete, sex: null })).toBe('about');
    expect(firstIncompleteStep({ ...complete, weightKg: null, goal: null })).toBe('body');
    expect(draftToProfile({ ...complete, goal: null })).toBeNull();
  });
});
