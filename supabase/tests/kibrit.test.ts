// Faz 4 step 4.6.7 (docs/SPEC_V4.md §4.F "Adım 4.6.7: Kibrit", K-85): nameless questions, a jar,
// one paper a round, a secret vote. The author of a paper and who voted for whom never leave the
// server (rule 3); the table sees counts only, and below five players only who got the most. The
// clock is the server's: a test runs a phase out by moving its endsAt into the past.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import { type Person, person, roomRow, rooms, TABLE_PHONES, tableWith } from './people.ts';

let venue: Record<string, string> = {};

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

// The frame's tests close every game after each of theirs; this file plays Kibrit.
beforeEach(async () => {
  await sql`update public.games set is_available = true where id = 'kibrit'`;
});

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  // Kibrit is "Yakında" in content/games.json until its screens come (K-85).
  await sql`update public.games set is_available = false where id = 'kibrit'`;
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
const SLOW = 90_000;
const kibrit = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'kibrit', body);

type State = Record<string, unknown> & {
  phase?: string;
  step?: number;
  endsAt?: string;
  drawer?: string;
  written?: number;
  voted?: number;
  paper?: { id: string; text: string };
  result?: {
    paperId: string;
    players: number;
    voters: number;
    top: string[];
    counts?: Record<string, number>;
  };
  past?: { paperId: string; text: string; top: string[]; votes: number | null }[];
  seats?: string[];
  gone?: string[];
  done?: number;
  rounds?: number;
};

type Game = { roomId: string; owner: Person; people: Person[]; players: Person[] };

// `count` people at the owner's table, the page opened and the game started (`watch`: these pick
// "Gözlemci ol" first; `rounds`: the owner's round limit).
async function game(
  count: number,
  opts: { watch?: number[]; rounds?: number } = {},
): Promise<Game> {
  const people = await Promise.all(Array.from({ length: count }, (_, n) => person(venue, n)));
  const [owner, ...others] = people as [Person, ...Person[]];
  const roomId = await tableWith(owner, others);
  expect(await rooms(owner, { action: 'open-game', roomId, concept: 'kibrit' })).toEqual(OK);
  for (const n of opts.watch ?? []) {
    expect(await rooms(people[n] as Person, { action: 'pick', roomId, pick: 'obs' })).toEqual(OK);
  }
  expect(
    await kibrit(owner, {
      action: 'start',
      roomId,
      ...(opts.rounds ? { rounds: opts.rounds } : {}),
    }),
  ).toEqual(OK);
  const watch = new Set(opts.watch ?? []);
  return { roomId, owner, people, players: people.filter((_, n) => !watch.has(n)) };
}

async function state(roomId: string): Promise<State> {
  return (await roomRow(roomId)).game_state as State;
}

async function step(roomId: string): Promise<number> {
  return Number((await state(roomId)).step);
}

async function runOut(g: Game, by: Person = g.owner): Promise<State> {
  await sql`
    update public.rooms
    set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
    where id = ${g.roomId}
  `;
  expect(await kibrit(by, { action: 'advance', roomId: g.roomId })).toEqual(OK);
  return state(g.roomId);
}

async function view(p: Person, roomId: string) {
  const res = await kibrit(p, { action: 'view', roomId });
  expect(res.status).toBe(200);
  return res.body as {
    paper: string | null;
    paperRev: number;
    vote: string | null;
    voteRev: number;
  };
}

const write = (p: Person, g: Game, at: number, rev: number, text: string) =>
  kibrit(p, { action: 'write', roomId: g.roomId, step: at, rev, text });
const vote = (p: Person, g: Game, at: number, rev: number, target: Person) =>
  kibrit(p, { action: 'vote', roomId: g.roomId, step: at, rev, target: target.sessionId });

const question = (n: number) =>
  `Masada en çok kim ${['güler', 'konuşur', 'geç kalır', 'dans eder', 'uyur', 'yer'][n % 6]}?`;

