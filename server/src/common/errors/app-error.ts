/**
 * Machine readable error codes the mobile app can switch on.
 * Messages are for people; codes are for code.
 */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'DEVICE_ID_MISSING'
  | 'DEVICE_ID_INVALID'
  | 'FILE_MISSING'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'MEAL_NOT_RECOGNIZED'
  | 'VOICE_NOT_UNDERSTOOD'
  | 'REPORT_UNREADABLE'
  | 'NOT_FOUND';

/** The JSON body of every error response. */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * An expected failure with a code and a friendly message. Services throw it without
 * knowing about HTTP; the global exception filter decides the status code.
 */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
