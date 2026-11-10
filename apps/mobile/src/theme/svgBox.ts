// Boxes in an SVG text, by hand (no dependency): an affine transform's matrix, a shape's box, a clip's
// or a mask's box. A box here may be larger than what is drawn, never smaller: a curve's box is its
// control points' box, a stroke's corner is taken at its miter limit.

// [a, b, c, d, e, f]: (x, y) → (a x + c y + e, b x + d y + f).
export type Matrix = readonly [number, number, number, number, number, number];
// [x, y, w, h].
export type Box = readonly [number, number, number, number];

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

// m after n: n applied first.
export function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

export function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

const NUM = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
const STICKY = new RegExp(NUM.source, 'y');

function numbers(text: string): number[] {
  return (text.match(NUM) ?? []).map(Number);
}

// A `transform` attribute's matrix; null when it holds what this does not read.
export function parseTransform(text: string): Matrix | null {
  let m: Matrix = IDENTITY;
  const rest = text.replace(/(\w+)\s*\(([^)]*)\)/g, (_all, name: string, args: string) => {
    const a = numbers(args);
    const [p = 0, q, r, s, t, u] = a;
    const rad = (deg: number) => (deg * Math.PI) / 180;
    let n: Matrix | null = null;
    switch (name) {
      case 'matrix':
        if (a.length === 6) n = [p, q ?? 0, r ?? 0, s ?? 0, t ?? 0, u ?? 0];
        break;
      case 'translate':
        n = [1, 0, 0, 1, p, q ?? 0];
        break;
      case 'scale':
        n = [p, 0, 0, q ?? p, 0, 0];
        break;
      case 'rotate': {
        const c = Math.cos(rad(p));
        const sn = Math.sin(rad(p));
        const cx = q ?? 0;
        const cy = r ?? 0;
        n = [c, sn, -sn, c, cx - c * cx + sn * cy, cy - sn * cx - c * cy];
        break;
      }
      case 'skewX':
        n = [1, 0, Math.tan(rad(p)), 1, 0, 0];
        break;
      case 'skewY':
        n = [1, Math.tan(rad(p)), 0, 1, 0, 0];
        break;
      default:
        n = null;
    }
    if (!n || a.some(Number.isNaN)) {
      m = [NaN, 0, 0, 0, 0, 0];
      return '';
    }
    m = multiply(m, n);
    return '';
  });
  if (rest.replace(/[\s,]/g, '') !== '' || Number.isNaN(m[0])) return null;
  return m;
}

// Points whose box holds a path (its ends and its curves' control points; an arc's ellipse). Null
// when the path is not read.
export function pathPoints(d: string): [number, number][] | null {
  const out: [number, number][] = [];
  let i = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i] ?? '')) i++;
  };
  const num = (): number | null => {
    skip();
    STICKY.lastIndex = i;
    const hit = STICKY.exec(d);
    if (!hit) return null;
    i += hit[0].length;
    return Number(hit[0]);
  };
  const flag = (): number | null => {
    skip();
    const c = d[i];
    if (c !== '0' && c !== '1') return null;
    i++;
    return c === '1' ? 1 : 0;
  };
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  // The last curve's second control point, for S and T.
  let cx = 0;
  let cy = 0;
  let last = '';
  let cmd = '';
  for (;;) {
    skip();
    if (i >= d.length) break;
    const c = d[i] ?? '';
    if (/[A-Za-z]/.test(c)) {
      cmd = c;
      i++;
    } else if (cmd === '' || cmd === 'Z' || cmd === 'z') return null;
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    const rel = cmd === cmd.toLowerCase();
    const up = cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    const pair = (): [number, number] | null => {
      const a = num();
      const b = num();
      return a === null || b === null ? null : [a + ox, b + oy];
    };
    switch (up) {
      case 'Z':
        x = sx;
        y = sy;
        break;
      case 'M':
      case 'L':
      case 'T': {
        const p = pair();
        if (!p) return null;
        if (up === 'T') {
          const q: [number, number] =
            last === 'Q' || last === 'T' ? [2 * x - cx, 2 * y - cy] : [x, y];
          out.push(q);
          [cx, cy] = q;
        }
        [x, y] = p;
        if (up === 'M') [sx, sy] = p;
        out.push(p);
        break;
      }
      case 'H': {
        const a = num();
        if (a === null) return null;
        x = a + ox;
        out.push([x, y]);
        break;
      }
      case 'V': {
        const a = num();
        if (a === null) return null;
        y = a + oy;
        out.push([x, y]);
        break;
      }
      case 'C':
      case 'S':
      case 'Q': {
        const first: [number, number] | null =
          up === 'S' ? (last === 'C' || last === 'S' ? [2 * x - cx, 2 * y - cy] : [x, y]) : null;
        const p1 = up === 'S' ? first : pair();
        const p2 = up === 'Q' ? null : pair();
        const end = pair();
        if (!p1 || !end || (up !== 'Q' && !p2)) return null;
        out.push(p1, end);
        if (p2) out.push(p2);
        [cx, cy] = p2 ?? p1;
        [x, y] = end;
        break;
      }
      case 'A': {
        const rx = num();
        const ry = num();
        const rot = num();
        const large = flag();
        const sweep = flag();
        const end = pair();
        if (rx === null || ry === null || rot === null || large === null || sweep === null || !end)
          return null;
        // The ellipse (its radii grown when too small for the chord, as SVG does) holds the arc:
        // every point of it is within two radii of its start.
        const phi = (rot * Math.PI) / 180;
        const hx = (x - end[0]) / 2;
        const hy = (y - end[1]) / 2;
        const px = Math.cos(phi) * hx + Math.sin(phi) * hy;
        const py = -Math.sin(phi) * hx + Math.cos(phi) * hy;
        const ax = Math.abs(rx);
        const ay = Math.abs(ry);
        const lambda = ax > 0 && ay > 0 ? (px * px) / (ax * ax) + (py * py) / (ay * ay) : 0;
        const r = Math.max(ax, ay) * Math.max(1, Math.sqrt(lambda));
        if (ax > 0 && ay > 0) {
          out.push([x - 2 * r, y - 2 * r], [x + 2 * r, y + 2 * r]);
        }
        out.push(end);
        [x, y] = end;
        break;
      }
      default:
        return null;
    }
    last = up;
  }
  return out;
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

