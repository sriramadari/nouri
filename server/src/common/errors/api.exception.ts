import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Machine readable error codes the mobile app can switch on.
 * Messages are for people; codes are for code.
 */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'DEVICE_ID_MISSING'
  | 'DEVICE_ID_INVALID'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'TOO_MANY_REQUESTS'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/** The JSON body of every error response. */
export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/** Throw this from anywhere to return a specific error code and friendly message. */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message, status);
  }
}
