// v46's `@keyframes` (the inventory's `keyframes_css`) as React Native can play them: one list of
// steps per animated channel. CSS fills a property's 0% and 100% from the element's own value when
// no keyframe names them, and eases every step between two of that property's keyframes with the
// animation's timing function (CSS Animations 1 §3, §4.6); here the element's own value is the
// identity (no move, no turn, scale 1, opacity 1), as for every button part v46 animates.

export type Channel = 'translateX' | 'translateY' | 'rotate' | 'scale' | 'opacity';

export type Keyframe = { at: number } & Partial<Record<Channel, number>>;

export type ChannelSteps = { from: number; steps: { to: number; ms: number }[] };

const IDENTITY: Record<Channel, number> = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  scale: 1,
  opacity: 1,
};

const num = (v: string, unit: string, what: string): number => {
  const m = new RegExp(`^(-?[0-9]*\\.?[0-9]+)(${unit})$`).exec(v.trim());
  if (!m?.[1]) throw new Error(`${what}: ${v}`);
  return Number(m[1]);
};

// `translateX(-5px) rotate(16deg) scale(.5)`: the channels a transform list sets.
function transform(value: string): Partial<Record<Channel, number>> {
  const out: Partial<Record<Channel, number>> = {};
  for (const [, fn = '', args = ''] of value.matchAll(/([a-zA-Z]+)\(([^)]*)\)/g)) {
    const a = args.split(',').map((x) => x.trim());
    switch (fn) {
      case 'translateX':
        out.translateX = a[0] === '0' ? 0 : num(a[0] ?? '', 'px', fn);
        break;
      case 'translateY':
        out.translateY = a[0] === '0' ? 0 : num(a[0] ?? '', 'px', fn);
        break;
      case 'translate':
        out.translateX = a[0] === '0' ? 0 : num(a[0] ?? '', 'px', fn);
        out.translateY = a[1] === undefined || a[1] === '0' ? 0 : num(a[1], 'px', fn);
        break;
      case 'rotate':
        out.rotate = a[0] === '0' ? 0 : num(a[0] ?? '', 'deg', fn);
        break;
      case 'scale':
        out.scale = num(a[0] ?? '', '', fn);
        break;
      default:
        throw new Error(`transform function ${fn} in a keyframe`);
    }
  }
  return out;
}

// `25%{transform:translateX(-5px)}75%{…}` (also `from`, `to` and `0%,100%`) in time order.
export function parseKeyframes(css: string): Keyframe[] {
  const frames: Keyframe[] = [];
  for (const [, selectors = '', body = ''] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const values: Partial<Record<Channel, number>> = {};
    for (const decl of body.split(';')) {
      const [prop, ...rest] = decl.split(':');
      const value = rest.join(':').trim();
      if (!prop?.trim() || !value) continue;
      if (prop.trim() === 'transform') Object.assign(values, transform(value));
      else if (prop.trim() === 'opacity') values.opacity = Number(value);
      else throw new Error(`keyframe property ${prop.trim()}`);
    }
    for (const sel of selectors.split(',')) {
      const s = sel.trim();
      const at = s === 'from' ? 0 : s === 'to' ? 1 : num(s, '%', 'keyframe') / 100;
      frames.push({ at, ...values });
    }
  }
  return frames.sort((a, b) => a.at - b.at);
}

const round = (v: number) => Math.round(v * 1000) / 1000;

// Each channel the keyframes move: its value at the start and its steps, each to a keyframe's value
// over the time between that channel's keyframes.
export function keyframeChannels(
  frames: readonly Keyframe[],
  durationMs: number,
): Partial<Record<Channel, ChannelSteps>> {
  const out: Partial<Record<Channel, ChannelSteps>> = {};
  for (const channel of Object.keys(IDENTITY) as Channel[]) {
    const own = frames.filter((f) => f[channel] !== undefined);
    if (!own.length) continue;
    const points = [...own.map((f) => ({ at: f.at, value: f[channel] as number }))];
    if (points[0]?.at !== 0) points.unshift({ at: 0, value: IDENTITY[channel] });
    if (points[points.length - 1]?.at !== 1) points.push({ at: 1, value: IDENTITY[channel] });
    const [first, ...rest] = points;
    let at = first?.at ?? 0;
    out[channel] = {
      from: first?.value ?? IDENTITY[channel],
      steps: rest.map((p) => {
        const step = { to: p.value, ms: round((p.at - at) * durationMs) };
        at = p.at;
        return step;
      }),
    };
  }
  return out;
}
