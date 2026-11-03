import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type ApiError, toApiError } from '../api/api-error';
import { persistStorage } from './persist';

/**
 * Work that must reach the server eventually, such as a meal logged in airplane mode.
 * The id doubles as the idempotency key, so sending a job twice never creates duplicates.
 */
export interface QueuedJob<TPayload = unknown> {
  id: string;
  kind: 'meal';
  payload: TPayload;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

interface OfflineQueueState {
  pending: QueuedJob[];
  /** Jobs the server rejected for good (e.g. invalid data); kept so the user can see them. */
  failed: QueuedJob[];
  enqueue: (job: Omit<QueuedJob, 'attempts' | 'createdAt'>) => void;
  markSent: (id: string) => void;
  markRetryLater: (id: string, error: ApiError) => void;
  markFailed: (id: string, error: ApiError) => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
      pending: [],
      failed: [],
      enqueue: (job) =>
        set((state) =>
          state.pending.some((existing) => existing.id === job.id)
            ? state
            : {
                pending: [
                  ...state.pending,
                  { ...job, attempts: 0, createdAt: new Date().toISOString() },
                ],
              },
        ),
      markSent: (id) => set((state) => ({ pending: state.pending.filter((job) => job.id !== id) })),
      markRetryLater: (id, error) =>
        set((state) => ({
          pending: state.pending.map((job) =>
            job.id === id ? { ...job, attempts: job.attempts + 1, lastError: error.message } : job,
          ),
        })),
      markFailed: (id, error) =>
        set((state) => {
          const job = state.pending.find((item) => item.id === id);
          if (!job) return state;
          return {
            pending: state.pending.filter((item) => item.id !== id),
            failed: [
              ...state.failed,
              { ...job, attempts: job.attempts + 1, lastError: error.message },
            ],
          };
        }),
    }),
    { name: 'katori.offlineQueue', storage: persistStorage },
  ),
);

export type SendJob = (job: QueuedJob) => Promise<void>;

let currentFlush: Promise<void> | null = null;

/**
 * Sends pending jobs oldest first, re-reading the queue each time so jobs added mid-flush
 * are included. Stops at the first connection problem and leaves the rest for later.
 * Concurrent callers share the flush already running instead of starting another.
 */
export function flushQueue(send: SendJob): Promise<void> {
  currentFlush ??= drain(send).finally(() => {
    currentFlush = null;
  });
  return currentFlush;
}

async function drain(send: SendJob): Promise<void> {
  const queue = useOfflineQueue.getState();
  for (let job = queue.pending.at(0); job; job = useOfflineQueue.getState().pending.at(0)) {
    try {
      await send(job);
      queue.markSent(job.id);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.isRetryable) {
        queue.markRetryLater(job.id, apiError);
        return; // still offline or the server is struggling; try again later
      }
      queue.markFailed(job.id, apiError);
    }
  }
}
