import { accessoriesOf, coveredSlots } from '../../../../supabase/functions/_shared/pure/gifts.ts';

import { accessoryLayers, type AccessoryLayers } from './capsuleAccessories';
import LOOK, { type LookParts } from './capsuleDrawing';

// A stored look code ("c:pembe e:koyu h:kulaklik", _shared/pure/capsule.ts → normalizeLook) as the
// drawing library's parts, and its SVG text.
const SLOTS = ['c', 'e', 'h', 'f', 'm', 'n'] as const;
type Slot = (typeof SLOTS)[number];

function isSlot(value: string): value is Slot {
  return (SLOTS as readonly string[]).includes(value);
}

export function lookParts(code: string): LookParts {
  const parts: LookParts = {};
  for (const token of code.trim().split(/\s+/)) {
    const colon = token.indexOf(':');
    if (colon < 1) continue;
    const slot = token.slice(0, colon);
    if (isSlot(slot) && parts[slot] === undefined) parts[slot] = token.slice(colon + 1);
  }
  return parts;
}

// The worn pack accessories (`x:<id>`, docs/SPEC_V4.md §4.U): each covers the capsule's own part
// in its slots (the part stays in the code and shows again when the accessory comes off). Covered
// eyes leave the plain visor for the accessory's eyes; a covered colour keeps the body under the
// accessory's skin.
const EYE_SHAPE = /<(?:circle|ellipse|path)\b[^>]*\bclass="eye"[^>]*\/>/g;
// The body's shade (capsuleDrawing.js): a skin goes over it, under the visor.
const SHADE = /<path d="M30 10a14 14 0 0 1 8 12v42h-8z"[^>]*\/>/;

function dressed(
  code: string,
  edge = 0,
): { parts: LookParts; layers: AccessoryLayers; eyes: boolean } {
  const parts = lookParts(code);
  const ids = accessoriesOf(code);
  const layers = accessoryLayers(ids, edge);
  const covered = coveredSlots(ids);
  for (const slot of ['h', 'f', 'm', 'n'] as const) if (covered[slot]) delete parts[slot];
  const eyes = covered.e !== undefined;
  if (eyes) parts.e = 'klasik';
  return { parts, layers, eyes };
}

function withSkin(svg: string, skin: string): string {
  return skin ? svg.replace(SHADE, (shade) => shade + skin) : svg;
}

export function lookSvg(code: string, mode: 'av' | 'fig' = 'av'): string {
  const { parts, layers, eyes } = dressed(code);
  let svg = LOOK.svg(parts, mode);
  if (eyes) svg = svg.replace(EYE_SHAPE, '');
  svg = withSkin(svg, layers.skin);
  if (layers.back) {
    // Behind the body: over the avatar's disc, or first in the figure.
    svg =
      mode === 'av'
        ? svg.replace(/^(<svg\b[^>]*>(?:<circle\b[^>]*\/>)?)/, `$1${layers.back}`)
        : svg.replace(/^(<svg\b[^>]*>)/, `$1${layers.back}`);
  }
  return layers.front ? svg.replace(/<\/svg>$/, `${layers.front}</svg>`) : svg;
}

// The capsule editor's stage (v46 `.ced-fig`: LOOK.pop): the capsule standing in its circle, the
// head free to rise over it, with a feeling (`emo`, one of FEELINGS) for a moment or none. The
// circle's own ground is lookGround. react-native-svg joins a clip's shapes even-odd on Android, so
// the circle-and-rect clip becomes one path of the same outline (as in the reaction faces).
const POP_CLIP = '<circle cx="24" cy="24" r="24"/><rect x="-6" y="-8" width="60" height="32"/>';
const POP_CLIP_PATH = '<path d="M-6 -8H54V24H48A24 24 0 0 1 0 24H-6Z"/>';

// `edge`: a thin white contour round the accessories (canvas units; the gift card: CARD_EDGE).
export function lookPop(code: string, emo = '', edge = 0): string {
  const { parts, layers, eyes } = dressed(code, edge);
  let svg = LOOK.pop(parts, emo).replace(POP_CLIP, POP_CLIP_PATH);
  if (eyes) svg = svg.replace(EYE_SHAPE, '');
  svg = withSkin(svg, layers.skin);
  // Inside the clipped group, over the capsule and under a feeling's things around it; before the
  // halo goes in (its own groups would take the first `</g></g>`).
  if (layers.front) svg = svg.replace('</g></g>', `${layers.edge}${layers.front}</g></g>`);
  if (layers.back) svg = svg.replace(/(<g clip-path="url\(#cpc\d+\)">)/, `$1${layers.back}`);
  return svg;
}

