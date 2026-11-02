import type { ActivityLevel, BiomarkerStatus, Goal } from '../api/types';

export interface FocusArea {
  /** Stable id; areas sharing a theme are never shown twice. */
  id: string;
  title: string;
  why: string;
}

export interface FlaggedMarker {
  key: string | null;
  name: string;
  status: Exclude<BiomarkerStatus, 'NORMAL'>;
}

export interface FocusInput {
  goal: Goal;
  activityLevel: ActivityLevel;
  calorieTarget: number;
  proteinTarget: number;
  /** Out of range results from the latest blood report, if any. */
  flaggedMarkers?: FlaggedMarker[];
}

const MAX_FOCUS_AREAS = 3;

/**
 * Picks the 2 or 3 things that matter most for this person, each with a one line WHY.
 * Priority: lab results (the most personal evidence), then the goal, then daily habits.
 * Deterministic rules, so the plan is the same every time and easy to explain.
 */
export function buildFocusAreas(input: FocusInput): FocusArea[] {
  const candidates = [
    ...fromLabResults(input.flaggedMarkers ?? []),
    ...fromGoal(input),
    ...fromActivity(input.activityLevel),
  ];

  const seen = new Set<string>();
  return candidates
    .filter((area) => !seen.has(area.id) && seen.add(area.id))
    .slice(0, MAX_FOCUS_AREAS);
}

function fromLabResults(markers: FlaggedMarker[]): FocusArea[] {
  const flagged = (key: string, status: FlaggedMarker['status']) =>
    markers.find((marker) => marker.key === key && marker.status === status);
  const areas: FocusArea[] = [];

  const sugar = flagged('HBA1C', 'HIGH') ?? flagged('FASTING_GLUCOSE', 'HIGH');
  if (sugar) {
    areas.push({
      id: 'steady-sugar',
      title: 'Steady your blood sugar',
      why: `Your ${sugar.name} is above range. Fewer refined carbs bring it down.`,
    });
  }

  const heart = flagged('LDL', 'HIGH') ?? flagged('TRIGLYCERIDES', 'HIGH') ?? flagged('HDL', 'LOW');
  if (heart) {
    areas.push({
      id: 'heart-fats',
      title: 'Choose heart friendly fats',
      why: `Your ${heart.name} is out of range. Less fried food and more nuts help.`,
    });
  }

  if (flagged('VITAMIN_D', 'LOW')) {
    areas.push({
      id: 'vitamin-d',
      title: 'Get morning sun',
      why: 'Your vitamin D is low. 15 minutes of sun and eggs or fortified milk help.',
    });
  }

  if (flagged('HEMOGLOBIN', 'LOW')) {
    areas.push({
      id: 'iron',
      title: 'Add iron rich foods',
      why: 'Your hemoglobin is low. Spinach, rajma or chana with lemon lift it.',
    });
  }

  if (flagged('B12', 'LOW')) {
    areas.push({
      id: 'b12',
      title: 'Have dairy every day',
      why: 'Your B12 is low. Curd, milk or paneer daily helps, especially if vegetarian.',
    });
  }

  return areas;
}

function fromGoal({ goal, calorieTarget, proteinTarget }: FocusInput): FocusArea[] {
  const protein: FocusArea = {
    id: 'protein',
    title: `Reach ${proteinTarget} g protein`,
    why:
      goal === 'LOSE_WEIGHT'
        ? 'Protein keeps you full and protects muscle while you lose fat.'
        : goal === 'CONTROL_SUGAR'
          ? 'Protein with carbs slows how fast sugar enters your blood.'
          : 'Protein keeps energy steady and most Indian meals fall short of it.',
  };

  switch (goal) {
    case 'LOSE_WEIGHT':
      return [
        {
          id: 'calories',
          title: `Stay near ${calorieTarget.toLocaleString('en-IN')} kcal`,
          why: 'A steady daily gap loses about 0.5 kg a week, without crash dieting.',
        },
        protein,
      ];
    case 'CONTROL_SUGAR':
      return [
        {
          id: 'steady-sugar',
          title: 'Swap refined carbs',
          why: 'White rice, maida and sugar spike blood sugar fastest; millets and dal release slowly.',
        },
        protein,
      ];
    case 'EAT_BETTER':
      return [
        protein,
        {
          id: 'vegetables',
          title: 'Fill half your plate with sabzi',
          why: 'Vegetables add fibre and vitamins for very few calories.',
        },
      ];
  }
}

function fromActivity(activityLevel: ActivityLevel): FocusArea[] {
  if (activityLevel !== 'SEDENTARY' && activityLevel !== 'LIGHT') return [];
  return [
    {
      id: 'walk',
      title: 'Walk 10 minutes after meals',
      why: 'A short walk after eating blunts sugar spikes and adds up over the week.',
    },
  ];
}
