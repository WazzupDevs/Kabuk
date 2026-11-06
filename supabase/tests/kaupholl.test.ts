// Faz 4 step 4.6.10 (docs/SPEC_V4.md §4.F "Adım 4.6.10: Kaupholl", K-87; docs/decisions/kaupholl.md
// §7 "PR B"): five questions, a number from everyone, a board of the guesses, two coins each. The
// question, the guesses and the answer leave the server only when their phase opens (rule 3); the
// deck and its counts are closed to every client. The clock is the server's: a test runs a phase out
// by moving its endsAt into the past. The deck here is the tests' own fake one.
import { readFileSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '../functions/_shared/pure/database.ts';
import {
  KAUPHOLL,
  type KauphollAnswer,
  type KauphollSecret,
  type KauphollState,
  type KauphollView,
} from '../functions/_shared/pure/kaupholl.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { anonKey, apiUrl, dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import { type Person, person, roomRow, rooms, TABLE_PHONES, tableWith } from './people.ts';

let venue: Record<string, string> = {};

// The fake deck: answers and notes no other number or word in a test can be mistaken for.
type Row = { id: string; difficulty: 'easy' | 'medium' | 'hard'; bias?: string; category?: string };
const ANSWER = (n: number) => 770_001 + n;
const NOTE = (n: number) => `GIZLI_NOT_${n}`;
const TEXT = (n: number) => `Örnek soru ${n}: kaç birim?`;

function deck(kinds: Row['difficulty'][]): Row[] {
  return kinds.map((difficulty, n) => ({ id: `t-${n}`, difficulty, category: `c${n % 4}` }));
}

const FULL = deck([
  'easy',
  'easy',
  'easy',
  'easy',
  'medium',
  'medium',
  'medium',
  'medium',
  'hard',
  'hard',
  'hard',
  'hard',
]);

async function setDeck(rows: Row[]): Promise<void> {
  await sql`delete from public.kaupholl_questions where true`;
  for (const [n, q] of rows.entries()) {
    await sql`
      insert into public.kaupholl_questions
        (id, body, unit, decimals, answer, note, difficulty, bias, category, verification)
      values (${q.id}, ${TEXT(n)}, 'birim', 0, ${ANSWER(n)}, ${NOTE(n)}, ${q.difficulty},
              ${q.bias ?? 'neutral'}, ${q.category ?? 'c'}, 'independent')
    `;
  }
}

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

// The frame's tests close every game after each of theirs; this file plays Kaupholl.
beforeEach(async () => {
  await sql`update public.games set is_available = true where id = 'kaupholl'`;
  await setDeck(FULL);
});

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  // Kaupholl is "Yakında" in content/games.json until its screens come (K-87).
  await sql`update public.games set is_available = false where id = 'kaupholl'`;
  await sql`delete from public.kaupholl_questions where true`;
  await deleteFixtureVenues(sql);
  await sql.end();
});

const SLOW = 120_000;
const kp = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'kaupholl', body);

type Game = { roomId: string; owner: Person; people: Person[]; players: Person[] };

// `count` people at the owner's table, the page opened and (unless `start` is false) the game
// started (`watch`: these pick "Gözlemci ol" first).
async function table(count: number, opts: { watch?: number[] } = {}): Promise<Game> {
  const people = await Promise.all(Array.from({ length: count }, (_, n) => person(venue, n)));
  const [owner, ...others] = people as [Person, ...Person[]];
  const roomId = await tableWith(owner, others);
  expect(await rooms(owner, { action: 'open-game', roomId, concept: 'kaupholl' })).toEqual({
    status: 200,
    body: { ok: true },
  });
  for (const n of opts.watch ?? []) {
    expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick: 'obs' })).toMatchObject(
      { status: 200 },
    );
  }
  const watch = new Set(opts.watch ?? []);
  return { roomId, owner, people, players: people.filter((_, n) => !watch.has(n)) };
}

async function game(count: number, opts: { watch?: number[] } = {}): Promise<Game> {
  const g = await table(count, opts);
  expect(await kp(g.owner, { action: 'start', roomId: g.roomId })).toEqual({
    status: 200,
    body: { applied: true },
  });
  return g;
}

type Row2 = KauphollState & { gameNo: number; lastGame?: Record<string, unknown> };

async function state(roomId: string): Promise<Row2> {
  return (await roomRow(roomId)).game_state as Row2;
}

async function secret(roomId: string): Promise<KauphollSecret & { rev: number }> {
  const [row] = await sql`
    select gs.secret from public.game_secrets gs
    join public.rooms r on r.id = gs.room_id
    where gs.room_id = ${roomId} and gs.game_no = (r.game_state ->> 'gameNo')::integer
  `;
  return row?.secret as KauphollSecret & { rev: number };
}

