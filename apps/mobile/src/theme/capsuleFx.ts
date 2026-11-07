// The pack accessories' motions (docs/SPEC_V4.md §4.U, 7 Kasım: an Efsanevi's wiggle, its sparks and
// its halo, a Destansı's sliding shine), taken from the boards' CSS keyframes (AksesuarDestansi,
// AksesuarEfsanevi, PaketElf, PaketNinja: `@keyframes fx…`, `.fx-…`). A moving group in a drawing is
// a `<g data-fx="name" data-o="x y" data-k="k">` (capsuleAccessories.ts): its motion, its origin and
// how many of the drawing's units one of its own is. The drawing is cut into layers (fxTree) that
// are each drawn once; a layer moves as a picture on the native driver (components/FxSvg.tsx), as
// the blink does (LayeredLook). A motion inside a clip or a mask (the shine, the scarf's stripes,
// the neon scan) moves inside its picture, so it is a few pictures shown in turn (`frames`).
// The boards' colour flow (hue-rotate, a gradient's colour) has no counterpart in react-native-svg
// and stays still. With reduce motion every one stays still (the boards: animation none).

export type FxProp = 'tx' | 'ty' | 'rotate' | 'scale' | 'sx' | 'sy' | 'skewX' | 'opacity';
type Keys = readonly (readonly [number, number])[];
type Ease = 'io' | 'out' | 'linear';
export type FxMotion = {
  ms: number;
  // CSS animation-delay: a negative one starts part way, a positive one is taken as the same phase.
  delay?: number;
  ease: Ease;
  keys: Partial<Record<FxProp, Keys>>;
  // Moves inside its picture: shown as this many pictures a cycle.
  frames?: number;
};

const SWING: Keys = [
  [0, -7],
  [0.5, 7],
  [1, -7],
];
const TW: FxMotion = {
  ms: 1600,
  ease: 'io',
  keys: {
    scale: [
      [0, 0.3],
      [0.5, 1.15],
      [1, 0.3],
    ],
    opacity: [
      [0, 0.2],
      [0.5, 1],
      [1, 0.2],
    ],
  },
};
const FLICK: Pick<FxMotion, 'ease' | 'keys'> = {
  ease: 'io',
  keys: {
    sy: [
      [0, 1],
      [0.3, 1.18],
      [0.65, 0.9],
      [1, 1],
    ],
    skewX: [
      [0, 0],
      [0.3, -4],
      [0.65, 3],
      [1, 0],
    ],
  },
};
const ORB: FxMotion = {
  ms: 4000,
  ease: 'linear',
  keys: {
    tx: [
      [0, 44],
      [0.25, 0],
      [0.5, -44],
      [0.75, 0],
      [1, 44],
    ],
    ty: [
      [0, 0],
      [0.25, 11],
      [0.5, 0],
      [0.75, -11],
      [1, 0],
    ],
    scale: [
      [0, 1],
      [0.25, 1.25],
      [0.5, 1],
      [0.75, 0.7],
      [1, 1],
    ],
  },
};
const HEART: FxMotion = {
  ms: 2400,
  ease: 'out',
  keys: {
    ty: [
      [0, 16],
      [1, -40],
    ],
    scale: [
      [0, 0.4],
      [1, 1],
    ],
    opacity: [
      [0, 0],
      [0.2, 1],
      [1, 0],
    ],
  },
};
const SWAY: FxMotion = { ms: 2200, ease: 'io', keys: { rotate: SWING } };
const FIREFLY: FxMotion = {
  ms: 3200,
  ease: 'io',
  keys: {
    tx: [
      [0, 0],
      [0.25, 4],
      [0.5, -3],
      [0.75, -5],
      [1, 0],
    ],
    ty: [
      [0, 0],
      [0.25, -5],
      [0.5, -9],
      [0.75, -3],
      [1, 0],
    ],
    opacity: [
      [0, 0.3],
      [0.25, 1],
      [0.5, 0.6],
      [0.75, 1],
      [1, 0.3],
    ],
  },
};
const TWITCH: FxMotion = {
  ms: 3600,
  ease: 'io',
  keys: {
    rotate: [
      [0, 0],
      [0.8, 0],
      [0.85, -8],
      [0.9, 4],
      [1, 0],
    ],
  },
};
const WING: FxMotion = {
  ms: 700,
  ease: 'io',
  keys: {
    sx: [
      [0, 1],
      [0.5, 0.55],
      [1, 1],
    ],
  },
};

