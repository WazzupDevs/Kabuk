// Hediye paketleri (docs/SPEC_V4.md §4.U, K-89): the packs, the login count, the odds and the draw.
// The draw happens on the server (rule 3); this module is the arithmetic, with the random source
// passed in so that it is tested here. The catalog comes from giftCatalog.ts, which `pnpm seed`
// generates from content/gift-packs.json.
import { LOOK_SLOTS } from './capsule.ts';
import { GIFT_CATALOG } from './giftCatalog.ts';

// The four tiers and the packs, in order of worth (§4.U): the four tier packs, then Elf and Ninja
// (themed: each gives only its own accessories, all Efsanevi). The content names them in this order.
export const GIFT_TIERS = ['siradan', 'nadir', 'destansi', 'efsanevi'] as const;
export type GiftTier = (typeof GIFT_TIERS)[number];

export const TIER_PACKS = ['bronz', 'gumus', 'altin', 'elmas'] as const;
export type TierPack = (typeof TIER_PACKS)[number];

export const GIFT_PACKS = [...TIER_PACKS, 'elf', 'ninja'] as const;
export type GiftPack = (typeof GIFT_PACKS)[number];

export function isTierPack(value: string): value is TierPack {
  return (TIER_PACKS as readonly string[]).includes(value);
}

// Every pack's tier weights add up to this: odds are parts of it (100000 → %0,001 precision, so an
// accessory can come one in a thousand or rarer).
export const ODDS_TOTAL = 100000;

export type GiftCatalog = {
  loginsPerPack: number;
  tiers: readonly { id: string; name: string }[];
  packs: readonly {
    id: string;
    name: string;
    locked: boolean;
    // Gives only the accessories that name it (`pack`), and those come from no other pack.
    themed: boolean;
    weights: Readonly<Record<string, number>>;
    // A themed pack's full set: worn together, the set's balloon in the venue chat (§4.U).
    fullSet?: readonly string[];
  }[];
  accessories: readonly {
    id: string;
    name: string;
    tier: string;
    // The capsule slots it is worn in (pure/capsule.ts → LOOK_SLOTS); a Destansı set takes two.
    slots: readonly string[];
    weight: number;
    // The themed pack that alone gives it; none: the four tier packs.
    pack?: string;
    // Out of the catalog (7 Kasım): no pack gives it, whoever owns it keeps wearing it.
    retired?: boolean;
    replacesPart?: string;
  }[];
};

export type GiftAccessory = GiftCatalog['accessories'][number];

export type TierOdds = Record<GiftTier, number>;

export function isGiftPack(value: string): value is GiftPack {
  return (GIFT_PACKS as readonly string[]).includes(value);
}

export function isGiftTier(value: string): value is GiftTier {
  return (GIFT_TIERS as readonly string[]).includes(value);
}

function packOf(pack: GiftPack, catalog: GiftCatalog) {
  const found = catalog.packs.find((p) => p.id === pack);
  if (!found) throw new Error(`The gift catalog has no pack ${pack}.`);
  return found;
}

// What a pack can give: a themed pack its own accessories, a tier pack every other one; never a
// retired one.
export function poolOf(pack: GiftPack, catalog: GiftCatalog = GIFT_CATALOG): GiftAccessory[] {
  const themed = packOf(pack, catalog).themed;
  return catalog.accessories.filter(
    (a) => !a.retired && (themed ? a.pack === pack : a.pack === undefined),
  );
}

function unownedIn(
  pack: GiftPack,
  tier: GiftTier,
  owned: ReadonlySet<string>,
  catalog: GiftCatalog,
) {
  return poolOf(pack, catalog).filter((a) => a.tier === tier && !owned.has(a.id));
}

// Every accessory the open packs give is owned: no pack is earned (the login count stands still)
// and none can be opened. `open` is the packs that open here (all by default).
export function ownsAll(
  owned: ReadonlySet<string>,
  catalog: GiftCatalog = GIFT_CATALOG,
  open: readonly GiftPack[] = GIFT_PACKS,
): boolean {
  return open.every((pack) => poolOf(pack, catalog).every((a) => owned.has(a.id)));
}

