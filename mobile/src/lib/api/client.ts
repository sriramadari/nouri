import { API_URL } from '../config';
import { getDeviceId } from '../storage/device-id';
import { ApiError } from './api-error';

const DEFAULT_TIMEOUT_MS = 15_000;
const RETRY_BASE_DELAY_MS = 600;

export interface RequestOptions {
  method?: 'GET' | 'POST';
  path: string;
  query?: Record<string, string | number>;
  /** Sent as JSON. */
  body?: unknown;
  /** Sent as multipart, for photo, audio and report uploads. */
  form?: FormData;
  timeoutMs?: number;
  /**
   * Extra attempts after a connection problem or a 5xx/429. Defaults to 2 for GET and 0 for
   * POST: a POST is only retried when the caller knows it is safe (idempotent).
   */
  retries?: number;
}

/**
 * The single way the app talks to the API: adds the device id, enforces a timeout, retries
 * safe requests with backoff and turns every failure into an ApiError.
 */
export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const retries = options.retries ?? (options.method === 'POST' ? 0 : 2);

  for (let attempt = 0; ; attempt++) {
    try {
      return await send<T>(options);
    } catch (error) {
      if (!(error instanceof ApiError) || !error.isRetryable || attempt >= retries) throw error;
      await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }
}

async function send<T>({
  method = 'GET',
  path,
  query,
  body,
  form,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-device-id': await getDeviceId(),
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch {
    throw controller.signal.aborted
      ? new ApiError(0, 'TIMEOUT', 'Nouri is taking too long to respond. Please try again.')
      : new ApiError(0, 'NETWORK_ERROR', "You're offline or the server can't be reached.");
  } finally {
    clearTimeout(timer);
  }

  const payload = await readJson(response);
  if (!response.ok) throw toServerError(response.status, payload);
  return payload as T;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_URL}${path}`;
  if (!query) return url;
  const params = Object.entries(query).map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
  );
  return `${url}?${params.join('&')}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) return undefined;
    throw new ApiError(response.status, 'BAD_RESPONSE', 'The server sent an unexpected reply.');
  }
}

function toServerError(status: number, payload: unknown): ApiError {
  const error = (payload as { error?: { code?: unknown; message?: unknown; details?: unknown } })
    ?.error;
  if (typeof error?.code === 'string' && typeof error.message === 'string') {
    return new ApiError(status, error.code, error.message, error.details);
  }
  return new ApiError(
    status,
    'BAD_RESPONSE',
    'Something went wrong on our side. Please try again.',
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
