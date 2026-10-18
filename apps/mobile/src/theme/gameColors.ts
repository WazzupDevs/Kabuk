import { contrastRatio, withAlpha } from './contrast';
import { mix } from './feature';
import type { ColorScheme } from './tokens';

// The game colours (v43 report §5, v44 report §1; docs/SPEC_V4.md §4.C, step 4.2). Pure data, so
// contrast.test.ts checks them; the game screens of step 4.6 draw from here. White text sits on
// every ground, theme and button fill at 4.5:1 or more; Pas and Doğru carry ink text.

// Text on a game ground, a theme, "Yasak!" and the badge; text on Pas and Doğru.
export const ON_GAME = '#FFFFFF';
export const ON_JUDGE = '#14112B';

export const TEAM_COLORS = { purple: '#6A47F5', pink: '#D6336C' } as const;
export type Team = keyof typeof TEAM_COLORS;

// Kapsül Anlat's three buttons: Pas, Doğru (ink text) and the rival's "Yasak!" (white text, K-5).
export const JUDGE_COLORS = { pass: '#FFD23F', correct: '#34D27F', forbidden: '#C8331F' } as const;

// İbre's scoring zones, 2, 3 and 4 points.
export const NEEDLE_ZONES = ['#FFD86B', '#FFA94D', '#FF4F8B'] as const;

// Sohbet kartları' themes. Isınma darkened to #B4481A for 4.5:1 (K-24).
export const CHAT_THEMES = {
  warmUp: '#B4481A', // Isınma
  campus: '#6A47F5', // Kampüs
  deep: '#2F2A78', // Derin
  either: '#187A48', // Ya da
} as const;

// The unread badge (the bell on Mesajlar, step 4.7).
export const BADGE = '#C51F62';

// A timed turn's last seconds (gameMotion.ts → LOW_SECONDS): the bar and the ring fill orange (the
// logo's overlap colour), the clock's number turns pale orange.
export const LOW_TIME = { fill: '#FFB547', text: '#FFE2B3' } as const;

// White marks on a ground at reduced strength: the timer bar's track, the ring's track, the side
// button's outline (v43: .tg-bar, .bx-ring .bg, .tbtn.ghost).
export const ON_GAME_ALPHA = { track: 0.22, ring: 0.18, outline: 0.6 } as const;

// Shadows on a game ground (v43): Pas and Doğru, the "Yasak!" button, the toast.
export const GAME_SHADOW = {
  button: '0px 8px 18px rgba(20, 17, 43, 0.18)',
  forbidden: '0px 10px 22px rgba(20, 17, 43, 0.25)',
  toast: '0px 12px 26px rgba(20, 17, 43, 0.25)',
} as const;

// Şarkıda Geçsin's record (v43: .sx-rec): grooves in two dark tones, a label in the logo's orange
// and pink, a white hole. The equaliser beside the singer (v43: .sx-eq) in four bars.
export const VINYL = {
  disc: '#1B1640',
  groove: '#2A2360',
  label: ['#FFB547', '#FF4F8B'],
  hole: '#FFFFFF',
} as const;
export const EQUALISER_COLORS = ['#FFB547', '#FF9DC0', '#FFB547', '#C9BAFF'] as const;

// İbre's cover over the dial until the result (v43: #nxst): pale stripes.
export const DIAL_COVER = ['#EEE9FF', '#E3DBFF'] as const;

// The winners' confetti (v43 → conf()).
export const CONFETTI_COLORS = ['#FFFFFF', '#FFB547', '#FF9DC0', '#C9BAFF'] as const;

// A game screen's ground: a vertical gradient (top to bottom), and the fill of the translucent chips
// and ghost buttons that sit on it. White chips (18 %) read on the deep grounds; on the light
// scheme's bright grounds white text over a white chip falls under 4.5:1, so those take a dark one
// (ink, 24 %): v44's Harf Kapmaca fix, kept wherever it is needed (K-25).
export type GameGround = { top: string; bottom: string; chip: 'white' | 'ink' };
export const CHIP_ALPHA = { white: 0.18, ink: 0.24 } as const;
const DARK_CANVAS = '#0D0B1E';

