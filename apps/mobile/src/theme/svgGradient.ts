// A theme's CSS linear gradient (`linear-gradient(<angle>deg, <colour> [<n>%], …)`, as the tokens
// write them) as an SVG gradient's parts: the line across the box in its own fractions and the stops.
// Buttons draw their glass with react-native-svg instead of React Native's background image: a
// fatal crash on Android came from the latter's gradient shader with the buttons' glass (Sentry,
// 27 Ekim, LinearGradient.nativeCreate).
export type SvgGradient = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: { color: string; offset: number }[];
};

const LINEAR = /^\s*linear-gradient\(\s*(-?[\d.]+)deg\s*,(.*)\)\s*$/;
const STOP = /(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}|[a-z]+)\s*(?:([\d.]+)%)?/g;

export function svgGradient(css: string): SvgGradient | null {
  const m = LINEAR.exec(css);
  if (!m) return null;
  const angle = (Number(m[1]) * Math.PI) / 180;
  const found = [...(m[2] ?? '').matchAll(STOP)];
  if (found.length < 2) return null;
  const stops = found.map((s, i) => ({
    color: s[1] ?? 'transparent',
    offset: s[2] !== undefined ? Number(s[2]) / 100 : i / (found.length - 1),
  }));
  const dx = Math.sin(angle) / 2;
  const dy = -Math.cos(angle) / 2;
  return { x1: 0.5 - dx, y1: 0.5 - dy, x2: 0.5 + dx, y2: 0.5 + dy, stops };
}
