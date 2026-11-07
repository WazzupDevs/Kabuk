import type { GiftPack, GiftTier } from '@shared/gifts.ts';
import type { ImageSourcePropType } from 'react-native';

// The gift pictures (Aura v134; the canvas's asset store, docs/SPEC_V4.md §4.U): each pack (720 ×
// 1134, the tear line at 8.5 % of its height) and each accessory's card (600 × 840: the tier's
// holographic frame with the accessory in its middle, a white edge round it). An accessory with no
// card here is laid out as its collection tile (parts.tsx → CardFace). A pack with no picture here is not shown on
// Paketler: Elf and Ninja wait for theirs (the canvas has none yet).
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

const CARD_ART: Record<string, ImageSourcePropType> = {
  bere: require('../../../assets/gifts/card-bere.webp'),
  yuvarlakgozluk: require('../../../assets/gifts/card-yuvarlakgozluk.webp'),
  kasket: require('../../../assets/gifts/card-kasket.webp'),
  kulaklik: require('../../../assets/gifts/card-kulaklik.webp'),
  buyucusapkasi: require('../../../assets/gifts/card-buyucusapkasi.webp'),
  yildizgozluk: require('../../../assets/gifts/card-yildizgozluk.webp'),
  tac: require('../../../assets/gifts/card-tac.webp'),
  ejderboynuzu: require('../../../assets/gifts/card-ejderboynuzu.webp'),
};
const TIER_FRAME: Record<GiftTier, ImageSourcePropType> = {
  siradan: require('../../../assets/gifts/art-siradan.webp'),
  nadir: require('../../../assets/gifts/art-nadir.webp'),
  destansi: require('../../../assets/gifts/art-destansi.webp'),
  efsanevi: require('../../../assets/gifts/art-efsanevi.webp'),
};
export const CARD_RATIO = 600 / 840;

export function hasCardArt(id: string): boolean {
  return Object.hasOwn(CARD_ART, id);
}

export function cardArt(id: string, tier: GiftTier): ImageSourcePropType {
  return CARD_ART[id] ?? TIER_FRAME[tier];
}

// The collection tile's ground (hediye.css `.nf.tile`): the tier's frame art.
export function tileArt(tier: GiftTier): ImageSourcePropType {
  return TIER_FRAME[tier];
}

// The celebration buddies, Efsanevi only.
export const BUDDIES = [
  require('../../../assets/gifts/buddy-a.webp') as ImageSourcePropType,
  require('../../../assets/gifts/buddy-b.webp') as ImageSourcePropType,
] as const;
