import type { Db } from './auth.ts';
import { inBackground } from './background.ts';
import { broadcast } from './broadcast.ts';
import { dbError } from './db.ts';
import { AppError } from './pure/errors.ts';
import type { PushMessage, PushPreference } from './pure/push.ts';
import { inboxChannel } from './pure/rooms.ts';
import { sendPush } from './push.ts';

// Data-free inbox events (docs/arsiv/SPEC_V2.md §7), sent after the response so timing tells nothing.
export function notifyInbox(userIds: string[], event: string): void {
  for (const id of userIds) inBackground(broadcast(inboxChannel(id), event));
}

// A push to an account that allows it (pure/push.ts → PUSH_PREFERENCE), read before it goes.
export function pushIfAllowed(
  db: Db,
  userId: string,
  preference: PushPreference,
  message: PushMessage,
): void {
  inBackground(
    (async () => {
      const { data, error } = await db
        .from('profiles')
        .select('push_token, notify_dm, notify_friend_requests, notify_invites')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw dbError('profiles', error);
      if (data?.[preference]) await sendPush(data.push_token, message);
    })(),
  );
}

export async function requireDisplayName(db: Db, userId: string): Promise<void> {
  const { data, error } = await db
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw dbError('profiles', error);
  if (!data?.display_name) {
    throw new AppError('display_name_required', 'Choose a display name first.');
  }
}
