import { apiRequest } from './client';
import { localDateKey, utcOffsetMinutes } from '../dates';
import { ApiError } from './api-error';
import type {
  CreateMealInput,
  DayMeals,
  DayTotals,
  HealthStatus,
  MealDraft,
  MealResponse,
  PhrasedInsight,
  PhraseInsightInput,
  Profile,
  ReportResponse,
  Streak,
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

  /** The newest completed report, or null when none has been uploaded yet. */
  getLatestReport: async (): Promise<ReportResponse | null> => {
    try {
      return await apiRequest<ReportResponse>({ path: '/reports/latest' });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  /** Photo or voice note in, editable draft out. Nothing is saved. */
  analyzeMeal: (form: FormData) =>
    apiRequest<MealDraft>({ method: 'POST', path: '/meals/analyze', form, timeoutMs: 75_000 }),

  /** Safe to retry: the server stores each clientRequestId once. */
  saveMeal: (meal: CreateMealInput) =>
    apiRequest<MealResponse>({ method: 'POST', path: '/meals', body: meal, retries: 2 }),

  getWeekSummary: () =>
    apiRequest<{ days: DayTotals[] }>({
      path: '/meals/summary',
      query: { days: 7, tzOffsetMinutes: utcOffsetMinutes() },
    }),

  getStreak: () =>
    apiRequest<Streak>({ path: '/meals/streak', query: { tzOffsetMinutes: utcOffsetMinutes() } }),

  /** Never fails on the server side: an AI problem returns the rules draft instead. */
  phraseInsight: (input: PhraseInsightInput) =>
    apiRequest<PhrasedInsight>({
      method: 'POST',
      path: '/insights',
      body: input,
      timeoutMs: 30_000,
    }),

  getMeals: (date: Date = new Date()) =>
    apiRequest<DayMeals>({
      path: '/meals',
      query: { date: localDateKey(date), tzOffsetMinutes: utcOffsetMinutes(date) },
    }),
};
