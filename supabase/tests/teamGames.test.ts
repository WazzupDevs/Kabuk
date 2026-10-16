// Faz 2 step 22.3 (docs/SPEC_V3.md §22.E, §22.K, §22.M): games for teams. A game's authority is the
// side's: every phone on it proposes, answers, presses; the phone that starts a turn describes it and
// alone gets its secret with, in refereed Tabu, the judging side; Sahtekar's seats stay on the
// leader's phone. Tabu's mode and Sahtekar's seats come from the sides' headcounts at the start; a
// game's result goes to the phones in the room at its start and at its end. Rooms without members
// (old apps) are the existing tests' (games, sahtekar, say, ibre), which run unchanged.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { sideHeadcount } from '../functions/_shared/pure/teams.ts';
import { tabuMode } from '../functions/_shared/pure/tabu.ts';
import { normalize } from '../functions/_shared/pure/trText.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import {
  leave,
  type Phone,
  roomRow,
  rooms,
  table as checkIn,
  TEAM_PHONES,
  teamRoom,
  join,
} from './teamRoom.ts';

let venue: Record<string, string> = {};
const OK = { status: 200, body: { ok: true } };

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  for (const phone of TEAM_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const table = (n: number, opts: { headcount?: number } = {}) => checkIn(venue, n, opts);

type TupleOf<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>;

// Phones 0 … count-1, tables of 2.
async function tables<N extends number>(count: N): Promise<TupleOf<Phone, N>> {
  return (await Promise.all(Array.from({ length: count }, (_, i) => table(i)))) as TupleOf<
    Phone,
    N
  >;
}

const call = (p: Phone, fn: string, roomId: string, body: Record<string, unknown>) =>
  invoke(p.client, fn, { roomId, ...body });

async function propose(p: Phone, roomId: string, concept: string) {
  const res = await rooms(p, { action: 'propose-game', roomId, concept });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
}

async function play(proposer: Phone, answerer: Phone, roomId: string, concept: string) {
  await propose(proposer, roomId, concept);
  const answered = await rooms(answerer, { action: 'answer-game', roomId, accept: true });
  expect(answered, JSON.stringify(answered.body)).toEqual(OK);
}

async function state(roomId: string): Promise<Record<string, unknown>> {
  return (await roomRow(roomId)).game_state as Record<string, unknown>;
}

// Expected error: the body's code (the status comes with it, _shared/http.ts).
const failed = (status: number, code: string) => ({ status, body: errorBody(code) });

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
// Table aliases come from alias_words, whose animals are Tabu words too.
const ALIAS_COLUMNS = new Set(['owner_alias', 'guest_alias', 'sender_alias', 'alias']);

// Everything a phone reads about the room outside its own answers, as one string: every value, and
// every key inside JSON values, without column names, aliases and ids (games.test.ts → readableBy).
async function readableBy(p: Phone, roomId: string): Promise<string> {
  const reads = await Promise.all([
    p.client.from('rooms').select('*').eq('id', roomId),
    p.client.from('game_events').select('*').eq('room_id', roomId),
    p.client.from('game_proposals').select('*').eq('room_id', roomId),
    p.client.from('messages').select('*').eq('room_id', roomId),
    p.client.rpc('room_phones', { target_room_id: roomId }),
  ]);
  const rows = reads.flatMap((r) => (r.data ?? []) as Record<string, unknown>[]);
  const values = rows.flatMap((row) =>
    Object.entries(row)
      .filter(([column]) => !ALIAS_COLUMNS.has(column))
      .map(([, value]) => value),
  );
  return normalize(JSON.stringify(values).replace(UUID, ' '));
}

const wordsIn = (text: string, words: string[]) =>
  words.filter((word) => ` ${text} `.includes(` ${word} `));

// The open cards' words once card 0 has closed, minus those inside card 0's own text: "Saat" sits
// in "Saat kulesi", which the room now reads (games.test.ts → openWords).
const openWords = (dealt: string[]) =>
  dealt.slice(1).filter((word) => wordsIn(dealt[0] as string, [word]).length === 0);

// The room channel as the app subscribes to it: every row change of the room and its game rows.
function watchRoomChannel(p: Phone, roomId: string) {
  const payloads: unknown[] = [];
  const channel = p.client.channel(`room:${roomId}`, { config: { private: true } });
  for (const t of ['rooms', 'game_events', 'game_proposals', 'messages']) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: t,
        filter: t === 'rooms' ? `id=eq.${roomId}` : `room_id=eq.${roomId}`,
      },
      (payload: unknown) => payloads.push(payload),
    );
  }
  const subscribed = new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve('TIMED_OUT'), 8000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer);
        resolve(status);
      }
    });
  });
  return { payloads, channel, subscribed };
}

