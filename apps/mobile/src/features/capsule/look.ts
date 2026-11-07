import { DEFAULT_EYES, LOOK_SLOTS, type LookSlot, normalizeLook } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import {
  ACCESSORY_SLOT,
  accessoriesOf,
  coveredSlots,
  retiredParts,
  wearOne,
} from '@shared/gifts.ts';

// The capsule editor's model (skall tuvali, KapsulSusle, KapsulHediye; docs/SPEC_V4.md §4.D, K-46,
// §4.U): a look as one id per slot, parts put on and taken off, a pack put on whole, a shuffle.
// Codes are always canonical (normalizeLook), so the server stores what the editor shows. The worn
// pack accessories (`x`) are worn in their slots: one in each, covering the capsule's own part
// there, which shows again when the accessory comes off. The server keeps the accessories through
// set-look; Kaydet puts the worn set on with gifts/wear.
export type Look = Partial<Record<LookSlot, string>> & { [ACCESSORY_SLOT]?: readonly string[] };
export type RackId = (typeof CAPSULE_CATALOG.racks)[number]['id'];
export type Item = { slot: LookSlot; id: string; name: string; accessory?: boolean };

const PART_SLOTS = ['h', 'f', 'm', 'n'] as const satisfies readonly LookSlot[];

export function parse(code: string): Look {
  const look: Look = {};
  for (const token of normalizeLook(code).split(' ')) {
    const [slot, id] = token.split(':');
    if (slot && id && (LOOK_SLOTS as readonly string[]).includes(slot)) look[slot as LookSlot] = id;
  }
  const accessories = accessoriesOf(code);
  if (accessories.length > 0) look[ACCESSORY_SLOT] = accessories;
  return look;
}

export function code(look: Look): string {
  const base = normalizeLook(
    LOOK_SLOTS.flatMap((s) => (look[s] ? [`${s}:${look[s]}`] : [])).join(' '),
  );
  const accessories = look[ACCESSORY_SLOT] ?? [];
  return [base, ...accessories.map((id) => `${ACCESSORY_SLOT}:${id}`)].join(' ');
}

// The accessories worn, in the look's order.
export function accessories(look: Look): readonly string[] {
  return look[ACCESSORY_SLOT] ?? [];
}

function withAccessories(look: Look, ids: readonly string[]): Look {
  const next = { ...look };
  if (ids.length > 0) next[ACCESSORY_SLOT] = ids;
  else delete next[ACCESSORY_SLOT];
  return next;
}

// The accessory worn in the slot, or null.
export function accessoryIn(look: Look, slot: LookSlot): string | null {
  return coveredSlots(accessories(look))[slot] ?? null;
}

// Putting an owned accessory on: whatever accessory is worn in one of its slots comes off; the
// capsule's own parts there stay under it.
export function wearAccessory(look: Look, id: string): Look {
  return withAccessories(look, wearOne(accessories(look), id));
}

export function takeAccessoryOff(look: Look, id: string): Look {
  return withAccessories(
    look,
    accessories(look).filter((a) => a !== id),
  );
}

// The capsule parts that became pack accessories (§4.U, 7 Kasım): Kapsülünü süsle offers them no
// more, except to a look that already wears one (`kept`, the saved look); the server drops them
// from any other.
const RETIRED = new Set(retiredParts());

export function offered(slot: LookSlot, id: string, kept: Look): boolean {
  return !RETIRED.has(`${slot}:${id}`) || kept[slot] === id;
}

// Putting a part on (or leaving the slot empty): the accessory worn in the slot comes off, so that
// what was chosen shows.
export function wear(look: Look, slot: LookSlot, id: string | null): Look {
  const covering = accessoryIn(look, slot);
  const next = covering ? takeAccessoryOff(look, covering) : { ...look };
  if (id === null) delete next[slot];
  else next[slot] = id;
  return next;
}

// A part chosen in the slot: worn there and not covered by an accessory.
export function showsPart(look: Look, slot: LookSlot, id: string): boolean {
  return look[slot] === id && accessoryIn(look, slot) === null;
}

// The owned accessories worn in the slot, in catalog order (Kapsülünü süsle's options there, after
// "boş" and before the packs; KapsulHediye).
export function accessoryItems(slot: LookSlot, owned: ReadonlySet<string>): Item[] {
  return GIFT_CATALOG.accessories.flatMap((a) =>
    owned.has(a.id) && a.slots.includes(slot)
      ? [{ slot, id: a.id, name: a.name, accessory: true }]
      : [],
  );
}

