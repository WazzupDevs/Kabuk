// Faz 4 step 4.5a-3 (docs/SPEC_V4.md §4.F "Çerçeve"; the plan: docs/decisions/4.5-masa-modeli.md):
// the frame every game of the table plays in. The games are data (content/games.json →
// public.games); votes are suggestions, only the owner opens and starts a game; the pre-game page
// holds the picks (teams, watching); a person leaving the table leaves its game, and a table that
// closes (a move into another table included) abandons its game. No game is playable before its
// step of 4.6: the tests open the ones they play.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { TABLE_GAMES } from '../functions/_shared/pure/tableGames.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { admin, dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import {
  accept,
  ask,
  leave,
  openTable,
  type Person,
  person,
  roomRow,
  rooms,
  sit,
  TABLE_PHONES,
  tableWith,
} from './people.ts';

let venue: Record<string, string> = {};

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  await sql`update public.games set is_available = false`;
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
const at = (n: number) => person(venue, n);
// `count` people, as a tuple of that length.
type People<N extends number, R extends Person[] = []> = R['length'] extends N
  ? R
  : People<N, [...R, Person]>;
const all = <N extends number>(count: N) =>
  Promise.all(Array.from({ length: count }, (_, n) => at(n))) as Promise<People<N>>;

// The games a test plays, as their step of 4.6 will open them.
async function playable(...ids: string[]): Promise<void> {
  await sql`update public.games set is_available = true where id in ${sql(ids)}`;
}

const vote = (p: Person, roomId: string, concept: string | null) =>
  rooms(p, { action: 'vote', roomId, concept });
const openGame = (p: Person, roomId: string, concept: string, again?: boolean) =>
  rooms(p, { action: 'open-game', roomId, concept, ...(again ? { again } : {}) });
const pick = (p: Person, roomId: string, choice: 'a' | 'b' | 'obs' | null) =>
  rooms(p, { action: 'pick', roomId, pick: choice });

// What a game's `<game>/start` calls first (step 4.6), called as the Edge Function will call it:
// through PostgREST. A direct connection does not load what PostgREST's sessions load (pg_safeupdate:
// an UPDATE or DELETE without WHERE fails there), so a test over it would miss such a failure.
// Until the first game's start exists, a stand-in that only the service role may call, created for
// this file and dropped after it, calls private.start_game in PostgREST's transaction. When the first
// real road to it comes (4.5b or a game's start in 4.6), start goes through that road and the
// stand-in goes.
const START_VIA_API = 'test_start_game';
type StartArgs = { target_user_id: string; target_room_id: string; target_concept: string };
const callStart = admin.rpc.bind(admin) as unknown as (
  fn: typeof START_VIA_API,
  args: StartArgs,
) => PromiseLike<{ data: unknown; error: { code: string; message: string } | null }>;

