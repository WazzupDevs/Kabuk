import type { GiftPackView, GiftState } from '@shared/api/gifts.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import {
  GIFT_TIERS,
  type GiftPack,
  type GiftTier,
  TIER_PACKS,
  type TierPack,
} from '@shared/gifts.ts';

// What the gift screens read of the state the server answers (docs/SPEC_V4.md §4.U): names from the
// catalog, the Aktiviteler card's state. Nothing here draws or decides a pack; the server does.

export function packName(pack: GiftPack): string {
  return GIFT_CATALOG.packs.find((p) => p.id === pack)?.name ?? pack;
}

export function tierName(tier: GiftTier): string {
  return GIFT_CATALOG.tiers.find((t) => t.id === tier)?.name ?? tier;
}

export type Accessory = { id: string; name: string; tier: GiftTier };

// The catalog's accessories (the app's copy; one the server knows and this app not is skipped).
export const ACCESSORIES: readonly Accessory[] = GIFT_CATALOG.accessories.flatMap((a) =>
  (GIFT_TIERS as readonly string[]).includes(a.tier)
    ? [{ id: a.id, name: a.name, tier: a.tier as GiftTier }]
    : [],
);

export function accessoryById(id: string | null | undefined): Accessory | null {
  return ACCESSORIES.find((a) => a.id === id) ?? null;
}

// Aksesuarlarım's groups: every tier with its accessories in catalog order.
export function byTier(): { tier: GiftTier; items: Accessory[] }[] {
  return GIFT_TIERS.map((tier) => ({ tier, items: ACCESSORIES.filter((a) => a.tier === tier) }));
}

export function packView(state: GiftState, pack: GiftPack): GiftPackView | null {
  return state.packs.find((p) => p.id === pack) ?? null;
}

export type TierPackView = GiftPackView & { id: TierPack };

// The four tier packs in order of worth, as the server answers them (Elf and Ninja come with their
// screens).
export function packsInOrder(state: GiftState): TierPackView[] {
  return TIER_PACKS.flatMap((id) => {
    const p = packView(state, id);
    return p ? [{ ...p, id }] : [];
  });
}

// The Aktiviteler card (AktivitelerHediye): a Bronz pack to open, the logins to the next, or every
// accessory owned.
export type GiftCardState =
  | { kind: 'ready'; pack: TierPack; count: number }
  | { kind: 'progress'; pack: TierPack; logins: number; per: number; left: number }
  | { kind: 'allOwned' };

export function cardState(state: GiftState): GiftCardState {
  if (state.allOwned) return { kind: 'allOwned' };
  const open = packsInOrder(state).find((p) => !p.locked && p.unopened > 0);
  if (open) return { kind: 'ready', pack: open.id, count: open.unopened };
  const per = state.loginsPerPack;
  const logins = Math.min(state.logins, per);
  return { kind: 'progress', pack: 'bronz', logins, per, left: Math.max(per - logins, 0) };
}