// Until a change arrives: SUBSCRIBED comes before Postgres Changes are live.
async function untilLive(watch: { payloads: unknown[] }, roomId: string) {
  await expect
    .poll(
      async () => {
        await sql`update public.rooms set last_activity_at = last_activity_at where id = ${roomId}`;
        return watch.payloads.length;
      },
      { timeout: 15_000, interval: 500 },
    )
    .toBeGreaterThan(0);
}

function pushedText(payloads: unknown[]): string {
  const rows = (payloads as { new?: Record<string, unknown>; old?: Record<string, unknown> }[])
    .flatMap((p) => [p.new, p.old])
    .filter((row): row is Record<string, unknown> => !!row);
  const values = rows.flatMap((row) =>
    Object.entries(row)
      .filter(([column]) => !ALIAS_COLUMNS.has(column))
      .map(([, value]) => value),
  );
  return normalize(JSON.stringify(values).replace(UUID, ' '));
}

describe('proposals and the room (§22.E)', () => {
  it("is the side's: a member proposes, its teammates cannot answer, the other side's member does", async () => {
    const [owner, guest, ownerMember, guestMember] = await tables(4);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember], guest: [guestMember] });

    await propose(ownerMember, roomId, 'sohbet');
    const [proposal] = await sql`
      select proposer_side, proposer_session_id from public.game_proposals where room_id = ${roomId}
    `;
    expect(proposal).toEqual({
      proposer_side: 'owner',
      proposer_session_id: ownerMember.sessionId,
    });
    // One proposal a room, whoever asks.
    expect(await rooms(guestMember, { action: 'propose-game', roomId, concept: 'tabu' })).toEqual(
      failed(409, 'proposal_pending'),
    );
    expect(await rooms(owner, { action: 'answer-game', roomId, accept: true })).toEqual(
      failed(409, 'no_proposal'),
    );

    // The proposing phone leaves; the proposal stays the side's.
    expect(await leave(ownerMember, roomId)).toEqual(OK);
    expect(await sql`select 1 from public.game_proposals where room_id = ${roomId}`).toHaveLength(
      1,
    );
    expect(await rooms(guestMember, { action: 'answer-game', roomId, accept: true })).toEqual(OK);
    expect((await roomRow(roomId)).concept).toBe('sohbet');

    // Sohbet's next card and "Oyunu bitir": every phone.
    await sql`
      update public.rooms set game_state = game_state - 'nextAllowedAt' where id = ${roomId}
    `;
    expect(await call(guestMember, 'sohbet', roomId, { action: 'next-card' })).toEqual(OK);
    expect(await rooms(guestMember, { action: 'end-game', roomId })).toEqual(OK);
    expect((await roomRow(roomId)).concept).toBeNull();
    // A phone that left has no say.
    expect(await rooms(ownerMember, { action: 'propose-game', roomId, concept: 'tabu' })).toEqual(
      failed(403, 'not_in_room'),
    );
  });

  it("deals a one-table game to any phone on the owner's side", async () => {
    const [owner, member, outsider] = await tables(3);
    const roomId = await teamRoom(owner, null, { owner: [member] });
    const deck = await call(member, 'tabu', roomId, { action: 'start' });
    expect(deck.status, JSON.stringify(deck.body)).toBe(200);
    expect((deck.body as { deck: unknown[] }).deck.length).toBeGreaterThan(0);
    expect((await roomRow(roomId)).concept).toBe('tabu');
    expect(await call(outsider, 'tabu', roomId, { action: 'start' })).toEqual(
      failed(403, 'not_in_room'),
    );
  });
});

