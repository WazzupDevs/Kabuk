// Design tokens of the app's theme (src/theme/theme.ts). Pure data:
// no React Native import, so the contrast tests run in vitest. Screens never read these values
// directly; they use the kit components and the semantic NativeWind classes (tailwind.config.js).

export type ColorScheme = 'light' | 'dark';

// Semantic colours. The NativeWind class name is the key in kebab case (`surface2` → `bg-surface2`,
// `onAccent` → `text-on-accent`); see COLOR_CLASS below.
export type Palette = {
  canvas: string; // screen background
  surface: string; // cards, sheets, tab bar
  surface2: string; // quiet fills: segments, badges, role note, timer track
  raised: string; // lifted off the canvas and off cards: secondary buttons, fields, others' bubbles
  text: string;
  muted: string; // secondary text
  accent: string;
  onAccent: string;
  // The second accent (skall: `accent-2`): profile faces (initials), unread counts, the "profilli"
  // tag. Not an action colour.
  violet: string;
  onViolet: string;
  read: string; // DM: the double tick of a read message
  border: string; // the outline colour (cards, controls)
  divider: string; // hairlines: list rows, trust screens
  danger: string;
  onDanger: string;
  success: string;
  onSuccess: string;
  // "Tanışalım mı?" highlight. Leaves with step 23.3 (docs/SPEC_V3.md §23.G); the skall system has
  // no value of its own for it.
  signal: string;
  onSignal: string;
  calm: string; // Keşfet buckets and the event tag
  onCalm: string;
  lively: string;
  onLively: string;
  buzz: string;
  onBuzz: string;
  event: string;
  onEvent: string;
  scrim: string; // behind sheets
  // The one featured card per screen (Mekan: "Masanın adı"): ink in the light scheme. Its text is
  // `onFeature`, secondary text `featureMuted`.
  feature: string;
  onFeature: string;
  featureMuted: string;
  // Where the two capsules of the mark meet: orange in the light scheme, white in the dark one.
  overlap: string;
  // The focus ring (the code box that takes the next digit).
  focus: string;
};

export const PALETTE_KEYS = [
  'canvas',
  'surface',
  'surface2',
  'raised',
  'text',
  'muted',
  'accent',
  'onAccent',
  'violet',
  'onViolet',
  'read',
  'border',
  'divider',
  'danger',
  'onDanger',
  'success',
  'onSuccess',
  'signal',
  'onSignal',
  'calm',
  'onCalm',
  'lively',
  'onLively',
  'buzz',
  'onBuzz',
  'event',
  'onEvent',
  'scrim',
  'feature',
  'onFeature',
  'featureMuted',
  'overlap',
  'focus',
] as const satisfies readonly (keyof Palette)[];

export type PaletteKey = (typeof PALETTE_KEYS)[number];

// `onAccent` → `on-accent`: the Tailwind colour name and the CSS variable (`--color-on-accent`).
export function colorClass(key: PaletteKey): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

// Font family names as registered with expo-font (the @expo-google-fonts export names). Only these
// four weights of Plus Jakarta Sans are bundled (src/theme/fonts.ts maps each to its file), the ones
// v45 loads; no other weight is added.
export type FontName =
  | 'PlusJakartaSans_500Medium'
  | 'PlusJakartaSans_600SemiBold'
  | 'PlusJakartaSans_700Bold'
  | 'PlusJakartaSans_800ExtraBold';

export type FontSet = {
  display: FontName; // hero, display, alias, word, score
  displayBold: FontName; // title, heading, mark, gameName, initials
  regular: FontName; // body, subtitle, fine
  semibold: FontName; // bodyStrong only
  bold: FontName; // eyebrow, label, buttons, tag, caption, overline
};

// Where a shadow is drawn. Values are CSS `box-shadow` strings (React Native `boxShadow`); `null`
// draws none. Soft only: skall has no outlined, hard-shadowed "3D" look.
export type ShadowSet = {
  card: string | null; // every card
  raised: string | null; // others' bubbles, the selected segment of a switch
  sheet: string | null; // bottom sheets
  tabBar: string | null; // the floating tab bar
  focus: string | null; // the focus ring: a ground gap, then `focus`
};

