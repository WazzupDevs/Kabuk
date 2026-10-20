// Faz 4 step 4.6.1 (docs/SPEC_V4.md §4.F "Adım 4.6.1", §4.K, §4.M "Adım 4.6"): Kapsül Anlat, the
// table's person-based Tabu. Mor and Pembe take turns; the describer goes round within the team;
// Doğru and Pas are the describer's, Yasak! the other team's. The card goes to the describer, the
// other team and the watchers only: never to the describer's teammates, nor into anything the table
// reads (rooms, game_events, messages, Realtime) before it closes.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { KAPSUL_ANLAT } from '../functions/_shared/pure/kapsulAnlat.ts';
import { TABLE_GAMES } from '../functions/_shared/pure/tableGames.ts';
import { normalize } from '../functions/_shared/pure/trText.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { type Client, dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import {
  leave,
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
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
const at = (n: number) => person(venue, n);

const tabu = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'tabu', body);
const act = (p: Person, roomId: string, action: string) => tabu(p, { action, roomId });
const mark = (p: Person, roomId: string, cardIndex: number, result: string, turnNo = 1) =>
  tabu(p, { action: 'mark', roomId, turnNo, cardIndex, result });
type Cards = { turnNo: number; cards: { word: string; forbidden: string[] }[] };
const turnCards = async (p: Person, roomId: string) =>
  (await act(p, roomId, 'turn-cards')) as { status: number; body: Cards };

type State = {
  gameNo: number;
  turnNo: number;
  teams: { a: string[]; b: string[] };
  left: string[];
  scores: { a: number; b: number };
  describingTeam: 'a' | 'b';
  describer: string;
  turnPhase: 'ready' | 'running' | 'over';
  readyEndsAt?: string;
  startsAt?: string;
  endsAt?: string;
  nextAt?: string;
  cardIndex: number;
  passesUsed: number;
  counts: { correct: number; pass: number; taboo: number };
  lastTurn?: {
    turnNo: number;
    team: string;
    describer: string;
    score: number;
    counts: Record<string, number>;
    cards: { word: string; result: string }[];
  };
  next?: { team: string; describer: string | null } | null;
};

async function stateOf(roomId: string): Promise<State> {
  return (await roomRow(roomId)).game_state as State;
}

// A table of `count` people, the first its owner, on Kapsül Anlat's pre-game page with these picks
// (by seat: 'a' Mor, 'b' Pembe, 'obs' watching, null nothing), started by the owner.
async function started(picks: ('a' | 'b' | 'obs' | null)[]) {
  const people = await Promise.all(picks.map((_, n) => at(n)));
  const [owner, ...others] = people as [Person, ...Person[]];
  const roomId = await tableWith(owner, others);
  expect(await rooms(owner, { action: 'open-game', roomId, concept: 'tabu' })).toEqual(OK);
  for (const [n, choice] of picks.entries()) {
    if (choice)
      expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick: choice })).toEqual(
        OK,
      );
  }
  expect(await act(owner, roomId, 'start')).toEqual(OK);
  const s = await stateOf(roomId);
  const bySession = (id: string | null | undefined) => {
    const found = people.find((p) => p.sessionId === id);
    if (!found) throw new Error(`nobody at ${id}`);
    return found;
  };
  return { people, owner, roomId, bySession, state: s };
}

// Four players, Mor and Pembe of two each, and one watcher.
const FOUR_AND_ONE = ['a', 'a', 'b', 'b', 'obs'] as const;

// The roles of turn `s.turnNo`.
function rolesIn(s: State, bySession: (id: string) => Person) {
  const team = s.teams[s.describingTeam];
  const other = s.teams[s.describingTeam === 'a' ? 'b' : 'a'];
  return {
    describer: bySession(s.describer),
    guessers: team.filter((id) => id !== s.describer).map(bySession),
    opponents: other.map(bySession),
  };
}

async function readyOver(roomId: string) {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{readyEndsAt}', to_jsonb(now() - interval '1 second'))
    where id = ${roomId}
  `;
}

// The countdown has run: the marks are open.
async function countdownOver(roomId: string) {
  await sql`
    update public.tabu_turns set started_at = now() - interval '1 second'
    where room_id = ${roomId} and ends_at is not null
  `;
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{startsAt}', to_jsonb(now() - interval '1 second'))
    where id = ${roomId}
  `;
}

