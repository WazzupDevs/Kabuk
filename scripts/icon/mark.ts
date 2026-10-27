// The skall mark as SVG: two capsules, the second shifted right and down, and their intersection.
// Design source: "skall Logo Sistemi" (Uygulama ikonu, Android, Yapı, Renkler) and "skall Hareket"
// (Sistem açılış ekranı). The themed icon, the notification icon and the splash image use the flat
// drawing; the launcher layers (since 0.7.0) and the store icons (Play 512, iOS 1024) the lit one.
// Pure, so the geometry is tested; scripts/build-icons.ts rasterises it with sharp.

// Colours of the logo system.
export const COLORS = {
  purple: '#7B5CFF',
  pink: '#FF4F8B',
  crossLight: '#FFB547', // the intersection on a light ground
  night: '#14112B',
  crossDark: '#FFFFFF', // the intersection on a dark ground
} as const;

// The mark on its 512 canvas, centred on (256, 256).
export const ICON = 512;
const C = ICON / 2;
export type Drawing = { x: number; y: number; w: number; h: number; dx: number; dy: number };
// Main drawing: capsule 80 × 240, the second 52 right and 60 down; the intersection is 35 % of a
// capsule's width.
export const MAIN: Drawing = { x: 190, y: 106, w: 80, h: 240, dx: 52, dy: 60 };
// Small drawing, for 48 px and below (the notification icon): wider capsules, so the intersection
// stays visible.
export const SMALL: Drawing = { x: 180, y: 111, w: 96, h: 236, dx: 56, dy: 54 };
// In the one-colour drawings the first capsule stops this far (512 units) from the second.
export const GAP = 7;

// Android adaptive icon (108 dp canvas): the mark's farthest point 26 dp from the centre, inside
// the 66 dp safe circle.
export const ADAPTIVE = 108;
export const ADAPTIVE_SAFE_RADIUS = 33;
export const ADAPTIVE_REACH = 26;
// System splash (Android 12 and later; iOS the same image, same size): a 288 dp canvas whose
// 192 dp circle the mark fits; its farthest point 70 dp from the centre, no icon background.
export const SPLASH = 288;
export const SPLASH_CIRCLE_RADIUS = 96;
export const SPLASH_REACH = 70;
// Notification icon (24 dp): the small drawing, 20 dp tall.
export const NOTIFICATION = 24;
export const NOTIFICATION_HEIGHT = 20;

const f = (n: number) => Number(n.toFixed(2));

type Rect = { x: number; y: number; w: number; h: number; r: number };
const capsules = (d: Drawing): [Rect, Rect] => [
  { x: d.x, y: d.y, w: d.w, h: d.h, r: d.w / 2 },
  { x: d.x + d.dx, y: d.y + d.dy, w: d.w, h: d.h, r: d.w / 2 },
];

// How far the drawing reaches from the canvas centre, in 512 units: the far side of a cap.
export function reach(d: Drawing): number {
  return Math.max(
    ...capsules(d).flatMap((c) =>
      [c.y + c.r, c.y + c.h - c.r].map((cy) => Math.hypot(c.x + c.r - C, cy - C) + c.r),
    ),
  );
}

// The drawing scaled by `s` around the centre of a `canvas` wide square.
function place(d: Drawing, s: number, canvas: number): [Rect, Rect] {
  const at = (v: number) => f(canvas / 2 + (v - C) * s);
  return capsules(d).map((c) => ({
    x: at(c.x),
    y: at(c.y),
    w: f(c.w * s),
    h: f(c.h * s),
    r: f(c.r * s),
  })) as [Rect, Rect];
}

const rect = (c: Rect, attrs: string) =>
  `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${c.r}" ${attrs}/>`;
const grow = (c: Rect, by: number): Rect => ({
  x: f(c.x - by),
  y: f(c.y - by),
  w: f(c.w + 2 * by),
  h: f(c.h + 2 * by),
  r: f(c.r + by),
});

function svg(px: number, canvas: number, content: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" ` +
    `viewBox="0 0 ${canvas} ${canvas}">${content}</svg>`
  );
}

// Flat drawing: purple, pink, and the intersection (white on the dark ground).
function flat([a, b]: [Rect, Rect], cross: string): string {
  return (
    `<defs><clipPath id="a">${rect(a, '')}</clipPath></defs>` +
    rect(a, `fill="${COLORS.purple}"`) +
    rect(b, `fill="${COLORS.pink}"`) +
    rect(b, `fill="${cross}" clip-path="url(#a)"`)
  );
}

// One colour (white; the system tints by alpha): the second capsule whole, the first cut by the
// second with a gap.
function oneColour([a, b]: [Rect, Rect], gap: number): string {
  return (
    `<defs><mask id="g" maskUnits="userSpaceOnUse">` +
    `<rect x="-1000" y="-1000" width="3000" height="3000" fill="#fff"/>${rect(grow(b, gap), 'fill="#000"')}` +
    `</mask></defs>` +
    `<g mask="url(#g)">${rect(a, 'fill="#fff"')}</g>` +
    rect(b, 'fill="#fff"')
  );
}

const adaptiveScale = () => ADAPTIVE_REACH / reach(MAIN);