export type Shape = {
  // Containers have continuous corners (card `lg`, sheet and tab bar `xl`, game card `md`); a
  // bubble's corner towards its author is `xs`; everything interactive is a capsule (`pill`).
  radius: { xs: number; sm: number; md: number; lg: number; xl: number; pill: number };
  // Border widths: cards (0 = none), rings (an avatar's unread ring, a selected choice, the second
  // table's face), controls (inputs, segments, switches), tags, the hairline (list rows, trust
  // screens) and the active Mekan tab's ring.
  stroke: {
    card: number;
    feature: number;
    control: number;
    tag: number;
    hairline: number;
    venueRing: number;
  };
  // The describing team in Tabu: an accent ring or a filled sticker.
  selectedTeam: 'ring' | 'fill';
  screenPadding: number;
};

export type TypeStyle = {
  font: keyof FontSet;
  size: number;
  lineHeight: number;
  letterSpacing?: number;
  // In capitals, written by Text the Turkish way (upperTr in @shared/trText.ts), never by textTransform.
  uppercase?: boolean;
};

export type TypeVariant =
  | 'display' // screen title (h1)
  | 'title' // sheet title (h2)
  | 'heading' // section title (h3)
  | 'gameName' // a game's name on its card (two lines fit a 320 dp screen's half)
  | 'alias' // table alias, profile name
  | 'word' // the Tabu card word
  | 'forbidden' // the Tabu card's forbidden words
  | 'score' // a Tabu team score
  | 'hero' // shareable moments: "Süre bitti!", a reveal (read in a screen recording)
  | 'mark' // a large number or mark: headcount choice
  | 'body'
  | 'bodyStrong'
  | 'subtitle' // under the screen title
  | 'eyebrow' // above the screen title
  | 'label' // form and section labels
  | 'fine' // explanations, hints
  | 'button'
  | 'buttonLarge' // the Tabu judge buttons
  | 'buttonDetail'
  | 'buttonSmall' // a small button in a header ("Mekandan ayrıl", "Odayı bitir")
  | 'tag'
  | 'caption' // tab labels, small counters
  | 'overline' // "Söylenmeyecekler"
  | 'signalMark' // the emoji of the "Tanışalım mı?" signal
  | 'gameButton' // the 56 high game button (v43: .tbtn)
  | 'gameButtonLarge' // the grab button, "Kaptım" (v43: .bx-buzz)
  | 'clock' // a timed turn's seconds next to the timer bar (v43: .tg-timer b)
  | 'countIn' // "3", "2", "1" (v43: .tg-cd)
  | 'countInGo' // "Başla" after them
  | 'toast'; // the short notice at the top of a game (v43: .tg-flash)

export type Typography = Record<TypeVariant, TypeStyle>;

export type ThemeDefinition = {
  // Scheme used when the viewer has not picked one in the test picker, and in production.
  defaultScheme: ColorScheme | 'system';
  palettes: Record<ColorScheme, Palette>;
  fonts: FontSet;
  shape: Shape;
  // Light: soft shadows. Dark: the surface tone carries the separation.
  shadows: Record<ColorScheme, ShadowSet>;
  typography: Typography;
};

// Spacing scale (4 · 8 · 12 · 16 · 24 · 32, plus the in-between steps
// the mockups use). tailwind.config.js exposes the same keys.
export const SPACING = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
} as const;

// The tab bar: the selected tab's icon is solid and in one colour, the others are muted lines.
// contrast.test.ts checks it against the bar and the icon's halo. The Mekan tab is the mark on an
// ink square (src/components/VenueTabIcon.tsx), the same in both schemes.
export const TAB_TONE = 'accent' as const satisfies PaletteKey;

// Opacities: the scrim behind a sheet, a pressed text button. A disabled button is not faded: it
// takes a neutral fill (theme/buttonFill.ts).
export const OPACITY = { scrim: 0.5, pressed: 0.7 } as const;

// Icon sizes (Ionicons).
export const ICON = { xs: 12, sm: 16, md: 20, lg: 24, xl: 28 } as const;

