import { DEFAULT_EYES, type LookSlot } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import type { GiftTier } from '@shared/gifts.ts';

import { accessoryById } from '@/features/gifts/model';

import {
  accessoryIn,
  accessoryItems,
  code,
  colors as colorItems,
  type Look,
  packsFor,
  type RackId,
  wear,
  wearAccessory,
} from './look';

// Kapsülünü süsle's options for a slot (the owner's call, 8 Kasım): "boş" first where the slot can
// be empty, the owned pack accessories, then every rack's packs in order; the colours for 'c'.
// Each option's tile is "sade": a plain capsule in the person's current colour with the plain eyes,
// wearing only that option, so that a tile depends on the colour and the option alone and does not
// draw again when another slot changes.
export type Option = {
  key: string;
  name: string;
  // The sade tile's look code.
  tile: string;
  // What the option puts in the slot: an accessory, a part (eyes, colour) or nothing ("boş").
  accessory?: string;
  part?: string;
  tier: GiftTier | null;
  apply: (look: Look) => Look;
};
export type OptionGroup = { rack: RackId | null; pack: string | null; options: Option[] };

export function slotOptions(
  slot: LookSlot,
  color: string | undefined,
  kept: Look,
  owned: ReadonlySet<string>,
  emptyName: string,
): { groups: OptionGroup[]; flat: Option[] } {
  const base: Look = { c: color, e: DEFAULT_EYES };
  const groups: OptionGroup[] = [];
  if (slot === 'c') {
    groups.push({
      rack: null,
      pack: null,
      options: colorItems().map((item) => ({
        key: `c-${item.id}`,
        name: item.name,
        tile: code({ c: item.id, e: DEFAULT_EYES }),
        part: item.id,
        tier: null,
        apply: (look) => wear(look, 'c', item.id),
      })),
    });
  } else {
    const top: Option[] = [];
    if (slot !== 'e')
      top.push({
        key: 'empty',
        name: emptyName,
        tile: code(base),
        tier: null,
        apply: (look) => wear(look, slot, null),
      });
    for (const item of accessoryItems(slot, owned))
      top.push({
        key: `x-${item.id}`,
        name: item.name,
        tile: code(wearAccessory(base, item.id)),
        accessory: item.id,
        tier: accessoryById(item.id)?.tier ?? null,
        apply: (look) => wearAccessory(look, item.id),
      });
    if (top.length > 0) groups.push({ rack: null, pack: null, options: top });
    for (const rack of CAPSULE_CATALOG.racks)
      for (const group of packsFor(rack.id, slot, kept))
        groups.push({
          rack: rack.id,
          pack: group.pack,
          options: group.items.map((item) => ({
            key: `${rack.id}-${group.pack}-${item.id}`,
            name: item.name,
            tile: code(wear(base, slot, item.id)),
            part: item.id,
            tier: null,
            apply: (look) => wear(look, slot, item.id),
          })),
        });
  }
  return { groups, flat: groups.flatMap((g) => g.options) };
}

// The option the look shows in the slot (the accessory over it, else its part, else "boş").
export function chosenIn(slot: LookSlot, look: Look, flat: readonly Option[]): number {
  const over = accessoryIn(look, slot);
  const at = flat.findIndex((o) =>
    over ? o.accessory === over : o.accessory === undefined && o.part === look[slot],
  );
  return Math.max(0, at);
}

// What shows in the slot, to tell a slot changed from the saved look.
export function shownIn(slot: LookSlot, look: Look): string {
  const over = accessoryIn(look, slot);
  return over ? `x:${over}` : (look[slot] ?? '');
}