// ------------------------------------------------------------------ lit drawing
// The lit mark (the store icons' drawing, and the launcher's since 0.7.0: the owner found the flat
// launcher icon plain beside other apps, 27 Ekim): lit capsules with a soft shadow, a white lit
// intersection, a thin rim. `u` is the size of one 512 unit on the canvas.
function litMark([a, b]: [Rect, Rect], u: number, canvas: number): { defs: string; body: string } {
  const inset = (c: Rect): Rect => ({
    x: f(c.x + 1.5 * u),
    y: f(c.y + 1.5 * u),
    w: f(c.w - 3 * u),
    h: f(c.h - 3 * u),
    r: f(c.r - 1.5 * u),
  });
  return {
    defs:
      '<linearGradient id="pa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9076FF"/><stop offset="1" stop-color="#6A49FB"/></linearGradient>' +
      '<linearGradient id="pb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6A9E"/><stop offset="1" stop-color="#F2387A"/></linearGradient>' +
      '<linearGradient id="px" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFEAF2"/></linearGradient>' +
      `<filter id="blur" filterUnits="userSpaceOnUse" x="0" y="0" width="${canvas}" height="${canvas}"><feGaussianBlur stdDeviation="${f(14 * u)}"/></filter>` +
      `<clipPath id="a">${rect(a, '')}</clipPath>`,
    body:
      `<g opacity=".5" filter="url(#blur)" transform="translate(0 ${f(18 * u)})">${rect(a, 'fill="#05030F"')}${rect(b, 'fill="#05030F"')}</g>` +
      rect(a, 'fill="url(#pa)"') +
      rect(b, 'fill="url(#pb)"') +
      rect(b, 'fill="url(#px)" clip-path="url(#a)"') +
      rect(inset(a), `fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="${f(3 * u)}"`) +
      rect(inset(b), `fill="none" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="${f(3 * u)}"`),
  };
}

// The night ground with a glow (`cy` where the glow sits, as a share of the height).
const nightDefs = (cy: string) =>
  '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#211A52"/><stop offset="1" stop-color="#0D0A20"/></linearGradient>' +
  `<radialGradient id="glow" cx="50%" cy="${cy}" r="58%"><stop offset="0" stop-color="#5C45D6" stop-opacity=".42"/><stop offset="1" stop-color="#5C45D6" stop-opacity="0"/></radialGradient>`;
const night = (canvas: number) =>
  `<rect width="${canvas}" height="${canvas}" fill="url(#bg)"/>` +
  `<rect width="${canvas}" height="${canvas}" fill="url(#glow)"/>`;

// ------------------------------------------------------------------ launcher
// Adaptive icon: the lit mark on transparent, and the night ground with its glow behind the mark.
export function adaptiveForegroundSvg(px: number): string {
  const s = adaptiveScale();
  const lit = litMark(place(MAIN, s, ADAPTIVE), s, ADAPTIVE);
  return svg(px, ADAPTIVE, `<defs>${lit.defs}</defs>${lit.body}`);
}
export function adaptiveBackgroundSvg(px: number): string {
  return svg(px, ADAPTIVE, `<defs>${nightDefs('50%')}</defs>${night(ADAPTIVE)}`);
}
// Android 13 themed icon.
export function adaptiveMonochromeSvg(px: number): string {
  const s = adaptiveScale();
  return svg(px, ADAPTIVE, oneColour(place(MAIN, s, ADAPTIVE), f(GAP * s)));
}

// ------------------------------------------------------------------ stores
// iOS (1024, opaque, no rounded corners: iOS masks it) and Play (512): the lit drawing on the whole
// square: a night gradient with a glow, a soft shadow, lit capsules, a thin rim and a top sheen.
export function storeIconSvg(px: number): string {
  const lit = litMark(place(MAIN, 1, ICON), 1, ICON);
  return svg(
    px,
    ICON,
    '<defs>' +
      nightDefs('34%') +
      '<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".12" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>' +
      lit.defs +
      '</defs>' +
      night(ICON) +
      lit.body +
      `<rect width="${ICON}" height="${ICON}" fill="url(#sheen)"/>`,
  );
}

// ------------------------------------------------------------------ system surfaces
// Splash image: the flat mark on a transparent 288 dp canvas (the plugin draws the night colour and
// centres the canvas; app.json → imageWidth is the canvas width).
export function splashSvg(px: number): string {
  return svg(px, SPLASH, flat(place(MAIN, SPLASH_REACH / reach(MAIN), SPLASH), COLORS.crossDark));
}
// Android status bar icon: the small drawing in one colour, 20 of 24 dp tall.
export function notificationSvg(px: number): string {
  const s = NOTIFICATION_HEIGHT / (SMALL.h + SMALL.dy);
  return svg(px, NOTIFICATION, oneColour(place(SMALL, s, NOTIFICATION), f(GAP * s)));
}

// The placed drawing, for the tests: canvas units.
export function placed(use: 'adaptive' | 'splash' | 'notification'): {
  capsules: [Rect, Rect];
  reach: number;
  canvas: number;
} {
  if (use === 'notification') {
    const s = NOTIFICATION_HEIGHT / (SMALL.h + SMALL.dy);
    return {
      capsules: place(SMALL, s, NOTIFICATION),
      reach: reach(SMALL) * s,
      canvas: NOTIFICATION,
    };
  }
  const canvas = use === 'adaptive' ? ADAPTIVE : SPLASH;
  const s = (use === 'adaptive' ? ADAPTIVE_REACH : SPLASH_REACH) / reach(MAIN);
  return { capsules: place(MAIN, s, canvas), reach: reach(MAIN) * s, canvas };
}