// Minimum touch target (WCAG 2.5.8 is 24; the mockups and Android guidance use 44–48).
export const TOUCH = { min: 44, button: 48, tab: 56, large: 64 } as const;

// Narrower than this (in dp, times the font scale: large text needs the room too) a header gives
// its text buttons up for icons (the room's "Odayı bitir" at 320 dp).
export const NARROW_SCREEN = 360;

// Keşfet map pins, drawn by MapLibre GL layers (sizes in points). Placeholder until the design
// session's pin image; colours come from the palette. MAP_FONTS must be font stacks served by the
// map style's glyph server (OpenFreeMap "liberty" serves Noto Sans), not the app's fonts.
export const MAP_PIN = {
  radius: 16,
  // The selected venue grows and gets a hard shadow (canvas: Aşama 5 · Harita işaretçileri).
  selectedRadius: 22,
  shadow: 3,
  // The kind glyph inside the circle (24 pt in its image): 18 pt, 24 when selected.
  glyphScale: 0.75,
  selectedGlyphScale: 1,
  ring: 3,
  outline: 2,
  eventDot: 6,
  eventOffset: 12,
  clusterRadius: [18, 22, 26],
  clusterSteps: [10, 30],
  labelSize: 12,
  countSize: 14,
  labelOffset: 1.4,
  labelHalo: 2,
} as const;
export const MAP_FONTS = { regular: ['Noto Sans Regular'], bold: ['Noto Sans Bold'] } as const;

// The skall type scale in Plus Jakarta Sans: headings 800 and 700, body 500, strong 600, labels 700.
export function baseTypography(overrides: Partial<Typography> = {}): Typography {
  return {
    display: { font: 'display', size: 28, lineHeight: 34, letterSpacing: -0.4 },
    title: { font: 'displayBold', size: 22, lineHeight: 28, letterSpacing: -0.2 },
    heading: { font: 'displayBold', size: 18, lineHeight: 24 },
    gameName: { font: 'displayBold', size: 16, lineHeight: 20 },
    alias: { font: 'display', size: 26, lineHeight: 32, letterSpacing: -0.3 },
    word: { font: 'display', size: 38, lineHeight: 44, letterSpacing: -0.6 },
    forbidden: { font: 'semibold', size: 18, lineHeight: 24 },
    score: { font: 'display', size: 30, lineHeight: 34 },
    hero: { font: 'display', size: 52, lineHeight: 56, letterSpacing: -1 },
    mark: { font: 'displayBold', size: 20, lineHeight: 24 },
    body: { font: 'regular', size: 16, lineHeight: 24 },
    bodyStrong: { font: 'semibold', size: 16, lineHeight: 24 },
    subtitle: { font: 'regular', size: 14, lineHeight: 20 },
    eyebrow: { font: 'bold', size: 13, lineHeight: 18, letterSpacing: 0.2 },
    label: { font: 'bold', size: 13, lineHeight: 18 },
    fine: { font: 'regular', size: 13, lineHeight: 18 },
    button: { font: 'bold', size: 16, lineHeight: 20 },
    buttonLarge: { font: 'bold', size: 17, lineHeight: 22 },
    buttonDetail: { font: 'semibold', size: 16, lineHeight: 20 },
    buttonSmall: { font: 'bold', size: 14, lineHeight: 18 },
    tag: { font: 'bold', size: 13, lineHeight: 16 },
    caption: { font: 'bold', size: 11, lineHeight: 14 },
    overline: { font: 'bold', size: 12, lineHeight: 16, letterSpacing: 1, uppercase: true },
    signalMark: { font: 'regular', size: 104, lineHeight: 126 },
    gameButton: { font: 'display', size: 16, lineHeight: 20 },
    gameButtonLarge: { font: 'display', size: 20, lineHeight: 24 },
    clock: { font: 'display', size: 40, lineHeight: 44, letterSpacing: -1 },
    countIn: { font: 'display', size: 110, lineHeight: 120, letterSpacing: -4 },
    countInGo: { font: 'display', size: 60, lineHeight: 66, letterSpacing: -0.5 },
    toast: { font: 'display', size: 14, lineHeight: 18 },
    ...overrides,
  };
}
