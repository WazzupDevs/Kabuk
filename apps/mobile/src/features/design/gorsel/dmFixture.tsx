import type { DmInboxThread, Friend } from '@shared/api/friends.ts';
import type { DmPageRow } from '@shared/dmInbox.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { friendKeys } from '@/features/friends/queries';
import { goOffline } from '@/lib/offline';

import { DmThread } from '../../../../app/(app)/(tabs)/messages/[threadId]';

// The DM for the visual gate's `ekran/dm`: the conversation itself (DmThread, the route's body)
// over an own query client filled with the board's sample (docs/design/yeni-arayuz/project/
// DmSohbet.dc.html), off the network (lib/offline.ts: no call, no read, no Realtime). The gate's
// clock stands at Thursday 15 January, 12:00: "Dün" is the 14th; the board's "Bugün" messages
// (18:08, 18:10) are drawn on the 15th.
const THREAD = 'gate-dm';
const FRIEND = 'gate-fevve';
const NAME = 'Fevve';
const MINE = 'Vampir masası kuruluyor';

function at(day: 14 | 15, clock: string): string {
  return `2026-01-${day}T${clock}:00+03:00`;
}

function row(
  id: string,
  body: string,
  createdAt: string,
  fromMe: boolean,
  extra: Partial<Pick<DmPageRow, 'status' | 'reply_to' | 'reactions'>> = {},
): DmPageRow {
  return {
    id,
    body,
    created_at: createdAt,
    from_me: fromMe,
    status: fromMe ? 'read' : null,
    reply_to: null,
    reactions: null,
    ...extra,
  };
}

// Newest first, as dm_messages_page sends them. DmSohbet `.rxs`: Bayıldım 1, Kahkaha 2; the held
// message's board (DmMesajMenu `.f.sel`) has the viewer's own Bayıldım on it (`mine`).
const page = (mine: boolean): DmPageRow[] => [
  row('m7', 'Nerelerdesin?', at(15, '18:10'), false),
  row('m6', 'Bana köylü düşsün bu sefer', at(15, '18:08'), false, {
    reply_to: { id: 'm4', body: MINE, from_me: true },
  }),
  row('m5', 'Geliyorum, 10 dk', at(14, '22:14'), false, {
    reactions: [
      { emoji: 'ask', from_me: mine },
      { emoji: 'kahkaha', from_me: false },
      { emoji: 'kahkaha', from_me: false },
    ],
  }),
  row('m4', MINE, at(14, '22:10'), true),
  row('m3', "Bu akşam Lale'de misin?", at(14, '22:10'), true),
  row('m2', 'Kampüstekiler toplanıyormuş', at(14, '22:02'), false),
  row('m1', 'Selam, bu akşam çıkıyor musun?', at(14, '22:02'), false),
];

// The inbox's row: two unread, so the DM opens under "2 yeni mesaj".
const INBOX: DmInboxThread[] = [
  {
    threadId: THREAD,
    publicId: FRIEND,
    displayName: NAME,
    photoUrl: null,
    lastBody: 'Nerelerdesin?',
    lastDeleted: false,
    lastFromMe: false,
    lastMessageAt: at(15, '18:10'),
    unreadCount: 2,
    lastStatus: null,
    pinned: false,
    archived: false,
  },
];

const FRIENDS: Friend[] = [
  {
    publicId: FRIEND,
    displayName: NAME,
    photoUrl: null,
    since: at(14, '12:00'),
    threadId: THREAD,
    lastMessageAt: at(15, '18:10'),
    unread: true,
  },
];

export function DmFixture({ mine = false }: { mine?: boolean }) {
  const [client] = useState(() => {
    goOffline();
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    c.setQueryData(friendKeys.inbox, INBOX);
    c.setQueryData(friendKeys.list, FRIENDS);
    c.setQueryData(friendKeys.dm(THREAD), { pages: [page(mine)], pageParams: [null] });
    return c;
  });
  return (
    <QueryClientProvider client={client}>
      <DmThread threadId={THREAD} publicId={FRIEND} name={NAME} gateTyping />
    </QueryClientProvider>
  );
}
