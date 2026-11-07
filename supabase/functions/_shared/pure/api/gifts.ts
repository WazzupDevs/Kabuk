import type { GiftPack, GiftTier, TierOdds } from '../gifts.ts';

// Request and response shapes of the `gifts` Edge Function, shared with the mobile app
// (docs/SPEC_V4.md §4.U, K-89). Everything here is the caller's own: no other account's packs,
// accessories or worn accessory are ever answered (rule 4).

// The Aktiviteler card and the Paketler screen.
export type GiftStateRequest = { action: 'state' };

// The app opened with a session: one a day counts (the server works out the day).
export type GiftLoginRequest = { action: 'login' };

// One unopened pack of `pack` (only bronz opens; the others are locked, "Yakında").
export type GiftOpenRequest = { action: 'open'; pack: GiftPack };

// Wear an owned accessory on the capsule; null takes it off.
export type GiftEquipRequest = { action: 'equip'; accessoryId: string | null };

export type GiftsRequest = GiftStateRequest | GiftLoginRequest | GiftOpenRequest | GiftEquipRequest;

export type GiftPackView = {
  id: GiftPack;
  locked: boolean;
  // Unopened packs of this kind (0 for a locked one).
  unopened: number;
  // The odds the draw applies to this person now, in parts of ODDS_TOTAL (pure/gifts.ts); the
  // Oranlar sheet shows them, the app computes nothing.
  odds: TierOdds;
};

export type GiftState = {
  packs: GiftPackView[];
  // Counted logins toward the next Bronz pack, of `loginsPerPack`.
  logins: number;
  loginsPerPack: number;
  // Every accessory a pack gives is owned: no pack is earned until new ones come.
  allOwned: boolean;
  // Oldest first.
  owned: { id: string; tier: GiftTier; pack: GiftPack }[];
  // The one worn on the capsule, or null.
  equipped: string | null;
};

export type GiftStateResponse = GiftState;
export type GiftLoginResponse = GiftState;
export type GiftOpenResponse = { accessory: { id: string; tier: GiftTier }; state: GiftState };
export type GiftEquipResponse = { capsuleLook: string; equipped: string | null };
