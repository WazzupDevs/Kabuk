import type { LookSlot } from '@shared/capsule.ts';

import { createLru } from '../../lib/lru';
import { ACCESSORY_TILE_BOX } from '../../theme/accessoryTiles';
import { ACCESSORY_ART, accessoryFigure, edgeOf } from '../../theme/capsuleAccessories';
import { stillSvg } from '../../theme/capsuleFx';
import { defBox, IDENTITY } from '../../theme/svgBox';
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
// An accessory's option is the accessory alone (the owner's call, 22 Kasım): no capsule, its
// drawing (and a Renk's skin) still, in a square round its own box with room round it, so that it
// stands in the middle of the option's round. Its halo stays out (it is the capsule's, not the
// piece's). One the box cannot be read of shows its collection figure.
const ALONE_ROOM = 1.25;
// The contour, as a share of the square's side (the owner's call, 22 Kasım: every piece clearer).
const ALONE_EDGE = 0.022;
// The smallest square (in the drawing's units, the capsule 52 wide): a beauty spot stays small.
const ALONE_MIN = 14;
// The sparks flying round a piece (its twinkles, embers, rain, flashes): left out of its option,
// which shows the piece itself; measured, they would pull it off the round's middle.
const SPARKS = /^(tw|ff|hr|orb|rise|rain|flash|kztw|kzpt)/;
// A shine's band moving through a clip: drawn (the clip keeps it on the piece), not measured (its
// band is longer than the piece).
const BANDS = /^(glint|scan|shift|kzsh)/;

// The drawing without its motion groups whose name `drop` matches (the others stay as they are).
function withoutGroups(content: string, drop: RegExp): string {
  let out = content;
  let from = 0;
  for (;;) {
    const at = out.indexOf('<g data-fx="', from);
    if (at < 0) return out;
    const name = /^<g data-fx="([a-z0-9]+)"/.exec(out.slice(at))?.[1] ?? '';
    if (!drop.test(name)) {
      from = at + 1;
      continue;
    }
    let depth = 0;
    const tag = /<\/?g\b[^>]*>/g;
    tag.lastIndex = at;
    let end = out.length;
    for (let m = tag.exec(out); m; m = tag.exec(out)) {
      depth += m[0].startsWith('</') ? -1 : m[0].endsWith('/>') ? 0 : 1;
      if (depth === 0) {
        end = m.index + m[0].length;
        break;
      }
    }
    out = out.slice(0, at) + out.slice(end);
    from = at;
  }
}

// What is measured: the piece's shapes, not its bands, nor what only cuts or paints (definitions,
// clips, masks, gradients).
function measured(piece: string): string {
  return withoutGroups(
    piece.replace(/<(defs|clipPath|mask|linearGradient|radialGradient)\b[\s\S]*?<\/\1>/g, ''),
    BANDS,
  );
}

function accessoryAlone(id: string): string {
  const a = ACCESSORY_ART[id];
  // Every anchor: the drawing is measured in its own units, whatever the capsule it was set on.
  if (!a) return accessoryFigure(id);
  const piece = withoutGroups((a.skin ?? '') + a.art, SPARKS);
  // Its seen box (measured from its pixels, theme/accessoryTiles.ts); else its shapes' box.
  const box = ACCESSORY_TILE_BOX[id] ?? defBox(`<mask>${measured(piece)}</mask>`, IDENTITY);
  if (!box) return accessoryFigure(id);
  const [x, y, w, h] = box;
  const side = Math.max(w, h, ALONE_MIN) * ALONE_ROOM;
  const view = [x + w / 2 - side / 2, y + h / 2 - side / 2, side, side]
    .map((v) => Math.round(v * 100) / 100)
    .join(' ');
  // A white contour round it, as thick on every option (a share of the square's side).
  return stillSvg(svgOf(view, edgeOf(piece, side * ALONE_EDGE, undefined, 'alone') + piece));
}

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
    ? accessoryAlone(option.accessory)
    : partArt(slot, option.part ?? '', color);
  made.set(key, xml);
  return xml;
}
