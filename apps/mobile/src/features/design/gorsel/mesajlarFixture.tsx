import type { DmInboxThread, VenueChatIncoming } from '@shared/api/friends.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { friendKeys } from '@/features/friends/queries';
import { goOffline } from '@/lib/offline';

import ArchiveScreen from '../../../../app/(app)/(tabs)/messages/archive';
import MessagesScreen from '../../../../app/(app)/(tabs)/messages';
import { GATE_NOW } from './deterministic';

// The Mesajlar family for the visual gate (`ekran/mesajlar…`, `ekran/arsiv…`): the routes
// themselves, drawn whole, over an own query client filled with the boards' sample (docs/design/
// yeni-arayuz/project: Main, MesajlarUzunBas, MesajlarSabitDolu, MesajlarArsivRozet, MesajlarBos,
// Arsiv, ArsivBos); no server, nothing signed in. The clock stands at Thursday noon, so the
// boards' "Per" (a Thursday) cannot be drawn: a Thursday a week back is a date ("8 Oca").
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function ago(ms: number): string {
  return new Date(GATE_NOW - ms).toISOString();
}

type Sample = Partial<DmInboxThread> & { displayName: string };

function thread(n: number, s: Sample): DmInboxThread {
  return {
    threadId: `t${n}`,
    publicId: `p${n}`,
    photoUrl: null,
    lastBody: null,
    lastDeleted: false,
    lastFromMe: false,
    lastMessageAt: null,
    unreadCount: 0,
    lastStatus: null,
    pinned: false,
    archived: false,
    ...s,
  };
}

// The boards' rows. Adem 01:44 and Ece 00:12 are today, "Dün" a day back, "Pzt" three days back.
const ADEM = thread(1, {
  displayName: 'Adem',
  pinned: true,
  lastBody: 'salam alekumm',
  lastFromMe: true,
  lastStatus: 'read',
  lastMessageAt: ago(10 * 60 * MINUTE + 16 * MINUTE),
});
const FEVVE = thread(2, {
  displayName: 'Fevve',
  lastBody: 'Deneme',
  unreadCount: 2,
  lastMessageAt: ago(DAY),
});
const FURKAN = thread(3, {
  displayName: 'Furkan',
  lastBody: 'Kasnakaka',
  lastMessageAt: ago(7 * DAY),
});
const S2C = thread(4, { displayName: 'S2c!56', lastMessageAt: ago(7 * DAY) });
const KADIR = thread(5, {
  displayName: 'Kadir',
  lastBody: 'Naber lan Fırat',
  lastMessageAt: ago(3 * DAY),
});
const MAIN_ROWS = [ADEM, FEVVE, FURKAN, S2C, KADIR];

// The twelve archived (Main's "Arşivlenenler 12"): Arsiv's eight in their order, four more under
// them. Melis's and Onur's last message is the caller's, read (Arsiv: the blue ticks).
const ARCHIVE_NAMES: readonly [string, string, string, number, boolean][] = [
  ['Tuncay', 'Tamamdır görüşürüz', '2025-10-12', 0, false],
  ['Melis', 'Fotoğrafı attım', '2025-10-09', 0, true],
  ['Barış', 'Yarın kafede misin?', '2025-10-02', 2, false],
  ['Zeynep', 'Hahaha aynen', '2025-09-28', 0, false],
  ['Onur', 'Oyun güzeldi', '2025-09-21', 0, true],
  ['Ece', 'Sonra konuşuruz', '2025-09-14', 0, false],
  ['Emre', '👍', '2025-09-03', 0, false],
  ['Selin', 'Görüldü atma :)', '2025-08-27', 0, false],
  ['Can', 'Vampir kimdi ya', '2025-08-20', 0, false],
  ['Berk', 'Hahaha', '2025-08-11', 0, false],
  ['Irmak', 'Teşekkürler', '2025-08-02', 0, false],
  ['Deniz', 'Akşam masa kuralım mı?', '2025-07-25', 0, false],
];
// Arsiv's eight rows (no row under Selin, as the board; its count then reads "8 sohbet", the
// board's "12 sohbet").
const ARSIV_ROWS = 8;
function archived(unreadAll: boolean, count = ARCHIVE_NAMES.length): DmInboxThread[] {
  return ARCHIVE_NAMES.slice(0, count).map(([name, body, day, unread, mine], i) =>
    thread(20 + i, {
      displayName: name,
      lastBody: body,
      lastMessageAt: `${day}T18:00:00+03:00`,
      unreadCount: unreadAll ? unread : 0,
      lastFromMe: mine,
      lastStatus: mine ? 'read' : null,
      archived: true,
    }),
  );
}

// "İstekler 3": the venue chat's three waiting requests.
const REQUESTS: VenueChatIncoming[] = [1, 2, 3].map((n) => ({
  requestId: `r${n}`,
  venueName: null,
  displayName: null,
  age: null,
  photoUrl: null,
  createdAt: ago(n * MINUTE),
}));

// `requests`: "İstekler 3" (MesajlarBos draws none). The bell's dot: one notification unseen.
function GateClient({
  inbox,
  requests = true,
  children,
}: {
  inbox: readonly DmInboxThread[];
  requests?: boolean;
  children: React.ReactNode;
}) {
  const [client] = useState(() => {
    // Off the network (lib/offline.ts): the rows' "yazıyor" channels are not joined.
    goOffline();
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    c.setQueryData(friendKeys.inbox, inbox);
    c.setQueryData(friendKeys.incoming, []);
    c.setQueryData(friendKeys.incomingChat, requests ? REQUESTS : []);
    c.setQueryData(friendKeys.notifications, { notifications: [], unseen: 1 });
    return c;
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export type MesajlarVariant = 'main' | 'pinned-full' | 'archive-unread' | 'empty';

// Main (01), MesajlarSabitDolu (104), MesajlarArsivRozet (105), MesajlarBos (109).
export function MesajlarFixture({ variant = 'main' }: { variant?: MesajlarVariant }) {
  const inbox: DmInboxThread[] =
    variant === 'empty'
      ? []
      : variant === 'pinned-full'
        ? [
            ADEM,
            thread(6, {
              displayName: 'Ece',
              pinned: true,
              lastBody: 'Yarın görüşürüz',
              lastMessageAt: ago(11 * 60 * MINUTE + 48 * MINUTE),
            }),
            thread(7, {
              displayName: 'Mert',
              pinned: true,
              lastBody: 'Tavla bende',
              lastMessageAt: ago(DAY),
            }),
            thread(8, {
              displayName: 'Selin',
              pinned: true,
              lastBody: 'Tamam 👍',
              lastMessageAt: ago(DAY),
            }),
            thread(9, {
              displayName: 'Deniz',
              pinned: true,
              lastBody: 'Fotoğrafı attım',
              lastMessageAt: ago(4 * DAY),
            }),
            FEVVE,
            KADIR,
            ...archived(false),
          ]
        : [...MAIN_ROWS, ...archived(variant === 'archive-unread')];
  return (
    <GateClient inbox={inbox} requests={variant !== 'empty'}>
      <MessagesScreen />
    </GateClient>
  );
}

// Arsiv (01f), ArsivBos (01h): `empty` nothing archived, the chats are still there.
export function ArchiveFixture({ empty = false }: { empty?: boolean }) {
  return (
    <GateClient inbox={empty ? MAIN_ROWS : [...MAIN_ROWS, ...archived(true, ARSIV_ROWS)]}>
      <ArchiveScreen />
    </GateClient>
  );
}
