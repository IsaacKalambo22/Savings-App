// Local notifications (Phase 14).
//
// IMPORTANT: expo-notifications throws *at import time* inside Expo Go (SDK 53+
// removed it from Expo Go). So we must NOT import it at module top level — that
// would crash every screen that transitively imports this file. Instead we
// dynamically import it only when a notification action actually runs, and
// degrade to a no-op if it's unavailable (i.e. running in Expo Go). Full
// fidelity requires a development build.

import { GoalWithProgress } from "@/features/goals/services/goal.service";
import dayjs from "dayjs";

let handlerConfigured = false;

/** Lazily load expo-notifications; returns null if unavailable (e.g. Expo Go). */
async function getNotifications(): Promise<typeof import("expo-notifications") | null> {
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

/** Configure how notifications present while foregrounded. Safe/no-op in Expo Go. */
export async function configureNotifications(): Promise<void> {
  if (handlerConfigured) return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  } catch {
    // no-op
  }
}

/** Ask the OS for notification permission. Returns whether it's granted. */
export async function requestPermission(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/**
 * Enable the standard reminder set (daily deposit reminder + weekly backup
 * reminder). Returns false if notifications are unavailable or denied.
 */
export async function enableDefaultReminders(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  await configureNotifications();
  const granted = await requestPermission();
  if (!granted) return false;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: { title: "NestKeep", body: "Have you logged today's savings?" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: { title: "Back up your data", body: "It's a good time to back up NestKeep." },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 18,
        minute: 0,
      },
    });

    return true;
  } catch {
    return false;
  }
}

/** Schedule one-off reminders for goals with an approaching deadline. */
export async function scheduleGoalReminders(goals: GoalWithProgress[]): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  const granted = await requestPermission();
  if (!granted) return;

  try {
    for (const goal of goals) {
      if (goal.isCompleted || !goal.deadline) continue;
      const remindAt = dayjs(goal.deadline).subtract(3, "day").hour(9).minute(0).second(0);
      if (remindAt.isBefore(dayjs())) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Goal: ${goal.name}`,
          body: `You're at ${Math.round(goal.progress * 100)}% — deadline is ${dayjs(goal.deadline).format("DD MMM")}.`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: remindAt.toDate(),
        },
      });
    }
  } catch {
    // no-op
  }
}

/** Cancel every scheduled notification. Safe/no-op in Expo Go. */
export async function disableAllReminders(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // no-op
  }
}
