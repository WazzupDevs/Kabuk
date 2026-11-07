// content/gift-packs.json (docs/SPEC_V4.md §4.U, K-89) → the pure module the app and the server
// both read (supabase/functions/_shared/pure/giftCatalog.ts) and the accessory rows the database
// checks ownership against (public.gift_accessories). `pnpm seed` writes both; gifts.test.ts checks
// the committed module is the one built from the content as it is now.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { format, resolveConfig } from 'prettier';

import { parseCapsuleCatalog } from './capsule.ts';
import { sqlLiteral } from './sql.ts';
import { LOOK_SLOTS } from '../../supabase/functions/_shared/pure/capsule.ts';
import {
  GIFT_PACKS,
  GIFT_SETS,
  GIFT_TIERS,
  type GiftCatalog,
  ODDS_TOTAL,
  poolOf,
  slotConflict,
} from '../../supabase/functions/_shared/pure/gifts.ts';

export const GIFT_MODULE = 'supabase/functions/_shared/pure/giftCatalog.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function whole(value: unknown, field: string, min: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min) {
    throw new Error(`${field} must be a whole number of at least ${min}`);
  }
  return value;
}

// Ids are what a look code stores ("x:<id>"): lower-case ASCII letters and digits.
function id(value: unknown, field: string): string {
  const v = text(value, field);
  if (!/^[a-z0-9]+$/.test(v)) throw new Error(`${field}: ${v} is not an id`);
  return v;
}

function list(value: unknown, field: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isRecord)) {
    throw new Error(`${field} must be a non-empty list of objects`);
  }
  return value;
}

// `capsuleParts` are the capsule catalog's "slot:id" tokens: a replaced part must be one of them.
export function parseGiftCatalog(json: unknown, capsuleParts: ReadonlySet<string>): GiftCatalog {
  if (!isRecord(json)) throw new Error('gift-packs.json must be an object');
  const loginsPerPack = whole(json.loginsPerPack, 'loginsPerPack', 1);

  const tiers = list(json.tiers, 'tiers').map((t, i) => ({
    id: id(t.id, `tiers[${i}].id`),
    name: text(t.name, `tiers[${i}].name`),
  }));
  if (tiers.map((t) => t.id).join(' ') !== GIFT_TIERS.join(' ')) {
    throw new Error(`tiers must be ${GIFT_TIERS.join(', ')} in this order`);
  }

  const packs = list(json.packs, 'packs').map((p, i) => {
    if (!isRecord(p.weights)) throw new Error(`packs[${i}].weights must be an object`);
    const weights: Record<string, number> = {};
    for (const tier of GIFT_TIERS) {
      weights[tier] = whole(p.weights[tier], `packs[${i}].weights.${tier}`, 0);
    }
    const extra = Object.keys(p.weights).filter(
      (k) => !(GIFT_TIERS as readonly string[]).includes(k),
    );
    if (extra.length > 0) throw new Error(`packs[${i}].weights: unknown tier ${extra[0]}`);
    const sum = GIFT_TIERS.reduce((s, t) => s + (weights[t] ?? 0), 0);
    if (sum !== ODDS_TOTAL)
      throw new Error(`packs[${i}].weights add up to ${sum}, not ${ODDS_TOTAL}`);
    if (typeof p.locked !== 'boolean') throw new Error(`packs[${i}].locked must be true or false`);
    return {
      id: id(p.id, `packs[${i}].id`),
      name: text(p.name, `packs[${i}].name`),
      locked: p.locked,
      weights,
    };
  });
  if (packs.map((p) => p.id).join(' ') !== GIFT_PACKS.join(' ')) {
    throw new Error(`packs must be ${GIFT_PACKS.join(', ')} in this order`);
  }
  if (packs[0]?.locked)
    throw new Error('packs: bronz is the pack logins earn; it cannot be locked');

  // Skin sets (§4.U, 7 Kasım): Efsanevi pieces the four packs give, and the full set of each.
  const sets = list(json.sets, 'sets').map((t, i) => {
    if (!Array.isArray(t.fullSet) || t.fullSet.length === 0) {
      throw new Error(`sets[${i}].fullSet must be a non-empty list`);
    }
    return {
      id: id(t.id, `sets[${i}].id`),
      name: text(t.name, `sets[${i}].name`),
      fullSet: t.fullSet.map((f, j) => id(f, `sets[${i}].fullSet[${j}]`)),
    };
  });
  if (sets.map((t) => t.id).join(' ') !== GIFT_SETS.join(' ')) {
    throw new Error(`sets must be ${GIFT_SETS.join(', ')} in this order`);
  }

  const seen = new Set<string>();
  const replaced = new Set<string>();
  const accessories = list(json.accessories, 'accessories').map((a, i) => {
    const accessoryId = id(a.id, `accessories[${i}].id`);
    if (seen.has(accessoryId)) throw new Error(`accessories: ${accessoryId} appears twice`);
    seen.add(accessoryId);
    const tier = text(a.tier, `accessories[${i}].tier`);
    if (!(GIFT_TIERS as readonly string[]).includes(tier)) {
      throw new Error(`accessories[${i}]: no tier ${tier}`);
    }
    if (!Array.isArray(a.slots) || a.slots.length === 0 || a.slots.length > 2) {
      throw new Error(`accessories[${i}].slots must list one or two slots`);
    }
    const slots = a.slots.map((slot, j) => {
      const v = text(slot, `accessories[${i}].slots[${j}]`);
      if (!(LOOK_SLOTS as readonly string[]).includes(v)) {
        throw new Error(`accessories[${i}]: no slot ${v}`);
      }
      return v;
    });
    if (new Set(slots).size !== slots.length) throw new Error(`accessories[${i}]: a slot twice`);
    // §4.U: a Destansı accessory is a set of two slots, every other one takes one (the retired ones
    // were drawn before the slots).
    if (a.retired !== true && (tier === 'destansi') !== (slots.length === 2)) {
      throw new Error(`accessories[${i}]: a Destansı accessory takes two slots, the others one`);
    }
    let entry: GiftCatalog['accessories'][number] = {
      id: accessoryId,
      name: text(a.name, `accessories[${i}].name`),
      tier,
      slots,
      weight: whole(a.weight, `accessories[${i}].weight`, 1),
    };
    if (a.pack !== undefined) throw new Error(`accessories[${i}]: pack is now set (7 Kasım)`);
    if (a.set !== undefined) {
      const set = sets.find((t) => t.id === a.set);
      if (!set) throw new Error(`accessories[${i}]: ${String(a.set)} is no skin set`);
      if (tier !== 'efsanevi') throw new Error(`accessories[${i}]: a set piece is Efsanevi`);
      entry = { ...entry, set: set.id };
    }
    if (a.retired !== undefined) {
      if (a.retired !== true) throw new Error(`accessories[${i}].retired is true or left out`);
      if (entry.set !== undefined) throw new Error(`accessories[${i}]: a retired one has no set`);
      entry = { ...entry, retired: true };
    }
    if (a.replacesPart !== undefined) {
      const part = text(a.replacesPart, `accessories[${i}].replacesPart`);
      if (!capsuleParts.has(part)) throw new Error(`accessories[${i}]: no capsule part ${part}`);
      if (replaced.has(part)) throw new Error(`accessories: ${part} is replaced twice`);
      replaced.add(part);
      return { ...entry, replacesPart: part };
    }
    return entry;
  });
  const catalog: GiftCatalog = { loginsPerPack, tiers, packs, sets, accessories };
  for (const pack of GIFT_PACKS) {
    const pool = poolOf(pack, catalog);
    if (pool.length === 0) throw new Error(`packs: ${pack} gives no accessory`);
    const p = packs.find((x) => x.id === pack);
    // A pack draws a tier by its weights: every tier it weighs must have something to give.
    for (const tier of GIFT_TIERS) {
      if ((p?.weights[tier] ?? 0) > 0 && !pool.some((a) => a.tier === tier)) {
        throw new Error(`packs: ${pack} weighs ${tier} but gives none`);
      }
    }
  }
  for (const set of sets) {
    for (const f of set.fullSet) {
      if (!accessories.some((a) => a.id === f && a.set === set.id && !a.retired)) {
        throw new Error(`sets: ${set.id}'s full set has no ${f}`);
      }
    }
    if (slotConflict(set.fullSet, catalog)) {
      throw new Error(`sets: ${set.id}'s full set shares a slot`);
    }
  }
  return catalog;
}