async function clockOver(roomId: string) {
  await sql`
    update public.tabu_turns set ends_at = now() - interval '1 second'
    where room_id = ${roomId} and ends_at is not null
  `;
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 second'))
    where id = ${roomId}
  `;
}

async function nextOver(roomId: string) {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{nextAt}', to_jsonb(now() - interval '1 second'))
    where id = ${roomId}
  `;
}

// The describer starts the turn and the countdown runs out.
async function play(describer: Person, roomId: string) {
  expect(await act(describer, roomId, 'begin-turn')).toEqual(OK);
  await countdownOver(roomId);
}

// The running turn ends and the owner moves on to the next one.
async function nextTurn(owner: Person, roomId: string) {
  await clockOver(roomId);
  expect(await act(owner, roomId, 'end-turn')).toEqual(OK);
  expect(await act(owner, roomId, 'advance')).toEqual(OK);
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// Table names and seat names come from alias_words and the capsule catalog, whose words are cards
// too ("Kelebek"); a table icon names its theme and thing. None comes from a card.
const NAME_COLUMNS = new Set([
  'owner_alias',
  'guest_alias',
  'sender_alias',
  'sender_look',
  'name',
  'icon',
]);

const valuesOf = (rows: Record<string, unknown>[]) =>
  normalize(
    JSON.stringify(
      rows.flatMap((row) =>
        Object.entries(row)
          .filter(([column]) => !NAME_COLUMNS.has(column))
          .map(([, value]) => value),
      ),
    ).replace(UUID, ' '),
  );

// Everything a person at the table reads about it outside tabu/turn-cards, as one string: every
// value, and every key inside JSON values (column names are the schema and left out).
async function readableBy(client: Client, roomId: string): Promise<string> {
  const reads = await Promise.all([
    client.from('rooms').select('*').eq('id', roomId),
    client.from('game_events').select('*').eq('room_id', roomId),
    client.from('messages').select('*').eq('room_id', roomId),
  ]);
  return valuesOf(reads.flatMap((r) => (r.data ?? []) as Record<string, unknown>[]));
}

const deckWords = async () =>
  (await sql`select word from public.cards where deck = 'tabu' and is_active`).map((row) =>
    normalize(String(row.word)),
  );
const wordsIn = (text: string, words: string[]) =>
  words.filter((word) => ` ${text} `.includes(` ${word} `));

// The table's room channel, as the app subscribes to it: every change of the table's row, its
// events and its messages.
function watchRoomChannel(client: Client, roomId: string) {
  const payloads: { new?: Record<string, unknown>; old?: Record<string, unknown> }[] = [];
  const channel = client.channel(`room:${roomId}`, { config: { private: true } });
  for (const table of ['rooms', 'game_events', 'messages']) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: table === 'rooms' ? `id=eq.${roomId}` : `room_id=eq.${roomId}`,
      },
      (payload: unknown) => payloads.push(payload as (typeof payloads)[number]),
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

describe('Kapsül Anlat: the game (§4.6.1)', () => {
  it('keeps the rules in SQL as pure/kapsulAnlat.ts says, and is playable', async () => {
    const [row] = await sql`select private.kapsul_config() as cfg`;
    const {
      totalTurns,
      turnSeconds,
      maxPasses,
      cardsPerTurn,
      readySeconds,
      countdownSeconds,
      nextSeconds,
    } = KAPSUL_ANLAT;
    expect(row?.cfg).toEqual({
      totalTurns,
      turnSeconds,
      maxPasses,
      cardsPerTurn,
      readySeconds,
      countdownSeconds,
      nextSeconds,
    });
    const [game] = await sql`select is_available from public.games where id = 'tabu'`;
    expect(game?.is_available).toBe(true);
    expect(TABLE_GAMES.find((g) => g.id === 'tabu')?.available).toBe(true);
  });

  it('starts from the page only by the owner, with two a team, and Mor describes first', async () => {
    const people = await Promise.all([0, 1, 2, 3, 4].map(at));
    const [owner, b, c, d, e] = people as [Person, Person, Person, Person, Person];
    const roomId = await tableWith(owner, [b, c, d, e]);
    // No page: no game to start.
    expect(await act(owner, roomId, 'start')).toEqual({ status: 409, body: errorBody('no_game') });
    expect(await rooms(owner, { action: 'open-game', roomId, concept: 'tabu' })).toEqual(OK);
    expect(await act(b, roomId, 'start')).toEqual({ status: 403, body: errorBody('not_owner') });
    for (const [p, t] of [
      [owner, 'a'],
      [b, 'a'],
      [c, 'b'],
    ] as const) {
      expect(await rooms(p, { action: 'pick', roomId, pick: t })).toEqual(OK);
    }
    // Pembe has one: not yet.
    expect(await act(owner, roomId, 'start')).toEqual({
      status: 409,
      body: errorBody('not_enough_players'),
    });
    expect(await rooms(d, { action: 'pick', roomId, pick: 'b' })).toEqual(OK);
    expect(await act(owner, roomId, 'start')).toEqual(OK);

    const s = await stateOf(roomId);
    const r = await roomRow(roomId);
    expect(r.concept).toBe('tabu');
    expect([...s.teams.a].sort()).toEqual([owner.sessionId, b.sessionId].sort());
    expect([...s.teams.b].sort()).toEqual([c.sessionId, d.sessionId].sort());
    const seats = await sql`
      select session_id, team from public.game_players
      where room_id = ${roomId} and game_no = ${s.gameNo} order by seat_order
    `;
    // The team lists keep the frozen seat order; e chose nothing and watches.
    expect(s.teams.a).toEqual(seats.filter((x) => x.team === 'a').map((x) => x.session_id));
    expect(seats.map((x) => x.session_id)).not.toContain(e.sessionId);
    expect(s).toMatchObject({
      turnNo: 1,
      totalTurns: 6,
      turnSeconds: 60,
      maxPasses: 3,
      countdownSeconds: 3,
      left: [],
      scores: { a: 0, b: 0 },
      describingTeam: 'a',
      describer: s.teams.a[0],
      turnPhase: 'ready',
      cardIndex: 0,
      passesUsed: 0,
      counts: { correct: 0, pass: 0, taboo: 0 },
    });
    const wait = Date.parse(s.readyEndsAt ?? '') - Date.now();
    expect(wait).toBeGreaterThan(8_000);
    expect(wait).toBeLessThanOrEqual(10_500);
    // A second start: the game runs.
    expect(await act(owner, roomId, 'start')).toEqual({ status: 409, body: errorBody('no_game') });
  });

  it('starts the turn from its describer at once and anyone after the ready time, with the countdown', async () => {
    const { people, roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer, guessers, opponents } = rolesIn(state, bySession);
    const watcher = people[4] as Person;
    // Before the ready time only the describer starts it; anyone else changes nothing.
    for (const p of [guessers[0], opponents[0], watcher] as Person[]) {
      expect(await act(p, roomId, 'begin-turn')).toEqual(OK);
    }
    expect((await stateOf(roomId)).turnPhase).toBe('ready');
    expect(await turnCards(describer, roomId)).toEqual({
      status: 409,
      body: errorBody('turn_not_started'),
    });
    await readyOver(roomId);
    // After it, the watcher starts it; the describer stays the turn's.
    expect(await act(watcher, roomId, 'begin-turn')).toEqual(OK);
    const s = await stateOf(roomId);
    expect(s).toMatchObject({ turnPhase: 'running', describer: describer.sessionId });
    expect(s.readyEndsAt).toBeUndefined();
    const countdown = Date.parse(s.startsAt ?? '') - Date.now();
    expect(countdown).toBeGreaterThan(1_500);
    expect(countdown).toBeLessThanOrEqual(3_500);
    expect(Date.parse(s.endsAt ?? '') - Date.parse(s.startsAt ?? '')).toBe(60_000);
    // During the countdown nothing is pressed.
    expect(await mark(describer, roomId, 0, 'correct')).toEqual({
      status: 409,
      body: errorBody('turn_not_started'),
    });
  });
});

describe('Kapsül Anlat: turns and presses (§4.6.1)', () => {
  it('starts the turn once however often it is sent, and ends and moves on idempotently', async () => {
    const { owner, roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer } = rolesIn(state, bySession);
    expect(await act(describer, roomId, 'begin-turn')).toEqual(OK);
    const begun = await stateOf(roomId);
    expect(await act(describer, roomId, 'begin-turn')).toEqual(OK);
    expect(await stateOf(roomId)).toEqual(begun);
    const [{ n: startedEvents } = { n: 0 }] = await sql`
      select count(*)::int as n from public.game_events
      where room_id = ${roomId} and type = 'turn_started'
    `;
    expect(startedEvents).toBe(1);

    // The clock has not run out: end-turn changes nothing.
    expect(await act(describer, roomId, 'end-turn')).toEqual(OK);
    expect((await stateOf(roomId)).turnPhase).toBe('running');
    await clockOver(roomId);
    expect(await act(describer, roomId, 'end-turn')).toEqual(OK);
    const over = await stateOf(roomId);
    expect(await act(describer, roomId, 'end-turn')).toEqual(OK);
    expect(await stateOf(roomId)).toEqual(over);

    expect(await act(owner, roomId, 'advance')).toEqual(OK);
    const second = await stateOf(roomId);
    expect(await act(owner, roomId, 'advance')).toEqual(OK);
    expect(await stateOf(roomId)).toEqual(second);
    expect(second).toMatchObject({ turnNo: 2, turnPhase: 'ready' });
    const [{ n: turns } = { n: 0 }] = await sql`
      select count(*)::int as n from public.tabu_turns where room_id = ${roomId}
    `;
    expect(turns).toBe(2);
  });

  it('hands the same card list to the describer, the other team and the watchers, twice alike', async () => {
    const { people, roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer, guessers, opponents } = rolesIn(state, bySession);
    const watcher = people[4] as Person;
    await play(describer, roomId);
    const list = await turnCards(describer, roomId);
    expect(list.status).toBe(200);
    expect(list.body.turnNo).toBe(1);
    expect(list.body.cards).toHaveLength(KAPSUL_ANLAT.cardsPerTurn);
    for (const p of [...opponents, watcher]) expect(await turnCards(p, roomId)).toEqual(list);
    expect(await turnCards(describer, roomId)).toEqual(list);
    // The describer's teammate gets none.
    expect(await turnCards(guessers[0] as Person, roomId)).toEqual({
      status: 403,
      body: errorBody('not_describer'),
    });
    // Someone at the venue but not at the table gets none either.
    const outsider = await at(6);
    expect(await turnCards(outsider, roomId)).toEqual({
      status: 403,
      body: errorBody('not_in_room'),
    });
  });

  it('keeps the card from the guessers: not in the rows they read, events or Realtime', async () => {
    const { roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer, guessers } = rolesIn(state, bySession);
    const guesser = guessers[0] as Person;
    const watch = watchRoomChannel(guesser.client, roomId);
    expect(await watch.subscribed).toBe('SUBSCRIBED');
    // SUBSCRIBED comes before Postgres Changes are live: touch the row until a change arrives.
    await expect
      .poll(
        async () => {
          await sql`update public.rooms set last_activity_at = last_activity_at where id = ${roomId}`;
          return watch.payloads.length;
        },
        { timeout: 15_000, interval: 500 },
      )
      .toBeGreaterThan(0);

    await play(describer, roomId);
    const dealt = (await turnCards(describer, roomId)).body.cards.map((c) => normalize(c.word));
    const deck = await deckWords();
    expect(deck).toEqual(expect.arrayContaining(dealt));
    // Before any press: no word of the deck anywhere the guesser reads.
    expect(wordsIn(await readableBy(guesser.client, roomId), deck)).toEqual([]);

    // Card 0 closes: its word reaches the table (its event), the open cards' do not ("Saat" sits in
    // "Saat kulesi": words inside card 0's own text are not counted).
    expect(await mark(describer, roomId, 0, 'correct')).toEqual(OK);
    const readable = await readableBy(guesser.client, roomId);
    expect(wordsIn(readable, [dealt[0] as string])).toEqual([dealt[0]]);
    const unclosed = dealt
      .slice(1)
      .filter((word) => wordsIn(dealt[0] as string, [word]).length === 0);
    expect(wordsIn(readable, unclosed)).toEqual([]);

    await expect.poll(() => watch.payloads.length, { timeout: 10_000 }).toBeGreaterThan(3);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const rows = watch.payloads
      .flatMap((p) => [p.new, p.old])
      .filter((row): row is Record<string, unknown> => !!row);
    expect(rows.length).toBeGreaterThan(0);
    expect(wordsIn(valuesOf(rows), unclosed)).toEqual([]);
    await guesser.client.removeChannel(watch.channel);
  });

  it('lets the describer press Doğru and Pas and the other team Yasak!, nobody else', async () => {
    const { people, roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer, guessers, opponents } = rolesIn(state, bySession);
    const guesser = guessers[0] as Person;
    const opponent = opponents[0] as Person;
    const watcher = people[4] as Person;
    await play(describer, roomId);
    for (const result of ['correct', 'pass']) {
      for (const p of [guesser, opponent]) {
        expect(await mark(p, roomId, 0, result)).toEqual({
          status: 403,
          body: errorBody('not_describer'),
        });
      }
    }
    for (const p of [describer, guesser]) {
      expect(await mark(p, roomId, 0, 'taboo')).toEqual({
        status: 403,
        body: errorBody('not_judge'),
      });
    }
    for (const result of ['correct', 'pass', 'taboo']) {
      expect(await mark(watcher, roomId, 0, result)).toEqual({
        status: 403,
        body: errorBody('not_player'),
      });
    }
    expect((await stateOf(roomId)).cardIndex).toBe(0);

    expect(await mark(describer, roomId, 0, 'correct')).toEqual(OK);
    expect(await mark(describer, roomId, 1, 'pass')).toEqual(OK);
    expect(await mark(opponent, roomId, 2, 'taboo')).toEqual(OK);
    expect(await mark(opponents[1] as Person, roomId, 3, 'taboo')).toEqual(OK);
    expect(await mark(describer, roomId, 4, 'correct')).toEqual(OK);
    // A second press on a closed card, an old turn or a card ahead: ignored.
    expect(await mark(opponent, roomId, 4, 'taboo')).toEqual(OK);
    expect(await mark(describer, roomId, 9, 'correct')).toEqual(OK);
    expect(await mark(describer, roomId, 5, 'correct', 2)).toEqual(OK);
    expect(await stateOf(roomId)).toMatchObject({
      scores: { [state.describingTeam]: 0, [state.describingTeam === 'a' ? 'b' : 'a']: 0 },
      cardIndex: 5,
      passesUsed: 1,
      counts: { correct: 2, pass: 1, taboo: 2 },
    });
    const events = await sql`
      select type, session_id from public.game_events
      where room_id = ${roomId} and type in ('correct', 'pass', 'taboo')
      order by created_at
    `;
    expect(events.map((e) => [e.type, e.session_id])).toEqual([
      ['correct', describer.sessionId],
      ['pass', describer.sessionId],
      ['taboo', opponent.sessionId],
      ['taboo', (opponents[1] as Person).sessionId],
      ['correct', describer.sessionId],
    ]);
  });

  it('allows three passes a turn and nothing once the clock has run out', async () => {
    const { roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer } = rolesIn(state, bySession);
    await play(describer, roomId);
    for (const i of [0, 1, 2]) expect(await mark(describer, roomId, i, 'pass')).toEqual(OK);
    expect(await mark(describer, roomId, 3, 'pass')).toEqual({
      status: 409,
      body: errorBody('no_passes_left'),
    });
    expect(await mark(describer, roomId, 3, 'correct')).toEqual(OK);
    await clockOver(roomId);
    expect(await mark(describer, roomId, 4, 'correct')).toEqual({
      status: 409,
      body: errorBody('turn_over'),
    });
    expect(await act(describer, roomId, 'end-turn')).toEqual(OK);
    expect(await mark(describer, roomId, 4, 'correct')).toEqual({
      status: 409,
      body: errorBody('turn_over'),
    });
    expect(await turnCards(describer, roomId)).toEqual({
      status: 409,
      body: errorBody('turn_over'),
    });
  });

  it("shows the turn's end screen: its cards and how they closed, and who is next", async () => {
    const { people, owner, roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer, opponents } = rolesIn(state, bySession);
    await play(describer, roomId);
    const words = (await turnCards(describer, roomId)).body.cards.map((c) => c.word);
    expect(await mark(describer, roomId, 0, 'correct')).toEqual(OK);
    expect(await mark(opponents[0] as Person, roomId, 1, 'taboo')).toEqual(OK);
    expect(await mark(describer, roomId, 2, 'pass')).toEqual(OK);
    expect(await mark(describer, roomId, 3, 'correct')).toEqual(OK);
    await clockOver(roomId);
    expect(await act(people[4] as Person, roomId, 'end-turn')).toEqual(OK);
    const s = await stateOf(roomId);
    expect(s).toMatchObject({
      turnPhase: 'over',
      lastTurn: {
        turnNo: 1,
        team: 'a',
        describer: describer.sessionId,
        score: 1,
        counts: { correct: 2, pass: 1, taboo: 1 },
        cards: [
          { word: words[0], result: 'correct' },
          { word: words[1], result: 'taboo' },
          { word: words[2], result: 'pass' },
          { word: words[3], result: 'correct' },
        ],
      },
      next: { team: 'b', describer: s.teams.b[0] },
    });
    expect(s.startsAt).toBeUndefined();
    const wait = Date.parse(s.nextAt ?? '') - Date.now();
    expect(wait).toBeGreaterThan(13_000);
    expect(wait).toBeLessThanOrEqual(15_500);

    // Before nextAt only the owner moves on.
    const notOwner = people.find((p) => p !== owner) as Person;
    expect(await act(notOwner, roomId, 'advance')).toEqual(OK);
    expect((await stateOf(roomId)).turnPhase).toBe('over');
    await nextOver(roomId);
    expect(await act(notOwner, roomId, 'advance')).toEqual(OK);
    expect(await stateOf(roomId)).toMatchObject({
      turnNo: 2,
      turnPhase: 'ready',
      describingTeam: 'b',
      describer: s.teams.b[0],
      cardIndex: 0,
      passesUsed: 0,
      counts: { correct: 0, pass: 0, taboo: 0 },
      scores: { a: 1, b: 0 },
    });
    const next = await stateOf(roomId);
    expect(next.lastTurn).toBeUndefined();
    expect(next.next).toBeUndefined();
  });

  it('takes the teams in turn and the describer round each team in the frozen order', async () => {
    const { owner, roomId, bySession, state } = await started(['a', 'a', 'a', 'b', 'b']);
    const order: string[] = [];
    for (let turn = 1; turn <= 6; turn += 1) {
      const s = await stateOf(roomId);
      expect(s.turnNo).toBe(turn);
      expect(s.describingTeam).toBe(turn % 2 === 1 ? 'a' : 'b');
      order.push(s.describer);
      await play(bySession(s.describer), roomId);
      if (turn < 6) await nextTurn(owner, roomId);
    }
    const { a, b } = state.teams;
    expect(order).toEqual([a[0], b[0], a[1], b[1], a[2], b[0]]);
  });

  it('writes a result for each player at the end, with the highlights, and none for the watchers', async () => {
    const { people, owner, roomId, bySession } = await started([...FOUR_AND_ONE]);
    for (let turn = 1; turn <= 6; turn += 1) {
      const s = await stateOf(roomId);
      const { describer, opponents } = rolesIn(s, bySession);
      await play(describer, roomId);
      // Mor's describers say two Doğru each; Pembe's first opponent catches one each Mor turn.
      if (s.describingTeam === 'a') {
        expect(await mark(describer, roomId, 0, 'correct', turn)).toEqual(OK);
        expect(await mark(describer, roomId, 1, 'correct', turn)).toEqual(OK);
        expect(await mark(opponents[0] as Person, roomId, 2, 'taboo', turn)).toEqual(OK);
      } else {
        expect(await mark(describer, roomId, 0, 'correct', turn)).toEqual(OK);
      }
      await clockOver(roomId);
      expect(await act(owner, roomId, 'end-turn')).toEqual(OK);
      if (turn === 6) expect((await stateOf(roomId)).next).toBeNull();
      expect(await act(owner, roomId, 'advance')).toEqual(OK);
    }
    const r = await roomRow(roomId);
    expect(r.concept).toBeNull();
    const last = r.game_state.lastGame;
    // Mor: 3 turns × (2 − 1) = 3; Pembe: 3 × 1 = 3. A draw.
    expect(last).toMatchObject({ concept: 'tabu', abandoned: false, scores: { a: 3, b: 3 } });
    expect(last.winner).toBeUndefined();
    const teamA = last.teams.a as string[];
    const teamB = last.teams.b as string[];
    // Mor's first describer told turns 1 and 5: four Doğru. Pembe's first opponent caught three.
    expect(last.bestDescriber).toEqual({ sessionId: teamA[0], count: 4 });
    const hunter = bySession(teamB[0]);
    expect(last.tabooHunter).toEqual({ sessionId: hunter.sessionId, count: 3 });

    const results = await sql`
      select ts.id as session_id, g.score, g.won, g.mode from public.game_results g
      join public.table_sessions ts on ts.user_id = g.user_id and ts.status = 'active'
      where g.room_id = ${roomId} and g.concept = 'tabu'
    `;
    expect(results.map((x) => x.session_id).sort()).toEqual([...teamA, ...teamB].sort());
    expect(results.every((x) => x.score === 3 && x.won === false && x.mode === 'voice')).toBe(true);
    expect(results.map((x) => x.session_id)).not.toContain((people[4] as Person).sessionId);
    const [{ n } = { n: 0 }] = await sql`
      select count(*)::int as n from public.game_events
      where room_id = ${roomId} and type = 'game_completed'
    `;
    expect(n).toBe(1);
    const open = await sql`
      select 1 from public.game_players where room_id = ${roomId} and left_at is null
    `;
    expect(open).toHaveLength(0);
    // "Yeniden oyna": the same picks.
    expect(
      await rooms(owner, { action: 'open-game', roomId, concept: 'tabu', again: true }),
    ).toEqual(OK);
  });

  it('names the winner and counts the win for its players only', async () => {
    const { owner, roomId, bySession } = await started([...FOUR_AND_ONE]);
    for (let turn = 1; turn <= 6; turn += 1) {
      const s = await stateOf(roomId);
      const { describer } = rolesIn(s, bySession);
      await play(describer, roomId);
      if (s.describingTeam === 'b') {
        expect(await mark(describer, roomId, 0, 'correct', turn)).toEqual(OK);
      }
      await clockOver(roomId);
      expect(await act(owner, roomId, 'end-turn')).toEqual(OK);
      expect(await act(owner, roomId, 'advance')).toEqual(OK);
    }
    const last = (await roomRow(roomId)).game_state.lastGame;
    expect(last).toMatchObject({ scores: { a: 0, b: 3 }, winner: 'b' });
    expect(last.tabooHunter).toBeUndefined();
    const won = await sql`
      select ts.id as session_id from public.game_results g
      join public.table_sessions ts on ts.user_id = g.user_id and ts.status = 'active'
      where g.room_id = ${roomId} and g.won
    `;
    expect(won.map((x) => x.session_id).sort()).toEqual([...(last.teams.b as string[])].sort());
    // The win badge counts it (user_stats.voice_tabu_wins).
    const winner = bySession(last.teams.b[0]);
    const [stats] = await sql`select * from public.user_stats(${winner.userId})`;
    expect(stats?.voice_tabu_wins).toBe(1);
  });
});

describe('leaving Kapsül Anlat (§4.6.1 "Çıkış")', () => {
  it('runs the turn out without presses when its describer leaves, and the card stays theirs', async () => {
    const { roomId, bySession, state } = await started(['a', 'a', 'a', 'b', 'b']);
    const { describer, opponents } = rolesIn(state, bySession);
    await play(describer, roomId);
    expect(await rooms(describer, { action: 'leave-game', roomId })).toEqual(OK);
    expect((await stateOf(roomId)).left).toEqual([describer.sessionId]);
    // The one who left: no presses, no card, though still at the table.
    expect(await mark(describer, roomId, 0, 'correct')).toEqual({
      status: 403,
      body: errorBody('not_player'),
    });
    expect(await turnCards(describer, roomId)).toEqual({
      status: 403,
      body: errorBody('not_player'),
    });
    // Nobody describes: Yasak! changes nothing.
    expect(await mark(opponents[0] as Person, roomId, 0, 'taboo')).toEqual(OK);
    expect(await stateOf(roomId)).toMatchObject({ cardIndex: 0, scores: { a: 0, b: 0 } });
    // A leaver's role is not handed on: the turn stays its own.
    expect((await stateOf(roomId)).describer).toBe(describer.sessionId);
  });

  it('goes round who still plays, so a team down to one describes every turn', async () => {
    const { owner, roomId, bySession, state } = await started(['a', 'a', 'b', 'b', 'b']);
    const [stays, leaver] = state.teams.a.map(bySession) as [Person, Person];
    // Mor is down to one before its second turn.
    await play(stays, roomId);
    expect(await rooms(leaver, { action: 'leave-game', roomId })).toEqual(OK);
    await nextTurn(owner, roomId);
    await play(bySession((await stateOf(roomId)).describer), roomId);
    await nextTurn(owner, roomId);
    expect(await stateOf(roomId)).toMatchObject({ turnNo: 3, describer: stays.sessionId });
    await play(stays, roomId);
    await nextTurn(owner, roomId);
    await play(bySession((await stateOf(roomId)).describer), roomId);
    await nextTurn(owner, roomId);
    expect(await stateOf(roomId)).toMatchObject({ turnNo: 5, describer: stays.sessionId });
  });

  it('hands a waiting turn to the next describer when its own left the table', async () => {
    const { roomId, bySession, state } = await started(['a', 'a', 'a', 'b', 'b']);
    const { describer, guessers } = rolesIn(state, bySession);
    expect(await leave(describer, roomId)).toEqual(OK);
    expect((await stateOf(roomId)).left).toContain(describer.sessionId);
    await readyOver(roomId);
    const next = guessers[0] as Person;
    expect(await act(next, roomId, 'begin-turn')).toEqual(OK);
    expect(await stateOf(roomId)).toMatchObject({
      turnPhase: 'running',
      describer: state.teams.a[1],
    });
  });

  it('ends the game when a team has nobody left, without results', async () => {
    const { owner, roomId, bySession, state } = await started(['a', 'a', 'b', 'b', 'obs']);
    const pembe = state.teams.b.map(bySession);
    await play(bySession(state.describer), roomId);
    for (const p of pembe) expect(await rooms(p, { action: 'leave-game', roomId })).toEqual(OK);
    await clockOver(roomId);
    expect(await act(owner, roomId, 'end-turn')).toEqual(OK);
    expect((await stateOf(roomId)).next).toEqual({ team: 'b', describer: null });
    expect(await act(owner, roomId, 'advance')).toEqual(OK);
    const r = await roomRow(roomId);
    expect(r.concept).toBeNull();
    expect(r.game_state.lastGame).toMatchObject({ concept: 'tabu', abandoned: true });
    const results = await sql`select 1 from public.game_results where room_id = ${roomId}`;
    expect(results).toHaveLength(0);
  });

  it('makes who sat down during the game a watcher: the card, no presses, no result', async () => {
    const { owner, roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const late = await at(7);
    await sit(late, owner, roomId);
    await play(bySession(state.describer), roomId);
    expect((await turnCards(late, roomId)).status).toBe(200);
    expect(await mark(late, roomId, 0, 'taboo')).toEqual({
      status: 403,
      body: errorBody('not_player'),
    });
    // "Oyunu bitir": abandoned, no result.
    expect(await rooms(owner, { action: 'end-game', roomId })).toEqual(OK);
    expect((await roomRow(roomId)).game_state.lastGame).toMatchObject({ abandoned: true });
    const results = await sql`select 1 from public.game_results where room_id = ${roomId}`;
    expect(results).toHaveLength(0);
  });
});

describe('locks (§4.K)', () => {
  // The describer's Doğru and an opponent's Yasak! on the same card at once: the table's lock puts
  // them in order, the first closes the card and the second, naming a closed card, is ignored.
  it('closes a card once when Doğru and Yasak! come together', async () => {
    const { roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer, opponents } = rolesIn(state, bySession);
    const opponent = opponents[0] as Person;
    await play(describer, roomId);
    const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let caught: Promise<unknown> = Promise.resolve();
      await first.begin(async (tx) => {
        await tx`select (public.tabu_mark(${describer.userId}, ${roomId}, 1, 0, 'correct')).id`;
        caught = second`select (public.tabu_mark(${opponent.userId}, ${roomId}, 1, 0, 'taboo')).id`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('tabu_mark');
      });
      expect(await caught).toEqual([{ id: roomId }]);
    } finally {
      await Promise.all([first.end(), second.end()]);
    }
    expect(await stateOf(roomId)).toMatchObject({
      cardIndex: 1,
      scores: { [state.describingTeam]: 1 },
      counts: { correct: 1, pass: 0, taboo: 0 },
    });
    const closed = await sql`
      select payload from public.game_events where room_id = ${roomId} and type = 'card_closed'
    `;
    expect(closed.map((e) => e.payload.result)).toEqual(['correct']);
  });

  // A player leaving the table while the describer presses: the press holds the table, the leaving
  // waits and takes the person out of the game after it.
  it('lets a leaving wait for a press and nothing deadlocks', async () => {
    const { roomId, bySession, state } = await started([...FOUR_AND_ONE]);
    const { describer, guessers } = rolesIn(state, bySession);
    const guesser = guessers[0] as Person;
    await play(describer, roomId);
    const pressing = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const leaving = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let left: Promise<unknown> = Promise.resolve();
      await pressing.begin(async (tx) => {
        await tx`select (public.tabu_mark(${describer.userId}, ${roomId}, 1, 0, 'correct')).id`;
        left = leaving`select (public.rooms_leave(${guesser.userId}, ${roomId})).phones`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_leave');
      });
      expect(await left).toEqual([{ phones: 4 }]);
    } finally {
      await Promise.all([pressing.end(), leaving.end()]);
    }
    expect(await stateOf(roomId)).toMatchObject({ cardIndex: 1, left: [guesser.sessionId] });
  });
});
