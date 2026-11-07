import type { GiftPack, GiftTier } from '@shared/gifts.ts';
import type { ImageSourcePropType } from 'react-native';

// The gift pictures (Aura v134; the canvas's asset store, docs/SPEC_V4.md §4.U): each pack (720 ×
// 1134, the tear line at 8.5 % of its height) and each tier's empty card (600 × 840). Every
// accessory's card is made from its tier's card and the accessory's own drawing (parts.tsx →
// CardFace), so an accessory a new pack brings has its card with its drawing. A pack with no
// picture here is not shown on Paketler.
export const PACK_ART = {
  bronz: require('../../../assets/gifts/pack-bronz.webp') as ImageSourcePropType,
  gumus: require('../../../assets/gifts/pack-gumus.webp') as ImageSourcePropType,
  altin: require('../../../assets/gifts/pack-altin.webp') as ImageSourcePropType,
  elmas: require('../../../assets/gifts/pack-elmas.webp') as ImageSourcePropType,
} satisfies Partial<Record<GiftPack, ImageSourcePropType>>;
export type ShownPack = keyof typeof PACK_ART;

export function isShownPack(pack: GiftPack): pack is ShownPack {
  return Object.hasOwn(PACK_ART, pack);
}
export const PACK_RATIO = 160 / 252;
export const TEAR_AT = 0.085;

const TIER_FRAME: Record<GiftTier, ImageSourcePropType> = {
  siradan: require('../../../assets/gifts/art-siradan.webp'),
  nadir: require('../../../assets/gifts/art-nadir.webp'),
  destansi: require('../../../assets/gifts/art-destansi.webp'),
  efsanevi: require('../../../assets/gifts/art-efsanevi.webp'),
};
export const CARD_RATIO = 600 / 840;
// The empty card's clear sides on its 600 wide picture, by tier (measured on the frames), and its
// corner: the card's light (holo, band) stays inside the picture (the owner's report, 7 Kasım: it
// showed past the card's sides).
export const CARD_SIDE: Record<GiftTier, number> = {
  siradan: 12 / 600,
  nadir: 14 / 600,
  destansi: 19 / 600,
  efsanevi: 19 / 600,
};
export const CARD_FRAME_CORNER = 30 / 600;

// A tier's card with no accessory in it (the canvas's card frames, kart-<tier>.png, 600 × 840).
const BLANK_CARD: Record<GiftTier, ImageSourcePropType> = {
  siradan: require('../../../assets/gifts/card-blank-siradan.webp'),
  nadir: require('../../../assets/gifts/card-blank-nadir.webp'),
  destansi: require('../../../assets/gifts/card-blank-destansi.webp'),
  efsanevi: require('../../../assets/gifts/card-blank-efsanevi.webp'),
};

export function blankCard(tier: GiftTier): ImageSourcePropType {
  return BLANK_CARD[tier];
}

// The collection tile's ground (hediye.css `.nf.tile`): the tier's frame art.
export function tileArt(tier: GiftTier): ImageSourcePropType {
  return TIER_FRAME[tier];
}
