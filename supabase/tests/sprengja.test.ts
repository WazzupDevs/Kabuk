// Faz 4 step 4.6.7 (docs/SPEC_V4.md §4.F "Adım 4.6.7: Sprengja", K-85): the bomb goes from hand to
// hand. The server keeps the hidden fuse, the holder and the score; no answer, no state and no
// event carries the fuse (rule 3). A test runs a fuse out by moving its moment into the past in
// game_secrets, and checks after every race that the round's events give the state's holder and
// throws (pure/sprengja.ts → replayRound).
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  fuseRange,
  readSprengjaEvent,
  replayRound,
  roundsFor,
  type SprengjaEvent,
} from '../functions/_shared/pure/sprengja.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import { leave, type Person, person, roomRow, rooms, TABLE_PHONES, tableWith } from './people.ts';

let venue: Record<string, string> = {};

// The letter groups are content of their own (K-85 O-12); the tests bring theirs.
const GROUPS = {
  kolay: ['tka', 'tma', 'tya', 'tra', 'tta', 'tsa'],
  orta: ['tbe', 'tol', 'tis', 'tun'],
  zor: ['tkar', 'ttan', 'tman', 'tter', 'tbal', 'tbak', 'tkum', 'ttop'],
};

async function setGroups(active: Partial<Record<keyof typeof GROUPS, number>>): Promise<void> {
  await sql`update public.cards set is_active = false where deck = 'sprengja'`;
  for (const [tier, words] of Object.entries(GROUPS)) {
    const count = active[tier as keyof typeof GROUPS] ?? 0;
    for (const word of words.slice(0, count)) {
      await sql`
        update public.cards set is_active = true
        where deck = 'sprengja' and source_key = ${`test/${word}`}
      `;
    }
  }
}

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
  for (const [tier, words] of Object.entries(GROUPS)) {
    for (const word of words) {
      await sql`
        insert into public.cards (deck, source_key, word, theme)
        values ('sprengja', ${`test/${word}`}, ${word}, ${tier})
        on conflict (deck, source_key) do update set word = excluded.word, theme = excluded.theme
      `;
    }
  }
});

// The frame's tests close every game after each of theirs; this file plays Sprengja.
beforeEach(async () => {
  await sql`update public.games set is_available = true where id = 'sprengja'`;
  await setGroups({ kolay: 6, orta: 4, zor: 8 });
});

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await sql`delete from public.cards where deck = 'sprengja' and source_key like 'test/%'`;
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
const SLOW = 120_000;
const sprengja = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'sprengja', body);

type State = Record<string, unknown> & {
  phase: string;
  step: number;
  round: number;
  rounds: number;
  players: number;
  order: string[];
  gone: string[];
  starter: string | null;
  holder: string | null;
  passes: number;
  letters: string | null;
  used: string[];
  hits: Record<string, number>;
  lastBlast: { round: number; holder: string; gone: boolean } | null;
  ready: string[];
  endsAt: string | null;
  poll: { holderMs: number; nextMs: number; othersMs: number };
};

type Game = {
  roomId: string;
  owner: Person;
  people: Person[];
  // The players in the throwing order.
  order: () => Promise<Person[]>;
  by: (sid: string | null) => Person;
};

async function state(roomId: string): Promise<State> {
  return (await roomRow(roomId)).game_state as State;
}

// `count` people at the owner's table, the page opened and the game started (`watch`: these pick
// "Gözlemci ol" first; `shuffle`: the owner shuffles the order first; `from`: the first test phone,
// so two games in one test seat different people).
async function game(
  count: number,
  opts: { watch?: number[]; shuffle?: boolean; from?: number } = {},
): Promise<Game> {
  const from = opts.from ?? 0;
  const people = await Promise.all(
    Array.from({ length: count }, (_, n) => person(venue, from + n)),
  );
  const [owner, ...others] = people as [Person, ...Person[]];
  const roomId = await tableWith(owner, others);
  expect(await rooms(owner, { action: 'open-game', roomId, concept: 'sprengja' })).toEqual(OK);
  for (const n of opts.watch ?? []) {
    expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick: 'obs' })).toEqual(OK);
  }
  if (opts.shuffle) expect(await sprengja(owner, { action: 'shuffle', roomId })).toEqual(OK);
  expect(await sprengja(owner, { action: 'start', roomId })).toEqual(OK);
  const by = (sid: string | null) => {
    const p = people.find((x) => x.sessionId === sid);
    if (!p) throw new Error(`nobody with ${sid}`);
    return p;
  };
  return {
    roomId,
    owner,
    people,
    by,
    order: async () => (await state(roomId)).order.map(by),
  };
}

