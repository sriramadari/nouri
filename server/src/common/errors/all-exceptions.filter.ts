import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { AiError, type AiFailure } from '../../ai/ai.errors.js';
import { AppError, type ErrorBody, type ErrorCode } from './app-error.js';

/** Typed as a full Record so adding an error code without a status fails to compile. */
const STATUS_BY_CODE: Record<ErrorCode, HttpStatus> = {
  VALIDATION_FAILED: HttpStatus.BAD_REQUEST,
  FILE_MISSING: HttpStatus.BAD_REQUEST,
  DEVICE_ID_MISSING: HttpStatus.UNAUTHORIZED,
  DEVICE_ID_INVALID: HttpStatus.UNAUTHORIZED,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  UNSUPPORTED_FILE_TYPE: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
  MEAL_NOT_RECOGNIZED: HttpStatus.UNPROCESSABLE_ENTITY,
  VOICE_NOT_UNDERSTOOD: HttpStatus.UNPROCESSABLE_ENTITY,
  REPORT_UNREADABLE: HttpStatus.UNPROCESSABLE_ENTITY,
};

/** AI failures, in words the app can show next to a "Try again" or "Add manually" button. */
const AI_ERRORS: Record<AiFailure, { status: HttpStatus; code: string; message: string }> = {
  TIMEOUT: {
    status: HttpStatus.GATEWAY_TIMEOUT,
    code: 'AI_TIMEOUT',
    message: 'Nouri took too long to answer. Please try again.',
  },
  UNAVAILABLE: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    code: 'AI_UNAVAILABLE',
    message: 'Nouri is very busy right now. Please try again in a moment.',
  },
  INVALID_RESPONSE: {
    status: HttpStatus.BAD_GATEWAY,
    code: 'AI_INVALID_RESPONSE',
    message: 'Nouri could not make sense of that. Please try again.',
  },
  REJECTED: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    code: 'AI_REJECTED',
    message: 'Nouri could not process that file. Please try a different one.',
  },
};

/** Codes for Nest's own exceptions (unknown route, file too large, malformed JSON). */
const CODE_BY_HTTP_STATUS: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'FILE_TOO_LARGE',
};

/**
 * Turns every thrown error into the same JSON shape: `{ error: { code, message, details? } }`.
 * Unknown errors are logged with their stack and returned as a generic 500, so internals
 * never leak to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toErrorResponse(exception);
    response.status(status).json(body);
  }

  private toErrorResponse(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof AppError) {
      const { code, message, details } = exception;
      return { status: STATUS_BY_CODE[code], body: { error: { code, message, details } } };
    }

    if (exception instanceof AiError) {
      this.logger.warn(`AI ${exception.failure}: ${exception.message}`);
      const { status, code, message } = AI_ERRORS[exception.failure];
      return { status, body: { error: { code, message } } };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code =
        CODE_BY_HTTP_STATUS[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
      return { status, body: { error: { code, message: exception.message } } };
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.' } },
    };
  }
}
