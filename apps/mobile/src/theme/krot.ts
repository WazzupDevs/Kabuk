import type { TextStyle } from 'react-native';

import { RISO, RISO_PANEL_WIDTH, risoType } from './riso';

// Krot's hidden card and suspect line-up (Aura v86, the "Krot (gizli kart ve şüpheli sırası)" row
// and the `Krot` panel; the acceptance report of 4 Kasım). The panels are 390 × 844; every number
// here is theirs. The bar, the strip, the deck and the buddies are the card games' (theme/riso.ts).

const F800 = 'PlusJakartaSans_800ExtraBold';
const F700 = 'PlusJakartaSans_700Bold';

export const KROT_TYPE = {
  // The phase pill in the bar (`.phase`): 700/15.
  phase: risoType(F700, 15, 19),
  // The role card's words: the label over the word (`.kick`, 800/11, 12 % apart; GÖZLEMCİSİN 10,
  // 4 %), the word white in the band (`.w`, 800/30; SAHTEKARSIN 26), the category pill (`.ktag`,
  // 700/14), the note under it (`.kb`, 700/16/22), the "Basılı tut" pill (`.hold`, 700/14).
  kick: risoType(F800, 11, 14, 0.12),
  kickLong: risoType(F800, 10, 14, 0.04),
  word: risoType(F800, 30, 34, 0.01),
  wordImpostor: risoType(F800, 26, 30, 0.01),
  tag: risoType(F700, 14, 18),
  note: risoType(F700, 16, 22),
  hold: risoType(F700, 14, 18),
  // The line-up: the plate's number (`.no`, 800/13, tabular), the name (`.nm`, 700/12/14).
  plate: { ...risoType(F800, 13, 16), fontVariant: ['tabular-nums'] } as TextStyle,
  name: risoType(F700, 12, 14),
  // The eyebrows over the glass rows (`.eb`: 700/11/14, 10 % apart, upper case).
  eyebrow: risoType(F700, 11, 14, 0.1),
  // The guess's field (`.field`: 800/21, 6 % apart).
  field: risoType(F800, 21, 26, 0.06),
} as const;

