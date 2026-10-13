import { nextOfflineSince, OFFLINE_GRACE_MS, showOffline } from '@shared/presence.ts';
import { useEffect, useState } from 'react';

import { privateChannel, useChannel } from '@/lib/realtime';

type Role = 'owner' | 'guest';

// Realtime presence in the room: tells whether the other table is still connected
// (MVP_SPEC §9 Realtime). The channel is private: only the room's two tables may join or track
// (realtime.messages policies). Presence keys are the roles, not session ids. A drop is reported
// only after OFFLINE_GRACE_MS without the other table (pure/presence.ts); this only reads the
// presence sync, it sends nothing more than the one track on joining.
export function useOtherTableOnline(roomId: string, role: Role, hasOtherTable: boolean): boolean {
  // Opened without the other table: the grace starts now, until the first presence sync.
  const [offlineSince, setOfflineSince] = useState<number | null>(() =>
    hasOtherTable ? Date.now() : null,
  );
  const [now, setNow] = useState(() => Date.now());
  const other = role === 'owner' ? 'guest' : 'owner';

  useChannel<string[]>(
    `presence:${roomId}`,
    (emit) => {
      const channel = privateChannel(`presence:${roomId}`, role);
      channel.on('presence', { event: 'sync' }, () => emit(Object.keys(channel.presenceState())));
      return {
        channel,
        onStatus: (status, subscribed) => {
          if (status === 'SUBSCRIBED') void subscribed.track({});
        },
      };
    },
    (keys) => {
      const online = !hasOtherTable || keys.includes(other);
      setOfflineSince((prev) => nextOfflineSince(prev, online, Date.now()));
    },
  );

  // One timer to the end of the grace, so the note shows on time without a ticking clock.
  useEffect(() => {
    if (offlineSince === null) return;
    const wait = Math.max(0, offlineSince + OFFLINE_GRACE_MS - Date.now());
    const timer = setTimeout(() => setNow(Date.now()), wait);
    return () => clearTimeout(timer);
  }, [offlineSince]);

  return !showOffline(offlineSince, now);
}