function nameOf(slot: LookSlot, id: string): string {
  if (slot === 'c') return CAPSULE_CATALOG.colors.find((c) => c.id === id)?.name ?? id;
  if (slot === 'e') return CAPSULE_CATALOG.eyes.find((e) => e.id === id)?.name ?? id;
  return CAPSULE_CATALOG.parts.find((p) => p.id === id && p.slot === slot)?.name ?? id;
}

// What is worn and shows, beyond the colour and the plain eyes, in slot order ("Takılı"): a part
// an accessory covers is not shown; an accessory once, in its first slot.
export function worn(look: Look): Item[] {
  const covered = coveredSlots(accessories(look));
  return LOOK_SLOTS.flatMap((slot): Item[] => {
    const over = covered[slot];
    if (over) {
      const first = GIFT_CATALOG.accessories.find((a) => a.id === over);
      if (!first || first.slots.find((s) => covered[s as LookSlot] === over) !== slot) return [];
      return [{ slot, id: over, name: first.name, accessory: true }];
    }
    const id = look[slot];
    if (!id || slot === 'c' || (slot === 'e' && id === DEFAULT_EYES)) return [];
    return [{ slot, id, name: nameOf(slot, id) }];
  });
}

// Taking a worn thing off: eyes go back to the plain ones, a part leaves its slot empty.
export function takeOff(look: Look, slot: LookSlot): Look {
  return slot === 'e' ? wear(look, 'e', DEFAULT_EYES) : wear(look, slot, null);
}

// The colour and the plain eyes only ("Hepsini çıkar"): the accessories come off too.
export function bare(look: Look): Look {
  return { c: look.c, e: DEFAULT_EYES };
}

// A rack's packs with something for the slot, each with its items for that slot, in catalog order.
export function packsFor(
  rack: RackId,
  slot: LookSlot,
  kept: Look = {},
): { pack: string; items: Item[] }[] {
  const r = CAPSULE_CATALOG.racks.find((x) => x.id === rack);
  if (!r || slot === 'c') return [];
  return r.packs.flatMap((pack) => {
    const items: Item[] =
      slot === 'e'
        ? CAPSULE_CATALOG.eyes
            .filter((e) => e.rack === rack && e.pack === pack)
            .map((e) => ({ slot, id: e.id, name: e.name }))
        : CAPSULE_CATALOG.parts
            .filter(
              (p) =>
                p.rack === rack && p.pack === pack && p.slot === slot && offered(slot, p.id, kept),
            )
            .map((p) => ({ slot, id: p.id, name: p.name }));
    return items.length > 0 ? [{ pack, items }] : [];
  });
}

export function colors(): Item[] {
  return CAPSULE_CATALOG.colors.map((c) => ({ slot: 'c', id: c.id, name: c.name }));
}

// A pack whole: the first item it has for each slot (eyes and parts).
export function packItems(rack: RackId, pack: string, kept: Look = {}): Item[] {
  const out: Item[] = [];
  const eyes = CAPSULE_CATALOG.eyes.find((e) => e.rack === rack && e.pack === pack);
  if (eyes) out.push({ slot: 'e', id: eyes.id, name: eyes.name });
  for (const slot of PART_SLOTS) {
    const part = CAPSULE_CATALOG.parts.find(
      (p) => p.rack === rack && p.pack === pack && p.slot === slot && offered(slot, p.id, kept),
    );
    if (part) out.push({ slot, id: part.id, name: part.name });
  }
  return out;
}

export function wearPack(look: Look, rack: RackId, pack: string, kept: Look = {}): Look {
  return packItems(rack, pack, kept).reduce((l, item) => wear(l, item.slot, item.id), look);
}

// A new look at random: a colour, eyes, and each part slot filled about half the time; never a
// retired part, and the pack accessories of `keep` stay.
export function shuffle(random: () => number, keep: Look = {}): Look {
  const pick = <T>(list: readonly T[]): T | undefined =>
    list[Math.min(Math.floor(random() * list.length), list.length - 1)];
  const look: Look = {
    c: pick(CAPSULE_CATALOG.colors)?.id,
    e: random() < 0.6 ? DEFAULT_EYES : pick(CAPSULE_CATALOG.eyes)?.id,
  };
  for (const slot of PART_SLOTS) {
    if (random() < 0.5) continue;
    look[slot] = pick(
      CAPSULE_CATALOG.parts.filter((p) => p.slot === slot && !RETIRED.has(`${slot}:${p.id}`)),
    )?.id;
  }
  if (keep[ACCESSORY_SLOT]) look[ACCESSORY_SLOT] = keep[ACCESSORY_SLOT];
  return parse(code(look));
}
