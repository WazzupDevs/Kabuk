// What a friends event reads again (docs/denetim/performans-2026-11.md → B3). Every event used to
// invalidate the whole `['friends']` prefix: the lists, the requests, the play history (100 rows),
// the bell, the inbox and every loaded page of an open DM, whatever changed. Now each event names
// the queries it can change (features/friends/queries.ts → refreshFriends). A conversation's pages
// are never among them: a DM reads its own pages on dm:{thread_id} (refreshDm), and a friendship
// that ends closes it through the friend list it reads. Only what this phone reads again changes;
// nothing the server sends or keeps (rule 5's silence) does. Pure, so friendRefresh.test.ts pins it.
export type FriendQuery =
  'list' | 'incoming' | 'incomingChat' | 'history' | 'inbox' | 'notifications';

// `request`: a request came in (the inbox broadcast). `pressed`: this phone pressed "Arkadaş ekle",
// took it back or sent "İstek gönder" from a play history record (its record changes; a match makes
// a friend). `friendship`: a friendship began or ended (the inbox broadcast, a request answered, a
// friend removed or blocked, a conversation left).
export type FriendEvent = 'request' | 'pressed' | 'friendship';

const READS: Record<FriendEvent, readonly FriendQuery[]> = {
  request: ['incoming', 'incomingChat', 'notifications'],
  pressed: ['history', 'list', 'inbox'],
  friendship: ['list', 'inbox', 'history', 'incoming', 'incomingChat', 'notifications'],
};

export function friendReads(event: FriendEvent): readonly FriendQuery[] {
  return READS[event];
}
