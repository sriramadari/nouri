import { useQuery } from '@tanstack/react-query';

import { toApiError } from '@/lib/api/api-error';
import { api } from '@/lib/api/endpoints';
import type { CreateMealInput, MealItem, MealSource, Nutrition } from '@/lib/api/types';
import { localDateKey } from '@/lib/dates';
import { useOfflineQueue } from '@/lib/storage/offline-queue';

import { sumNutrition } from './meal-math';
import { mealsQueryKey } from './meal-sync';

export interface TodayMeal {
  key: string;
  eatenAt: string;
  source: MealSource;
  items: MealItem[];
  totals: Nutrition;
  /** Logged on the phone but not yet on the server (e.g. offline). */
  pending: boolean;
}

/**
 * Today's meals from the server plus any still waiting in the offline queue, so a meal
 * logged in airplane mode counts towards today straight away.
 */
export function useTodayMeals() {
  const dateKey = localDateKey();
  const query = useQuery({ queryKey: mealsQueryKey(dateKey), queryFn: () => api.getMeals() });
  const queued = useOfflineQueue((state) => state.pending);

  const saved: TodayMeal[] = (query.data?.meals ?? []).map((meal) => ({
    key: meal.id,
    eatenAt: meal.eatenAt,
    source: meal.source,
    items: meal.items,
    totals: meal.totals,
    pending: false,
  }));
  const savedIds = new Set(query.data?.meals.map((meal) => meal.clientRequestId));
  const waiting: TodayMeal[] = queued
    .map((job) => job.payload as CreateMealInput)
    .filter((meal) => localDateKey(new Date(meal.eatenAt)) === dateKey)
    .filter((meal) => !savedIds.has(meal.clientRequestId))
    .map((meal) => ({
      key: meal.clientRequestId,
      eatenAt: meal.eatenAt,
      source: meal.source,
      items: meal.items,
      totals: sumNutrition(meal.items),
      pending: true,
    }));

  const meals = [...saved, ...waiting].sort((a, b) => a.eatenAt.localeCompare(b.eatenAt));

  return {
    meals,
    totals: sumNutrition(meals.map((meal) => meal.totals)),
    isLoading: query.isPending && !query.isError && waiting.length === 0,
    error: query.isError ? toApiError(query.error) : null,
    refetch: query.refetch,
  };
}
