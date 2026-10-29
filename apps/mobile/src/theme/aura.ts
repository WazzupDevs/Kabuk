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
    // A little lower than the canvas's 70 (the owner's call, 29 Ekim); the discs keep their size.
    height: 64,
    inset: 18,
    padding: 6,
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
      // aura.css `.scene`: three soft glows over the violet-to-pink ground.
      glows: [
        { color: 'rgba(185, 166, 255, 0.55)', cx: '15%', cy: '0%', rx: '90%', ry: '80%' },
        { color: 'rgba(255, 159, 192, 0.45)', cx: '95%', cy: '10%', rx: '80%', ry: '80%' },
        { color: 'rgba(255, 208, 138, 0.45)', cx: '50%', cy: '110%', rx: '70%', ry: '60%' },
      ],
      floor: 'rgba(255, 255, 255, 0.95)',
      shadow: 'rgba(40, 25, 110, 0.24)',
      edge: 'rgba(255, 255, 255, 0.70)',
    },
    dark: {
      top: '#221A4C',
      bottom: '#2A1636',
      glows: [
        { color: 'rgba(123, 92, 255, 0.45)', cx: '15%', cy: '0%', rx: '90%', ry: '80%' },
        { color: 'rgba(255, 79, 139, 0.30)', cx: '95%', cy: '10%', rx: '80%', ry: '80%' },
        { color: 'rgba(255, 181, 71, 0.20)', cx: '50%', cy: '110%', rx: '70%', ry: '60%' },
      ],
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
    // Masa kur (docs/design/aura → MasaKur): the chosen table's picture, one buddy behind it, two
    // in front.
    create: {
      frame: 350,
      height: 214,
      disk: { x: 109, bottom: 26, size: 132, radius: 40 },
      cast: [
        { look: 'c:nane e:koyu h:anten', x: 132, bottom: 112, height: 79, behind: true },
        { look: 'c:pembe e:klasik h:korsan f:gozbandi', x: 18, bottom: -14, height: 136 },
        { look: 'c:gok e:klasik h:parti', x: 236, bottom: -10, height: 121 },
      ],
    },
    // Masa bitti (docs/design/aura → MasaBitti): the table's picture and three buddies in front;
    // the profiled people's faces at its sides (TableEnd).
    end: {
      frame: 390,
      height: 320,
      disk: { x: 135, bottom: 74, size: 120, radius: 38 },
      cast: [
        { look: 'c:gok e:klasik h:parti', x: 20, bottom: -16, height: 144 },
        { look: 'c:turkuaz e:klasik h:kovboy', x: 260, bottom: -16, height: 144 },
        { look: 'c:pembe e:klasik h:korsan f:gozbandi', x: 139, bottom: -26, height: 147 },
      ],
    },
    // The first screen (docs/design/aura → Main): a table on a disk, three buddies behind it, four
    // in front.
    welcome: {
      frame: 350,
      height: 400,
      disk: { x: 97, bottom: 66, size: 156 },
      cast: [
        { look: 'c:hardal e:klasik h:sihirbaz', x: 50, bottom: 176, height: 95, behind: true },
        { look: 'c:krem e:koyu h:hale m:gulumse', x: 228, bottom: 176, height: 95, behind: true },
        { look: 'c:nane e:koyu h:anten', x: 139, bottom: 206, height: 95, behind: true },
        { look: 'c:gok e:klasik h:parti', x: -10, bottom: 62, height: 126 },
        { look: 'c:pembe e:klasik h:kedi', x: 264, bottom: 62, height: 126 },
        { look: 'c:pembe e:koyu h:kulaklik', x: 34, bottom: -18, height: 155 },
        { look: 'c:turkuaz e:klasik h:kovboy', x: 198, bottom: -18, height: 155 },
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
  // Buddies peeking over a card's top edge (aura.css `.behind > .peek`: 58 above it, 120 high, the
  // card hiding their lower half), in a 350 wide frame: x, how far down they start, height.
  peek: {
    up: 58,
    height: 120,
    checkin: [
      { look: 'c:turkuaz e:klasik h:kovboy', x: 26, top: 0, height: 110 },
      { look: 'c:pembe e:koyu h:kulaklik', x: 146, top: -14, height: 110 },
      { look: 'c:gok e:klasik f:yuvarlak', x: 260, top: 4, height: 110 },
    ],
    notifications: [
      { look: 'c:yesil e:klasik h:papatya m:gulumse', x: 20, top: 0, height: 110 },
      { look: 'c:krem e:koyu h:tavsan', x: 256, top: 6, height: 105 },
    ],
    request: [
      { look: 'c:pembe e:koyu h:kulaklik', x: 18, top: 2, height: 121 },
      { look: 'c:mor e:klasik f:maske', x: 128, top: -12, height: 121 },
      { look: 'c:pembe e:klasik h:korsan f:gozbandi', x: 236, top: 2, height: 121 },
    ],
    phone: [{ look: 'c:gok e:klasik f:yuvarlak', x: 226, top: 0, height: 110 }],
    code: [
      { look: 'c:hardal e:klasik h:sihirbaz', x: 12, top: 0, height: 110 },
      { look: 'c:pembe e:klasik h:kedi', x: 252, top: 6, height: 102 },
    ],
  },
  // A buddy talking in a scene under a step's field (docs/design/aura → Telefon, Kod).
  say: {
    minHeight: 168,
    buddy: 126,
  },
  // Each game's card (docs/design/aura → Masa: Kinshi violet, Krot pink; the others alike): its
  // ground, the glow at its foot, its shadow, its line's colour and its buddy.
  gameCards: {
    kinshi: {
      ground: 'radial-gradient(120% 90% at 20% 10%, #6A50E6 0%, #2A2068 55%, #120F2C 100%)',
      glow: 'rgba(255, 181, 71, 0.35)',
      shadow: '0px 18px 36px rgba(33, 26, 82, 0.30)',
      sub: '#DCD6FF',
      buddy: 'c:mor e:klasik f:maske',
    },
    krot: {
      ground: 'radial-gradient(120% 90% at 80% 10%, #E8467F 0%, #5A1A45 55%, #1A0C20 100%)',
      glow: 'rgba(255, 255, 255, 0.18)',
      shadow: '0px 18px 36px rgba(90, 26, 69, 0.28)',
      sub: '#FFD6E5',
      buddy: 'c:pembe e:koyu h:kulaklik',
    },
    vampir: {
      ground: 'radial-gradient(120% 90% at 20% 10%, #D2453A 0%, #5A1414 55%, #1C0708 100%)',
      glow: 'rgba(255, 181, 71, 0.30)',
      shadow: '0px 18px 36px rgba(90, 20, 20, 0.28)',
      sub: '#FFD3CC',
      buddy: 'c:hardal e:klasik h:sihirbaz',
    },
    signum: {
      ground: 'radial-gradient(120% 90% at 80% 10%, #3E8BD6 0%, #15305E 55%, #08132A 100%)',
      glow: 'rgba(255, 255, 255, 0.18)',
      shadow: '0px 18px 36px rgba(21, 48, 94, 0.28)',
      sub: '#D3E6FF',
      buddy: 'c:gok e:klasik f:yuvarlak',
    },
    sprengja: {
      ground: 'radial-gradient(120% 90% at 20% 10%, #F09A1F 0%, #6A3810 55%, #1E1206 100%)',
      glow: 'rgba(255, 79, 139, 0.30)',
      shadow: '0px 18px 36px rgba(106, 56, 16, 0.28)',
      sub: '#FFE2B8',
      buddy: 'c:pembe e:klasik h:korsan f:gozbandi',
    },
    kaupholl: {
      ground: 'radial-gradient(120% 90% at 80% 10%, #2FA866 0%, #0F4A2C 55%, #061A10 100%)',
      glow: 'rgba(255, 181, 71, 0.30)',
      shadow: '0px 18px 36px rgba(15, 74, 44, 0.28)',
      sub: '#CFF2DE',
      buddy: 'c:turkuaz e:klasik h:kovboy',
    },
  },
  // Masa bitti's confetti: capsules in the mark's colours, in the board's 390 frame (x, y, turn).
  confetti: [
    [40, 74, -24, '#7B5CFF'],
    [92, 46, 30, '#FF4F8B'],
    [300, 58, -38, '#FFB547'],
    [338, 112, 18, '#7B5CFF'],
    [196, 34, -8, '#FF4F8B'],
    [24, 150, 40, '#FFB547'],
  ],
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
