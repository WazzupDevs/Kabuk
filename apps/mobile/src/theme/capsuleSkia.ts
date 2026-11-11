// Skia's drawing of a motion inside its clip (docs/decisions/skia-build-plani.md → P6). The same
// layer as the picture way (capsuleFx.ts → FxInside): instead of a few pictures shown in turn, one
// canvas draws the clip as an alpha mask and the content under it, moved on the UI thread all the
// way along its cycle. The rest of the drawing stays on react-native-svg, in its order. Pure: the
// canvas (components/FxSkia.tsx) only draws what these give.

import { ACCESSORY_ART } from './capsuleAccessories';
import {
  cropOf,
  FX,
  type FxBox,
  type FxCrop,
  type FxInside,
  type FxMotion,
  type FxPlace,
  phaseOf,
  placeKey,
  valueAt,
} from './capsuleFx';
import { defBox } from './svgBox';

// One switch for the capsule's Skia drawing: false draws it the picture way everywhere. On for
// Süsle's big capsule (CapsuleStage) since P7 (docs/decisions/skia-build-plani.md): the owner
// compared the two on the phone (T2, Galaxy S23). Only where the two were compared: no iPhone was,
// so iOS keeps the pictures until one is.
export const CAPSULE_SKIA = true;
export const CAPSULE_SKIA_OS: readonly string[] = ['android'];

// The switch on this phone's system (`os` is Platform.OS).
export function capsuleSkiaOn(os: string): boolean {
  return CAPSULE_SKIA && CAPSULE_SKIA_OS.includes(os);
}

// Which way the capsule is drawn. The one choice: the switch, and while Çizim ölçümü's panel is
// open on a preview build its `skia` switch alone (`lab` is null while the panel is closed), so the
// same phone still measures both ways.
export function capsulePainter(on: boolean, lab: boolean | null): 'svg' | 'skia' {
  return (lab ?? on) ? 'skia' : 'svg';
}

// The accessories that move inside a clip (FX[…].frames), as the drawings name them.
export function skiaAccessories(): string[] {
  return Object.entries(ACCESSORY_ART)
    .filter(([, a]) =>
      [...`${a.back ?? ''}${a.skin ?? ''}${a.art}`.matchAll(/data-fx="([^"]*)"/g)].some(
        (m) => FX[m[1] ?? '']?.frames !== undefined,
      ),
    )
    .map(([id]) => id)
    .sort();
}

const fmt = (v: number) => String(Number(v.toFixed(5)));
const rootOf = (box: FxBox) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map(fmt).join(' ')}">`;
const CLIP_REF = /\s(?:clip-path|mask)="url\(#[^)]*\)"/g;

