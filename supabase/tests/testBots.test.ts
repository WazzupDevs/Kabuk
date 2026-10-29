// Test bots (migration 20261114090000_test_bots.sql, _shared/testBots.ts): on the local stack and
// the dev project the owner of a table seats bots that play by themselves, to try a game with one
// phone. They sit down by a person's road and play through the game's own actions.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import {
  openTable,
  type Person,
  person,
  roomRow,
  rooms,
  seated,
  sit,
  TABLE_PHONES,
} from './people.ts';

let venue: Record<string, string> = {};

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

beforeEach(async () => {
  await sql`update public.games set is_available = true where id = 'vampir'`;
});

// The bots before their owners (deleting an owner forgets its bots, not their accounts).
afterEach(async () => {
  await sql`delete from auth.users where id in (select user_id from private.test_bots)`;
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
const SLOW = 90_000;
const vampir = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'vampir', body);
const bots = (seatedNow: number) => ({ status: 200, body: { available: true, seated: seatedNow } });

type State = Record<string, unknown> & {
  phase?: string;
  step?: number;
  ready?: string[];
  acted?: number;
  votes?: Record<string, string>;
  seats?: string[];
  dead?: { sid: string }[];
  gone?: string[];
};

async function state(roomId: string): Promise<State> {
  return (await roomRow(roomId)).game_state as State;
}

function alive(st: State): string[] {
  const dead = new Set((st.dead ?? []).map((d) => d.sid));
  return (st.seats ?? []).filter((s) => !dead.has(s) && !(st.gone ?? []).includes(s));
}

async function roleOf(roomId: string, sessionId: string): Promise<string> {
  const [row] = await sql`
    select role from public.game_players where room_id = ${roomId} and session_id = ${sessionId}
  `;
  return row?.role as string;
}

// A target the person may choose tonight (vampir_pick's rule).
async function nightTarget(roomId: string, me: string, st: State): Promise<string> {
  const mine = await roleOf(roomId, me);
  for (const sid of alive(st)) {
    if (mine === 'doktor') return sid;
    if (sid === me) continue;
    if (mine === 'vampir' && (await roleOf(roomId, sid)) === 'vampir') continue;
    return sid;
  }
  throw new Error('no target');
}

describe('seating (dev project and local stack)', () => {
  it(
    'seats the owner bots at its table, anonymously, and takes them away',
    async () => {
      const owner = await person(venue, 0);
      const roomId = await openTable(owner);
      expect(await rooms(owner, { action: 'test-bots', roomId })).toEqual(bots(0));
      expect(await rooms(owner, { action: 'add-bots', roomId, count: 4 })).toEqual(bots(4));
      expect((await roomRow(roomId)).phones).toBe(5);
      const people = await seated(roomId);
      expect(people).toHaveLength(5);
      expect(people.filter((p) => p.user_id !== owner.userId).map((p) => p.profiled)).toEqual([
        false,
        false,
        false,
        false,
      ]);

      // Only the owner seats them; the table holds twelve.
      const guest = await person(venue, 1);
      await sit(guest, owner, roomId);
      expect(await rooms(guest, { action: 'add-bots', roomId, count: 1 })).toEqual({
        status: 403,
        body: errorBody('not_owner'),
      });
      expect(await rooms(guest, { action: 'test-bots', roomId })).toEqual(bots(0));
      expect(await rooms(owner, { action: 'add-bots', roomId, count: 7 })).toEqual({
        status: 409,
        body: errorBody('table_full'),
      });

      expect(await rooms(owner, { action: 'remove-bots', roomId })).toEqual(bots(0));
      expect((await roomRow(roomId)).phones).toBe(2);
      // Seated again: the same accounts.
      expect(await rooms(owner, { action: 'add-bots', roomId, count: 2 })).toEqual(bots(2));
      expect(await sql`select count(*)::int as n from private.test_bots`).toEqual([{ n: 4 }]);
    },
    SLOW,
  );
});

describe('Vampir Köylü with bots', () => {
  it(
    'readies, chooses and votes for the bots as the game goes',
    async () => {
      const owner = await person(venue, 0);
      const roomId = await openTable(owner);
      expect(await rooms(owner, { action: 'add-bots', roomId, count: 4 })).toEqual(bots(4));
      expect(await rooms(owner, { action: 'open-game', roomId, concept: 'vampir' })).toEqual(OK);
      expect(await vampir(owner, { action: 'start', roomId })).toEqual(OK);

      // The role card: the bots are ready, the owner not yet.
      let st = await state(roomId);
      expect(st.phase).toBe('role');
      expect(st.ready).toHaveLength(4);
      expect(st.ready).not.toContain(owner.sessionId);

      // The night: the bots chose as it began.
      expect(await vampir(owner, { action: 'ready', roomId, step: st.step })).toEqual(OK);
      st = await state(roomId);
      expect(st).toMatchObject({ phase: 'night', acted: 4 });
      const target = await nightTarget(roomId, owner.sessionId, st);
      const picked = await vampir(owner, { action: 'pick', roomId, step: st.step, target });
      expect(picked.status).toBe(200);
      expect((await state(roomId)).phase).toBe('morning');

      // The morning runs out; the owner ends the day's talk: the living bots voted.
      await sql`
        update public.rooms
        set game_state = jsonb_set(game_state, '{endsAt}', to_jsonb(now() - interval '1 minute'))
        where id = ${roomId}
      `;
      expect(await vampir(owner, { action: 'advance', roomId })).toEqual(OK);
      st = await state(roomId);
      expect(st.phase).toBe('day');
      expect(await vampir(owner, { action: 'to-vote', roomId, step: st.step })).toEqual(OK);
      st = await state(roomId);
      const livingBots = alive(st).filter((s) => s !== owner.sessionId);
      if (st.phase === 'vote') {
        expect(Object.keys(st.votes ?? {}).sort()).toEqual(livingBots.sort());
      } else {
        // The owner died in the night: the bots' votes were all, and the vote is counted.
        expect(alive(st)).not.toContain(owner.sessionId);
      }
    },
    SLOW,
  );
});

describe('locks (§4.K)', () => {
  // The bots' moves lock their check-ins, then the table: a person's move holding the table makes
  // them wait, and they make a person's move wait; nothing deadlocks.
  it(
    'lets the bots wait for a person, and a person for the bots',
    async () => {
      for (const personFirst of [true, false]) {
        const owner = await person(venue, 0);
        const roomId = await openTable(owner);
        expect(await rooms(owner, { action: 'add-bots', roomId, count: 4 })).toEqual(bots(4));
        expect(await rooms(owner, { action: 'open-game', roomId, concept: 'vampir' })).toEqual(OK);
        // Started past the Edge Function: the bots have not moved yet.
        await sql`select (public.vampir_start(${owner.userId}, ${roomId})).id`;
        const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
        const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
        const ready = (q: postgres.Sql | postgres.TransactionSql) =>
          q`select (public.vampir_ready(${owner.userId}, ${roomId}, 1)).id`;
        const botsMove = (q: postgres.Sql | postgres.TransactionSql) =>
          q`select public.test_bots_vampir(${roomId}) as moves`;
        try {
          let later: Promise<unknown> = Promise.resolve();
          await first.begin(async (tx) => {
            await (personFirst ? ready(tx) : botsMove(tx));
            later = (personFirst ? botsMove(second) : ready(second))
              .execute()
              .catch((err: unknown) => err);
            await waitUntilBlocked(personFirst ? 'test_bots_vampir' : 'vampir_ready');
          });
          const result = await later;
          if (personFirst) {
            // Ready, then the night they began: four more moves.
            expect(result).toEqual([{ moves: 8 }]);
          } else {
            expect(result).not.toBeInstanceOf(Error);
          }
        } finally {
          await Promise.all([first.end(), second.end()]);
        }
        expect(await state(roomId)).toMatchObject({ phase: 'night' });
        await sql`delete from auth.users where id in (select user_id from private.test_bots)`;
        for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
      }
    },
    SLOW,
  );
});