export const KROT = {
  // The phase pill: 44 high, 18 in, glass.
  phase: { height: 44, padX: 18 },
  // The count beside Hazırım (`.chip.hz`): 48 high, 16 in.
  readyChip: { height: 48, padX: 16 },
  // The role card's layer on the 296 card (scaled with the deck): the label 25 down, 20 high; the
  // word 30 in, 50 down, 54 high, white with a 2 shadow; the category pill 122 down, 30 high, 12
  // in, black 86 %; the note 40 in, 166 down, #141016; the "Basılı tut" pill 228 down, 36 high, 14
  // in, black 72 %, 6 between the eye and the words.
  face: {
    kick: { top: 25, height: 20 },
    word: { side: 30, top: 50, height: 54 },
    tag: { top: 122, height: 30, padX: 12, fill: 'rgba(20, 16, 22, 0.86)' },
    note: { side: 40, top: 166 },
    hold: { top: 228, height: 36, padX: 14, gap: 6, fill: 'rgba(0, 0, 0, 0.72)' },
    ink: '#141016',
    wordInk: '#FFFFFF',
    wordShadow: { color: 'rgba(20, 16, 22, 0.45)', y: 2 },
    // The words shrink on one line, no smaller than this.
    minWord: 20,
  },
  // The suspect line-up (`.sira`): 350 × 280, 20 in, 22 round, the wall `k-sira` filling it, a
  // shadow under it; its buddies peek 78 over its top as over the deck's.
  lineup: {
    width: 350,
    height: 280,
    radius: 22,
    shadow: '0px 14px 30px rgba(0, 0, 0, 0.35)',
    // The buddies stand 58 in from the screen's sides, as over the deck: 38 inside the line-up.
    peekInset: 38,
    // Five columns 64 wide from 28 in (`.sus`).
    colLeft: 28,
    colWidth: 64,
    cols: 5,
    // The capsule avatar 52, 106 down; the speaker, the chosen and the caught 62, 101 down.
    avatar: 52,
    avatarTop: 106,
    big: 62,
    bigTop: 101,
    // Its ring in its own box: 3 white; the speaker's --signal and the chosen or caught one's --buzz,
    // 3 with a 7 halo at 30 %; the caller's a 3 dashed white line 3 out.
    ring: 3,
    halo: 7,
    haloSignal: 'rgba(255, 181, 71, 0.3)',
    haloBuzz: 'rgba(255, 79, 139, 0.3)',
    ringInk: '#FFFFFF',
    dashOut: 3,
    avatarShadow: '0px 8px 16px rgba(0, 0, 0, 0.35)',
    bigShadow: '0px 8px 16px rgba(0, 0, 0, 0.4)',
    // The plate (`.no`): 178 down, 34 × 22, 6 round, #141016 with a white 2 at 90 %.
    plate: { top: 178, width: 34, height: 22, radius: 6, fill: '#141016', edge: 2 },
    plateEdge: 'rgba(255, 255, 255, 0.9)',
    // The name (`.nm`): 232 down, 1 in, white with a shadow, at least two lines.
    name: { top: 232, side: 1, minHeight: 28 },
    nameShadow: { color: 'rgba(0, 0, 0, 0.9)', y: 1, blur: 2 },
    // "Yakalandı" over the caught one (`.stamp`): 66 down, turned −6°.
    stamp: { top: 66, turn: '-6deg' },
    // The voted tick (`.vb`): 24 round, 6 out at the avatar's top right, a 2 ring of #141016, its
    // check 14.
    tick: { size: 24, out: 6, ring: 2, ringInk: '#141016', icon: 14 },
    // The others while someone speaks, and the not caught at Sonuç: saturation 35 %, brightness
    // 62 %; their plate's brightness 70 %.
    dim: { saturate: 0.35, brightness: 0.62, plate: 0.7 },
    // Six to twelve players stand in two rows (proje sahibinin kararı, 5 Kasım; the canvas draws one):
    // the box 300 high on the same 350 and wall; the top row takes the first half in clue order, each
    // row centred. A row is drawn tight from its top: "Yakalandı" 0, the 62 face 24 (the 52 on its
    // centre), the plate 94, the two-line name 120 to 148; the rows 4 apart. A row's column is 66
    // wide while five fit (a ring then clears a neighbour's face), else the row shares the 350
    // (57 for six: the faces 45 and 54); the faces shrink only as far as the column asks.
    rows: {
      upTo: 5,
      height: 300,
      rowHeight: 148,
      rowGap: 4,
      stampTop: 0,
      bigTop: 24,
      plateTop: 94,
      nameTop: 120,
      colWidth: 66,
      // Six in a row share the 350 less 4 on each side, so their rings stay inside the box.
      pad: 4,
    },
  },
  // The glass row under the line-up (`.nx`, `.kw`): 24 under it, 22 round; Sıradaki's face 32.
  row: { below: 24, radius: 22, padY: 12, padX: 16, gap: 10, face: 32, kwPadY: 14 },
  // Sonuç's impostor card (`.nx` in a column): 16 in, 6 apart, the face 40.
  result: { pad: 16, gap: 6, face: 40, nameGap: 10 },
  // "Oy verenler" 16 under the row.
  countBelow: 16,
  // Son şans (KrotSonSans): the buddies 300 down and 40 in, the glass panel 392 down (16 in, 22
  // round, 10 apart), the field 56 high, 16 round, a 2 --accent edge, 16 in.
  guess: {
    peekTop: 300,
    peekInset: 40,
    panelTop: 392,
    pad: 16,
    radius: 22,
    gap: 10,
    field: { height: 56, radius: 16, edge: 2, padX: 16 },
  },
  // Oyun sonu (KrotOyunSonu): the scene 300 high on the wall, 36 round at the foot; the caught
  // face 84, 96 down, "Sahtekar" 10 over it; two buddies 140 high, 20 in, 14 under; the words 304
  // down (54 + the 250 spacer); confetti bars 8 × 18.
  end: {
    height: 300,
    radius: 36,
    heroTop: 96,
    face: 84,
    stampGap: 10,
    buddies: [
      { buddy: '1a80a9', left: 20, height: 140, below: 14 },
      { buddy: '9c96bd', right: 20, height: 140, below: 14 },
    ],
    confetti: [
      { left: 40, top: 74, color: '#FFB547', turn: '-24deg' },
      { left: 92, top: 46, color: '#FF7EA8', turn: '30deg' },
      { left: 300, top: 58, color: '#FFB547', turn: '-38deg' },
      { left: 338, top: 112, color: '#3DDC84', turn: '18deg' },
      { left: 196, top: 34, color: '#FF7EA8', turn: '-8deg' },
      { left: 24, top: 150, color: '#3DDC84', turn: '40deg' },
      { left: 250, top: 130, color: '#FFB547', turn: '-30deg' },
      { left: 140, top: 120, color: '#FF7EA8', turn: '22deg' },
    ],
    bar: { width: 8, height: 18, radius: 4 },
    contentTop: 304,
    cardGap: 10,
    cardFace: 40,
  },
  // Kimler oynuyor (KrotKimler): the poster 118 from the panel's top (54 + the 48 spacer + 12 + 4);
  // the buddy at the foot 96 high, 16 in, 14 under, turned 6°.
  pregame: {
    posterTop: 118,
    buddy: { buddy: 'd2fbb5', right: 16, below: 14, height: 96, turn: '6deg' },
  },
  // Speaking passes from one to the next on the swap curve (hareket.json → curves.swap) in this.
  swapMs: 220,
} as const;

