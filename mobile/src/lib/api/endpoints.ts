import { apiRequest } from './client';
import { localDateKey, utcOffsetMinutes } from '../dates';
import type {
  CreateMealInput,
  DayMeals,
  HealthStatus,
  MealDraft,
  MealResponse,
  Profile,
  ReportResponse,
  UserResponse,
} from './types';

/** Typed functions for each endpoint. Screens call these, never fetch directly. */
export const api = {
  health: () => apiRequest<HealthStatus>({ path: '/health', retries: 0, timeoutMs: 10_000 }),

  getMe: () => apiRequest<UserResponse>({ path: '/users/me' }),

  /** Safe to retry: it replaces the whole profile, so repeating it changes nothing. */
  saveMe: (profile: Profile) =>
    apiRequest<UserResponse>({ method: 'POST', path: '/users/me', body: profile, retries: 2 }),

  /**
   * Reading a report can take a while: the server may try more than one AI model. Not
   * retried automatically, because every upload creates a new report.
   */
  uploadReport: (form: FormData) =>
    apiRequest<ReportResponse>({ method: 'POST', path: '/reports', form, timeoutMs: 90_000 }),

  /** Photo or voice note in, editable draft out. Nothing is saved. */
  analyzeMeal: (form: FormData) =>
    apiRequest<MealDraft>({ method: 'POST', path: '/meals/analyze', form, timeoutMs: 75_000 }),

  /** Safe to retry: the server stores each clientRequestId once. */
  saveMeal: (meal: CreateMealInput) =>
    apiRequest<MealResponse>({ method: 'POST', path: '/meals', body: meal, retries: 2 }),

  getMeals: (date: Date = new Date()) =>
    apiRequest<DayMeals>({
      path: '/meals',
      query: { date: localDateKey(date), tzOffsetMinutes: utcOffsetMinutes(date) },
    }),
};