// Everyone writes; the jar shuffles; the first drawer's turn.
async function toDraw(g: Game, writers = g.players): Promise<State> {
  const at = await step(g.roomId);
  for (const [n, p] of writers.entries()) {
    expect((await write(p, g, at, 1, question(n))).status).toBe(200);
  }
  expect((await state(g.roomId)).phase).toBe('jar');
  return runOut(g);
}

const byId = (g: Game, sid: string | undefined) =>
  g.people.find((p) => p.sessionId === sid) as Person;

async function drawAndOpenVote(g: Game): Promise<State> {
  const s = await state(g.roomId);
  expect(s.phase).toBe('draw');
  expect(
    await kibrit(byId(g, s.drawer), { action: 'draw', roomId: g.roomId, step: s.step }),
  ).toEqual(OK);
  const open = await state(g.roomId);
  expect(open.phase).toBe('open');
  expect(await kibrit(g.owner, { action: 'to-vote', roomId: g.roomId, step: open.step })).toEqual(
    OK,
  );
  return state(g.roomId);
}

async function papers(roomId: string) {
  return sql`select id, author_session_id, body, status, reported from public.kibrit_papers where room_id = ${roomId}`;
}

async function votes(roomId: string) {
  return sql`select voter_session_id, target_session_id from public.kibrit_votes where room_id = ${roomId}`;
}

describe('writing (§4.6.7, rule 3)', () => {
  it(
    'keeps each paper on its own phone and shows only how many wrote',
    async () => {
      const g = await game(4, { watch: [3] });
      const [a, b, , w] = g.people as [Person, Person, Person, Person];
      const at = await step(g.roomId);
      expect((await write(a, g, at, 1, 'Kim en çok güler?')).body).toMatchObject({
        paper: 'Kim en çok güler?',
        paperRev: 1,
      });
      const open = await state(g.roomId);
      expect(open).toMatchObject({ phase: 'write', written: 1 });
      // No text, no tick, no author anywhere in the open state.
      const text = JSON.stringify(open);
      expect(text).not.toContain('güler');
      expect(open).not.toHaveProperty('wrote');
      expect((await view(b, g.roomId)).paper).toBeNull();
      expect((await view(w, g.roomId)).paper).toBeNull();

      // No client reads the papers or the votes, not even its own (RLS on, no policy).
      for (const p of [a, b, w]) {
        const own = await p.client.from('kibrit_papers' as never).select('*');
        expect(own.data ?? []).toEqual([]);
        const cast = await p.client.from('kibrit_votes' as never).select('*');
        expect(cast.data ?? []).toEqual([]);
      }

      // A watcher neither writes nor votes.
      expect(await write(w, g, at, 1, 'Kim?')).toEqual({
        status: 403,
        body: errorBody('not_player'),
      });
    },
    SLOW,
  );

  it(
    'refuses contact details, a username, profanity and an empty or long question',
    async () => {
      const g = await game(3);
      const [a] = g.people as [Person];
      const at = await step(g.roomId);
      expect(await write(a, g, at, 1, 'Kim 0532 123 45 67 numarayı arar?')).toEqual({
        status: 422,
        body: errorBody('contact_not_allowed'),
      });
      expect(await write(a, g, at, 1, 'insta: elif_k kimin?')).toEqual({
        status: 422,
        body: errorBody('contact_not_allowed'),
      });
      expect(await write(a, g, at, 1, 'Kim en çok siktir der?')).toEqual({
        status: 422,
        body: errorBody('profanity_rejected'),
      });
      expect(await write(a, g, at, 1, '   ')).toEqual({
        status: 400,
        body: errorBody('message_invalid'),
      });
      expect(await write(a, g, at, 1, 'ğ'.repeat(81))).toEqual({
        status: 400,
        body: errorBody('message_invalid'),
      });
      expect(await papers(g.roomId)).toEqual([]);
    },
    SLOW,
  );
});

