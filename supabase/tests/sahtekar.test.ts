// Faz 4 step 4.6.3 (docs/SPEC_V4.md §4.F "Adım 4.6.3: Sahtekar", K-71): Krot at a table of people.
// The server deals the roles and the word; the word goes to the players and the watchers, never to
// an impostor, and never into the open state (rule 3). The ballots stay secret until Sonuç. The
// clock is the server's: a test runs a phase out by moving its endsAt into the past.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { SAHTEKAR_GAME } from '../functions/_shared/pure/sahtekarGame.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import { type Person, person, roomRow, rooms, TABLE_PHONES, tableWith } from './people.ts';

let venue: Record<string, string> = {};

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

// The frame's tests close every game after each of theirs; this file plays Krot.
beforeEach(async () => {
  await sql`update public.games set is_available = true where id = 'sahtekar'`;
});

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  // As content/games.json has it (Krot's screens came, 5 Kasım).
  await sql`update public.games set is_available = true where id = 'sahtekar'`;
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
// A game takes up to eight people signed up, checked in and seated, and many calls.
const SLOW = 90_000;
const krot = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'sahtekar', body);

type State = Record<string, unknown> & {
  phase?: string;
  step?: number;
  speaker?: string | null;
  next?: string | null;
  round?: number;
  voted?: string[];
  gone?: string[];
  impostors?: number;
};

type Game = {
  roomId: string;
  owner: Person;
  people: Person[];
  players: Person[];
  impostors: Person[];
  watchers: Person[];
  word: string;
};

async function state(roomId: string): Promise<State> {
  return (await roomRow(roomId)).game_state as State;
}

async function step(roomId: string): Promise<number> {
  return Number((await state(roomId)).step);
}

// `count` people at the owner's table, the page opened and the game started (`watch`: these pick
// "Gözlemci ol" first).
async function game(count: number, watch: number[] = []): Promise<Game> {
  const people = await Promise.all(Array.from({ length: count }, (_, n) => person(venue, n)));
  const [owner, ...others] = people as [Person, ...Person[]];
  const roomId = await tableWith(owner, others);
  expect(await rooms(owner, { action: 'open-game', roomId, concept: 'sahtekar' })).toEqual(OK);
  for (const n of watch) {
    expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick: 'obs' })).toEqual(OK);
  }
  expect(await krot(owner, { action: 'start', roomId })).toEqual(OK);
  const rows = await sql`
    select gp.session_id, gp.role, gs.secret ->> 'word' as word
    from public.game_players gp
    join public.game_secrets gs on gs.room_id = gp.room_id and gs.game_no = gp.game_no
    where gp.room_id = ${roomId}
  `;
  const roles = new Map(rows.map((r) => [r.session_id as string, r.role as string]));
  return {
    roomId,
    owner,
    people,
    players: people.filter((p) => roles.get(p.sessionId) === 'player'),
    impostors: people.filter((p) => roles.get(p.sessionId) === 'impostor'),
    watchers: people.filter((p) => !roles.has(p.sessionId)),
    word: String(rows[0]?.word),
  };
}

async function view(p: Person, roomId: string) {
  const res = await krot(p, { action: 'view', roomId });
  expect(res.status).toBe(200);
  return res.body as Record<string, unknown>;
}

// As if the phase's time had run out, then any phone's advance.
// As if the phase's time had run out, before any phone's advance.
async function expire(g: Game): Promise<void> {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 second'))
    where id = ${g.roomId}
  `;
}

async function runOut(g: Game, by: Person = g.owner): Promise<State> {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
    where id = ${g.roomId}
  `;
  expect(await krot(by, { action: 'advance', roomId: g.roomId })).toEqual(OK);
  return state(g.roomId);
}

const bySession = (g: Game, sid: unknown) => g.people.find((p) => p.sessionId === sid) as Person;

// Hazırım from everyone, then every speaker's Söyledim: the vote opens.
async function toVote(g: Game): Promise<void> {
  const at = await step(g.roomId);
  for (const p of [...g.players, ...g.impostors]) {
    expect(await krot(p, { action: 'ready', roomId: g.roomId, step: at })).toEqual(OK);
  }
  for (let st = await state(g.roomId); st.phase === 'clue'; st = await state(g.roomId)) {
    expect(
      await krot(bySession(g, st.speaker), { action: 'said', roomId: g.roomId, step: st.step }),
    ).toEqual(OK);
  }
  expect((await state(g.roomId)).phase).toBe('vote');
}

