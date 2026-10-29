// Faz 4 step 4.6.6 (docs/SPEC_V4.md §4.F "Adım 4.6.6: Vampir Köylü", K-78): the phone is the
// narrator. Roles are dealt by the server and stay on their own phones (rule 3); at night every
// living player chooses once, by day the table votes openly; who leaves counts as dead without a
// role. The clock is the server's: a test runs a phase out by moving its endsAt into the past.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { roleDeck, type VampirRole } from '../functions/_shared/pure/vampir.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import { type Person, person, roomRow, rooms, TABLE_PHONES, tableWith } from './people.ts';

let venue: Record<string, string> = {};

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

// The frame's tests close every game after each of theirs; this file plays Vampir Köylü.
beforeEach(async () => {
  await sql`update public.games set is_available = true where id = 'vampir'`;
});

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
// A game takes five to ten people signed up, checked in and seated, and many calls.
const SLOW = 90_000;
const vampir = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'vampir', body);

type Game = {
  roomId: string;
  owner: Person;
  people: Person[];
  role: (p: Person) => VampirRole;
  by: (r: VampirRole) => Person[];
};

// `count` people at the owner's table, the page opened and the game started (`watch`: these pick
// "Gözlemci ol" first).
async function game(count: number, watch: number[] = []): Promise<Game> {
  const people = await Promise.all(Array.from({ length: count }, (_, n) => person(venue, n)));
  const [owner, ...others] = people as [Person, ...Person[]];
  const roomId = await tableWith(owner, others);
  expect(await rooms(owner, { action: 'open-game', roomId, concept: 'vampir' })).toEqual(OK);
  for (const n of watch) {
    expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick: 'obs' })).toEqual(OK);
  }
  expect(await vampir(owner, { action: 'start', roomId })).toEqual(OK);
  const rows = await sql`
    select session_id, role from public.game_players where room_id = ${roomId}
  `;
  const roles = new Map(rows.map((r) => [r.session_id as string, r.role as VampirRole]));
  const role = (p: Person) => {
    const r = roles.get(p.sessionId);
    if (!r) throw new Error(`${p.name} does not play`);
    return r;
  };
  const by = (r: VampirRole) => people.filter((p) => roles.get(p.sessionId) === r);
  return { roomId, owner, people, role, by };
}

async function state(roomId: string) {
  return (await roomRow(roomId)).game_state as Record<string, unknown> & {
    phase?: string;
    step?: number;
  };
}

async function step(roomId: string): Promise<number> {
  return Number((await state(roomId)).step);
}

