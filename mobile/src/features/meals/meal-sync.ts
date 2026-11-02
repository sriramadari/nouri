import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { ApiError } from '@/lib/api/api-error';
import { api } from '@/lib/api/endpoints';
import { queryClient } from '@/lib/api/query-client';
import type { CreateMealInput, DayMeals, MealResponse } from '@/lib/api/types';
import { localDateKey } from '@/lib/dates';
import { flushQueue, type QueuedJob, useOfflineQueue } from '@/lib/storage/offline-queue';

import { sumNutrition } from './meal-math';

export const mealsQueryKey = (dateKey: string) => ['meals', dateKey] as const;

async function sendMeal(job: QueuedJob): Promise<void> {
  const saved = await api.saveMeal(job.payload as CreateMealInput);
  addToDayCache(saved);
}

/** Puts a saved meal straight into the cached day, so it never flickers out of the list. */
function addToDayCache(meal: MealResponse): void {
  queryClient.setQueryData<DayMeals>(mealsQueryKey(localDateKey(new Date(meal.eatenAt))), (day) => {
    if (!day || day.meals.some((existing) => existing.id === meal.id)) return day;
    const meals = [...day.meals, meal].sort((a, b) => a.eatenAt.localeCompare(b.eatenAt));
    return { ...day, meals, totals: sumNutrition(meals.map((m) => m.totals)) };
  });
}

export const syncMeals = () => flushQueue(sendMeal);

/**
 * Offline first: every meal goes through the queue, and the queue is flushed immediately.
 * Online that is a normal save; offline the meal waits on the phone and syncs later.
 * Resolves to where the meal ended up; rejects only if the server refused it for good.
 */
export async function saveMeal(meal: CreateMealInput): Promise<'saved' | 'queued'> {
  useOfflineQueue.getState().enqueue({ id: meal.clientRequestId, kind: 'meal', payload: meal });
  await syncMeals();

  const { pending, failed } = useOfflineQueue.getState();
  const rejected = failed.find((job) => job.id === meal.clientRequestId);
  if (rejected) {
    throw new ApiError(
      400,
      'MEAL_REJECTED',
      rejected.lastError ?? 'Nouri could not save this meal.',
    );
  }
  return pending.some((job) => job.id === meal.clientRequestId) ? 'queued' : 'saved';
}

/** Retries queued meals when the connection comes back and when the app returns to the front. */
export function useMealSync(): void {
  useEffect(() => {
    syncMeals();
    const network = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) syncMeals();
    });
    const appState = AppState.addEventListener('change', (status) => {
      if (status === 'active') syncMeals();
    });
    return () => {
      network();
      appState.remove();
    };
  }, []);
}
