import type { GiftPackView, GiftState } from '@shared/api/gifts.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import { GIFT_PACKS, GIFT_TIERS, type GiftPack, type GiftTier } from '@shared/gifts.ts';

// What the gift screens read of the state the server answers (docs/SPEC_V4.md §4.U): names from the
// catalog, the Aktiviteler card's state. Nothing here draws or decides a pack; the server does.

export function packName(pack: GiftPack): string {
  return GIFT_CATALOG.packs.find((p) => p.id === pack)?.name ?? pack;
}

export function tierName(tier: GiftTier): string {
  return GIFT_CATALOG.tiers.find((t) => t.id === tier)?.name ?? tier;
}

export type Accessory = {
  id: string;
  name: string;
  tier: GiftTier;
  // The capsule slots it is worn in (§4.U "yuvalar").
  slots: readonly string[];
  // Out of the packs (7 Kasım): shown only to whoever owns it.
  retired: boolean;
};

// The catalog's accessories (the app's copy; one the server knows and this app not is skipped).
export const ACCESSORIES: readonly Accessory[] = GIFT_CATALOG.accessories.flatMap((a) =>
  (GIFT_TIERS as readonly string[]).includes(a.tier)
    ? [
        {
          id: a.id,
          name: a.name,
          tier: a.tier as GiftTier,
          slots: a.slots,
          retired: a.retired === true,
        },
      ]
    : [],
);

export function accessoryById(id: string | null | undefined): Accessory | null {
  return ACCESSORIES.find((a) => a.id === id) ?? null;
}

// What Aksesuarlarım shows this person: every accessory a pack gives, and a retired one only to
// its owner (§4.U).
export function shownAccessories(owned: ReadonlySet<string>): Accessory[] {
  return ACCESSORIES.filter((a) => !a.retired || owned.has(a.id));
}

// Aksesuarlarım's groups: every tier with its shown accessories in catalog order.
export function byTier(owned: ReadonlySet<string>): { tier: GiftTier; items: Accessory[] }[] {
  const shown = shownAccessories(owned);
  return GIFT_TIERS.map((tier) => ({ tier, items: shown.filter((a) => a.tier === tier) }));
}

// An accessory's slots by name ("Baş · Boyun").
export function slotNames(a: Accessory): string {
  return a.slots.map((s) => CAPSULE_CATALOG.slots.find((x) => x.id === s)?.name ?? s).join(' · ');
}

export function packView(state: GiftState, pack: GiftPack): GiftPackView | null {
  return state.packs.find((p) => p.id === pack) ?? null;
}

export type PackViewOf<P extends GiftPack> = GiftPackView & { id: P };

// The packs in order of worth, as the server answers them: the four tier packs, then Elf and
// Ninja; `shown` keeps the ones the screen can show (a pack with its picture).
export function packsInOrder<P extends GiftPack>(
  state: GiftState,
  shown: (pack: GiftPack) => pack is P,
): PackViewOf<P>[] {
  return GIFT_PACKS.flatMap((id) => {
    const p = packView(state, id);
    return p && shown(id) ? [{ ...p, id }] : [];
  });
}

// The Aktiviteler card (AktivitelerHediye): a Bronz pack to open, the logins to the next, or every
// accessory owned.
export type GiftCardState<P extends GiftPack = GiftPack> =
  | { kind: 'ready'; pack: P; count: number }
  | { kind: 'progress'; pack: 'bronz'; logins: number; per: number; left: number }
  | { kind: 'allOwned' };

export function cardState<P extends GiftPack>(
  state: GiftState,
  shown: (pack: GiftPack) => pack is P,
): GiftCardState<P> {
  if (state.allOwned) return { kind: 'allOwned' };
  const open = packsInOrder(state, shown).find((p) => !p.locked && p.unopened > 0);
  if (open) return { kind: 'ready', pack: open.id, count: open.unopened };
  const per = state.loginsPerPack;
  const logins = Math.min(state.logins, per);
  return { kind: 'progress', pack: 'bronz', logins, per, left: Math.max(per - logins, 0) };
}
