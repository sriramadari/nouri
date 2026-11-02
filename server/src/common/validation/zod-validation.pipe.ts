import type { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

import { AppError } from '../errors/app-error.js';

/**
 * Validates and parses a request value against a Zod schema.
 * Usage: `@Body(new ZodValidationPipe(schema)) body: Input`.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError(
        'VALIDATION_FAILED',
        'Some fields need another look.',
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }
}