const vote = (p: Person, g: Game, at: number, targets: Person[]) =>
  krot(p, { action: 'vote', roomId: g.roomId, step: at, targets: targets.map((t) => t.sessionId) });

// Everyone votes for the impostor; the impostor for the first player.
async function catchTheImpostor(g: Game): Promise<void> {
  const at = await step(g.roomId);
  const [impostor] = g.impostors as [Person];
  for (const p of g.players) expect(await vote(p, g, at, [impostor])).toEqual(OK);
  expect(await vote(impostor, g, at, [g.players[0] as Person])).toEqual(OK);
}

async function lastGame(roomId: string) {
  const row = await roomRow(roomId);
  return { concept: row.concept, last: (row.game_state as { lastGame?: unknown }).lastGame };
}

async function results(roomId: string) {
  return sql`
    select ts.id as session_id, gr.score, gr.won, gr.mode
    from public.game_results gr
    join public.table_sessions ts on ts.user_id = gr.user_id and ts.status = 'active'
    where gr.room_id = ${roomId} and gr.concept = 'sahtekar'
  `;
}

describe('the roles (§4.6.3, rule 3)', () => {
  it(
    'gives the players the word, the impostor only the category and the watcher both',
    async () => {
      const g = await game(5, [4]);
      expect(g.impostors).toHaveLength(1);
      expect(g.players).toHaveLength(3);
      expect(g.watchers).toHaveLength(1);
      const open = await state(g.roomId);
      expect(open).toMatchObject({ phase: 'role', step: 1, impostors: 1, gone: [], ready: [] });
      expect(open.seats).toHaveLength(4);
      // Neither the word nor the impostor anywhere in the table's open state.
      const text = JSON.stringify(open);
      expect(text).not.toContain(`"${g.word}"`);
      expect(text).not.toContain('impostorSeats');

      const category = open.category;
      for (const p of g.players) {
        expect(await view(p, g.roomId)).toEqual({ role: 'player', category, word: g.word });
      }
      const [impostor] = g.impostors as [Person];
      expect(await view(impostor, g.roomId)).toEqual({ role: 'impostor', category });
      expect(await view(g.watchers[0] as Person, g.roomId)).toEqual({
        role: 'watcher',
        category,
        word: g.word,
        impostorSeats: [impostor.sessionId],
      });
      // A watcher presses nothing.
      expect(
        await krot(g.watchers[0] as Person, { action: 'ready', roomId: g.roomId, step: 1 }),
      ).toEqual({ status: 403, body: errorBody('not_player') });
    },
    SLOW,
  );

  it(
    'deals two impostors from seven players, who do not see each other (K-71)',
    async () => {
      const g = await game(SAHTEKAR_GAME.twoImpostorsFrom);
      expect(g.impostors).toHaveLength(2);
      expect((await state(g.roomId)).impostors).toBe(2);
      for (const p of g.impostors) {
        expect(await view(p, g.roomId)).toEqual({
          role: 'impostor',
          category: (await state(g.roomId)).category,
        });
      }
      // A ballot names two.
      await toVote(g);
      const at = await step(g.roomId);
      const [a, b, c] = g.players as [Person, Person, Person];
      expect(await vote(a, g, at, [b])).toEqual({ status: 400, body: errorBody('bad_request') });
      expect(await vote(a, g, at, [b, b])).toEqual({
        status: 400,
        body: errorBody('bad_request'),
      });
      expect(await vote(a, g, at, [b, c])).toEqual(OK);
    },
    SLOW,
  );

  it(
    'lets only the owner start, with three players at least',
    async () => {
      const people = await Promise.all(Array.from({ length: 3 }, (_, n) => person(venue, n)));
      const [owner, ...others] = people as [Person, ...Person[]];
      const roomId = await tableWith(owner, others);
      expect(await rooms(owner, { action: 'open-game', roomId, concept: 'sahtekar' })).toEqual(OK);
      expect(await krot(others[0] as Person, { action: 'start', roomId })).toEqual({
        status: 403,
        body: errorBody('not_owner'),
      });
      expect(await rooms(others[1] as Person, { action: 'pick', roomId, pick: 'obs' })).toEqual(OK);
      expect(await krot(owner, { action: 'start', roomId })).toEqual({
        status: 409,
        body: errorBody('not_enough_players'),
      });
    },
    SLOW,
  );
});

