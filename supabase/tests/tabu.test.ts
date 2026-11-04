// Faz 4 step 4.6.1 (docs/SPEC_V4.md §4.F "Adım 4.6.1: Kapsül Anlat", K-5): Tabu at a table of
// people. Mor and Pembe from the pre-game page; the describer presses Doğru and Pas, the other team
// Yasak!; the card goes only to the describer, the other team and the watchers (rule 3). The clock
// is the server's: a test runs a phase out by moving its endsAt (and the 3-2-1's startsAt) into the
// past.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TABU_GAME } from '../functions/_shared/pure/tabuGame.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody } from './helpers.ts';
import { deleteUserByPhone, invoke, sql } from './local.ts';
import { type Person, person, roomRow, rooms, TABLE_PHONES, tableWith } from './people.ts';

let venue: Record<string, string> = {};

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

// The frame's tests close every game after each of theirs; this file plays Kapsül Anlat.
beforeEach(async () => {
  await sql`update public.games set is_available = true where id = 'tabu'`;
});

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await sql`update public.games set is_available = false where id = 'tabu'`;
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
const SLOW = 90_000;
const tabu = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'tabu', body);

type State = Record<string, unknown> & {
  phase?: string;
  step?: number;
  turnNo?: number;
  describer?: string | null;
  teams?: { a: string[]; b: string[] };
  scores?: { a: number; b: number };
  counts?: { correct: number; pass: number; taboo: number };
  words?: { word: string; result: string }[];
  cardIndex?: number;
};

type Game = {
  roomId: string;
  owner: Person;
  people: Person[];
  // The players of each team in seat order, and the watchers.
  a: Person[];
  b: Person[];
  watchers: Person[];
};

async function state(roomId: string): Promise<State> {
  return (await roomRow(roomId)).game_state as State;
}

// `teams`: each person's pick in order ('a', 'b', 'obs'); the first is the owner.
async function game(teams: ('a' | 'b' | 'obs')[]): Promise<Game> {
  const people = await Promise.all(teams.map((_, n) => person(venue, n)));
  const [owner, ...others] = people as [Person, ...Person[]];
  const roomId = await tableWith(owner, others);
  expect(await rooms(owner, { action: 'open-game', roomId, concept: 'tabu' })).toEqual(OK);
  for (const [n, pick] of teams.entries()) {
    expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick })).toEqual(OK);
  }
  expect(await tabu(owner, { action: 'start', roomId })).toEqual(OK);
  const st = await state(roomId);
  const bySession = new Map(people.map((p) => [p.sessionId, p]));
  const seat = (sid: string) => bySession.get(sid) as Person;
  return {
    roomId,
    owner,
    people,
    a: (st.teams?.a ?? []).map(seat),
    b: (st.teams?.b ?? []).map(seat),
    watchers: people.filter((_, n) => teams[n] === 'obs'),
  };
}

const describer = async (g: Game) => {
  const sid = (await state(g.roomId)).describer;
  return g.people.find((p) => p.sessionId === sid) as Person;
};

// "Turu başlat", then the 3-2-1 over: the clock runs.
async function beginTurn(g: Game): Promise<void> {
  const st = await state(g.roomId);
  expect(
    await tabu(await describer(g), { action: 'begin-turn', roomId: g.roomId, step: st.step }),
  ).toEqual(OK);
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{startsAt}', to_jsonb(now() - interval '1 second'))
    where id = ${g.roomId}
  `;
}

// As if the phase's time had run out, then any phone's advance.
async function runOut(g: Game, by: Person = g.owner): Promise<State> {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
    where id = ${g.roomId}
  `;
  expect(await tabu(by, { action: 'advance', roomId: g.roomId })).toEqual(OK);
  return state(g.roomId);
}

async function mark(p: Person, g: Game, result: 'correct' | 'pass' | 'taboo') {
  const st = await state(g.roomId);
  return tabu(p, {
    action: 'mark',
    roomId: g.roomId,
    step: st.step,
    cardIndex: st.cardIndex,
    result,
  });
}

async function cards(p: Person, g: Game) {
  return tabu(p, { action: 'turn-cards', roomId: g.roomId });
}

// Mor: owner and one more; Pembe: two; one watcher.
const FIVE: ('a' | 'b' | 'obs')[] = ['a', 'b', 'a', 'b', 'obs'];