export const FX: Readonly<Record<string, FxMotion>> = {
  halo: {
    ms: 2400,
    ease: 'io',
    keys: {
      scale: [
        [0, 0.9],
        [0.5, 1.04],
        [1, 0.9],
      ],
      opacity: [
        [0, 0.75],
        [0.5, 1],
        [1, 0.75],
      ],
    },
  },
  spinfast: {
    ms: 3000,
    ease: 'linear',
    keys: {
      rotate: [
        [0, 0],
        [1, 360],
      ],
    },
  },
  // `.njrev`: the other way round, in 2.4 s.
  spinrev: {
    ms: 2400,
    ease: 'linear',
    keys: {
      rotate: [
        [0, 360],
        [1, 0],
      ],
    },
  },
  bob: {
    ms: 2400,
    ease: 'io',
    keys: {
      ty: [
        [0, 0],
        [0.5, -2.5],
        [1, 0],
      ],
    },
  },
  tw1: TW,
  tw2: { ...TW, delay: 500 },
  tw3: { ...TW, delay: 1000 },
  flick: { ...FLICK, ms: 900 },
  flick2: { ...FLICK, ms: 900, delay: 300 },
  fl1: { ...FLICK, ms: 1100 },
  fl2: { ...FLICK, ms: 850, delay: 200 },
  fl3: { ...FLICK, ms: 700, delay: 100 },
  rise: {
    ms: 1800,
    ease: 'out',
    keys: {
      ty: [
        [0, 8],
        [1, -14],
      ],
      opacity: [
        [0, 0],
        [0.25, 1],
        [1, 0],
      ],
    },
  },
  rain: {
    ms: 900,
    ease: 'linear',
    keys: {
      ty: [
        [0, -6],
        [1, 10],
      ],
      opacity: [
        [0, 0],
        [0.3, 1],
        [1, 0],
      ],
    },
  },
  flash: {
    ms: 3000,
    ease: 'linear',
    keys: {
      opacity: [
        [0, 0],
        [0.4, 0],
        [0.44, 1],
        [0.48, 0],
        [0.52, 1],
        [0.56, 0],
        [0.6, 1],
        [0.9, 1],
        [1, 0],
      ],
    },
  },
  wingL: WING,
  wingR: WING,
  wave: { ms: 1600, ease: 'io', keys: { rotate: SWING } },
  wave2: { ms: 1600, ease: 'io', delay: -800, keys: { rotate: SWING } },
  shift: {
    ms: 3000,
    ease: 'linear',
    frames: 24,
    keys: {
      tx: [
        [0, 0],
        [1, 36],
      ],
    },
  },
  orb1: ORB,
  orb2: { ...ORB, delay: -1330 },
  orb3: { ...ORB, delay: -2660 },
  // `alternate`: there and back, each way 1.6 s.
  scan: {
    ms: 3200,
    ease: 'io',
    frames: 24,
    keys: {
      ty: [
        [0, 0],
        [0.5, 26],
        [1, 0],
      ],
    },
  },
  glow: {
    ms: 1200,
    ease: 'io',
    keys: {
      opacity: [
        [0, 0.35],
        [0.5, 1],
        [1, 0.35],
      ],
    },
  },
  hr0: HEART,
  hr1: { ...HEART, delay: 600 },
  hr2: { ...HEART, delay: 1200 },
  hr3: { ...HEART, delay: 1800 },
  glint: {
    ms: 3000,
    ease: 'io',
    frames: 40,
    keys: {
      tx: [
        [0, -70],
        [0.55, -70],
        [1, 90],
      ],
    },
  },
  sway0: SWAY,
  sway1: { ...SWAY, delay: -700 },
  sway2: { ...SWAY, delay: -1400 },
  ff0: FIREFLY,
  ff1: { ...FIREFLY, delay: -1000 },
  ff2: { ...FIREFLY, delay: -2000 },
  twitch0: TWITCH,
  twitch1: { ...TWITCH, delay: -200 },
  // The Ninja balloon's ornaments (BalonNinja `.n2spin`, `.n2rib`, `.n2puff`, `.n2moon`).
  n2spin: {
    ms: 1600,
    ease: 'linear',
    keys: {
      rotate: [
        [0, 0],
        [1, 360],
      ],
    },
  },
  n2rib: {
    ms: 1600,
    ease: 'io',
    keys: {
      rotate: [
        [0, 0],
        [0.5, 9],
        [1, 0],
      ],
    },
  },
  n2puff: {
    ms: 3000,
    ease: 'io',
    keys: {
      tx: [
        [0, 0],
        [0.5, 2],
        [1, 0],
      ],
      ty: [
        [0, 0],
        [0.5, -3],
        [1, 0],
      ],
      scale: [
        [0, 1],
        [0.5, 1.1],
        [1, 1],
      ],
      opacity: [
        [0, 0.9],
        [0.5, 0.6],
        [1, 0.9],
      ],
    },
  },
  n2moon: {
    ms: 2400,
    ease: 'io',
    keys: {
      opacity: [
        [0, 0.85],
        [0.5, 1],
        [1, 0.85],
      ],
    },
  },
  pulse: {
    ms: 1800,
    ease: 'io',
    keys: {
      scale: [
        [0, 0.85],
        [0.5, 1.15],
        [1, 0.85],
      ],
      opacity: [
        [0, 0.6],
        [0.5, 1],
        [1, 0.6],
      ],
    },
  },
};