describe('the clues (§4.6.3)', () => {
  it(
    'starts when everyone is ready and goes round twice, the speaker alone pressing Söyledim',
    async () => {
      const g = await game(4);
      const at = await step(g.roomId);
      const everyone = [...g.players, ...g.impostors];
      for (const p of everyone.slice(1)) {
        expect(await krot(p, { action: 'ready', roomId: g.roomId, step: at })).toEqual(OK);
      }
      expect((await state(g.roomId)).phase).toBe('role');
      expect(
        await krot(everyone[0] as Person, { action: 'ready', roomId: g.roomId, step: at }),
      ).toEqual(OK);
      const first = await state(g.roomId);
      const seats = first.seats as string[];
      expect(first).toMatchObject({ phase: 'clue', round: 1, speaker: seats[0], next: seats[1] });

      // Not the speaker: refused; another step: nothing changes.
      const other = bySession(g, seats[1]);
      expect(await krot(other, { action: 'said', roomId: g.roomId, step: first.step })).toEqual({
        status: 403,
        body: errorBody('not_your_seat'),
      });
      expect(
        await krot(bySession(g, seats[0]), { action: 'said', roomId: g.roomId, step: 999 }),
      ).toEqual(OK);
      expect((await state(g.roomId)).speaker).toBe(seats[0]);

      const order: unknown[] = [];
      for (let st = await state(g.roomId); st.phase === 'clue'; st = await state(g.roomId)) {
        order.push([st.round, st.speaker]);
        expect(
          await krot(bySession(g, st.speaker), { action: 'said', roomId: g.roomId, step: st.step }),
        ).toEqual(OK);
      }
      expect(order).toEqual([...seats.map((s) => [1, s]), ...seats.map((s) => [2, s])]);
      expect(await state(g.roomId)).toMatchObject({ phase: 'vote', voted: [] });
    },
    SLOW,
  );
});

describe('the vote and the end (§4.6.3, K-71)', () => {
  it(
    'keeps the ballots secret, catches the impostor and lets the table win on a wrong guess',
    async () => {
      const g = await game(4);
      await toVote(g);
      const at = await step(g.roomId);
      const [impostor] = g.impostors as [Person];
      const [a] = g.players as [Person];
      expect(await vote(a, g, at, [a])).toEqual({ status: 400, body: errorBody('bad_request') });
      expect(await vote(a, g, at, [impostor])).toEqual(OK);
      // Only that they voted is open, never for whom; a second ballot changes nothing.
      const open = await state(g.roomId);
      expect(open.voted).toEqual([a.sessionId]);
      expect(Object.keys(open)).not.toContain('tally');
      expect(await vote(a, g, at, [g.players[1] as Person])).toEqual(OK);
      expect((await state(g.roomId)).voted).toEqual([a.sessionId]);

      for (const p of g.players.slice(1)) expect(await vote(p, g, at, [impostor])).toEqual(OK);
      expect(await vote(impostor, g, at, [a])).toEqual(OK);
      expect(await state(g.roomId)).toMatchObject({
        phase: 'result',
        tally: { [impostor.sessionId]: 3, [a.sessionId]: 1 },
        accused: [impostor.sessionId],
        caught: [impostor.sessionId],
        escaped: [],
      });

      const guess = await runOut(g);
      expect(guess.phase).toBe('guess');
      // Only the caught impostor guesses.
      expect(
        await krot(a, { action: 'guess', roomId: g.roomId, step: guess.step, text: g.word }),
      ).toEqual({ status: 403, body: errorBody('not_player') });
      expect(
        await krot(impostor, {
          action: 'guess',
          roomId: g.roomId,
          step: guess.step,
          text: 'kesinlikle bu değil',
        }),
      ).toEqual(OK);

      const end = await lastGame(g.roomId);
      expect(end.concept).toBeNull();
      expect(end.last).toMatchObject({
        concept: 'sahtekar',
        sahtekar: {
          winner: 'table',
          word: g.word,
          impostorSeats: [impostor.sessionId],
          caught: [impostor.sessionId],
          guessedRight: false,
        },
      });
      const right = (end.last as { sahtekar: { rightVoters: string[] } }).sahtekar.rightVoters;
      expect(right.sort()).toEqual(g.players.map((p) => p.sessionId).sort());
      // The guess itself is never kept.
      expect(JSON.stringify(end.last)).not.toContain('kesinlikle');
      const rows = await results(g.roomId);
      expect(rows).toHaveLength(4);
      for (const r of rows) {
        const isImpostor = r.session_id === impostor.sessionId;
        expect(r).toMatchObject({
          mode: 'sahtekar',
          score: isImpostor ? null : 1,
          won: !isImpostor,
        });
      }
    },
    SLOW,
  );

  it(
    'lets the caught impostor win with the word, whatever its case and punctuation (rule 7)',
    async () => {
      const g = await game(4);
      await toVote(g);
      await catchTheImpostor(g);
      const guess = await runOut(g);
      const [impostor] = g.impostors as [Person];
      expect(
        await krot(impostor, {
          action: 'guess',
          roomId: g.roomId,
          step: guess.step,
          text: ` ${g.word.toLocaleUpperCase('tr-TR')}! `,
        }),
      ).toEqual(OK);
      expect((await lastGame(g.roomId)).last).toMatchObject({
        sahtekar: { winner: 'impostors', guessedRight: true },
      });
    },
    SLOW,
  );

  it(
    'lets the impostor escape on a tie, and win with nobody to guess',
    async () => {
      const g = await game(4);
      await toVote(g);
      const at = await step(g.roomId);
      const [a, b, c] = g.players as [Person, Person, Person];
      const [impostor] = g.impostors as [Person];
      expect(await vote(a, g, at, [b])).toEqual(OK);
      expect(await vote(b, g, at, [a])).toEqual(OK);
      expect(await vote(c, g, at, [impostor])).toEqual(OK);
      expect(await vote(impostor, g, at, [c])).toEqual(OK);
      expect(await state(g.roomId)).toMatchObject({
        phase: 'result',
        accused: [],
        caught: [],
        escaped: [impostor.sessionId],
      });
      await runOut(g);
      expect((await lastGame(g.roomId)).last).toMatchObject({
        sahtekar: { winner: 'impostors', guessedRight: null, caught: [] },
      });
    },
    SLOW,
  );
});

