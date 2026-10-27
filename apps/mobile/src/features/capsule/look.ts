import { DEFAULT_EYES, LOOK_SLOTS, type LookSlot, normalizeLook } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';

// The capsule editor's model (skall tuvali, KapsulSusle; docs/SPEC_V4.md §4.D, K-46): a look as
// one id per slot, parts put on and taken off, a pack put on whole, a shuffle. Codes are always
// canonical (normalizeLook), so the server stores what the editor shows.
export type Look = Partial<Record<LookSlot, string>>;
export type RackId = (typeof CAPSULE_CATALOG.racks)[number]['id'];
export type Item = { slot: LookSlot; id: string; name: string };

const PART_SLOTS = ['h', 'f', 'm', 'n'] as const satisfies readonly LookSlot[];

export function parse(code: string): Look {
  const look: Look = {};
  for (const token of normalizeLook(code).split(' ')) {
    const [slot, id] = token.split(':');
    if (slot && id && (LOOK_SLOTS as readonly string[]).includes(slot)) look[slot as LookSlot] = id;
  }
  return look;
}

export function code(look: Look): string {
  return normalizeLook(
    LOOK_SLOTS.flatMap((s) => (look[s] ? [`${s}:${look[s]}`] : [])).join(' '),
  );
}

export function wear(look: Look, slot: LookSlot, id: string | null): Look {
  const next = { ...look };
  if (id === null) delete next[slot];
  else next[slot] = id;
  return next;
}

export function nameOf(slot: LookSlot, id: string): string {
  if (slot === 'c') return CAPSULE_CATALOG.colors.find((c) => c.id === id)?.name ?? id;
  if (slot === 'e') return CAPSULE_CATALOG.eyes.find((e) => e.id === id)?.name ?? id;
  return CAPSULE_CATALOG.parts.find((p) => p.id === id && p.slot === slot)?.name ?? id;
}

// What is worn beyond the colour and the plain eyes, in slot order ("Takılı").
export function worn(look: Look): Item[] {
  return LOOK_SLOTS.flatMap((slot) => {
    const id = look[slot];
    if (!id || slot === 'c' || (slot === 'e' && id === DEFAULT_EYES)) return [];
    return [{ slot, id, name: nameOf(slot, id) }];
  });
}

// Taking a worn thing off: eyes go back to the plain ones, a part leaves its slot empty.
export function takeOff(look: Look, slot: LookSlot): Look {
  return slot === 'e' ? wear(look, 'e', DEFAULT_EYES) : wear(look, slot, null);
}

// The colour and the plain eyes only ("Hepsini çıkar").
export function bare(look: Look): Look {
  return { c: look.c, e: DEFAULT_EYES };
}

// A rack's packs with something for the slot, each with its items for that slot, in catalog order.
export function packsFor(rack: RackId, slot: LookSlot): { pack: string; items: Item[] }[] {
  const r = CAPSULE_CATALOG.racks.find((x) => x.id === rack);
  if (!r || slot === 'c') return [];
  return r.packs.flatMap((pack) => {
    const items: Item[] =
      slot === 'e'
        ? CAPSULE_CATALOG.eyes
            .filter((e) => e.rack === rack && e.pack === pack)
            .map((e) => ({ slot, id: e.id, name: e.name }))
        : CAPSULE_CATALOG.parts
            .filter((p) => p.rack === rack && p.pack === pack && p.slot === slot)
            .map((p) => ({ slot, id: p.id, name: p.name }));
    return items.length > 0 ? [{ pack, items }] : [];
  });
}

export function colors(): Item[] {
  return CAPSULE_CATALOG.colors.map((c) => ({ slot: 'c', id: c.id, name: c.name }));
}

// A pack whole: the first item it has for each slot (eyes and parts).
export function packItems(rack: RackId, pack: string): Item[] {
  const out: Item[] = [];
  const eyes = CAPSULE_CATALOG.eyes.find((e) => e.rack === rack && e.pack === pack);
  if (eyes) out.push({ slot: 'e', id: eyes.id, name: eyes.name });
  for (const slot of PART_SLOTS) {
    const part = CAPSULE_CATALOG.parts.find(
      (p) => p.rack === rack && p.pack === pack && p.slot === slot,
    );
    if (part) out.push({ slot, id: part.id, name: part.name });
  }
  return out;
}

export function wearPack(look: Look, rack: RackId, pack: string): Look {
  return packItems(rack, pack).reduce((l, item) => wear(l, item.slot, item.id), look);
}

// A new look at random: a colour, eyes, and each part slot filled about half the time.
export function shuffle(random: () => number): Look {
  const pick = <T>(list: readonly T[]): T | undefined =>
    list[Math.min(Math.floor(random() * list.length), list.length - 1)];
  const look: Look = {
    c: pick(CAPSULE_CATALOG.colors)?.id,
    e: random() < 0.6 ? DEFAULT_EYES : pick(CAPSULE_CATALOG.eyes)?.id,
  };
  for (const slot of PART_SLOTS) {
    if (random() < 0.5) continue;
    look[slot] = pick(CAPSULE_CATALOG.parts.filter((p) => p.slot === slot))?.id;
  }
  return parse(code(look));
}

// The next part for the slot after the worn one, around the whole catalog (a tap on the head).
export function nextPart(look: Look, slot: LookSlot): Look {
  const list = CAPSULE_CATALOG.parts.filter((p) => p.slot === slot);
  const at = list.findIndex((p) => p.id === look[slot]);
  return wear(look, slot, list[(at + 1) % list.length]?.id ?? null);
}