describe("revisions (rule 3's exception)", () => {
  it(
    'keeps the greatest rev: the same write or vote sent twice, or an older one after it, changes nothing',
    async () => {
      const g = await game(3);
      const [a, b, c] = g.people as [Person, Person, Person];
      const at = await step(g.roomId);
      await write(a, g, at, 1, 'Kim en çok güler?');
      expect((await write(a, g, at, 2, 'Kim en çok konuşur?')).body).toMatchObject({
        paper: 'Kim en çok konuşur?',
        paperRev: 2,
      });
      // The same call again, and an older one arriving late.
      expect((await write(a, g, at, 2, 'Kim en çok konuşur?')).body).toMatchObject({ paperRev: 2 });
      expect((await write(a, g, at, 1, 'Kim en çok güler?')).body).toMatchObject({
        paper: 'Kim en çok konuşur?',
        paperRev: 2,
      });
      expect((await state(g.roomId)).written).toBe(1);

      await write(b, g, at, 1, question(1));
      await write(c, g, at, 1, question(2));
      // A write after the phase closed (everyone wrote) changes nothing.
      expect((await write(a, g, at, 3, 'Geç kalan')).body).toMatchObject({ paper: null });
      expect((await papers(g.roomId)).map((p) => p.body)).toContain('Kim en çok konuşur?');

      await runOut(g);
      const v = await drawAndOpenVote(g);
      const vs = v.step as number;
      expect((await vote(a, g, vs, 1, b)).body).toMatchObject({ vote: b.sessionId, voteRev: 1 });
      expect((await vote(a, g, vs, 1, b)).body).toMatchObject({ vote: b.sessionId, voteRev: 1 });
      // Two changes racing: the greater rev wins whichever lands first.
      const [r3, r4] = await Promise.all([vote(a, g, vs, 3, c), vote(a, g, vs, 4, a)]);
      expect(r3.status).toBe(200);
      expect(r4.status).toBe(200);
      expect((await view(a, g.roomId)).vote).toBe(a.sessionId);
      expect((await vote(a, g, vs, 2, b)).body).toMatchObject({ vote: a.sessionId, voteRev: 4 });
      expect((await state(g.roomId)).voted).toBe(1);
    },
    SLOW,
  );

  it(
    "takes no revision once the phase's time is up, before any advance",
    async () => {
      const g = await game(3);
      const [a] = g.people as [Person];
      const at = await step(g.roomId);
      await write(a, g, at, 1, 'Kim en çok güler?');
      await sql`
        update public.rooms
        set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 second'))
        where id = ${g.roomId}
      `;
      expect((await write(a, g, at, 2, 'Kim en çok konuşur?')).body).toMatchObject({
        paper: 'Kim en çok güler?',
        paperRev: 1,
      });
    },
    SLOW,
  );

  it(
    'takes no more than 20 revisions in a step',
    async () => {
      const g = await game(3);
      const [a] = g.people as [Person];
      const at = await step(g.roomId);
      for (let rev = 1; rev <= 22; rev++) await write(a, g, at, rev, `Soru ${rev}`);
      expect((await view(a, g.roomId)).paper).toBe('Soru 20');
    },
    SLOW,
  );
});

describe('not enough papers (K-85)', () => {
  it(
    'ends before any vote when fewer than three players wrote',
    async () => {
      const g = await game(4);
      const [a, b] = g.people as [Person, Person];
      const at = await step(g.roomId);
      await write(a, g, at, 1, question(0));
      await write(b, g, at, 1, question(1));
      await runOut(g);
      const row = await roomRow(g.roomId);
      expect(row.concept).toBeNull();
      expect(row.game_state.lastGame.kibrit).toMatchObject({
        notEnough: true,
        rounds: 0,
        past: [],
      });
      expect(await papers(g.roomId)).toEqual([]);
    },
    SLOW,
  );
});

