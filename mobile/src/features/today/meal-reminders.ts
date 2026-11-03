import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { type Href, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useMealTimes } from '@/lib/storage/meal-times-store';

import { learnReminderTimes, type MealSlot, slotOfTime } from './reminder-times';

const DAYS_AHEAD = 3;
const CHANNEL_ID = 'meal-reminders';
/** Where a tapped reminder lands: straight on the log screen, ready to snap. */
const LOG_HREF: Href = '/log';

const MESSAGES: Record<MealSlot, { title: string; body: string }> = {
  breakfast: { title: 'Breakfast time?', body: 'Snap it and Katori does the rest.' },
  lunch: { title: 'Lunch time', body: 'One photo keeps today on track.' },
  dinner: { title: 'Logging dinner?', body: 'A quick voice note works too.' },
};

const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Schedules one reminder per meal at the person's usual times for the next few days,
 * skipping meals already logged today, so Katori reaches out first without nagging.
 * Rescheduled on every app open and every logged meal.
 */
export async function scheduleMealReminders(
  eatenAt: string[],
  now: Date = new Date(),
): Promise<void> {
  if (!supported) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Meal reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const times = learnReminderTimes(eatenAt);
  const loggedToday = new Set(
    eatenAt
      .map((iso) => new Date(iso))
      .filter((date) => date.toDateString() === now.toDateString())
      .map(slotOfTime),
  );

  for (let day = 0; day < DAYS_AHEAD; day++) {
    for (const slot of Object.keys(times) as MealSlot[]) {
      const when = new Date(now);
      when.setDate(now.getDate() + day);
      when.setHours(times[slot].hour, times[slot].minute, 0, 0);
      if (when <= now || (day === 0 && loggedToday.has(slot))) continue;
      await Notifications.scheduleNotificationAsync({
        content: MESSAGES[slot],
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}

/**
 * Asks for notification permission after the first logged meal (when reminders make sense to
 * the person), then keeps reminders in step with their meal times.
 */
export function useMealReminders(): void {
  const eatenAt = useMealTimes((state) => state.eatenAt);
  const router = useRouter();

  // Tapping a reminder opens logging directly, whether the app was running or not.
  useEffect(() => {
    if (!supported) return;
    let handled: string | null = null;
    const open = (response: Notifications.NotificationResponse | null) => {
      const id = response?.notification.request.identifier ?? null;
      if (!id || id === handled) return;
      handled = id;
      // Forget it once handled, so the next app open does not jump to logging again.
      Notifications.clearLastNotificationResponse();
      router.navigate(LOG_HREF);
    };
    Notifications.getLastNotificationResponseAsync()
      .then(open)
      .catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (!supported || eatenAt.length === 0) return;
    (async () => {
      const current = await Notifications.getPermissionsAsync();
      if (!current.granted && current.canAskAgain) await Notifications.requestPermissionsAsync();
      await scheduleMealReminders(eatenAt);
    })().catch(() => undefined);
  }, [eatenAt]);
}

/** Developer check that notifications fire on this device. */
export async function sendTestReminder(seconds = 10): Promise<boolean> {
  if (!supported) return false;
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: MESSAGES.lunch,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
  return true;
}