describe('the start (§4.6.1)', () => {
  it(
    'freezes the teams and opens turn 1 for Mor’s first player, with no card in the open state',
    async () => {
      const g = await game(FIVE);
      expect(g.a).toHaveLength(2);
      expect(g.b).toHaveLength(2);
      const st = await state(g.roomId);
      expect(st).toMatchObject({
        phase: 'ready',
        step: 1,
        turnNo: 1,
        totalTurns: TABU_GAME.totalTurns,
        maxPasses: TABU_GAME.maxPasses,
        describer: g.a[0]?.sessionId,
        scores: { a: 0, b: 0 },
        counts: { correct: 0, pass: 0, taboo: 0 },
        words: [],
        gone: [],
      });
      const watcher = g.watchers[0] as Person;
      expect(JSON.stringify(st)).not.toContain(watcher.sessionId);
      // No dealt card's word anywhere in the table's open state (rule 3).
      const dealt = await sql`
        select c.word from public.tabu_turns t, unnest(t.card_ids) as u (card_id)
        join public.cards c on c.id = u.card_id
        where t.room_id = ${g.roomId}
      `;
      expect(dealt).toHaveLength(TABU_GAME.cardsPerTurn);
      const text = JSON.stringify(st);
      for (const { word } of dealt) expect(text).not.toContain(`"${word}"`);
    },
    SLOW,
  );

  it(
    'lets only the owner start, with Mor and Pembe of two each',
    async () => {
      const people = await Promise.all(Array.from({ length: 4 }, (_, n) => person(venue, n)));
      const [owner, ...others] = people as [Person, ...Person[]];
      const roomId = await tableWith(owner, others);
      expect(await rooms(owner, { action: 'open-game', roomId, concept: 'tabu' })).toEqual(OK);
      for (const [n, pick] of (['a', 'a', 'a', 'b'] as const).entries()) {
        expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick })).toEqual(OK);
      }
      expect(await tabu(others[0] as Person, { action: 'start', roomId })).toEqual({
        status: 403,
        body: errorBody('not_owner'),
      });
      expect(await tabu(owner, { action: 'start', roomId })).toEqual({
        status: 409,
        body: errorBody('not_enough_players'),
      });
    },
    SLOW,
  );
});

describe('the card (rule 3)', () => {
  it(
    'goes to the describer, the other team and the watchers, never to the describer’s team',
    async () => {
      const g = await game(FIVE);
      const teller = await describer(g);
      const teammate = g.a.find((p) => p !== teller) as Person;
      expect(await cards(teller, g)).toEqual({ status: 409, body: errorBody('turn_not_started') });
      expect(await cards(teammate, g)).toEqual({ status: 403, body: errorBody('not_describer') });

      // Only the describer starts the turn; a press from another step changes nothing.
      expect(await tabu(teammate, { action: 'begin-turn', roomId: g.roomId, step: 1 })).toEqual({
        status: 403,
        body: errorBody('not_describer'),
      });
      expect(await tabu(teller, { action: 'begin-turn', roomId: g.roomId, step: 9 })).toEqual(OK);
      expect((await state(g.roomId)).phase).toBe('ready');
      await beginTurn(g);
      expect(await state(g.roomId)).toMatchObject({ phase: 'turn', step: 2 });

      const mine = await cards(teller, g);
      expect(mine.status).toBe(200);
      const list = (mine.body as { turnNo: number; cards: { word: string }[] }).cards;
      expect(list).toHaveLength(TABU_GAME.cardsPerTurn);
      for (const p of [...g.b, ...g.watchers]) expect(await cards(p, g)).toEqual(mine);
      expect(await cards(teammate, g)).toEqual({ status: 403, body: errorBody('not_describer') });
      // The same twice: the same answer (IDEMPOTENT_CALLS).
      expect(await cards(teller, g)).toEqual(mine);
    },
    SLOW,
  );
});

