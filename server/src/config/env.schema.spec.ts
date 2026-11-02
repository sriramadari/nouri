import { validateEnv } from './env.schema.js';

const base = { DATABASE_URL: 'postgresql://u:p@localhost:5432/db', GEMINI_API_KEY: 'key' };

describe('validateEnv', () => {
  it('applies defaults, including the ordered model list', () => {
    const env = validateEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.GEMINI_MODELS).toEqual([
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('parses a custom comma separated model list', () => {
    expect(validateEnv({ ...base, GEMINI_MODELS: ' a , b ,, ' }).GEMINI_MODELS).toEqual(['a', 'b']);
  });

  it('requires a Gemini key only when Gemini is the provider', () => {
    const { GEMINI_API_KEY: _key, ...withoutKey } = base;
    expect(() => validateEnv(withoutKey)).toThrow(/GEMINI_API_KEY/);
    expect(validateEnv({ ...withoutKey, AI_PROVIDER: 'mock' }).AI_PROVIDER).toBe('mock');
  });

  it('lists every problem at once', () => {
    expect(() => validateEnv({ PORT: 'abc', GEMINI_API_KEY: 'k' })).toThrow(
      /DATABASE_URL[\s\S]*PORT|PORT[\s\S]*DATABASE_URL/,
    );
  });
});
