import type { VampirRole } from '@shared/vampir.ts';

import type { TextStyle } from 'react-native';

import { KIT_TYPE } from './auraKit';
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
  deadChip: 'rgba(20, 17, 43, 0.35)',
  count: '#FFB547',
  shade: 'rgba(10, 8, 24, 0.88)',
  // The role card's caption: clear at its top, dark under the words (.ra-cap).
  capShade: 'linear-gradient(rgba(10, 8, 24, 0), rgba(10, 8, 24, 0.88) 30%, rgba(10, 8, 24, 0.95))',
  label: 'rgba(10, 8, 24, 0.60)',
  team: '#FFD27A',
  shadow: {
    card: '0px 14px 30px rgba(0, 0, 0, 0.25)',
    tile: '0px 8px 18px rgba(0, 0, 0, 0.25)',
    roleCard: '0px 22px 44px rgba(0, 0, 0, 0.45)',
    pop: '0px 14px 30px rgba(0, 0, 0, 0.35)',
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
    clock: 60,
    moon: 56,
    sun: 92,
    peek: 36,
    popArt: 54,
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

// Each role's small mark (the file's icons), on its tag and on the end screen.
export const ROLE_ICON: Record<VampirRole, string> = {
  vampir:
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M6 17c5 15 31 15 36 0" fill="#C51F62"/><path d="M6 17h36" stroke="#C51F62" stroke-width="3" stroke-linecap="round"/><path d="M14 18l3 9 3-8zM28 19l3 8 3-9z" fill="#fff"/></svg>',
  doktor:
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="19" y="8" width="10" height="32" rx="3" fill="#1C7843"/><rect x="8" y="19" width="32" height="10" rx="3" fill="#1C7843"/></svg>',
  gozcu:
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M4 24C10 13 38 13 44 24C38 35 10 35 4 24Z" fill="#fff" stroke="#0F6E8C" stroke-width="3"/><circle cx="24" cy="24" r="7" fill="#0F6E8C"/><circle cx="26.5" cy="21.5" r="2.2" fill="#fff"/></svg>',
  koylu:
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M7 23L24 9l17 14v17H7z" fill="#5A3AE6"/><rect x="20" y="28" width="8" height="12" rx="1.5" fill="#fff"/></svg>',
  soytari:
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M8 32 L12 14 L20 26 L24 8 L28 26 L36 14 L40 32Z" fill="#9A5300"/><rect x="8" y="31" width="32" height="6" rx="2" fill="#5E3A00"/><circle cx="12" cy="13" r="3" fill="#FFB547"/><circle cx="24" cy="7" r="3" fill="#FFB547"/><circle cx="36" cy="13" r="3" fill="#FFB547"/></svg>',
};

export const SUN_SVG =
  '<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><path d="M18 50a32 32 0 0 1 64 0z" fill="#FFB547"/><g stroke="#FFD27A" stroke-width="4" stroke-linecap="round"><path d="M50 6v-4M20 18l-3-3M80 18l3-3M8 42H3M92 42h5"/></g></svg>';

export const MOON_SVG =
  '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M40 8a24 24 0 1 0 16 38A20 20 0 0 1 40 8z" fill="#FFE2A8"/><circle cx="12" cy="14" r="1.6" fill="#fff"/><circle cx="54" cy="10" r="1.2" fill="#fff"/><circle cx="58" cy="30" r="1.4" fill="#fff"/></svg>';

export const CROSS_SVG =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>';

export const EYE_SVG =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 12C5 6.5 19 6.5 22 12C19 17.5 5 17.5 2 12Z" fill="none" stroke="#14112B" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="#14112B"/></svg>';

// The day's big clock (.vk-clock): the display face, 60 high, its figures one width.
export const VAMPIR_CLOCK: TextStyle = {
  ...KIT_TYPE.display,
  fontSize: VAMPIR_LOOK.size.clock,
  lineHeight: VAMPIR_LOOK.size.clock,
  fontVariant: ['tabular-nums'],
};