describe('Sesli Tabu, refereed (§22.E)', () => {
  const tabu = (p: Phone, roomId: string, body: Record<string, unknown>) =>
    call(p, 'tabu', roomId, body);
  const begin = (p: Phone, roomId: string) => tabu(p, roomId, { action: 'begin-turn' });
  const cards = (p: Phone, roomId: string) => tabu(p, roomId, { action: 'turn-cards' });
  const mark = (p: Phone, roomId: string, cardIndex: number, result: string, turnNo = 1) =>
    tabu(p, roomId, { action: 'mark', turnNo, cardIndex, result });

  async function turn(roomId: string) {
    const gs = await state(roomId);
    const [t] = await sql`
      select * from public.tabu_turns
      where room_id = ${roomId} and game_no = ${gs.gameNo as number} and turn_no = ${gs.turnNo as number}
    `;
    if (!t) throw new Error('no turn');
    return t;
  }

  // Owner's side: the leader and a member; guest's side likewise. Turn 1: the owner's side describes.
  async function started() {
    const [owner, guest, ownerMember, guestMember] = await tables(4);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember], guest: [guestMember] });
    await play(guest, owner, roomId, 'tabu');
    expect(await state(roomId)).toMatchObject({ mode: 'refereed', describingTable: 'owner' });
    return { owner, guest, ownerMember, guestMember, roomId };
  }

  it('makes the starting phone the describer; the cards go to it and the judging side only', async () => {
    const { owner, guest, ownerMember, guestMember, roomId } = await started();
    // Ready: nobody has the cards yet; the judging side cannot start it before readyEndsAt.
    for (const p of [owner, ownerMember, guest, guestMember]) {
      expect(await cards(p, roomId)).toEqual(failed(409, 'turn_not_started'));
    }
    expect(await begin(guestMember, roomId)).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ turnPhase: 'ready' });

    expect(await begin(ownerMember, roomId)).toEqual(OK);
    expect(await state(roomId)).toMatchObject({
      turnPhase: 'running',
      describer: ownerMember.sessionId,
    });
    expect((await turn(roomId)).describer_session_id).toBe(ownerMember.sessionId);
    const [started_] = await sql`
      select session_id from public.game_events where room_id = ${roomId} and type = 'turn_started'
    `;
    expect(started_?.session_id).toBe(ownerMember.sessionId);
    // A second "Başla" changes nothing.
    expect(await begin(owner, roomId)).toEqual(OK);
    expect((await turn(roomId)).describer_session_id).toBe(ownerMember.sessionId);

    const list = await cards(ownerMember, roomId);
    expect(list.status).toBe(200);
    for (const judge of [guest, guestMember]) expect(await cards(judge, roomId)).toEqual(list);
    expect(await cards(owner, roomId)).toEqual(failed(403, 'not_describer'));
  });

  it('takes Doğru from every phone, Tabu from the judging side, Pas from the describer; one press a card', async () => {
    const { owner, guest, ownerMember, guestMember, roomId } = await started();
    await begin(ownerMember, roomId);

    // The describer's teammate: Doğru only.
    expect(await mark(owner, roomId, 0, 'pass')).toEqual(failed(403, 'not_describer'));
    expect(await mark(owner, roomId, 0, 'taboo')).toEqual(failed(403, 'not_judge'));
    expect(await mark(owner, roomId, 0, 'correct')).toEqual(OK);
    // The describer cannot call Tabu; the judging side's member can.
    expect(await mark(ownerMember, roomId, 1, 'taboo')).toEqual(failed(403, 'not_judge'));
    expect(await mark(guestMember, roomId, 1, 'taboo')).toEqual(OK);
    // Pas: the describer only.
    expect(await mark(guest, roomId, 2, 'pass')).toEqual(failed(403, 'not_describer'));
    expect(await mark(ownerMember, roomId, 2, 'pass')).toEqual(OK);
    expect(await mark(guest, roomId, 3, 'correct')).toEqual(OK);

    // Two phones on the same card at once: one action.
    const both = await Promise.all([
      mark(guest, roomId, 4, 'correct'),
      mark(guestMember, roomId, 4, 'taboo'),
    ]);
    expect(both).toEqual([OK, OK]);
    const events = await sql`
      select type, payload from public.game_events
      where room_id = ${roomId} and type in ('correct', 'taboo', 'pass')
      order by created_at
    `;
    expect(events.map((e) => [e.type, (e.payload as { cardIndex: number }).cardIndex])).toEqual([
      ['correct', 0],
      ['taboo', 1],
      ['pass', 2],
      ['correct', 3],
      [events[4]?.type, 4],
    ]);
    const gs = await state(roomId);
    expect(gs.cardIndex).toBe(5);
    expect((gs.scores as { owner: number }).owner).toBe(events[4]?.type === 'correct' ? 2 : 0);
  });

  it("after readyEndsAt, lets the other side start the turn and the describing side's leader describe", async () => {
    const { owner, guest, ownerMember, roomId } = await started();
    // The owner's leader leaves: its member leads, and describes the turn started for it.
    expect(await leave(owner, roomId)).toEqual(OK);
    expect((await roomRow(roomId)).owner_session_id).toBe(ownerMember.sessionId);
    await sql`
      update public.tabu_turns set ready_ends_at = now() - interval '1 second'
      where room_id = ${roomId} and ends_at is null
    `;
    expect(await begin(guest, roomId)).toEqual(OK);
    expect(await state(roomId)).toMatchObject({
      turnPhase: 'running',
      describer: ownerMember.sessionId,
    });
    expect((await turn(roomId)).describer_session_id).toBe(ownerMember.sessionId);
  });

  it("keeps a describer's Pas and cards from everyone once it leaves; the next turn goes on", async () => {
    const { owner, guest, ownerMember, guestMember, roomId } = await started();
    await begin(ownerMember, roomId);
    expect(await leave(ownerMember, roomId)).toEqual(OK);
    expect(await mark(owner, roomId, 0, 'pass')).toEqual(failed(403, 'not_describer'));
    expect(await cards(owner, roomId)).toEqual(failed(403, 'not_describer'));
    expect(await mark(ownerMember, roomId, 0, 'pass')).toEqual(failed(403, 'not_in_room'));
    // The judges still judge.
    expect(await mark(guestMember, roomId, 0, 'correct')).toEqual(OK);

    // The clock runs out; turn 2 is the guest's side's, started by its member.
    await sql`update public.tabu_turns set ends_at = now() - interval '1 second' where room_id = ${roomId}`;
    expect(await tabu(owner, roomId, { action: 'end-turn' })).toEqual(OK);
    let gs = await state(roomId);
    expect(gs).toMatchObject({ turnNo: 2, describingTable: 'guest', turnPhase: 'ready' });
    expect(gs).not.toHaveProperty('describer');
    expect(await begin(guestMember, roomId)).toEqual(OK);
    gs = await state(roomId);
    expect(gs).toMatchObject({ turnPhase: 'running', describer: guestMember.sessionId });
    expect((await cards(owner, roomId)).status).toBe(200);
    expect(await cards(guest, roomId)).toEqual(failed(403, 'not_describer'));
  });

  it('keeps the turn when the describer deletes its account', async () => {
    const { owner, ownerMember, roomId } = await started();
    await begin(ownerMember, roomId);
    await deleteUserByPhone(TEAM_PHONES[2]);
    const t = await turn(roomId);
    expect(t.describer_session_id).toBeNull();
    await sql`update public.tabu_turns set ends_at = now() - interval '1 second' where room_id = ${roomId}`;
    expect(await tabu(owner, roomId, { action: 'end-turn' })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ turnNo: 2 });
  });
});

