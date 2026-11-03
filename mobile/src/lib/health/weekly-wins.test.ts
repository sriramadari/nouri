import type { DayTotals } from '../api/types';
import { weeklyWins } from './weekly-wins';

const targets = { calories: 1400, proteinG: 80 };
const day = (date: string, meals: number, calories: number, proteinG: number): DayTotals => ({
  date,
  meals,
  calories,
  proteinG,
});

describe('weeklyWins', () => {
  it('counts logged, protein and goal days, and averages only logged days', () => {
    const wins = weeklyWins(
      [
        day('2026-10-28', 0, 0, 0),
        day('2026-10-29', 3, 1380, 85), // goal
        day('2026-10-30', 2, 1600, 90), // protein, over calories
        day('2026-10-31', 3, 1350, 82), // goal
        day('2026-11-01', 1, 900, 30),
      ],
      targets,
    );
    expect(wins).toMatchObject({
      daysLogged: 4,
      proteinDays: 3,
      goalDays: 2,
      averageCalories: 1308,
    });
    expect(wins.headline).toBe('You hit your goal on 2 days this week');
  });

  it('celebrates consistency when goals were not hit yet', () => {
    const days = ['01', '02', '03', '04', '05'].map((d) => day(`2026-11-${d}`, 2, 1000, 40));
    expect(weeklyWins(days, targets).headline).toBe('5 of 7 days logged. That’s a habit forming');
  });

  it('handles an empty week', () => {
    expect(weeklyWins([day('2026-11-01', 0, 0, 0)], targets)).toMatchObject({
      daysLogged: 0,
      averageCalories: null,
    });
  });
});