describe('a game of three (rule 3, K-85)', () => {
  it(
    'draws in turn, votes in secret, shows only who got the most, and cleans up',
    async () => {
      const g = await game(3);
      const drawn = await toDraw(g);
      expect(drawn).toMatchObject({
        phase: 'draw',
        papers: 3,
        rounds: 3,
        drawer: drawn.seats?.[0],
      });

      const drawer = byId(g, drawn.drawer);
      const other = g.people.find((p) => p !== drawer && p !== g.owner) ?? g.owner;
      if (other !== drawer) {
        expect(await kibrit(other, { action: 'draw', roomId: g.roomId, step: drawn.step })).toEqual(
          {
            status: 403,
            body: errorBody('not_your_seat'),
          },
        );
      }
      expect(await kibrit(drawer, { action: 'draw', roomId: g.roomId, step: drawn.step })).toEqual(
        OK,
      );
      // A second press on the same step changes nothing.
      expect(await kibrit(drawer, { action: 'draw', roomId: g.roomId, step: drawn.step })).toEqual(
        OK,
      );
      const open = await state(g.roomId);
      expect(open.phase).toBe('open');
      expect(Object.keys(open.paper ?? {}).sort()).toEqual(['id', 'text']);
      const authors = await papers(g.roomId);
      const author = authors.find((p) => p.id === open.paper?.id)?.author_session_id as string;
      // The author's session is in the state only as a seat, never next to the paper.
      expect(JSON.stringify(open.paper)).not.toContain(author);

      const nonOwner = g.people.find((p) => p !== g.owner && p !== drawer);
      if (nonOwner) {
        expect(
          await kibrit(nonOwner, { action: 'to-vote', roomId: g.roomId, step: open.step }),
        ).toEqual({ status: 403, body: errorBody('not_owner') });
      }
      expect(
        await kibrit(drawer, { action: 'to-vote', roomId: g.roomId, step: open.step }),
      ).toEqual(OK);
      const v = await state(g.roomId);
      expect(v).toMatchObject({ phase: 'vote', voted: 0 });

      // Everyone at once; one votes for themselves.
      const [a, b, c] = g.people as [Person, Person, Person];
      const answers = await Promise.all([
        vote(a, g, v.step as number, 1, b),
        vote(b, g, v.step as number, 1, b),
        vote(c, g, v.step as number, 1, a),
      ]);
      for (const res of answers) expect(res.status).toBe(200);
      const result = await state(g.roomId);
      expect(result.phase).toBe('result');
      expect(result.result).toEqual({
        paperId: open.paper?.id,
        text: open.paper?.text,
        players: 3,
        voters: 3,
        top: [b.sessionId],
      });
      expect(result.result).not.toHaveProperty('counts');
      expect(result.past?.[0]).toMatchObject({ top: [b.sessionId], votes: null });
      // The single votes are gone; nothing says who voted for whom.
      expect(await votes(g.roomId)).toEqual([]);
      expect(JSON.stringify(result)).not.toContain('"votes":{');

      // No automatic move: the clock is the 120-second safety net.
      const left = new Date(result.endsAt as string).getTime() - Date.now();
      expect(left).toBeGreaterThan(100_000);
      // Everyone ready moves on early, to the next drawer.
      for (const p of g.people) {
        expect(await kibrit(p, { action: 'ready', roomId: g.roomId, step: result.step })).toEqual(
          OK,
        );
      }
      const next = await state(g.roomId);
      expect(next.phase).toBe('draw');
      expect(next.drawer).toBe(drawn.seats?.[1]);

      // Two more rounds, nobody voting in the last: "Bu kâğıda oy çıkmadı".
      const v2 = await drawAndOpenVote(g);
      await vote(a, g, v2.step as number, 1, c);
      const r2 = await runOut(g);
      expect(r2.result).toMatchObject({ voters: 1, top: [c.sessionId] });
      expect(await kibrit(g.owner, { action: 'next', roomId: g.roomId, step: r2.step })).toEqual(
        OK,
      );
      await drawAndOpenVote(g);
      const r3 = await runOut(g);
      expect(r3.result).toMatchObject({ voters: 0, top: [] });
      expect(await kibrit(g.owner, { action: 'next', roomId: g.roomId, step: r3.step })).toEqual(
        OK,
      );

      const row = await roomRow(g.roomId);
      expect(row.concept).toBeNull();
      expect(row.game_state.lastGame.kibrit).toMatchObject({ notEnough: false, rounds: 3 });
      expect(row.game_state.lastGame.kibrit.past).toHaveLength(3);
      expect(JSON.stringify(row.game_state)).not.toContain('author');
      // Every paper and vote is gone; no score.
      expect(await papers(g.roomId)).toEqual([]);
      expect(await votes(g.roomId)).toEqual([]);
      const results = await sql`
        select count(*)::int as n from public.game_results where room_id = ${g.roomId}
      `;
      expect(results).toEqual([{ n: 0 }]);
    },
    SLOW,
  );
});