export type GroundKey = 'sahtekar' | 'letters' | 'song' | 'chat';

// Fixed grounds. The dark ones are v44's hand-picked gradients.
const GROUNDS: Record<ColorScheme, Record<GroundKey, GameGround>> = {
  light: {
    sahtekar: { top: '#2A1C66', bottom: '#1B1446', chip: 'white' },
    letters: { top: '#CF4A2A', bottom: '#B8325A', chip: 'ink' }, // Harf Kapmaca
    song: { top: '#2B1878', bottom: '#4A22A8', chip: 'white' }, // Şarkıda Geçsin
    chat: { top: '#C2316F', bottom: '#A92A66', chip: 'ink' }, // Sohbet kartları
  },
  dark: {
    sahtekar: { top: '#1C1450', bottom: '#120D33', chip: 'white' },
    letters: { top: '#8E3420', bottom: '#7C2440', chip: 'ink' },
    song: { top: '#1A1150', bottom: '#2E1872', chip: 'white' },
    chat: { top: '#7E2150', bottom: '#6C1C46', chip: 'white' },
  },
};

export function gameGround(scheme: ColorScheme, key: GroundKey): GameGround {
  return GROUNDS[scheme][key];
}

// Kapsül Anlat and İbre play on the team's colour. Dark: the colour mixed into the dark canvas, 62 %
// in OKLab (v44: `color-mix(in oklab, team 62%, #0D0B1E)`), so white text stands out more.
export function teamGround(scheme: ColorScheme, team: Team): GameGround {
  const color = TEAM_COLORS[team];
  const flat = scheme === 'dark' ? mixOklab(color, DARK_CANVAS, 0.62) : color;
  return { top: flat, bottom: flat, chip: scheme === 'dark' ? 'white' : 'ink' };
}

// The chip's colour laid over one stop of its ground (what white text is checked against).
export function chipOn(ground: GameGround, stop: string): string {
  return ground.chip === 'white'
    ? mix(ON_GAME, stop, CHIP_ALPHA.white)
    : mix(ON_JUDGE, stop, CHIP_ALPHA.ink);
}

// The main game button is white with its label in the game's colour (v43: .tbtn.main): the ground's
// stop that reads better on white.
export function mainButtonInk(ground: GameGround): string {
  return contrastRatio(ON_GAME, ground.top) >= contrastRatio(ON_GAME, ground.bottom)
    ? ground.top
    : ground.bottom;
}

// The chip's fill as drawn, translucent over the gradient.
export function chipFill(ground: GameGround): string {
  return ground.chip === 'white'
    ? withAlpha(ON_GAME, CHIP_ALPHA.white)
    : withAlpha(ON_JUDGE, CHIP_ALPHA.ink);
}

// CSS `color-mix(in oklab, a t, b)`: sRGB → OKLab (Björn Ottosson), linear mix, back to sRGB.
export function mixOklab(a: string, b: string, t: number): string {
  const [L1, A1, B1] = toOklab(a);
  const [L2, A2, B2] = toOklab(b);
  return fromOklab([L1 * t + L2 * (1 - t), A1 * t + A2 * (1 - t), B1 * t + B2 * (1 - t)]);
}

type Lab = [number, number, number];

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function fromLinear(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function channel(hex: string, i: number): number {
  return toLinear(parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255);
}

function toOklab(hex: string): Lab {
  const r = channel(hex, 0);
  const g = channel(hex, 1);
  const b = channel(hex, 2);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, A, B]: Lab): string {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const hex = rgb.map((c) =>
    Math.round(Math.min(1, Math.max(0, fromLinear(c))) * 255)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${hex.join('')}`.toUpperCase();
}