// CSS's timing functions: ease-in-out, ease-out.
function bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const at = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s;
  return (t) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < t) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}
const EASE: Record<Ease, (t: number) => number> = {
  io: bezier(0.42, 0, 0.58, 1),
  out: bezier(0, 0, 0.58, 1),
  linear: (t) => t,
};

// A property's value at `t` of a cycle (0…1), the timing function on each step between keyframes.
export function valueAt(motion: FxMotion, prop: FxProp, t: number): number {
  const keys = motion.keys[prop];
  if (!keys || keys.length === 0) return prop === 'opacity' || prop.startsWith('s') ? 1 : 0;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (!a || !b) continue;
    if (t <= b[0]) {
      const span = b[0] - a[0];
      const f = span > 0 ? EASE[motion.ease]((t - a[0]) / span) : 1;
      return a[1] + (b[1] - a[1]) * f;
    }
  }
  return keys[keys.length - 1]?.[1] ?? 0;
}

// Where the cycle stands when its clock (0…1 every `ms`) is at 0.
function phaseOf(motion: FxMotion): number {
  const p = -(motion.delay ?? 0) / motion.ms;
  return p - Math.floor(p);
}

const SAMPLES = 48;

// A property along the clock, for Animated's interpolate: the cycle sampled (the keyframes and 48
// steps), started at its phase.
export function sampled(
  motion: FxMotion,
  prop: FxProp,
  scale = 1,
): { inputRange: number[]; outputRange: number[] } {
  const phase = phaseOf(motion);
  const at = (t: number) => {
    const c = t + phase;
    return valueAt(motion, prop, c >= 1 ? c - 1 : c) * scale;
  };
  const times = new Set<number>();
  for (let i = 0; i <= SAMPLES; i++) times.add(i / SAMPLES);
  for (const [k] of motion.keys[prop] ?? []) {
    const c = k - phase;
    times.add(c < 0 ? c + 1 : c);
  }
  const seam = 1 - phase;
  const points = [...times]
    .filter((t) => t >= 0 && t <= 1 && !(phase > 0 && Math.abs(t - seam) < 1e-9))
    .map((t) => [t, at(t)] as const);
  // The cycle's end and its start meet where the clock is at 1 - phase: both sides of it.
  if (phase > 0) {
    points.push([seam - 1e-4, valueAt(motion, prop, 1) * scale]);
    points.push([seam, valueAt(motion, prop, 0) * scale]);
  }
  points.sort((a, b) => a[0] - b[0]);
  return { inputRange: points.map((p) => p[0]), outputRange: points.map((p) => p[1]) };
}

// A motion inside its picture: its pictures (a translate in the group's own units) and when each
// shows, as parts of the clock. Pictures that do not differ are one.
export type FxFrame = { from: number; to: number; tx: number; ty: number };

export function framesOf(motion: FxMotion): FxFrame[] {
  const n = motion.frames ?? 1;
  const phase = phaseOf(motion);
  const out: FxFrame[] = [];
  for (let i = 0; i < n; i++) {
    const c = i / n + phase;
    const t = c >= 1 ? c - 1 : c;
    const tx = Math.round(valueAt(motion, 'tx', t) * 100) / 100;
    const ty = Math.round(valueAt(motion, 'ty', t) * 100) / 100;
    const last = out[out.length - 1];
    if (last && last.tx === tx && last.ty === ty) last.to = (i + 1) / n;
    else out.push({ from: i / n, to: (i + 1) / n, tx, ty });
  }
  return out;
}

// --- The drawing cut into layers -------------------------------------------------------------

export type FxLayer =
  | { kind: 'still'; xml: string }
  | { kind: 'move'; fx: string; x: number; y: number; k: number; layers: FxLayer[] }
  | { kind: 'frames'; fx: string; frames: { from: number; to: number; xml: string }[] };

export type FxTree = { box: [number, number, number, number]; layers: FxLayer[] };

const MARK = / data-fx="([^"]*)" data-o="(-?[\d.]+) (-?[\d.]+)" data-k="([\d.]+)"/;
const MARKS = / data-fx="[^"]*" data-o="[^"]*" data-k="[^"]*"/g;
const HOISTED = /^<(defs|clipPath|mask|linearGradient|radialGradient)\b/;
const DRAWS = /^<(path|circle|rect|ellipse|line|polygon|polyline|use|image|text)\b/;

