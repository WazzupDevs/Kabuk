// Faz 4 step 4.6.7 (docs/SPEC_V4.md §4.F "Adım 4.6.7: Signum"). The decisions are pure/signum.ts's
// in the Edge Function; these tests hold the server to them over real HTTP and a real database:
// what each phone gets (rule 3), the seat read again at every write, the version and the clock under
// the lock, races and repeats, the team channel (rule 9), leaving (A-5) and the end. The game stays
// "Yakında" (games.json → available: false) and no word is seeded: the pool here is the test's own
// (source_key 'test-…'), added and removed by this file.
import { randomUUID } from 'node:crypto';

import type { RealtimeChannel } from '@supabase/supabase-js';
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prepareTerms } from '../functions/_shared/pure/profanity.ts';
import {
  cleanPregame,
  decideAction,
  leaveGame,
  publicState,
  seatsAtStart,
  SIGNUM,
  type SignumPicks,
  type SignumPregame,
  startGame,
  type SignumKind,
  type SignumSecret,
  type SignumState,
  type SignumTeam,
} from '../functions/_shared/pure/signum.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { type Client, dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import {
  backdate,
  leave,
  type Person,
  person,
  roomRow,
  rooms,
  TABLE_PHONES,
  tableWith,
} from './people.ts';

let venue: Record<string, string> = {};

// Words never too alike for one board (each its own first four letters), as the pure tests use.
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const WORDS = Array.from({ length: 220 }, (_, i) => {
  const a = LETTERS[i % 26] ?? 'a';
  const b = LETTERS[Math.floor(i / 26)] ?? 'a';
  return `${a}${b}${a}${b}q`;
});

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
  await sql`delete from public.cards where deck = 'signum' and source_key like 'test-%'`;
  await sql`
    insert into public.cards (deck, source_key, word)
    select 'signum', 'test-' || w, w from unnest(${WORDS}::text[]) w
  `;
});

// The game is "Yakında" everywhere; only this file opens it, for its own tests.
beforeEach(async () => {
  await sql`update public.games set is_available = true where id = 'signum'`;
});

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await sql`update public.games set is_available = false where id = 'signum'`;
  await sql`delete from public.cards where deck = 'signum' and source_key like 'test-%'`;
  await deleteFixtureVenues(sql);
  await sql.end();
});

const SLOW = 120_000;
const QUIET_MS = 2500;
const quiet = () => new Promise((resolve) => setTimeout(resolve, QUIET_MS));
const signum = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'signum', body);

type Game = {
  roomId: string;
  owner: Person;
  people: Person[];
  team: Record<SignumTeam, Person[]>;
  captain: Record<SignumTeam, Person>;
  watchers: Person[];
};

async function state(roomId: string): Promise<SignumState & Record<string, unknown>> {
  return (await roomRow(roomId)).game_state as SignumState & Record<string, unknown>;
}

async function secret(roomId: string): Promise<SignumSecret> {
  const [row] = await sql`
    select secret from public.game_secrets where room_id = ${roomId} order by game_no desc limit 1
  `;
  return row?.secret as SignumSecret;
}

// A value as a jsonb parameter.
const asJson = (value: unknown) => sql.json(value as postgres.JSONValue);

const byTeam = (picks: ('a' | 'b' | 'obs')[], people: Person[], team: 'a' | 'b' | 'obs') =>
  people.filter((_, n) => picks[n] === team);

// The table, the pre-game page and the start. `picks`: each person's pick in order; the first is the
// owner. Each team's first person volunteers and the owner approves them.
async function game(picks: ('a' | 'b' | 'obs')[], opts: { start?: boolean } = {}): Promise<Game> {
  const people = await Promise.all(picks.map((_, n) => person(venue, n)));
  const [owner, ...others] = people as [Person, ...Person[]];
  const roomId = await tableWith(owner, others);
  expect(await rooms(owner, { action: 'open-game', roomId, concept: 'signum' })).toEqual({
    status: 200,
    body: { ok: true },
  });
  for (const [n, pick] of picks.entries()) {
    expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick })).toEqual({
      status: 200,
      body: { ok: true },
    });
  }
  const team = { a: byTeam(picks, people, 'a'), b: byTeam(picks, people, 'b') };
  const captain = { a: team.a[0] as Person, b: team.b[0] as Person };
  for (const t of ['a', 'b'] as const) {
    expect(await signum(captain[t], { action: 'volunteer', roomId, on: true })).toEqual({
      status: 200,
      body: { applied: true },
    });
    expect(
      await signum(owner, {
        action: 'approve-captain',
        roomId,
        team: t,
        sessionId: captain[t].sessionId,
      }),
    ).toEqual({ status: 200, body: { applied: true } });
  }
  if (opts.start !== false) {
    expect(await signum(owner, { action: 'start', roomId })).toEqual({
      status: 200,
      body: { applied: true },
    });
  }
  return {
    roomId,
    owner,
    people,
    team,
    captain,
    watchers: byTeam(picks, people, 'obs') as Person[],
  };
}

const SIX: ('a' | 'b' | 'obs')[] = ['a', 'a', 'a', 'b', 'b', 'b', 'obs'];

async function readyAll(g: Game): Promise<void> {
  const st = await state(g.roomId);
  for (const p of [...g.team.a, ...g.team.b]) {
    const res = await signum(p, { action: 'ready', roomId: g.roomId, step: st.step });
    expect(res.status).toBe(200);
  }
  expect((await state(g.roomId)).phase).toBe('clue');
}

// Everyone ready, the starter's captain gives "Bayram" for 2: the starter's guess.
async function inGuess(picks = SIX) {
  const g = await game(picks);
  await readyAll(g);
  const st = await state(g.roomId);
  const turn = st.turn;
  const res = await signum(g.captain[turn], {
    action: 'clue',
    roomId: g.roomId,
    step: st.step,
    word: 'Bayram',
    n: 2,
    actionId: randomUUID(),
  });
  expect(res.body).toMatchObject({ applied: true });
  const guessers = g.team[turn].filter((p) => p !== g.captain[turn]);
  const other: SignumTeam = turn === 'a' ? 'b' : 'a';
  return { ...g, turn, other, guessers };
}

const tileOf = (sec: SignumSecret, kind: SignumKind, skip: number[] = []) =>
  sec.key.findIndex((k, i) => k === kind && !skip.includes(i));

async function point(p: Person, roomId: string, tile: number | null, seq: number) {
  const st = await state(roomId);
  return signum(p, { action: 'point', roomId, step: st.step, tile, seq });
}

// The secret's fields and values that must never leave the server, except where a role may see
// them: a captain's view has the key and the own team's channel, a guesser's view the own channel,
// and the open state has the key only once the game is over.
function assertFiltered(
  body: unknown,
  sec: SignumSecret,
  who: { role: 'captain' | 'guesser' | 'observer'; team: SignumTeam | null },
) {
  const text = JSON.stringify(body);
  for (const field of ['"secret"', '"actions"', '"rev"', '"channels"', '"sent"']) {
    expect(text, field).not.toContain(field);
  }
  for (const t of ['a', 'b'] as const) {
    if (who.team !== t) expect(text, `channel ${t}`).not.toContain(sec.channels[t]);
  }
  const keyText = JSON.stringify(sec.key);
  const b = body as {
    room?: SignumState;
    view?: { key?: unknown };
  };
  const over = b.room?.phase === 'over';
  if (who.role !== 'captain' && !over) expect(text, 'key').not.toContain(keyText);
  if (b.view && who.role !== 'captain') expect('key' in b.view).toBe(false);
  if (b.room) {
    if (!over) expect(b.room.key).toBeNull();
    b.room.board.forEach((tile, i) => {
      expect(Object.keys(tile).sort()).toEqual(['open', 'word']);
      if (tile.open !== null) expect(tile.open).toBe(sec.key[i]);
    });
  }
}