describe('Sesli Tabu, mode (§22.B, §22.E)', () => {
  const tabu = (p: Phone, roomId: string, body: Record<string, unknown>) =>
    call(p, 'tabu', roomId, body);

  it("takes the sides' headcounts at the start, as pure/teams.ts and pure/tabu.ts do", async () => {
    // The owner's table says 1 but brings 2 phones: refereed.
    const owner = await table(0, { headcount: 1 });
    const [guest, member] = await Promise.all([table(1), table(2)]);
    const roomId = await teamRoom(owner, guest, { owner: [member] });
    const r = await roomRow(roomId);
    const expected = tabuMode(
      sideHeadcount(r.owner_headcount as number, r.owner_phones as number),
      sideHeadcount(r.guest_headcount as number, r.guest_phones as number),
    );
    expect(expected).toBe('refereed');
    for (const side of ['owner', 'guest']) {
      const [row] = await sql`
        select private.room_side_headcount(r, ${side}) as n from public.rooms r where r.id = ${roomId}
      `;
      expect(row?.n).toBe(
        side === 'owner'
          ? sideHeadcount(r.owner_headcount as number, r.owner_phones as number)
          : sideHeadcount(r.guest_headcount as number, r.guest_phones as number),
      );
    }
    await play(guest, member, roomId, 'tabu');
    expect(await state(roomId)).toMatchObject({ mode: expected });
  });

  it('keeps the mode for the game when a phone comes in during it', async () => {
    const owner = await table(0, { headcount: 1 });
    const [guest, latecomer] = await Promise.all([table(1), table(2)]);
    const roomId = await teamRoom(owner, guest);
    await play(guest, owner, roomId, 'tabu');
    expect(await state(roomId)).toMatchObject({ mode: 'cooperative' });
    await join(latecomer, owner, roomId, 'owner');
    expect((await roomRow(roomId)).owner_phones).toBe(2);
    expect(await state(roomId)).toMatchObject({ mode: 'cooperative' });
  });

  it('lets only the describer act in cooperative mode', async () => {
    // The owner's side is one person: cooperative.
    const owner = await table(0, { headcount: 1 });
    const [guest, guestMember] = await Promise.all([table(1), table(2)]);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await play(guest, owner, roomId, 'tabu');
    expect(await state(roomId)).toMatchObject({ mode: 'cooperative' });

    // Turn 1, the owner describes; the guest's side guesses and gets nothing.
    expect(await tabu(owner, roomId, { action: 'begin-turn' })).toEqual(OK);
    for (const p of [guest, guestMember]) {
      expect(await tabu(p, roomId, { action: 'turn-cards' })).toEqual(failed(403, 'not_describer'));
      expect(
        await tabu(p, roomId, { action: 'mark', turnNo: 1, cardIndex: 0, result: 'correct' }),
      ).toEqual(failed(403, 'not_describer'));
    }

    // Turn 2, the guest's side: its member starts and describes, its leader does not act.
    await sql`update public.tabu_turns set ends_at = now() - interval '1 second' where room_id = ${roomId}`;
    expect(await tabu(owner, roomId, { action: 'end-turn' })).toEqual(OK);
    expect(await tabu(guestMember, roomId, { action: 'begin-turn' })).toEqual(OK);
    for (const p of [guest, owner]) {
      expect(await tabu(p, roomId, { action: 'turn-cards' })).toEqual(failed(403, 'not_describer'));
      for (const result of ['correct', 'taboo', 'pass']) {
        expect(await tabu(p, roomId, { action: 'mark', turnNo: 2, cardIndex: 0, result })).toEqual(
          failed(403, 'not_describer'),
        );
      }
    }
    expect((await tabu(guestMember, roomId, { action: 'turn-cards' })).status).toBe(200);
    expect(
      await tabu(guestMember, roomId, {
        action: 'mark',
        turnNo: 2,
        cardIndex: 0,
        result: 'correct',
      }),
    ).toEqual(OK);
  });
});

