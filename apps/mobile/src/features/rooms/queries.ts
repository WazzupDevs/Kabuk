import type { Database } from '@shared/database.ts';
import {
  BROADCAST,
  type RequesterStatus,
  ROOM_CHECK_COLUMNS,
  ROOM_CHECK_SECONDS,
  roomCheckDiffers,
  sessionChannel,
  venueChannel,
} from '@shared/rooms.ts';
import { gameTag } from '@shared/tableCard.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { roomsApi } from '@/lib/api';
import { privateChannel, useChannel } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';

import { useBroadcast } from './useBroadcast';

type RoomRow = Database['public']['Tables']['rooms']['Row'];

export const roomKeys = {
  current: ['currentRoom'] as const,
  venueTables: (venueId: string) => ['venueTables', venueId] as const,
  myRequest: ['myRequest'] as const,
  incoming: (roomId: string) => ['incomingRequests', roomId] as const,
  room: (roomId: string) => ['room', roomId] as const,
  roomCheck: (roomId: string) => ['roomCheck', roomId] as const,
  people: (roomId: string) => ['tablePeople', roomId] as const,
  votes: (roomId: string) => ['tableVotes', roomId] as const,
  requestProfile: (requestId: string) => ['requestProfile', requestId] as const,
};

// What decides the table's people: a person joining or leaving, a new owner.
function peopleChanged(a: RoomRow | null | undefined, b: RoomRow): boolean {
  return !a || a.owner_session_id !== b.owner_session_id || a.phones !== b.phones;
}

// What Mekan's table card shows of the person's table (docs/SPEC_V4.md §4.E).
export const TABLE_ROOM_COLUMNS =
  'id, status, visibility, owner_session_id, name, name_rerolls, icon, phones, intent, game_tag';
export type TableRoomRow = Pick<
  RoomRow,
  | 'id'
  | 'status'
  | 'visibility'
  | 'owner_session_id'
  | 'name'
  | 'name_rerolls'
  | 'icon'
  | 'phones'
  | 'intent'
  | 'game_tag'
>;

// The person's table: RLS lets a person read only the tables it sits at, so no filter on the
// check-in is needed. A closed table does not hold the person.
export function useCurrentRoom(sessionId: string | undefined) {
  return useQuery({
    queryKey: roomKeys.current,
    enabled: sessionId !== undefined,
    queryFn: async (): Promise<TableRoomRow | null> => {
      const { data, error } = await supabase
        .from('rooms')
        .select(TABLE_ROOM_COLUMNS)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRoom(roomId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: roomKeys.room(roomId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const reread = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    void queryClient.invalidateQueries({ queryKey: roomKeys.people(roomId) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.votes(roomId) });
  }, [queryClient, roomId]);

  // Postgres Changes on this table (RLS applies). The new row is used as it arrives, without a
  // second round trip; a delete or an empty payload refetches. The person's current table is
  // refetched too: a table that left 'waiting'/'active' must not send Mekan back into it from cache.
  // A vote changes the row as well (rooms_vote), so the vote counts are read again on every change.
  // Realtime delivers a change only while the channel is subscribed and never replays it, so every
  // (re)subscribe (first join, reconnect after the background or a network drop) re-reads the table.
  useChannel<RoomRow | null>(
    `room:${roomId}`,
    (emit) => ({
      channel: privateChannel(`room:${roomId}`).on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: { new?: Partial<RoomRow> }) =>
          emit(payload.new && payload.new.id === roomId ? (payload.new as RoomRow) : null),
      ),
      onStatus: (status) => {
        if (status === 'SUBSCRIBED') emit(null);
      },
    }),
    (row) => {
      if (row) {
        const cached = queryClient.getQueryData<RoomRow | null>(roomKeys.room(roomId));
        queryClient.setQueryData(roomKeys.room(roomId), row);
        void queryClient.invalidateQueries({ queryKey: roomKeys.current });
        void queryClient.invalidateQueries({ queryKey: roomKeys.votes(roomId) });
        // The people are read again only when they changed, not on every move.
        if (peopleChanged(cached, row)) {
          void queryClient.invalidateQueries({ queryKey: roomKeys.people(roomId) });
        }
      } else reread();
    },
  );

  // Status check (@shared/rooms.ts): every few seconds and when the app comes to the foreground,
  // the few columns that decide what the screen shows; the full row is read again only when they
  // differ, so a check never overwrites a newer row from the channel.
  useQuery({
    queryKey: roomKeys.roomCheck(roomId),
    enabled: query.isSuccess,
    refetchInterval: ROOM_CHECK_SECONDS * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(ROOM_CHECK_COLUMNS)
        .eq('id', roomId)
        .maybeSingle();
      if (error) throw error;
      if (roomCheckDiffers(queryClient.getQueryData<RoomRow | null>(roomKeys.room(roomId)), data)) {
        reread();
      }
      return data;
    },
  });

  return query;
}

// The people at the table (Masadakiler, docs/SPEC_V4.md §4.E): only for a person at it. Read again
// when the table's people change (useRoom).
export type TablePerson = {
  sessionId: string;
  alias: string;
  // The anonymous seat's capsule (docs/SPEC_V4.md §4.D); null for a profiled one.
  look: string | null;
  profiled: boolean;
  owner: boolean;
  joinedAt: string;
};