// The weights the draw uses for this person: a tier with nothing left to give drops out, and the
// others keep their weights, so their shares grow in proportion (§4.U "Tekrar yok").
function liveWeights(pack: GiftPack, owned: ReadonlySet<string>, catalog: GiftCatalog): TierOdds {
  const weights = packOf(pack, catalog).weights;
  const live = {} as TierOdds;
  for (const tier of GIFT_TIERS) {
    live[tier] = unownedIn(pack, tier, owned, catalog).length > 0 ? (weights[tier] ?? 0) : 0;
  }
  return live;
}

// The odds the Oranlar sheet shows: what the draw applies to this person now, in parts of
// ODDS_TOTAL. Rounded by largest remainder so the four always add up to ODDS_TOTAL (all zero when
// everything is owned). The app shows these and computes nothing.
export function tierOdds(
  pack: GiftPack,
  owned: ReadonlySet<string>,
  catalog: GiftCatalog = GIFT_CATALOG,
): TierOdds {
  const live = liveWeights(pack, owned, catalog);
  const total = GIFT_TIERS.reduce((sum, t) => sum + live[t], 0);
  const odds = { siradan: 0, nadir: 0, destansi: 0, efsanevi: 0 } as TierOdds;
  if (total === 0) return odds;
  const remainders: { tier: GiftTier; rest: number }[] = [];
  let given = 0;
  for (const tier of GIFT_TIERS) {
    const exact = live[tier] * ODDS_TOTAL;
    odds[tier] = Math.floor(exact / total);
    given += odds[tier];
    remainders.push({ tier, rest: exact % total });
  }
  remainders.sort(
    (a, b) => b.rest - a.rest || GIFT_TIERS.indexOf(a.tier) - GIFT_TIERS.indexOf(b.tier),
  );
  for (let i = 0; given < ODDS_TOTAL; i++, given++) {
    const r = remainders[i % remainders.length];
    if (r) odds[r.tier] += 1;
  }
  return odds;
}

// A uniform whole number in [0, n): crypto on the server, a seeded source in tests.
export type RandomInt = (n: number) => number;

// One accessory from the pack: first the tier by the pack's live weights, then, inside the tier,
// one the person does not own by its own weight. null when everything is owned.
export function drawAccessory(
  pack: GiftPack,
  owned: ReadonlySet<string>,
  randomInt: RandomInt,
  catalog: GiftCatalog = GIFT_CATALOG,
): { id: string; tier: GiftTier } | null {
  const live = liveWeights(pack, owned, catalog);
  const total = GIFT_TIERS.reduce((sum, t) => sum + live[t], 0);
  if (total === 0) return null;
  let roll = randomInt(total);
  let tier: GiftTier | null = null;
  for (const t of GIFT_TIERS) {
    if (roll < live[t]) {
      tier = t;
      break;
    }
    roll -= live[t];
  }
  if (tier === null) return null;
  const choices = unownedIn(pack, tier, owned, catalog);
  const weight = choices.reduce((sum, a) => sum + a.weight, 0);
  let pick = randomInt(weight);
  for (const a of choices) {
    if (pick < a.weight) return { id: a.id, tier };
    pick -= a.weight;
  }
  return null;
}

// A worn accessory is one more token in the capsule's look code, "x:<id>", after the six slots
// (pure/capsule.ts → LOOK_SLOTS); several can be worn, one in each slot (§4.U, 7 Kasım). They go
// wherever the look goes (the table seat, the venue chat message), so they are shown with the
// capsule and never with the profile (rule 4). An accessory covers the capsule's own part in its
// slots; the part stays in the code and shows again when the accessory comes off.
export const ACCESSORY_SLOT = 'x';

export function accessoriesOf(look: string | null): string[] {
  if (look === null) return [];
  return look
    .trim()
    .split(/\s+/)
    .flatMap((t) =>
      t.startsWith(`${ACCESSORY_SLOT}:`) && t.length > ACCESSORY_SLOT.length + 1
        ? [t.slice(ACCESSORY_SLOT.length + 1)]
        : [],
    );
}

// The first worn accessory, or null (what an app before the slots shows).
export function accessoryOf(look: string | null): string | null {
  return accessoriesOf(look)[0] ?? null;
}

export function withAccessories(look: string, accessoryIds: readonly string[]): string {
  const rest = look
    .trim()
    .split(/\s+/)
    .filter((t) => t !== '' && !t.startsWith(`${ACCESSORY_SLOT}:`));
  return [...rest, ...accessoryIds.map((id) => `${ACCESSORY_SLOT}:${id}`)].join(' ');
}