beforeAll(async () => {
  await sql`
    create or replace function public.test_start_game(
      target_user_id uuid, target_room_id uuid, target_concept text
    )
    returns integer
    language sql
    security definer
    set search_path = ''
    as $$ select private.start_game(target_user_id, target_room_id, target_concept) $$
  `;
  await sql`
    revoke all on function public.test_start_game(uuid, uuid, text)
    from public, anon, authenticated
  `;
  await sql`grant execute on function public.test_start_game(uuid, uuid, text) to service_role`;
  await sql`notify pgrst, 'reload schema'`;
  // PostgREST knows the function once it no longer answers "not found" (PGRST202).
  const nobody = '00000000-0000-0000-0000-000000000000';
  for (let tries = 0; ; tries++) {
    const { error } = await callStart(START_VIA_API, {
      target_user_id: nobody,
      target_room_id: nobody,
      target_concept: 'harf',
    });
    if (error?.code !== 'PGRST202') break;
    if (tries === 100) throw new Error('PostgREST did not load public.test_start_game');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
});

afterAll(async () => {
  await sql`drop function if exists public.test_start_game(uuid, uuid, text)`;
  await sql`notify pgrst, 'reload schema'`;
});

const HARF_MAX = TABLE_GAMES.find((g) => g.id === 'harf')?.maxPlayers ?? 12;

async function start(owner: Person, roomId: string, concept: string): Promise<number> {
  const { data, error } = await callStart(START_VIA_API, {
    target_user_id: owner.userId,
    target_room_id: roomId,
    target_concept: concept,
  });
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data as number;
}

async function counts(p: Person, roomId: string) {
  const { data, error } = await p.client.rpc('table_vote_counts', { target_room_id: roomId });
  expect(error).toBeNull();
  return data ?? [];
}

async function players(roomId: string, gameNo: number) {
  return sql`
    select session_id, team, seat_order, left_at is not null as left
    from public.game_players
    where room_id = ${roomId} and game_no = ${gameNo}
    order by seat_order
  `;
}

async function picks(roomId: string): Promise<Record<string, string>> {
  const r = await roomRow(roomId);
  return (r.game_state?.pregame?.picks ?? {}) as Record<string, string>;
}

async function abandonedEvents(roomId: string) {
  return sql`
    select payload from public.game_events
    where room_id = ${roomId} and type = 'game_abandoned'
  `;
}

describe('the games as data (§4.F, K-17)', () => {
  it('holds the games of content/games.json, each playable from its step of 4.6', async () => {
    const rows = await sql`
      select id, name, min_players, max_players, teams, pregame, is_available
      from public.games order by sort_order
    `;
    expect(rows).toEqual(
      TABLE_GAMES.map((g) => ({
        id: g.id,
        name: g.name,
        min_players: g.minPlayers,
        max_players: g.maxPlayers,
        teams: g.teams,
        pregame: g.pregame,
        is_available: g.available,
      })),
    );

    const [owner, guest] = await all(2);
    const roomId = await tableWith(owner, [guest]);
    // "Yakında": no vote, no page.
    expect(await vote(guest, roomId, 'harf')).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(await openGame(owner, roomId, 'harf')).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    // Not a game at all.
    expect(await vote(guest, roomId, 'yok')).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    // The list is the server's; clients read it from pure/tableGames.ts.
    expect((await guest.client.from('games').select('id')).error).not.toBeNull();
  });
});

describe('votes (§4.F)', () => {
  it('counts one vote per person, changed or taken back; never who', async () => {
    await playable('tabu', 'harf');
    const [owner, b, c, outsider] = await all(4);
    const roomId = await tableWith(owner, [b, c]);

    // A dimmed poster (three phones, Kapsül Anlat needs four) can be voted for (K-17).
    expect(await vote(b, roomId, 'tabu')).toEqual(OK);
    expect(await vote(c, roomId, 'tabu')).toEqual(OK);
    expect(await vote(owner, roomId, 'harf')).toEqual(OK);
    expect(await counts(owner, roomId)).toEqual([
      { concept: 'harf', votes: 1, mine: true },
      { concept: 'tabu', votes: 2, mine: false },
    ]);
    expect(await counts(b, roomId)).toEqual([
      { concept: 'harf', votes: 1, mine: false },
      { concept: 'tabu', votes: 2, mine: true },
    ]);

    expect(await vote(b, roomId, 'harf')).toEqual(OK);
    expect(await vote(c, roomId, null)).toEqual(OK);
    expect(await counts(c, roomId)).toEqual([{ concept: 'harf', votes: 2, mine: false }]);

    // Only the table reads its counts; nobody reads the votes themselves.
    expect(await counts(outsider, roomId)).toEqual([]);
    expect((await b.client.from('table_votes').select('*')).error).not.toBeNull();

    // A person leaving takes the vote along.
    expect((await leave(b, roomId)).status).toBe(200);
    expect(await counts(owner, roomId)).toEqual([{ concept: 'harf', votes: 1, mine: true }]);
  });

  it('takes no vote while a page or a game is open', async () => {
    await playable('harf');
    const [owner, b] = await all(2);
    const roomId = await tableWith(owner, [b]);
    expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
    expect(await vote(b, roomId, 'harf')).toEqual({
      status: 409,
      body: errorBody('game_in_progress'),
    });
    await start(owner, roomId, 'harf');
    expect(await vote(b, roomId, null)).toEqual({
      status: 409,
      body: errorBody('game_in_progress'),
    });
  });
});

describe('the pre-game page (§4.F)', () => {
  it('is opened by the owner only, for a game the table has the phones for', async () => {
    await playable('tabu', 'harf', 'sohbet');
    const [owner, b, c] = await all(3);
    const roomId = await tableWith(owner, [b, c]);

    expect(await openGame(b, roomId, 'harf')).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    // Three phones; Kapsül Anlat needs four (K-17).
    expect(await openGame(owner, roomId, 'tabu')).toEqual({
      status: 409,
      body: errorBody('not_enough_players'),
    });
    // Sohbet kartları has no page: its own start (step 4.6.2).
    expect(await openGame(owner, roomId, 'sohbet')).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });

    expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
    expect((await roomRow(roomId)).game_state).toEqual({
      pregame: { concept: 'harf', picks: {} },
    });
    // One game or one page at a time.
    expect(await openGame(owner, roomId, 'harf')).toEqual({
      status: 409,
      body: errorBody('game_in_progress'),
    });

    // "Oyunu bitir" closes the page too; only the owner.
    expect(await rooms(b, { action: 'end-game', roomId })).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    expect(await rooms(owner, { action: 'end-game', roomId })).toEqual(OK);
    expect((await roomRow(roomId)).game_state).toEqual({});
    expect(await abandonedEvents(roomId)).toEqual([]);
  });

  it('takes each person’s pick by table session id: a team or watching in a team game', async () => {
    await playable('tabu', 'harf');
    const [owner, b, c, d, e] = await all(5);
    const roomId = await tableWith(owner, [b, c, d, e]);
    expect(await pick(b, roomId, 'a')).toEqual({ status: 409, body: errorBody('no_game') });

    expect(await openGame(owner, roomId, 'tabu')).toEqual(OK);
    expect(await pick(owner, roomId, 'a')).toEqual(OK);
    expect(await pick(b, roomId, 'b')).toEqual(OK);
    expect(await pick(c, roomId, 'obs')).toEqual(OK);
    expect(await pick(d, roomId, 'a')).toEqual(OK);
    expect(await pick(d, roomId, null)).toEqual(OK);
    expect(await picks(roomId)).toEqual({
      [owner.sessionId]: 'a',
      [b.sessionId]: 'b',
      [c.sessionId]: 'obs',
    });
    // Rule 4: table session ids only; no account or profile id in the row.
    const row = JSON.stringify(await roomRow(roomId));
    for (const p of [owner, b, c, d, e]) expect(row).not.toContain(p.userId);

    // "Karıştır": the owner only; those who do not watch go to the two teams, two and two.
    expect(await rooms(b, { action: 'shuffle', roomId })).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    expect(await rooms(owner, { action: 'shuffle', roomId })).toEqual(OK);
    const dealt = await picks(roomId);
    expect(dealt[c.sessionId]).toBe('obs');
    expect(Object.keys(dealt)).toHaveLength(5);
    expect(Object.values(dealt).filter((t) => t === 'a')).toHaveLength(2);
    expect(Object.values(dealt).filter((t) => t === 'b')).toHaveLength(2);

    // A game without teams: a player (no pick) or watching.
    expect(await rooms(owner, { action: 'end-game', roomId })).toEqual(OK);
    expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
    expect(await pick(b, roomId, 'a')).toEqual({ status: 400, body: errorBody('bad_request') });
    expect(await pick(b, roomId, 'obs')).toEqual(OK);
    expect(await rooms(owner, { action: 'shuffle', roomId })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(await rooms(b, { action: 'pick', roomId, pick: 'c' })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
  });
});

describe('the start (§4.F)', () => {
  it('freezes a team game’s players: two teams of at least two, the rest watching', async () => {
    await playable('tabu');
    const [owner, b, c, d, e, f] = await all(6);
    const roomId = await tableWith(owner, [b, c, d, e]);
    expect(await vote(b, roomId, 'tabu')).toEqual(OK);
    expect(await openGame(owner, roomId, 'tabu')).toEqual(OK);
    await pick(owner, roomId, 'a');
    await pick(b, roomId, 'b');
    await pick(c, roomId, 'b');
    await pick(d, roomId, 'b');
    // One in Mor: no start.
    await expect(start(owner, roomId, 'tabu')).rejects.toMatchObject({
      message: 'not_enough_players',
    });
    await expect(start(b, roomId, 'tabu')).rejects.toMatchObject({ message: 'not_owner' });
    await pick(d, roomId, 'a');

    expect(await start(owner, roomId, 'tabu')).toBe(1);
    const frozen = await players(roomId, 1);
    // e chose nothing: watching (§4.P).
    expect(frozen.map((p) => [p.session_id, p.team]).sort()).toEqual(
      [
        [owner.sessionId, 'a'],
        [b.sessionId, 'b'],
        [c.sessionId, 'b'],
        [d.sessionId, 'a'],
      ].sort(),
    );
    expect(frozen.map((p) => p.seat_order)).toEqual([1, 2, 3, 4]);
    const r = await roomRow(roomId);
    expect(r.concept).toBe('tabu');
    expect(r.game_state).toEqual({ gameNo: 1 });
    // The votes go with the start.
    expect(await counts(owner, roomId)).toEqual([]);

    // A person sitting down during the game watches it.
    await sit(f, owner, roomId);
    expect((await players(roomId, 1)).map((p) => p.session_id)).not.toContain(f.sessionId);
    // One game at a time.
    await expect(start(owner, roomId, 'tabu')).rejects.toMatchObject({ message: 'no_game' });
  });

  // The stand-in means something only while PostgREST's sessions load pg_safeupdate.
  it('starts through PostgREST, whose sessions refuse an UPDATE or DELETE without WHERE', async () => {
    const [row] = await sql`
      select count(*)::int as n from pg_roles, unnest(rolconfig) as setting
      where rolname = 'authenticator'
        and split_part(setting, '=', 1) = 'session_preload_libraries'
        and 'safeupdate' = any(string_to_array(replace(split_part(setting, '=', 2), ' ', ''), ','))
    `;
    expect(row?.n).toBe(1);
  });

  it('refuses a start above the game’s upper limit with its own answer', async () => {
    await playable('harf');
    const [owner, b, c] = await all(3);
    const roomId = await tableWith(owner, [b, c]);
    expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
    // Every game's upper limit is the table's today (12): a smaller one stands in for a game that
    // will have its own.
    await sql`update public.games set max_players = 2 where id = 'harf'`;
    try {
      await expect(start(owner, roomId, 'harf')).rejects.toMatchObject({
        message: 'too_many_players',
      });
      await pick(c, roomId, 'obs');
      expect(await start(owner, roomId, 'harf')).toBe(1);
    } finally {
      await sql`update public.games set max_players = ${HARF_MAX} where id = 'harf'`;
    }
  });

  it('plays everyone who does not watch in a game without teams, and needs its lower limit', async () => {
    await playable('sahtekar', 'sohbet');
    const [owner, b, c] = await all(3);
    const roomId = await tableWith(owner, [b, c]);
    expect(await openGame(owner, roomId, 'sahtekar')).toEqual(OK);
    await pick(c, roomId, 'obs');
    // Two players; Sahtekar needs three.
    await expect(start(owner, roomId, 'sahtekar')).rejects.toMatchObject({
      message: 'not_enough_players',
    });
    await pick(c, roomId, null);
    expect(await start(owner, roomId, 'sahtekar')).toBe(1);
    expect((await players(roomId, 1)).map((p) => p.team)).toEqual([null, null, null]);

    // Sohbet kartları starts with no page, everyone at the table playing.
    expect(await rooms(owner, { action: 'end-game', roomId })).toEqual(OK);
    expect(await start(owner, roomId, 'sohbet')).toBe(2);
    expect(await players(roomId, 2)).toHaveLength(3);
    // A game with a page cannot start without it; Sohbet kartları not over another.
    await expect(start(owner, roomId, 'sahtekar')).rejects.toMatchObject({ message: 'no_game' });
    await expect(start(owner, roomId, 'sohbet')).rejects.toMatchObject({
      message: 'game_in_progress',
    });
  });
});

describe('leaving and ending a game (§4.F)', () => {
  it('lets a player leave the game and stay at the table; only the owner ends it', async () => {
    await playable('harf');
    const [owner, b, c] = await all(3);
    const roomId = await tableWith(owner, [b, c]);
    expect(await rooms(b, { action: 'leave-game', roomId })).toEqual({
      status: 409,
      body: errorBody('no_game'),
    });
    expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
    await pick(c, roomId, 'obs');
    const gameNo = await start(owner, roomId, 'harf');

    // The owner ends its game with "Oyunu bitir"; "Oyundan çık" is the others' (§4.F).
    expect(await rooms(owner, { action: 'leave-game', roomId })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(
      (await players(roomId, gameNo)).find((p) => p.session_id === owner.sessionId)?.left,
    ).toBe(false);

    expect(await rooms(b, { action: 'leave-game', roomId })).toEqual(OK);
    expect((await players(roomId, gameNo)).find((p) => p.session_id === b.sessionId)?.left).toBe(
      true,
    );
    expect((await roomRow(roomId)).concept).toBe('harf');
    expect((await roomRow(roomId)).phones).toBe(3);
    // Not a player again in this game; a watcher never was one.
    expect(await rooms(b, { action: 'leave-game', roomId })).toEqual({
      status: 403,
      body: errorBody('not_player'),
    });
    expect(await rooms(c, { action: 'leave-game', roomId })).toEqual({
      status: 403,
      body: errorBody('not_player'),
    });

    expect(await rooms(b, { action: 'end-game', roomId })).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    expect(await rooms(owner, { action: 'end-game', roomId })).toEqual(OK);
    const r = await roomRow(roomId);
    expect(r.concept).toBeNull();
    expect(r.game_state).toEqual({ gameNo, lastGame: { concept: 'harf', abandoned: true } });
    expect((await players(roomId, gameNo)).every((p) => p.left)).toBe(true);
    expect(await abandonedEvents(roomId)).toEqual([{ payload: { concept: 'harf' } }]);
  });

  // "Masadan ayrıl" and every other road off the table take the person out of its game too
  // (WazzupDevs/Kabuk#183).
  it('takes a person leaving the table out of its game, its page and its votes', async () => {
    await playable('tabu', 'harf');
    const [owner, b, c, d, e] = await all(5);
    const roomId = await tableWith(owner, [b, c, d, e]);
    expect(await vote(e, roomId, 'harf')).toEqual(OK);
    expect(await openGame(owner, roomId, 'tabu')).toEqual(OK);
    await pick(owner, roomId, 'a');
    await pick(b, roomId, 'a');
    await pick(c, roomId, 'b');
    await pick(d, roomId, 'b');
    await pick(e, roomId, 'b');

    // Leaving the venue on the page: the pick goes.
    expect((await invoke(e.client, 'checkin', { action: 'leave' })).status).toBe(200);
    expect(Object.keys(await picks(roomId))).not.toContain(e.sessionId);
    expect(await counts(owner, roomId)).toEqual([]);

    const gameNo = await start(owner, roomId, 'tabu');
    // "Masadan ayrıl" in the game.
    expect((await leave(d, roomId)).status).toBe(200);
    const after = await players(roomId, gameNo);
    expect(after.find((p) => p.session_id === d.sessionId)?.left).toBe(true);
    expect(after.filter((p) => !p.left)).toHaveLength(3);
    // The game goes on for the others (each game's own rule for a role leaving, step 4.6).
    expect((await roomRow(roomId)).concept).toBe('tabu');
  });

  // A block and the expiry job end the seat by the same trigger as "Masadan ayrıl" (§4.K).
  it('takes out of its game whom the owner blocks, and a person whose check-in expires', async () => {
    await playable('harf');
    const [owner, b, c, d] = await all(4);
    const roomId = await tableWith(owner, [b, c, d]);
    expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
    const gameNo = await start(owner, roomId, 'harf');

    const blocked = await invoke(owner.client, 'safety', {
      action: 'block',
      roomId,
      sessionId: b.sessionId,
    });
    expect(blocked.status).toBe(200);
    await sql`update public.table_sessions set expires_at = now() - interval '1 minute'
              where id = ${c.sessionId}`;
    await sql`select private.end_expired_table_sessions()`;

    const after = await players(roomId, gameNo);
    expect(
      after
        .filter((p) => p.left)
        .map((p) => p.session_id)
        .sort(),
    ).toEqual([b.sessionId, c.sessionId].sort());
    expect((await roomRow(roomId)).concept).toBe('harf');
  });

  it('abandons the game of a table moved into another by its owner’s "Katıl"', async () => {
    await playable('harf');
    const [owner, b, host, guest] = await all(4);
    const moving = await tableWith(owner, [b], { open: false });
    expect(await openGame(owner, moving, 'harf')).toEqual(OK);
    const gameNo = await start(owner, moving, 'harf');

    // The table it moves into plays a game of its own: the newcomers watch it.
    const hosting = await tableWith(host, [guest]);
    expect(await openGame(host, hosting, 'harf')).toEqual(OK);
    const hostGame = await start(host, hosting, 'harf');
    await accept(host, await ask(owner, hosting));

    const moved = await roomRow(moving);
    expect(moved.status).toBe('closed');
    expect(moved.concept).toBeNull();
    expect(moved.game_state).toEqual({ gameNo, lastGame: { concept: 'harf', abandoned: true } });
    expect((await players(moving, gameNo)).every((p) => p.left)).toBe(true);
    expect(await abandonedEvents(moving)).toEqual([{ payload: { concept: 'harf' } }]);

    expect((await roomRow(hosting)).concept).toBe('harf');
    expect((await players(hosting, hostGame)).map((p) => p.session_id).sort()).toEqual(
      [host.sessionId, guest.sessionId].sort(),
    );
    expect(await abandonedEvents(hosting)).toEqual([]);
  });

  it('abandons the game of a table that closes by any other road', async () => {
    await playable('harf');
    const [owner, b] = await all(2);
    const roomId = await tableWith(owner, [b]);
    expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
    const gameNo = await start(owner, roomId, 'harf');
    // One person left, quiet past its minutes: the table closes and its game with it.
    expect((await leave(b, roomId)).status).toBe(200);
    await sql`
      update public.rooms set last_activity_at = now() - interval '2 hours' where id = ${roomId}
    `;
    await sql`select private.close_idle_rooms(30)`;
    const r = await roomRow(roomId);
    expect(r.status).toBe('closed');
    expect(r.game_state).toEqual({ gameNo, lastGame: { concept: 'harf', abandoned: true } });
    expect((await players(roomId, gameNo)).every((p) => p.left)).toBe(true);
    expect(await abandonedEvents(roomId)).toEqual([{ payload: { concept: 'harf' } }]);

    // A page closes with its table, without an event.
    const [again] = await Promise.all([openTable(owner)]);
    await sit(b, owner, again);
    expect(await openGame(owner, again, 'harf')).toEqual(OK);
    expect((await rooms(owner, { action: 'end' })).status).toBe(200);
    expect((await roomRow(again)).game_state).toEqual({});
    expect(await abandonedEvents(again)).toEqual([]);
  });
});

describe('"Yeniden oyna" (§4.F "Oyun sonu")', () => {
  it('opens the game just played with its picks; who came after its start picks anew', async () => {
    await playable('tabu', 'harf');
    const [owner, b, c, d, watcher, late] = await all(6);
    const roomId = await tableWith(owner, [b, c, d, watcher]);
    expect(await openGame(owner, roomId, 'tabu')).toEqual(OK);
    await pick(owner, roomId, 'a');
    await pick(b, roomId, 'a');
    await pick(c, roomId, 'b');
    await pick(d, roomId, 'b');
    await pick(watcher, roomId, 'obs');
    await start(owner, roomId, 'tabu');
    await sit(late, owner, roomId);
    // A player who left the game keeps its team.
    expect(await rooms(d, { action: 'leave-game', roomId })).toEqual(OK);
    expect(await rooms(owner, { action: 'end-game', roomId })).toEqual(OK);

    expect(await openGame(owner, roomId, 'harf', true)).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(await openGame(owner, roomId, 'tabu', true)).toEqual(OK);
    expect(await picks(roomId)).toEqual({
      [owner.sessionId]: 'a',
      [b.sessionId]: 'a',
      [c.sessionId]: 'b',
      [d.sessionId]: 'b',
      [watcher.sessionId]: 'obs',
    });
    expect((await roomRow(roomId)).game_state).toEqual({
      gameNo: 1,
      pregame: { concept: 'tabu', picks: await picks(roomId) },
    });
    expect(await start(owner, roomId, 'tabu')).toBe(2);
  });
});

describe('locks (§4.K)', () => {
  // The start holds the table (§4.K): a pick sent while a start runs waits and lands after it, on
  // no page; a start sent while a pick runs waits for it and plays the pick.
  it('lets a pick wait for a start, and a start for a pick; nothing deadlocks', async () => {
    for (const pickFirst of [true, false]) {
      await playable('harf');
      const [owner, b, c] = await all(3);
      const roomId = await tableWith(owner, [b, c]);
      expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const picking = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select (public.rooms_pick(${c.userId}, ${roomId}, 'obs')).id`;
      const starting = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select private.start_game(${owner.userId}, ${roomId}, 'harf') as n`;
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await (pickFirst ? picking(tx) : starting(tx));
          later = (pickFirst ? starting(second) : picking(second))
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked(pickFirst ? 'start_game' : 'rooms_pick');
        });
        if (pickFirst) {
          expect(await later).toEqual([{ n: 1 }]);
        } else {
          // The page closed with the start.
          expect(await later).toMatchObject({ message: 'no_game' });
        }
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      // The pick that came first: c watches; after the start: c plays.
      expect((await players(roomId, 1)).map((p) => p.session_id).sort()).toEqual(
        (pickFirst
          ? [owner.sessionId, b.sessionId]
          : [owner.sessionId, b.sessionId, c.sessionId]
        ).sort(),
      );
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });

  // A vote and a start at once: the vote that came first goes with the start; one sent while a
  // start runs waits and finds the game running (game_in_progress).
  it('lets a vote wait for a start, and a start for a vote; the start takes the votes', async () => {
    for (const voteFirst of [true, false]) {
      await playable('sohbet', 'harf');
      const [owner, b] = await all(2);
      const roomId = await tableWith(owner, [b]);
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const voting = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select (public.rooms_vote(${b.userId}, ${roomId}, 'harf')).id`;
      const starting = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select private.start_game(${owner.userId}, ${roomId}, 'sohbet') as n`;
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await (voteFirst ? voting(tx) : starting(tx));
          later = (voteFirst ? starting(second) : voting(second))
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked(voteFirst ? 'start_game' : 'rooms_vote');
        });
        if (voteFirst) {
          expect(await later).toEqual([{ n: 1 }]);
        } else {
          expect(await later).toMatchObject({ message: 'game_in_progress' });
        }
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      expect((await roomRow(roomId)).concept).toBe('sohbet');
      expect(
        await sql`select count(*)::int as n from public.table_votes where room_id = ${roomId}`,
      ).toEqual([{ n: 0 }]);
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });

  // A person leaving while the owner starts: the leaving waits for the start and takes the person
  // out of the game it just joined.
  it('lets a leaving wait for a start and take the person out of the new game', async () => {
    await playable('harf');
    const [owner, b, c] = await all(3);
    const roomId = await tableWith(owner, [b, c]);
    expect(await openGame(owner, roomId, 'harf')).toEqual(OK);
    const starting = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const leaving = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let left: Promise<unknown> = Promise.resolve();
      await starting.begin(async (tx) => {
        await tx`select private.start_game(${owner.userId}, ${roomId}, 'harf')`;
        left = leaving`select (public.rooms_leave(${b.userId}, ${roomId})).phones`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_leave');
      });
      expect(await left).toEqual([{ phones: 2 }]);
    } finally {
      await Promise.all([starting.end(), leaving.end()]);
    }
    const frozen = await players(roomId, 1);
    expect(frozen).toHaveLength(3);
    expect(frozen.find((p) => p.session_id === b.sessionId)?.left).toBe(true);
    expect((await roomRow(roomId)).concept).toBe('harf');
  });
});
