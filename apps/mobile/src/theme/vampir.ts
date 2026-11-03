import type { VampirRole } from '@shared/vampir.ts';

import type { ColorScheme } from './tokens';

// Vampir Köylü's look (the owner's file skall-oyun-vampir-koylu, 29 Ekim): the night deep blue,
// the day wine red, white on both; with skall's colour clouds over the ground (aura.css `.scene`)
// and the venue scene's moon, stars and bats in the night sky. The dark theme lays a veil over the
// ground, as the file does.
export const VAMPIR_LOOK = {
  night: {
    top: '#1E1650',
    bottom: '#0F0B2E',
    tint: '#4B3AA8',
    glows: [
      { color: 'rgba(123, 92, 255, 0.42)', cx: '12%', cy: '6%', rx: '80%', ry: '55%' },
      { color: 'rgba(255, 79, 139, 0.20)', cx: '96%', cy: '70%', rx: '70%', ry: '55%' },
    ],
  },
  day: {
    top: '#B5364B',
    bottom: '#7F2350',
    tint: '#A12E45',
    glows: [
      { color: 'rgba(255, 181, 71, 0.40)', cx: '50%', cy: '4%', rx: '85%', ry: '45%' },
      { color: 'rgba(255, 141, 179, 0.28)', cx: '4%', cy: '80%', rx: '70%', ry: '50%' },
    ],
  },
  veil: {
    light: { night: 'rgba(9, 7, 20, 0)', day: 'rgba(9, 7, 20, 0)' },
    dark: { night: 'rgba(9, 7, 20, 0.30)', day: 'rgba(9, 7, 20, 0.42)' },
  } satisfies Record<ColorScheme, { night: string; day: string }>,
  ink: '#FFFFFF',
  inkSoft: 'rgba(255, 255, 255, 0.86)',
  dark: '#14112B',
  muted: '#5E5878',
  card: { light: '#FFFFFF', dark: '#1C1830' } satisfies Record<ColorScheme, string>,
  cardInk: { light: '#14112B', dark: '#F4F1FF' } satisfies Record<ColorScheme, string>,
  cardMuted: { light: '#5E5878', dark: '#B4ABD6' } satisfies Record<ColorScheme, string>,
  tile: 'rgba(255, 255, 255, 0.10)',
  tileOn: '#FFFFFF',
  tileRing: 'rgba(255, 255, 255, 0.80)',
  ghostFill: 'rgba(20, 17, 43, 0.16)',
  ghostEdge: 'rgba(255, 255, 255, 0.60)',
  bar: 'rgba(255, 255, 255, 0.22)',
  barLow: '#FFB547',
  chip: 'rgba(255, 255, 255, 0.18)',
  chipOn: 'rgba(255, 255, 255, 0.34)',
  deadChip: 'rgba(20, 17, 43, 0.35)',
  count: '#FFB547',
  shade: 'rgba(10, 8, 24, 0.88)',
  // The day clock's face and the glow breathing behind it.
  clockFace: 'rgba(20, 17, 43, 0.22)',
  clockGlow: 'rgba(255, 210, 122, 0.42)',
  // A digital digit's unlit segments, and the clock's pill.
  digitOff: 'rgba(255, 255, 255, 0.10)',
  timerPill: 'rgba(20, 17, 43, 0.28)',
  // The role card's caption: clear at its top, dark under the words (.ra-cap).
  capShade: 'linear-gradient(rgba(10, 8, 24, 0), rgba(10, 8, 24, 0.88) 30%, rgba(10, 8, 24, 0.95))',
  label: 'rgba(10, 8, 24, 0.60)',
  team: '#FFD27A',
  shadow: {
    card: '0px 14px 30px rgba(0, 0, 0, 0.25)',
    tile: '0px 8px 18px rgba(0, 0, 0, 0.25)',
    roleCard: '0px 22px 44px rgba(0, 0, 0, 0.45)',
    pop: '0px 14px 30px rgba(0, 0, 0, 0.35)',
    ringDot: '0px 0px 10px rgba(255, 255, 255, 0.9)',
  },
  // The winners' confetti (the file's .conf).
  confetti: ['#FFFFFF', '#FFB547', '#FF9DC0', '#C9BAFF'],
  // Each role's colour (its tag and its end-screen line).
  roles: {
    vampir: '#C51F62',
    doktor: '#1C7843',
    gozcu: '#0F6E8C',
    soytari: '#9A5300',
    koylu: '#5A3AE6',
  } satisfies Record<VampirRole, string>,
  size: {
    bar: 6,
    nextBar: 8,
    button: 56,
    tile: 18,
    tilePad: 6,
    face: 44,
    smallFace: 16,
    card: 24,
    cardFace: 80,
    roleCard: 26,
    roleEdge: 5,
    tag: 30,
    tagIcon: 20,
    clock: 56,
    dayClock: 210,
    dayRing: 10,
    dayRingIn: 6,
    tickGap: 8,
    tickLong: 9,
    tickShort: 5,
    ringDot: 14,
    digit: {
      sm: { width: 13, height: 22, t: 3.4, gap: 3 },
      lg: { width: 30, height: 52, t: 7, gap: 6 },
    },
    timerPill: 38,
    moon: 56,
    sun: 92,
    peek: 36,
    popArt: 72,
    gridGap: 8,
    cols: 4,
    fewCols: 3,
  },
  motion: {
    // The role card turns (the file: .55s, cubic-bezier(.34,1.3,.64,1)).
    flipMs: 550,
    flip: [0.34, 1.3, 0.64, 1] as const,
    // A result card pops in (the file's gIn: .4s, cubic-bezier(.34,1.56,.64,1)).
    popMs: 400,
    pop: [0.34, 1.56, 0.64, 1] as const,
    // The day and the night cross into each other.
    groundMs: 450,
    // The last seconds of a timed phase.
    lowSeconds: 10,
  },
} as const;

// The game's ink (the role cards' comic outline).
const INK = '#14112B';

// The phases' marks over their titles, in the same look: the night's crescent with a star, the
// morning's sun rising, the vote's ballot, the verdict's gavel.
export const MOON_SVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M40 7a25 25 0 1 0 17 40A21 21 0 0 1 40 7Z" fill="#FFE9BF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="22" cy="40" r="4" fill="#F0CF8A"/><circle cx="30" cy="51" r="2.6" fill="#F0CF8A"/><circle cx="19" cy="27" r="2.4" fill="#F0CF8A"/><path d="M54 10q0 5 5 5q-5 0-5 5q0-5-5-5q5 0 5-5Z" fill="#fff" stroke="${INK}" stroke-width="2"/></svg>`;

export const SUN_SVG = `<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><g stroke="${INK}" stroke-width="3" stroke-linecap="round"><path d="M50 4v7M18 15l5 5M82 15l-5 5M5 40h7M88 40h7" /></g><g stroke="#FFD27A" stroke-width="1.6" stroke-linecap="round"><path d="M50 4v7M18 15l5 5M82 15l-5 5M5 40h7M88 40h7"/></g><path d="M18 48a32 32 0 0 1 64 0Z" fill="#FFB547" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M28 40a22 22 0 0 1 14-18" fill="none" stroke="#FFE2A8" stroke-width="4" stroke-linecap="round"/></svg>`;
