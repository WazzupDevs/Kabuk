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
