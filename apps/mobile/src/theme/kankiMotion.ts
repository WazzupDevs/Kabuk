// The riso buddies (Aura v65 report §13; KayitKanki): where each stands in its scene. They stand
// still: the breathing, blinking and hopping of §13.1 is not drawn anywhere and its code is gone
// (17 Kasım).

// The shadow under its feet (`.stand i`): half as wide, 7 % as high, 2.5 % from the bottom.
export const KANKI_SHADOW = {
  width: 0.5,
  height: 0.07,
  bottom: 0.025,
  color: 'rgba(4, 73, 35, 0.24)',
  // Aura v75 KayitKoyu (`.dark.pA .stand i`): black on the dark riso scene.
  colorDark: 'rgba(0, 0, 0, 0.5)',
  blur: 3,
} as const;

export type KankiId =
  | 'b83534'
  | '7d5ef2'
  | '3c95b1'
  | '4957ac'
  | '1a80a9'
  | '6f419d'
  | 'f280a5'
  | 'af811f'
  | '9c96bd'
  | 'c189a4'
  | 'd2fbb5'
  | '1e1bef'
  // The two half-length ones looking over a field (assets/riso/peek-*.webp, 160x200).
  | 'peek-1'
  | 'peek-2';

// A riso buddy's picture, 320x420: its width for a height.
export const RISO_ASPECT = 320 / 420;

export type KankiPlace = {
  id: KankiId;
  // In the scene's 350 wide frame (Main: 390 less the 20 sides), px; `right` and `top` where the
  // board measures from those sides.
  left?: number;
  right?: number;
  bottom?: number;
  top?: number;
  width: number;
  height: number;
};

// The board's frame the places are measured in.
export const KANKI_FRAME_WIDTH = 350;

// Aura v71 settings pages: one still riso buddy standing in a bottom corner of the screen
// (`.stand` in the phone, its feet 30 over the screen's bottom), behind the page.
export const PAGE_KANKI = {
  privacy: { id: '9c96bd', right: 22, bottom: 30, width: 96, height: 126 },
  blocked: { id: 'c189a4', left: 30, bottom: 30, width: 96, height: 126 },
  muted: { id: '3c95b1', right: 30, bottom: 30, width: 96, height: 126 },
} as const satisfies Record<string, KankiPlace>;

// YasalMetin: one looking over "Devam" (`.lbar .peek .stand`), 20 from the right, its feet 36 under
// the button's top edge. GuncellemeGerekli: one standing over the title, in the column.
export const LEGAL_PEEK: KankiPlace = { id: '1a80a9', right: 20, top: -36, width: 80, height: 105 };
export const UPDATE_KANKI: KankiPlace = { id: '6f419d', width: 110, height: 144 };

// Arkadaslar (tuval Arkadaslar): one looking over the list's card, 54 × 68, 40 from its right, its
// head 58 over the card's top edge; in the 350 wide frame scaled to the 358 card.
export const FRIENDS_PEEK: readonly KankiPlace[] = [
  { id: 'peek-1', left: 258, top: 0, width: 53, height: 66.5 },
];
// Keşfet (iskelet.md → 5.1): one buddy looking over the search capsule's right, scrolling with the
// content, in the 350 wide frame (tuval Kesfet: 38 × 50, 74 from the capsule's right, its head 42
// over the capsule's top edge: 58 − 42 = 16 down the strip).
export const EXPLORE_PEEK: readonly KankiPlace[] = [
  { id: 'peek-1', left: 237, top: 16, width: 38, height: 51 },
];

// MasaIstek (U42): three riso buddies looking over the incoming request's card, in the card's 362
// wide frame (390 less 14 a side).
export const REQUEST_PEEK_FRAME = 362;
export const REQUEST_KANKI: readonly KankiPlace[] = [
  { id: '6f419d', left: 18, top: 2, width: 92, height: 121 },
  { id: 'af811f', left: 128, top: -12, width: 92, height: 121 },
  { id: 'd2fbb5', right: 22, top: 2, width: 92, height: 121 },
];

// CheckIn (Aura v65): three riso buddies looking over the sheet's top edge, a strip 61 over it, in
// the sheet's 370 wide frame (390 less 10 a side).
export const CHECKIN_PEEK_FRAME = 370;
export const CHECKIN_PEEK_UP = 61;
export const CHECKIN_KANKI: readonly KankiPlace[] = [
  { id: '1e1bef', left: 27, top: 0, width: 89, height: 116 },
  { id: '6f419d', left: 154, top: -15, width: 89, height: 116 },
  { id: '1a80a9', left: 275, top: 4, width: 89, height: 116 },
];

// The peek strip over the field: 58 over its top edge, 120 high (`.behind > .peek`).
export const KANKI_PEEK = { up: 58, height: 120 } as const;
