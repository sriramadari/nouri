/**
 * Provider independent failure reasons. The AI layer knows nothing about HTTP;
 * the global exception filter maps these to status codes.
 */
export type AiFailure =
  /** The model did not answer in time. Safe to retry. */
  | 'TIMEOUT'
  /** The provider is overloaded, rate limited or down. Safe to retry. */
  | 'UNAVAILABLE'
  /** The model answered, but not in the agreed shape, even after a retry. */
  | 'INVALID_RESPONSE'
  /** The provider refused the input itself (for example an unsupported file). */
  | 'REJECTED';

export class AiError extends Error {
  constructor(
    readonly failure: AiFailure,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'AiError';
  }
}
