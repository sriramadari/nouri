import {
  cmToFeetInches,
  feetInchesToCm,
  parseNumber,
  validateAge,
  validateHeight,
  validateName,
  validateWeight,
} from './validation';

describe('onboarding validation', () => {
  it('asks for a name and trims spaces', () => {
    expect(validateName('   ')).toBe('What should Nouri call you?');
    expect(validateName('  Asha ')).toBeNull();
    expect(validateName('x'.repeat(51))).toMatch(/shorter/);
  });

  it('checks age is present, whole and in range', () => {
    expect(validateAge(null)).toMatch(/enter your age/);
    expect(validateAge(28.5)).toMatch(/whole years/);
    expect(validateAge(15)).toMatch(/16 and up/);
    expect(validateAge(101)).toMatch(/unusual/);
    expect(validateAge(28)).toBeNull();
  });

  it('checks height and weight against the server limits', () => {
    expect(validateHeight(null)).toMatch(/enter your height/);
    expect(validateHeight(119)).toMatch(/unusual/);
    expect(validateHeight(162)).toBeNull();
    expect(validateWeight(29)).toMatch(/unusual/);
    expect(validateWeight(68.5)).toBeNull();
  });

  it('parses numbers the way people type them', () => {
    expect(parseNumber(' 72,5 ')).toBe(72.5);
    expect(parseNumber('68')).toBe(68);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('6o')).toBeNull();
    expect(parseNumber('-5')).toBeNull();
  });

  it('converts between feet and inches and centimetres', () => {
    expect(feetInchesToCm(5, 4)).toBe(162.6);
    expect(cmToFeetInches(162.6)).toEqual({ feet: 5, inches: 4 });
    expect(cmToFeetInches(182.9)).toEqual({ feet: 6, inches: 0 });
  });
});
