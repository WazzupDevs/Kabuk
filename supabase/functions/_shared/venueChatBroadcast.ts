// A venue chat change is heard on every campus of the chat's university (docs/SPEC_V4.md §4.Q):
// each phone listens on its own venue's topic only, so every data-free venue chat broadcast goes to
// each venue of the chat's scope. Never broadcast a venue chat event on one topic alone.
import type { Db } from './auth.ts';
import { broadcastMany } from './broadcast.ts';
import { dbError } from './db.ts';
import { venueChatChannel } from './pure/venueChat.ts';

export async function broadcastVenueChat(
  db: Db,
  venueId: string,
  event: string | readonly string[],
): Promise<void> {
  const { data, error } = await db.rpc('venue_chat_topics', { target_venue_id: venueId });
  if (error) throw dbError('venue_chat_topics', error);
  const events = typeof event === 'string' ? [event] : event;
  await broadcastMany(
    data.flatMap((id) => events.map((e) => ({ topic: venueChatChannel(id), event: e }))),
  );
}
