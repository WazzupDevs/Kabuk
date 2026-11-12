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

// The profile pages (docs/design/iskelet.md → 5.6 and 5.7), on the canvas's phone, 390 wide: the
// cover 230 from the screen's top, a dark fade over its top 110, its lower half fading into the
// ground with a 14 px blurred copy of the picture; the photo 124 in a 4 px white ring, centred at
// (195, 196), the name's centre at (195, 291). The bar row's centre on the canvas is 73: the kit's
// bar (8 under the status bar, 46 high) puts it there under a 42 status bar, so a screen moves the
// canvas's heights by its own status bar less 42 and its widths from the centre by its width / 390.
export const PROFILE_PAGE = {
  canvasWidth: 390,
  canvasStatus: 42,
  cover: 230,
  shade: 110,
  shadeCss: 'linear-gradient(180deg, rgba(3, 27, 11, 0.38) 0%, rgba(3, 27, 11, 0) 100%)',
  footFrom: 0.5,
  footCss: {
    light: 'linear-gradient(180deg, rgba(239, 247, 241, 0) 0%, #EFF7F1 100%)',
    dark: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%)',
  },
  // The blurred copy shows over the foot in these steps, each more opaque (no mask: a seam at its
  // top would show), under the fade.
  blur: 14,
  blurSteps: [0.35, 0.7, 1] as const,
  face: 124,
  ring: 4,
  ringColor: '#FFFFFF',
  faceAt: { x: 195, y: 196 },
  nameAt: { x: 195, y: 291 },
  barAt: 73,
  // Another person's (5.6): the cover at half the scroll; the photo shrinks to 0.75 over 60–180 and
  // fades over 120–190; the name comes into the bar as it reaches it (291 − 73 = 218, over the last
  // 30, the band with it).
  other: {
    speed: 0.5,
    faceShrink: [60, 180] as const,
    faceScale: 0.75,
    faceFade: [120, 190] as const,
    bar: [188, 218] as const,
  },
  // The own (5.7): the upper part moves at -0.35 of the scroll, fades over 120–300 and shrinks to
  // 0.92; the panel (34 round, a handle) reaches the bar's foot at 316, where the photo (124 → 30,
  // its ring 4 → 1.5) and the name (1 → 0.516) arrive in the bar at (152, 73) and (214, 73). The
  // band comes in over the panel's last 60 before the bar.
  own: {
    arrive: 316,
    rise: 0.35,
    riseFade: [120, 300] as const,
    riseScale: 0.92,
    face: 30,
    ring: 1.5,
    faceTo: { x: 152, y: 73 },
    nameScale: 0.516,
    nameTo: { x: 214, y: 73 },
    band: [256, 316] as const,
    panelRadius: 34,
    // "N arkadaş": the faces 28 over each other, 2.5 of the button's ground round each (2.4).
    stack: 28,
    stackGap: 2.5,
    stackShadow: '0px 2px 6px rgba(3, 27, 11, 0.16)',
    stackMax: 3,
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

// The ticket: paper with a dark-green edge and a pink print a little off under it, a notch at the
// top and the bottom of the dashed perforation; the stub 96 with the capsule on its ground.
export const TICKET = {
  paper: '#FBF7EE',
  edge: '#0F3B22',
  edgeWidth: 2,
  print: '#FF4F8B',
  printOffset: 3,
  ink: '#031B0B',
  muted: '#4A6550',
  link: '#0B783D',
  radius: 18,
  notch: 10,
  stub: 96,
  capsule: 64,
  dash: [4, 4] as const,
  padX: 14,
  padY: 14,
  gap: 4,
  buttonTop: 10,
} as const;