// The round's card opened and the fuse lit by its starter.
async function light(g: Game): Promise<State> {
  const st = await state(g.roomId);
  const starter = g.by(st.starter);
  expect(await sprengja(starter, { action: 'reveal', roomId: g.roomId, round: st.round })).toEqual(
    OK,
  );
  expect(await sprengja(starter, { action: 'light', roomId: g.roomId, round: st.round })).toEqual(
    OK,
  );
  return state(g.roomId);
}

async function fuseOf(roomId: string): Promise<Date | null> {
  const [row] = await sql`
    select (gs.secret ->> 'explodesAt')::timestamptz as at
    from public.game_secrets gs
    join public.rooms r on r.id = gs.room_id
    where gs.room_id = ${roomId} and gs.game_no = (r.game_state ->> 'gameNo')::integer
  `;
  return (row?.at as Date | null) ?? null;
}

// As if the fuse had run out a moment ago.
async function burnOut(roomId: string): Promise<void> {
  await sql`
    update public.game_secrets gs
    set secret = jsonb_set(gs.secret, '{explodesAt}', to_jsonb(clock_timestamp() - interval '1 second'))
    from public.rooms r
    where r.id = gs.room_id and gs.room_id = ${roomId}
      and gs.game_no = (r.game_state ->> 'gameNo')::integer and gs.secret ? 'explodesAt'
  `;
}

const pass = (p: Person, g: Game, st: Pick<State, 'round' | 'step'>) =>
  sprengja(p, { action: 'pass', roomId: g.roomId, round: st.round, step: st.step });

async function events(roomId: string): Promise<SprengjaEvent[]> {
  const rows = await sql`
    select type, payload from public.game_events
    where room_id = ${roomId} and type like 'sp_%'
    order by created_at, id
  `;
  return rows.flatMap((r) => {
    const e = readSprengjaEvent(r.type, r.payload);
    return e ? [e] : [];
  });
}

async function everything(roomId: string): Promise<string> {
  const ev = await sql`select type, payload from public.game_events where room_id = ${roomId}`;
  return JSON.stringify({ state: await state(roomId), events: ev });
}