function capsulePartsOf(root: string): Set<string> {
  const capsule = parseCapsuleCatalog(
    JSON.parse(readFileSync(resolve(root, 'content/capsule-catalog.json'), 'utf8')),
  );
  return new Set(capsule.parts.map((p) => `${p.slot}:${p.id}`));
}

export function readGiftCatalog(root: string): GiftCatalog {
  return parseGiftCatalog(
    JSON.parse(readFileSync(resolve(root, 'content/gift-packs.json'), 'utf8')),
    capsulePartsOf(root),
  );
}

// Upserted by id. A retired accessory, or one left out of the JSON, stays (people own it) but no pack
// gives it again (in_packs = false); the draw itself reads giftCatalog.ts, so the two agree after a
// seed. The `pack` column names the skin set it belongs to (null: none); every tier pack gives it.
export function giftsSql({ accessories }: GiftCatalog): string {
  const rows = accessories.map(
    (a) =>
      `(${[a.id, a.tier, a.weight, !a.retired, [...a.slots], a.set ?? null].map(sqlLiteral).join(', ')})`,
  );
  return [
    '-- content/gift-packs.json',
    'insert into public.gift_accessories (id, tier, weight, in_packs, slots, pack) values',
    `  ${rows.join(',\n  ')}`,
    'on conflict (id) do update set',
    '  tier = excluded.tier, weight = excluded.weight, in_packs = excluded.in_packs,',
    '  slots = excluded.slots, pack = excluded.pack;',
    `update public.gift_accessories set in_packs = false where in_packs and id <> all (${sqlLiteral(accessories.map((a) => a.id))});`,
    '',
  ].join('\n');
}

export async function buildGiftModule(root: string): Promise<string> {
  const catalog = readGiftCatalog(root);
  const source = [
    '// Generated by `pnpm seed` (scripts/seed/gifts.ts) from content/gift-packs.json. Do not edit by',
    '// hand.',
    "import type { GiftCatalog } from './gifts.ts';",
    '',
    `export const GIFT_CATALOG: GiftCatalog = ${JSON.stringify(catalog)};`,
    '',
  ].join('\n');
  const options = await resolveConfig(resolve(root, GIFT_MODULE));
  return format(source, { ...options, filepath: resolve(root, GIFT_MODULE) });
}
