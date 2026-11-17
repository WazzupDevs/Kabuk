// The sign-up screen's riso buddies (Aura v65 report §13, §13.1; KayitKanki, approved 1 Kas 21:34):
// where each stands in the scene and how it moves. The ground stays still; each buddy breathes,
// sways, blinks and two of them hop, on a 6 s loop, transforms only, turning and scaling about the
// picture's bottom middle (50 % / 96 %). Pure: the frame function is a worklet (src/aura/RisoKanki.tsx
// drives it on the UI thread) and kankiMotion.test.ts pins it.

export const KANKI_LOOP_S = 6;

// Where the turn and the scale are centred, in the picture (50 % / 96 %).
export const KANKI_ORIGIN = { x: 0.5, y: 0.96 } as const;

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

export type KankiBeat = {
  // The breath's period (s) and phase.
  period: number;
  phase: number;
  // When the eyes close, each for 125 ms (s into the loop).
  blinks: readonly number[];
  // When a hop starts (s into the loop); none for most.
  hop: number | null;
};

// §13.1's table.
export const KANKI_BEATS: Partial<Record<KankiId, KankiBeat>> = {
  b83534: { period: 2, phase: 0, blinks: [0.9, 4.1], hop: null },
  '7d5ef2': { period: 3, phase: 1.1, blinks: [2.3], hop: null },
  '3c95b1': { period: 2, phase: 2.2, blinks: [1.6, 1.85, 5.0], hop: null },
  '4957ac': { period: 3, phase: 3.0, blinks: [3.2], hop: 5.15 },
  '1a80a9': { period: 2, phase: 4.0, blinks: [0.4, 3.9], hop: null },
  '6f419d': { period: 3, phase: 5.0, blinks: [2.8], hop: null },
  f280a5: { period: 2, phase: 0.6, blinks: [1.2, 4.6, 4.85], hop: 3.4 },
};

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

export type KankiFrame = {
  translateY: number;
  rotate: number;
  scaleX: number;
  scaleY: number;
  // The closed-eye picture shows.
  closed: boolean;
  // The shadow's scale and opacity.
  shadow: number;
};

const BREATH_Y = 0.022;
const BREATH_X = 0.012;
const SWAY_DEG = 2.2;
const SWAY_S = 3;
const SWAY_PHASE = 0.9;
const BLINK_S = 0.125;
const HOP_S = 0.6;
const HOP_SQUAT = 0.15;
const HOP_LAND = 0.85;
const HOP_RISE = 12;
const SHADOW_PER = 30;

// One buddy's frame `t` seconds into the loop (0 ≤ t < 6).
export function kankiFrame(beat: KankiBeat, t: number): KankiFrame {
  'worklet';
  const tau = 2 * Math.PI;
  const breath = Math.sin((tau * t) / beat.period + beat.phase);
  let scaleY = 1 + BREATH_Y * breath;
  let scaleX = 1 - BREATH_X * breath;
  let translateY = 0;
  let sway = 1;
  if (beat.hop !== null && t >= beat.hop && t < beat.hop + HOP_S) {
    const u = (t - beat.hop) / HOP_S;
    sway = 0.3;
    if (u < HOP_SQUAT) {
      const s = Math.sin((Math.PI * u) / HOP_SQUAT);
      scaleY -= 0.07 * s;
      scaleX += 0.05 * s;
    } else if (u < HOP_LAND) {
      const s = Math.sin((Math.PI * (u - HOP_SQUAT)) / (HOP_LAND - HOP_SQUAT));
      translateY = -HOP_RISE * s;
      scaleY += 0.04 * s;
      scaleX -= 0.02 * s;
    } else {
      const s = Math.sin((Math.PI * (u - HOP_LAND)) / (1 - HOP_LAND));
      scaleY -= 0.05 * s;
      scaleX += 0.04 * s;
    }
  }
  const rotate = sway * SWAY_DEG * Math.sin((tau * t) / SWAY_S + SWAY_PHASE * beat.phase);
  let closed = false;
  for (let i = 0; i < beat.blinks.length; i += 1) {
    const at = beat.blinks[i];
    if (at !== undefined && t >= at && t < at + BLINK_S) closed = true;
  }
  return { translateY, rotate, scaleX, scaleY, closed, shadow: 1 + translateY / SHADOW_PER };
}
