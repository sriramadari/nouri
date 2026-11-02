import { ApiError, type GenerateContentParameters } from '@google/genai';
import { Logger } from '@nestjs/common';

import { AiError } from '../ai.errors.js';
import { MOCK_PHOTO_MEAL } from '../mock/mock.fixtures.js';
import { type GenerateContentFn, GeminiProvider } from './gemini.provider.js';

const image = Buffer.from('fake-jpeg');
const valid = { text: JSON.stringify(MOCK_PHOTO_MEAL) };
const invalid = { text: '{"items": "not an array"}' };
const overloaded = () => new ApiError({ message: 'high demand', status: 503 });

function provider(generate: GenerateContentFn, timeoutMs = 1000) {
  return new GeminiProvider({ models: ['primary', 'fallback'], timeoutMs }, generate);
}

const modelsCalled = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls.map(([params]) => (params as GenerateContentParameters).model);

beforeEach(() => {
  vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
});

describe('GeminiProvider', () => {
  it('returns the validated answer and asks for JSON that matches the schema', async () => {
    const generate = vi.fn().mockResolvedValue(valid);

    await expect(provider(generate).analyzeMealImage(image, 'image/jpeg')).resolves.toEqual(
      MOCK_PHOTO_MEAL,
    );
    const params = generate.mock.calls[0]![0] as GenerateContentParameters;
    expect(params.config?.responseMimeType).toBe('application/json');
    expect(params.config?.responseJsonSchema).toMatchObject({ type: 'object' });
  });

  it('retries once when the answer does not match the schema', async () => {
    const generate = vi.fn().mockResolvedValueOnce(invalid).mockResolvedValueOnce(valid);

    await expect(provider(generate).analyzeMealImage(image, 'image/jpeg')).resolves.toEqual(
      MOCK_PHOTO_MEAL,
    );
    expect(modelsCalled(generate)).toEqual(['primary', 'primary']);
  });

  it('gives a clear error after a second invalid answer, without trying another model', async () => {
    const generate = vi.fn().mockResolvedValue({ text: 'not json at all' });

    await expect(provider(generate).analyzeMealImage(image, 'image/jpeg')).rejects.toMatchObject({
      failure: 'INVALID_RESPONSE',
    });
    expect(modelsCalled(generate)).toEqual(['primary', 'primary']);
  });

  it('falls back to the next model when the first is overloaded', async () => {
    const generate = vi.fn().mockRejectedValueOnce(overloaded()).mockResolvedValueOnce(valid);

    await expect(provider(generate).analyzeMealImage(image, 'image/jpeg')).resolves.toEqual(
      MOCK_PHOTO_MEAL,
    );
    expect(modelsCalled(generate)).toEqual(['primary', 'fallback']);
  });

  it('reports UNAVAILABLE when every model is overloaded', async () => {
    const generate = vi.fn().mockRejectedValue(overloaded());

    await expect(provider(generate).analyzeMealImage(image, 'image/jpeg')).rejects.toMatchObject({
      failure: 'UNAVAILABLE',
    });
  });

  it('times out a slow call and moves on to the next model', async () => {
    const hang: GenerateContentFn = (params) =>
      new Promise((_, reject) =>
        params.config?.abortSignal?.addEventListener('abort', () => reject(new Error('aborted'))),
      );
    const generate = vi.fn(hang).mockImplementationOnce(hang).mockResolvedValueOnce(valid);

    await expect(provider(generate, 20).analyzeMealImage(image, 'image/jpeg')).resolves.toEqual(
      MOCK_PHOTO_MEAL,
    );
    expect(modelsCalled(generate)).toEqual(['primary', 'fallback']);
  });

  it('transcribes a voice note first and parses only the words that were heard', async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ text: '{"speechDetected":true,"transcript":"two rotis and dal"}' })
      .mockResolvedValueOnce(valid);

    const result = await provider(generate).parseMealVoice(Buffer.from('m4a'), 'audio/mp4');
    expect(result).toMatchObject({ transcript: 'two rotis and dal', issue: 'NONE' });
    const secondCall = generate.mock.calls[1]![0] as GenerateContentParameters;
    expect(JSON.stringify(secondCall.contents)).toContain('two rotis and dal');
    expect(JSON.stringify(secondCall.contents)).not.toContain('inlineData');
  });

  it('never estimates a meal when no speech was heard', async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ text: '{"speechDetected":false,"transcript":""}' });

    const result = await provider(generate).parseMealVoice(Buffer.from('m4a'), 'audio/mp4');
    expect(result).toMatchObject({ issue: 'UNCLEAR', items: [] });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('does not retry input the provider rejects', async () => {
    const generate = vi.fn().mockRejectedValue(new ApiError({ message: 'bad file', status: 400 }));

    const error = await provider(generate)
      .analyzeMealImage(image, 'image/jpeg')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AiError);
    expect(error).toMatchObject({ failure: 'REJECTED' });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
