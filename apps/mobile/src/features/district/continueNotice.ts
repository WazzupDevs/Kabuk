import type { DistrictState } from '@shared/api/district.ts';
import { APP_NAME } from '@shared/brand.ts';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { tr } from '@/i18n/tr';

// "Devam?" while the app is closed (docs/SPEC_V4.md §4.V, SemtDevam): the server sends no push; the
// phone plans its own notification at the session's end and takes it back when the session ends,
// is extended or left. A tap opens the room with the sheet (push.ts → DISTRICT_NOTICE_TARGET). It
// carries no district, room or message: only the person's own district's name in its words.
export const DISTRICT_NOTICE_TARGET = 'district';
const NOTICE_ID = 'district-continue';
const CHANNEL = 'default';

// Whether the session's end asks "Devam?": not when it ends with the day (00:00 closes it).
export function asksToContinue(state: DistrictState): boolean {
  const s = state.session;
  return !!s && Date.parse(s.endsAt) < Date.parse(state.opensAt);
}

// What is planned now (this run of the app): the same session and end are not planned twice.
let planned: string | null = null;

async function cancel(): Promise<void> {
  planned = null;
  await Notifications.cancelScheduledNotificationAsync(NOTICE_ID).catch(() => undefined);
}

// Asked when the person goes in (İçeri gir, Yeniden gir, Semte Git): the notification is the only
// way to hear of the end while the app is closed. Never during onboarding, never at launch.
export async function askNoticePermission(): Promise<void> {
  try {
    const now = await Notifications.getPermissionsAsync();
    if (!now.granted && now.canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {
    // Optional: the sheet still opens while the app is open.
  }
}

export async function syncContinueNotice(state: DistrictState): Promise<void> {
  try {
    const s = state.session;
    const name = state.district?.name;
    // A session ending at 00:00 is not asked "Devam?" (§4.V): no notice for it.
    if (!s || !name || Date.parse(s.endsAt) <= Date.now() || !asksToContinue(state)) {
      if (planned !== null) await cancel();
      return;
    }
    const key = `${s.id}:${s.endsAt}:${name}`;
    if (planned === key) return;
    await cancel();
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: CHANNEL,
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    await Notifications.scheduleNotificationAsync({
      identifier: NOTICE_ID,
      content: {
        title: APP_NAME,
        body: tr.district.cont.notice(name),
        data: { target: DISTRICT_NOTICE_TARGET },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(s.endsAt),
        channelId: CHANNEL,
      },
    });
    planned = key;
  } catch {
    // A notification that cannot be planned must never stop the room.
  }
}

// Sign-out and leaving: nothing planned stays.
export function cancelContinueNotice(): Promise<void> {
  return cancel();
}
