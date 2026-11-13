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
  type FxLayer,
  type FxMotion,
  type FxPlace,
  type FxProp,
  phaseOf,
  placeKey,
  sampled,
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

// ---------------------------------------------------------------------------------------------
// The whole drawing on one canvas (docs/decisions/skia-build-plani.md → "Bütün kapsül Skia'da"):
// every layer of fxTree drawn by Skia, none of them a view. The picture way makes a native view of
// each SVG element and draws each layer's picture on the UI thread the frame it is first shown: a
// look put on whole (Süsle's dice) held that frame for seconds (docs/perf/akicilik-denetimi.md →
// 4.2, A-01). Behind its own switch until the two are compared on a phone.

// Off: the pictures (and P6's canvases for the motions inside a clip) as before. Çizim ölçümü's
// "Bütün kapsül Skia" turns it on for that phone on a preview build (lib/drawLab.ts → useLabWhole).
export const CAPSULE_SKIA_WHOLE = false;

export function capsuleWholeOn(os: string, lab: boolean): boolean {
  return lab || (CAPSULE_SKIA_WHOLE && capsuleSkiaOn(os));
}

// A property along the clock (capsuleFx.ts → sampled), read on the UI thread by curveAt.
export type WholeCurve = { input: number[]; output: number[] };

// A moving layer's motion in the canvas's points: its pivot, and each property it moves (a
// translate in points, a turn and a skew in radians).
export type WholeMove = {
  ms: number;
  ox: number;
  oy: number;
  tx: WholeCurve | null;
  ty: WholeCurve | null;
  rotate: WholeCurve | null;
  scale: WholeCurve | null;
  sx: WholeCurve | null;
  sy: WholeCurve | null;
  skewX: WholeCurve | null;
  opacity: WholeCurve | null;
};

export type WholeLayer =
  | { kind: 'still'; xml: string }
  | { kind: 'inside'; plan: SkiaPlan }
  | { kind: 'move'; move: WholeMove; layers: WholeLayer[] };

const RAD = Math.PI / 180;

function wholeCurve(motion: FxMotion, prop: FxProp, scale: number): WholeCurve | null {
  if (!motion.keys[prop]) return null;
  const r = sampled(motion, prop, scale);
  return { input: r.inputRange, output: r.outputRange };
}

// The picture way's Move (components/FxSvg.tsx), as numbers: the same pivot, the same samples.
export function wholeMove(
  layer: Extract<FxLayer, { kind: 'move' }>,
  place: FxPlace,
): WholeMove | null {
  const motion = FX[layer.fx];
  if (!motion) return null;
  const px = layer.k * place.unit;
  return {
    ms: motion.ms,
    ox: place.dx + (layer.x - place.bx) * place.unit,
    oy: place.dy + (layer.y - place.by) * place.unit,
    tx: wholeCurve(motion, 'tx', px),
    ty: wholeCurve(motion, 'ty', px),
    rotate: wholeCurve(motion, 'rotate', RAD),
    scale: wholeCurve(motion, 'scale', 1),
    sx: wholeCurve(motion, 'sx', 1),
    sy: wholeCurve(motion, 'sy', 1),
    skewX: wholeCurve(motion, 'skewX', RAD),
    opacity: wholeCurve(motion, 'opacity', 1),
  };
}

type PlanOf = (layer: FxInside, place: FxPlace, ratio: number) => SkiaPlan | null;

// A drawing's layers as the canvas draws them, in the drawing's order. Null when one of them cannot
// be drawn this way (a motion inside its clip with no plan): the picture way draws the drawing
// then, whole. A moving layer whose motion is not known is its layers, unmoved (as FxSvg draws it).
export function wholeLayers(
  layers: readonly FxLayer[],
  place: FxPlace,
  ratio: number,
  plan: PlanOf = insidePlan,
): WholeLayer[] | null {
  const out: WholeLayer[] = [];
  for (const l of layers) {
    if (l.kind === 'still') out.push({ kind: 'still', xml: l.xml });
    else if (l.kind === 'inside') {
      const p = plan(l, place, ratio);
      if (!p) return null;
      out.push({ kind: 'inside', plan: p });
    } else {
      const inner = wholeLayers(l.layers, place, ratio, plan);
      if (!inner) return null;
      const move = wholeMove(l, place);
      if (move) out.push({ kind: 'move', move, layers: inner });
      else out.push(...inner);
    }
  }
  return out;
}

// The move's matrix when the clock is at `t`, as React Native composes the picture way's style
// (translateX, translateY, rotate, scale, scaleX, scaleY, skewX, in that order, about the pivot):
// a 4 × 4 in rows, as Skia's Group takes it. Written out here: Skia's own skewX is the other axis's.
export function moveMatrixAt(m: WholeMove, t: number): number[] {
  'worklet';
  const v = (c: WholeCurve | null, none: number) => (c ? curveAt(c.input, c.output, t) : none);
  // x' = a·x + c·y + e, y' = b·x + d·y + f; starts as the move to the pivot and the translate.
  let a = 1;
  let b = 0;
  let c = 0;
  let d = 1;
  const e = m.ox + v(m.tx, 0);
  const f = m.oy + v(m.ty, 0);
  const by = (a2: number, b2: number, c2: number, d2: number) => {
    const na = a * a2 + c * b2;
    const nb = b * a2 + d * b2;
    const nc = a * c2 + c * d2;
    const nd = b * c2 + d * d2;
    a = na;
    b = nb;
    c = nc;
    d = nd;
  };
  if (m.rotate) {
    const r = v(m.rotate, 0);
    by(Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r));
  }
  if (m.scale) {
    const s = v(m.scale, 1);
    by(s, 0, 0, s);
  }
  if (m.sx) by(v(m.sx, 1), 0, 0, 1);
  if (m.sy) by(1, 0, 0, v(m.sy, 1));
  if (m.skewX) by(1, 0, Math.tan(v(m.skewX, 0)), 1);
  // Back from the pivot.
  const tx = e - a * m.ox - c * m.oy;
  const ty = f - b * m.ox - d * m.oy;
  return [a, c, 0, tx, b, d, 0, ty, 0, 0, 1, 0, 0, 0, 0, 1];
}

export function moveOpacityAt(m: WholeMove, t: number): number {
  'worklet';
  return m.opacity ? curveAt(m.opacity.input, m.opacity.output, t) : 1;
}
