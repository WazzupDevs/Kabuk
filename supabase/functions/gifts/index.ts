// Hediye paketleri (docs/SPEC_V4.md §4.U, K-89): the login count, opening a pack and wearing an
// accessory. The draw is here, on the server (rule 3), from crypto random words; the database checks
// it again under the lock and writes it (migrations/…_gift_packs.sql). Everything answered is the
// caller's own (rule 4): the worn accessory is part of the capsule look and goes only where the look
// goes, never with the profile.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { istanbulToday } from '../_shared/pure/age.ts';
import type { GiftsRequest, GiftState } from '../_shared/pure/api/gifts.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { GIFT_CATALOG } from '../_shared/pure/giftCatalog.ts';
import {
  accessoryOf,
  drawAccessory,
  GIFT_PACKS,
  type GiftPack,
  type GiftTier,
  isGiftPack,
  isGiftTier,
  ownsAll,
  tierOdds,
  uniformInt,
} from '../_shared/pure/gifts.ts';

const Body: z.ZodType<GiftsRequest> = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('state') }),
  z.strictObject({ action: z.literal('login') }),
  z.strictObject({ action: z.literal('open'), pack: z.enum(GIFT_PACKS) }),
  z.strictObject({
    action: z.literal('equip'),
    accessoryId: z
      .string()
      .regex(/^[a-z0-9]+$/)
      .max(64)
      .nullable(),
  }),
]);

const db = serviceClient();

// A draw that met an accessory owned meanwhile (another phone opened a pack at the same moment) is
// drawn again from what is owned now; more than this is a fault, not a race.
const MAX_DRAWS = 3;

function cryptoWord(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

function isoDay(now: Date): string {
  const d = istanbulToday(now);
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

type Owned = GiftState['owned'];

async function ownedOf(userId: string): Promise<Owned> {
  const { data, error } = await db
    .from('user_accessories')
    .select('accessory_id, pack, created_at, gift_accessories(tier)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw dbError('user_accessories', error);
  return data.flatMap((row) => {
    const tier = row.gift_accessories?.tier ?? '';
    return isGiftTier(tier) && isGiftPack(row.pack)
      ? [{ id: row.accessory_id, tier: tier as GiftTier, pack: row.pack as GiftPack }]
      : [];
  });
}

async function state(userId: string, progress?: { logins: number; unopened: number }) {
  const [owned, profile, row] = await Promise.all([
    ownedOf(userId),
    db.from('profiles').select('capsule_look').eq('id', userId).maybeSingle(),
    progress
      ? Promise.resolve(null)
      : db.from('gift_progress').select('logins, unopened').eq('user_id', userId).maybeSingle(),
  ]);
  if (profile.error) throw dbError('profiles', profile.error);
  if (!profile.data) throw new AppError('onboarding_required', 'Complete onboarding first.');
  if (row?.error) throw dbError('gift_progress', row.error);
  const counted = progress ?? row?.data ?? { logins: 0, unopened: 0 };
  const ownedIds = new Set(owned.map((a) => a.id));
  const result: GiftState = {
    packs: GIFT_CATALOG.packs.flatMap((p) =>
      isGiftPack(p.id)
        ? [
            {
              id: p.id,
              locked: p.locked,
              unopened: p.locked ? 0 : counted.unopened,
              odds: tierOdds(p.id, ownedIds),
            },
          ]
        : [],
    ),
    logins: counted.logins,
    loginsPerPack: GIFT_CATALOG.loginsPerPack,
    allOwned: ownsAll(ownedIds),
    owned,
    equipped: accessoryOf(profile.data.capsule_look),
  };
  return result;
}

async function open(userId: string, pack: GiftPack) {
  if (GIFT_CATALOG.packs.find((p) => p.id === pack)?.locked !== false) {
    throw new AppError('pack_locked', 'This pack cannot be opened yet.');
  }
  for (let attempt = 0; attempt < MAX_DRAWS; attempt++) {
    const owned = new Set((await ownedOf(userId)).map((a) => a.id));
    const drawn = drawAccessory(pack, owned, (n) => uniformInt(n, cryptoWord));
    if (drawn === null) throw new AppError('no_pack', 'Every accessory is owned.');
    const { data, error } = await db.rpc('gifts_open', {
      target_user_id: userId,
      target_pack: pack,
      target_accessory_id: drawn.id,
    });
    if (error) throw dbError('gifts_open', error);
    if (data === 'no_pack') throw new AppError('no_pack', 'No unopened pack.');
    if (data === 'ok') return { accessory: drawn, state: await state(userId) };
  }
  throw new Error('gifts_open kept meeting owned accessories');
}

Deno.serve(
  handle(async (req, raw) => {
    const user = await requireUser(req, db);
    const body = Body.parse(raw);

    switch (body.action) {
      case 'state':
        return state(user.id);

      case 'login': {
        const { data, error } = await db.rpc('gifts_login', {
          target_user_id: user.id,
          today: isoDay(new Date()),
          logins_per_pack: GIFT_CATALOG.loginsPerPack,
        });
        if (error) throw dbError('gifts_login', error);
        if (data === null) throw new AppError('onboarding_required', 'Complete onboarding first.');
        const counted = data as { logins: number; unopened: number };
        return state(user.id, { logins: counted.logins, unopened: counted.unopened });
      }

      case 'open':
        return open(user.id, body.pack);

      case 'equip': {
        const { data, error } =
          body.accessoryId === null
            ? await db.rpc('gifts_unequip', { target_user_id: user.id })
            : await db.rpc('gifts_equip', {
                target_user_id: user.id,
                target_accessory_id: body.accessoryId,
              });
        if (error?.code === 'P0001' && error.message === 'not_owned') {
          throw new AppError('not_owned', 'Not an accessory of yours.');
        }
        if (error) throw dbError('gifts_equip', error);
        if (data === null) throw new AppError('onboarding_required', 'Complete onboarding first.');
        return { capsuleLook: data, equipped: accessoryOf(data) };
      }
    }
  }),
);