describe('the start (§4.6.7)', () => {
  it(
    'plays 3 to 8 by the formula and refuses more',
    async () => {
      const people = await Promise.all(Array.from({ length: 9 }, (_, n) => person(venue, n)));
      const [owner, ...others] = people as [Person, ...Person[]];
      const roomId = await tableWith(owner, others);
      expect(await rooms(owner, { action: 'open-game', roomId, concept: 'sprengja' })).toEqual(OK);
      expect(await sprengja(owner, { action: 'start', roomId })).toEqual({
        status: 409,
        body: errorBody('too_many_players'),
      });
      expect(await rooms(people[8] as Person, { action: 'pick', roomId, pick: 'obs' })).toEqual(OK);
      expect(await sprengja(owner, { action: 'start', roomId })).toEqual(OK);
      const st = await state(roomId);
      expect(st).toMatchObject({
        phase: 'card',
        round: 1,
        rounds: roundsFor(8),
        players: 8,
        gone: [],
        holder: null,
        passes: 0,
        letters: null,
        hits: {},
        lastBlast: null,
      });
      expect(st.order).toHaveLength(8);
      expect(st.order).not.toContain((people[8] as Person).sessionId);
      expect(st.starter).toBe(st.order[0]);
      expect(st).not.toHaveProperty('explodesAt');
    },
    SLOW,
  );

  it(
    'orders the throwers as they came in, or by the owner’s shuffle',
    async () => {
      const g = await game(4);
      const arrived = await sql`
        select session_id from public.room_members
        where room_id = ${g.roomId} and left_at is null order by joined_at
      `;
      expect((await state(g.roomId)).order).toEqual(arrived.map((r) => r.session_id));

      const people = await Promise.all(Array.from({ length: 4 }, (_, n) => person(venue, n + 4)));
      const [owner, ...others] = people as [Person, ...Person[]];
      const roomId = await tableWith(owner, others);
      expect(await rooms(owner, { action: 'open-game', roomId, concept: 'sprengja' })).toEqual(OK);
      expect(await sprengja(others[0] as Person, { action: 'shuffle', roomId })).toEqual({
        status: 403,
        body: errorBody('not_owner'),
      });
      expect(await sprengja(owner, { action: 'shuffle', roomId })).toEqual(OK);
      const shuffled = (await roomRow(roomId)).game_state.pregame.order as string[];
      expect([...shuffled].sort()).toEqual(people.map((p) => p.sessionId).sort());
      expect(await sprengja(owner, { action: 'start', roomId })).toEqual(OK);
      expect((await state(roomId)).order).toEqual(shuffled);
    },
    SLOW,
  );

  it(
    'needs a letter group for every round, the hard ones from six players',
    async () => {
      await setGroups({ zor: 8 });
      const people = await Promise.all(Array.from({ length: 3 }, (_, n) => person(venue, n + 6)));
      const [owner, ...others] = people as [Person, ...Person[]];
      const roomId = await tableWith(owner, others);
      expect(await rooms(owner, { action: 'open-game', roomId, concept: 'sprengja' })).toEqual(OK);
      // No content is the server's fault, a 5xx (the test client throws on it).
      await expect(sprengja(owner, { action: 'start', roomId })).rejects.toThrow(/no_cards/);
      expect((await roomRow(roomId)).concept).toBeNull();

      const g = await game(6);
      const st = await light(g);
      expect(GROUPS.zor).toContain(st.letters);
    },
    SLOW,
  );
});

