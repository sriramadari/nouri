import { z } from 'zod';

import { ActivityLevel, Goal, Sex } from '../generated/prisma/enums.js';

/** Body of POST /users/me. Ranges are wide enough for real adults, tight enough to catch typos. */
export const upsertProfileSchema = z.object({
  name: z.string().trim().min(1, 'Please tell us your name.').max(50),
  age: z.number().int().min(16, 'Katori is built for adults 16 and up.').max(100),
  sex: z.enum(Sex),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(30).max(250),
  activityLevel: z.enum(ActivityLevel),
  goal: z.enum(Goal),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
