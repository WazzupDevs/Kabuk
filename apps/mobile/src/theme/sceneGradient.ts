// A scene's ground (aura.css `.scene`) as React Native's own gradients (theme/gradient.ts), drawn on
// the GPU instead of an SVG (react-native-svg draws on the main thread on Android, once in every
// place a scene shows): the violet-to-pink ground and its soft glows over it, each glow its colour
// fading to nothing by GLOW_END of its radius, as the SVG drew them (objectBoundingBox units, the
// box stretched). CSS lists the top layer first.
export type SceneGlow = { color: string; cx: string; cy: string; rx: string; ry: string };

// A glow fades out by 70 % of its radius (aura.css `.scene`).
export const GLOW_END = 0.7;

// The colour with no alpha, its hue kept (a fade to it does not darken on the way).
export function clearOf(color: string): string {
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/.exec(color);
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, 0)`;
  const hex = /^#([0-9a-fA-F]{6})$/.exec(color);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0)`;
  }
  return 'transparent';
}

export function glowCss(g: SceneGlow, end = GLOW_END): string {
  return `radial-gradient(ellipse ${g.rx} ${g.ry} at ${g.cx} ${g.cy}, ${g.color} 0%, ${clearOf(g.color)} ${end * 100}%)`;
}

export function sceneCss(c: { top: string; bottom: string; glows: readonly SceneGlow[] }): string {
  return [
    ...[...c.glows].reverse().map((g) => glowCss(g)),
    `linear-gradient(180deg, ${c.top}, ${c.bottom})`,
  ].join(', ');
}

// The white floor glow under the buddies: an ellipse filling its box, fading to its edge.
export function floorCss(color: string): string {
  return glowCss({ color, cx: '50%', cy: '50%', rx: '50%', ry: '50%' }, 1);
}
