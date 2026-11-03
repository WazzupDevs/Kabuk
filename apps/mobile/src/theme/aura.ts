import { BRAND } from './brand';

// The airy look (docs/design/aura, the project owner's decision of 28 Ekim:
// docs/decisions/aura-gorunum.md): soft colour clouds behind every screen, frosted glass cards,
// the tab bar of two-shape icons with a white disc that slides between them, and the motion of the
// film (docs/design/aura/project/hareket.json). Values from docs/design/aura/project/aura.css
// (`.aura`, `.glass`, `.tabbar`, `.night` for the dark scheme).

export type AuraScheme = 'light' | 'dark';

export const AURA = {
  light: {
    ground: '#EFF7F1',
    glass: {
      fill: 'rgba(255, 255, 255, 0.70)',
      edge: 'rgba(255, 255, 255, 0.86)',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
    },
    // GaleriAltMenu: the bar is the glass (--glass-bg), the chosen disc #FFFFFF with
    // --shadow-raised, the other icons --muted.
    tab: {
      fill: 'rgba(255, 255, 255, 0.66)',
      edge: 'rgba(255, 255, 255, 0.86)',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
      disc: '#FFFFFF',
      discShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
      off: '#4A6550',
      // The chosen icon's strong part (skall.css `.tab.on .ci`: --accent); its body is --buzz.
      on: '#0B783D',
    },
  },
  // `.dark.pA`: a flat black ground with no clouds, flat glass #121614 with a 9 % white edge and no
  // shadow; the chosen tab's disc 94 % white, no shadow.
  dark: {
    ground: '#000000',
    glass: {
      fill: '#121614',
      edge: 'rgba(255, 255, 255, 0.09)',
      shadow: '',
    },
    tab: {
      fill: '#121614',
      edge: 'rgba(255, 255, 255, 0.09)',
      shadow: '',
      disc: 'rgba(255, 255, 255, 0.94)',
      discShadow: '',
      off: '#A3AEA8',
      // `.dark .tab.on .ci`: #0B783D on the near-white disc.
      on: '#0B783D',
    },
  },
  // Cards: a frosted pane on the clouds.
  card: { radius: 28, edgeWidth: 1 },
  // The tab bar (Aura v65 GaleriAltMenu → Ölçüler): a glass capsule 64 high, 20 in from each side,
  // 8 inside, five 48 round tabs; the selected one sits on a disc that slides to it. Icons 24, the
  // selected one too. 12 above the bottom safe area.
  tabBar: {
    height: 64,
    inset: 20,
    padding: 8,
    tab: 48,
    icon: 24,
    iconOn: 24,
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
  // A scene (Aura v65 ekran.css `.scene`): a soft green-to-pink ground with a white floor glow at
  // the bottom, where the capsule buddies stand, each with a small shadow under its feet.
  scene: {
    light: {
      top: '#E7F5EA',
      bottom: '#FCF1F7',
      glows: [
        { color: 'rgba(30, 216, 115, 0.40)', cx: '15%', cy: '0%', rx: '90%', ry: '80%' },
        { color: 'rgba(255, 159, 192, 0.45)', cx: '95%', cy: '10%', rx: '80%', ry: '80%' },
        { color: 'rgba(255, 208, 138, 0.45)', cx: '50%', cy: '110%', rx: '70%', ry: '60%' },
      ],
      floor: 'rgba(255, 255, 255, 0.95)',
      shadow: 'rgba(4, 73, 35, 0.24)',
      edge: 'rgba(255, 255, 255, 0.70)',
    },
    dark: {
      top: '#003416',
      bottom: '#2A1636',
      glows: [
        { color: 'rgba(18, 152, 79, 0.45)', cx: '15%', cy: '0%', rx: '90%', ry: '80%' },
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
    { look: 'c:nane e:koyu h:anten', height: 84, right: 64, bottom: 76, phase: 400 },
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
    // U30: Bildirimler's buddies are riso pictures (aura/Peek.tsx → RisoPeek).
    notifications: [],
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
  },
  // Masa bitti's confetti (U41): 8 x 18 pieces in the accent, pink and amber, in the board's 390
  // frame (x, y, turn); 'accent' is the scheme's.
  confetti: [
    [40, 74, -24, 'accent'],
    [92, 46, 30, '#FF4F8B'],
    [300, 58, -38, '#FFB547'],
    [338, 112, 18, 'accent'],
    [196, 34, -8, '#FF4F8B'],
    [24, 150, 40, '#FFB547'],
  ],
  // Game cards arrive frosted, then resolve (docs/design/aura/project/hareket.json → frostedFirst).
  frost: { fill: 'rgba(255, 255, 255, 0.86)', fillDark: 'rgba(18, 22, 20, 0.86)' },
  // The headcount as capsules (ekran.css `.pips`: --accent, --buzz, --signal first, 4 apart); at
  // most `max` drawn. Twelve colours, one a phone, so a full table never repeats one (the owner's
  // call, 2 Kasım, 7.5).
  pips: {
    colors: [
      '#0B783D',
      '#FF4F8B',
      '#FFB547',
      '#8FB82E',
      '#2FA8E0',
      '#FF7A3D',
      '#3CC47C',
      '#9A6B4E',
      '#F2C230',
      '#E8455A',
      '#1FB5A8',
      '#5468FF',
    ],
    w: 6,
    h: 12,
    gap: 4,
    max: 12,
  },
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
  // A card opening over the screen: its content this long after the ground.
  cardOpen: { contentAfterMs: 300 },
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