export function useTablePeople(roomId: string, enabled = true) {
  return useQuery({
    queryKey: roomKeys.people(roomId),
    enabled,
    queryFn: async (): Promise<TablePerson[]> => {
      const { data, error } = await supabase.rpc('table_people', { target_room_id: roomId });
      if (error) throw error;
      return data.map((p) => ({
        sessionId: p.session_id,
        alias: p.alias,
        look: p.look || null,
        profiled: p.profiled,
        owner: p.is_owner,
        joinedAt: p.joined_at,
      }));
    },
  });
}

// Oyun Seç's votes (docs/SPEC_V4.md §4.F): the count per game and the person's own; never who.
export type TableVotes = { counts: Record<string, number>; mine: string | null };

export function useTableVotes(roomId: string, enabled = true) {
  return useQuery({
    queryKey: roomKeys.votes(roomId),
    enabled,
    queryFn: async (): Promise<TableVotes> => {
      const { data, error } = await supabase.rpc('table_vote_counts', { target_room_id: roomId });
      if (error) throw error;
      const counts: Record<string, number> = {};
      let mine: string | null = null;
      for (const row of data) {
        counts[row.concept] = row.votes;
        if (row.mine) mine = row.concept;
      }
      return { counts, mine };
    },
  });
}

// The venue's tables (docs/SPEC_V4.md §4.E): the lobby's open ones ("Açık masalar", "Katıl") and the
// running ones ("Süren masalar", "Bu masadayım"). One read, again on lobby_changed. No person's name,
// public id or account id.
export type VenueTable = {
  roomId: string;
  name: string;
  icon: string | null;
  phones: number;
  intent: string | null;
  gameTag: ReturnType<typeof gameTag>;
  spotId: string | null;
  spotName: string | null;
  waitingSince: string;
};

export function useVenueTables(venueId: string | undefined) {
  const queryClient = useQueryClient();
  const refetch = useCallback(() => {
    if (venueId) void queryClient.invalidateQueries({ queryKey: roomKeys.venueTables(venueId) });
  }, [queryClient, venueId]);
  useBroadcast(venueId ? venueChannel(venueId) : null, BROADCAST.lobbyChanged, refetch);

  return useQuery({
    queryKey: roomKeys.venueTables(venueId ?? ''),
    enabled: venueId !== undefined,
    queryFn: async (): Promise<{ open: VenueTable[]; running: VenueTable[] }> => {
      const { data, error } = await supabase.rpc('venue_tables', {
        target_venue_id: venueId ?? '',
      });
      if (error) throw error;
      const open: VenueTable[] = [];
      const running: VenueTable[] = [];
      for (const t of data) {
        const table: VenueTable = {
          roomId: t.room_id,
          name: t.name,
          icon: t.icon || null,
          phones: t.phones,
          intent: t.intent || null,
          gameTag: gameTag(t.game_tag),
          spotId: t.spot_id || null,
          spotName: t.spot_name || null,
          waitingSince: t.waiting_since,
        };
        (t.open ? open : running).push(table);
      }
      return { open, running };
    },
  });
}

// The person's latest join request, as the requester may see it.
export function useMyRequest(sessionId: string | undefined, since: string | undefined) {
  const queryClient = useQueryClient();
  const refetch = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.myRequest });
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
  }, [queryClient]);
  useBroadcast(sessionId ? sessionChannel(sessionId) : null, BROADCAST.joinAccepted, refetch);

  return useQuery({
    queryKey: roomKeys.myRequest,
    enabled: since !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_join_requests')
        .select('id, room_id, status, expires_at')
        .gte('created_at', since ?? '')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      // View columns are nullable in the generated types; rows always have them.
      if (!data?.id || !data.room_id || !data.status || !data.expires_at) return null;
      return {
        id: data.id,
        roomId: data.room_id,
        status: data.status as RequesterStatus,
        expiresAt: data.expires_at,
      };
    },
  });
}

// Pending requests the owner answers ("Katıl" and "Bu masadayım"; RLS). Null: this person does not
// own the table.
export function useIncomingRequests(roomId: string, ownerSessionId: string | null) {
  const queryClient = useQueryClient();
  const refetch = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: roomKeys.incoming(roomId) }),
    [queryClient, roomId],
  );
  useBroadcast(
    ownerSessionId ? sessionChannel(ownerSessionId) : null,
    BROADCAST.joinRequest,
    refetch,
  );

  return useQuery({
    queryKey: roomKeys.incoming(roomId),
    enabled: ownerSessionId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('join_requests')
        .select('id, requester_alias, requester_phones, requester_profiled, expires_at, as_member')
        .eq('room_id', roomId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

// The request card's profile (docs/SPEC_V3.md §23.E): name, age and photo of a requester who asked
// with its profile, for the owner, while the request waits (rule 4). Not kept after the card
// closes; the card waits for nothing (the countdown and the buttons are there at once).
export function useRequestProfile(requestId: string | undefined, profiled: boolean) {
  return useQuery({
    queryKey: roomKeys.requestProfile(requestId ?? ''),
    enabled: !!requestId && profiled,
    staleTime: Infinity,
    gcTime: 0,
    retry: 1,
    queryFn: () => roomsApi.requestProfile(requestId ?? ''),
  });
}
