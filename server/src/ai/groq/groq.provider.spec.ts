import { Logger } from '@nestjs/common';

import { MOCK_PHOTO_MEAL } from '../mock/mock.fixtures.js';
import { type FetchFn, GroqVoiceProvider } from './groq.provider.js';

const audio = Buffer.from('m4a');
const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));
const heard = (text: string, noSpeech = 0.05) =>
  json({ text, segments: [{ no_speech_prob: noSpeech }] });
const answer = (content: string) => json({ choices: [{ message: { content } }] });

function provider(fetchFn: FetchFn, timeoutMs = 1000) {
  return new GroqVoiceProvider(
    { apiKey: 'test', speechModel: 'whisper', textModel: 'text', timeoutMs },
    fetchFn,
  );
}

beforeEach(() => {
  vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
});

describe('GroqVoiceProvider', () => {
  it('transcribes with Whisper, then estimates foods from the words only', async () => {
    const fetchFn = vi
      .fn<FetchFn>()
      .mockReturnValueOnce(heard(' two rotis and dal '))
      .mockReturnValueOnce(answer(JSON.stringify(MOCK_PHOTO_MEAL)));

    const result = await provider(fetchFn).parseMealVoice(audio, 'audio/mp4');

    expect(result).toMatchObject({ speechDetected: true, transcript: 'two rotis and dal' });
    expect(result.items).toEqual(MOCK_PHOTO_MEAL.items);
    const [transcribeUrl] = fetchFn.mock.calls[0]!;
    const [chatUrl, chatInit] = fetchFn.mock.calls[1]!;
    expect(transcribeUrl).toMatch(/audio\/transcriptions$/);
    expect(chatUrl).toMatch(/chat\/completions$/);
    // The text model gets the transcript, never the audio.
    expect(String(chatInit.body)).toContain('two rotis and dal');
  });

  it('treats silence as no speech even if Whisper returns a phrase', async () => {
    const fetchFn = vi.fn<FetchFn>().mockReturnValueOnce(heard('Thank you.', 0.92));

    const result = await provider(fetchFn).parseMealVoice(audio, 'audio/webm');

    expect(result).toMatchObject({ speechDetected: false, issue: 'UNCLEAR', items: [] });
    expect(fetchFn).toHaveBeenCalledTimes(1); // no food estimate without speech
  });

  it('retries once when the text model answers in the wrong shape', async () => {
    const fetchFn = vi
      .fn<FetchFn>()
      .mockReturnValueOnce(heard('one plate of poha'))
      .mockReturnValueOnce(answer('not json'))
      .mockReturnValueOnce(answer(JSON.stringify(MOCK_PHOTO_MEAL)));

    await expect(provider(fetchFn).parseMealVoice(audio, 'audio/mp4')).resolves.toMatchObject({
      issue: 'NONE',
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('reports rate limits and a wrong key as unavailable, a bad file as rejected', async () => {
    const limited = vi.fn<FetchFn>().mockReturnValueOnce(json({}, 429));
    await expect(provider(limited).parseMealVoice(audio, 'audio/mp4')).rejects.toMatchObject({
      failure: 'UNAVAILABLE',
    });

    const badKey = vi.fn<FetchFn>().mockReturnValueOnce(json({}, 401));
    await expect(provider(badKey).parseMealVoice(audio, 'audio/mp4')).rejects.toMatchObject({
      failure: 'UNAVAILABLE',
    });

    const badFile = vi.fn<FetchFn>().mockReturnValueOnce(json({}, 400));
    await expect(provider(badFile).parseMealVoice(audio, 'audio/mp4')).rejects.toMatchObject({
      failure: 'REJECTED',
    });
  });

  it('times out within the shared budget', async () => {
    const hang: FetchFn = (_url, init) =>
      new Promise((_, reject) =>
        init.signal?.addEventListener('abort', () => reject(new Error('aborted'))),
      );

    await expect(provider(hang, 20).parseMealVoice(audio, 'audio/mp4')).rejects.toMatchObject({
      failure: 'TIMEOUT',
    });
  });
});
