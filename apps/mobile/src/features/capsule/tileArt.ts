import type { LookSlot } from '@shared/capsule.ts';

import { createLru } from '../../lib/lru';
import { accessoryFigure } from '../../theme/capsuleAccessories';
import LOOK from '../../theme/capsuleDrawing';

// What a trying strip's option draws (docs/design/iskelet.md → 5.10): the option alone, never the
// whole capsule again (a suit's capsule tile was 50–280 SVG shapes, skia-build-plani.md → "Süsle'de
// takılma"). A pack accessory is its collection figure (accessoryFigure); a part is its own shapes
// from the drawing library, cut out of the standing capsule (the body and the plain eyes taken away)
// and framed on its slot's place; a colour is the body in that colour; the eyes are the visor with
// them. Each text is made once (CachedSvg reads it once too).

// The body in the drawing library's standing capsule (capsuleDrawing.js → parts().body).
const BODY =
  /<rect x="10" y="8" width="28" height="56" rx="14" fill="[^"]*"\/><path d="M30 10a14 14 0 0 1 8 12v42h-8z"[^>]*\/>/;

// Each slot's frame, in the standing capsule's units (0 0 48 66): the square round every part of the
// slot in the catalog (measured from the drawings, 12 Kasım).
const FRAME: Readonly<Record<Exclude<LookSlot, 'c'>, string>> = {
  e: '10 8.5 28 28',
  h: '3 -3.5 42 42',
  f: '8 2 34 34',
  m: '10 20 28 28',
  n: '2 10.5 44 44',
};
// The body alone, a little room round it.
const BODY_FRAME = '-1 4 50 64';

function standing(look: Partial<Record<LookSlot, string>>): string {
  return LOOK.svg(look, 'fig')
    .replace(/^<svg\b[^>]*>/, '')
    .replace(/<\/svg>$/, '');
}

function svgOf(view: string, inner: string): string {
  return `<svg viewBox="${view}" width="100%" height="100%" aria-hidden="true">${inner}</svg>`;
}

// The plain eyes (and visor) the standing capsule wears when it has no eyes chosen.
function plainEyes(color: string | undefined): string {
  return standing({ c: color }).replace(BODY, '');
}

// A part's own drawing in the person's colour (a part paints with the body's colour).
export function partArt(slot: LookSlot, id: string, color: string | undefined): string {
  if (slot === 'c') {
    const body = standing({ c: id }).match(BODY)?.[0] ?? '';
    return svgOf(BODY_FRAME, body);
  }
  const art = standing({ c: color, [slot]: id }).replace(BODY, '');
  return svgOf(FRAME[slot], slot === 'e' ? art : art.replace(plainEyes(color), ''));
}

const made = createLru<string>(400);

// The option's art: an accessory's figure, else its part's; null for "boş".
export function optionArt(
  slot: LookSlot,
  option: { accessory?: string; part?: string },
  color: string | undefined,
): string | null {
  const key = option.accessory
    ? `x:${option.accessory}`
    : option.part
      ? `${slot}:${option.part}:${slot === 'c' ? '' : (color ?? '')}`
      : null;
  if (key === null) return null;
  const hit = made.get(key);
  if (hit !== undefined) return hit;
  const xml = option.accessory
    ? accessoryFigure(option.accessory)
    : partArt(slot, option.part ?? '', color);
  made.set(key, xml);
  return xml;
}
