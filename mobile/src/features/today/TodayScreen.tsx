import { Link } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Confetti, Screen, Text } from '@/components/ui';
import { MealLogger } from '@/features/meals/components/MealLogger';
import { TodayMealList } from '@/features/meals/components/TodayMealList';
import { useTodayMeals } from '@/features/meals/use-today-meals';
import { localDateKey } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { isDailyGoalHit, slotFor } from '@/lib/health/assistant';
import { buildFocusAreas } from '@/lib/health/focus-areas';
import { useProfileStore } from '@/lib/storage/profile-store';
import { spacing } from '@/theme';

import { useCelebration } from './celebration-store';
import { AssistantCard } from './components/AssistantCard';
import { DayRings } from './components/DayRings';
import { FocusSummary } from './components/FocusSummary';
import { StreakBadge } from './components/StreakBadge';
import { useAssistantMessage } from './use-assistant-message';
import { useStreak } from './use-streak';
import { WeeklyWins } from './components/WeeklyWins';

const GREETINGS = { MORNING: 'Good morning', AFTERNOON: 'Good afternoon', EVENING: 'Good evening' };

/**
 * Today: the assistant speaks first, the rings show what is left, one tap logs a meal, and a
 * real win gets a celebration.
 */
export function TodayScreen() {
  const profile = useProfileStore((state) => state.profile);
  const targets = useProfileStore((state) => state.targets);
  const flaggedMarkers = useProfileStore((state) => state.flaggedMarkers);
  const onboardedAt = useProfileStore((state) => state.onboardedAt);
  const today = useTodayMeals();
  const streak = useStreak(today.meals.length);
  const slot = slotFor();
  const dateKey = localDateKey();

  const assistant = useAssistantMessage({
    name: profile?.name ?? '',
    goal: profile?.goal ?? 'EAT_BETTER',
    slot,
    eaten: today.totals,
    targets: targets ?? { calories: 2000, proteinG: 60 },
    mealsLogged: today.meals.length,
    flaggedMarkers,
    // Known on the device, so the first message never flickers while the streak loads.
    isFirstDay: onboardedAt !== null && localDateKey(new Date(onboardedAt)) === dateKey,
  });

  // Celebrate once per goal day: confetti and a happy buzz. The assistant card switches to
  // praise for the rest of the day, so the win stays visible without a second card.
  const goalHit = targets ? isDailyGoalHit(today.totals, targets) : false;
  const celebratedOn = useCelebration((state) => state.celebratedOn);
  const playing = useCelebration((state) => state.playing);
  const startCelebration = useCelebration((state) => state.start);
  const finishCelebration = useCelebration((state) => state.finish);
  useEffect(() => {
    if (goalHit && celebratedOn !== dateKey) {
      startCelebration(dateKey);
      haptics.success();
    }
  }, [goalHit, celebratedOn, dateKey, startCelebration]);

  if (!profile || !targets) return null;

  const focusAreas = buildFocusAreas({
    goal: profile.goal,
    activityLevel: profile.activityLevel,
    calorieTarget: targets.calories,
    proteinTarget: targets.proteinG,
    flaggedMarkers,
  });

  return (
    <View style={styles.root}>
      <Screen>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="eyebrow" color="brandText">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
            <Text variant="title" accessibilityRole="header">
              {GREETINGS[slot]}, {profile.name}
            </Text>
          </View>
          {streak ? <StreakBadge streak={streak} /> : null}
        </View>

        <AssistantCard {...assistant} slot={slot} />
        <DayRings eaten={today.totals} targets={targets} />
        <MealLogger />

        <TodayMealList
          meals={today.meals}
          isLoading={today.isLoading}
          error={today.error}
          onRetry={() => today.refetch()}
        />
        <WeeklyWins targets={targets} />
        <FocusSummary areas={focusAreas} />

        {__DEV__ ? (
          <Link href="/dev" asChild>
            <Button label="Open UI kit (dev only)" variant="ghost" icon="chevronRight" />
          </Link>
        ) : null}
      </Screen>
      <Confetti burstKey={playing} onDone={finishCelebration} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, flexWrap: 'wrap' },
  headerText: { flex: 1, minWidth: 200, gap: spacing.xxs },
});
