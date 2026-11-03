import type { DayTotals, Targets } from '../api/types';
import { isDailyGoalHit } from './assistant';

export interface WeeklyWins {
  daysLogged: number;
  proteinDays: number;
  goalDays: number;
  /** Average calories on days with at least one meal (empty days would drag it down unfairly). */
  averageCalories: number | null;
  /** The single best thing to celebrate this week, in words. */
  headline: string;
}

/** Below this many logged days a "week" is not a story yet, so the card stays hidden. */
export const MIN_DAYS_FOR_WINS = 2;

/** Turns the last 7 days into wins worth celebrating, framed positively. */
export function weeklyWins(days: DayTotals[], targets: Targets): WeeklyWins {
  const logged = days.filter((day) => day.meals > 0);
  const proteinDays = logged.filter((day) => day.proteinG >= targets.proteinG).length;
  const goalDays = logged.filter((day) => isDailyGoalHit(day, targets)).length;
  const averageCalories = logged.length
    ? Math.round(logged.reduce((sum, day) => sum + day.calories, 0) / logged.length)
    : null;

  const headline =
    goalDays >= 2
      ? `You hit your goal on ${goalDays} days this week`
      : proteinDays >= 2
        ? `Protein target reached on ${proteinDays} days`
        : logged.length >= 5
          ? `${logged.length} of 7 days logged. That’s a habit forming`
          : `${logged.length} days logged this week, keep it going`;

  return { daysLogged: logged.length, proteinDays, goalDays, averageCalories, headline };
}
