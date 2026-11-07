import type { ColorScheme as Scheme } from './tokens';

// A full set's balloon in the venue chat (docs/SPEC_V4.md §4.U; BalonElf, BalonNinja): while the
// person writes anonymously wearing the Elf or the Ninja set whole, their messages take the set's
// balloon; written with their name, the plain one. From the boards' `.e2` and `.n2`: the fill, the
// travelling border's colours (still here), the glow, a corner's ornaments (moving as the
// accessories move: their groups are capsuleFx.ts marks), a vine or a rope along the top and the
// foot, and the name's chip. The boards' border travel, colour drift, vine and rope scroll, falling
// leaf, fireflies and slash are not drawn.
const ELF_ART = {
  tl: '<svg viewBox="0 0 48 40" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="elftl-e2g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".5" stop-color="#F2C230"/><stop offset="1" stop-color="#C99A1A"/></linearGradient><radialGradient id="elftl-e2m"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#7FF5D8"/><stop offset="1" stop-color="#1FB5A8"/></radialGradient></defs><g data-fx="sway0" data-o="15.5 30.8" data-k="1"><g><path d="M22.0 30.0Q18.1 21.7 9.0 22.5Q12.9 30.8 22.0 30.0Z" fill="#3CC47C"/><path d="M22.0 30.0L11.6 24.0" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><g data-fx="sway1" data-o="18.25 30" data-k="1"><g><path d="M22.0 30.0Q22.8 20.9 14.5 17.0Q13.7 26.1 22.0 30.0Z" fill="#8FB82E"/><path d="M22.0 30.0L16.0 19.6" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><g data-fx="sway2" data-o="25.75 30" data-k="1"><g><path d="M22.0 30.0Q30.3 26.1 29.5 17.0Q21.2 20.9 22.0 30.0Z" fill="#8FB82E"/><path d="M22.0 30.0L28.0 19.6" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><g data-fx="sway0" data-o="28.5 30.8" data-k="1"><g><path d="M22.0 30.0Q31.1 30.8 35.0 22.5Q25.9 21.7 22.0 30.0Z" fill="#3CC47C"/><path d="M22.0 30.0L32.4 24.0" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><g data-fx="sway1" data-o="22 30" data-k="1"><g><path d="M22.0 30.0Q27.2 22.5 22.0 15.0Q16.8 22.5 22.0 30.0Z" fill="#0B783D"/><path d="M22.0 30.0L22.0 18.0" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><path d="M16 10A11 11 0 1 0 30 25A8.6 8.6 0 1 1 16 10Z" fill="url(#elftl-e2g)"/><g><path d="M22 23l4 5-4 5-4-5Z" fill="url(#elftl-e2m)"/></g><path d="M21 26l1-1.4.8 1Z" fill="#FFF"/><g data-fx="tw1" data-o="40 8" data-k="1"><path d="M40 5l0.90 2.10 2.10 0.90-2.10 0.90-0.90 2.10-0.90-2.10-2.10-0.90 2.10-0.90Z" fill="#FFF4C2"/></g><g data-fx="tw3" data-o="6 4" data-k="1"><path d="M6 1.8l0.66 1.54 1.54 0.66-1.54 0.66-0.66 1.54-0.66-1.54-1.54-0.66 1.54-0.66Z" fill="#E9FFD6"/></g></svg>',
  tr: '<svg viewBox="0 0 34 28" width="100%" height="100%" aria-hidden="true"><g data-fx="sway0" data-o="15 24" data-k="1"><g><path d="M10.0 24.0Q17.9 23.3 20.0 15.6Q12.0 16.3 10.0 24.0Z" fill="#3CC47C"/><path d="M10.0 24.0L18.0 17.3" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><g data-fx="sway1" data-o="16.4 27.4" data-k="1"><g><path d="M10.0 24.0Q17.2 27.4 22.8 21.7Q15.6 18.3 10.0 24.0Z" fill="#8FB82E"/><path d="M10.0 24.0L20.2 22.2" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><g data-fx="sway2" data-o="12.2 24" data-k="1"><g><path d="M10.0 24.0Q16.5 19.5 14.4 11.8Q7.9 16.3 10.0 24.0Z" fill="#0B783D"/><path d="M10.0 24.0L13.6 14.2" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><g data-fx="pulse" data-o="20 9.65" data-k="1"><g><circle cx="20.0" cy="6.4" r="2.6" fill="#FF7FAA"/><circle cx="23.4" cy="8.9" r="2.6" fill="#FF7FAA"/><circle cx="22.1" cy="12.9" r="2.6" fill="#FF7FAA"/><circle cx="17.9" cy="12.9" r="2.6" fill="#FF7FAA"/><circle cx="16.6" cy="8.9" r="2.6" fill="#FF7FAA"/><circle cx="20" cy="10" r="2.0" fill="#FFF4C2"/></g></g><g data-fx="tw2" data-o="30 3" data-k="1"><path d="M30 0.6l0.72 1.68 1.68 0.72-1.68 0.72-0.72 1.68-0.72-1.68-1.68-0.72 1.68-0.72Z" fill="#FFFFFF"/></g></svg>',
  bl: '<svg viewBox="0 0 32 26" width="100%" height="100%" aria-hidden="true"><path d="M30 4C20 4 10 8 6 16C4 20 6 24 10 23C13 22 12 18 9 18" fill="none" stroke="#F2C230" stroke-width="2.2" stroke-linecap="round"/><path d="M24 5C18 8 16 12 16 16" fill="none" stroke="#8FB82E" stroke-width="1.6" stroke-linecap="round"/><g data-fx="sway1" data-o="15.25 24.9" data-k="1"><g><path d="M16.0 16.0Q11.9 19.8 14.4 24.9Q18.6 21.0 16.0 16.0Z" fill="#3CC47C"/><path d="M16.0 16.0L14.7 23.1" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><circle cx="9" cy="18" r="2.2" fill="#F2C230"/></svg>',
  br: '<svg viewBox="0 0 22 18" width="100%" height="100%" aria-hidden="true"><g data-fx="sway2" data-o="8.5 14" data-k="1"><g><path d="M6.0 14.0Q11.6 11.5 11.0 5.3Q5.4 7.9 6.0 14.0Z" fill="#8FB82E"/><path d="M6.0 14.0L10.0 7.1" stroke="#0B5A2D" stroke-width=".9" stroke-linecap="round" opacity=".6"/></g></g><circle cx="15.0" cy="6.4" r="1.9" fill="#B48CFF"/><circle cx="17.5" cy="8.2" r="1.9" fill="#B48CFF"/><circle cx="16.5" cy="11.1" r="1.9" fill="#B48CFF"/><circle cx="13.5" cy="11.1" r="1.9" fill="#B48CFF"/><circle cx="12.5" cy="8.2" r="1.9" fill="#B48CFF"/><circle cx="15" cy="9" r="1.4" fill="#FFF4C2"/></svg>',
  mark: '<svg viewBox="0 0 10 10" width="100%" height="100%" aria-hidden="true"><path d="M1 9C1 4 4 1 9 1C9 6 6 9 1 9Z" fill="#3CC47C"/><path d="M1.6 8.4L6.4 3.6" stroke="#F2C230" stroke-width="1" stroke-linecap="round"/></svg>',
} as const;
const NINJA_ART = {
  tl: '<svg viewBox="0 0 60 50" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="ninjatl-n2s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#DDE3EA"/><stop offset="1" stop-color="#6E7A88"/></linearGradient></defs><defs><radialGradient id="ninjatl-n2mg" cx=".35" cy=".35"><stop offset="0" stop-color="#FFC2CC" stop-opacity=".9"/><stop offset="1" stop-color="#C51F62" stop-opacity="0"/></radialGradient></defs><path d="M4 46L50 6" stroke="#DDE3EA" stroke-width="2.8" stroke-linecap="round"/><g data-fx="n2moon" data-o="30 8" data-k="1"><g><path d="M30 8A16 16 0 1 0 45 28A12.4 12.4 0 1 1 30 8Z" fill="#E8455A"/><path d="M30 8A16 16 0 1 0 45 28A12.4 12.4 0 1 1 30 8Z" fill="url(#ninjatl-n2mg)"/></g></g><path d="M17 18A13 13 0 0 0 22 37" fill="none" stroke="#FFC2CC" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><path d="M4 46L14 37.4" stroke="#DDE3EA" stroke-width="2.8" stroke-linecap="round"/><path d="M47 8.6L56 0.6" stroke="#2A2346" stroke-width="4.4" stroke-linecap="round"/><path d="M44 11l5 5" stroke="#F2C230" stroke-width="2.6" stroke-linecap="round"/><g data-fx="glow" data-o="6 38" data-k="1"><g><path d="M6 44L13 38" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/></g></g><g data-fx="n2puff" data-o="7 37" data-k="1"><g><circle cx="12" cy="42" r="5" fill="#B9B3D9" opacity=".55"/><circle cx="19" cy="45" r="4" fill="#E9E4FF" opacity=".5"/><circle cx="42" cy="42" r="4.4" fill="#B9B3D9" opacity=".5"/></g></g><g data-fx="tw1" data-o="54 20" data-k="1"><path d="M54 17l0.90 2.10 2.10 0.90-2.10 0.90-0.90 2.10-0.90-2.10-2.10-0.90 2.10-0.90Z" fill="#FFFFFF"/></g><g data-fx="tw3" data-o="6 24" data-k="1"><path d="M6 21.8l0.66 1.54 1.54 0.66-1.54 0.66-0.66 1.54-0.66-1.54-1.54-0.66 1.54-0.66Z" fill="#FFC2CC"/></g></svg>',
  tr: '<svg viewBox="0 0 38 34" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="ninjatr-n2s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#DDE3EA"/><stop offset="1" stop-color="#6E7A88"/></linearGradient></defs><path d="M2 26A16 16 0 0 1 14 6" fill="none" stroke="#E6F4FF" stroke-width="1.8" stroke-linecap="round" opacity=".6"/><path d="M6 30A13 13 0 0 1 4 16" fill="none" stroke="#FF7FAA" stroke-width="1.2" stroke-linecap="round" opacity=".55"/><g data-fx="n2spin" data-o="22 17" data-k="1"><g><path d="M22.00 5.00L24.72 14.28L34.00 17.00L24.72 19.72L22.00 29.00L19.28 19.72L10.00 17.00L19.28 14.28Z" fill="url(#ninjatr-n2s)"/><path d="M22.00 9.80L23.70 15.30L29.20 17.00L23.70 18.70L22.00 24.20L20.30 18.70L14.80 17.00L20.30 15.30Z" fill="#FFFFFF" opacity=".35"/><circle cx="22" cy="17" r="2.64" fill="#E8455A"/><circle cx="22" cy="17" r="1.08" fill="#15122A"/></g></g><g data-fx="tw2" data-o="36 4" data-k="1"><path d="M36 1.6l0.72 1.68 1.68 0.72-1.68 0.72-0.72 1.68-0.72-1.68-1.68-0.72 1.68-0.72Z" fill="#FFFFFF"/></g></svg>',
  bl: '<svg viewBox="0 0 34 26" width="100%" height="100%" aria-hidden="true"><g data-fx="n2rib" data-o="16.4 8" data-k="1"><g><path d="M14 8C8 10 4 16 2 24C7 20 11 18 15 17Z" fill="#E8455A"/><path d="M16 9C14 15 15 20 19 25C20 20 20 15 19 10Z" fill="#C51F62"/></g></g><circle cx="16" cy="8" r="4" fill="#E8455A"/><circle cx="15" cy="7" r="1.3" fill="#FFC2CC"/><path d="M20 8H32" stroke="#E8455A" stroke-width="2" stroke-linecap="round"/></svg>',
  br: '<svg viewBox="0 0 14 26" width="100%" height="100%" aria-hidden="true"><path d="M7 24L3 12L7 9L11 12Z" fill="url(#ninjabr-n2k)"/><defs><linearGradient id="ninjabr-n2k" x1="0" x2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#8E98A4"/></linearGradient></defs><rect x="5.6" y="3" width="2.8" height="6" rx=".8" fill="#2A2346"/><circle cx="7" cy="2" r="1.8" fill="none" stroke="#E8455A" stroke-width="1.4"/></svg>',
  mark: '<svg viewBox="0 0 10 10" width="100%" height="100%" aria-hidden="true"><path d="M5.00 0.00L6.13 3.87L10.00 5.00L6.13 6.13L5.00 10.00L3.87 6.13L0.00 5.00L3.87 3.87Z" fill="#DDE3EA"/><circle cx="5" cy="5" r="1.2" fill="#E8455A"/></svg>',
} as const;

