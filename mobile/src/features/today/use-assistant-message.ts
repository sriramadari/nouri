import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/endpoints';
import { type AssistantInput, pickAssistantMessage } from '@/lib/health/assistant';
import { localDateKey } from '@/lib/dates';

/**
 * The rules engine decides the message and it shows immediately; the server's AI phrasing
 * replaces it when it arrives. Offline, or if the AI fails, the rules message simply stays.
 */
export function useAssistantMessage(input: AssistantInput) {
  const draft = pickAssistantMessage(input);
  const date = localDateKey();

  const phrased = useQuery({
    // Keyed by the draft itself: a new message is phrased once, then reused all day.
    queryKey: ['insight', date, input.slot, draft.message, draft.why],
    queryFn: () =>
      api.phraseInsight({
        date,
        slot: input.slot,
        draft: { message: draft.message, why: draft.why },
        facts: {
          caloriesEaten: Math.round(input.eaten.calories),
          proteinEaten: Math.round(input.eaten.proteinG),
          flaggedMarkers: input.flaggedMarkers.map((marker) => marker.name),
        },
      }),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });

  return {
    message: phrased.data?.message ?? draft.message,
    why: phrased.data?.why ?? draft.why,
    tone: draft.tone,
  };
}
