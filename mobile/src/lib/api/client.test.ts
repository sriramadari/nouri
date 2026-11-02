import { ApiError } from './api-error';
import { apiRequest } from './client';

const fetchMock = jest.fn();
globalThis.fetch = fetchMock;

function reply(status: number, body?: unknown) {
  return Promise.resolve(new Response(body === undefined ? '' : JSON.stringify(body), { status }));
}

beforeEach(() => {
  fetchMock.mockReset();
  jest.useRealTimers();
});

describe('apiRequest', () => {
  it('sends the device id and parses JSON', async () => {
    fetchMock.mockReturnValueOnce(reply(200, { status: 'ok' }));

    await expect(apiRequest({ path: '/health' })).resolves.toEqual({ status: 'ok' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/health');
    expect(init.headers['x-device-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('builds the query string', async () => {
    fetchMock.mockReturnValueOnce(reply(200, []));
    await apiRequest({ path: '/meals', query: { date: '2026-11-02', tzOffsetMinutes: 330 } });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://api.test/meals?date=2026-11-02&tzOffsetMinutes=330',
    );
  });

  it('turns the server error body into an ApiError with its code', async () => {
    fetchMock.mockReturnValueOnce(
      reply(400, {
        error: { code: 'VALIDATION_FAILED', message: 'Check your input', details: [] },
      }),
    );

    const error = await apiRequest({ method: 'POST', path: '/users/me', body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_FAILED', isRetryable: false });
  });

  it('retries a GET after a network failure, then succeeds', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    fetchMock.mockReturnValueOnce(reply(200, { ok: true }));

    await expect(apiRequest({ path: '/users/me' })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a POST unless told it is safe', async () => {
    fetchMock.mockReturnValue(reply(503, { error: { code: 'AI_UNAVAILABLE', message: 'Busy' } }));

    await expect(apiRequest({ method: 'POST', path: '/meals/analyze' })).rejects.toMatchObject({
      code: 'AI_UNAVAILABLE',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a network failure as an offline problem', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const error = await apiRequest({ path: '/health', retries: 0 }).catch((e) => e);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', isConnectionProblem: true });
  });

  it('times out a request that hangs', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) =>
          init.signal?.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );

    const error = await apiRequest({ path: '/health', retries: 0, timeoutMs: 20 }).catch((e) => e);
    expect(error).toMatchObject({ code: 'TIMEOUT' });
  });
});