export type BalloonCorner = 'tl' | 'tr' | 'bl' | 'br';
type Place = { w: number; h: number; x: number; y: number; turn?: number };

export type SetBalloon = {
  fill: string;
  border: string;
  aurora: string;
  shadow: Record<Scheme, string>;
  // Another's: [top left, top right, bottom right, bottom left]; the own one mirrored.
  radius: { round: number; tight: number };
  pad: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  edge: number;
  ink: string;
  muted: string;
  // A chosen reaction's ground on the balloon (its words in the balloon's ink).
  chipOn: string;
  // Each ornament's box, from the bubble's own corner (`x` from its side, `y` from its top or foot,
  // negative: outside); mirrored for the own message.
  corners: Record<BalloonCorner, Place & { svg: string }>;
  // The vine or rope along the top and the foot: one tile, repeated; its box from the sides.
  strip: { svg: string; w: number; h: number; left: number; right: number; out: number };
  name: { fill: string; ink: string; ring: string; glow: string; mark: string };
};

export const SET_BALLOONS: Readonly<Record<'elf' | 'ninja', SetBalloon>> = {
  elf: {
    fill: 'linear-gradient(160deg, #07391D 0%, #0B5A2D 50%, #0E6E4A 100%)',
    border:
      'linear-gradient(110deg, #C99A1A, #F2C230, #9FFFCB, #F2C230, #8FB82E, #F2C230, #C99A1A)',
    aurora:
      'radial-gradient(60% 120% at 20% 0%, rgba(127,245,216,0.30), transparent 60%), radial-gradient(50% 100% at 85% 100%, rgba(180,140,255,0.26), transparent 60%)',
    shadow: {
      light:
        '0 0 0 4px rgba(61,220,132,0.10), 0 0 22px rgba(61,220,132,0.28), 0 8px 18px rgba(4,40,20,0.35)',
      dark: '0 0 0 4px rgba(61,220,132,0.14), 0 0 26px rgba(61,220,132,0.36), 0 6px 14px rgba(0,0,0,0.45)',
    },
    radius: { round: 22, tight: 6 },
    pad: { top: 12, right: 18, bottom: 12, left: 20 },
    margin: { top: 14, right: 10, bottom: 6, left: 8 },
    edge: 2,
    ink: '#FFFFFF',
    muted: 'rgba(255,255,255,0.80)',
    chipOn: '#0B5A2D',
    corners: {
      tl: { w: 62, h: 52, x: -24, y: -31, svg: ELF_ART.tl },
      tr: { w: 42, h: 35, x: -17, y: -19, svg: ELF_ART.tr },
      bl: { w: 32, h: 26, x: -16, y: -14, svg: ELF_ART.bl },
      br: { w: 22, h: 18, x: -9, y: -9, svg: ELF_ART.br },
    },
    strip: {
      svg: '<svg viewBox="0 0 28 12" width="100%" height="100%" aria-hidden="true"><path d="M0 6Q7 2.6 14 6T28 6" stroke="#F2C230" stroke-width="1.3" fill="none"/><path d="M8 5.4C5 1.6 8.6-.4 11.6.6C11.6 3.6 10 5.4 8 5.4Z" fill="#3CC47C"/><path d="M21 6.6C24 10.4 20.4 12.4 17.4 11.4C17.4 8.4 19 6.6 21 6.6Z" fill="#8FB82E"/></svg>',
      w: 28,
      h: 12,
      left: 30,
      right: 26,
      out: -7,
    },
    name: {
      fill: 'linear-gradient(90deg, #0B5A2D, #0E6E4A)',
      ink: '#F2C230',
      ring: 'rgba(242,194,48,0.55)',
      glow: 'rgba(61,220,132,0.30)',
      mark: ELF_ART.mark,
    },
  },
  ninja: {
    fill: 'linear-gradient(160deg, #0E0B20 0%, #1E1838 55%, #2A2346 100%)',
    border:
      'linear-gradient(110deg, #C51F62, #E8455A, #FF9AAE, #B48CFF, #DDE3EA, #E8455A, #C51F62)',
    aurora:
      'radial-gradient(55% 120% at 15% 100%, rgba(185,179,217,0.22), transparent 60%), radial-gradient(45% 110% at 90% 0%, rgba(232,69,90,0.24), transparent 60%)',
    shadow: {
      light:
        '0 0 0 4px rgba(232,69,90,0.10), 0 0 22px rgba(232,69,90,0.28), 0 8px 18px rgba(14,11,32,0.40)',
      dark: '0 0 0 4px rgba(232,69,90,0.14), 0 0 26px rgba(232,69,90,0.36), 0 6px 14px rgba(0,0,0,0.50)',
    },
    radius: { round: 22, tight: 6 },
    pad: { top: 12, right: 18, bottom: 12, left: 20 },
    margin: { top: 14, right: 10, bottom: 6, left: 8 },
    edge: 2,
    ink: '#FFFFFF',
    muted: 'rgba(255,255,255,0.80)',
    chipOn: '#1E1838',
    corners: {
      tl: { w: 50, h: 42, x: -26, y: -17, svg: NINJA_ART.tl },
      tr: { w: 38, h: 34, x: -18, y: -20, svg: NINJA_ART.tr },
      bl: { w: 34, h: 26, x: -17, y: -15, svg: NINJA_ART.bl },
      br: { w: 14, h: 26, x: -6, y: -14, turn: -25, svg: NINJA_ART.br },
    },
    strip: {
      svg: '<svg viewBox="0 0 16 6" width="100%" height="100%" aria-hidden="true"><path d="M0 3Q4 0 8 3T16 3" stroke="#E8455A" stroke-width="1.6" fill="none"/><path d="M0 3Q4 6 8 3T16 3" stroke="#FF9AAE" stroke-width=".9" fill="none" opacity=".8"/></svg>',
      w: 16,
      h: 6,
      left: 34,
      right: 28,
      out: -4,
    },
    name: {
      fill: 'linear-gradient(90deg, #15122A, #2A2346)',
      ink: '#FF9AAE',
      ring: 'rgba(232,69,90,0.65)',
      glow: 'rgba(232,69,90,0.30)',
      mark: NINJA_ART.mark,
    },
  },
};
