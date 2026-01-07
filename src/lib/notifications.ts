// src/lib/notifications.ts
import * as Notifications from "expo-notifications";

export async function notifyLocal(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // best-effort only
  }
}
