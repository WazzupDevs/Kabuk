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

export function lookSvg(code: string, mode: 'av' | 'fig' = 'av'): string {
  return LOOK.svg(lookParts(code), mode);
}

// The capsule editor's stage (v46 `.ced-fig`: LOOK.pop): the capsule standing in its circle, the
// head free to rise over it, with a feeling (`emo`, one of FEELINGS) for a moment or none. The
// circle's own ground is lookGround. react-native-svg joins a clip's shapes even-odd on Android, so
// the circle-and-rect clip becomes one path of the same outline (as in the reaction faces).
const POP_CLIP = '<circle cx="24" cy="24" r="24"/><rect x="-6" y="-8" width="60" height="32"/>';
const POP_CLIP_PATH = '<path d="M-6 -8H54V24H48A24 24 0 0 1 0 24H-6Z"/>';

export function lookPop(code: string, emo = ''): string {
  return LOOK.pop(lookParts(code), emo).replace(POP_CLIP, POP_CLIP_PATH);
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