describe('İbre (§22.E)', () => {
  const ibre = (p: Phone, roomId: string, body: Record<string, unknown>) =>
    call(p, 'ibre', roomId, body);

  it('gives the target to the starting phone only; its teammates lock, the first wins; the other side picks', async () => {
    const [owner, guest, ownerMember, guestMember, ownerMember2] = await tables(5);
    const roomId = await teamRoom(owner, guest, {
      owner: [ownerMember, ownerMember2],
      guest: [guestMember],
    });
    await play(guest, owner, roomId, 'ibre');
    // Ready: the other side cannot start it.
    expect(await ibre(guestMember, roomId, { action: 'begin' })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ turnPhase: 'ready' });
    expect(await ibre(ownerMember, roomId, { action: 'begin' })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({
      turnPhase: 'running',
      describer: ownerMember.sessionId,
      lockBy: 'team',
    });
    const [secret] = await sql`
      select secret from public.game_secrets where room_id = ${roomId} and concept = 'ibre'
    `;
    expect((secret?.secret as { describer: string }).describer).toBe(ownerMember.sessionId);

    const target = await ibre(ownerMember, roomId, { action: 'target', round: 1 });
    expect(target.status).toBe(200);
    for (const p of [owner, ownerMember2, guest, guestMember]) {
      expect(await ibre(p, roomId, { action: 'target', round: 1 })).toEqual(
        failed(403, 'not_describer'),
      );
    }
    // The describer does not lock while a teammate is in the room.
    expect(await ibre(ownerMember, roomId, { action: 'lock', round: 1, value: 50 })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ turnPhase: 'running', needle: null });
    // Two teammates at once: one needle.
    expect(
      await Promise.all([
        ibre(owner, roomId, { action: 'lock', round: 1, value: 20 }),
        ibre(ownerMember2, roomId, { action: 'lock', round: 1, value: 80 }),
      ]),
    ).toEqual([OK, OK]);
    const locked = await state(roomId);
    expect(locked.turnPhase).toBe('side');
    expect([20, 80]).toContain(locked.needle);
    // The other side: any phone; the describing side cannot pick.
    expect(await ibre(owner, roomId, { action: 'side', round: 1, side: 'left' })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ turnPhase: 'side' });
    expect(await ibre(guestMember, roomId, { action: 'side', round: 1, side: 'left' })).toEqual(OK);
    const next = await state(roomId);
    expect(next).toMatchObject({ roundNo: 2, turnPhase: 'ready', describer: null, lockBy: null });
    expect((next.reveal as { needle: number }).needle).toBe(locked.needle);
  });

  it('lets a lone describer lock, and the describer once its teammates are gone; the leader when nobody starts', async () => {
    const [owner, guest, ownerMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
    await play(guest, owner, roomId, 'ibre');

    // Round 1: two phones on the owner's side, its only teammate leaves: the describer locks.
    expect(await ibre(owner, roomId, { action: 'begin' })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ describer: owner.sessionId, lockBy: 'team' });
    expect(await leave(ownerMember, roomId)).toEqual(OK);
    expect(await ibre(owner, roomId, { action: 'lock', round: 1, value: 40 })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ turnPhase: 'side', needle: 40 });
    expect(await ibre(guest, roomId, { action: 'side', round: 1, side: 'right' })).toEqual(OK);

    // Round 2: the guest's side is one phone: it describes and locks.
    expect(await ibre(guest, roomId, { action: 'begin' })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ describer: guest.sessionId, lockBy: 'describer' });
    expect(await ibre(guest, roomId, { action: 'lock', round: 2, value: 60 })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ turnPhase: 'side', needle: 60 });
    expect(await ibre(owner, roomId, { action: 'side', round: 2, side: 'left' })).toEqual(OK);

    // Round 3: nobody starts it; once readyEndsAt has passed the guest's phone advances it and the
    // owner's leader describes.
    await sql`
      update public.rooms
      set game_state = jsonb_set(game_state, '{readyEndsAt}', to_jsonb(now() - interval '1 second'))
      where id = ${roomId}
    `;
    expect(await ibre(guest, roomId, { action: 'advance' })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({
      roundNo: 3,
      turnPhase: 'running',
      describer: owner.sessionId,
      lockBy: 'describer',
    });
  });
});

