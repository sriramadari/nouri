import {
  type ArgumentsHost,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { AllExceptionsFilter } from './all-exceptions.filter.js';
import { AiError } from '../../ai/ai.errors.js';
import { AppError } from './app-error.js';

function run(exception: unknown) {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  new AllExceptionsFilter().catch(exception, host);
  return { status: status.mock.calls[0]?.[0], body: json.mock.calls[0]?.[0] };
}

describe('AllExceptionsFilter', () => {
  it('keeps the code, message and details of an AppError and picks its status', () => {
    const details = [{ field: 'age', message: 'Too low' }];
    const result = run(new AppError('VALIDATION_FAILED', 'Check your input', details));
    expect(result).toEqual({
      status: 400,
      body: { error: { code: 'VALIDATION_FAILED', message: 'Check your input', details } },
    });
  });

  it('replaces Nest technical messages with plain words', () => {
    const result = run(new NotFoundException('Cannot POST /reports'));
    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe('NOT_FOUND');
    expect(result.body.error.message).not.toContain('Cannot POST');
  });

  it('maps an oversized upload to FILE_TOO_LARGE', () => {
    expect(run(new PayloadTooLargeException('File too large'))).toMatchObject({
      status: 413,
      body: { error: { code: 'FILE_TOO_LARGE' } },
    });
  });

  it('turns an AI timeout into a retryable 504 with a friendly message', () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const result = run(new AiError('TIMEOUT', 'meal image via gemini timed out'));
    expect(result.status).toBe(504);
    expect(result.body.error.code).toBe('AI_TIMEOUT');
    expect(result.body.error.message).not.toContain('gemini');
  });

  it('hides the details of unexpected errors', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const result = run(new Error('connection string leaked here'));
    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(result.body)).not.toContain('leaked');
  });
});
