import { apiRequest } from './client';
import type { HealthStatus, Profile, UserResponse } from './types';

/** Typed functions for each endpoint. Screens call these, never fetch directly. */
export const api = {
  health: () => apiRequest<HealthStatus>({ path: '/health', retries: 0, timeoutMs: 10_000 }),

  getMe: () => apiRequest<UserResponse>({ path: '/users/me' }),

  /** Safe to retry: it replaces the whole profile, so repeating it changes nothing. */
  saveMe: (profile: Profile) =>
    apiRequest<UserResponse>({ method: 'POST', path: '/users/me', body: profile, retries: 2 }),
};
