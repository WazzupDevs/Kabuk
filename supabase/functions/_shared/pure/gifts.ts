// Hediye paketleri (docs/SPEC_V4.md §4.U, K-89): the packs, the login count, the odds and the draw.
// The draw happens on the server (rule 3); this module is the arithmetic, with the random source
// passed in so that it is tested here. The catalog comes from giftCatalog.ts, which `pnpm seed`
// generates from content/gift-packs.json.
import { GIFT_CATALOG } from './giftCatalog.ts';

// The four tiers and the four packs, in order of worth (§4.U). The content names them in this order.
export const GIFT_TIERS = ['siradan', 'nadir', 'destansi', 'efsanevi'] as const;
export type GiftTier = (typeof GIFT_TIERS)[number];

export const GIFT_PACKS = ['bronz', 'gumus', 'altin', 'elmas'] as const;
export type GiftPack = (typeof GIFT_PACKS)[number];

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
    weights: Readonly<Record<string, number>>;
  }[];
  accessories: readonly {
    id: string;
    name: string;
    tier: string;
    weight: number;
    replacesPart?: string;
  }[];
};

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

function unownedIn(tier: GiftTier, owned: ReadonlySet<string>, catalog: GiftCatalog) {
  return catalog.accessories.filter((a) => a.tier === tier && !owned.has(a.id));
}

// Every accessory owned: no pack is earned (the login count stands still) and none can be opened.
export function ownsAll(owned: ReadonlySet<string>, catalog: GiftCatalog = GIFT_CATALOG): boolean {
  return catalog.accessories.every((a) => owned.has(a.id));
}

// The weights the draw uses for this person: a tier with nothing left to give drops out, and the
// others keep their weights, so their shares grow in proportion (§4.U "Tekrar yok").
function liveWeights(pack: GiftPack, owned: ReadonlySet<string>, catalog: GiftCatalog): TierOdds {
  const weights = packOf(pack, catalog).weights;
  const live = {} as TierOdds;
  for (const tier of GIFT_TIERS) {
    live[tier] = unownedIn(tier, owned, catalog).length > 0 ? (weights[tier] ?? 0) : 0;
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
  const choices = unownedIn(tier, owned, catalog);
  const weight = choices.reduce((sum, a) => sum + a.weight, 0);
  let pick = randomInt(weight);
  for (const a of choices) {
    if (pick < a.weight) return { id: a.id, tier };
    pick -= a.weight;
  }
  return null;
}

// The worn accessory is one more token in the capsule's look code, "x:<id>", after the six slots
// (pure/capsule.ts → LOOK_SLOTS). It goes wherever the look goes (the table seat, the venue chat
// message), so it is shown with the capsule and never with the profile (rule 4).
export const ACCESSORY_SLOT = 'x';

export function accessoryOf(look: string | null): string | null {
  if (look === null) return null;
  for (const token of look.trim().split(/\s+/)) {
    if (token.startsWith(`${ACCESSORY_SLOT}:`))
      return token.slice(ACCESSORY_SLOT.length + 1) || null;
  }
  return null;
}

export function withAccessory(look: string, accessoryId: string | null): string {
  const rest = look
    .trim()
    .split(/\s+/)
    .filter((t) => t !== '' && !t.startsWith(`${ACCESSORY_SLOT}:`));
  if (accessoryId !== null) rest.push(`${ACCESSORY_SLOT}:${accessoryId}`);
  return rest.join(' ');
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
