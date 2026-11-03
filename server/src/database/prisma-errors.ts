import { Prisma } from '../generated/prisma/client.js';

/** True when a write hit a unique constraint, e.g. two requests creating the same row at once. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