describe('the presses (§4.6.1, K-5)', () => {
  it(
    'counts Doğru for the describer and Yasak! for the other team, once a card',
    async () => {
      const g = await game(FIVE);
      const teller = await describer(g);
      const teammate = g.a.find((p) => p !== teller) as Person;
      const rival = g.b[1] as Person;
      const watcher = g.watchers[0] as Person;
      const st0 = await state(g.roomId);
      expect(
        await tabu(teller, { action: 'begin-turn', roomId: g.roomId, step: st0.step }),
      ).toEqual(OK);
      // The 3-2-1 is still on.
      expect(await mark(teller, g, 'correct')).toEqual({
        status: 409,
        body: errorBody('turn_not_started'),
      });
      await sql`
        update public.rooms
        set game_state = jsonb_set(game_state, '{startsAt}', to_jsonb(now() - interval '1 second'))
        where id = ${g.roomId}
      `;
      const list = ((await cards(teller, g)).body as { cards: { word: string }[] }).cards;

      expect(await mark(teammate, g, 'correct')).toEqual({
        status: 403,
        body: errorBody('not_describer'),
      });
      expect(await mark(teller, g, 'taboo')).toEqual({ status: 403, body: errorBody('not_judge') });
      expect(await mark(watcher, g, 'taboo')).toEqual({
        status: 403,
        body: errorBody('not_judge'),
      });

      // Doğru, then the same card again from a second press: counted once.
      const at = await state(g.roomId);
      const press = { action: 'mark', roomId: g.roomId, step: at.step, cardIndex: 0 };
      expect(await tabu(teller, { ...press, result: 'correct' })).toEqual(OK);
      expect(await tabu(teller, { ...press, result: 'correct' })).toEqual(OK);
      expect(await tabu(rival, { ...press, result: 'taboo' })).toEqual(OK);
      expect(await state(g.roomId)).toMatchObject({
        scores: { a: 1, b: 0 },
        cardIndex: 1,
        counts: { correct: 1, pass: 0, taboo: 0 },
        words: [{ word: list[0]?.word, result: 'correct' }],
      });

      expect(await mark(rival, g, 'taboo')).toEqual(OK);
      expect(await state(g.roomId)).toMatchObject({
        scores: { a: 0, b: 0 },
        cardIndex: 2,
        counts: { correct: 1, pass: 0, taboo: 1 },
        words: [
          { word: list[0]?.word, result: 'correct' },
          { word: list[1]?.word, result: 'taboo' },
        ],
        stats: { correct: { [teller.sessionId]: 1 }, taboo: { [rival.sessionId]: 1 } },
      });

      // Three passes a turn.
      for (let n = 0; n < TABU_GAME.maxPasses; n++)
        expect(await mark(teller, g, 'pass')).toEqual(OK);
      expect(await mark(teller, g, 'pass')).toEqual({
        status: 409,
        body: errorBody('no_passes_left'),
      });
      expect(await state(g.roomId)).toMatchObject({ passesUsed: 3, scores: { a: 0, b: 0 } });

      // The clock out: no press counts.
      await sql`
        update public.rooms
        set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 second'))
        where id = ${g.roomId}
      `;
      expect(await mark(teller, g, 'correct')).toEqual({
        status: 409,
        body: errorBody('turn_over'),
      });
    },
    SLOW,
  );
});