function n(tag: string, name: string, fallback = 0): number {
  const v = attr(tag, name);
  const num = v === undefined ? fallback : Number.parseFloat(v);
  return Number.isNaN(num) ? fallback : num;
}

// A shape's local box, without its stroke; null when it is not read.
export function shapeBox(tag: string): Box | null {
  const name = /^<([\w:-]+)/.exec(tag)?.[1] ?? '';
  let pts: [number, number][] | null = null;
  switch (name) {
    case 'rect': {
      const w = n(tag, 'width');
      const h = n(tag, 'height');
      return [n(tag, 'x'), n(tag, 'y'), w, h];
    }
    case 'circle': {
      const r = n(tag, 'r');
      return [n(tag, 'cx') - r, n(tag, 'cy') - r, 2 * r, 2 * r];
    }
    case 'ellipse': {
      const rx = n(tag, 'rx');
      const ry = n(tag, 'ry');
      return [n(tag, 'cx') - rx, n(tag, 'cy') - ry, 2 * rx, 2 * ry];
    }
    case 'line':
      pts = [
        [n(tag, 'x1'), n(tag, 'y1')],
        [n(tag, 'x2'), n(tag, 'y2')],
      ];
      break;
    case 'polygon':
    case 'polyline': {
      const a = numbers(attr(tag, 'points') ?? '');
      pts = [];
      for (let i = 0; i + 1 < a.length; i += 2) pts.push([a[i] ?? 0, a[i + 1] ?? 0]);
      break;
    }
    case 'path':
      pts = pathPoints(attr(tag, 'd') ?? '');
      break;
    default:
      return null;
  }
  if (!pts) return null;
  if (pts.length === 0) return [0, 0, 0, 0];
  return around(pts);
}

function around(pts: readonly (readonly [number, number])[]): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [x0, y0, x1 - x0, y1 - y0];
}

// A box under a matrix: the box round its four corners.
export function boxUnder(m: Matrix, b: Box): Box {
  const [x, y, w, h] = b;
  return around([apply(m, x, y), apply(m, x + w, y), apply(m, x, y + h), apply(m, x + w, y + h)]);
}

export function union(a: Box | null, b: Box): Box {
  if (!a) return b;
  const x0 = Math.min(a[0], b[0]);
  const y0 = Math.min(a[1], b[1]);
  return [x0, y0, Math.max(a[0] + a[2], b[0] + b[2]) - x0, Math.max(a[1] + a[3], b[1] + b[3]) - y0];
}

// The common part of two boxes; null when they do not meet.
export function intersect(a: Box, b: Box): Box | null {
  const x0 = Math.max(a[0], b[0]);
  const y0 = Math.max(a[1], b[1]);
  const x1 = Math.min(a[0] + a[2], b[0] + b[2]);
  const y1 = Math.min(a[1] + a[3], b[1] + b[3]);
  return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
}