// The drawing with its motions' marks taken out: what stays still (reduce motion, a picture).
export function stillSvg(svg: string): string {
  return svg.replace(MARKS, '');
}

function isClose(tok: string): boolean {
  return tok.startsWith('</');
}
function isOpen(tok: string): boolean {
  return tok.startsWith('<') && !tok.startsWith('</') && !tok.endsWith('/>');
}
function nameOf(tok: string): string {
  return /^<\/?([\w:-]+)/.exec(tok)?.[1] ?? '';
}

// The index of the token that closes the one opened at `at`.
function closing(tokens: readonly string[], at: number): number {
  let depth = 0;
  for (let i = at; i < tokens.length; i++) {
    const t = tokens[i] ?? '';
    if (isOpen(t)) depth++;
    else if (isClose(t)) depth--;
    if (depth === 0) return i;
  }
  return tokens.length - 1;
}

const closeAll = (stack: readonly string[]) =>
  stack
    .map((t) => `</${nameOf(t)}>`)
    .reverse()
    .join('');

// The drawing as layers, or null when nothing in it moves. Every layer is a whole SVG with the
// drawing's box and all its definitions (clips, masks, gradients), the groups round it opened again.
export function fxTree(svg: string): FxTree | null {
  if (!MARK.test(svg)) return null;
  const root = /^<svg\b[^>]*>/.exec(svg)?.[0];
  const box = root ? /viewBox="([^"]*)"/.exec(root)?.[1] : undefined;
  if (!root || !box || !svg.endsWith('</svg>')) return null;
  const nums = box.split(/[\s,]+/).map(Number);
  const [bx, by, bw, bh] = nums;
  if (
    bx === undefined ||
    by === undefined ||
    bw === undefined ||
    bh === undefined ||
    nums.some(Number.isNaN)
  )
    return null;
  const all = svg.slice(root.length, svg.length - '</svg>'.length).match(/<[^>]+>/g) ?? [];
  // The definitions, wherever they stand, go to the head of every layer.
  const defs: string[] = [];
  const body: string[] = [];
  for (let i = 0; i < all.length; i++) {
    const t = all[i] ?? '';
    if (HOISTED.test(t)) {
      const end = isOpen(t) ? closing(all, i) : i;
      defs.push(all.slice(i, end + 1).join(''));
      i = end;
    } else body.push(t);
  }
  const head = root + stillSvg(defs.join(''));
  const wrap = (stack: readonly string[], inner: string) =>
    `${head}${stack.join('')}${inner}${closeAll(stack)}</svg>`;

  function build(tokens: readonly string[], outer: readonly string[]): FxLayer[] {
    const layers: FxLayer[] = [];
    const stack = [...outer];
    let chunk: string[] = [];
    let chunkStack = [...stack];
    const flush = () => {
      if (chunk.some((t) => DRAWS.test(t))) {
        layers.push({
          kind: 'still',
          xml: `${head}${chunkStack.join('')}${stillSvg(chunk.join(''))}${closeAll(stack)}</svg>`,
        });
      }
      chunk = [];
      chunkStack = [...stack];
    };
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i] ?? '';
      const mark = isOpen(t) ? MARK.exec(t) : null;
      if (mark) {
        flush();
        const end = closing(tokens, i);
        const inner = tokens.slice(i + 1, end);
        const [, fx = '', x = '0', y = '0', k = '1'] = mark;
        const motion = FX[fx];
        const plain = t.replace(MARK, '');
        if (motion?.frames) {
          const content = stillSvg(inner.join(''));
          layers.push({
            kind: 'frames',
            fx,
            frames: framesOf(motion).map((f) => ({
              from: f.from,
              to: f.to,
              xml: wrap(
                stack,
                `${plain}<g transform="translate(${f.tx} ${f.ty})">${content}</g></g>`,
              ),
            })),
          });
        } else if (motion) {
          layers.push({
            kind: 'move',
            fx,
            x: Number(x),
            y: Number(y),
            k: Number(k),
            layers: build(inner, [...stack, plain]),
          });
        } else {
          // A motion this app does not know: drawn still.
          layers.push(...build(inner, [...stack, plain]));
        }
        chunkStack = [...stack];
        i = end;
        continue;
      }
      chunk.push(t);
      if (isOpen(t)) stack.push(t);
      else if (isClose(t)) stack.pop();
    }
    flush();
    return layers;
  }

  return { box: [bx, by, bw, bh], layers: build(body, []) };
}