describe('five and more (K-85)', () => {
  it(
    'shows every count and puts every tied one first',
    async () => {
      const g = await game(5, { rounds: 2 });
      await toDraw(g);
      const v = await drawAndOpenVote(g);
      const [a, b, c, d, e] = g.people as [Person, Person, Person, Person, Person];
      await vote(a, g, v.step as number, 1, b);
      await vote(b, g, v.step as number, 1, a);
      await vote(c, g, v.step as number, 1, b);
      await vote(d, g, v.step as number, 1, a);
      await vote(e, g, v.step as number, 1, e);
      const r = await state(g.roomId);
      expect(r.result?.counts).toEqual({
        [a.sessionId]: 2,
        [b.sessionId]: 2,
        [c.sessionId]: 0,
        [d.sessionId]: 0,
        [e.sessionId]: 1,
      });
      expect([...(r.result?.top ?? [])].sort()).toEqual([a.sessionId, b.sessionId].sort());
      expect(r.past?.[0]?.votes).toBe(2);
      expect(r.rounds).toBe(2);
    },
    SLOW,
  );
});

describe('skip and report (K-85)', () => {
  it(
    'skips for the owner only; a report reaches only the report, and leaves the summary',
    async () => {
      const g = await game(3);
      await toDraw(g);
      const s = await state(g.roomId);
      const drawer = byId(g, s.drawer);
      await kibrit(drawer, { action: 'draw', roomId: g.roomId, step: s.step });
      const open = await state(g.roomId);
      const skipped = open.paper?.id as string;
      const notOwner = g.people.find((p) => p !== g.owner) as Person;
      expect(await kibrit(notOwner, { action: 'skip', roomId: g.roomId, step: open.step })).toEqual(
        {
          status: 403,
          body: errorBody('not_owner'),
        },
      );
      expect(await kibrit(g.owner, { action: 'skip', roomId: g.roomId, step: open.step })).toEqual(
        OK,
      );
      const again = await state(g.roomId);
      expect(again).toMatchObject({ phase: 'draw', done: 0, drawer: s.drawer });
      expect(again).not.toHaveProperty('paper');

      // The next paper: its author reported by someone else, once; their own report writes nothing.
      await kibrit(drawer, { action: 'draw', roomId: g.roomId, step: again.step });
      const opened = await state(g.roomId);
      expect(opened.paper?.id).not.toBe(skipped);
      const paperId = opened.paper?.id as string;
      const [row] = await sql`
        select author_session_id from public.kibrit_papers where id = ${paperId}
      `;
      const author = byId(g, row?.author_session_id as string);
      const reporter = g.people.find((p) => p !== author) as Person;
      const report = (p: Person, id: string) =>
        invoke(p.client, 'safety', {
          action: 'report',
          target: 'kibrit_paper',
          roomId: g.roomId,
          paperId: id,
          reason: 'inappropriate',
        });
      expect(await report(author, paperId)).toEqual(OK);
      expect(await report(reporter, paperId)).toEqual(OK);
      expect(await report(reporter, paperId)).toEqual(OK);
      // An unopened paper and an unknown one write nothing, with the same answer.
      const [unopened] = await sql`
        select id from public.kibrit_papers where room_id = ${g.roomId} and status = 'in' limit 1
      `;
      expect(await report(reporter, unopened?.id as string)).toEqual(OK);
      expect(await report(reporter, '00000000-0000-4000-8000-000000000000')).toEqual(OK);
      const reports = await sql`
        select reporter_id, reported_user_id, messages_snapshot from public.reports
        where target_type = 'kibrit_paper' and room_id = ${g.roomId}
      `;
      expect(reports).toHaveLength(1);
      expect(reports[0]).toMatchObject({
        reporter_id: reporter.userId,
        reported_user_id: author.userId,
        messages_snapshot: { paperId, text: opened.paper?.text },
      });

      await kibrit(g.owner, { action: 'to-vote', roomId: g.roomId, step: opened.step });
      const r = await runOut(g);
      expect(r.past).toHaveLength(1);
      // The game runs to its end; the reported paper leaves the summary, the skipped one was never
      // in it.
      await kibrit(g.owner, { action: 'next', roomId: g.roomId, step: r.step });
      // One paper left: its round, then the empty jar ends the game at once.
      await drawAndOpenVote(g);
      const r3 = await runOut(g);
      expect(r3.done).toBe(2);
      await kibrit(g.owner, { action: 'next', roomId: g.roomId, step: r3.step });
      expect((await roomRow(g.roomId)).concept).toBeNull();
      const end = (await roomRow(g.roomId)).game_state.lastGame.kibrit;
      const ids = (end.past as { paperId: string }[]).map((p) => p.paperId);
      expect(ids).not.toContain(paperId);
      expect(ids).not.toContain(skipped);
      // The report outlives the paper.
      expect(await papers(g.roomId)).toEqual([]);
      expect(
        await sql`select 1 from public.reports where target_type = 'kibrit_paper' and room_id = ${g.roomId}`,
      ).toHaveLength(1);
    },
    SLOW,
  );
});

