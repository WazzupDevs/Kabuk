import type { PushMessage } from './pure/push.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Best effort: a missing token or an unreachable push service never fails the request.
// No Expo account is needed to send to Expo push tokens.
export async function sendPush(token: string | null, message: PushMessage): Promise<void> {
  if (!token) return;
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      to: token,
      title: message.title,
      body: message.body,
      sound: 'default',
      // Android: Expo sends a data message, the app's expo-notifications draws it and reads `kind`
      // for its icon (pure/push.ts → PushMessage).
      data: { kind: message.kind, ...(message.target ? { target: message.target } : {}) },
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`push failed (${res.status})`);
}
