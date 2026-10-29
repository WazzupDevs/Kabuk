import { TABLE } from './vampirTable';

// Where the round table's people sit and how its lines run (docs/design/vampir/yuvarlak-masa.html:
// ring() and lines()), in the table's frame.
export type Point = readonly [number, number];

const { cx: CX, cy: CY } = TABLE.frame;

// `n` seats on the seats' ellipse at even steps along it, the first (the person) at the bottom,
// then round to the left.
export function ring(n: number, rx: number = TABLE.seat.rx, ry: number = TABLE.seat.ry): Point[] {
  const steps = 1440;
  const pts: Point[] = [];
  const len: number[] = [0];
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI / 2 + (i / steps) * Math.PI * 2;
    pts.push([CX + rx * Math.cos(a), CY + ry * Math.sin(a)]);
    if (i > 0) {
      const p = pts[i - 1] as Point;
      const q = pts[i] as Point;
      len.push((len[i - 1] ?? 0) + Math.hypot(q[0] - p[0], q[1] - p[1]));
    }
  }
  const total = len[steps] ?? 0;
  return Array.from({ length: n }, (_, k) => {
    const at = len.findIndex((v) => v >= (k / n) * total);
    return pts[Math.max(0, at)] as Point;
  });
}

// A line from one seat to another: a curve bowing away from the table's middle (so it never runs
// under the medallion), cut short of both faces. The curve's start, its two controls and its end.
export type Curve = { a: Point; c1: Point; c2: Point; b: Point };

export function curveBetween(from: Point, to: Point, face: number): Curve {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  let side = ((x1 + x2) / 2 - CX) * nx + ((y1 + y2) / 2 - CY) * ny;
  if (side < 0) {
    nx = -nx;
    ny = -ny;
    side = -side;
  }
  const d = Math.max(MIN_BOW, (TABLE.clear - side) / 0.75);
  const c1: Point = [x1 + dx * PULL + nx * d, y1 + dy * PULL + ny * d];
  const c2: Point = [x2 - dx * PULL + nx * d, y2 - dy * PULL + ny * d];
  const r = face / 2 + CUT;
  const cut = (p: Point, c: Point): Point => {
    const k = Math.hypot(c[0] - p[0], c[1] - p[1]) || 1;
    return [p[0] + ((c[0] - p[0]) / k) * r, p[1] + ((c[1] - p[1]) / k) * r];
  };
  return { a: cut(from, c1), c1, c2, b: cut(to, c2) };
}
const MIN_BOW = 16;
const PULL = 0.22;
const CUT = 6;

export function curvePath(c: Curve): string {
  const f = (p: Point) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  return `M${f(c.a)}C${f(c.c1)} ${f(c.c2)} ${f(c.b)}`;
}

function at(c: Curve, t: number): Point {
  const u = 1 - t;
  const x =
    u * u * u * c.a[0] + 3 * u * u * t * c.c1[0] + 3 * u * t * t * c.c2[0] + t * t * t * c.b[0];
  const y =
    u * u * u * c.a[1] + 3 * u * u * t * c.c1[1] + 3 * u * t * t * c.c2[1] + t * t * t * c.b[1];
  return [x, y];
}

// The curve measured: points at even lengths along it, so dashes can ride it.
export function measure(c: Curve, steps = 200): { length: number; pointAt: (s: number) => Point } {
  const pts: Point[] = [];
  const len: number[] = [0];
  for (let i = 0; i <= steps; i++) {
    pts.push(at(c, i / steps));
    if (i > 0) {
      const p = pts[i - 1] as Point;
      const q = pts[i] as Point;
      len.push((len[i - 1] ?? 0) + Math.hypot(q[0] - p[0], q[1] - p[1]));
    }
  }
  const length = len[steps] ?? 0;
  const pointAt = (s: number): Point => {
    const v = Math.max(0, Math.min(length, s));
    const i = len.findIndex((l) => l >= v);
    if (i <= 0) return pts[0] as Point;
    const l0 = len[i - 1] ?? 0;
    const l1 = len[i] ?? l0;
    const p = pts[i - 1] as Point;
    const q = pts[i] as Point;
    const k = l1 > l0 ? (v - l0) / (l1 - l0) : 0;
    return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  };
  return { length, pointAt };
}
