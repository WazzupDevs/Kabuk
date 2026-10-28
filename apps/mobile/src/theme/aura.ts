import { BRAND } from './brand';

// The airy look (docs/design/aura, the project owner's decision of 28 Ekim:
// docs/decisions/aura-gorunum.md): soft colour clouds behind every screen, frosted glass cards,
// the tab bar of two-shape icons with a white disc that slides between them, and the motion of the
// film (docs/design/aura/project/hareket.json). Values from docs/design/aura/project/aura.css
// (`.aura`, `.glass`, `.tabbar`, `.night` for the dark scheme).

export type AuraScheme = 'light' | 'dark';

// One colour cloud: an ellipse (`w` × `h`) blurred by 64 px, placed from a corner of a 390 wide
// screen (x scales with the width, y is from the top or the bottom). It drifts `dx`, `dy` around
// its place, once every `ms` each way.
export type AuraBlob = {
  color: string;
  w: number;
  h: number;
  side: 'left' | 'right';
  x: number;
  edge: 'top' | 'bottom';
  y: number;
  dx: number;
  dy: number;
  ms: number;
};

const CLOUD_BLUR = 64;

const cloud = (
  color: string,
  w: number,
  h: number,
  side: AuraBlob['side'],
  x: number,
  edge: AuraBlob['edge'],
  y: number,
  dx: number,
  dy: number,
  ms: number,
): AuraBlob => ({ color, w, h, side, x, edge, y, dx, dy, ms });