describe('the round (§4.6.7)', () => {
  it(
    'opens the card and lights the fuse by the starter only; the same twice changes nothing',
    async () => {
      const g = await game(3);
      const st = await state(g.roomId);
      const [starter, second] = (await g.order()) as [Person, Person];
      expect(await sprengja(second, { action: 'reveal', roomId: g.roomId, round: 1 })).toEqual({
        status: 403,
        body: errorBody('not_starter'),
      });
      expect(await sprengja(starter, { action: 'reveal', roomId: g.roomId, round: 1 })).toEqual(OK);
      const opened = await state(g.roomId);
      expect(opened).toMatchObject({ phase: 'letters', step: st.step + 1 });
      expect([...GROUPS.kolay, ...GROUPS.orta]).toContain(opened.letters);
      expect(opened.used).toEqual([opened.letters]);
      expect(await sprengja(starter, { action: 'reveal', roomId: g.roomId, round: 1 })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(opened);

      expect(await sprengja(second, { action: 'light', roomId: g.roomId, round: 1 })).toEqual({
        status: 403,
        body: errorBody('not_starter'),
      });
      expect(await sprengja(starter, { action: 'light', roomId: g.roomId, round: 1 })).toEqual(OK);
      const lit = await state(g.roomId);
      expect(lit).toMatchObject({ phase: 'lit', holder: starter.sessionId, passes: 0 });
      const fuse = await fuseOf(g.roomId);
      expect(await sprengja(starter, { action: 'light', roomId: g.roomId, round: 1 })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(lit);
      expect(await fuseOf(g.roomId)).toEqual(fuse);
    },
    SLOW,
  );

  it(
    'throws clockwise, ignores a second press and refuses one without the bomb',
    async () => {
      const g = await game(4);
      const order = await g.order();
      let st = await light(g);
      const [a, b, c] = order as [Person, Person, Person];
      expect(await pass(b, g, st)).toEqual({ status: 409, body: errorBody('not_holder') });
      expect(await pass(a, g, st)).toEqual(OK);
      const after = await state(g.roomId);
      expect(after).toMatchObject({ holder: b.sessionId, passes: 1, step: st.step + 1 });
      // The same throw again: nothing.
      expect(await pass(a, g, st)).toEqual(OK);
      expect(await state(g.roomId)).toEqual(after);
      st = after;
      expect(await pass(b, g, st)).toEqual(OK);
      expect((await state(g.roomId)).holder).toBe(c.sessionId);
      // A watcher plays nothing.
      const replay = replayRound(await events(g.roomId), 1);
      expect(replay).toMatchObject({ holder: c.sessionId, passes: 2, exploded: null });
    },
    SLOW,
  );

  it(
    'refuses a watcher and keeps them out of the order',
    async () => {
      const g = await game(4, { watch: [3] });
      const watcher = g.people[3] as Person;
      const st = await light(g);
      expect(st.order).not.toContain(watcher.sessionId);
      expect(await pass(watcher, g, st)).toEqual({ status: 403, body: errorBody('not_player') });
      expect(await sprengja(watcher, { action: 'ready', roomId: g.roomId, step: st.step })).toEqual(
        { status: 403, body: errorBody('not_player') },
      );
    },
    SLOW,
  );
});

describe('the fuse (rule 3, K-85 O-4)', () => {
  it(
    'keeps the moment out of every answer, the table’s state and the events',
    async () => {
      const g = await game(3);
      const answers: unknown[] = [];
      let st = await state(g.roomId);
      const starter = g.by(st.starter);
      answers.push(await sprengja(starter, { action: 'reveal', roomId: g.roomId, round: 1 }));
      answers.push(await sprengja(starter, { action: 'light', roomId: g.roomId, round: 1 }));
      st = await state(g.roomId);
      const fuse = await fuseOf(g.roomId);
      expect(fuse).not.toBeNull();
      answers.push(await pass(starter, g, st));
      st = await state(g.roomId);
      for (const p of g.people) {
        answers.push(await sprengja(p, { action: 'poll', roomId: g.roomId, round: 1 }));
        answers.push(await sprengja(p, { action: 'advance', roomId: g.roomId }));
      }
      const iso = (fuse as Date).toISOString().slice(0, 19);
      const seen = JSON.stringify(answers) + (await everything(g.roomId));
      expect(seen).not.toContain('explodesAt');
      expect(seen).not.toContain(iso);
      // The fuse to the millisecond, as the database prints it, is nowhere either.
      const [printed] = await sql`select ${fuse}::timestamptz::text as t`;
      expect(seen).not.toContain(String(printed?.t).slice(0, 19));
    },
    SLOW,
  );

  it(
    'draws it inside the range for the players',
    async () => {
      const g = await game(5);
      await light(g);
      const [row] = await sql`
        select (gs.secret ->> 'explodesAt')::timestamptz - e.created_at as fuse
        from public.game_secrets gs, public.game_events e
        where gs.room_id = ${g.roomId} and e.room_id = ${g.roomId} and e.type = 'sp_lit'
      `;
      const [ms] = await sql`select extract(epoch from ${row?.fuse}::interval) * 1000 as ms`;
      const { lowMs, highMs } = fuseRange(5);
      expect(Number(ms?.ms)).toBeGreaterThanOrEqual(lowMs);
      expect(Number(ms?.ms)).toBeLessThan(highMs);
    },
    SLOW,
  );

  it(
    'answers an early and a late poll the same',
    async () => {
      const g = await game(3);
      const st = await light(g);
      const [, other] = (await g.order()) as [Person, Person];
      const early = await sprengja(other, { action: 'poll', roomId: g.roomId, round: st.round });
      expect((await state(g.roomId)).phase).toBe('lit');
      await burnOut(g.roomId);
      const late = await sprengja(other, { action: 'poll', roomId: g.roomId, round: st.round });
      expect(JSON.stringify(late)).toBe(JSON.stringify(early));
      expect(late).toEqual(OK);
      expect((await state(g.roomId)).phase).toBe('summary');
    },
    SLOW,
  );

  it(
    'blows a late throw up in the thrower’s hands',
    async () => {
      const g = await game(3);
      let st = await light(g);
      const [a, b] = (await g.order()) as [Person, Person];
      expect(await pass(a, g, st)).toEqual(OK);
      st = await state(g.roomId);
      await burnOut(g.roomId);
      expect(await pass(b, g, st)).toEqual({ status: 409, body: errorBody('turn_over') });
      const after = await state(g.roomId);
      expect(after).toMatchObject({
        phase: 'summary',
        holder: b.sessionId,
        starter: b.sessionId,
        hits: { [b.sessionId]: 1 },
        lastBlast: { round: 1, holder: b.sessionId, gone: false },
      });
      expect(await fuseOf(g.roomId)).toBeNull();
      // The same late throw again: still over, still one blast.
      expect(await pass(b, g, st)).toEqual({ status: 409, body: errorBody('turn_over') });
      expect(replayRound(await events(g.roomId), 1)).toEqual({
        holder: b.sessionId,
        passes: 1,
        exploded: b.sessionId,
        blasts: 1,
      });
    },
    SLOW,
  );

  it(
    'changes nothing with an early poll, and the same with one sent twice',
    async () => {
      const g = await game(3);
      const st = await light(g);
      const poll = () => sprengja(g.owner, { action: 'poll', roomId: g.roomId, round: st.round });
      expect(await poll()).toEqual(OK);
      expect(await poll()).toEqual(OK);
      expect(await state(g.roomId)).toEqual(st);
      await burnOut(g.roomId);
      expect(await poll()).toEqual(OK);
      expect(await poll()).toEqual(OK);
      const blasts = (await events(g.roomId)).filter((e) => e.type === 'sp_explode');
      expect(blasts).toHaveLength(1);
      // Someone not at the table hears not_in_room, early or late.
      const stranger = await person(venue, 9);
      expect(
        await sprengja(stranger, { action: 'poll', roomId: g.roomId, round: st.round }),
      ).toEqual({ status: 403, body: errorBody('not_in_room') });
    },
    SLOW,
  );

  it(
    'goes off by the job, which drops a fuse its game left behind',
    async () => {
      const g = await game(3);
      await light(g);
      await burnOut(g.roomId);
      const [ran] = await sql`select private.sprengja_explode_due() as n`;
      expect(Number(ran?.n)).toBeGreaterThanOrEqual(1);
      expect((await state(g.roomId)).phase).toBe('summary');
      await sql`select private.sprengja_explode_due()`;
      expect((await events(g.roomId)).filter((e) => e.type === 'sp_explode')).toHaveLength(1);

      // A game ended by its owner while the fuse burned leaves it behind; the job drops it.
      const h = await game(3, { from: 3 });
      await light(h);
      expect(await rooms(h.owner, { action: 'end-game', roomId: h.roomId })).toEqual(OK);
      await burnOut(h.roomId);
      await sql`select private.sprengja_explode_due()`;
      const [left] = await sql`
        select count(*)::int as n from public.game_secrets
        where room_id = ${h.roomId} and secret ? 'explodesAt'
      `;
      expect(left?.n).toBe(0);
    },
    SLOW,
  );
});

describe('the clock (§4.6.7)', () => {
  it(
    'tells the phones to poll more while the job is off',
    async () => {
      const g = await game(3);
      expect((await light(g)).poll).toEqual({ holderMs: 1000, nextMs: 3000, othersMs: 10000 });
      await sql`
        select cron.alter_job(jobid, active => true) from cron.job where jobname = 'sprengja-explode'
      `;
      try {
        const h = await game(3, { from: 3 });
        expect((await light(h)).poll).toEqual({ holderMs: 2000, nextMs: 0, othersMs: 0 });
      } finally {
        await sql`
          select cron.alter_job(jobid, active => false) from cron.job
          where jobname = 'sprengja-explode'
        `;
      }
    },
    SLOW,
  );

  it('creates the job switched off', async () => {
    const [job] = await sql`
      select schedule, active, command from cron.job where jobname = 'sprengja-explode'
    `;
    expect(job).toMatchObject({ schedule: '1 seconds', active: false });
    expect(job?.command).toContain('private.sprengja_explode_due()');
  });
});

describe('the races (§4.6.7)', () => {
  it(
    'takes one of ten throws sent at once',
    async () => {
      const g = await game(3);
      const st = await light(g);
      const holder = g.by(st.holder);
      const answers = await Promise.all(Array.from({ length: 10 }, () => pass(holder, g, st)));
      for (const a of answers) expect(a).toEqual(OK);
      const after = await state(g.roomId);
      expect(after).toMatchObject({ passes: 1, step: st.step + 1 });
      const passes = (await events(g.roomId)).filter((e) => e.type === 'sp_pass');
      expect(passes).toHaveLength(1);
      expect(replayRound(await events(g.roomId), st.round)).toMatchObject({
        holder: after.holder,
        passes: 1,
      });
    },
    SLOW,
  );

  it(
    'keeps the events and the state together when throws, polls and the job race the fuse',
    async () => {
      const g = await game(3);
      const first = await light(g);
      const order = await g.order();
      const pool = postgres(dbUrl, { max: 8, onnotice: () => {} });
      try {
        for (let i = 0; i < 30; i++) {
          const round = 100 + i;
          const holder = order[i % 3] as Person;
          const next = order[(i + 1) % 3] as Person;
          const before = await state(g.roomId);
          const step = before.step + 1;
          // A fresh burning round whose fuse runs out within a few milliseconds.
          await sql`
            update public.rooms
            set game_state = game_state || jsonb_build_object(
              'phase', 'lit', 'round', ${round}::integer, 'step', ${step}::integer,
              'holder', ${holder.sessionId}::text, 'passes', 0
            )
            where id = ${g.roomId}
          `;
          await sql`
            update public.game_secrets
            set secret = jsonb_build_object(
              'explodesAt', clock_timestamp() + make_interval(secs => ${(i % 6) * 0.004}::float8),
              'round', ${round}::integer
            )
            where room_id = ${g.roomId} and game_no = ${first.gameNo as number}
          `;
          await sql`
            insert into public.game_events (room_id, type, payload)
            values (${g.roomId}, 'sp_lit', jsonb_build_object(
              'round', ${round}::integer, 'holder', ${holder.sessionId}::text
            ))
          `;
          const calls = [
            pool`select public.sprengja_pass(${holder.userId}, ${g.roomId}, ${round}, ${step}) as r`,
            pool`select public.sprengja_pass(${holder.userId}, ${g.roomId}, ${round}, ${step}) as r`,
            pool`select public.sprengja_pass(${next.userId}, ${g.roomId}, ${round}, ${step + 1}) as r`,
            pool`select public.sprengja_poll(${next.userId}, ${g.roomId}, ${round})`,
            pool`select private.sprengja_explode_due()`,
          ].map((q) => q.execute().catch((err: unknown) => err));
          await Promise.all(calls);
          // Whatever the order, the fuse runs out by now; the job settles what is left.
          await new Promise((resolve) => setTimeout(resolve, 30));
          await sql`select private.sprengja_explode_due()`;

          const after = await state(g.roomId);
          const replay = replayRound(await events(g.roomId), round);
          expect(after.phase, `round ${round}`).toBe('summary');
          expect(replay.blasts, `round ${round}`).toBe(1);
          expect(replay.exploded).toBe(after.lastBlast?.holder);
          expect(replay.holder).toBe(after.holder);
          expect(replay.passes).toBe(after.passes);
          const blasted = replay.exploded as string;
          expect(after.hits[blasted]).toBe((before.hits[blasted] ?? 0) + 1);
          expect(await fuseOf(g.roomId)).toBeNull();
        }
      } finally {
        await pool.end();
      }
    },
    SLOW,
  );
});

describe('Tur sonu and the end (§4.6.7)', () => {
  it(
    'moves on when everyone is ready or its time is up, and changes nothing with an early advance',
    async () => {
      const g = await game(3);
      await light(g);
      await burnOut(g.roomId);
      expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const summary = await state(g.roomId);
      expect(summary.phase).toBe('summary');
      expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(summary);

      const [a, b, c] = (await g.order()) as [Person, Person, Person];
      for (const p of [a, b]) {
        expect(
          await sprengja(p, { action: 'ready', roomId: g.roomId, step: summary.step }),
        ).toEqual(OK);
        expect(
          await sprengja(p, { action: 'ready', roomId: g.roomId, step: summary.step }),
        ).toEqual(OK);
      }
      expect((await state(g.roomId)).ready).toHaveLength(2);
      expect(await sprengja(c, { action: 'ready', roomId: g.roomId, step: summary.step })).toEqual(
        OK,
      );
      const second = await state(g.roomId);
      expect(second).toMatchObject({
        phase: 'card',
        round: 2,
        holder: null,
        passes: 0,
        letters: null,
        starter: summary.lastBlast?.holder,
      });

      // Round 2 by the clock.
      await light(g);
      await burnOut(g.roomId);
      expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      await sql`
        update public.rooms
        set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
        where id = ${g.roomId}
      `;
      expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      expect(await state(g.roomId)).toMatchObject({ phase: 'card', round: 3 });
    },
    SLOW,
  );

  it(
    'ends after the last round with every fewest-blasts player winning',
    async () => {
      const g = await game(3);
      const rounds = (await state(g.roomId)).rounds;
      for (let r = 1; r <= rounds; r++) {
        await light(g);
        await burnOut(g.roomId);
        expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
        const st = await state(g.roomId);
        for (const p of await g.order()) {
          expect(await sprengja(p, { action: 'ready', roomId: g.roomId, step: st.step })).toEqual(
            OK,
          );
        }
      }
      const row = await roomRow(g.roomId);
      expect(row.concept).toBeNull();
      const last = row.game_state.lastGame;
      expect(last).toMatchObject({ concept: 'sprengja', abandoned: false });
      const hits = last.sprengja.hits as Record<string, number>;
      const blasts = Object.values(hits).reduce((s, n) => s + n, 0);
      expect(blasts).toBe(rounds);
      const least = Math.min(...g.people.map((p) => hits[p.sessionId] ?? 0));
      const winners = g.people.filter((p) => (hits[p.sessionId] ?? 0) === least);
      expect([...last.sprengja.winners].sort()).toEqual(winners.map((p) => p.sessionId).sort());

      const results = await sql`
        select user_id, score, won from public.game_results
        where room_id = ${g.roomId} and concept = 'sprengja'
      `;
      expect(results).toHaveLength(3);
      for (const p of g.people) {
        const mine = results.find((r) => r.user_id === p.userId);
        expect(mine).toMatchObject({
          score: 0 - (hits[p.sessionId] ?? 0),
          won: winners.includes(p),
        });
      }
    },
    SLOW,
  );
});

describe('leaving (§4.6.7)', () => {
  it(
    'hands the card on from a starter who leaves, and the bomb on from a holder who leaves',
    async () => {
      const g = await game(5);
      const [a, b, c] = (await g.order()) as [Person, Person, Person];
      // The owner sits first, so a is the owner: b leaves the starter's seat in round 2 instead.
      expect(a).toBe(g.owner);
      let st = await light(g);
      expect(await pass(a, g, st)).toEqual(OK);
      st = await state(g.roomId);
      expect(st.holder).toBe(b.sessionId);
      expect(await rooms(b, { action: 'leave-game', roomId: g.roomId })).toEqual(OK);
      st = await state(g.roomId);
      expect(st).toMatchObject({ phase: 'lit', holder: c.sessionId, passes: 1 });
      expect(st.gone).toEqual([b.sessionId]);
      expect(replayRound(await events(g.roomId), 1)).toMatchObject({
        holder: c.sessionId,
        passes: 1,
      });

      await burnOut(g.roomId);
      expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      st = await state(g.roomId);
      expect(st.starter).toBe(c.sessionId);
      // The starter leaves on Tur sonu: the next player starts the next round.
      expect(await leave(c, g.roomId)).toMatchObject({ status: 200 });
      st = await state(g.roomId);
      expect(st.starter).toBe(st.order[3]);
    },
    SLOW,
  );

  it(
    'blows up with a holder who leaves after the fuse ran out, and nobody loses a point',
    async () => {
      const g = await game(4);
      let st = await light(g);
      const [a, b] = (await g.order()) as [Person, Person];
      expect(await pass(a, g, st)).toEqual(OK);
      await burnOut(g.roomId);
      expect(await rooms(b, { action: 'leave-game', roomId: g.roomId })).toEqual(OK);
      st = await state(g.roomId);
      expect(st).toMatchObject({
        phase: 'summary',
        hits: {},
        lastBlast: { round: 1, holder: b.sessionId, gone: true },
      });
      expect(st.starter).toBe(st.order[2]);
    },
    SLOW,
  );

  it(
    'halts below three and ends abandoned, with the scores and no winner',
    async () => {
      const g = await game(3);
      await light(g);
      await burnOut(g.roomId);
      expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const blasted = (await state(g.roomId)).lastBlast?.holder;
      const [, b] = (await g.order()) as [Person, Person];
      expect(await rooms(b, { action: 'leave-game', roomId: g.roomId })).toEqual(OK);
      expect((await state(g.roomId)).phase).toBe('halted');
      expect(await fuseOf(g.roomId)).toBeNull();
      expect(await sprengja(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const row = await roomRow(g.roomId);
      expect(row.concept).toBeNull();
      expect(row.game_state.lastGame).toMatchObject({
        concept: 'sprengja',
        abandoned: true,
        sprengja: { winners: [], hits: { [blasted as string]: 1 } },
      });
      const [results] = await sql`
        select count(*)::int as n from public.game_results where room_id = ${g.roomId}
      `;
      expect(results?.n).toBe(0);
    },
    SLOW,
  );
});

describe('locks (§4.K)', () => {
  // A throw sent while the job holds the table waits for it and then finds the round over; nothing
  // deadlocks (check-in → rooms → game_players → game_secrets).
  it(
    'lets a throw wait for the job and find the bomb gone off',
    async () => {
      const g = await game(3);
      const st = await light(g);
      const holder = g.by(st.holder);
      await burnOut(g.roomId);
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await tx`select private.sprengja_explode_due()`;
          later = second`
            select public.sprengja_pass(${holder.userId}, ${g.roomId}, ${st.round}, ${st.step}) as r
          `
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('sprengja_pass');
        });
        expect(await later).toEqual([{ r: 'over' }]);
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      expect((await events(g.roomId)).filter((e) => e.type === 'sp_explode')).toHaveLength(1);
    },
    SLOW,
  );

  // A player leaving the game while a throw holds the table: the trigger runs under the table's
  // lock and takes no new one on it.
  it(
    'lets a leaving player wait for a throw',
    async () => {
      const g = await game(4);
      const st = await light(g);
      const [a, , c] = (await g.order()) as [Person, Person, Person];
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await tx`select public.sprengja_pass(${a.userId}, ${g.roomId}, ${st.round}, ${st.step})`;
          later = second`select (public.rooms_leave_game(${c.userId}, ${g.roomId})).id`
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('rooms_leave_game');
        });
        expect(await later).toHaveLength(1);
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      const after = await state(g.roomId);
      expect(after.gone).toEqual([c.sessionId]);
      expect(replayRound(await events(g.roomId), st.round)).toMatchObject({
        holder: after.holder,
        passes: after.passes,
      });
    },
    SLOW,
  );
});