describe('the clock (§4.F, IDEMPOTENT_CALLS)', () => {
  // sahtekar/advance and sahtekar/view are in IDEMPOTENT_CALLS.
  it(
    'changes nothing with an early advance, and the same view twice',
    async () => {
      const g = await game(3);
      const before = await state(g.roomId);
      expect(await krot(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      expect(await krot(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(before);

      const clue = await runOut(g);
      expect(clue).toMatchObject({ phase: 'clue', round: 1 });
      expect(await krot(g.people[1] as Person, { action: 'advance', roomId: g.roomId })).toEqual(
        OK,
      );
      expect(await state(g.roomId)).toEqual(clue);
      // A speaker who stays quiet: the clock passes the turn on.
      const seats = clue.seats as string[];
      expect((await runOut(g)).speaker).toBe(seats[1]);

      const p = g.people[2] as Person;
      expect(await view(p, g.roomId)).toEqual(await view(p, g.roomId));
    },
    SLOW,
  );
});

describe('the clock after time is up (§4.F, rule 3)', () => {
  // The phase's time is up but no phone has sent advance yet: an action on that step is refused
  // (turn_over) and changes nothing; once the phase moves on, the late action changes nothing; an
  // action already counted answers the same again.
  const TURN_OVER = { status: 409, body: errorBody('turn_over') };

  it(
    'refuses a Hazırım after the role card’s time, and changes nothing once the clues start',
    async () => {
      const g = await game(4);
      const [a, b] = g.players as [Person, Person];
      const at = await step(g.roomId);
      expect(await krot(a, { action: 'ready', roomId: g.roomId, step: at })).toEqual(OK);
      await expire(g);
      const before = await state(g.roomId);
      expect(await krot(b, { action: 'ready', roomId: g.roomId, step: at })).toEqual(TURN_OVER);
      // The press counted in time answers the same again.
      expect(await krot(a, { action: 'ready', roomId: g.roomId, step: at })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(before);
      expect(before.ready).toEqual([a.sessionId]);

      expect(await krot(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const clue = await state(g.roomId);
      expect(clue.phase).toBe('clue');
      expect(await krot(b, { action: 'ready', roomId: g.roomId, step: at })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(clue);
    },
    SLOW,
  );

  it(
    'refuses a Söyledim after the speaker’s time, and lets the clock pass the turn on',
    async () => {
      const g = await game(4);
      const first = await runOut(g);
      const seats = first.seats as string[];
      const speaker = bySession(g, first.speaker);
      await expire(g);
      const before = await state(g.roomId);
      expect(await krot(speaker, { action: 'said', roomId: g.roomId, step: first.step })).toEqual(
        TURN_OVER,
      );
      expect(await state(g.roomId)).toEqual(before);

      expect(await krot(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const next = await state(g.roomId);
      expect(next).toMatchObject({ phase: 'clue', speaker: seats[1] });
      // The late press on the turn that ended changes nothing: the turn stays with the next one.
      expect(await krot(speaker, { action: 'said', roomId: g.roomId, step: first.step })).toEqual(
        OK,
      );
      expect(await state(g.roomId)).toEqual(next);
    },
    SLOW,
  );

  it(
    'refuses a ballot after the vote’s time, keeps the ones cast in time, and changes nothing after',
    async () => {
      const g = await game(4);
      await toVote(g);
      const at = await step(g.roomId);
      const [impostor] = g.impostors as [Person];
      const [a, b] = g.players as [Person, Person];
      expect(await vote(a, g, at, [impostor])).toEqual(OK);
      await expire(g);
      const before = await state(g.roomId);
      expect(await vote(b, g, at, [impostor])).toEqual(TURN_OVER);
      // The ballot cast in time answers the same again; nothing changes.
      expect(await vote(a, g, at, [impostor])).toEqual(OK);
      expect(await state(g.roomId)).toEqual(before);
      expect(before.voted).toEqual([a.sessionId]);
      const ballots = await sql`
        select secret -> 'votes' as votes from public.game_secrets where room_id = ${g.roomId}
      `;
      expect(Object.keys(ballots[0]?.votes ?? {})).toEqual([a.sessionId]);

      // Sonuç counts only the ballot cast in time.
      expect(await krot(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const result = await state(g.roomId);
      expect(result).toMatchObject({ phase: 'result', tally: { [impostor.sessionId]: 1 } });
      expect(await vote(b, g, at, [impostor])).toEqual(OK);
      expect(await state(g.roomId)).toEqual(result);
    },
    SLOW,
  );
});

describe('leaving (§4.6.3)', () => {
  it(
    'passes the turn on when the speaker leaves, and drops who left from the order',
    async () => {
      const g = await game(5);
      const first = await runOut(g);
      const seats = first.seats as string[];
      // The next speaker leaves: the one after comes next. Not an impostor (that ends the game) and
      // not the owner (who ends the game rather than leaving it, rooms/leave-game → bad_request).
      const leaver = seats
        .slice(1)
        .map((sid) => bySession(g, sid))
        .find((p) => !g.impostors.includes(p) && p !== g.owner) as Person;
      const pos = seats.indexOf(leaver.sessionId);
      expect(await rooms(leaver, { action: 'leave-game', roomId: g.roomId })).toEqual(OK);
      const st = await state(g.roomId);
      expect(st.gone).toEqual([leaver.sessionId]);
      expect(st.next).toBe(pos === 1 ? seats[2] : seats[1]);
      // Who left sees nothing and says nothing.
      expect(await view(leaver, g.roomId)).toEqual({ role: null });
      const order: unknown[] = [];
      for (let s = await state(g.roomId); s.phase === 'clue'; s = await state(g.roomId)) {
        order.push(s.speaker);
        expect(
          await krot(bySession(g, s.speaker), { action: 'said', roomId: g.roomId, step: s.step }),
        ).toEqual(OK);
      }
      expect(order).not.toContain(leaver.sessionId);
      expect(order).toHaveLength(2 * 4);
    },
    SLOW,
  );

  it(
    'ends the game without results when an impostor leaves (§4.F)',
    async () => {
      // Seven players deal two impostors, so one of them is not the owner: the owner cannot leave
      // its game (rooms/leave-game → bad_request), only end it with "Oyunu bitir".
      const g = await game(7);
      expect(g.impostors).toHaveLength(2);
      const impostor = g.impostors.find((p) => p !== g.owner) as Person;
      expect(await rooms(impostor, { action: 'leave-game', roomId: g.roomId })).toEqual(OK);
      expect(await krot(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const end = await lastGame(g.roomId);
      expect(end.concept).toBeNull();
      expect(end.last).toMatchObject({
        sahtekar: { winner: 'impostor_left', gone: [impostor.sessionId] },
      });
      expect(await results(g.roomId)).toHaveLength(0);
    },
    SLOW,
  );
});

describe('locks (§4.K)', () => {
  // Two ballots while the other holds the table: the second waits; a leaving player's trigger waits
  // the same way. Nothing deadlocks (check-in → rooms → game_players → game_secrets).
  it(
    'lets a ballot wait for a ballot, and a leave wait for a ballot',
    async () => {
      const g = await game(5);
      await toVote(g);
      const at = await step(g.roomId);
      const [impostor] = g.impostors as [Person];
      // b leaves the game, so b is not the owner (the owner cannot leave its game, only end it).
      const [a, b, c] = g.players.filter((p) => p !== g.owner) as [Person, Person, Person];
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await tx`
            select (public.sahtekar_vote(
              ${a.userId}, ${g.roomId}, ${at}, ${[impostor.sessionId]}::uuid[]
            )).id
          `;
          later = second`
            select (public.sahtekar_vote(
              ${b.userId}, ${g.roomId}, ${at}, ${[impostor.sessionId]}::uuid[]
            )).id
          `
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('sahtekar_vote');
        });
        expect(await later).toHaveLength(1);
        expect((await state(g.roomId)).voted?.sort()).toEqual([a.sessionId, b.sessionId].sort());

        await first.begin(async (tx) => {
          await tx`
            select (public.sahtekar_vote(
              ${c.userId}, ${g.roomId}, ${at}, ${[impostor.sessionId]}::uuid[]
            )).id
          `;
          later = second`select (public.rooms_leave_game(${b.userId}, ${g.roomId})).id`
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('rooms_leave_game');
        });
        expect(await later).toHaveLength(1);
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      // Who left: their ballot went.
      const st = await state(g.roomId);
      expect(st.gone).toEqual([b.sessionId]);
      expect(st.voted?.sort()).toEqual([a.sessionId, c.sessionId].sort());
    },
    SLOW,
  );

  // The vote's time is up: an advance and a late ballot at the same moment. Whichever holds the
  // table first decides, the same every time: the advance counts the votes, and the ballot that
  // waited finds Sonuç and changes nothing.
  it(
    'lets a late ballot that waits for the advance change nothing',
    async () => {
      const g = await game(4);
      await toVote(g);
      const at = await step(g.roomId);
      const [impostor] = g.impostors as [Person];
      const [a, b] = g.players as [Person, Person];
      expect(await vote(a, g, at, [impostor])).toEqual(OK);
      await expire(g);
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await tx`select (public.sahtekar_advance(${g.owner.userId}, ${g.roomId})).id`;
          later = second`
            select (public.sahtekar_vote(
              ${b.userId}, ${g.roomId}, ${at}, ${[impostor.sessionId]}::uuid[]
            )).id
          `
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('sahtekar_vote');
        });
        expect(await later).toHaveLength(1);
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      expect(await state(g.roomId)).toMatchObject({
        phase: 'result',
        tally: { [impostor.sessionId]: 1 },
      });
      const ballots = await sql`
        select secret -> 'votes' as votes from public.game_secrets where room_id = ${g.roomId}
      `;
      expect(Object.keys(ballots[0]?.votes ?? {})).toEqual([a.sessionId]);
    },
    SLOW,
  );

  // A ballot that starts in time but gets the table only after the vote's time: the clock is read
  // when the table is held, not when the call began, so it is late (turn_over) and changes nothing.
  it(
    'refuses a ballot whose time ran out while it waited for the table',
    async () => {
      const g = await game(4);
      await toVote(g);
      const at = await step(g.roomId);
      const [impostor] = g.impostors as [Person];
      const [a] = g.players as [Person];
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          // Holding the table, the vote's clock is set to run out in a second.
          await tx`
            update public.rooms
            set game_state = jsonb_set(
              game_state, '{endsAt}', to_jsonb(clock_timestamp() + interval '1 second')
            )
            where id = ${g.roomId}
          `;
          later = second`
            select (public.sahtekar_vote(
              ${a.userId}, ${g.roomId}, ${at}, ${[impostor.sessionId]}::uuid[]
            )).id
          `
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('sahtekar_vote');
          await tx`select pg_sleep(2)`;
        });
        expect(await later).toMatchObject({ message: 'turn_over' });
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      const st = await state(g.roomId);
      expect(st).toMatchObject({ phase: 'vote', step: at, voted: [] });
      const ballots = await sql`
        select secret -> 'votes' as votes from public.game_secrets where room_id = ${g.roomId}
      `;
      expect(ballots[0]?.votes).toEqual({});
    },
    SLOW,
  );
});
