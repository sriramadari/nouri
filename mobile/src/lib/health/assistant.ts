import type { Goal, Nutrition, Targets } from '../api/types';
import type { FlaggedMarker } from './focus-areas';

export type DaySlot = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface AssistantInput {
  name: string;
  goal: Goal;
  slot: DaySlot;
  eaten: Pick<Nutrition, 'calories' | 'proteinG'>;
  targets: Targets;
  mealsLogged: number;
  flaggedMarkers: FlaggedMarker[];
  /** First day using Nouri: welcome instead of judging an empty day. */
  isFirstDay: boolean;
}

export interface AssistantMessage {
  message: string;
  why: string;
  tone: 'welcome' | 'nudge' | 'praise';
}

export function slotFor(date: Date = new Date()): DaySlot {
  const hour = date.getHours();
  if (hour < 11) return 'MORNING';
  if (hour < 17) return 'AFTERNOON';
  return 'EVENING';
}

/**
 * Daily goal: reach the protein target without going more than 5% over calories (and having
 * eaten at least half the calories, so a single protein shake does not count as a day).
 * One rule that fits all three goals.
 */
export function isDailyGoalHit(eaten: AssistantInput['eaten'], targets: Targets): boolean {
  return (
    eaten.proteinG >= targets.proteinG &&
    eaten.calories <= targets.calories * 1.05 &&
    eaten.calories >= targets.calories * 0.5
  );
}

const kcal = (value: number) => Math.round(value).toLocaleString('en-IN');

/**
 * The rules engine behind the assistant card: picks what to say from the time of day, the
 * day's progress, the goal and lab results. Deterministic, so it is testable and always
 * available; the AI only rephrases it more warmly.
 */
export function pickAssistantMessage(input: AssistantInput): AssistantMessage {
  const { name, goal, slot, eaten, targets, mealsLogged, flaggedMarkers, isFirstDay } = input;
  const remaining = targets.calories - eaten.calories;
  const proteinGap = Math.max(Math.round(targets.proteinG - eaten.proteinG), 0);
  const proteinShare = eaten.proteinG / targets.proteinG;
  const calorieShare = eaten.calories / targets.calories;
  const sugarFlagged = flaggedMarkers.some(
    (marker) =>
      (marker.key === 'HBA1C' || marker.key === 'FASTING_GLUCOSE') && marker.status === 'HIGH',
  );

  if (isFirstDay && mealsLogged === 0) {
    return {
      tone: 'welcome',
      message: `Welcome, ${name}. Snap your first meal`,
      why: 'Nouri learns your day from what you log, and one photo is all it takes.',
    };
  }

  // A real win is worth saying whatever the time of day.
  if (isDailyGoalHit(eaten, targets)) {
    return {
      tone: 'praise',
      message: 'Goal hit today',
      why: `You reached ${targets.proteinG} g protein and stayed within your calories.`,
    };
  }

  if (slot === 'MORNING') {
    if (mealsLogged === 0) {
      return {
        tone: 'nudge',
        message: 'Start with protein at breakfast',
        why:
          sugarFlagged || goal === 'CONTROL_SUGAR'
            ? 'Eggs, paneer or a besan chilla first keeps your morning sugar steady.'
            : goal === 'LOSE_WEIGHT'
              ? `A protein breakfast keeps you full till lunch, so ${kcal(targets.calories)} kcal feels easy.`
              : `Most Indian breakfasts are light on protein; some now sets up your ${targets.proteinG} g day.`,
      };
    }
    return {
      tone: 'praise',
      message: `Good start: ${kcal(eaten.calories)} kcal logged`,
      why:
        proteinGap > 0
          ? `That leaves ${kcal(remaining)} kcal and ${proteinGap} g protein for the rest of the day.`
          : `That leaves ${kcal(remaining)} kcal, and your protein is already done.`,
    };
  }

  if (slot === 'AFTERNOON') {
    if (mealsLogged === 0) {
      return {
        tone: 'nudge',
        message: 'Don’t skip lunch today',
        why: 'Skipping meals makes evening cravings stronger and the day harder to balance.',
      };
    }
    if (proteinShare < 0.4) {
      return {
        tone: 'nudge',
        message: `${name}, you’re low on protein today`,
        why: `${Math.round(eaten.proteinG)} of ${targets.proteinG} g so far. Dal, paneer, curd or eggs at your next meal closes the gap.`,
      };
    }
    if (goal === 'LOSE_WEIGHT' && calorieShare > 0.75) {
      return {
        tone: 'nudge',
        message: 'Keep dinner light tonight',
        why: `${kcal(eaten.calories)} of ${kcal(targets.calories)} kcal already. A light dinner keeps the week on track.`,
      };
    }
    return {
      tone: 'praise',
      message: 'You’re on track',
      why: `${kcal(eaten.calories)} of ${kcal(targets.calories)} kcal and ${Math.round(eaten.proteinG)} of ${targets.proteinG} g protein so far.`,
    };
  }

  if (mealsLogged === 0) {
    return {
      tone: 'nudge',
      message: 'Log today’s meals before bed',
      why: 'Even a rough log keeps your streak going and helps Nouri learn your day.',
    };
  }
  if (calorieShare > 1.1) {
    return {
      tone: 'nudge',
      message: 'A little over today, and that’s okay',
      why: `One day doesn’t undo progress. Tomorrow starts fresh at ${kcal(targets.calories)} kcal.`,
    };
  }
  if (proteinShare < 0.7) {
    return {
      tone: 'nudge',
      message: 'Add protein to dinner',
      why: `You’re ${proteinGap} g short of ${targets.proteinG} g. A katori of dal or curd helps.`,
    };
  }
  return {
    tone: 'praise',
    message: 'Nice, steady day',
    why: `${kcal(eaten.calories)} kcal and ${Math.round(eaten.proteinG)} g protein, close to your plan.`,
  };
}
