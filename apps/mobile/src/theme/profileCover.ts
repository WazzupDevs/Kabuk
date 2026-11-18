import { KIT_TYPE } from './auraKit';
import type { ColorScheme } from './tokens';

// The profile's cover and the anonymous identity's ticket (docs/SPEC_V4.md §4.W, "C · kapak ve
// bilet"). The cover is the person's own picture or, without one, a riso scene: a sky, a sun printed
// a little off in pink, layered hills with small trees and halftone dots; at night a navy sky, a
// moon-coloured sun and dark hills.
export const PROFILE_COVER = {
  // The cover's height under the status bar: another person's band, and the own profile's
  // (shorter, the owner's call, 8 Kasım).
  height: 190,
  ownHeight: 120,
  // The own profile scrolled: the photo and the name glide into the bar over this much past the
  // cover's foot (the owner's call, 8 Kasım); let go part way, the page settles at the nearer end.
  glideExtra: 60,
  // The bar's ground shows over the glide's last 30%.
  barFadeFrom: 0.7,
  // Another person's profile: the band 22 round within the page's sides.
  bandRadius: 22,
  // The face 112 overlapping the cover's foot by half; the name 12 under it.
  faceOverlap: 56,
  nameTop: 12,
  // The fixed bar once the cover is gone: the face 32, 10 beside the name.
  barFace: 32,
  barGap: 10,
  // Profili düzenle's preview: 1.9:1 at 120 across, 14 round.
  previewWidth: 120,
  previewRadius: 14,
  // The scene's own units (it is drawn on a 390 × 190 box and cut to the cover's width).
  scene: { width: 390, height: 190 },
  // The pink print's offset from the sun.
  sunOffset: { x: 6, y: 4 },
  colors: {
    light: {
      sky: '#CFE8EE',
      sun: '#FFC93C',
      print: 'rgba(255, 79, 139, 0.55)',
      dots: 'rgba(3, 27, 11, 0.12)',
      hillFar: '#9BD3AC',
      hillMid: '#3FAE6E',
      hillNear: '#0E8745',
      tree: '#055328',
      trunk: '#3A2A1A',
    },
    dark: {
      sky: '#141C3A',
      sun: '#F2E8C6',
      print: 'rgba(255, 79, 139, 0.35)',
      dots: 'rgba(255, 255, 255, 0.10)',
      hillFar: '#22392E',
      hillMid: '#183024',
      hillNear: '#0F2219',
      tree: '#0A1711',
      trunk: '#06100B',
    },
  } satisfies Record<ColorScheme, Record<string, string>>,
} as const;

// The profile pages (docs/design/iskelet.md → 5.6 and 5.7; the yeni arayüz tuvali's ProfilBaskasi
// and ProfilBen), on the canvas's phone, 390 wide: another person's cover 250 from the screen's top
// (the own: 236), the photo 112 in a 4 ring of the ground's colour. The bar row's centre on the
// canvas is 74: the kit's bar (8 under the status bar, 44 high) puts it there under a 44 status
// bar, so a screen moves the canvas's heights by its own status bar less 44.
export const PROFILE_PAGE = {
  canvasWidth: 390,
  canvasStatus: 44,
  cover: 250,
  face: 124,
  ring: 4,
  ringColor: '#FFFFFF',
  // Another person's (5.6): the cover at half the scroll; the photo shrinks to 0.75 over 60–180 and
  // fades over 120–190; the band comes in over 190–230 and the name into the bar over 230–260
  // (tuval Profil).
  other: {
    speed: 0.5,
    faceShrink: [60, 180] as const,
    faceScale: 0.75,
    faceFade: [120, 190] as const,
    band: [190, 230] as const,
    bar: [230, 260] as const,
  },
  // The own (ProfilBen, ProfilBenKaydir): the page is one flow, the cover (236, its foot 28 round)
  // scrolling with it and the photo (112) over its foot by 60. Scrolled, the band (122 on the board)
  // comes in over 256–316 and the small photo (36, 20 from the left, no ring) with the name (700
  // 17/22, 12 beside the photo) into the bar over 296–330, the settings staying where they are.
  own: {
    cover: 236,
    coverRadius: 28,
    photo: 112,
    photoOver: 60,
    ring: 4,
    band: [225, 275] as const,
    bar: [255, 285] as const,
    barSide: 20,
    barFace: 36,
    barGap: 12,
    // "N arkadaş": the faces 32 (10 over each other, a 2 ring of the button's ground), two at most
    // (`.fr .av`).
    stack: 32,
    stackGap: 2,
    stackStep: 22,
    stackShadow: '0px 2px 6px rgba(3, 27, 11, 0.16)',
    stackMax: 2,
  },
} as const;