// As if the phase's time had run out, then any phone's advance.
async function runOut(g: Game, by: Person = g.owner): Promise<Record<string, unknown>> {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
    where id = ${g.roomId}
  `;
  expect(await vampir(by, { action: 'advance', roomId: g.roomId })).toEqual(OK);
  return state(g.roomId);
}

async function view(p: Person, roomId: string) {
  const res = await vampir(p, { action: 'view', roomId });
  expect(res.status).toBe(200);
  return res.body as Record<string, unknown>;
}

async function readyAll(g: Game, players = g.people) {
  const at = await step(g.roomId);
  for (const p of players) {
    expect(await vampir(p, { action: 'ready', roomId: g.roomId, step: at })).toEqual(OK);
  }
}

const pick = (p: Person, g: Game, at: number, target: Person) =>
  vampir(p, { action: 'pick', roomId: g.roomId, step: at, target: target.sessionId });
const vote = (p: Person, g: Game, at: number, target: Person) =>
  vampir(p, { action: 'vote', roomId: g.roomId, step: at, target: target.sessionId });

const ROLE_WORDS = ['vampir', 'doktor', 'gozcu', 'soytari', 'koylu'];

describe('the roles (§4.6.6)', () => {
  it(
    'deals them by the count and keeps each on its own phone',
    async () => {
      const g = await game(7);
      const dealt = g.people.map((p) => g.role(p)).sort();
      expect(dealt).toEqual(roleDeck(7).sort());

      const open = await state(g.roomId);
      expect(open).toMatchObject({ phase: 'role', step: 1, round: 0, dead: [], gone: [] });
      expect(open.seats).toHaveLength(7);
      // No role word anywhere in the table's open state.
      const text = JSON.stringify(open);
      for (const word of ROLE_WORDS) expect(text).not.toContain(word);

      const vampires = g.by('vampir');
      expect(vampires).toHaveLength(2);
      for (const p of g.people) {
        const mine = await view(p, g.roomId);
        expect(mine.role).toBe(g.role(p));
        expect(mine.mates).toEqual(
          g.role(p) === 'vampir' ? vampires.filter((v) => v !== p).map((v) => v.sessionId) : [],
        );
      }
    },
    SLOW,
  );

  it(
    'gives a watcher no role and lets only the owner start',
    async () => {
      const people = await Promise.all(Array.from({ length: 6 }, (_, n) => person(venue, n)));
      const [owner, ...others] = people as [Person, ...Person[]];
      const roomId = await tableWith(owner, others);
      expect(await rooms(owner, { action: 'open-game', roomId, concept: 'vampir' })).toEqual(OK);
      expect(await vampir(others[0] as Person, { action: 'start', roomId })).toEqual({
        status: 400,
        body: errorBody('not_owner'),
      });
      const watcher = others[4] as Person;
      expect(await rooms(watcher, { action: 'pick', roomId, pick: 'obs' })).toEqual(OK);
      expect(await vampir(owner, { action: 'start', roomId })).toEqual(OK);
      expect(await view(watcher, roomId)).toEqual({ role: null });
      expect(await vampir(watcher, { action: 'ready', roomId, step: await step(roomId) })).toEqual({
        status: 400,
        body: errorBody('not_player'),
      });
    },
    SLOW,
  );

  it(
    'needs five players',
    async () => {
      const people = await Promise.all(Array.from({ length: 5 }, (_, n) => person(venue, n)));
      const [owner, ...others] = people as [Person, ...Person[]];
      const roomId = await tableWith(owner, others);
      expect(await rooms(owner, { action: 'open-game', roomId, concept: 'vampir' })).toEqual(OK);
      expect(await rooms(others[0] as Person, { action: 'pick', roomId, pick: 'obs' })).toEqual(OK);
      expect(await vampir(owner, { action: 'start', roomId })).toEqual({
        status: 400,
        body: errorBody('not_enough_players'),
      });
    },
    SLOW,
  );
});

describe('the role card (K-78)', () => {
  it(
    'starts the night when everyone is ready, or when the owner begins',
    async () => {
      const g = await game(5);
      await readyAll(g);
      expect(await state(g.roomId)).toMatchObject({ phase: 'night', round: 1, acted: 0 });

      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
      const h = await game(5);
      const guest = h.people[1] as Person;
      expect(await vampir(guest, { action: 'begin', roomId: h.roomId, step: 1 })).toEqual({
        status: 400,
        body: errorBody('not_owner'),
      });
      expect(await vampir(h.owner, { action: 'begin', roomId: h.roomId, step: 1 })).toEqual(OK);
      expect((await state(h.roomId)).phase).toBe('night');
      // A press from the phase that is over changes nothing.
      expect(await vampir(guest, { action: 'ready', roomId: h.roomId, step: 1 })).toEqual(OK);
      expect((await state(h.roomId)).phase).toBe('night');
    },
    SLOW,
  );
});

describe('the night (rule 3)', () => {
  it(
    'keeps every choice on its own phone and settles when everyone chose',
    async () => {
      const g = await game(7);
      await readyAll(g);
      const at = await step(g.roomId);
      const [v1, v2] = g.by('vampir') as [Person, Person];
      const [doctor] = g.by('doktor') as [Person];
      const [seer] = g.by('gozcu') as [Person];
      const villagers = g.people.filter((p) => g.role(p) === 'koylu' || g.role(p) === 'soytari');
      const victim = villagers[0] as Person;

      // Not allowed: a vampire choosing a vampire, anyone but the doctor choosing themselves.
      expect(await pick(v1, g, at, v2)).toEqual({ status: 400, body: errorBody('bad_request') });
      expect(await pick(seer, g, at, seer)).toEqual({
        status: 400,
        body: errorBody('bad_request'),
      });

      const first = await pick(v1, g, at, victim);
      expect(first.status).toBe(200);
      expect((first.body as { pick: string }).pick).toBe(victim.sessionId);
      // The other vampire sees it; the table sees one more chose, not who or whom.
      expect((await view(v2, g.roomId)).matePicks).toEqual({ [v1.sessionId]: victim.sessionId });
      expect((await view(doctor, g.roomId)).matePicks).toEqual({});
      const open = await state(g.roomId);
      expect(open.acted).toBe(1);
      expect(JSON.stringify(open)).not.toContain(`"${victim.sessionId}":`);

      // The seer learns at once, from the answer.
      const look = await pick(seer, g, at, v2);
      expect((look.body as { seen: unknown }).seen).toEqual([
        { sid: v2.sessionId, vampire: true, round: 1 },
      ]);
      // A second choice is ignored.
      await pick(seer, g, at, victim);
      expect((await view(seer, g.roomId)).seen).toHaveLength(1);

      await pick(v2, g, at, victim);
      await pick(doctor, g, at, doctor);
      for (const p of villagers) await pick(p, g, at, seer);
      const morning = await state(g.roomId);
      expect(morning).toMatchObject({
        phase: 'morning',
        victim: victim.sessionId,
        dead: [{ sid: victim.sessionId, role: g.role(victim), when: 'night', round: 1 }],
      });
    },
    SLOW,
  );

  it(
    'lets the doctor save, and not the same person two nights running',
    async () => {
      const g = await game(5);
      await readyAll(g);
      const [vamp] = g.by('vampir') as [Person];
      const [doctor] = g.by('doktor') as [Person];
      const target = g.by('koylu')[0] as Person;
      let at = await step(g.roomId);
      await pick(vamp, g, at, target);
      await pick(doctor, g, at, target);
      const morning = await runOut(g);
      expect(morning).toMatchObject({ phase: 'morning', victim: null, dead: [] });
      expect((await view(doctor, g.roomId)).lastSave).toBe(target.sessionId);

      expect((await runOut(g)).phase).toBe('day');
      expect((await runOut(g)).phase).toBe('vote');
      expect((await runOut(g)).phase).toBe('verdict');
      expect((await runOut(g)).phase).toBe('night');
      at = await step(g.roomId);
      expect(await pick(doctor, g, at, target)).toEqual({
        status: 400,
        body: errorBody('bad_request'),
      });
    },
    SLOW,
  );
});

describe('the day (K-78)', () => {
  it(
    'votes openly, puts nobody out on a tie and the jester out wins alone',
    async () => {
      const g = await game(6);
      const guest = g.people.find((p) => p !== g.owner) as Person;
      await vampir(g.owner, { action: 'begin', roomId: g.roomId, step: 1 });
      expect((await runOut(g)).phase).toBe('morning');
      expect((await runOut(g)).phase).toBe('day');
      let at = await step(g.roomId);
      expect(await vampir(guest, { action: 'to-vote', roomId: g.roomId, step: at })).toEqual({
        status: 400,
        body: errorBody('not_owner'),
      });
      expect(await vampir(g.owner, { action: 'to-vote', roomId: g.roomId, step: at })).toEqual(OK);
      at = await step(g.roomId);

      // A tie: three and three.
      const [a, b, ...rest] = g.people as [Person, Person, ...Person[]];
      expect(await vote(a, g, at, a)).toEqual({ status: 400, body: errorBody('bad_request') });
      await vote(a, g, at, b);
      expect((await state(g.roomId)).votes).toEqual({ [a.sessionId]: b.sessionId });
      for (const p of rest.slice(0, 2)) await vote(p, g, at, b);
      for (const p of [b, ...rest.slice(2)]) await vote(p, g, at, a);
      expect(await state(g.roomId)).toMatchObject({ phase: 'verdict', out: null, dead: [] });

      // Next day: everyone votes the jester out.
      expect((await runOut(g)).phase).toBe('night');
      expect((await runOut(g)).phase).toBe('morning');
      const night = await state(g.roomId);
      expect(night.victim).toBeNull();
      expect((await runOut(g)).phase).toBe('day');
      expect((await runOut(g)).phase).toBe('vote');
      at = await step(g.roomId);
      const [jester] = g.by('soytari') as [Person];
      for (const p of g.people) if (p !== jester) await vote(p, g, at, jester);
      await vote(jester, g, at, a === jester ? b : a);
      expect(await state(g.roomId)).toMatchObject({
        phase: 'verdict',
        out: jester.sessionId,
        winner: 'j',
        dead: [{ sid: jester.sessionId, role: 'soytari', when: 'vote' }],
      });
      await runOut(g);
      const row = await roomRow(g.roomId);
      expect(row.concept).toBeNull();
      expect(row.game_state.lastGame).toMatchObject({
        concept: 'vampir',
        abandoned: false,
        vampir: { winner: 'j' },
      });
      const results = await sql`
      select ts.id as session_id, gr.won from public.game_results gr
      join public.table_sessions ts on ts.user_id = gr.user_id
      where gr.room_id = ${g.roomId} and gr.concept = 'vampir' and gr.mode = 'vampir'
    `;
      expect(results).toHaveLength(6);
      for (const r of results) expect(r.won).toBe(r.session_id === jester.sessionId);
    },
    SLOW,
  );
});

describe('leaving (K-78)', () => {
  it(
    'counts who leaves as dead without a role, and ends a game it decides',
    async () => {
      const g = await game(5);
      await readyAll(g);
      const [vamp] = g.by('vampir') as [Person];
      // The vampire leaves the table (the owner too would: its table goes on under the next owner).
      expect(await rooms(vamp, { action: 'leave', roomId: g.roomId })).toMatchObject({
        status: 200,
      });
      const open = await state(g.roomId);
      expect(open.gone).toEqual([vamp.sessionId]);
      expect(JSON.stringify(open)).not.toContain('vampir');
      // No vampire left: the villagers have won; the next advance ends the game.
      expect(
        await vampir(g.people.find((p) => p !== vamp) as Person, {
          action: 'advance',
          roomId: g.roomId,
        }),
      ).toEqual(OK);
      const row = await roomRow(g.roomId);
      expect(row.game_state.lastGame.vampir).toMatchObject({ winner: 'k', gone: [vamp.sessionId] });
      expect(Object.keys(row.game_state.lastGame.vampir.roles)).not.toContain(vamp.sessionId);
      const results = await sql`
      select count(*)::int as n from public.game_results where room_id = ${g.roomId}
    `;
      expect(results).toEqual([{ n: 4 }]);
    },
    SLOW,
  );
});

describe('the clock (§4.F, IDEMPOTENT_CALLS)', () => {
  // vampir/advance and vampir/view are in IDEMPOTENT_CALLS.
  it(
    'changes nothing with an early advance, and the same with one sent twice',
    async () => {
      const g = await game(5);
      const before = await state(g.roomId);
      expect(await vampir(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(before);

      await sql`
      update public.rooms
      set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
      where id = ${g.roomId}
    `;
      expect(await vampir(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      const night = await state(g.roomId);
      expect(night.phase).toBe('night');
      expect(await vampir(g.people[1] as Person, { action: 'advance', roomId: g.roomId })).toEqual(
        OK,
      );
      expect(await state(g.roomId)).toEqual(night);

      const p = g.people[2] as Person;
      expect(await view(p, g.roomId)).toEqual(await view(p, g.roomId));
    },
    SLOW,
  );
});

describe('locks (§4.K)', () => {
  // A vote sent while an advance holds the table waits for it and finds the vote open; nothing
  // deadlocks (check-in → rooms → game_players → game_secrets).
  it(
    'lets a vote wait for an advance',
    async () => {
      const g = await game(5);
      await vampir(g.owner, { action: 'begin', roomId: g.roomId, step: 1 });
      await runOut(g);
      await runOut(g);
      await sql`
      update public.rooms
      set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
      where id = ${g.roomId}
    `;
      const at = (await step(g.roomId)) + 1;
      const [a, b] = g.people as [Person, Person];
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await tx`select (public.vampir_advance(${a.userId}, ${g.roomId})).id`;
          later = second`
          select (public.vampir_vote(${b.userId}, ${g.roomId}, ${at}, ${a.sessionId})).id
        `
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('vampir_vote');
        });
        expect(await later).toHaveLength(1);
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      expect((await state(g.roomId)).votes).toEqual({ [b.sessionId]: a.sessionId });
    },
    SLOW,
  );
});
