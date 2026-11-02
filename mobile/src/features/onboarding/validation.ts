/**
 * Friendly checks for each onboarding answer. Ranges match the server's schema
 * (server/src/users/users.schemas.ts), so the app never sends something the server rejects.
 * Each returns an error message, or null when the answer is fine.
 */

export const LIMITS = {
  name: { max: 50 },
  age: { min: 16, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 250 },
} as const;

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'What should Nouri call you?';
  if (trimmed.length > LIMITS.name.max) return 'Please use a shorter name.';
  return null;
}

export function validateAge(age: number | null): string | null {
  if (age === null) return 'Please enter your age.';
  if (!Number.isInteger(age)) return 'Please enter your age in whole years.';
  if (age < LIMITS.age.min) return 'Nouri is built for adults 16 and up.';
  if (age > LIMITS.age.max) return 'That age looks unusual. Please check it.';
  return null;
}

export function validateHeight(heightCm: number | null): string | null {
  if (heightCm === null) return 'Please enter your height.';
  if (heightCm < LIMITS.heightCm.min || heightCm > LIMITS.heightCm.max) {
    return 'That height looks unusual. Please check it.';
  }
  return null;
}

export function validateWeight(weightKg: number | null): string | null {
  if (weightKg === null) return 'Please enter your weight.';
  if (weightKg < LIMITS.weightKg.min || weightKg > LIMITS.weightKg.max) {
    return 'That weight looks unusual. Please check it.';
  }
  return null;
}

/** Reads a number typed by a person: trims spaces and accepts a decimal comma ("72,5"). */
export function parseNumber(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

/** 5 ft 4 in → 162.6 cm. Many people in India know their height in feet and inches. */
export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 30.48 + inches * 2.54) * 10) / 10;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