async function expire(roomId: string): Promise<void> {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
    where id = ${roomId}
  `;
}

async function runOut(g: Game, by: Person = g.owner): Promise<Row2> {
  await expire(g.roomId);
  const s = await state(g.roomId);
  const res = await kp(by, { action: 'advance', roomId: g.roomId, step: s.step });
  expect(res.status).toBe(200);
  expect((res.body as KauphollAnswer).applied).toBe(true);
  return state(g.roomId);
}

async function reveal(g: Game, by: Person = g.owner): Promise<Row2> {
  const s = await state(g.roomId);
  const res = await kp(by, { action: 'reveal', roomId: g.roomId, step: s.step });
  expect(res.status).toBe(200);
  return state(g.roomId);
}

const guess = (p: Person, g: Game, step: number, seq: number, value: number, lock = true) =>
  kp(p, { action: 'guess', roomId: g.roomId, step, seq, value, lock });

const bet = (
  p: Person,
  g: Game,
  step: number,
  seq: number,
  coins: [number | null, number | null],
  lock = true,
) => kp(p, { action: 'bet', roomId: g.roomId, step, seq, coins, lock });

async function view(
  p: Person,
  roomId: string,
): Promise<{ room: KauphollState; view: KauphollView }> {
  const res = await kp(p, { action: 'view', roomId });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as { room: KauphollState; view: KauphollView };
}

async function readyAll(g: Game): Promise<Row2> {
  const s = await state(g.roomId);
  for (const p of g.players) {
    if (s.gone.includes(p.sessionId)) continue;
    await kp(p, { action: 'ready', roomId: g.roomId, step: s.step });
  }
  return state(g.roomId);
}

// The question in play, as the secret has it.
async function current(g: Game) {
  const [s, sec] = await Promise.all([state(g.roomId), secret(g.roomId)]);
  return sec.questions[s.round] as KauphollSecret['questions'][number];
}

// A whole question: each player guesses `guesses[i]` (null: none) and bets `bets[i]`; then the
// answer and the end of the question by Hazırım.
async function playQuestion(
  g: Game,
  guesses: (number | null)[],
  bets: ([number | null, number | null] | null)[],
): Promise<Row2> {
  let s = await reveal(g);
  expect(s.phase).toBe('guess');
  for (const [i, p] of g.players.entries()) {
    const value = guesses[i];
    if (value === null || value === undefined) continue;
    expect((await guess(p, g, s.step, 1, value)).status).toBe(200);
  }
  s = await state(g.roomId);
  if (s.phase === 'guess') s = await runOut(g);
  if (s.phase === 'board') {
    for (const [i, p] of g.players.entries()) {
      const coins = bets[i];
      if (!coins) continue;
      expect((await bet(p, g, s.step, 1, coins)).status).toBe(200);
    }
    s = await state(g.roomId);
    if (s.phase === 'board') s = await runOut(g);
  }
  expect(s.phase).toBe('answer');
  return s;
}

async function finishQuestion(g: Game): Promise<Row2> {
  let s = await readyAll(g);
  expect(s.phase).toBe('summary');
  s = await readyAll(g);
  return s;
}

describe('kaupholl: rules (§4.6.10)', () => {
  it('keeps the same numbers as pure/kaupholl.ts', async () => {
    const [row] = await sql`select private.kaupholl_config() as c`;
    const c = row?.c as Record<string, number>;
    for (const key of Object.keys(c)) {
      expect(c[key], key).toBe(KAUPHOLL[key as keyof typeof KAUPHOLL]);
    }
    const [g] =
      await sql`select min_players, max_players, teams, pregame from public.games where id = 'kaupholl'`;
    expect(g).toEqual({ min_players: 3, max_players: 6, teams: false, pregame: true });
  });
});

describe('kaupholl: the deck is closed (§4 "İçe aktarma")', () => {
  it('reads nothing of the deck, its counts or a table’s questions as anon or a signed-in person', async () => {
    const anon = createClient<Database>(apiUrl, anonKey, { auth: { persistSession: false } });
    const p = await person(venue, 0);
    for (const client of [anon, p.client]) {
      for (const t of [
        'kaupholl_questions',
        'kaupholl_question_stats',
        'kaupholl_used_questions',
        'kaupholl_counters',
      ] as const) {
        const res = await client.from(t).select('*');
        expect(res.error?.code, t).toBe('42501');
        expect(res.data, t).toBeNull();
      }
    }
  });

  it('keeps no person, table or time in the question statistics', async () => {
    const cols = await sql`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'kaupholl_question_stats'
      order by column_name
    `;
    expect(cols.map((c) => c.column_name)).toEqual([
      'games',
      'guesses',
      'no_guess',
      'question_id',
      'smaller_wins',
      'sum_abs_log_err',
      'win_bucket',
    ]);
  });
});

describe('kaupholl: a game (§4.6.10)', { timeout: SLOW }, () => {
  it('plays five questions with three players and a watcher; the points are the board’s', async () => {
    const g = await game(4, { watch: [3] });
    const watcher = g.people[3] as Person;
    let s = await state(g.roomId);
    expect(s.seats.sort()).toEqual(g.players.map((p) => p.sessionId).sort());
    expect(s.phase).toBe('card');
    const expected: Record<string, number> = Object.fromEntries(
      g.players.map((p) => [p.sessionId, 0]),
    );
    for (let round = 0; round < KAUPHOLL.questions; round += 1) {
      const q = await current(g);
      const [a, b, c] = g.players as [Person, Person, Person];
      // a under the answer (wins), b over, c far over; a's coins on its own slice, b on Hepsinden
      // küçük, c none.
      s = await playQuestion(
        g,
        [q.answer - 1, q.answer + 5, q.answer + 50],
        [[1, 1], [0, 2], null],
      );
      expect(s.winner).toBe(1);
      expect(s.answer?.value).toBe(q.answer);
      // a: two coins on slice 1 (odds 2 of 3 guesses) + 3; b: one on slice 2 lost.
      expected[a.sessionId] = (expected[a.sessionId] ?? 0) + 2 * 2 + 3;
      expect(s.scores).toEqual(expected);
      expect(s.points[b.sessionId]).toBe(0);
      expect(s.points[c.sessionId]).toBe(0);
      s = await finishQuestion(g);
      if (round < KAUPHOLL.questions - 1) {
        expect(s.phase).toBe('card');
        expect(s.round).toBe(round + 1);
      }
    }
    const r = await roomRow(g.roomId);
    expect(r.concept).toBeNull();
    const last = (r.game_state as Row2).lastGame?.kaupholl as KauphollState;
    expect(last.phase).toBe('over');
    expect(last.winners).toEqual([(g.players[0] as Person).sessionId]);
    const results = await sql`
      select user_id, score, won from public.game_results
      where room_id = ${g.roomId} and concept = 'kaupholl' order by score desc
    `;
    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({
      user_id: (g.players[0] as Person).userId,
      score: 35,
      won: true,
    });
    expect(results.some((x) => x.user_id === watcher.userId)).toBe(false);
    const stats = await sql`select sum(games)::int as games from public.kaupholl_question_stats`;
    expect(stats[0]?.games).toBe(5);
  });

  it('plays six players; nobody guessing skips the board and nobody wins on zero points', async () => {
    const g = await game(6);
    let s = await state(g.roomId);
    expect(s.seats).toHaveLength(6);
    for (let round = 0; round < KAUPHOLL.questions; round += 1) {
      s = await reveal(g);
      s = await runOut(g);
      expect(s.phase).toBe('answer');
      expect(s.noGuesses).toBe(true);
      expect(s.board).toBeNull();
      s = await finishQuestion(g);
    }
    const last = (await state(g.roomId)).lastGame?.kaupholl as KauphollState;
    expect(last.winners).toEqual([]);
    const results = await sql`
      select won from public.game_results where room_id = ${g.roomId} and concept = 'kaupholl'
    `;
    expect(results).toHaveLength(6);
    expect(results.every((x) => x.won === false)).toBe(true);
    const [stats] = await sql`select sum(no_guess)::int as n from public.kaupholl_question_stats`;
    expect(stats?.n).toBe(5);
  });

  it('gives "Hepsinden küçük" the win when every guess passes the answer, with no +3', async () => {
    const g = await game(3);
    const q = await current(g);
    const s = await playQuestion(
      g,
      [q.answer + 1, q.answer + 2, q.answer + 3],
      [[0, 0], [1, 1], null],
    );
    expect(s.winner).toBe(0);
    const [a, b, c] = g.players as [Person, Person, Person];
    // 3 guesses: Hepsinden küçük has odds 6.
    expect(s.points).toEqual({ [a.sessionId]: 12, [b.sessionId]: 0, [c.sessionId]: 0 });
    const [stats] = await sql`select smaller_wins, win_bucket from public.kaupholl_question_stats`;
    expect(stats).toEqual({ smaller_wins: 1, win_bucket: [1, 0, 0, 0, 0, 0] });
  });

  it('merges equal guesses; each author of the winning guess gets +3', async () => {
    const g = await game(3);
    const q = await current(g);
    const s = await playQuestion(g, [q.answer, q.answer, q.answer + 9], [null, null, null]);
    expect(s.board).toHaveLength(3);
    expect(s.board?.[1]?.authors.sort()).toEqual(
      [(g.players[0] as Person).sessionId, (g.players[1] as Person).sessionId].sort(),
    );
    expect(s.points[(g.players[0] as Person).sessionId]).toBe(3);
    expect(s.points[(g.players[1] as Person).sessionId]).toBe(3);
  });

  it('never deals a hard question fifth', async () => {
    for (let i = 0; i < 3; i += 1) {
      const g = await game(3);
      const sec = await secret(g.roomId);
      expect(sec.questions).toHaveLength(5);
      expect(sec.questions[4]?.difficulty).not.toBe('hard');
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });
});

describe('kaupholl: leaks (rule 3)', { timeout: SLOW }, () => {
  it('sends no question before its card, no guess before the board, no answer before its phase', async () => {
    const g = await game(4, { watch: [3] });
    const [a, b] = g.players as [Person, Person];
    const watcher = g.people[3] as Person;
    const q = await current(g);
    const secrets = [q.text, String(q.answer), q.note];
    const leak = (x: unknown, hidden: string[]) => {
      const json = JSON.stringify(x);
      for (const h of hidden) expect(json, h).not.toContain(h);
    };

    // The card: no question anywhere.
    let s = await state(g.roomId);
    leak(s, secrets);
    leak((await kp(a, { action: 'view', roomId: g.roomId })).body, secrets);
    leak((await kp(watcher, { action: 'view', roomId: g.roomId })).body, secrets);

    // The guesses: the question shows, the numbers and the answer do not.
    s = await reveal(g, b);
    expect(s.card?.text).toBe(q.text);
    const mine = 123_457;
    const answers = [
      await guess(a, g, s.step, 1, mine, false),
      await guess(a, g, s.step, 1, mine + 1, false), // seq_conflict
      await guess(a, g, s.step - 1, 2, mine, false), // phase_over
    ];
    expect(answers[1]?.status).toBe(409);
    expect(answers[1]).toMatchObject({ body: errorBody('seq_conflict') });
    expect((answers[2]?.body as KauphollAnswer).applied).toBe(false);
    s = await state(g.roomId);
    expect(s.chips[a.sessionId]).toBe('written');
    leak(s, [String(mine), String(q.answer), q.note]);
    for (const res of answers) leak(res.body, [String(q.answer), q.note]);
    leak(answers[1]?.body, [String(mine)]);
    leak(await view(b, g.roomId), [String(mine), String(q.answer), q.note]);
    leak(await view(watcher, g.roomId), [String(mine), String(q.answer), q.note]);
    expect((await view(a, g.roomId)).view).toMatchObject({
      role: 'player',
      guess: { value: mine, seq: 1, locked: false },
    });
    expect((await view(watcher, g.roomId)).view).toEqual({ role: 'observer' });
    const events = await sql`select payload from public.game_events where room_id = ${g.roomId}`;
    leak(events, [q.text, String(mine), String(q.answer), q.note]);

    // The board: the guesses show, the answer does not.
    s = await runOut(g);
    expect(s.phase).toBe('board');
    expect(JSON.stringify(s)).toContain(String(mine));
    leak(s, [String(q.answer), q.note]);
    const locked = await guess(a, g, s.step - 1, 5, mine, true);
    leak(locked.body, [String(q.answer), q.note]);

    // The answer.
    s = await runOut(g);
    expect(s.answer).toMatchObject({ value: q.answer, note: q.note });
  });
});

describe('kaupholl: seq (§2)', { timeout: SLOW }, () => {
  it('applies a greater seq, repeats the same, refuses the same seq with other content and an older one', async () => {
    const g = await game(3);
    const [a] = g.players as [Person];
    const s = await reveal(g);
    expect(await guess(a, g, s.step, 2, 40, false)).toMatchObject({
      status: 200,
      body: { applied: true, result: { action: 'guess', seq: 2, value: 40, locked: false } },
    });
    expect(await guess(a, g, s.step, 1, 41, false)).toMatchObject({
      status: 200,
      body: { applied: false, reason: 'outdated' },
    });
    expect(await guess(a, g, s.step, 2, 40, false)).toMatchObject({
      status: 200,
      body: { applied: true, replayed: true, result: { seq: 2, value: 40 } },
    });
    const conflict = await guess(a, g, s.step, 2, 42, false);
    expect(conflict.status).toBe(409);
    expect(conflict).toMatchObject({ body: errorBody('seq_conflict') });
    expect((await view(a, g.roomId)).view).toMatchObject({ guess: { value: 40, seq: 2 } });
    // Kesinleştir: nothing changes it any more; the same lock again is the same answer.
    expect(await guess(a, g, s.step, 7, 45, true)).toMatchObject({
      body: { applied: true, result: { value: 45, locked: true } },
    });
    expect(await guess(a, g, s.step, 8, 46, false)).toMatchObject({
      body: { applied: false, reason: 'locked' },
    });
    expect(await guess(a, g, s.step, 7, 45, true)).toMatchObject({
      body: { applied: true, replayed: true, result: { value: 45, locked: true } },
    });
    expect((await view(a, g.roomId)).view).toMatchObject({
      guess: { value: 45, seq: 7, locked: true },
    });
    const bad = await guess(a, g, s.step, 10_001, 1, false);
    expect(bad.status).toBe(400);
  });

  it('does not apply a guess that arrives at endsAt or after; the recorded one stands', async () => {
    const g = await game(3);
    const [a] = g.players as [Person];
    let s = await reveal(g);
    await guess(a, g, s.step, 1, 10, false);
    // Just before: applied.
    await sql`
      update public.rooms
      set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(clock_timestamp() + interval '2 seconds'))
      where id = ${g.roomId}
    `;
    expect(await guess(a, g, s.step, 2, 11, false)).toMatchObject({ body: { applied: true } });
    await expire(g.roomId);
    expect(await guess(a, g, s.step, 3, 12, false)).toMatchObject({
      body: { applied: false, reason: 'phase_over' },
    });
    s = await runOut(g);
    expect(s.board?.[1]).toMatchObject({ value: 11, authors: [a.sessionId] });
  });

  it('keeps a bet’s whole placement; Yatırdım locks it; the lock carries the last one', async () => {
    const g = await game(3);
    const [a, b, c] = g.players as [Person, Person, Person];
    let s = await reveal(g);
    await guess(a, g, s.step, 1, 1, true);
    await guess(b, g, s.step, 1, 2, true);
    s = await state(g.roomId);
    expect(s.phase).toBe('guess');
    await guess(c, g, s.step, 1, 3, true);
    s = await state(g.roomId);
    expect(s.phase).toBe('board');
    expect(await bet(a, g, s.step, 1, [1, null], false)).toMatchObject({ body: { applied: true } });
    expect(await bet(a, g, s.step, 2, [2, 3], true)).toMatchObject({
      body: { applied: true, result: { coins: [2, 3], locked: true } },
    });
    expect(await bet(a, g, s.step, 3, [0, 0], false)).toMatchObject({
      body: { applied: false, reason: 'locked' },
    });
    expect(await bet(a, g, s.step, 2, [3, 2], true)).toMatchObject({
      body: { applied: true, replayed: true },
    });
    // Locked: the same seq with other coins is not a conflict any more, only locked.
    expect(await bet(a, g, s.step, 2, [1, 1], true)).toMatchObject({
      body: { applied: false, reason: 'locked' },
    });
    expect((await bet(a, g, s.step, 4, [9, null], false)).status).toBe(400);
    s = await state(g.roomId);
    expect(s.bets[a.sessionId]).toMatchObject({ coins: [2, 3], locked: true });
    expect((await view(a, g.roomId)).view).toMatchObject({
      bet: { coins: [2, 3], seq: 2, locked: true },
    });
  });
});

describe('kaupholl: the clock (§2, IDEMPOTENT_CALLS)', { timeout: SLOW }, () => {
  it('changes nothing with an early advance, and the same call twice gives the same state', async () => {
    const g = await game(3, {});
    const [a, b] = g.players as [Person, Person];
    let s = await state(g.roomId);
    for (let i = 0; i < 2; i += 1) {
      expect(await kp(a, { action: 'advance', roomId: g.roomId, step: s.step })).toMatchObject({
        status: 200,
        body: { applied: false, reason: 'unchanged' },
      });
    }
    expect((await state(g.roomId)).phase).toBe('card');
    // view and pool twice.
    expect(await view(b, g.roomId)).toEqual(await view(b, g.roomId));
    // The card: two presses, one opening; the clock starts once.
    const r1 = await kp(a, { action: 'reveal', roomId: g.roomId, step: s.step });
    const after = await state(g.roomId);
    const r2 = await kp(b, { action: 'reveal', roomId: g.roomId, step: s.step });
    expect(r1).toMatchObject({ status: 200, body: { applied: true } });
    expect(r2).toMatchObject({ status: 200, body: { applied: false, reason: 'unchanged' } });
    expect(await state(g.roomId)).toEqual(after);
    // A guess and a bet twice: the same answer, the same state.
    s = after;
    const g1 = await guess(a, g, s.step, 1, 5, true);
    const g2 = await guess(a, g, s.step, 1, 5, true);
    expect(g2.body).toEqual({ ...(g1.body as object), replayed: true });
    // The 45 seconds, and an advance after a long wait moves one phase only.
    await expire(g.roomId);
    s = await state(g.roomId);
    const adv1 = await kp(b, { action: 'advance', roomId: g.roomId, step: s.step });
    expect(adv1).toMatchObject({ body: { applied: true } });
    const board = await state(g.roomId);
    expect(board.phase).toBe('board');
    expect(Date.parse(board.endsAt) - Date.now()).toBeGreaterThan(15_000);
    const adv2 = await kp(b, { action: 'advance', roomId: g.roomId, step: s.step });
    expect(adv2).toMatchObject({ body: { applied: false, reason: 'unchanged' } });
    expect(await state(g.roomId)).toEqual(board);
    const b1 = await bet(a, g, board.step, 1, [1, null], true);
    const b2 = await bet(a, g, board.step, 1, [1, null], true);
    expect(b2.body).toEqual({ ...(b1.body as object), replayed: true });
    // The 20 seconds, then Hazırım twice.
    const answer = await runOut(g);
    expect(answer.phase).toBe('answer');
    expect(await kp(a, { action: 'ready', roomId: g.roomId, step: answer.step })).toMatchObject({
      body: { applied: true },
    });
    const once = await state(g.roomId);
    expect(await kp(a, { action: 'ready', roomId: g.roomId, step: answer.step })).toMatchObject({
      body: { applied: false, reason: 'unchanged' },
    });
    expect(await state(g.roomId)).toEqual(once);
    // The 10 seconds of the answer.
    expect((await runOut(g)).phase).toBe('summary');
  });

  it('opens the card by itself after 10 seconds; everyone locked moves on at once', async () => {
    const g = await game(3);
    let s = await state(g.roomId);
    expect(Date.parse(s.endsAt) - Date.now()).toBeLessThanOrEqual(10_000);
    s = await runOut(g);
    expect(s.phase).toBe('guess');
    expect(Date.parse(s.endsAt) - Date.now()).toBeGreaterThan(40_000);
    for (const p of g.players) await guess(p, g, s.step, 1, 7, true);
    expect((await state(g.roomId)).phase).toBe('board');
  });

  it('locks a recorded guess by itself when time runs out; it scores like a locked one', async () => {
    const g = await game(3);
    const [a, b] = g.players as [Person, Person];
    const q = await current(g);
    let s = await reveal(g);
    await guess(a, g, s.step, 1, q.answer, false);
    await guess(b, g, s.step, 1, q.answer, true);
    s = await runOut(g);
    expect(s.phase).toBe('board');
    expect(s.chips[a.sessionId]).toBe('locked');
    expect(s.board?.map((x) => x.authors.length)).toEqual([0, 2]);
    expect((await view(a, g.roomId)).view).toMatchObject({ guess: { locked: true } });
    // After the move, a guess is phase_over and changes nothing.
    expect(await guess(a, g, s.step - 1, 2, 1, false)).toMatchObject({
      body: { applied: false, reason: 'phase_over' },
    });
    s = await runOut(g);
    expect(s.points[a.sessionId]).toBe(3);
    expect(s.points[b.sessionId]).toBe(3);
    // The third player wrote nothing: no slice.
    expect(s.board).toHaveLength(2);
  });

  it('moves once when two phones advance at the same moment', async () => {
    const g = await game(3);
    const [a, b, c] = g.players as [Person, Person, Person];
    await expire(g.roomId);
    const s = await state(g.roomId);
    const both = await Promise.all(
      [a, b, c].map((p) => kp(p, { action: 'advance', roomId: g.roomId, step: s.step })),
    );
    expect(both.every((r) => r.status === 200)).toBe(true);
    expect(both.filter((r) => (r.body as KauphollAnswer).applied)).toHaveLength(1);
    const after = await state(g.roomId);
    expect(after.phase).toBe('guess');
    expect(after.step).toBe(s.step + 1);
  });

  it('moves once when the last two lock at the same moment', async () => {
    const g = await game(3);
    const [a, b, c] = g.players as [Person, Person, Person];
    const s = await reveal(g);
    await guess(a, g, s.step, 1, 1, true);
    await Promise.all([guess(b, g, s.step, 1, 2, true), guess(c, g, s.step, 1, 3, true)]);
    const after = await state(g.roomId);
    expect(after.phase).toBe('board');
    expect(after.step).toBe(s.step + 1);
    expect(after.board).toHaveLength(4);
  });
});

describe('kaupholl: early moves at the same moment (§2)', { timeout: SLOW }, () => {
  it('moves once when the last Hazırım and an advance come together', async () => {
    const g = await game(3);
    const [a, b, c] = g.players as [Person, Person, Person];
    await playQuestion(g, [1, 2, 3], [null, null, null]);
    const s = await state(g.roomId);
    for (const p of [a, b]) await kp(p, { action: 'ready', roomId: g.roomId, step: s.step });
    await expire(g.roomId);
    const both = await Promise.all([
      kp(c, { action: 'ready', roomId: g.roomId, step: s.step }),
      kp(a, { action: 'advance', roomId: g.roomId, step: s.step }),
    ]);
    expect(both.every((r) => r.status === 200)).toBe(true);
    const after = await state(g.roomId);
    expect(after.phase).toBe('summary');
    expect(after.step).toBe(s.step + 1);
  });

  it('moves once when the last two Yatırdım come together; both placements count', async () => {
    const g = await game(3);
    const [a, b, c] = g.players as [Person, Person, Person];
    let s = await reveal(g);
    for (const [i, p] of [a, b, c].entries()) await guess(p, g, s.step, 1, i + 1, true);
    s = await state(g.roomId);
    expect(s.phase).toBe('board');
    await bet(a, g, s.step, 1, [1, 1], true);
    await bet(b, g, s.step, 1, [2, null], false);
    const both = await Promise.all([
      bet(c, g, s.step, 1, [3, 3], true),
      bet(b, g, s.step, 2, [0, 0], true),
    ]);
    for (const r of both) expect(r).toMatchObject({ status: 200, body: { applied: true } });
    const after = await state(g.roomId);
    expect(after.phase).toBe('answer');
    expect(after.step).toBe(s.step + 1);
    expect(after.bets[b.sessionId]).toMatchObject({ coins: [0, 0], locked: true });
    expect(after.bets[c.sessionId]).toMatchObject({ coins: [3, 3], locked: true });
  });
});

describe('kaupholl: analytics (§4.6.10)', () => {
  it('sends no event from the game: no guess, answer, question or its id leaves for analytics', () => {
    const source = readFileSync(new URL('../functions/kaupholl/index.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/posthog|capture\(/i);
  });
});

describe('kaupholl: few questions (§4 "İçerik yetersizliği")', { timeout: SLOW }, () => {
  async function exhausted(rows: Row[]) {
    await setDeck(rows);
    const g = await table(3);
    const before = await roomRow(g.roomId);
    const [n0] = await sql`select n from public.kaupholl_counters where name = 'exhausted'`;
    const res = await kp(g.owner, { action: 'start', roomId: g.roomId });
    expect(res.status).toBe(409);
    expect(res).toMatchObject({ body: errorBody('questions_exhausted') });
    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/\d/);
    expect(json).not.toContain('Örnek');
    const after = await roomRow(g.roomId);
    expect(after.game_state).toEqual(before.game_state);
    expect(after.concept).toBeNull();
    const used =
      await sql`select 1 from public.kaupholl_used_questions where room_id = ${g.roomId}`;
    expect(used).toHaveLength(0);
    const players = await sql`select 1 from public.game_players where room_id = ${g.roomId}`;
    expect(players).toHaveLength(0);
    const [n1] = await sql`select n from public.kaupholl_counters where name = 'exhausted'`;
    expect(Number(n1?.n)).toBe(Number(n0?.n) + 1);
  }

  it('starts no game with four unused questions', async () => {
    await exhausted(deck(['easy', 'easy', 'medium', 'medium']));
  });

  it('starts no game with six unused ones that are all hard', async () => {
    await exhausted(deck(['hard', 'hard', 'hard', 'hard', 'hard', 'hard']));
  });

  it('never gives a table a question twice; the pool says how many are left, to the owner only', async () => {
    await setDeck(
      deck([
        'easy',
        'easy',
        'medium',
        'medium',
        'hard',
        'easy',
        'easy',
        'medium',
        'medium',
        'hard',
      ]),
    );
    const g = await table(4, { watch: [3] });
    const [, b] = g.players as [Person, Person];
    for (const p of [b, g.people[3] as Person]) {
      const res = await kp(p, { action: 'pool', roomId: g.roomId });
      expect(res).toMatchObject({ body: errorBody('not_owner') });
    }
    const pool1 = await kp(g.owner, { action: 'pool', roomId: g.roomId });
    expect(pool1).toEqual({ status: 200, body: { unused: 10 } });
    expect(await kp(g.owner, { action: 'pool', roomId: g.roomId })).toEqual(pool1);
    expect(await kp(g.owner, { action: 'start', roomId: g.roomId })).toMatchObject({
      body: { applied: true },
    });
    const first = (await secret(g.roomId)).questions.map((q) => q.id);
    expect(await rooms(g.owner, { action: 'end-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    expect(
      await rooms(g.owner, { action: 'open-game', roomId: g.roomId, concept: 'kaupholl' }),
    ).toMatchObject({ status: 200 });
    await rooms(g.people[3] as Person, { action: 'pick', roomId: g.roomId, pick: 'obs' });
    expect(await kp(g.owner, { action: 'pool', roomId: g.roomId })).toEqual({
      status: 200,
      body: { unused: 5 },
    });
    expect(await kp(g.owner, { action: 'start', roomId: g.roomId })).toMatchObject({
      body: { applied: true },
    });
    const second = (await secret(g.roomId)).questions.map((q) => q.id);
    expect(second.filter((id) => first.includes(id))).toEqual([]);
    await rooms(g.owner, { action: 'end-game', roomId: g.roomId });
    await rooms(g.owner, { action: 'open-game', roomId: g.roomId, concept: 'kaupholl' });
    const third = await kp(g.owner, { action: 'start', roomId: g.roomId });
    expect(third).toMatchObject({ body: errorBody('questions_exhausted') });
  });
});

describe('kaupholl: leaving (§4.6.10 "Çıkış")', { timeout: SLOW }, () => {
  it('drops the guess of one who leaves while guessing; the phase ends when it waited only for them', async () => {
    const g = await game(4);
    const [, b, c, d] = g.players as [Person, Person, Person, Person];
    const s = await reveal(g);
    await guess(b, g, s.step, 1, 50, false);
    for (const p of [g.owner, c]) await guess(p, g, s.step, 1, 60, true);
    await guess(d, g, s.step, 1, 70, true);
    expect(await rooms(b, { action: 'leave-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    const after = await state(g.roomId);
    expect(after.gone).toEqual([b.sessionId]);
    expect(after.chips[b.sessionId]).toBeUndefined();
    expect((await secret(g.roomId)).guesses[b.sessionId]).toBeUndefined();
    expect(Date.parse(after.endsAt)).toBeLessThanOrEqual(Date.now());
    const board = await runOut(g);
    expect(board.board?.flatMap((x) => x.authors)).not.toContain(b.sessionId);
  });

  it('keeps the slice of one who leaves after the board, without their coins or points', async () => {
    const g = await game(4);
    const [a, b, c, d] = g.players as [Person, Person, Person, Person];
    const q = await current(g);
    let s = await reveal(g);
    await guess(a, g, s.step, 1, q.answer, true);
    await guess(b, g, s.step, 1, q.answer, true);
    await guess(c, g, s.step, 1, q.answer + 1, true);
    await guess(d, g, s.step, 1, q.answer + 2, true);
    s = await state(g.roomId);
    expect(s.phase).toBe('board');
    await bet(b, g, s.step, 1, [1, 1], false);
    expect(await rooms(b, { action: 'leave-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    s = await state(g.roomId);
    expect(s.bets[b.sessionId]).toBeUndefined();
    expect(s.board?.[1]?.authors).toContain(b.sessionId);
    s = await runOut(g);
    expect(s.points[a.sessionId]).toBe(3);
    expect(s.points[b.sessionId]).toBeUndefined();
    expect(s.scores[b.sessionId]).toBe(0);
  });

  it('abandons the game below two players: no winner, no results', async () => {
    const g = await game(3);
    const [, b, c] = g.players as [Person, Person, Person];
    await reveal(g);
    await rooms(b, { action: 'leave-game', roomId: g.roomId });
    expect((await roomRow(g.roomId)).concept).toBe('kaupholl');
    await rooms(c, { action: 'leave-game', roomId: g.roomId });
    const r = await roomRow(g.roomId);
    expect(r.concept).toBeNull();
    expect((r.game_state as Row2).lastGame).toMatchObject({ concept: 'kaupholl', abandoned: true });
    const results = await sql`select 1 from public.game_results where room_id = ${g.roomId}`;
    expect(results).toHaveLength(0);
  });

  it('ends with the owner’s "Oyunu bitir" the same way', async () => {
    const g = await game(3);
    await reveal(g);
    expect(await rooms(g.owner, { action: 'end-game', roomId: g.roomId })).toMatchObject({
      status: 200,
    });
    const r = await roomRow(g.roomId);
    expect(r.concept).toBeNull();
    expect((r.game_state as Row2).lastGame).toMatchObject({ concept: 'kaupholl', abandoned: true });
    const res = await guess(g.owner, g, 2, 1, 1, false);
    expect(res).toMatchObject({ body: errorBody('no_game') });
  });
});

// Rule 10: check-in → rooms → game_players → game_secrets → kaupholl_used_questions →
// kaupholl_question_stats. A write (kaupholl_commit) takes the table, then the secret; a leaving
// holds the table while it stamps game_players and its trigger takes the secret. Either waits for
// the other; neither deadlocks, and the waiting write finds the table changed and writes nothing.
describe('kaupholl: locks (rule 10)', { timeout: SLOW }, () => {
  it('lets a write and a leaving wait for each other in the table’s order; nothing deadlocks', async () => {
    for (const leaveFirst of [true, false]) {
      const g = await game(4);
      await reveal(g);
      const [, stays, leaves] = g.players as [Person, Person, Person];
      const st = await state(g.roomId);
      const sec = await secret(g.roomId);
      const next = { ...st, chips: { ...st.chips, [stays.sessionId]: 'written' } };
      const nextSecret = {
        ...sec,
        guesses: {
          ...sec.guesses,
          [stays.sessionId]: {
            value: 9,
            locked: false,
            seq: 1,
            step: st.step,
            round: 0,
            sent: false,
          },
        },
      };
      const asJson = (x: unknown) => sql.json(x as never);
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const writing = (q: postgres.Sql | postgres.TransactionSql) =>
        q`select (public.kaupholl_commit(
          ${stays.userId}::uuid, ${g.roomId}::uuid, ${asJson(st)}::jsonb, ${sec.rev ?? 0},
          ${stays.sessionId}::uuid, 'before', ${asJson(next)}::jsonb, ${asJson(nextSecret)}::jsonb,
          null
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
          await waitUntilBlocked(leaveFirst ? 'kaupholl_commit' : 'rooms_leave_game');
        });
        const result = await later;
        if (leaveFirst) {
          expect(result).toEqual([{ ok: false }]);
        } else {
          expect(result).toMatchObject([{ id: g.roomId }]);
        }
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      const now = await state(g.roomId);
      expect(now.gone).toEqual([leaves.sessionId]);
      expect(now.chips[stays.sessionId]).toBe(leaveFirst ? 'none' : 'written');
      expect(Boolean((await secret(g.roomId)).guesses[stays.sessionId])).toBe(!leaveFirst);
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });

  it('lets a start wait for the page’s closing; nothing deadlocks', async () => {
    const g = await table(3);
    const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let later: Promise<{ status: number; body: unknown }> = Promise.resolve({
        status: 0,
        body: null,
      });
      await first.begin(async (tx) => {
        await tx`select (public.rooms_end_game(${g.owner.userId}::uuid, ${g.roomId}::uuid)).id`;
        later = kp(g.owner, { action: 'start', roomId: g.roomId });
        await waitUntilBlocked('kaupholl_start');
      });
      // The page closed while the start waited: no game, nothing started.
      const res = await later;
      expect(res).toMatchObject({ body: errorBody('no_game') });
    } finally {
      await first.end();
    }
    expect((await roomRow(g.roomId)).concept).toBeNull();
  });
});
