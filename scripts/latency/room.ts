// The room step of the latency measurement (docs/SPEC_V3.md §22.I, step 22.6): how long a game
// action takes to reach every phone in a two-sided room, with 2, 4 and 8 phones. The phones are
// test accounts in this one process, so every arrival is read on the same clock.
//
// For each size the phones check in as tables that take members; the first opens a room, the
// second joins as the guest side's leader ("Katıl") and the rest join the two sides in turn as
// members ("Bu masadayım"), each accepted by its side's leader. The leaders start Sohbet kartları
// (a proposal and its acceptance), and every phone listens on the room channel the way the app does
// (room:{room_id}, Postgres Changes on the rooms row). Each round one phone deals the next card
// (sohbet/next-card, one per 5 seconds a room) and every phone's UPDATE is timed: from the action's
// answer (the step §22.I names) and from the moment it was sent. At the end every phone leaves the
// venue, which ends the room.
import type { SupabaseClient } from '@supabase/supabase-js';

import { SOHBET_NEXT_COOLDOWN_MS } from '../../supabase/functions/_shared/pure/sohbet.ts';

export type RoomPhone = { name: string; client: SupabaseClient; userId: string };

type Json = Record<string, unknown>;

export type RoomDeps = {
  call: (phone: RoomPhone, fn: string, body: Json) => Promise<Json>;
  // Checks the phone in at the measured venue as a table that takes members (teams: true).
  checkIn: (phone: RoomPhone) => Promise<string>;
  add: (step: string, value: number) => void;
  now: () => number;
  sleep: (ms: number) => Promise<unknown>;
  rounds: number;
};

export const ROOM_SIZES = [2, 4, 8] as const;

// A side's leader for the n-th phone (0 and 1 lead; the rest alternate owner, guest).
export const sideOfPhone = (index: number): 'owner' | 'guest' =>
  index % 2 === 0 ? 'owner' : 'guest';

export async function measureRoom(phones: readonly RoomPhone[], deps: RoomDeps): Promise<void> {
  for (const size of ROOM_SIZES) {
    if (size > phones.length) {
      console.log(
        `Oda adımı: ${size} telefon için ${phones.length} hesap var (ROOM_PHONES), atlandı.`,
      );
      continue;
    }
    await oneRoom(phones.slice(0, size), deps);
  }
}

// The phone's room channel: resolves `next()` at the next UPDATE of the room row.
async function watch(phone: RoomPhone, roomId: string, now: () => number) {
  let waiting: ((at: number) => void)[] = [];
  const channel = phone.client.channel(`room:${roomId}`, { config: { private: true } });
  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
    () => {
      const at = now();
      const resolve = waiting;
      waiting = [];
      for (const r of resolve) r(at);
    },
  );
  const status = await new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve('TIMED_OUT'), 10_000);
    channel.subscribe((s) => {
      if (s === 'SUBSCRIBED' || s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
        clearTimeout(timer);
        resolve(s);
      }
    });
  });
  if (status !== 'SUBSCRIBED') throw new Error(`${phone.name} room:${roomId}: ${status}`);
  return {
    // The next change's arrival, or null after `timeoutMs`.
    next: (timeoutMs = 10_000) =>
      new Promise<number | null>((resolve) => {
        const timer = setTimeout(() => resolve(null), timeoutMs);
        waiting.push((at) => {
          clearTimeout(timer);
          resolve(at);
        });
      }),
    close: () => phone.client.removeChannel(channel),
  };
}

async function pendingRequest(leader: RoomPhone, roomId: string): Promise<string> {
  for (let i = 0; i < 20; i += 1) {
    const { data, error } = await leader.client
      .from('join_requests')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'pending')
      .limit(1);
    if (error) throw error;
    const id = data?.[0]?.id as string | undefined;
    if (id) return id;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${leader.name}: no pending request in ${roomId}`);
}

async function oneRoom(phones: readonly RoomPhone[], deps: RoomDeps): Promise<void> {
  const { call, now, sleep, add } = deps;
  const size = phones.length;
  const [owner, guest] = phones;
  if (!owner || !guest) throw new Error('a room needs two phones');
  for (const phone of phones) await deps.checkIn(phone);

  const { roomId } = (await call(owner, 'rooms', { action: 'create', profiled: false })) as {
    roomId: string;
  };
  await call(guest, 'rooms', { action: 'request-join', roomId, profiled: false });
  await call(owner, 'rooms', {
    action: 'respond',
    requestId: await pendingRequest(owner, roomId),
    accept: true,
  });
  for (const [i, member] of phones.entries()) {
    if (i < 2) continue;
    const side = sideOfPhone(i);
    const leader = side === 'owner' ? owner : guest;
    await call(member, 'rooms', { action: 'request-join', roomId, profiled: false, side });
    await call(leader, 'rooms', {
      action: 'respond',
      requestId: await pendingRequest(leader, roomId),
      accept: true,
    });
  }
  await call(owner, 'rooms', { action: 'propose-game', roomId, concept: 'sohbet' });
  await call(guest, 'rooms', { action: 'answer-game', roomId, accept: true });

  const channels = await Promise.all(phones.map((p) => watch(p, roomId, now)));
  // Postgres Changes go live a moment after SUBSCRIBED: one unmeasured card, until every phone
  // has heard it.
  for (let attempt = 0; ; attempt += 1) {
    await sleep(SOHBET_NEXT_COOLDOWN_MS + 300);
    const heard = channels.map((c) => c.next(5_000));
    await call(owner, 'sohbet', { action: 'next-card', roomId });
    if ((await Promise.all(heard)).every((at) => at !== null)) break;
    if (attempt === 4) throw new Error(`room:${roomId}: not every phone hears the room`);
  }

  const label = `Oda, ${size} telefon`;
  let missed = 0;
  for (let round = 0; round < deps.rounds; round += 1) {
    await sleep(SOHBET_NEXT_COOLDOWN_MS + 300);
    const actor = phones[round % size] ?? owner;
    const heard = channels.map((c) => c.next());
    const sent = now();
    await call(actor, 'sohbet', { action: 'next-card', roomId });
    const answered = now();
    add(`${label}: eylem yanıtı (sohbet/next-card)`, answered - sent);
    const arrivals = await Promise.all(heard);
    const got = arrivals.filter((at): at is number => at !== null);
    missed += arrivals.length - got.length;
    for (const at of got) {
      add(`${label}: yanıttan her telefona varış`, at - answered);
      add(`${label}: gönderimden her telefona varış`, at - sent);
    }
    if (got.length > 0) add(`${label}: yanıttan en geç telefon`, Math.max(...got) - answered);
  }
  if (missed > 0) console.log(`${label}: ${missed} varış 10 sn içinde gelmedi (tabloda yok).`);

  await Promise.all(channels.map((c) => c.close()));
  for (const phone of phones) await call(phone, 'checkin', { action: 'leave' });
}