// The gift card's contour round the accessories: thin (the owner's call, 7 Kasım), in the canvas's
// units (about a pixel and a half on the card).
export const CARD_EDGE = 0.9;

// The gift card's stage (the owner's call, 7 Kasım): the editor's stage (lookPop) with room above
// the circle for what reaches highest (Alev saç, Ejder boynuzu and their rising sparks), the
// accessories' contour on. The circle stays 48 wide at (0, 0); the box starts CARD_TOP above it.
export const CARD_TOP = 26;
export const CARD_BOX = { x: -6, y: -CARD_TOP, width: 60, height: 49 + CARD_TOP } as const;

export function lookCard(code: string): string {
  return lookPop(code, '', CARD_EDGE)
    .replace('viewBox="-6 -8 60 57"', `viewBox="-6 ${-CARD_TOP} 60 ${49 + CARD_TOP}"`)
    .replace(POP_CLIP_PATH, `<path d="M-6 ${-CARD_TOP}H54V24H48A24 24 0 0 1 0 24H-6Z"/>`);
}

export function lookGround(code: string): string {
  return LOOK.bg(lookParts(code));
}

// The feelings a tap on the head cycles through: [id, name] (v46 LOOK.EMOS).
export const FEELINGS: readonly (readonly [string, string])[] = LOOK.EMOS;

// The eyes posed (the profile's living capsule, the owner's call, 27 Ekim): closed for a blink,
// squashed to a line about the eye line, or turned aside, moved along it (`look` in drawing units,
// negative to the left). Every eye shape is one self-closing element with class "eye"
// (capsuleDrawing.js); they are gathered into one group where the first one stood.
const EYE = /<(?:circle|ellipse|path)\b[^>]*\bclass="eye"[^>]*\/>/g;
const EYE_LINE = 20.5;
const BLINK_SQUASH = 0.12;

export function posedEyes(
  svg: string,
  pose: { blink?: boolean; look?: number; up?: number },
): string {
  if (!pose.blink && !pose.look && !pose.up) return svg;
  const eyes = svg.match(EYE);
  const first = svg.search(EYE);
  if (!eyes || first < 0) return svg;
  const rest = svg.replace(EYE, '');
  const squash = pose.blink ? BLINK_SQUASH : 1;
  const group = `<g transform="translate(${pose.look ?? 0} ${EYE_LINE + (pose.up ?? 0)}) scale(1 ${squash}) translate(0 ${-EYE_LINE})">${eyes.join('')}</g>`;
  return rest.slice(0, first) + group + rest.slice(first);
}

// The same drawing in layers, so a blink or a look moves a picture instead of drawing the capsule
// again (react-native-svg draws on the main thread on Android, on every change): what lies under
// the eyes, the open eyes, the closed ones (squashed as posedEyes squashes them), and what lies over
// them, each its own SVG with the drawing's own box. Null when the drawing has no eyes. The eyes are
// never inside a group (capsuleDrawing.js; capsuleLook.test.ts checks every part).
export type EyeLayers = { below: string; open: string; closed: string; above: string | null };

export function eyeLayers(svg: string): EyeLayers | null {
  const root = svg.match(/^<svg\b[^>]*>/)?.[0];
  const eyes = svg.match(EYE);
  const first = svg.search(EYE);
  const end = '</svg>';
  if (!root || !eyes || first < 0 || !svg.endsWith(end)) return null;
  const rest = svg.replace(EYE, '');
  const after = rest.slice(first, rest.length - end.length);
  const shut = `<g transform="translate(0 ${EYE_LINE}) scale(1 ${BLINK_SQUASH}) translate(0 ${-EYE_LINE})">${eyes.join('')}</g>`;
  return {
    below: rest.slice(0, first) + end,
    open: root + eyes.join('') + end,
    closed: root + shut + end,
    above: after.trim() ? root + after + end : null,
  };
}
