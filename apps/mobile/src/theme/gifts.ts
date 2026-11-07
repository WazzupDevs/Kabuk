import type { GiftPack, GiftTier } from '@shared/gifts.ts';

import type { ColorScheme as Scheme } from './tokens';

// Hediye paketleri's own colours (Aura v134 hediye.css; docs/SPEC_V4.md §4.U): each tier's colour
// (light, and `.dark.pA`), each pack's glow on Paketler, the Aktiviteler card's stage strip and the
// "can open" badge.
export const TIER_COLOR: Record<Scheme, Record<GiftTier, string>> = {
  light: { siradan: '#6E8874', nadir: '#2C63D6', destansi: '#7B5CFF', efsanevi: '#FFB547' },
  dark: { siradan: '#A3AEA8', nadir: '#7DB2FF', destansi: '#7B5CFF', efsanevi: '#FFB547' },
};
// The tier tag's ground: its colour at 16 % (`color-mix(... 16%, transparent)`).
export const TIER_TAG_ALPHA = '29';

// The result card's two glows (PaketAcilisNadirlik): the tier's colour and a second one.
export const TIER_GLOW: Record<GiftTier, readonly [string, string]> = {
  siradan: ['#6E8874', '#D6E6DA'],
  nadir: ['#2C63D6', '#2FA8E0'],
  destansi: ['#7B5CFF', '#FF4F8B'],
  efsanevi: ['#FFB547', '#FF4F8B'],
};
// The sparkles around the card: none for Sıradan, then 4, 8 and 14 (PaketAcilisNadirlik).
export const TIER_SPARKLES: Record<GiftTier, number> = {
  siradan: 0,
  nadir: 4,
  destansi: 8,
  efsanevi: 14,
};

// A pack's glow behind the ring and on the way to the rip (Paketler, PaketSecimGecis): its own
// colour and its second.
export const PACK_GLOW: Record<GiftPack, readonly [string, string]> = {
  bronz: ['#FF7A3D', '#9A6B4E'],
  gumus: ['#A3C4AE', '#6E8874'],
  altin: ['#F2C230', '#FFB547'],
  elmas: ['#1FB5A8', '#2FA8E0'],
};
// The rip's torn edge (PaketAcilis): a white line over a thin line in the pack's light colour.
export const RIP_EDGE = { line: '#FFFFFF', under: '#FFB27F', shade: '#000000' } as const;

// The "can open" badge (GaleriHediye: 24, pink, a white ring and a halo).
export const GIFT_BADGE = {
  fill: '#FF4F8B',
  ring: '#FFFFFF',
  halo: 'rgba(255,79,139,0.30)',
  glow: 'rgba(255,79,139,0.55)',
  ink: '#FFFFFF',
} as const;

// The Aktiviteler card's stage (AktivitelerHediye): a warm strip, white words; grey when every
// accessory is owned.
export const GIFT_STAGE = {
  ready: 'linear-gradient(118deg, #2A1208 0%, #6B2F14 42%, #C9561F 78%, #FF8A4C 100%)',
  allOwned: 'linear-gradient(118deg, #1E2421 0%, #3A4440 55%, #6E8874 100%)',
  rays: 'rgba(255,220,180,0.16)',
  sun: 'radial-gradient(closest-side, rgba(255,170,110,0.55), transparent)',
  star: '#FFE2C4',
  ink: '#FFFFFF',
  eyebrow: 'rgba(255,255,255,0.72)',
  barOff: 'rgba(255,255,255,0.28)',
  round: 'rgba(255,255,255,0.18)',
  button: '#FFFFFF',
  buttonInk: '#2A1208',
  packShadow: 'rgba(20,8,2,0.45)',
} as const;

// The ring's floor shadow and the opened card's light (PaketKartEgme).
export const GIFT_FLOOR = {
  light: 'radial-gradient(closest-side, rgba(4,40,20,0.28), transparent)',
  dark: 'radial-gradient(closest-side, rgba(4,40,20,0.7), transparent)',
} as const;
export const CARD_LIGHT = {
  holo: 'linear-gradient(120deg, #FF4F8B, #F2C230, #3DDC84, #2FA8E0, #7B5CFF, #FF4F8B)',
  band: 'linear-gradient(105deg, transparent 32%, rgba(255,255,255,0.75) 50%, transparent 68%)',
} as const;
// The swipe hint's round finger (PaketSecimDonme, PaketAcilis).
export const FINGER = {
  fill: 'rgba(255,255,255,0.55)',
  ring: 'rgba(255,255,255,0.9)',
  arrow: '#FFFFFF',
} as const;

// A collection tile (hediye.css `.nf`, `.tile`): the frame's width by tier, the Efsanevi foil's
// colours, the corner stars.
export const TILE_FRAME: Record<GiftTier, number> = {
  siradan: 2,
  nadir: 3,
  destansi: 3,
  efsanevi: 4,
};
export const EFSANEVI_FOIL = 'linear-gradient(135deg, #FFB547, #FF4F8B 50%, #FFB547)';
// The dark side's card ground (`.dark.pA .nf`).
export const TILE_GROUND_DARK = '#151A18';