describe('leaving (K-85)', () => {
  it(
    'stops counting the votes for who left, gives their voters time to choose again, and keeps past rounds',
    async () => {
      const g = await game(4, { rounds: 2 });
      await toDraw(g);
      const v1 = await drawAndOpenVote(g);
      const [a, b, c, d] = g.people as [Person, Person, Person, Person];
      for (const p of g.people) await vote(p, g, v1.step as number, 1, d);
      const r1 = await state(g.roomId);
      expect(r1.past?.[0]?.top).toEqual([d.sessionId]);
      await kibrit(g.owner, { action: 'next', roomId: g.roomId, step: r1.step });

      const v2 = await drawAndOpenVote(g);
      await vote(b, g, v2.step as number, 1, d);
      await vote(c, g, v2.step as number, 1, b);
      // Almost out of time when d leaves the table.
      await sql`
        update public.rooms
        set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() + interval '2 seconds'))
        where id = ${g.roomId}
      `;
      expect((await rooms(d, { action: 'leave', roomId: g.roomId })).status).toBe(200);
      const after = await state(g.roomId);
      // The count does not drop by the votes d had: it tells nothing of them.
      expect(after).toMatchObject({ phase: 'vote', voted: 2, gone: [d.sessionId] });
      expect(new Date(after.endsAt as string).getTime() - Date.now()).toBeGreaterThan(6_000);
      // b's vote for d no longer counts; b sees it and chooses again.
      expect((await view(b, g.roomId)).vote).toBe(d.sessionId);
      // A vote for who left is refused; b chooses again.
      expect(await vote(b, g, v2.step as number, 3, d)).toEqual({
        status: 400,
        body: errorBody('bad_request'),
      });
      await vote(b, g, v2.step as number, 2, c);
      await vote(a, g, v2.step as number, 1, c);
      // After a leaving the vote closes only by its clock, even with everyone voted.
      expect((await state(g.roomId)).phase).toBe('vote');
      const r2 = await runOut(g);
      expect(r2.result).toMatchObject({ players: 3, voters: 3, top: [c.sessionId] });
      // The first round's result did not change.
      expect(r2.past?.[0]?.top).toEqual([d.sessionId]);
    },
    SLOW,
  );

  it(
    'goes on when the owner leaves, and ends when fewer than three are left',
    async () => {
      const g = await game(4);
      await toDraw(g);
      const v = await drawAndOpenVote(g);
      const others = g.people.filter((p) => p !== g.owner);
      for (const p of g.people) await vote(p, g, v.step as number, 1, others[0] as Person);
      const r = await state(g.roomId);
      expect(r.phase).toBe('result');
      expect((await rooms(g.owner, { action: 'leave', roomId: g.roomId })).status).toBe(200);
      // Nobody presses: the 120-second safety net moves on.
      const next = await runOut({ ...g, owner: others[0] as Person }, others[1]);
      expect(next.phase).toBe('draw');
      expect((await rooms(others[2] as Person, { action: 'leave', roomId: g.roomId })).status).toBe(
        200,
      );
      expect(new Date((await state(g.roomId)).endsAt as string).getTime()).toBeLessThanOrEqual(
        Date.now() + 1_000,
      );
      await runOut({ ...g, owner: others[0] as Person }, others[0]);
      const row = await roomRow(g.roomId);
      expect(row.concept).toBeNull();
      expect(row.game_state.lastGame.kibrit.past).toHaveLength(1);
      expect(await papers(g.roomId)).toEqual([]);
    },
    SLOW,
  );

  it(
    'takes a paper out while the table writes, and keeps it in the jar after',
    async () => {
      const g = await game(4);
      const [a, b, c, d] = g.people as [Person, Person, Person, Person];
      const at = await step(g.roomId);
      await write(d, g, at, 1, question(3));
      expect((await state(g.roomId)).written).toBe(1);
      expect((await rooms(d, { action: 'leave', roomId: g.roomId })).status).toBe(200);
      expect((await state(g.roomId)).written).toBe(0);
      expect(await papers(g.roomId)).toEqual([]);
      for (const [n, p] of [a, b, c].entries()) await write(p, g, at, 1, question(n));
      await runOut(g);
      expect((await state(g.roomId)).papers).toBe(3);
    },
    SLOW,
  );
});