// --- Realtime -----------------------------------------------------------------------------------

type Joined = { status: string; channel: RealtimeChannel; events: string[] };

function join(client: Client, topic: string): Promise<Joined> {
  const channel = client.channel(topic, { config: { private: true } });
  const events: string[] = [];
  channel.on('broadcast', { event: '*' }, (msg: { event: string }) => events.push(msg.event));
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ status: 'TIMED_OUT', channel, events }), 8000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer);
        if (status !== 'SUBSCRIBED') void client.removeChannel(channel);
        resolve({ status, channel, events });
      }
    });
  });
}

// --- The tests ----------------------------------------------------------------------------------

describe('signum: the start (§4.F)', { timeout: SLOW }, () => {
  it('needs both captains approved; an accepted offer alone makes no captain', async () => {
    const g = await game(['a', 'a', 'b', 'b'], { start: false });
    // Pembe's captain steps back; the owner offers Pembe's other person, who accepts.
    expect(
      await signum(g.captain.b, { action: 'volunteer', roomId: g.roomId, on: false }),
    ).toMatchObject({ status: 200 });
    const other = g.team.b[1] as Person;
    expect(
      await signum(g.owner, {
        action: 'offer-captain',
        roomId: g.roomId,
        sessionId: other.sessionId,
      }),
    ).toMatchObject({ status: 200 });
    expect(
      await signum(other, { action: 'answer-offer', roomId: g.roomId, accept: true }),
    ).toMatchObject({ status: 200 });
    const page = (await state(g.roomId)).pregame as {
      signum: { captains: object; candidates: object };
    };
    expect(page.signum.captains).toEqual({ a: g.captain.a.sessionId, b: null });
    expect(page.signum.candidates).toMatchObject({ b: [other.sessionId] });
    expect(await signum(g.owner, { action: 'start', roomId: g.roomId })).toEqual({
      status: 409,
      body: errorBody('captain_missing'),
    });
    // Only the owner approves.
    expect(
      await signum(other, {
        action: 'approve-captain',
        roomId: g.roomId,
        team: 'b',
        sessionId: other.sessionId,
      }),
    ).toEqual({ status: 403, body: errorBody('not_owner') });
    expect(
      await signum(g.owner, {
        action: 'approve-captain',
        roomId: g.roomId,
        team: 'b',
        sessionId: other.sessionId,
      }),
    ).toMatchObject({ status: 200 });
    expect(await signum(g.owner, { action: 'start', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
  });

  it('freezes the players with the dealt roles, and writes the state and secret the engine dealt', async () => {
    const g = await game(SIX);
    const st = await state(g.roomId);
    const sec = await secret(g.roomId);
    const roles = await sql`
      select session_id::text as sid, team, role from public.game_players
      where room_id = ${g.roomId} and game_no = ${st.gameNo} order by session_id
    `;
    expect(roles.map((r) => [r.sid, r.team, r.role])).toEqual(
      [...st.seats].sort((x, y) => x.sid.localeCompare(y.sid)).map((s) => [s.sid, s.team, s.role]),
    );
    expect(
      roles
        .filter((r) => r.role === 'captain')
        .map((r) => r.sid)
        .sort(),
    ).toEqual([g.captain.a.sessionId, g.captain.b.sessionId].sort());
    expect(st.seats.some((s) => s.sid === g.watchers[0]?.sessionId)).toBe(false);
    expect(st.phase).toBe('role');
    expect(st.board).toHaveLength(SIGNUM.tiles);
    expect(st.board.every((t) => t.open === null && WORDS.includes(t.word))).toBe(true);
    const count = (k: SignumKind) => sec.key.filter((x) => x === k).length;
    expect(count(st.starter)).toBe(9);
    expect(count(st.starter === 'a' ? 'b' : 'a')).toBe(8);
    expect([count('n'), count('x')]).toEqual([7, 1]);
    expect(sec.channels.a).not.toBe(sec.channels.b);
    expect(sec.rev).toBe(0);
    // The open state is the engine's open state, field by field.
    expect(Object.keys(st).sort()).toEqual(Object.keys(publicState(st)).sort());
    assertFiltered({ room: st }, sec, { role: 'observer', team: null });
  });

  it('stays closed while the game is not available or the pool cannot give 25 words', async () => {
    const g = await game(['a', 'a', 'b', 'b'], { start: false });
    await sql`update public.games set is_available = false where id = 'signum'`;
    expect(await signum(g.owner, { action: 'start', roomId: g.roomId })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    await sql`update public.games set is_available = true where id = 'signum'`;
    // Fewer than minPool active words.
    await sql`
      update public.cards set is_active = false
      where deck = 'signum' and source_key like 'test-%'
        and source_key not in (select 'test-' || w from unnest(${WORDS.slice(0, 150)}::text[]) w)
    `;
    try {
      expect(await signum(g.owner, { action: 'start', roomId: g.roomId })).toEqual({
        status: 409,
        body: errorBody('content_unavailable'),
      });
    } finally {
      await sql`update public.cards set is_active = true where deck = 'signum' and source_key like 'test-%'`;
    }
    // No test word is in the seeds: the seeded pool is empty.
    const [seeded] = await sql`
      select count(*)::int as n from public.cards where deck = 'signum' and source_key not like 'test-%'
    `;
    expect(seeded?.n).toBe(0);
  });
});

describe('signum: what each phone gets (rule 3)', { timeout: SLOW }, () => {
  it('answers every action with the caller’s own view only, on reconnecting, leaving and repeating too', async () => {
    const g = await inGuess();
    const sec = await secret(g.roomId);
    const roleOf = (p: Person) =>
      p === g.captain.a || p === g.captain.b
        ? ('captain' as const)
        : g.watchers.includes(p)
          ? ('observer' as const)
          : ('guesser' as const);
    const teamOf = (p: Person): SignumTeam | null =>
      g.team.a.includes(p) ? 'a' : g.team.b.includes(p) ? 'b' : null;

    // A view from every phone, twice (as after reconnecting): each its own.
    for (const p of g.people) {
      for (let n = 0; n < 2; n++) {
        const res = await signum(p, { action: 'view', roomId: g.roomId });
        expect(res.status).toBe(200);
        assertFiltered(res.body, sec, { role: roleOf(p), team: teamOf(p) });
        const view = (res.body as { view: Record<string, unknown> }).view;
        if (roleOf(p) === 'captain') {
          expect(view).toMatchObject({
            role: 'captain',
            key: sec.key,
            channel: sec.channels[teamOf(p) as SignumTeam],
          });
        } else if (roleOf(p) === 'observer') {
          expect(view).toEqual({ role: 'observer' });
        } else {
          expect(Object.keys(view).sort()).toEqual(['channel', 'marks', 'mySeq', 'role', 'team']);
        }
      }
    }

    // Marks: the team sees them, the other team and the watcher do not.
    const [first, second] = g.guessers as [Person, Person];
    const marked = await point(first, g.roomId, tileOf(sec, 'n'), 1);
    assertFiltered(marked.body, sec, { role: 'guesser', team: g.turn });
    const rival = g.team[g.other][1] as Person;
    for (const p of [rival, g.captain[g.other], g.watchers[0] as Person]) {
      const res = await signum(p, { action: 'view', roomId: g.roomId });
      expect(JSON.stringify(res.body)).not.toContain(first.sessionId + '":');
      assertFiltered(res.body, sec, { role: roleOf(p), team: teamOf(p) });
    }
    const mate = await signum(second, { action: 'view', roomId: g.roomId });
    expect((mate.body as { view: { marks: object } }).view.marks).toEqual({
      [first.sessionId]: tileOf(sec, 'n'),
    });

    // A repeat of a clue-free action and a refused one: still filtered.
    const again = await point(first, g.roomId, tileOf(sec, 'n'), 1);
    expect(again.body).toMatchObject({ applied: true, replayed: true });
    assertFiltered(again.body, sec, { role: 'guesser', team: g.turn });
    const refused = await signum(rival, {
      action: 'reveal',
      roomId: g.roomId,
      step: (await state(g.roomId)).step,
      tile: 0,
      actionId: randomUUID(),
    });
    expect(refused).toEqual({ status: 409, body: errorBody('not_your_turn') });

    // The second guesser leaves the game: their view is a watcher's, without any channel.
    expect(await rooms(second, { action: 'leave-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    const after = await secret(g.roomId);
    const gone = await signum(second, { action: 'view', roomId: g.roomId });
    expect((gone.body as { view: unknown }).view).toEqual({ role: 'observer' });
    assertFiltered(gone.body, after, { role: 'observer', team: null });
    expect(JSON.stringify(gone.body)).not.toContain(sec.channels[g.turn]);
  });

  it('puts no closed tile’s kind or channel id in the open state, game events or a watcher’s Realtime', async () => {
    const g = await inGuess();
    const watcher = g.watchers[0] as Person;
    const roomTopic = await join(watcher.client, `room:${g.roomId}`);
    const gameTopic = await join(watcher.client, `game:${g.roomId}`);
    expect([roomTopic.status, gameTopic.status]).toEqual(['SUBSCRIBED', 'SUBSCRIBED']);
    const changes: unknown[] = [];
    const rowChannel = watcher.client
      .channel(`rows:${g.roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${g.roomId}` },
        (msg) => changes.push(msg),
      )
      .subscribe();

    const sec = await secret(g.roomId);
    const [first] = g.guessers as [Person];
    const own = tileOf(sec, g.turn);
    await point(first, g.roomId, own, 1);
    const st = await state(g.roomId);
    expect(
      (
        await signum(first, {
          action: 'reveal',
          roomId: g.roomId,
          step: st.step,
          tile: own,
          actionId: randomUUID(),
        })
      ).body,
    ).toMatchObject({ applied: true });
    await quiet();
    const events =
      await sql`select type, payload from public.game_events where room_id = ${g.roomId}`;
    const seen = JSON.stringify([changes, roomTopic.events, gameTopic.events, events]);
    for (const t of ['a', 'b'] as const) expect(seen).not.toContain(sec.channels[t]);
    expect(seen).not.toContain(JSON.stringify(sec.key));
    expect(seen).not.toContain('"marks"');
    const now = await state(g.roomId);
    now.board.forEach((tile, i) => {
      if (i !== own) expect(tile.open).toBeNull();
    });
    await watcher.client.removeChannel(rowChannel);
  });
});

describe('signum: the seat at every call (§4.F)', { timeout: SLOW }, () => {
  it('reads the seat from the database, and refuses one that changed between the read and the write', async () => {
    const g = await inGuess();
    const [first, second] = g.guessers as [Person, Person];
    const st = await state(g.roomId);
    const sec = await secret(g.roomId);
    // The read the Edge Function would have made for `second`, then `second` leaves the game.
    const [{ read }] = (await sql`
      select public.signum_read(${second.userId}::uuid, ${g.roomId}::uuid) as read
    `) as unknown as [
      { read: { state: SignumState; rev: number; seat: { team: string; role: string } } },
    ];
    expect(read.seat).toEqual({ team: g.turn, role: 'guesser' });
    expect(await rooms(second, { action: 'leave-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    // Even with the state and version as they are now, the seat the decision was made for is gone.
    const now = await state(g.roomId);
    const nowSec = await secret(g.roomId);
    const [{ ok }] = (await sql`
      select (public.signum_commit(
        ${second.userId}::uuid, ${g.roomId}::uuid, ${asJson(now)}::jsonb, ${nowSec.rev ?? 0},
        ${g.turn}, 'guesser', true, ${asJson(now)}::jsonb, ${asJson(nowSec)}::jsonb, ''
      ) ->> 'ok')::boolean as ok
    `) as unknown as [{ ok: boolean }];
    expect(ok).toBe(false);
    // Over HTTP the one who left is a watcher: no game action, a watcher's view.
    expect(await point(second, g.roomId, 0, 1)).toEqual({
      status: 403,
      body: errorBody('not_player'),
    });
    expect(st.step).toBe(now.step);
    expect(sec.channels[g.turn]).not.toBe(nowSec.channels[g.turn]);
    // The one still playing plays on.
    expect((await point(first, g.roomId, 0, 1)).body).toMatchObject({ applied: true });
  });
});

describe('signum: versions and the clock (signum_commit)', { timeout: SLOW }, () => {
  it('writes nothing when the state, the version, the seat or the game number differ from the read', async () => {
    const g = await inGuess();
    const [first] = g.guessers as [Person];
    const st = await state(g.roomId);
    const sec = await secret(g.roomId);
    const rev = sec.rev ?? 0;
    const next = { ...st, guessesLeft: (st.guessesLeft ?? 0) - 1, step: st.step + 1 };
    const commit = async (
      readState: unknown,
      readRev: number,
      team: string,
      role: string,
      newState: unknown = next,
    ) => {
      const [row] = (await sql`
        select (public.signum_commit(
          ${first.userId}::uuid, ${g.roomId}::uuid, ${asJson(readState as unknown)}::jsonb, ${readRev},
          ${team}, ${role}, true, ${asJson(newState as unknown)}::jsonb, ${asJson(sec)}::jsonb, ''
        ) ->> 'ok')::boolean as ok
      `) as unknown as [{ ok: boolean }];
      return row.ok;
    };
    const before = await roomRow(g.roomId);
    // The read's state differs (any field, compared as jsonb).
    expect(await commit({ ...st, step: st.step + 5 }, rev, g.turn, 'guesser')).toBe(false);
    // The same state with its keys in another order is the same jsonb.
    const reordered = Object.fromEntries(Object.entries(st).reverse());
    // The version differs.
    expect(await commit(st, rev + 1, g.turn, 'guesser')).toBe(false);
    // The seat differs (another team, another role, a watcher's '').
    expect(await commit(st, rev, g.other, 'guesser')).toBe(false);
    expect(await commit(st, rev, g.turn, 'captain')).toBe(false);
    expect(await commit(st, rev, '', '')).toBe(false);
    expect((await roomRow(g.roomId)).game_state).toEqual(before.game_state);
    expect((await secret(g.roomId)).rev).toBe(rev);
    // Another game number is refused outright.
    await expect(
      commit(st, rev, g.turn, 'guesser', { ...next, gameNo: st.gameNo + 1 }),
    ).rejects.toThrow(/bad_request/);
    // All as read: written once, and the version moves on by one.
    expect(await commit(reordered, rev, g.turn, 'guesser')).toBe(true);
    expect((await secret(g.roomId)).rev).toBe(rev + 1);
    expect((await state(g.roomId)).step).toBe(st.step + 1);
    // The same read again: the version moved, nothing more is written.
    expect(await commit(st, rev, g.turn, 'guesser')).toBe(false);
  });

  it('refuses a state with a closed tile’s kind or the key before the end', async () => {
    const g = await inGuess();
    const [first] = g.guessers as [Person];
    const st = await state(g.roomId);
    const sec = await secret(g.roomId);
    const leaky = [
      {
        ...st,
        board: st.board.map((t, i) =>
          i === 0 ? { ...t, open: sec.key[0] === 'n' ? 'x' : 'n' } : t,
        ),
      },
      { ...st, key: sec.key },
      { ...st, channels: sec.channels },
    ];
    for (const bad of leaky) {
      await expect(
        sql`select public.signum_commit(
          ${first.userId}::uuid, ${g.roomId}::uuid, ${asJson(st)}::jsonb, ${sec.rev ?? 0},
          ${g.turn}, 'guesser', true, ${asJson(bad)}::jsonb, ${asJson(sec)}::jsonb, ''
        )`,
      ).rejects.toThrow(/bad_request/);
    }
  });

  it('takes the clock after the locks: an action whose phase ran out while it waited is not written', async () => {
    const g = await inGuess();
    const [first] = g.guessers as [Person];
    const sec = await secret(g.roomId);
    const own = tileOf(sec, g.turn);
    await point(first, g.roomId, own, 1);
    // The turn's clock ends 1.5 s from now.
    await sql`
      update public.rooms
      set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() + interval '1.5 seconds'))
      where id = ${g.roomId}
    `;
    const st = await state(g.roomId);
    const holder = postgres(dbUrl, { max: 1 });
    let pending: Promise<{ status: number; body: unknown }> | null = null;
    try {
      await holder.begin(async (tx) => {
        await tx`select 1 from public.rooms where id = ${g.roomId} for update`;
        pending = signum(first, {
          action: 'reveal',
          roomId: g.roomId,
          step: st.step,
          tile: own,
          actionId: randomUUID(),
        });
        await waitUntilBlocked('signum_commit');
        // The clock runs out while the write waits for the table.
        await new Promise((resolve) => setTimeout(resolve, 2000));
      });
    } finally {
      await holder.end();
    }
    const res = await (pending as unknown as Promise<{ status: number; body: unknown }>);
    expect(res).toMatchObject({ status: 200, body: { applied: false, reason: 'phase_expired' } });
    const after = await state(g.roomId);
    expect(after.board[own]?.open).toBeNull();
    expect(after.phase).toBe('clue');
    expect(after.turn).toBe(g.other);
  });

  it('applies no action in a phase whose time ran out, and moves the phase on in the same write', async () => {
    const g = await inGuess();
    const [first] = g.guessers as [Person];
    const sec = await secret(g.roomId);
    const own = tileOf(sec, g.turn);
    await point(first, g.roomId, own, 1);
    await sql`
      update public.rooms
      set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 second'))
      where id = ${g.roomId}
    `;
    const st = await state(g.roomId);
    const events = async () =>
      (await sql`select count(*)::int as n from public.game_events where room_id = ${g.roomId}`)[0]
        ?.n;
    const eventsBefore = await events();
    for (const body of [
      { action: 'reveal', step: st.step, tile: own, actionId: randomUUID() },
      { action: 'end-turn', step: st.step, actionId: randomUUID() },
    ]) {
      const fresh = await state(g.roomId);
      const res = await signum(first, { ...body, roomId: g.roomId, step: fresh.step });
      if (fresh.phase === 'guess') {
        expect(res).toMatchObject({
          status: 200,
          body: { applied: false, reason: 'phase_expired' },
        });
      } else {
        // The first already moved the phase on: no guess to end now.
        expect(res).toMatchObject({ status: 409, body: errorBody('not_your_turn') });
      }
    }
    const after = await state(g.roomId);
    expect(after.board[own]?.open).toBeNull();
    expect([after.phase, after.turn, after.step]).toEqual(['clue', g.other, st.step + 1]);
    expect(await events()).toBe(eventsBefore);
    // An advance after it, for the old step, changes nothing.
    const advance = await signum(first, { action: 'advance', roomId: g.roomId, step: st.step });
    expect(advance.body).toMatchObject({ applied: false, reason: 'unchanged' });
  });
});

describe('signum: races and repeats (IDEMPOTENT_CALLS)', { timeout: SLOW }, () => {
  it('of two valid reveals at once on different tiles, exactly one applies', async () => {
    const g = await inGuess();
    const [first, second] = g.guessers as [Person, Person];
    const sec = await secret(g.roomId);
    const t1 = tileOf(sec, g.turn);
    const t2 = tileOf(sec, g.turn, [t1]);
    await point(first, g.roomId, t1, 1);
    await point(second, g.roomId, t2, 1);
    const st = await state(g.roomId);
    const [r1, r2] = await Promise.all([
      signum(first, {
        action: 'reveal',
        roomId: g.roomId,
        step: st.step,
        tile: t1,
        actionId: randomUUID(),
      }),
      signum(second, {
        action: 'reveal',
        roomId: g.roomId,
        step: st.step,
        tile: t2,
        actionId: randomUUID(),
      }),
    ]);
    const bodies = [r1.body, r2.body] as { applied: boolean; reason?: string }[];
    expect([r1.status, r2.status]).toEqual([200, 200]);
    expect(bodies.filter((b) => b.applied)).toHaveLength(1);
    expect(bodies.find((b) => !b.applied)).toMatchObject({ reason: 'stale_step' });
    const after = await state(g.roomId);
    expect([after.board[t1]?.open, after.board[t2]?.open].filter((k) => k !== null)).toHaveLength(
      1,
    );
    expect(after.step).toBe(st.step + 1);
  });

  it('answers the same clue, reveal or end-turn again with the first result and writes nothing', async () => {
    const g = await game(SIX);
    await readyAll(g);
    const st0 = await state(g.roomId);
    const captain = g.captain[st0.turn];
    const clue = {
      action: 'clue',
      roomId: g.roomId,
      step: st0.step,
      word: 'Kış',
      n: 1,
      actionId: randomUUID(),
    };
    const snapshot = async () => ({
      room: (await roomRow(g.roomId)).game_state,
      secret: await secret(g.roomId),
      events: (
        await sql`select count(*)::int as n from public.game_events where room_id = ${g.roomId}`
      )[0]?.n,
    });
    const repeat = async (p: Person, body: Record<string, unknown>) => {
      const first = await signum(p, body);
      expect(first.body).toMatchObject({ applied: true });
      const before = await snapshot();
      const second = await signum(p, body);
      expect(second.status).toBe(200);
      expect(second.body).toMatchObject({ applied: true, replayed: true });
      expect((second.body as { result: unknown }).result).toEqual(
        (first.body as { result: unknown }).result,
      );
      expect(await snapshot()).toEqual(before);
      return first;
    };
    await repeat(captain, clue);
    // The same actionId with another number: a conflict, and nothing written.
    const before = await snapshot();
    expect(await signum(captain, { ...clue, n: 2 })).toEqual({
      status: 409,
      body: errorBody('action_id_conflict'),
    });
    expect(await snapshot()).toEqual(before);

    const guesser = g.team[st0.turn][1] as Person;
    const sec = await secret(g.roomId);
    const own = tileOf(sec, st0.turn);
    await point(guesser, g.roomId, own, 1);
    const st1 = await state(g.roomId);
    const reveal = {
      action: 'reveal',
      roomId: g.roomId,
      step: st1.step,
      tile: own,
      actionId: randomUUID(),
    };
    await repeat(guesser, reveal);
    // Someone else's actionId is their own request: no replay of the first.
    const mate = g.team[st0.turn][2] as Person;
    const stolen = await signum(mate, reveal);
    expect(stolen.body).not.toMatchObject({ replayed: true });

    const st2 = await state(g.roomId);
    await repeat(guesser, {
      action: 'end-turn',
      roomId: g.roomId,
      step: st2.step,
      actionId: randomUUID(),
    });
    // After the turn ended, the reveal's repeat still answers its first result.
    const late = await signum(guesser, reveal);
    expect(late.body).toMatchObject({ applied: true, replayed: true, result: { tile: own } });
  });

  it('keeps a mark from going back: the same seq again changes nothing, an older one is outdated', async () => {
    const g = await inGuess();
    const [first] = g.guessers as [Person];
    const sec = await secret(g.roomId);
    const t9 = tileOf(sec, 'n');
    const t8 = tileOf(sec, 'n', [t9]);
    const roomBefore = await roomRow(g.roomId);
    expect((await point(first, g.roomId, t9, 10)).body).toMatchObject({ applied: true });
    // A mark changes the secret only: the table's row (and so Realtime) is not touched.
    const roomAfter = await roomRow(g.roomId);
    expect(roomAfter.game_state).toEqual(roomBefore.game_state);
    expect(roomAfter.last_activity_at).toEqual(roomBefore.last_activity_at);
    const rev = (await secret(g.roomId)).rev;
    expect((await point(first, g.roomId, t9, 10)).body).toMatchObject({
      applied: true,
      replayed: true,
    });
    expect((await secret(g.roomId)).rev).toBe(rev);
    expect(await point(first, g.roomId, t8, 10)).toEqual({
      status: 409,
      body: errorBody('seq_conflict'),
    });
    expect((await point(first, g.roomId, t8, 9)).body).toMatchObject({
      applied: false,
      reason: 'outdated',
    });
    expect((await secret(g.roomId)).marks[g.turn][first.sessionId]).toEqual({
      tile: t9,
      seq: 10,
      sent: t9,
    });
  });

  it('changes nothing with an early advance, a ready, an advance or a view sent twice', async () => {
    const g = await game(['a', 'a', 'b', 'b']);
    const st = await state(g.roomId);
    const p = g.team.a[1] as Person;
    const early = await signum(p, { action: 'advance', roomId: g.roomId, step: st.step });
    expect(early.body).toMatchObject({ applied: false, reason: 'unchanged' });
    expect(await state(g.roomId)).toEqual(st);
    const ready = { action: 'ready', roomId: g.roomId, step: st.step };
    expect((await signum(p, ready)).body).toMatchObject({ applied: true });
    const afterReady = await state(g.roomId);
    expect((await signum(p, ready)).body).toMatchObject({ applied: false, reason: 'unchanged' });
    expect(await state(g.roomId)).toEqual(afterReady);
    const v1 = await signum(p, { action: 'view', roomId: g.roomId });
    const v2 = await signum(p, { action: 'view', roomId: g.roomId });
    expect(v2).toEqual(v1);
    await sql`
      update public.rooms
      set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 second'))
      where id = ${g.roomId}
    `;
    const late = await state(g.roomId);
    const advance = { action: 'advance', roomId: g.roomId, step: late.step };
    expect((await signum(p, advance)).body).toMatchObject({ applied: true });
    const moved = await state(g.roomId);
    expect(moved.phase).toBe('clue');
    expect((await signum(p, advance)).body).toMatchObject({ applied: false, reason: 'unchanged' });
    expect(await state(g.roomId)).toEqual(moved);
  });
});

describe('signum: the team channel (rule 9)', { timeout: SLOW }, () => {
  it('lets only the team’s players subscribe, and nobody send', async () => {
    const g = await inGuess();
    const sec = await secret(g.roomId);
    const topic = `game_team:${sec.channels[g.turn]}`;
    for (const p of g.team[g.turn]) expect((await join(p.client, topic)).status).toBe('SUBSCRIBED');
    // Knowing the id is not enough: the other team, a watcher.
    for (const p of [...g.team[g.other], g.watchers[0] as Person]) {
      expect((await join(p.client, topic)).status).toBe('CHANNEL_ERROR');
    }
    // A player of the team cannot send on it either.
    const [first] = g.guessers as [Person];
    const listener = await join((g.team[g.turn][2] as Person).client, topic);
    const sender = await join(first.client, topic);
    await sender.channel.send({ type: 'broadcast', event: 'fake', payload: {} });
    await quiet();
    expect(listener.events).toEqual([]);
    // The server's own broadcast arrives.
    await point(first, g.roomId, 0, 1);
    await expect.poll(() => listener.events, { timeout: 8000 }).toEqual(['points']);
  });

  it('sends nothing more to a leaver’s open subscription, and refuses the old and the new topic to them', async () => {
    const g = await inGuess();
    const [stays, leaves] = g.guessers as [Person, Person];
    const old = (await secret(g.roomId)).channels[g.turn];
    const leaverOld = await join(leaves.client, `game_team:${old}`);
    const staysOld = await join(stays.client, `game_team:${old}`);
    expect([leaverOld.status, staysOld.status]).toEqual(['SUBSCRIBED', 'SUBSCRIBED']);

    expect(await rooms(leaves, { action: 'leave-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    const renewed = (await secret(g.roomId)).channels[g.turn];
    expect(renewed).not.toBe(old);
    // The other team's channel did not change.
    // The one who stays gets the new id from their view and hears the next mark there.
    const view = await signum(stays, { action: 'view', roomId: g.roomId });
    expect((view.body as { view: { channel: string } }).view.channel).toBe(renewed);
    const staysNew = await join(stays.client, `game_team:${renewed}`);
    expect(staysNew.status).toBe('SUBSCRIBED');
    await point(stays, g.roomId, 0, 1);
    await expect.poll(() => staysNew.events, { timeout: 8000 }).toEqual(['points']);
    await quiet();
    // Nothing reaches the old topic: neither the leaver's open subscription nor the old one of
    // the player who stays (whether or not Realtime itself closed the leaver's subscription).
    expect(leaverOld.events).toEqual([]);
    expect(staysOld.events).toEqual([]);
    // The leaver may join neither topic again (a new join: the open one closed first, as the
    // client keeps one channel a topic).
    await leaves.client.removeChannel(leaverOld.channel);
    expect((await join(leaves.client, `game_team:${old}`)).status).toBe('CHANNEL_ERROR');
    expect((await join(leaves.client, `game_team:${renewed}`)).status).toBe('CHANNEL_ERROR');
  });

  it('closes a leaver of the table out the same way', async () => {
    const g = await inGuess(['a', 'a', 'a', 'b', 'b', 'b']);
    const [stays, leaves] = g.guessers as [Person, Person];
    const old = (await secret(g.roomId)).channels[g.turn];
    const leaverOld = await join(leaves.client, `game_team:${old}`);
    expect(leaverOld.status).toBe('SUBSCRIBED');
    expect(await leave(leaves, g.roomId)).toMatchObject({ status: 200 });
    const renewed = (await secret(g.roomId)).channels[g.turn];
    expect(renewed).not.toBe(old);
    await point(stays, g.roomId, 0, 1);
    await quiet();
    expect(leaverOld.events).toEqual([]);
    expect((await join(leaves.client, `game_team:${renewed}`)).status).toBe('CHANNEL_ERROR');
  });
});

describe('signum: leaving (A-5), as the pure engine does', { timeout: SLOW }, () => {
  it('a guesser leaving changes the state and secret as leaveGame does', async () => {
    const g = await inGuess();
    const [, leaves] = g.guessers as [Person, Person];
    await point(leaves, g.roomId, 3, 1);
    const st = await state(g.roomId);
    const sec = await secret(g.roomId);
    expect(await rooms(leaves, { action: 'leave-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    const after = await secret(g.roomId);
    const expected = leaveGame(
      st,
      sec,
      leaves.sessionId,
      'game',
      new Date(),
      after.channels[g.turn],
    );
    expect(await state(g.roomId)).toEqual(expected.state);
    expect({ ...after, rev: undefined }).toEqual({ ...expected.secret, rev: undefined });
    expect(after.rev).toBe((sec.rev ?? 0) + 1);
    expect(expected.event).toBeNull();
  });

  it('a captain leaving ends the game with no result and records it, as leaveGame does', async () => {
    const g = await inGuess();
    const st = await state(g.roomId);
    const sec = await secret(g.roomId);
    // Pembe's captain (the owner captains Mor and ends a game with "Oyunu bitir" instead).
    const leaver = g.captain.b;
    expect(await rooms(leaver, { action: 'leave-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    const room = await roomRow(g.roomId);
    expect(room.concept).toBeNull();
    const last = (room.game_state as { lastGame: { signum: SignumState; abandoned: boolean } })
      .lastGame;
    const expected = leaveGame(st, sec, leaver.sessionId, 'game', new Date(), 'x');
    expect(last.signum).toEqual(expected.state);
    expect(last.signum).toMatchObject({
      phase: 'over',
      winner: null,
      reason: 'captain_left',
      key: sec.key,
    });
    expect(last.abandoned).toBe(true);
    const [event] = await sql`
      select session_id::text as sid, payload from public.game_events
      where room_id = ${g.roomId} and type = 'captain_left'
    `;
    expect(event).toEqual({ sid: leaver.sessionId, payload: { team: 'b', via: 'game' } });
    expect(expected.event).toEqual({ type: 'captain_left', team: 'b', via: 'game' });
    const [results] = await sql`
      select count(*)::int as n from public.game_results where room_id = ${g.roomId}
    `;
    expect(results?.n).toBe(0);
  });

  it('a team left with no guesser ends the game; the owner’s Oyunu bitir is the frame’s alone', async () => {
    const g = await game(['a', 'a', 'b', 'b', 'b']);
    const lone = g.team.a[1] as Person;
    expect(await rooms(lone, { action: 'leave-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    const room = await roomRow(g.roomId);
    expect(
      (room.game_state as { lastGame: { signum: SignumState } }).lastGame.signum,
    ).toMatchObject({
      phase: 'over',
      reason: 'team_empty',
    });
    const [ev] =
      await sql`select type from public.game_events where room_id = ${g.roomId} and type = 'team_empty'`;
    expect(ev?.type).toBe('team_empty');

    const h = await game(['a', 'a', 'b', 'b']);
    expect(await rooms(h.owner, { action: 'end-game', roomId: h.roomId })).toMatchObject({
      status: 200,
    });
    const ended = await roomRow(h.roomId);
    expect(ended.concept).toBeNull();
    const [none] = await sql`
      select count(*)::int as n from public.game_events
      where room_id = ${h.roomId} and type in ('captain_left', 'team_empty')
    `;
    expect(none?.n).toBe(0);
  });
});

describe('signum: the end (game_results, play_history)', { timeout: SLOW }, () => {
  it('writes each player’s result when a team wins, keeps the end for the result screen, and names the game in the pair history', async () => {
    const g = await inGuess();
    const [first] = g.guessers as [Person];
    const sec = await secret(g.roomId);
    const black = tileOf(sec, 'x');
    await point(first, g.roomId, black, 1);
    const st = await state(g.roomId);
    const endBody = {
      action: 'reveal',
      roomId: g.roomId,
      step: st.step,
      tile: black,
      actionId: randomUUID(),
    };
    const res = await signum(first, endBody);
    expect(res.body).toMatchObject({
      applied: true,
      result: { outcome: 'black' },
      room: { phase: 'over', winner: g.other, reason: 'black', key: sec.key },
    });
    const room = await roomRow(g.roomId);
    expect(room.concept).toBeNull();
    expect(
      (room.game_state as { lastGame: { signum: SignumState } }).lastGame.signum,
    ).toMatchObject({
      phase: 'over',
      winner: g.other,
    });
    const results = await sql`
      select gr.user_id, gr.won, gr.score, gr.concept, gr.mode
      from public.game_results gr where gr.room_id = ${g.roomId}
    `;
    const players = [...g.team.a, ...g.team.b];
    expect(results).toHaveLength(players.length);
    for (const p of players) {
      const r = results.find((x) => x.user_id === p.userId);
      expect(r).toMatchObject({
        concept: 'signum',
        mode: 'signum',
        won: g.team[g.other].includes(p),
      });
    }
    expect(results.some((r) => r.user_id === g.watchers[0]?.userId)).toBe(false);

    // The same reveal sent again after the game ended (a 5xx retry): its first answer, nothing
    // written; anything else for the ended game is no_game.
    const again = await signum(first, endBody);
    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ applied: true, replayed: true });
    expect((again.body as { result: unknown }).result).toEqual(
      (res.body as { result: unknown }).result,
    );
    expect((again.body as { view: unknown }).view).toEqual({ role: 'observer' });
    expect(await roomRow(g.roomId)).toEqual(room);
    expect(await signum(first, { ...endBody, actionId: randomUUID() })).toEqual({
      status: 409,
      body: errorBody('no_game'),
    });
    expect(await signum(first, { ...endBody, tile: (black + 1) % 25 })).toEqual({
      status: 409,
      body: errorBody('action_id_conflict'),
    });

    // The pair history after the table: the game is named Signum.
    await backdate(g.roomId, 5);
    expect(await leave(g.watchers[0] as Person, g.roomId)).toMatchObject({ status: 200 });
    const history = await sql`
      select distinct concept from public.play_history where room_id = ${g.roomId}
    `;
    expect(history.map((h) => h.concept)).toEqual(['signum']);
  });
});

// Rule 10: check-in → rooms → game_players → game_secrets. A write (signum_commit) takes the table
// and then the secret; a leaving holds the table while it stamps game_players and its trigger takes
// the secret. Either waits for the other; neither deadlocks, and the waiting write finds the table
// changed and writes nothing.
describe('signum: locks (rule 10)', { timeout: SLOW }, () => {
  it('lets a write and a leaving wait for each other in the table’s order; nothing deadlocks', async () => {
    for (const leaveFirst of [true, false]) {
      const g = await inGuess();
      const [stays, leaves] = g.guessers as [Person, Person];
      const st = await state(g.roomId);
      const sec = await secret(g.roomId);
      const marked = {
        ...sec,
        marks: {
          ...sec.marks,
          [g.turn]: { ...sec.marks[g.turn], [stays.sessionId]: { tile: 0, seq: 1, sent: 0 } },
        },
      };
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const writing = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select (public.signum_commit(
          ${stays.userId}::uuid, ${g.roomId}::uuid, ${asJson(st)}::jsonb, ${sec.rev ?? 0},
          ${g.turn}, 'guesser', true, ${asJson(st)}::jsonb, ${asJson(marked)}::jsonb, ''
        ) ->> 'ok')::boolean as ok`;
      const leaving = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select (public.rooms_leave_game(${leaves.userId}::uuid, ${g.roomId}::uuid)).id`;
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await (leaveFirst ? leaving(tx) : writing(tx));
          later = (leaveFirst ? writing(second) : leaving(second))
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked(leaveFirst ? 'signum_commit' : 'rooms_leave_game');
        });
        const result = await later;
        if (leaveFirst) {
          // The table changed while the write waited: nothing written (the function decides again).
          expect(result).toEqual([{ ok: false }]);
        } else {
          expect(result).toMatchObject([{ id: g.roomId }]);
        }
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      const after = await secret(g.roomId);
      const now = await state(g.roomId);
      expect(now.seats.some((x) => x.sid === leaves.sessionId)).toBe(false);
      expect(after.marks[g.turn][stays.sessionId]?.tile ?? null).toBe(leaveFirst ? null : 0);
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });
});

// --- The SQL guards, called directly (as the Edge Function would, with what it dealt) -----------

type PageRead = {
  pregame: { concept: string; picks: SignumPicks; signum?: SignumPregame };
  gameNo: number;
  members: string[];
  sessionId: string;
  isOwner: boolean;
  now: string;
};

async function pageRead(p: Person, roomId: string): Promise<PageRead> {
  const [row] = (await sql`
    select public.signum_pregame_read(${p.userId}::uuid, ${roomId}::uuid) as read
  `) as unknown as [{ read: PageRead }];
  return row.read;
}

// What the Edge Function would deal from this read (pure/signum.ts → startGame).
function dealt(read: PageRead) {
  const picks = Object.fromEntries(
    Object.entries(read.pregame.picks).filter(([sid]) => read.members.includes(sid)),
  ) as SignumPicks;
  const page = cleanPregame(read.pregame.signum as SignumPregame, picks);
  const seats = seatsAtStart(page, picks);
  if (!seats) throw new Error('no seats');
  const started = startGame(
    {
      gameNo: read.gameNo + 1,
      seats,
      pool: WORDS,
      now: new Date(read.now),
      channels: { a: randomUUID(), b: randomUUID() },
    },
    Math.random,
  );
  if ('error' in started) throw new Error(started.error);
  return started;
}

const startCall = (
  q: postgres.Sql | postgres.TransactionSql,
  owner: Person,
  roomId: string,
  read: PageRead,
  st: unknown,
  sec: unknown,
) =>
  q`select (public.signum_start(
    ${owner.userId}::uuid, ${roomId}::uuid, ${asJson(read.pregame)}::jsonb,
    ${asJson(st)}::jsonb, ${asJson(sec)}::jsonb
  ) ->> 'ok')::boolean as ok`;

describe(
  'signum: what the SQL refuses (signum_start, signum_pregame_commit)',
  { timeout: SLOW },
  () => {
    it('refuses wrong seats, an unapproved captain, a word off the pool, a wrong key or missing channels', async () => {
      const g = await game(['a', 'a', 'b', 'b'], { start: false });
      const read = await pageRead(g.owner, g.roomId);
      const { state: st, secret: sec } = dealt(read);
      const other = (team: SignumKind): SignumKind => (team === 'n' ? 'x' : 'n');
      const starterTile = sec.key.indexOf(st.starter);
      const guesserB = st.seats.find((x) => x.team === 'b' && x.role === 'guesser');
      const bad: [string, unknown, unknown][] = [
        [
          'a seat on the wrong team',
          {
            ...st,
            seats: st.seats.map((x, i) =>
              i === 0 ? { ...x, team: x.team === 'a' ? 'b' : 'a' } : x,
            ),
          },
          sec,
        ],
        ['a seat twice', { ...st, seats: [...st.seats, st.seats[0]] }, sec],
        [
          'an unapproved captain',
          {
            ...st,
            seats: st.seats.map((x) =>
              x.team === 'b' ? { ...x, role: x.sid === guesserB?.sid ? 'captain' : 'guesser' } : x,
            ),
          },
          sec,
        ],
        [
          'a role that is none',
          { ...st, seats: st.seats.map((x, i) => (i === 0 ? { ...x, role: null } : x)) },
          sec,
        ],
        [
          'a word off the pool',
          { ...st, board: st.board.map((t, i) => (i === 0 ? { ...t, word: 'zzzzz' } : t)) },
          sec,
        ],
        [
          'a word twice',
          {
            ...st,
            board: st.board.map((t, i) => (i === 1 ? { ...t, word: st.board[0]?.word } : t)),
          },
          sec,
        ],
        [
          'an open tile',
          { ...st, board: st.board.map((t, i) => (i === 0 ? { ...t, open: sec.key[0] } : t)) },
          sec,
        ],
        [
          'a wrong key',
          st,
          { ...sec, key: sec.key.map((k, i) => (i === starterTile ? other(k) : k)) },
        ],
        ['no channels', st, { ...sec, channels: undefined }],
        ['one channel twice', st, { ...sec, channels: { a: sec.channels.a, b: sec.channels.a } }],
        ['a channel that is no id', st, { ...sec, channels: { a: 'x', b: sec.channels.b } }],
        ['another step', { ...st, step: 2 }, sec],
      ['a step that is no number', { ...st, step: 'x' }, sec],
      ['a clock that is no time', { ...st, endsAt: 'yarın' }, sec],
      ['no clock', { ...st, endsAt: null }, sec],
      ['a game number that is no number', { ...st, gameNo: 'x' }, sec],
        ['the key in the open state', { ...st, key: sec.key }, sec],
      ];
      for (const [what, badState, badSecret] of bad) {
        await expect(
          startCall(sql, g.owner, g.roomId, read, badState, badSecret),
          what,
        ).rejects.toThrow(/bad_request/);
      }
      // Nothing of a refused start stays: the page is open and no game runs.
      const room = await roomRow(g.roomId);
      expect([
        room.concept,
        (room.game_state as { pregame?: object }).pregame !== undefined,
      ]).toEqual([null, true]);
      // A read that is no longer the page: not written. The dealt one as read: written.
      expect(
        await startCall(
          sql,
          g.owner,
          g.roomId,
          { ...read, pregame: { ...read.pregame, concept: 'x' } },
          st,
          sec,
        ),
      ).toEqual([{ ok: false }]);
      expect(await startCall(sql, g.owner, g.roomId, read, st, sec)).toEqual([{ ok: true }]);
    });

    it('writes nothing on the page when it changed or the caller’s ownership did', async () => {
      const g = await game(['a', 'a', 'b', 'b'], { start: false });
      const read = await pageRead(g.owner, g.roomId);
      const commit = (pregame: unknown, isOwner: boolean) =>
        sql`select (public.signum_pregame_commit(
        ${g.owner.userId}::uuid, ${g.roomId}::uuid, ${asJson(pregame)}::jsonb, ${isOwner},
        ${asJson({ candidates: { a: [], b: [] }, offers: { a: null, b: null }, captains: { a: null, b: null } })}::jsonb
      ) ->> 'ok')::boolean as ok`;
      const before = await roomRow(g.roomId);
      expect(await commit(read.pregame, false)).toEqual([{ ok: false }]);
      expect(await commit({ ...read.pregame, picks: {} }, true)).toEqual([{ ok: false }]);
      expect((await roomRow(g.roomId)).game_state).toEqual(before.game_state);
      expect(await commit(read.pregame, true)).toEqual([{ ok: true }]);
    });
  },
);

// Rule 10 for the other roads that take the check-in and the table: a page write and a pick, a start
// and a pick, a game-ending write and a leaving. Each waits for the other; none deadlocks.
describe('signum: locks of the page, the start and the end (rule 10)', { timeout: SLOW }, () => {
  async function race(
    first: (q: postgres.TransactionSql) => postgres.PendingQuery<postgres.Row[]>,
    second: (q: postgres.Sql) => postgres.PendingQuery<postgres.Row[]>,
    blockedOn: string,
  ): Promise<unknown> {
    const a = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const b = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let later: Promise<unknown> = Promise.resolve();
      await a.begin(async (tx) => {
        await first(tx);
        later = second(b)
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked(blockedOn);
      });
      return await later;
    } finally {
      await Promise.all([a.end(), b.end()]);
    }
  }

  const pick = (q: postgres.Sql | postgres.TransactionSql, p: Person, roomId: string, to: string) =>
    q`select (public.rooms_pick(${p.userId}::uuid, ${roomId}::uuid, ${to})).id`;

  it('a page write and a pick wait for each other; the later write finds the page changed', async () => {
    const g = await game(['a', 'a', 'b', 'b'], { start: false });
    const read = await pageRead(g.owner, g.roomId);
    const next = {
      ...(read.pregame.signum as SignumPregame),
      offers: { a: null, b: g.team.b[1]?.sessionId ?? null },
    };
    const write = (q: postgres.Sql | postgres.TransactionSql) =>
      q`select (public.signum_pregame_commit(
        ${g.owner.userId}::uuid, ${g.roomId}::uuid, ${asJson(read.pregame)}::jsonb, true, ${asJson(next)}::jsonb
      ) ->> 'ok')::boolean as ok`;
    const mover = g.team.a[1] as Person;
    expect(
      await race(
        (tx) => pick(tx, mover, g.roomId, 'obs'),
        (q) => write(q),
        'signum_pregame_commit',
      ),
    ).toEqual([{ ok: false }]);
  });

  it('a start and a pick wait for each other; nothing deadlocks', async () => {
    for (const startFirst of [true, false]) {
      const g = await game(['a', 'a', 'a', 'b', 'b'], { start: false });
      const read = await pageRead(g.owner, g.roomId);
      const { state: st, secret: sec } = dealt(read);
      const mover = g.team.a[2] as Person;
      const result = startFirst
        ? await race(
            (tx) => startCall(tx, g.owner, g.roomId, read, st, sec),
            (q) => pick(q, mover, g.roomId, 'obs'),
            'rooms_pick',
          )
        : await race(
            (tx) => pick(tx, mover, g.roomId, 'obs'),
            (q) => startCall(q, g.owner, g.roomId, read, st, sec),
            'signum_start',
          );
      if (startFirst) {
        // The page closed with the start.
        expect(result).toMatchObject({ message: 'no_game' });
        expect((await roomRow(g.roomId)).concept).toBe('signum');
      } else {
        expect(result).toEqual([{ ok: false }]);
        expect((await roomRow(g.roomId)).concept).toBeNull();
      }
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });

  it('a game-ending write and a leaving wait for each other; nothing deadlocks', async () => {
    for (const endFirst of [true, false]) {
      const g = await inGuess();
      const [opener, leaver] = g.guessers as [Person, Person];
      const sec = await secret(g.roomId);
      const black = tileOf(sec, 'x');
      await point(opener, g.roomId, black, 1);
      const st = await state(g.roomId);
      const marked = await secret(g.roomId);
      const seat = st.seats.find((x) => x.sid === opener.sessionId) ?? null;
      const d = decideAction(
        st,
        marked,
        { sid: opener.sessionId, seat },
        { action: 'reveal', step: st.step, tile: black, actionId: randomUUID() },
        new Date(),
        prepareTerms([]),
      );
      if (d.kind !== 'applied') throw new Error(d.kind);
      expect(d.state.phase).toBe('over');
      const end = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select (public.signum_commit(
          ${opener.userId}::uuid, ${g.roomId}::uuid, ${asJson(st)}::jsonb, ${marked.rev ?? 0},
          ${g.turn}, 'guesser', true, ${asJson(d.state)}::jsonb, ${asJson(d.secret)}::jsonb, ${g.turn}
        ) ->> 'ok')::boolean as ok`;
      const leave = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select (public.rooms_leave_game(${leaver.userId}::uuid, ${g.roomId}::uuid)).id`;
      const result = endFirst
        ? await race(
            (tx) => end(tx),
            (q) => leave(q),
            'rooms_leave_game',
          )
        : await race(
            (tx) => leave(tx),
            (q) => end(q),
            'signum_commit',
          );
      const room = await roomRow(g.roomId);
      // Ended by the write, or still running after the leaving.
      expect(room.concept).toBe(endFirst ? null : 'signum');
      if (endFirst) {
        // The game had ended: there was no game to leave.
        expect(result).toMatchObject({ message: 'no_game' });
        expect(
          (room.game_state as { lastGame: { signum: SignumState } }).lastGame.signum.reason,
        ).toBe('black');
      } else {
        // The leaving changed the table first: the end is not written (the function decides again).
        expect(result).toEqual([{ ok: false }]);
      }
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });
});