describe('the turns (§4.F)', () => {
  it(
    'moves through Tur sonu by the owner or the clock, and changes nothing with an early advance',
    async () => {
      const g = await game(FIVE);
      // Early, twice: nothing changes (IDEMPOTENT_CALLS).
      const before = await state(g.roomId);
      expect(await tabu(g.people[1] as Person, { action: 'advance', roomId: g.roomId })).toEqual(
        OK,
      );
      expect(await tabu(g.people[1] as Person, { action: 'advance', roomId: g.roomId })).toEqual(
        OK,
      );
      expect(await state(g.roomId)).toEqual(before);

      // Tur öncesi runs out: the turn starts with its describer.
      const started = await runOut(g);
      expect(started).toMatchObject({ phase: 'turn', describer: g.a[0]?.sessionId });
      await sql`
        update public.rooms
        set game_state = jsonb_set(game_state, '{startsAt}', to_jsonb(now() - interval '1 second'))
        where id = ${g.roomId}
      `;
      expect(await mark(g.a[0] as Person, g, 'correct')).toEqual(OK);

      const summary = await runOut(g);
      expect(summary).toMatchObject({
        phase: 'summary',
        turnNo: 1,
        lastTurn: {
          turnNo: 1,
          team: 'a',
          describer: g.a[0]?.sessionId,
          score: 1,
          counts: { correct: 1, pass: 0, taboo: 0 },
        },
      });
      expect(
        await tabu(g.people[1] as Person, { action: 'next', roomId: g.roomId, step: summary.step }),
      ).toEqual({ status: 403, body: errorBody('not_owner') });
      expect(await tabu(g.owner, { action: 'next', roomId: g.roomId, step: summary.step })).toEqual(
        OK,
      );
      expect(await state(g.roomId)).toMatchObject({
        phase: 'ready',
        turnNo: 2,
        describer: g.b[0]?.sessionId,
        counts: { correct: 0, pass: 0, taboo: 0 },
        words: [],
        scores: { a: 1, b: 0 },
      });
      // A second press on the same Tur sonu changes nothing.
      expect(await tabu(g.owner, { action: 'next', roomId: g.roomId, step: summary.step })).toEqual(
        OK,
      );
      expect((await state(g.roomId)).turnNo).toBe(2);
    },
    SLOW,
  );

  it(
    'ends after six turns with the results, the winner and the two awards',
    async () => {
      const g = await game(FIVE);
      const rival = g.b[0] as Person;
      for (let turn = 1; turn <= TABU_GAME.totalTurns; turn++) {
        await beginTurn(g);
        const teller = await describer(g);
        // Mor scores twice a turn, Pembe once; Pembe catches a Yasak! on Mor's first turn.
        if (turn % 2 === 1) {
          expect(await mark(teller, g, 'correct')).toEqual(OK);
          expect(await mark(teller, g, 'correct')).toEqual(OK);
          if (turn === 1) expect(await mark(rival, g, 'taboo')).toEqual(OK);
        } else {
          expect(await mark(teller, g, 'correct')).toEqual(OK);
        }
        await runOut(g);
        if (turn < TABU_GAME.totalTurns) {
          const st = await state(g.roomId);
          expect(st.phase).toBe('summary');
          expect(await tabu(g.owner, { action: 'next', roomId: g.roomId, step: st.step })).toEqual(
            OK,
          );
        }
      }
      const row = await roomRow(g.roomId);
      expect(row.concept).toBeNull();
      const result = (row.game_state as { lastGame: { concept: string; tabu: unknown } }).lastGame;
      expect(result.concept).toBe('tabu');
      // Mor 2+2+2−1 = 5, Pembe 3. Mor's describers: a1 turns 1 and 5, a2 turn 3.
      expect(result.tabu).toMatchObject({
        scores: { a: 5, b: 3 },
        winner: 'a',
        topDescriber: { sid: g.a[0]?.sessionId, count: 4 },
        tabooHunter: { sid: rival.sessionId, count: 1 },
        lastTurn: { turnNo: 6, team: 'b' },
      });

      const results = await sql`
        select ts.id as session_id, gr.score, gr.won, gr.mode
        from public.game_results gr
        join public.table_sessions ts on ts.user_id = gr.user_id and ts.status = 'active'
        where gr.room_id = ${g.roomId} and gr.concept = 'tabu'
      `;
      expect(results).toHaveLength(4);
      for (const r of results) {
        const mor = g.a.some((p) => p.sessionId === r.session_id);
        expect(r).toMatchObject({ mode: 'voice', score: mor ? 5 : 3, won: mor });
      }
    },
    SLOW,
  );
});

describe('leaving (§4.6.1)', () => {
  it(
    'hands Tur öncesi to the team’s next player and ends the game when a team is empty',
    async () => {
      // The owner plays for Pembe; Mor is two others.
      const g = await game(['b', 'a', 'a', 'b', 'b']);
      const [first, second] = g.a as [Person, Person];
      expect((await state(g.roomId)).describer).toBe(first.sessionId);
      expect(await rooms(first, { action: 'leave-game', roomId: g.roomId })).toEqual(OK);
      expect(await state(g.roomId)).toMatchObject({
        phase: 'ready',
        describer: second.sessionId,
        gone: [first.sessionId],
      });
      // Who left gets no card and presses nothing.
      await beginTurn(g);
      expect(await cards(first, g)).toEqual({ status: 403, body: errorBody('not_describer') });
      expect(await mark(first, g, 'correct')).toEqual({
        status: 403,
        body: errorBody('not_describer'),
      });

      // Mor empties: its phase runs out now and the next advance ends the game.
      expect(await rooms(second, { action: 'leave-game', roomId: g.roomId })).toEqual(OK);
      expect(await tabu(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const row = await roomRow(g.roomId);
      expect(row.concept).toBeNull();
      expect((row.game_state as { lastGame: { tabu: unknown } }).lastGame.tabu).toMatchObject({
        scores: { a: 0, b: 0 },
        winner: null,
        gone: [first.sessionId, second.sessionId],
      });
      // Only those still in the game get a result.
      const results = await sql`
        select count(*)::integer as n from public.game_results
        where room_id = ${g.roomId} and concept = 'tabu'
      `;
      expect(results[0]?.n).toBe(3);
    },
    SLOW,
  );
});
