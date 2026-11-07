// Hediye paketleri (docs/SPEC_V4.md §4.U, K-89): the login count, opening a pack, wearing an
// accessory, what goes with the capsule and never with the profile (rule 4), and the lock order
// (rule 10: profiles → gift_progress → user_accessories).
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { GiftOpenResponse, GiftState } from '../functions/_shared/pure/api/gifts.ts';
import { poolOf } from '../functions/_shared/pure/gifts.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import {
  checkInAt,
  errorBody,
  onboarded,
  PHONES,
  setTestPhoto,
  waitUntilBlocked,
} from './helpers.ts';
import { type Client, dbUrl, deleteUserByPhone, invoke, sql, userIdOf } from './local.ts';

let venue: Record<string, string> = {};
const V = 'at-anchor';

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  for (const phone of PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const gifts = (client: Client, body: Record<string, unknown>) => invoke(client, 'gifts', body);

async function stateOf(client: Client): Promise<GiftState> {
  const res = await gifts(client, { action: 'state' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as GiftState;
}

async function login(client: Client): Promise<GiftState> {
  const res = await gifts(client, { action: 'login' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as GiftState;
}

// The last counted login was yesterday (Istanbul's day is the function's; one day back is enough).
async function aDayLater(client: Client): Promise<void> {
  await sql`update public.gift_progress set last_day = last_day - 1
            where user_id = ${await userIdOf(client)}`;
}

async function givePacks(client: Client, unopened: number): Promise<void> {
  const userId = await userIdOf(client);
  await sql`insert into public.gift_progress (user_id, unopened) values (${userId}, ${unopened})
            on conflict (user_id) do update set unopened = excluded.unopened`;
}

async function own(client: Client, ids: readonly string[]): Promise<void> {
  const userId = await userIdOf(client);
  for (const id of ids) {
    await sql`insert into public.user_accessories (user_id, accessory_id, pack)
              values (${userId}, ${id}, 'bronz')`;
  }
}

async function lookOf(client: Client): Promise<string | null> {
  const [row] =
    await sql`select capsule_look from public.profiles where id = ${await userIdOf(client)}`;
  return (row?.capsule_look as string | null) ?? null;
}

// What Bronz gives; on the local stack only Bronz opens, so this is everything to own.
const ALL = poolOf('bronz').map((a) => a.id);

describe('gifts/state', () => {
  it('answers a new account: no pack yet, Bronz open, the others locked, the odds of §4.U', async () => {
    const a = await onboarded(PHONES[0]);
    const state = await stateOf(a);
    expect(state.packs.map((p) => [p.id, p.locked, p.unopened])).toEqual([
      ['bronz', false, 0],
      ['gumus', true, 0],
      ['altin', true, 0],
      ['elmas', true, 0],
      ['elf', true, 0],
      ['ninja', true, 0],
    ]);
    expect(state.packs[0]?.odds).toEqual({
      siradan: 70000,
      nadir: 22000,
      destansi: 7000,
      efsanevi: 1000,
    });
    expect(state).toMatchObject({ logins: 0, loginsPerPack: 3, allOwned: false, owned: [] });
    expect(state.equipped).toBeNull();
    expect(state.worn).toEqual([]);
    // Sent twice, the same answer (apiRetry.ts).
    expect(await stateOf(a)).toEqual(state);
  });
});

describe('gifts/login', () => {
  it('counts one login a day; the same day twice changes nothing', async () => {
    const a = await onboarded(PHONES[0]);
    expect((await login(a)).logins).toBe(1);
    expect(await login(a)).toEqual(await stateOf(a));
    expect((await stateOf(a)).logins).toBe(1);
  });

  it('earns a Bronz pack on the third counted login, with no streak', async () => {
    const a = await onboarded(PHONES[0]);
    await login(a);
    await aDayLater(a);
    expect((await login(a)).logins).toBe(2);
    // Days apart count the same: no streak.
    await sql`update public.gift_progress set last_day = last_day - 10
              where user_id = ${await userIdOf(a)}`;
    const third = await login(a);
    expect(third.logins).toBe(0);
    expect(third.packs[0]?.unopened).toBe(1);
  });

  it('stands still while every accessory is owned', async () => {
    const a = await onboarded(PHONES[0]);
    await own(a, ALL);
    const state = await login(a);
    expect(state).toMatchObject({ logins: 0, allOwned: true });
    expect(state.packs[0]?.odds).toEqual({ siradan: 0, nadir: 0, destansi: 0, efsanevi: 0 });
  });
});

describe('gifts/open', () => {
  it('opens only Bronz, and only an unopened pack', async () => {
    const a = await onboarded(PHONES[0]);
    for (const pack of ['gumus', 'altin', 'elmas', 'elf', 'ninja']) {
      expect(await gifts(a, { action: 'open', pack })).toEqual({
        status: 409,
        body: errorBody('pack_locked'),
      });
    }
    expect(await gifts(a, { action: 'open', pack: 'bronz' })).toEqual({
      status: 409,
      body: errorBody('no_pack'),
    });
  });

  it('gives one accessory not owned yet and takes the pack', async () => {
    const a = await onboarded(PHONES[0]);
    await givePacks(a, 1);
    const res = await gifts(a, { action: 'open', pack: 'bronz' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const opened = res.body as GiftOpenResponse;
    expect(ALL).toContain(opened.accessory.id);
    expect(opened.state.packs[0]?.unopened).toBe(0);
    expect(opened.state.owned).toEqual([
      { id: opened.accessory.id, tier: opened.accessory.tier, pack: 'bronz' },
    ]);
  });

  it('never gives an owned accessory again', async () => {
    const a = await onboarded(PHONES[0]);
    const last = ALL[ALL.length - 1] ?? '';
    await own(a, ALL.slice(0, -1));
    await givePacks(a, 1);
    const res = await gifts(a, { action: 'open', pack: 'bronz' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect((res.body as GiftOpenResponse).accessory.id).toBe(last);
    expect((res.body as GiftOpenResponse).state.allOwned).toBe(true);
  });

  it('gives one pack once when two phones open it at the same moment', async () => {
    const a = await onboarded(PHONES[0]);
    await givePacks(a, 1);
    const both = await Promise.all([
      gifts(a, { action: 'open', pack: 'bronz' }),
      gifts(a, { action: 'open', pack: 'bronz' }),
    ]);
    expect(both.map((r) => r.status).sort()).toEqual([200, 409]);
    const [row] = await sql`select count(*)::int as n from public.user_accessories
                            where user_id = ${await userIdOf(a)}`;
    expect(row?.n).toBe(1);
  });
});

describe('gifts/equip', () => {
  it('wears only an owned accessory, keeps it through set-look, and takes it off', async () => {
    const a = await onboarded(PHONES[0]);
    expect(await gifts(a, { action: 'equip', accessoryId: 'tac' })).toEqual({
      status: 409,
      body: errorBody('not_owned'),
    });
    await own(a, ['tac']);
    const worn = await gifts(a, { action: 'equip', accessoryId: 'tac' });
    expect(worn.status, JSON.stringify(worn.body)).toBe(200);
    expect(worn.body).toMatchObject({ equipped: 'tac' });
    expect(await lookOf(a)).toMatch(/ x:tac$/);
    // Sent twice, the same look (apiRetry.ts).
    expect(await gifts(a, { action: 'equip', accessoryId: 'tac' })).toEqual(worn);
    expect((await stateOf(a)).equipped).toBe('tac');

    // The decoration screen sends the six slots; the accessory stays, a client "x:" is dropped.
    const set = await invoke(a, 'profile', {
      action: 'set-look',
      look: 'c:limon e:koyu h:anten x:ejderboynuzu',
    });
    expect(set.status, JSON.stringify(set.body)).toBe(200);
    expect(await lookOf(a)).toBe('c:limon e:koyu h:anten x:tac');

    const off = await gifts(a, { action: 'equip', accessoryId: null });
    expect(off).toEqual({
      status: 200,
      body: { capsuleLook: 'c:limon e:koyu h:anten', worn: [], equipped: null },
    });
    expect(await gifts(a, { action: 'equip', accessoryId: null })).toEqual(off);
  });
});

describe('gifts/wear', () => {
  it('wears a whole set, one in each slot; the same set twice changes nothing', async () => {
    const a = await onboarded(PHONES[0]);
    await own(a, ['pervanelisapka', 'kedibiyiklari', 'yildiztakimi', 'kistakimi']);
    expect(
      await gifts(a, { action: 'wear', accessoryIds: ['pervanelisapka', 'yarabandi'] }),
    ).toEqual({
      status: 409,
      body: errorBody('not_owned'),
    });
    // Yıldız takımı is Yüz + Ağız: Kedi bıyıkları (Ağız) cannot be worn with it.
    expect(
      await gifts(a, { action: 'wear', accessoryIds: ['kedibiyiklari', 'yildiztakimi'] }),
    ).toEqual({ status: 409, body: errorBody('slot_conflict') });
    const before = await lookOf(a);
    const res = await gifts(a, {
      action: 'wear',
      accessoryIds: ['pervanelisapka', 'yildiztakimi'],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body).toMatchObject({
      worn: ['pervanelisapka', 'yildiztakimi'],
      equipped: 'pervanelisapka',
    });
    expect(await lookOf(a)).toBe(`${before} x:pervanelisapka x:yildiztakimi`);
    // Sent twice, the same look (apiRetry.ts).
    expect(
      await gifts(a, { action: 'wear', accessoryIds: ['pervanelisapka', 'yildiztakimi'] }),
    ).toEqual(res);
    expect((await stateOf(a)).worn).toEqual(['pervanelisapka', 'yildiztakimi']);

    // Putting one on takes off whatever shares a slot: Kış takımı (Baş + Boyun) takes the hat.
    const equip = await gifts(a, { action: 'equip', accessoryId: 'kistakimi' });
    expect(equip.body).toMatchObject({ worn: ['yildiztakimi', 'kistakimi'] });
    const kept = await invoke(a, 'profile', { action: 'set-look', look: 'c:limon e:koyu' });
    expect(kept.status, JSON.stringify(kept.body)).toBe(200);
    expect(await lookOf(a)).toBe('c:limon e:koyu x:yildiztakimi x:kistakimi');

    const none = await gifts(a, { action: 'wear', accessoryIds: [] });
    expect(none).toEqual({
      status: 200,
      body: { capsuleLook: 'c:limon e:koyu', worn: [], equipped: null },
    });
  });

  it('checks the slots in the database too', async () => {
    const a = await onboarded(PHONES[0]);
    const userId = await userIdOf(a);
    await own(a, ['kedibiyiklari', 'yildiztakimi']);
    await expect(
      sql`select public.gifts_wear(${userId}, ${sql.array(['kedibiyiklari', 'yildiztakimi'])})`,
    ).rejects.toThrow(/slot_conflict/);
    await expect(
      sql`select public.gifts_wear(${userId}, ${sql.array(['kedibiyiklari', 'kedibiyiklari'])})`,
    ).rejects.toThrow(/slot_conflict/);
  });
});

describe('Elf and Ninja (§4.U)', () => {
  it('give only their own accessories, which no other pack gives', async () => {
    const a = await onboarded(PHONES[0]);
    const userId = await userIdOf(a);
    await givePacks(a, 3);
    const open = async (pack: string, id: string) => {
      const [row] = await sql`select public.gifts_open(${userId}, ${pack}, ${id}) as r`;
      return row?.r as string;
    };
    expect(await open('bronz', 'yapraktaci')).toBe('stale');
    expect(await open('ninja', 'yapraktaci')).toBe('stale');
    expect(await open('elf', 'filiz')).toBe('stale');
    // A retired accessory comes from no pack.
    expect(await open('bronz', 'tac')).toBe('stale');
    expect(await open('elf', 'yapraktaci')).toBe('ok');
    expect((await stateOf(a)).owned).toEqual([{ id: 'yapraktaci', tier: 'efsanevi', pack: 'elf' }]);
  });

  it('do not count while locked: owning what Bronz gives stops the count', async () => {
    const a = await onboarded(PHONES[0]);
    await own(a, ALL);
    expect(await login(a)).toMatchObject({ logins: 0, allOwned: true });
    const userId = await userIdOf(a);
    // With every pack open (the dev project), Elf and Ninja are still to get.
    const [row] = await sql`
      select private.gifts_owns_all(${userId}, array['bronz', 'elf', 'ninja']) as all_owned
    `;
    expect(row?.all_owned).toBe(false);
  });
});

describe('capsule parts that became pack accessories (7 Kasım)', () => {
  it('cannot be picked in Kapsülünü süsle, but stay on a look that wears them', async () => {
    const a = await onboarded(PHONES[0]);
    await sql`update public.profiles set capsule_look = 'c:mor e:klasik'
              where id = ${await userIdOf(a)}`;
    await invoke(a, 'profile', { action: 'set-look', look: 'c:mor e:klasik h:tac' });
    expect(await lookOf(a)).toBe('c:mor e:klasik');

    await sql`update public.profiles set capsule_look = 'c:mor e:klasik h:tac'
              where id = ${await userIdOf(a)}`;
    await invoke(a, 'profile', { action: 'set-look', look: 'c:limon e:klasik h:tac' });
    expect(await lookOf(a)).toBe('c:limon e:klasik h:tac');
  });

  it('starts no new account with one', async () => {
    const a = await onboarded(PHONES[0]);
    expect(await lookOf(a)).not.toMatch(/h:(bere|kasket|kulaklik|tac)(\s|$)/);
  });
});

describe('the accessory goes with the capsule, never with the profile (rule 4)', () => {
  it('is on an anonymous seat and on no profiled one', async () => {
    const a = await onboarded(PHONES[0]);
    await own(a, ['tac']);
    await gifts(a, { action: 'equip', accessoryId: 'tac' });
    await checkInAt(a, venue, V);
    const created = await invoke(a, 'rooms', { action: 'create' });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;
    const [seat] = await sql`select look from public.room_members where room_id = ${roomId}`;
    expect(seat?.look).toMatch(/ x:tac$/);

    // A man sits profiled (rule 12): his seat carries no look, so no accessory either.
    const b = await onboarded(PHONES[1], { gender: 'male' });
    await own(b, ['kasket']);
    await gifts(b, { action: 'equip', accessoryId: 'kasket' });
    await setTestPhoto(b);
    await checkInAt(b, venue, V);
    const own2 = await invoke(b, 'rooms', { action: 'create' });
    expect(own2.status, JSON.stringify(own2.body)).toBe(200);
    const [profiledSeat] = await sql`
      select look from public.room_members where room_id = ${(own2.body as { roomId: string }).roomId}
    `;
    expect(profiledSeat?.look).toBeNull();
  });

  it('is not in the gift tables a client can read', async () => {
    const a = await onboarded(PHONES[0]);
    await own(a, ['tac']);
    for (const table of ['gift_accessories', 'gift_progress', 'user_accessories'] as const) {
      const { data } = await a.from(table).select('*');
      expect(data ?? []).toEqual([]);
    }
  });
});

describe('locks', () => {
  // Rule 10: opening a pack waits on gift_progress, before it writes user_accessories.
  it('opens a pack under the gift_progress lock', async () => {
    const a = await onboarded(PHONES[0]);
    const userId = await userIdOf(a);
    await givePacks(a, 1);
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const opening = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let opened: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select user_id from public.gift_progress where user_id = ${userId} for update`;
        opened = opening`select public.gifts_open(${userId}, 'bronz', 'kuzeyisigi') as result`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('gifts_open');
      });
      expect(await opened).toEqual([{ result: 'ok' }]);
    } finally {
      await Promise.all([holder.end(), opening.end()]);
    }
  });

  // A login locks only its gift_progress row: a held profile does not stop it, a held row does.
  it('counts a login under the gift_progress lock only', async () => {
    const a = await onboarded(PHONES[0]);
    const userId = await userIdOf(a);
    await givePacks(a, 0);
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const counting = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await holder.begin(async (tx) => {
        await tx`select id from public.profiles where id = ${userId} for no key update`;
        await counting`set lock_timeout = '2s'`;
        const [row] = await counting`select public.gifts_login(${userId}, current_date, 3) as p`;
        expect(row?.p).toEqual({ logins: 1, unopened: 0 });
      });
      let counted: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select user_id from public.gift_progress where user_id = ${userId} for update`;
        counted = counting`select public.gifts_login(${userId}, current_date + 1, 3) as p`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('gifts_login');
      });
      expect(await counted).toEqual([{ p: { logins: 2, unopened: 0 } }]);
    } finally {
      await Promise.all([holder.end(), counting.end()]);
    }
  });

  // Wearing locks only profiles: a held gift_progress row does not stop it, a held profile does.
  it('wears an accessory under the profiles lock only', async () => {
    const a = await onboarded(PHONES[0]);
    const userId = await userIdOf(a);
    await own(a, ['tac']);
    await givePacks(a, 1);
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const wearing = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await holder.begin(async (tx) => {
        await tx`select user_id from public.gift_progress where user_id = ${userId} for update`;
        await wearing`set lock_timeout = '2s'`;
        const [row] = await wearing`select public.gifts_equip(${userId}, 'tac') as look`;
        expect(row?.look).toMatch(/ x:tac$/);
        const [set] =
          await wearing`select public.gifts_wear(${userId}, ${wearing.array(['tac'])}) as look`;
        expect(set?.look).toMatch(/ x:tac$/);
      });
      let worn: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.profiles where id = ${userId} for no key update`;
        worn = wearing`select public.gifts_unequip(${userId}) as look`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('gifts_unequip');
      });
      expect(await worn).toHaveLength(1);
      let set: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.profiles where id = ${userId} for no key update`;
        set = wearing`select public.gifts_wear(${userId}, ${wearing.array(['tac'])}) as look`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('gifts_wear');
      });
      expect(await set).toHaveLength(1);
    } finally {
      await Promise.all([holder.end(), wearing.end()]);
    }
  });
});
