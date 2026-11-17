import { LOOK_SLOTS, type LookSlot } from '@shared/capsule.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import type { GiftTier } from '@shared/gifts.ts';
import { normalize } from '@shared/trText.ts';

import { accessories, type Look, showsPart, wearAccessory } from './look';
import type { Option } from './options';
import { EMPTY_KEY } from './strip';

// Tüm aksesuarlar's list (yeni arayüz tuvali, TumAksesuarlar; docs/decisions/yeni-tuval.md → f):
// everything the person can put on, by section in the board's order, then the skin sets. It is what
// Kapsülünü süsle offers (options.ts: the colours, the free parts, the owned pack accessories), not
// more: nothing here decides what may be worn, the server still checks it on Kaydet.

// The board's order: Baş, Göz, Yüz, Ağız, Gövde, Renk, then the sets.
export const CATALOG_KINDS = ['h', 'e', 'f', 'm', 'n', 'c', 'sets'] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export type CatalogItem = {
  // Unique in the whole list (a Destansı piece in two slots is two items).
  key: string;
  kind: CatalogKind;
  name: string;
  tier: GiftTier | null;
  // A part, an accessory or a colour: what it puts on, and in which slot.
  slot?: LookSlot;
  option?: Option;
  // A set: the pieces of it the person owns, put on together.
  pieces?: readonly string[];
};

export type CatalogSection = { kind: CatalogKind; items: CatalogItem[] };

// A set worn whole: the first owned piece of it for each slot, none that takes a slot another has
// (a set has several pieces for a slot; the whole wears one of each).
export function setPieces(setId: string, owned: ReadonlySet<string>): string[] {
  const taken = new Set<string>();
  const out: string[] = [];
  for (const slot of LOOK_SLOTS) {
    const piece = GIFT_CATALOG.accessories.find(
      (a) => a.set === setId && owned.has(a.id) && a.slots.includes(slot),
    );
    if (!piece || out.includes(piece.id) || piece.slots.some((s) => taken.has(s))) continue;
    for (const s of piece.slots) taken.add(s);
    out.push(piece.id);
  }
  return out;
}

export function catalogSections(input: {
  // The slot's options as Süsle offers them (options.ts → slotOptions(...).flat); passed in so this
  // file reads no screen code.
  optionsOf: (slot: LookSlot) => readonly Option[];
  owned: ReadonlySet<string>;
  setName: (name: string) => string;
}): CatalogSection[] {
  const out: CatalogSection[] = [];
  for (const kind of CATALOG_KINDS) {
    if (kind === 'sets') {
      const items: CatalogItem[] = [];
      for (const set of GIFT_CATALOG.sets) {
        const pieces = setPieces(set.id, input.owned);
        if (pieces.length > 0)
          items.push({
            key: `set-${set.id}`,
            kind,
            name: input.setName(set.name),
            tier: 'efsanevi',
            pieces,
          });
      }
      out.push({ kind, items });
      continue;
    }
    const flat = input.optionsOf(kind);
    out.push({
      kind,
      items: flat
        .filter((o) => o.key !== EMPTY_KEY)
        .map((option) => ({
          key: `${kind}|${option.key}`,
          kind,
          name: option.name,
          tier: option.tier,
          slot: kind,
          option,
        })),
    });
  }
  return out;
}

// The item is on the look now (a set: every piece of it).
export function isWorn(item: CatalogItem, look: Look): boolean {
  if (item.pieces) {
    const worn = accessories(look);
    return item.pieces.every((id) => worn.includes(id));
  }
  const { option, slot } = item;
  if (!option || !slot) return false;
  if (option.accessory) return accessories(look).includes(option.accessory);
  return option.part !== undefined && showsPart(look, slot, option.part);
}

// "Kapsülüne tak": the item on the look (the draft); nothing is written.
export function putOn(item: CatalogItem, look: Look): Look {
  if (item.pieces) return item.pieces.reduce((l, id) => wearAccessory(l, id), look);
  return item.option ? item.option.apply(look) : look;
}

// The items whose name holds what is searched (Turkish letters folded: "kedi" finds "Kedi").
export function searchItems(sections: readonly CatalogSection[], query: string): CatalogItem[] {
  const q = normalize(query).trim();
  if (q === '') return [];
  return sections.flatMap((s) => s.items.filter((i) => normalize(i.name).includes(q)));
}

export function countOf(sections: readonly CatalogSection[]): number {
  return sections.reduce((n, s) => n + s.items.length, 0);
}
