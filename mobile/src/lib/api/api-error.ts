/** Codes produced on the device, in addition to the ones the server sends. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'BAD_RESPONSE';

/**
 * Every failed request becomes an ApiError, so screens handle one error type. `code` comes
 * from the server's `{ error: { code, message } }` body or from the client itself.
 */
export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the request never got an answer. */
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True when there was no answer at all: offline, server down or too slow. */
  get isConnectionProblem(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }

  /** Worth trying again later without changing anything. */
  get isRetryable(): boolean {
    return this.isConnectionProblem || this.status === 429 || this.status >= 500;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, 'NETWORK_ERROR', "You're offline or the server can't be reached.");
}
