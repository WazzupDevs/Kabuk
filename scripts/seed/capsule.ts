// content/capsule-catalog.json and content/profanity-tr.json → capsuleNick, checked, and the pure
// module the app (drawing) and the server (checking) both read: supabase/functions/_shared/pure/
// capsuleCatalog.ts (docs/SPEC_V4.md §4.D, K-46). `pnpm seed` writes it; capsule.test.ts checks the
// committed file is the one built from the content as it is now.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { format, resolveConfig } from 'prettier';

import {
  LOOK_SLOTS,
  NICK_LETTERS,
  type NickExclusions,
  normalizeLook,
} from '../../supabase/functions/_shared/pure/capsule.ts';

export const CAPSULE_MODULE = 'supabase/functions/_shared/pure/capsuleCatalog.ts';

type Named = { id: string; name: string };
type Placed = Named & { rack: string; pack: string };

export type CapsuleCatalogContent = {
  racks: (Named & { packs: string[] })[];
  slots: Named[];
  colors: Named[];
  eyes: Placed[];
  parts: (Placed & { slot: string })[];
  emotions: Named[];
  readyLooks: { name: string; code: string }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function list(value: unknown, field: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isRecord)) {
    throw new Error(`${field} must be a non-empty list of objects`);
  }
  return value;
}

function unique(ids: readonly string[], field: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`${field}: ${id} appears twice`);
    seen.add(id);
  }
}

// Ids are what a look code stores: lower-case ASCII letters and digits, no ":" or space.
function id(value: unknown, field: string): string {
  const v = text(value, field);
  if (!/^[a-z0-9]+$/.test(v)) throw new Error(`${field}: ${v} is not an id`);
  return v;
}

export function parseCapsuleCatalog(json: unknown): CapsuleCatalogContent {
  if (!isRecord(json)) throw new Error('capsule-catalog.json must be an object');
  const racks = list(json.racks, 'racks').map((r, i) => ({
    id: id(r.id, `racks[${i}].id`),
    name: text(r.name, `racks[${i}].name`),
    packs: Array.isArray(r.packs) ? r.packs.map((p, j) => text(p, `racks[${i}].packs[${j}]`)) : [],
  }));
  const slots = list(json.slots, 'slots').map((s, i) => ({
    id: text(s.id, `slots[${i}].id`),
    name: text(s.name, `slots[${i}].name`),
  }));
  if (slots.map((s) => s.id).join(' ') !== LOOK_SLOTS.join(' ')) {
    throw new Error(`slots must be ${LOOK_SLOTS.join(', ')} in this order`);
  }
  const named = (field: string) =>
    list(json[field], field).map((x, i) => ({
      id: id(x.id, `${field}[${i}].id`),
      name: text(x.name, `${field}[${i}].name`),
    }));
  const colors = named('colors');
  const emotions = named('emotions');

  const rackPacks = new Map(racks.map((r) => [r.id, new Set(r.packs)]));
  const placed = (x: Record<string, unknown>, field: string) => {
    const rack = text(x.rack, `${field}.rack`);
    const pack = text(x.pack, `${field}.pack`);
    if (!rackPacks.get(rack)?.has(pack)) throw new Error(`${field}: no pack ${rack}/${pack}`);
    return { id: id(x.id, `${field}.id`), rack, pack, name: text(x.name, `${field}.name`) };
  };
  const eyes = list(json.eyes, 'eyes').map((e, i) => placed(e, `eyes[${i}]`));
  const parts = list(json.parts, 'parts').map((p, i) => {
    const slot = text(p.slot, `parts[${i}].slot`);
    if (!['h', 'f', 'm', 'n'].includes(slot)) throw new Error(`parts[${i}]: slot ${slot}`);
    return { ...placed(p, `parts[${i}]`), slot };
  });

  unique(
    racks.map((r) => r.id),
    'racks',
  );
  unique(
    colors.map((c) => c.id),
    'colors',
  );
  unique(
    eyes.map((e) => e.id),
    'eyes',
  );
  unique(
    parts.map((p) => p.id),
    'parts',
  );
  unique(
    emotions.map((e) => e.id),
    'emotions',
  );

  const catalog = { racks, slots, colors, eyes, parts, emotions, readyLooks: [] };
  const readyLooks = list(json.readyLooks, 'readyLooks').map((l, i) => {
    const code = text(l.code, `readyLooks[${i}].code`);
    // Every ready look is drawn from the library's own parts (K-61): nothing in it is dropped.
    if (normalizeLook(code, catalog) !== code) {
      throw new Error(`readyLooks[${i}]: ${code} is not a canonical look of the catalog`);
    }
    return { name: text(l.name, `readyLooks[${i}].name`), code };
  });
  unique(
    readyLooks.map((l) => l.code),
    'readyLooks',
  );
  return { ...catalog, readyLooks };
}

// Pairs of the nick's letters and whole numbers generation never gives (§4.D).
export function parseNickExclusions(profanityJson: unknown): NickExclusions {
  if (!isRecord(profanityJson) || !isRecord(profanityJson.capsuleNick)) {
    throw new Error('profanity-tr.json must have a capsuleNick object');
  }
  const { letterPairs, numbers } = profanityJson.capsuleNick;
  if (
    !Array.isArray(letterPairs) ||
    !letterPairs.every(
      (p) =>
        typeof p === 'string' && p.length === 2 && [...p].every((c) => NICK_LETTERS.includes(c)),
    )
  ) {
    throw new Error(`capsuleNick.letterPairs must be pairs of the letters ${NICK_LETTERS}`);
  }
  if (!Array.isArray(numbers) || !numbers.every((n) => typeof n === 'string' && /^\d+$/.test(n))) {
    throw new Error('capsuleNick.numbers must be strings of digits');
  }
  return { letterPairs, numbers };
}

export async function buildCapsuleModule(root: string): Promise<string> {
  const readJson = (path: string): unknown => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  const catalog = parseCapsuleCatalog(readJson('content/capsule-catalog.json'));
  const exclusions = parseNickExclusions(readJson('content/profanity-tr.json'));
  const source = [
    '// Generated by `pnpm seed` (scripts/seed/capsule.ts) from content/capsule-catalog.json and',
    '// content/profanity-tr.json → capsuleNick. Do not edit by hand.',
    '',
    `export const CAPSULE_CATALOG = ${JSON.stringify(catalog)};`,
    '',
    `export const NICK_EXCLUSIONS = ${JSON.stringify(exclusions)};`,
    '',
  ].join('\n');
  const options = await resolveConfig(resolve(root, CAPSULE_MODULE));
  return format(source, { ...options, filepath: resolve(root, CAPSULE_MODULE) });
}