// Widens the objection window: the test's own calls must not run it out.
async function holdObjections(roomId: string) {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{objectionEndsAt}', to_jsonb(now() + interval '30 seconds'))
    where id = ${roomId}
  `;
}

describe('Harf Kapmaca and Şarkıda Geçsin (§22.E)', () => {
  it("takes claims from every phone on the side whose turn it is, objections from the other side's", async () => {
    const [owner, guest, ownerMember, guestMember] = await tables(4);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember], guest: [guestMember] });
    await play(guest, owner, roomId, 'harf');
    const harf = (p: Phone, body: Record<string, unknown>) => call(p, 'harf', roomId, body);

    expect(await harf(ownerMember, { action: 'begin' })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ turnPhase: 'running', turnTable: 'owner' });
    // The other side's claim is ignored; two phones of the side at once: one claim.
    expect(await harf(guestMember, { action: 'claim', round: 1, step: 0, letter: 'A' })).toEqual(
      OK,
    );
    expect(await state(roomId)).toMatchObject({ step: 0 });
    expect(
      await Promise.all([
        harf(owner, { action: 'claim', round: 1, step: 0, letter: 'E' }),
        harf(ownerMember, { action: 'claim', round: 1, step: 0, letter: 'K' }),
      ]),
    ).toEqual([OK, OK]);
    let gs = await state(roomId);
    expect(gs).toMatchObject({ step: 1, turnTable: 'guest' });
    const letters = gs.letters as { letter: string; closed: boolean }[];
    expect(letters.filter((l) => l.closed)).toHaveLength(1);

    // The guest's member claims; the claiming side cannot object to itself; the owner's member does.
    expect(await harf(guestMember, { action: 'claim', round: 1, step: 1, letter: 'M' })).toEqual(
      OK,
    );
    await holdObjections(roomId);
    expect(await harf(guest, { action: 'object', round: 1, step: 1 })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ roundNo: 1, step: 2 });
    expect(await harf(ownerMember, { action: 'object', round: 1, step: 1 })).toEqual(OK);
    gs = await state(roomId);
    expect(gs).toMatchObject({
      roundNo: 2,
      lastRound: { roundNo: 1, winner: 'owner', reason: 'objection' },
      objectionsLeft: { owner: 2, guest: 3 },
    });
  });

  it('lets every phone on the singing side press Söyledik', async () => {
    const [owner, guest, guestMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await play(owner, guest, roomId, 'sarki');
    const sarki = (p: Phone, body: Record<string, unknown>) => call(p, 'sarki', roomId, body);
    const gs = await state(roomId);
    // Şarkı runs without a ready state after round 1; start it if it is ready.
    if (gs.turnPhase === 'ready') expect(await sarki(owner, { action: 'begin' })).toEqual(OK);
    expect(await sarki(owner, { action: 'said', round: 1, step: 0 })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ step: 1, turnTable: 'guest' });
    expect(await sarki(guestMember, { action: 'said', round: 1, step: 1 })).toEqual(OK);
    expect(await state(roomId)).toMatchObject({ step: 2, turnTable: 'owner' });
  });
});

describe('Sahtekar (§22.E)', () => {
  const sahtekar = (p: Phone, roomId: string, body: Record<string, unknown>) =>
    call(p, 'sahtekar', roomId, body);

  it("seats the sides' headcounts and keeps the seats on the leader's phone", async () => {
    // The owner's table says 2 and brings 3 phones: 3 seats; the guest's says 2: 2 seats.
    const [owner, guest, member, member2] = await tables(4);
    const roomId = await teamRoom(owner, guest, { owner: [member, member2] });
    await play(guest, member, roomId, 'sahtekar');
    expect(await state(roomId)).toMatchObject({
      players: { owner: 3, guest: 2 },
      seats: ['A1', 'A2', 'A3', 'B1', 'B2'],
    });
    const [s] = await sql`
      select secret from public.game_secrets where room_id = ${roomId} and concept = 'sahtekar'
    `;
    const secret = s?.secret as { word: string; options: string[] };

    // Members: no seat action, and no word in anything they read.
    const seatActions = [
      { action: 'view', seat: 'A1' },
      { action: 'said', step: 0 },
      { action: 'vote', voter: 'A1', target: 'B1' },
      { action: 'options' },
      { action: 'guess', option: secret.options[0] },
    ];
    for (const body of seatActions) {
      const res = await sahtekar(member, roomId, body);
      expect(res, JSON.stringify(body)).toEqual(failed(403, 'not_your_seat'));
    }
    const text = ` ${await readableBy(member, roomId)} `;
    for (const word of secret.options) expect(text.includes(` ${normalize(word)} `)).toBe(false);

    // The leader views; it leaves, and the seats go on from the new leader's phone.
    const viewed = await sahtekar(owner, roomId, { action: 'view', seat: 'A1' });
    expect(viewed.status).toBe(200);
    expect(await leave(owner, roomId)).toEqual(OK);
    expect((await roomRow(roomId)).owner_session_id).toBe(member.sessionId);
    expect((await sahtekar(member, roomId, { action: 'view', seat: 'A2' })).status).toBe(200);
    expect(await sahtekar(member2, roomId, { action: 'view', seat: 'A3' })).toEqual(
      failed(403, 'not_your_seat'),
    );
    expect(await state(roomId)).toMatchObject({ viewed: ['A1', 'A2'] });
  });
});

describe('results (§22.E)', () => {
  it('go to the phones in the room at the start and at the end of the game', async () => {
    const [owner, guest, ownerMember, goesAway, latecomer] = await tables(5);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember], guest: [goesAway] });
    await play(guest, owner, roomId, 'harf');
    const started = (await roomRow(roomId)).game_started_at as Date;
    expect(started).toBeInstanceOf(Date);

    // During the game one phone leaves and another comes in.
    expect(await leave(goesAway, roomId)).toEqual(OK);
    await join(latecomer, guest, roomId, 'guest');

    // The last round, ended by the guest's objection: the guest's side wins it.
    const harf = (p: Phone, body: Record<string, unknown>) => call(p, 'harf', roomId, body);
    await sql`
      update public.rooms
      set game_state = jsonb_set(game_state, '{roundNo}', to_jsonb((game_state ->> 'totalRounds')::int))
      where id = ${roomId}
    `;
    expect(await harf(owner, { action: 'begin' })).toEqual(OK);
    const last = (await state(roomId)).roundNo as number;
    expect(await harf(owner, { action: 'claim', round: last, step: 0, letter: 'E' })).toEqual(OK);
    await holdObjections(roomId);
    expect(await harf(latecomer, { action: 'object', round: last, step: 0 })).toEqual(OK);
    expect((await roomRow(roomId)).concept).toBeNull();

    const results = await sql`
      select user_id, score, won from public.game_results where room_id = ${roomId} order by score
    `;
    expect(results.map((r) => r.user_id).sort()).toEqual(
      [owner.userId, ownerMember.userId, guest.userId].sort(),
    );
    const of = (p: Phone) => results.find((r) => r.user_id === p.userId);
    expect(of(owner)).toMatchObject({ score: 0, won: false });
    expect(of(ownerMember)).toMatchObject({ score: 0, won: false });
    expect(of(guest)).toMatchObject({ score: 1, won: true });
  });
});

describe('secrets (§22.E, rules 3 and 4)', () => {
  it("keeps the turn's cards from the describer's teammate: not in rows, events or Realtime", async () => {
    const [owner, guest, ownerMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
    const watch = watchRoomChannel(owner, roomId);
    expect(await watch.subscribed).toBe('SUBSCRIBED');
    await untilLive(watch, roomId);

    await play(guest, owner, roomId, 'tabu');
    expect(await state(roomId)).toMatchObject({ mode: 'refereed' });
    expect(await call(ownerMember, 'tabu', roomId, { action: 'begin-turn' })).toEqual(OK);
    const list = await call(guest, 'tabu', roomId, { action: 'turn-cards' });
    expect(list.status).toBe(200);
    const dealt = (list.body as { cards: { word: string }[] }).cards.map((c) => normalize(c.word));
    expect(await call(owner, 'tabu', roomId, { action: 'turn-cards' })).toEqual(
      failed(403, 'not_describer'),
    );
    expect(wordsIn(await readableBy(owner, roomId), dealt)).toEqual([]);

    // Card 0 closes: its word reaches the room, the open cards' do not.
    expect(
      await call(guest, 'tabu', roomId, {
        action: 'mark',
        turnNo: 1,
        cardIndex: 0,
        result: 'correct',
      }),
    ).toEqual(OK);
    const unclosed = openWords(dealt);
    expect(wordsIn(await readableBy(owner, roomId), unclosed)).toEqual([]);
    await expect.poll(() => watch.payloads.length, { timeout: 10_000 }).toBeGreaterThan(3);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(wordsIn(pushedText(watch.payloads), unclosed)).toEqual([]);
    await owner.client.removeChannel(watch.channel);
  });

  it("keeps İbre's target off the room until the reveal", async () => {
    const [owner, guest, ownerMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
    await play(guest, owner, roomId, 'ibre');
    expect(await call(ownerMember, 'ibre', roomId, { action: 'begin' })).toEqual(OK);
    const gs = await state(roomId);
    expect(gs).not.toHaveProperty('target');
    expect(gs.reveal).toBeNull();
    expect((await owner.client.from('game_secrets').select('*')).data ?? []).toEqual([]);
  });
});

describe('locks (§22.K)', () => {
  // A member's game action holds its own session, then the room: another phone's session held
  // elsewhere does not stop it.
  it("starts a turn from a member while its leader's session is held", async () => {
    const [owner, guest, ownerMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
    await play(guest, owner, roomId, 'tabu');
    const acting = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await sql.begin(async (tx) => {
        await tx`select id from private.active_session_for_update(${owner.userId})`;
        const begun = await acting.begin(async (atx) => {
          await atx`set local lock_timeout = '2s'`;
          return atx`
            select (public.tabu_begin_turn(${ownerMember.userId}, ${roomId})).game_state ->> 'describer' as d
          `;
        });
        expect(begun).toEqual([{ d: ownerMember.sessionId }]);
      });
    } finally {
      await acting.end();
    }
  });

  // Two phones of the describing side press "Başla" at once: one turn, one describer.
  it('starts a turn once when two phones press at once', async () => {
    const [owner, guest, ownerMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
    await play(guest, owner, roomId, 'tabu');
    const both = await Promise.all([
      call(owner, 'tabu', roomId, { action: 'begin-turn' }),
      call(ownerMember, 'tabu', roomId, { action: 'begin-turn' }),
    ]);
    expect(both).toEqual([OK, OK]);
    const started = await sql`
      select session_id from public.game_events where room_id = ${roomId} and type = 'turn_started'
    `;
    expect(started).toHaveLength(1);
    expect([owner.sessionId, ownerMember.sessionId]).toContain(started[0]?.session_id);
    expect((await state(roomId)).describer).toBe(started[0]?.session_id);
  });

  // Two phones accept the same proposal at once: one game.
  it('starts one game when two phones accept at once', async () => {
    const [owner, guest, guestMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await propose(owner, roomId, 'harf');
    const both = await Promise.all([
      rooms(guest, { action: 'answer-game', roomId, accept: true }),
      rooms(guestMember, { action: 'answer-game', roomId, accept: true }),
    ]);
    expect(both.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(both.find((r) => r.status === 409)?.body).toEqual(errorBody('no_proposal'));
    expect(await state(roomId)).toMatchObject({ concept: 'harf', gameNo: 1 });
  });
});