export const AURA = {
  // The width the clouds' places are measured on (the canvas's phone).
  frame: 390,
  blur: CLOUD_BLUR,
  light: {
    ground: '#F7F5FD',
    blobs: [
      cloud('rgba(123, 92, 255, 0.40)', 360, 300, 'left', -110, 'top', -70, 30, 22, 11600),
      cloud('rgba(255, 79, 139, 0.30)', 300, 280, 'right', -120, 'top', 30, -26, 30, 14400),
      cloud('rgba(255, 181, 71, 0.24)', 280, 210, 'left', 80, 'top', 220, 24, -18, 10400),
      cloud('rgba(123, 92, 255, 0.20)', 420, 320, 'left', -60, 'bottom', -150, -30, 20, 17000),
      cloud('rgba(255, 79, 139, 0.16)', 260, 260, 'right', -90, 'bottom', 120, 22, 26, 12900),
    ],
    glass: {
      fill: 'rgba(255, 255, 255, 0.70)',
      edge: 'rgba(255, 255, 255, 0.86)',
      shadow: '0px 18px 44px rgba(54, 36, 140, 0.10), 0px 2px 6px rgba(54, 36, 140, 0.05)',
    },
    tab: {
      fill: 'rgba(255, 255, 255, 0.66)',
      edge: 'rgba(255, 255, 255, 0.86)',
      shadow: '0px 18px 44px rgba(54, 36, 140, 0.14), 0px 2px 6px rgba(54, 36, 140, 0.06)',
      disc: 'rgba(255, 255, 255, 0.96)',
      discShadow: '0px 6px 16px rgba(54, 36, 140, 0.13)',
      off: '#5E5878',
    },
  },
  dark: {
    ground: '#0D0B1E',
    blobs: [
      cloud('rgba(123, 92, 255, 0.55)', 360, 300, 'left', -110, 'top', -70, 30, 22, 11600),
      cloud('rgba(255, 79, 139, 0.34)', 300, 280, 'right', -120, 'top', 30, -26, 30, 14400),
      cloud('rgba(255, 181, 71, 0.16)', 280, 210, 'left', 80, 'top', 220, 24, -18, 10400),
      cloud('rgba(90, 58, 230, 0.34)', 420, 320, 'left', -60, 'bottom', -150, -30, 20, 17000),
      cloud('rgba(255, 79, 139, 0.16)', 260, 260, 'right', -90, 'bottom', 120, 22, 26, 12900),
    ],
    glass: {
      fill: 'rgba(36, 30, 74, 0.66)',
      edge: 'rgba(255, 255, 255, 0.14)',
      shadow: '0px 18px 44px rgba(0, 0, 0, 0.35)',
    },
    tab: {
      fill: 'rgba(36, 30, 74, 0.72)',
      edge: 'rgba(255, 255, 255, 0.14)',
      shadow: '0px 18px 44px rgba(0, 0, 0, 0.40)',
      disc: 'rgba(255, 255, 255, 0.94)',
      discShadow: '0px 6px 16px rgba(0, 0, 0, 0.30)',
      off: '#C9C3E6',
    },
  },
  // Cards: a frosted pane on the clouds.
  card: { radius: 28, radiusSm: 20, edgeWidth: 1 },
  // The tab bar: a glass capsule 18 in from each side, five round tabs; the selected one sits on a
  // white disc that slides to it. Icons are 26, the selected one 30 (aura.css `.tab .ti`).
  tabBar: {
    height: 70,
    inset: 18,
    padding: 9,
    tab: 52,
    icon: 26,
    iconOn: 30,
    bottom: 12,
    // The disc squashes a little while it is stretched (at most 10 % at 60 px wider).
    squash: 0.1,
    stretchFull: 60,
    dot: 9,
    dotTop: 10,
    dotRight: 11,
  },
  // The tab icons' colours when selected: the mark's (purple back, pink front, amber overlap).
  mark: { back: BRAND.purple, front: BRAND.pink, overlap: BRAND.orange, light: BRAND.white },
  // A scene (aura.css `.scene`): a soft violet-to-pink ground with a white floor glow at the bottom,
  // where the capsule buddies stand, each with a small shadow under its feet.
  scene: {
    light: {
      top: '#F3EEFF',
      bottom: '#FCF1F7',
      glowA: 'rgba(123, 92, 255, 0.30)',
      glowB: 'rgba(255, 79, 139, 0.22)',
      floor: 'rgba(255, 255, 255, 0.95)',
      shadow: 'rgba(40, 25, 110, 0.24)',
      edge: 'rgba(255, 255, 255, 0.70)',
    },
    dark: {
      top: '#221A4C',
      bottom: '#2A1636',
      glowA: 'rgba(123, 92, 255, 0.40)',
      glowB: 'rgba(255, 79, 139, 0.26)',
      floor: 'rgba(255, 255, 255, 0.16)',
      shadow: 'rgba(0, 0, 0, 0.45)',
      edge: 'rgba(255, 255, 255, 0.12)',
    },
    radius: 26,
    floorHeight: 96,
  },
  // The hero card's crew (aura.css, Mekan): three buddies at the right, the far one smaller and
  // higher. Heights in px on a 196 high scene; `right` and `bottom` from its corner.
  crew: [
    { look: 'c:nane e:koyu h:anten', height: 84, right: 64, bottom: 70, phase: 400 },
    { look: 'c:pembe e:koyu h:kulaklik', height: 136, right: 86, bottom: -14, phase: 1100 },
    { look: 'c:mor e:klasik f:maske', height: 121, right: -12, bottom: -6, phase: 1900 },
  ],
  heroHeight: 196,
  // Gatherings: buddies standing around something in a scene (docs/design/aura → Keşfet, Mekan
  // sayfası, Mesajlar), as drawn on a scene `frame` wide and `height` high; `x` is from the left
  // (or from the right with `fromRight`), `bottom` from the scene's floor. `disk` is the round thing
  // in the middle (a venue's mark), where there is one.
  gatherings: {
    explore: {
      frame: 334,
      height: 168,
      disk: { x: 132, bottom: 14, size: 94 },
      cast: [
        { look: 'c:nane e:koyu h:anten', x: 150, bottom: 54, height: 76, behind: true },
        { look: 'c:mercan e:klasik h:korsan', x: 76, bottom: -12, height: 100 },
        { look: 'c:pembe e:klasik h:kedi', x: 206, bottom: -12, height: 100 },
        { look: 'c:gok e:klasik h:parti', x: 10, bottom: -6, height: 84 },
        { look: 'c:turkuaz e:klasik h:kovboy', x: 274, bottom: -6, height: 84 },
      ],
    },
    venue: {
      frame: 390,
      height: 300,
      disk: { x: 128, bottom: 34, size: 134 },
      cast: [
        { look: 'c:hardal e:klasik h:sihirbaz', x: 116, bottom: 120, height: 81, behind: true },
        { look: 'c:krem e:koyu h:hale m:gulumse', x: 212, bottom: 120, height: 81, behind: true },
        { look: 'c:pembe e:klasik h:korsan f:gozbandi', x: 40, bottom: -14, height: 126 },
        { look: 'c:gok e:klasik h:parti', x: 254, bottom: -14, height: 126 },
        { look: 'c:gok e:klasik f:yuvarlak', x: -16, bottom: 30, height: 92 },
        { look: 'c:krem e:koyu h:tavsan', x: 334, bottom: 30, height: 92 },
      ],
    },
    messages: {
      frame: 350,
      height: 112,
      disk: null,
      cast: [
        { look: 'c:yesil e:klasik h:papatya m:gulumse', x: 218, bottom: -14, height: 92 },
        { look: 'c:krem e:koyu h:tavsan', x: 282, bottom: -10, height: 84 },
      ],
    },
  },
  // Game cards arrive frosted, then resolve (docs/design/aura/project/hareket.json → frostedFirst).
  frost: { fill: 'rgba(255, 255, 255, 0.86)', fillDark: 'rgba(36, 30, 74, 0.86)' },
  // The table's scene (docs/design/aura → Masa): the table in the middle, the people around it.
  // Seats as fractions of the scene (x of its width, y of its height), the first ones nearest the
  // table's sides; anonymous people stand as capsule buddies, profiled ones sit as photos.
  table: {
    height: 212,
    tableTop: 28,
    ring: 4,
    face: 48,
    buddy: 78,
    seats: [
      [0.14, 0.34],
      [0.86, 0.34],
      [0.14, 0.78],
      [0.86, 0.78],
      [0.36, 0.86],
      [0.64, 0.86],
      [0.3, 0.12],
      [0.7, 0.12],
    ],
    // Drawn at most this many; the rest as "+n".
    max: 8,
  },
  // The headcount as capsules (aura.css `.pips`), colours in turn; at most `max` drawn.
  pips: { colors: ['#9C86FF', '#FF7EA8', '#FFB547'], w: 6, h: 12, gap: 3, max: 8 },
  // An SVG mask: white shows, black hides (the outlined icons' gap).
  mask: { show: '#FFFFFF', hide: '#000000' },
} as const;