const SHAPES = /^<(path|circle|ellipse|rect|line|polygon|polyline)\b/;
// Drawn things this does not read: a clip or a mask holding one has no box.
const UNREAD = /^<(use|image|text|foreignObject|svg|switch|pattern)\b/;
// Not drawn where they stand.
const HIDDEN =
  /^<(defs|clipPath|mask|linearGradient|radialGradient|pattern|symbol|marker|filter)\b/;
const STROKE_PROPS = [
  'stroke',
  'stroke-width',
  'stroke-linejoin',
  'stroke-linecap',
  'stroke-miterlimit',
] as const;
type Stroke = Partial<Record<(typeof STROKE_PROPS)[number], string>>;

function strokeOf(tag: string, inherited: Stroke): Stroke {
  const s: Stroke = { ...inherited };
  for (const p of STROKE_PROPS) {
    const v = attr(tag, p);
    if (v !== undefined) s[p] = v;
  }
  return s;
}

// How far a stroke reaches out of its shape's outline: half its width, at a corner up to its
// miter limit (a square cap: √2).
function strokePad(s: Stroke, round: boolean): number {
  if (!s.stroke || s.stroke === 'none') return 0;
  const half = (Number.parseFloat(s['stroke-width'] ?? '1') || 0) / 2;
  if (round) return half;
  const join = s['stroke-linejoin'] ?? 'miter';
  const miter = join === 'miter' || join === 'miter-clip' || join === 'arcs';
  const limit = Number.parseFloat(s['stroke-miterlimit'] ?? '4') || 4;
  const cap = s['stroke-linecap'] === 'square' ? Math.SQRT2 : 1;
  return half * Math.max(miter ? Math.max(limit, 1) : 1, cap);
}

// A `<clipPath>…</clipPath>` or `<mask>…</mask>` definition's box in the user space it is used in,
// `m` taking that space to the box's. A clip draws its shapes' outlines (a stroke does not count),
// a mask its shapes with their strokes; a mask's own region in user space (maskUnits
// userSpaceOnUse) bounds it too. Null when it cannot be read (units of the object's box, a use).
export function defBox(def: string, m: Matrix): Box | null {
  const tokens = def.match(/<[^>]+>/g) ?? [];
  const head = tokens[0] ?? '';
  const kind = /^<(clipPath|mask)\b/.exec(head)?.[1];
  if (!kind) return null;
  if (kind === 'clipPath' && attr(head, 'clipPathUnits') === 'objectBoundingBox') return null;
  if (kind === 'mask' && attr(head, 'maskContentUnits') === 'objectBoundingBox') return null;
  let base = m;
  const own = attr(head, 'transform');
  if (own !== undefined) {
    const t = parseTransform(own);
    if (!t) return null;
    base = multiply(m, t);
  }
  type Frame = { m: Matrix; stroke: Stroke; hidden: boolean };
  const stack: Frame[] = [{ m: base, stroke: {}, hidden: false }];
  let box: Box | null = null;
  for (let i = 1; i < tokens.length - 1; i++) {
    const t = tokens[i] ?? '';
    const top = stack[stack.length - 1];
    if (!top) return null;
    if (t.startsWith('</')) {
      stack.pop();
      continue;
    }
    const tr = attr(t, 'transform');
    const tm = tr === undefined ? IDENTITY : parseTransform(tr);
    if (!tm) return null;
    const here: Frame = {
      m: multiply(top.m, tm),
      stroke: strokeOf(t, top.stroke),
      hidden: top.hidden || HIDDEN.test(t),
    };
    if (!here.hidden) {
      if (UNREAD.test(t)) return null;
      if (SHAPES.test(t)) {
        const b = shapeBox(t);
        if (!b) return null;
        const pad = kind === 'mask' ? strokePad(here.stroke, /^<(circle|ellipse)\b/.test(t)) : 0;
        box = union(
          box,
          boxUnder(here.m, [b[0] - pad, b[1] - pad, b[2] + 2 * pad, b[3] + 2 * pad]),
        );
      }
    }
    if (!t.endsWith('/>')) stack.push(here);
  }
  if (!box) return null;
  if (kind === 'mask' && attr(head, 'maskUnits') === 'userSpaceOnUse') {
    const r = ['x', 'y', 'width', 'height'].map((a) => attr(head, a));
    if (r.every((v) => v !== undefined && !Number.isNaN(Number.parseFloat(v)))) {
      const [x, y, w, h] = r.map((v) => Number.parseFloat(v ?? '0'));
      const region = boxUnder(m, [x ?? 0, y ?? 0, w ?? 0, h ?? 0]);
      return intersect(box, region) ?? [box[0], box[1], 0, 0];
    }
  }
  return box;
}