// Riso paper (2.5, 5.6): a warm paper with a halftone of small dots, the cover of a profile without
// one and the anonymous ticket's ground.
export const RISO_PAPER = {
  cell: 7,
  dot: 1.1,
  light: { paper: '#FBF7EE', dots: 'rgba(15, 59, 34, 0.12)' },
  dark: { paper: '#1B231E', dots: 'rgba(255, 255, 255, 0.07)' },
} as const;

// The ticket (yeni arayüz tuvali, ProfilBen `.tk`; 16 Kasım, value for value): 128 high (150 at 320 dp
// or the largest text, DarProfilim), 24 round, an edge 2 wide and a pink (violet in the dark) print
// 4 right and 5 down under it; a notch 24 across at the top and the bottom of the perforation (2,
// dashed); the stub 97 with the capsule (80) on its fixed fill (TICKET_TONE.stub, ProfilBen `.tks`)
// under an orange halftone (6 apart, 1.2, centred in its cell), a purple hale behind it
// (CAPSULE_HALE), its parts 4 apart; the words 12 over and under, 14 in at the right (16 at their
// left; 12 and 14 at 320), the nick 4 under the kicker, the note straight under it, the button 10
// under it (34 high, 14 in; at 320 it stands under the ticket, full width). The paper, edge, print
// and inks are the scheme's (TICKET_TONE).
export const TICKET = {
  edgeWidth: 2,
  printX: 4,
  printY: 5,
  radius: 24,
  height: 128,
  heightNarrow: 150,
  notch: 12,
  stub: 97,
  stubGap: 4,
  stubDots: { cell: 6, dot: 1.2 },
  capsule: 80,
  dash: [4, 4] as const,
  dashWidth: 2,
  padX: 14,
  padLeft: 16,
  padXNarrow: 12,
  padLeftNarrow: 14,
  padY: 12,
  nickTop: 4,
  buttonTop: 10,
  button: { height: 34, padX: 14, icon: 16 },
  // At 320 dp: the button under the ticket, 12 below it, 52 high at least.
  buttonBelow: { top: 12, height: 52, icon: 20 },
} as const;

// The board's own faces (ProfilBen `.tkl` 700 11/14 at 1.4 px, `.tkm b` 800 20/24 at -0.4, `.tks span`
// 700 12/16 at 0.2), made of the kit's.
export const TICKET_TYPE = {
  kicker: { ...KIT_TYPE.badge, letterSpacing: 1.4 },
  nick: { ...KIT_TYPE.giftBtn, fontSize: 20, lineHeight: 24, letterSpacing: -0.4 },
  no: { ...KIT_TYPE.badge, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
} as const;

export const TICKET_TONE = {
  light: {
    paper: '#FBF8EE',
    dots: 'rgba(11, 61, 34, 0.10)',
    edge: '#0B3D22',
    print: '#FF4F8B',
    ink: '#031B0B',
    kicker: '#2C5A3E',
    muted: '#4A6550',
    link: '#0B783D',
    dash: 'rgba(11, 61, 34, 0.45)',
    stub: { fill: '#FBD9A8', dots: 'rgba(224, 120, 40, 0.22)' },
    // "Kapsülünü süsle": the ink with a green star (the dark: the near-white with the deep green).
    button: { bg: '#031B0B', fg: '#FFFFFF', star: '#3DDC84' },
  },
  dark: {
    paper: '#101915',
    dots: 'rgba(147, 235, 185, 0.10)',
    edge: '#3DDC84',
    print: '#7B5CFF',
    ink: '#EEF3F0',
    kicker: '#93EBB9',
    muted: 'rgba(238, 243, 240, 0.62)',
    link: '#93EBB9',
    dash: 'rgba(147, 235, 185, 0.45)',
    stub: { fill: '#2A1F45', dots: 'rgba(201, 184, 255, 0.18)' },
    button: { bg: 'rgba(255, 255, 255, 0.94)', fg: '#0B0E0D', star: '#0B783D' },
  },
} as const;