// Where each player stands in the line-up's box (350 wide, before the screen's scale), and where
// a row's parts sit in their column.
export type KrotRow = {
  // The column's height (it takes the presses).
  height: number;
  stampTop: number;
  // The centre of the faces (52 and 62 alike) from the row's top.
  faceMid: number;
  plateTop: number;
  nameTop: number;
};
export type KrotSpot = { left: number; top: number; width: number; fit: number };

// The line-up on this screen: the box is the screen's width less the 20 sides (350 on the 390
// panels), never wider; its columns, faces and plates scale with it as a whole, as Kinshi's scenes
// do on 320 dp (docs/decisions/kinshi-320dp.md). Up to five players stand in one row as drawn; six
// to twelve in two (docs/decisions/krot-ekranlar.md), in clue order left to right, the top row
// first.
export function krotLineup(screenWidth: number, players: number) {
  const L = KROT.lineup;
  const scale = Math.min(1, (screenWidth - 2 * KROT_SIDE) / L.width);
  const two = players > L.rows.upTo;
  const height = two ? L.rows.height : L.height;
  let row: KrotRow;
  let spots: KrotSpot[];
  if (!two) {
    row = {
      height: L.height,
      stampTop: L.stamp.top,
      faceMid: L.bigTop + L.big / 2,
      plateTop: L.plate.top,
      nameTop: L.name.top,
    };
    spots = Array.from({ length: players }, (_, i) => ({
      left: L.colLeft + i * L.colWidth,
      top: 0,
      width: L.colWidth,
      fit: 1,
    }));
  } else {
    const R = L.rows;
    row = {
      height: R.rowHeight,
      stampTop: R.stampTop,
      faceMid: R.bigTop + L.big / 2,
      plateTop: R.plateTop,
      nameTop: R.nameTop,
    };
    const top = Math.ceil(players / 2);
    const counts = [top, players - top];
    spots = [];
    counts.forEach((n, r) => {
      const width = Math.min(R.colWidth, Math.floor((L.width - 2 * R.pad) / n));
      // A chosen face's ring clears its chosen neighbour's face.
      const fit = Math.min(1, (width - L.ring) / L.big);
      const left = (L.width - n * width) / 2;
      for (let i = 0; i < n; i++) {
        spots.push({ left: left + i * width, top: r * (R.rowHeight + R.rowGap), width, fit });
      }
    });
  }
  return { scale, width: L.width * scale, height: height * scale, boxHeight: height, row, spots };
}
const KROT_SIDE = (RISO_PANEL_WIDTH - KROT.lineup.width) / 2;

// The time capsule's stage: full while most of the phase is left, half after, low in its last 10
// seconds (the panels: 24 of 30 and 29 of 30 full, 21 of 30 half, 9 low).
export function krotTimer(left: number, total: number): 'full' | 'half' | 'low' {
  if (left <= RISO.lowSeconds) return 'low';
  return left >= total * KROT_FULL ? 'full' : 'half';
}
const KROT_FULL = 0.75;
