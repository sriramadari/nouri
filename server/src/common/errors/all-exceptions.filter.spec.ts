import { type ArgumentsHost, HttpStatus, Logger, NotFoundException } from '@nestjs/common';

import { AllExceptionsFilter } from './all-exceptions.filter.js';
import { ApiException } from './api.exception.js';

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
  it('keeps the code, message and details of an ApiException', () => {
    const details = [{ field: 'age', message: 'Too low' }];
    const result = run(
      new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Check your input', details),
    );
    expect(result).toEqual({
      status: 400,
      body: { error: { code: 'VALIDATION_FAILED', message: 'Check your input', details } },
    });
  });

  it('maps a built in Nest exception to a code from its status', () => {
    const result = run(new NotFoundException('No such route'));
    expect(result).toEqual({
      status: 404,
      body: { error: { code: 'NOT_FOUND', message: 'No such route' } },
    });
  });

  it('hides the details of unexpected errors', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const result = run(new Error('connection string leaked here'));
    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(result.body)).not.toContain('leaked');
  });
});