// The motion standard (docs/design/aura/project/hareket.json, played by the film
// docs/design/aura/skall-hareket.mp4): springs in Reanimated's model, curves as cubic-bezier.
export const MOTION = {
  springs: {
    morph: { stiffness: 170, damping: 26, mass: 1 },
    morphBack: { stiffness: 260, damping: 30, mass: 1 },
    pop: { stiffness: 260, damping: 17, mass: 1 },
    press: { stiffness: 500, damping: 22, mass: 1 },
    tabLead: { stiffness: 420, damping: 30, mass: 1 },
    tabTrail: { stiffness: 200, damping: 24, mass: 1 },
  },
  curves: {
    arrive: [0.2, 0.9, 0.25, 1],
    leave: [0.4, 0, 1, 1],
    swap: [0.4, 0, 0.2, 1],
  },
  dissolve: { blur: 12, rise: 12, fromScale: 0.97, inMs: 450, outMs: 220 },
  stagger: { row: 60, part: 70, max: 8 },
  tab: {
    iconPopFrom: 0.5,
    iconInDelay: 60,
    iconFadeMs: 140,
    oldIconOutMs: 160,
    offInMs: 200,
    offInDelay: 80,
  },
  press: { scale: 0.96, downMs: 100 },
  idle: { floatPx: 4, floatMs: 1300, blinkMs: 160, blinkEveryMs: [4000, 6000], blinkClosed: 0.12 },
} as const;

export type Bezier = readonly [number, number, number, number];