function idsIn(xml: string): string[] {
  return [...xml.matchAll(/url\(#([^)]*)\)/g)].map((m) => m[1] ?? '');
}

// The element with this id in a text of definitions, whole.
function defOf(defs: string, id: string): string | null {
  const tokens = defs.match(/<[^>]+>/g) ?? [];
  const at = tokens.findIndex((t) => !t.startsWith('</') && t.includes(` id="${id}"`));
  if (at < 0) return null;
  const head = tokens[at] ?? '';
  if (head.endsWith('/>')) return head;
  let depth = 0;
  for (let i = at; i < tokens.length; i++) {
    const t = tokens[i] ?? '';
    if (t.startsWith('</')) depth--;
    else if (!t.endsWith('/>')) depth++;
    if (depth === 0) return tokens.slice(at, i + 1).join('');
  }
  return null;
}

// Every colour white: a clip's shapes are only their outline (their paint does not count, so all of
// them is white, "none" too), a mask's are the suit drawn white already (capsuleFx.test.ts), its
// "none" kept. Opacity stays: it is the mask's alpha.
function whiten(xml: string): string {
  let inClip = 0;
  return (xml.match(/<[^>]+>/g) ?? [])
    .map((t) => {
      if (/^<clipPath\b/.test(t) && !t.endsWith('/>')) inClip++;
      else if (t === '</clipPath>') inClip--;
      if (t.startsWith('</')) return t;
      return t.replace(/\s(fill|stroke)="([^"]*)"/g, (_, a: string, v: string) =>
        v === 'none' && (inClip === 0 || a === 'stroke') ? ` ${a}="none"` : ` ${a}="#FFFFFF"`,
      );
    })
    .join('');
}

// The clip as a picture: every clip and mask round the motion (its own and the drawing's further
// out), on a white cover, with the groups' transforms only. Its alpha is how much of the content
// shows at each point: drawn as an alpha mask. Only the definitions it names, all white.
export function insideMaskSvg(layer: FxInside, box: FxBox): string {
  const outer = layer.outer.map((t) => {
    const keep = [...t.matchAll(/\s(?:transform|clip-path|mask)="[^"]*"/g)].map((m) => m[0]);
    return `<g${keep.join('')}>`;
  });
  const defs: string[] = [];
  const seen = new Set<string>();
  const queue = idsIn(outer.join(''));
  while (queue.length > 0) {
    const id = queue.shift() ?? '';
    if (seen.has(id)) continue;
    seen.add(id);
    if (defs.some((d) => d.includes(` id="${id}"`))) continue;
    const def = defOf(layer.defs, id);
    if (!def) continue;
    defs.push(def);
    queue.push(...idsIn(def));
  }
  const cover = '<rect x="-10000" y="-10000" width="20000" height="20000" fill="#FFFFFF"/>';
  return `${rootOf(box)}<defs>${whiten(defs.join(''))}</defs>${outer.join('')}${cover}${'</g>'.repeat(outer.length)}</svg>`;
}

// The content unmoved, with no clip round it (the mask is the clip), in a box of its own that holds
// all of it: the canvas moves it whole.
export function insideContentSvg(layer: FxInside, box: FxBox): string {
  const outer = layer.outer.map((t) => t.replace(CLIP_REF, ''));
  const close = outer.map((t) => `</${/^<([\w:-]+)/.exec(t)?.[1] ?? 'g'}>`).reverse();
  return `${rootOf(box)}${layer.defs}${outer.join('')}<g>${layer.content}</g>${close.join('')}</svg>`;
}

// A motion's translate along the clock (0…1 every `ms`, as the picture way's clock): its keyframes,
// the picture way's frame starts (so that at each the two stand alike) and 48 steps between, the
// value read at each; the cycle's end and its start both sides of the seam (1 - phase).
export type SkiaCurve = { input: number[]; tx: number[]; ty: number[] };

const STEPS = 48;
const SEAM = 1e-4;

export function insideCurve(motion: FxMotion): SkiaCurve {
  const phase = phaseOf(motion);
  const n = motion.frames ?? 1;
  const times = new Set<number>();
  for (let i = 0; i <= STEPS; i++) times.add(i / STEPS);
  for (let i = 0; i <= n; i++) times.add(i / n);
  for (const prop of ['tx', 'ty'] as const)
    for (const [k] of motion.keys[prop] ?? []) {
      const c = k - phase;
      times.add(c < 0 ? c + 1 : c);
    }
  const seam = 1 - phase;
  const at = (t: number) => {
    const c = t + phase;
    return c >= 1 ? c - 1 : c;
  };
  const points: [number, number, number][] = [...times]
    .filter((t) => t >= 0 && t <= 1 && Math.abs(t - seam) > SEAM / 2)
    .map((t) => [t, valueAt(motion, 'tx', at(t)), valueAt(motion, 'ty', at(t))]);
  points.push([seam - SEAM, valueAt(motion, 'tx', 1), valueAt(motion, 'ty', 1)]);
  points.push([seam, valueAt(motion, 'tx', 0), valueAt(motion, 'ty', 0)]);
  points.sort((a, b) => a[0] - b[0]);
  return {
    input: points.map((p) => p[0]),
    tx: points.map((p) => p[1]),
    ty: points.map((p) => p[2]),
  };
}

// A curve's value at `t`, straight between its points (on the UI thread).
export function curveAt(input: readonly number[], output: readonly number[], t: number): number {
  'worklet';
  const n = input.length;
  if (n === 0) return 0;
  if (t <= (input[0] ?? 0)) return output[0] ?? 0;
  if (t >= (input[n - 1] ?? 0)) return output[n - 1] ?? 0;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((input[mid] ?? 0) <= t) lo = mid;
    else hi = mid;
  }
  const a = input[lo] ?? 0;
  const b = input[hi] ?? 0;
  const f = b > a ? (t - a) / (b - a) : 0;
  const va = output[lo] ?? 0;
  return va + ((output[hi] ?? 0) - va) * f;
}

// What one canvas draws: where it stands in the drawing's view (`crop`, on whole pixels, as the
// picture way's clip), its mask over the whole canvas, its content `width` × `height` points, and
// how the content stands at a time of the clock: at (x, y) in the canvas, moved by (a·tx + c·ty,
// b·tx + d·ty) for the group's translate (its units taken to points by the groups' matrix).
export type SkiaPlan = {
  ms: number;
  crop: FxCrop;
  mask: string;
  content: string;
  width: number;
  height: number;
  curve: SkiaCurve;
  x: number;
  y: number;
  a: number;
  b: number;
  c: number;
  d: number;
};

// A pixel round the content's box, for its soft edge.
const EDGE_PT = 2;

// Null when the layer cannot be drawn this way (no motion, a transform or the content not read, an
// empty clip): the picture way draws it.
export function insidePlan(layer: FxInside, place: FxPlace, ratio: number): SkiaPlan | null {
  const motion = FX[layer.fx];
  if (!motion?.frames || !layer.matrix) return null;
  const m = layer.matrix;
  const drawn = defBox(`<mask>${layer.content}</mask>`, m);
  if (!drawn) return null;
  const pad = EDGE_PT / place.unit;
  const box: FxBox = [drawn[0] - pad, drawn[1] - pad, drawn[2] + 2 * pad, drawn[3] + 2 * pad];
  const crop = cropOf(layer.box, place, ratio);
  if (crop.width <= 0 || crop.height <= 0) return null;
  const u = place.unit;
  return {
    ms: motion.ms,
    crop,
    mask: insideMaskSvg(layer, crop.viewBox),
    content: insideContentSvg(layer, box),
    width: box[2] * u,
    height: box[3] * u,
    curve: insideCurve(motion),
    x: place.dx + (box[0] - place.bx) * u - crop.left,
    y: place.dy + (box[1] - place.by) * u - crop.top,
    a: m[0] * u,
    b: m[1] * u,
    c: m[2] * u,
    d: m[3] * u,
  };
}

// A plan's cache key: everything insidePlan reads (the layer's motion, groups, box, content and
// definitions, the place and the pixel ratio), so that equal keys make equal plans.
export function insidePlanKey(layer: FxInside, place: FxPlace, ratio: number): string {
  return `${placeKey(place, ratio)}|${layer.fx}|${layer.matrix?.join(' ') ?? '-'}|${layer.box.join(' ')}|${layer.outer.join('')}|${layer.content}|${layer.defs}`;
}

// What the UI thread reads of a plan (insideAt): the curve and the numbers, not the mask's and the
// content's texts, which a worklet would copy over with it.
export type SkiaAt = Pick<SkiaPlan, 'curve' | 'x' | 'y' | 'a' | 'b' | 'c' | 'd'>;

export function skiaAt(plan: SkiaPlan): SkiaAt {
  const { curve, x, y, a, b, c, d } = plan;
  return { curve, x, y, a, b, c, d };
}

// Where the content stands in its canvas when the clock is at `t` (on the UI thread).
export function insideAt(plan: SkiaAt, t: number): { x: number; y: number } {
  'worklet';
  const tx = curveAt(plan.curve.input, plan.curve.tx, t);
  const ty = curveAt(plan.curve.input, plan.curve.ty, t);
  return { x: plan.x + plan.a * tx + plan.c * ty, y: plan.y + plan.b * tx + plan.d * ty };
}

// A clock stopped part way first runs to the end of its cycle (the picture way's rule, FxSvg →
// hold): how long that takes, or null when it starts its cycle from the start.
export function clockLead(from: number, ms: number): number | null {
  return from <= 0 || from >= 1 ? null : ms * (1 - from);
}