export function withAccessory(look: string, accessoryId: string | null): string {
  return withAccessories(look, accessoryId === null ? [] : [accessoryId]);
}

export function accessoryById(
  id: string,
  catalog: GiftCatalog = GIFT_CATALOG,
): GiftAccessory | undefined {
  return catalog.accessories.find((a) => a.id === id);
}

export function slotsOf(id: string, catalog: GiftCatalog = GIFT_CATALOG): readonly string[] {
  return accessoryById(id, catalog)?.slots ?? [];
}

// Two accessories in one slot (or one listed twice): not a set that can be worn.
export function slotConflict(ids: readonly string[], catalog: GiftCatalog = GIFT_CATALOG): boolean {
  const taken = new Set<string>();
  for (const id of new Set(ids)) {
    for (const slot of slotsOf(id, catalog)) {
      if (taken.has(slot)) return true;
      taken.add(slot);
    }
  }
  return ids.length !== new Set(ids).size;
}

// Putting one on: whatever is worn in any of its slots comes off.
export function wearOne(
  worn: readonly string[],
  id: string,
  catalog: GiftCatalog = GIFT_CATALOG,
): string[] {
  const slots = new Set(slotsOf(id, catalog));
  return [...worn.filter((w) => w !== id && !slotsOf(w, catalog).some((s) => slots.has(s))), id];
}

// Which accessory covers each slot of the look (Kapsülünü süsle shows it in that slot).
export function coveredSlots(
  worn: readonly string[],
  catalog: GiftCatalog = GIFT_CATALOG,
): Partial<Record<(typeof LOOK_SLOTS)[number], string>> {
  const out: Partial<Record<(typeof LOOK_SLOTS)[number], string>> = {};
  for (const id of worn) {
    for (const slot of slotsOf(id, catalog)) {
      if ((LOOK_SLOTS as readonly string[]).includes(slot)) {
        out[slot as (typeof LOOK_SLOTS)[number]] = id;
      }
    }
  }
  return out;
}

// The themed pack whose full set the look wears whole, or null: its messages in the venue chat,
// while anonymous, take the set's balloon (§4.U).
export function fullSetOf(
  look: string | null,
  catalog: GiftCatalog = GIFT_CATALOG,
): GiftPack | null {
  const worn = new Set(accessoriesOf(look));
  for (const pack of catalog.packs) {
    if (pack.fullSet && pack.fullSet.length > 0 && pack.fullSet.every((id) => worn.has(id))) {
      return isGiftPack(pack.id) ? pack.id : null;
    }
  }
  return null;
}

// The capsule parts that became pack accessories (§4.U, 7 Kasım): left out of Kapsülünü süsle. A
// look that already wears one keeps it; a new look cannot pick it up.
export function retiredParts(catalog: GiftCatalog = GIFT_CATALOG): string[] {
  return catalog.accessories.flatMap((a) => (a.replacesPart ? [a.replacesPart] : []));
}

export function withoutNewRetiredParts(
  next: string,
  current: string | null,
  catalog: GiftCatalog = GIFT_CATALOG,
): string {
  const retired = new Set(retiredParts(catalog));
  const kept = new Set((current ?? '').trim().split(/\s+/));
  return next
    .trim()
    .split(/\s+/)
    .filter((t) => t !== '' && (!retired.has(t) || kept.has(t)))
    .join(' ');
}

// A ready look (the start look, K-61) that wears none of the retired parts.
export function isFreeLook(code: string, catalog: GiftCatalog = GIFT_CATALOG): boolean {
  const retired = new Set(retiredParts(catalog));
  return !code.split(/\s+/).some((t) => retired.has(t));
}

// A uniform whole number in [0, n) from a source of uniform 32-bit words (crypto.getRandomValues on
// the server): words past the last whole multiple of n are drawn again, so no result is likelier.
export function uniformInt(n: number, nextUint32: () => number): number {
  if (!Number.isInteger(n) || n < 1 || n > 0x100000000)
    throw new Error(`No uniform int below ${n}.`);
  const limit = Math.floor(0x100000000 / n) * n;
  let word = nextUint32();
  while (word >= limit) word = nextUint32();
  return word % n;
}
