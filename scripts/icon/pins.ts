// Keşfet map pins' glyphs in the capsule family's colours (the owner's call, 27 Ekim: "kapsül
// kankilerinin renkleriyle"): the venue's kind drawn in the brand's purple and pink with the deep
// overlap colour, on the pin's white disc (src/features/explore/ExploreMap.tsx). A 24-unit grid,
// like the white marker glyphs (glyphs.ts → MARKERS), which these replace on the map.
import { BRAND } from '../../apps/mobile/src/theme/brand.ts';
import type { MarkerKind } from './glyphs.ts';

const A = BRAND.purple;
const B = BRAND.pink;
// The family's overlap on a light ground (skall.css → `.bi .x`).
const X = '#3B25A6';

export const PINS: Record<MarkerKind, string> = {
  // A cup in purple with a pink handle and two pink curls of steam; the handle's join in the overlap.
  cafe:
    `<path d="M 4.2 8.6 H 16.6 V 12.8 C 16.6 16.7 13.9 19.4 10.4 19.4 C 6.9 19.4 4.2 16.7 4.2 12.8 Z" fill="${A}"/>` +
    `<path d="M 16.4 10.4 H 17.6 C 19.3 10.4 20.5 11.6 20.5 13.1 C 20.5 14.6 19.3 15.8 17.6 15.8 H 15.9" fill="none" stroke="${B}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<rect x="15.6" y="9.2" width="1.6" height="2.4" fill="${X}"/>` +
    `<path d="M 8.4 2.8 C 7.6 3.9 9.2 5 8.4 6.4" fill="none" stroke="${B}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M 12.4 2.8 C 11.6 3.9 13.2 5 12.4 6.4" fill="none" stroke="${B}" stroke-width="2" stroke-linecap="round"/>`,
  // A faculty building: a purple pediment and steps, three pink columns, the middle one in the
  // overlap where it meets the pediment's shade.
  campus:
    `<path d="M 2.4 9.8 L 12 3.4 L 21.6 9.8 Z" fill="${A}"/>` +
    `<rect x="4.9" y="11.1" width="3.2" height="6.6" rx="1.6" fill="${B}"/>` +
    `<rect x="10.4" y="11.1" width="3.2" height="6.6" rx="1.6" fill="${X}"/>` +
    `<rect x="15.9" y="11.1" width="3.2" height="6.6" rx="1.6" fill="${B}"/>` +
    `<rect x="3" y="18.6" width="18" height="2.6" rx="1.3" fill="${A}"/>`,
};

export function pinSvg(kind: MarkerKind, px: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24">${PINS[kind]}</svg>`;
}