describe('leaving the game (K-85)', () => {
  it(
    'leaves who left the game watching: no write, no vote, no draw',
    async () => {
      const g = await game(4);
      const [, b] = g.people as [Person, Person];
      expect(await rooms(b, { action: 'leave-game', roomId: g.roomId })).toEqual(OK);
      const at = await step(g.roomId);
      expect(await write(b, g, at, 1, question(1))).toEqual({
        status: 403,
        body: errorBody('not_player'),
      });
      await toDraw(
        g,
        g.people.filter((p) => p !== b),
      );
      const s = await state(g.roomId);
      expect(s.gone).toEqual([b.sessionId]);
      expect(await kibrit(b, { action: 'draw', roomId: g.roomId, step: s.step })).toEqual({
        status: 403,
        body: errorBody('not_your_seat'),
      });
      const v = await drawAndOpenVote(g);
      expect(await vote(b, g, v.step as number, 1, g.owner)).toEqual({
        status: 403,
        body: errorBody('not_player'),
      });
    },
    SLOW,
  );
});

describe('the clock (§4.6.7, IDEMPOTENT_CALLS)', () => {
  // kibrit/advance and kibrit/view are in IDEMPOTENT_CALLS.
  it(
    'changes nothing with an early advance, and the same with one sent twice',
    async () => {
      const g = await game(3);
      const before = await state(g.roomId);
      expect(await kibrit(g.owner, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(before);
      const [a, b, c] = g.people as [Person, Person, Person];
      for (const [n, p] of [a, b, c].entries())
        await write(p, g, before.step as number, 1, question(n));
      const jar = await runOut(g);
      expect(jar.phase).toBe('draw');
      expect(await kibrit(b, { action: 'advance', roomId: g.roomId })).toEqual(OK);
      expect(await state(g.roomId)).toEqual(jar);
      expect(await view(c, g.roomId)).toEqual(await view(c, g.roomId));
      // The drawer did not press in time: the server draws.
      const open = await runOut(g);
      expect(open.phase).toBe('open');
      const vote = await runOut(g);
      expect(vote.phase).toBe('vote');
    },
    SLOW,
  );
});

describe('the end of a game (K-85)', () => {
  it(
    'leaves no paper or vote behind on "Oyunu bitir", and no summary on a closed table',
    async () => {
      const g = await game(3);
      await toDraw(g);
      await drawAndOpenVote(g);
      const [a, b] = g.people as [Person, Person];
      await vote(a, g, await step(g.roomId), 1, b);
      expect((await papers(g.roomId)).length).toBe(3);
      expect(await rooms(g.owner, { action: 'end-game', roomId: g.roomId })).toEqual(OK);
      expect(await papers(g.roomId)).toEqual([]);
      expect(await votes(g.roomId)).toEqual([]);

      // A game to its end, then the table closes: its summary goes with it.
      const s = await kibritAgain(g);
      expect(s.lastGame).toHaveProperty('kibrit');
      expect((await rooms(g.owner, { action: 'end' })).status).toBe(200);
      const closed = await roomRow(g.roomId);
      expect(closed.status).toBe('closed');
      expect(closed.game_state.lastGame ?? {}).not.toHaveProperty('kibrit');
    },
    SLOW,
  );
});

describe('a table closing mid-game (K-85)', () => {
  it(
    'leaves no paper or vote behind when the owner ends the table during the vote',
    async () => {
      const g = await game(3);
      await toDraw(g);
      const v = await drawAndOpenVote(g);
      const [a, b] = g.people as [Person, Person];
      await vote(a, g, v.step as number, 1, b);
      expect((await votes(g.roomId)).length).toBe(1);
      expect((await rooms(g.owner, { action: 'end' })).status).toBe(200);
      expect((await roomRow(g.roomId)).status).toBe('closed');
      expect(await papers(g.roomId)).toEqual([]);
      expect(await votes(g.roomId)).toEqual([]);
    },
    SLOW,
  );
});

// The same table plays a short game to its end (one round).
async function kibritAgain(g: Game) {
  expect(
    await rooms(g.owner, { action: 'open-game', roomId: g.roomId, concept: 'kibrit' }),
  ).toEqual(OK);
  expect(await kibrit(g.owner, { action: 'start', roomId: g.roomId, rounds: 1 })).toEqual(OK);
  await toDraw(g);
  await drawAndOpenVote(g);
  const r = await runOut(g);
  await kibrit(g.owner, { action: 'next', roomId: g.roomId, step: r.step });
  return (await roomRow(g.roomId)).game_state as Record<string, unknown>;
}

describe('locks (§4.K)', () => {
  // A vote sent while an advance holds the table waits for it and finds the vote open; nothing
  // deadlocks (check-in → rooms → game_players → kibrit_papers → kibrit_votes).
  it(
    'lets a vote wait for an advance',
    async () => {
      const g = await game(3);
      await toDraw(g);
      const s = await state(g.roomId);
      await kibrit(byId(g, s.drawer), { action: 'draw', roomId: g.roomId, step: s.step });
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
          await tx`select (public.kibrit_advance(${a.userId}, ${g.roomId})).id`;
          later = second`
            select public.kibrit_vote(${b.userId}, ${g.roomId}, ${at}, 1, ${a.sessionId})
          `
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('kibrit_vote');
        });
        expect(await later).toHaveLength(1);
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      expect(await votes(g.roomId)).toEqual([
        { voter_session_id: b.sessionId, target_session_id: a.sessionId },
      ]);
    },
    SLOW,
  );

  // A report while the owner's skip holds the table waits for it; nothing deadlocks (the report
  // takes rooms, then the paper).
  it(
    'lets a report wait for a skip',
    async () => {
      const g = await game(3);
      await toDraw(g);
      const s = await state(g.roomId);
      await kibrit(byId(g, s.drawer), { action: 'draw', roomId: g.roomId, step: s.step });
      const open = await state(g.roomId);
      const paperId = open.paper?.id as string;
      const [row] = await sql`
        select author_session_id from public.kibrit_papers where id = ${paperId}
      `;
      const reporter = g.people.find((p) => p.sessionId !== row?.author_session_id) as Person;
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await tx`select (public.kibrit_skip(${g.owner.userId}, ${g.roomId}, ${open.step})).id`;
          later = second`
            select public.safety_report_kibrit_paper(
              ${reporter.userId}, ${g.roomId}, ${paperId}, 'inappropriate'
            )
          `
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked('safety_report_kibrit_paper');
        });
        expect(await later).toHaveLength(1);
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      // The skipped paper was opened: its report is written.
      expect(
        await sql`select 1 from public.reports where target_type = 'kibrit_paper' and room_id = ${g.roomId}`,
      ).toHaveLength(1);
    },
    SLOW,
  );
});
