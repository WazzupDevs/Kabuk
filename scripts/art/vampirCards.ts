// Vampir Köylü's role cards (the owner's call, 29 Ekim: drawn again, comic book style): the back
// every card shares and one picture a role (apps/mobile/assets/vampir/<role>.webp, 480 × 640, the
// card's 3 : 4). Comic technique: thick ink outlines, flat colours with a hard cel shadow, halftone
// dots in the shadows and the ground, an action burst behind the figure and a solid offset shadow.
// The figures are skall's capsule buddies, the app's own building block, each dressed for its
// role. The card writes the role's name over the foot, so the figure stands in the upper part.
// Usage: node --experimental-strip-types scripts/art/vampirCards.ts
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';

const W = 480;
const H = 640;
const INK = '#14112B';
const LINE = 7;

type Card = 'arka' | 'vampir' | 'doktor' | 'gozcu' | 'koylu' | 'soytari';

type Look = {
  burst: [string, string];
  dots: string;
  body?: { fill: string; shade: string };
  visor?: string;
  eyes?: string;
  // Drawn behind the figure, then over it.
  back?: string;
  front?: string;
  // In place of the visor's two eyes.
  face?: string;
};

// The capsule: x 150 … 330, y 196 … 486.
const BX = 150;
const BY = 196;
const BW = 180;
const BH = 290;
const BODY = `M${BX + BW / 2} ${BY}a${BW / 2} ${BW / 2} 0 0 1 ${BW / 2} ${BW / 2}v${BH - BW}a${BW / 2} ${BW / 2} 0 0 1 ${-BW} 0v${-(BH - BW)}a${BW / 2} ${BW / 2} 0 0 1 ${BW / 2} ${-BW / 2}Z`;

const ink = (width = LINE) =>
  `stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;

function burst([a, b]: [string, string], cx = 240, cy = 300): string {
  let out = `<rect width="${W}" height="${H}" fill="${a}"/>`;
  const n = 22;
  for (let i = 0; i < n; i += 2) {
    const a1 = (i / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    const r = 900;
    out += `<path d="M${cx} ${cy}L${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)}L${(cx + Math.cos(a2) * r).toFixed(1)} ${(cy + Math.sin(a2) * r).toFixed(1)}Z" fill="${b}"/>`;
  }
  return out;
}

function figure(look: Look): string {
  const body = look.body;
  if (!body) return '';
  const shade =
    `<g clip-path="url(#body)">` +
    `<path d="M${BX + BW * 0.64} ${BY - 10}C${BX + BW * 0.8} ${BY + 120} ${BX + BW * 0.78} ${BY + 220} ${BX + BW * 0.6} ${BY + BH + 10}H${BX + BW + 20}V${BY - 10}Z" fill="${body.shade}"/>` +
    `<rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" fill="url(#inkDots)" opacity="0.22"/>` +
    `<path d="M${BX + 34} ${BY + 60}C${BX + 22} ${BY + 110} ${BX + 22} ${BY + 170} ${BX + 30} ${BY + 220}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity="0.55"/>` +
    `<path d="M${BX + 48} ${BY + 34}l6 -6" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.55"/>` +
    hatch(BX + BW * 0.74, BY + 260, 5) +
    `</g>`;
  const visor = look.face
    ? look.face
    : `<rect x="170" y="258" width="140" height="56" rx="28" fill="${look.visor ?? INK}" ${ink()}/>` +
      `<ellipse cx="210" cy="286" rx="14" ry="17" fill="${look.eyes ?? '#fff'}"/>` +
      `<ellipse cx="270" cy="286" rx="14" ry="17" fill="${look.eyes ?? '#fff'}"/>` +
      `<circle cx="215" cy="279" r="4" fill="#fff" opacity="0.9"/><circle cx="275" cy="279" r="4" fill="#fff" opacity="0.9"/>`;
  return (
    // The solid offset shadow, then the body, its shade and outline.
    `<path d="${BODY}" transform="translate(12 10)" fill="${INK}"/>` +
    `<path d="${BODY}" fill="${body.fill}"/>` +
    shade +
    `<path d="${BODY}" fill="none" ${ink()}/>` +
    visor
  );
}

// Short ink strokes in a shadow, the comic's hatching.
function hatch(x: number, y: number, count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    const yy = y + i * 12;
    out += `<path d="M${x + 6} ${yy}l22 -14" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="0.35"/>`;
  }
  return out;
}

function sparkle(x: number, y: number, s: number, color: string): string {
  return `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${color}" ${ink(3)}/>`;
}

function bat(x: number, y: number, s: number): string {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0c-6-8-16-10-26-6 6 2 9 6 9 11-5-3-11-3-16 1 8 1 13 6 14 12 4-6 10-9 19-7 0-4 1-7 0-11zm0 0c6-8 16-10 26-6-6 2-9 6-9 11 5-3 11-3 16 1-8 1-13 6-14 12-4-6-10-9-19-7 0-4-1-7 0-11z" fill="${INK}"/>`;
}

function moon(x: number, y: number, r: number): string {
  return (
    `<circle cx="${x}" cy="${y}" r="${r + 26}" fill="#FFE2A8" opacity="0.18"/>` +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFE9BF" ${ink()}/>` +
    `<circle cx="${x - r * 0.3}" cy="${y - r * 0.15}" r="${r * 0.2}" fill="#F0CF8A"/>` +
    `<circle cx="${x + r * 0.32}" cy="${y + r * 0.28}" r="${r * 0.14}" fill="#F0CF8A"/>` +
    `<circle cx="${x + r * 0.1}" cy="${y - r * 0.45}" r="${r * 0.09}" fill="#F0CF8A"/>`
  );
}

const CARDS: Record<Card, Look> = {
  vampir: {
    burst: ['#3A1042', '#541852'],
    dots: '#FF4F8B',
    body: { fill: '#D9CCFF', shade: '#A995EC' },
    eyes: '#FF3B5C',
    back:
      moon(372, 118, 62) +
      bat(92, 120, 1.1) +
      bat(400, 250, 0.8) +
      bat(70, 300, 0.7) +
      // The cape and its high collar.
      `<path d="M120 300C100 400 96 500 80 600H400C384 500 380 400 360 300Z" fill="#B0174F" ${ink()}/>` +
      `<path d="M150 320C140 420 140 520 132 600H348C340 520 340 420 330 320Z" fill="#E0245E"/>` +
      `<path d="M138 262L92 150L196 236Z" fill="#B0174F" ${ink()}/>` +
      `<path d="M342 262L388 150L284 236Z" fill="#B0174F" ${ink()}/>` +
      `<path d="M148 252L118 182L188 238Z" fill="#E0245E"/>` +
      `<path d="M332 252L362 182L292 238Z" fill="#E0245E"/>`,
    front:
      // The hair with its widow's peak, the fangs, the bow of the collar.
      `<path d="M158 248C160 214 192 196 240 196C288 196 320 214 322 248C300 232 270 230 240 252C210 230 180 232 158 248Z" fill="#241634" ${ink()}/>` +
      `<path d="M218 340h44" ${ink()}/>` +
      `<path d="M224 340l7 18 7 -18Z" fill="#fff" ${ink(4)}/>` +
      `<path d="M242 340l7 18 7 -18Z" fill="#fff" ${ink(4)}/>` +
      `<path d="M200 402l40 22 40 -22v36l-40 -14 -40 14Z" fill="#E0245E" ${ink(5)}/>` +
      `<circle cx="240" cy="420" r="9" fill="#FFD27A" ${ink(4)}/>`,
  },
  doktor: {
    burst: ['#0D5434', '#147344'],
    dots: '#7CF0B0',
    body: { fill: '#F4FBF8', shade: '#C5E6D6' },
    back:
      sparkle(84, 132, 18, '#fff') +
      sparkle(400, 196, 14, '#fff') +
      sparkle(392, 430, 10, '#B6F5D2') +
      `<path d="M86 380h22v-22h22v22h22v22h-22v22h-22v-22h-22Z" fill="#fff" ${ink(5)}/>` +
      // The bag at the right.
      `<rect x="322" y="440" width="104" height="80" rx="16" fill="#1C7843" ${ink()}/>` +
      `<path d="M352 440v-14h44v14" fill="none" ${ink()}/>` +
      `<path d="M366 466h16v-12h12v12h16v12h-16v12h-12v-12h-16Z" fill="#fff"/>`,
    front:
      // The head mirror on its band, the smile, the stethoscope, the badge.
      `<path d="M160 244C200 226 280 226 320 244" fill="none" stroke="#3A4A5C" stroke-width="9" stroke-linecap="round"/>` +
      `<circle cx="240" cy="228" r="27" fill="#DDE6F0" ${ink()}/>` +
      `<circle cx="240" cy="228" r="12" fill="#9FB3C8"/>` +
      `<circle cx="232" cy="220" r="5" fill="#fff"/>` +
      `<path d="M220 336q20 16 40 0" fill="none" ${ink()}/>` +
      `<path d="M178 372C186 420 214 440 240 440S294 420 302 372" fill="none" stroke="#2E5E4A" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M240 440v28" stroke="#2E5E4A" stroke-width="8" stroke-linecap="round"/>` +
      `<circle cx="240" cy="476" r="13" fill="#C9D3DE" ${ink(5)}/>` +
      `<rect x="268" y="392" width="34" height="34" rx="8" fill="#fff" ${ink(4)}/>` +
      `<path d="M279 409h12M285 403v12" stroke="#1C7843" stroke-width="5" stroke-linecap="round"/>`,
  },
  gozcu: {
    burst: ['#073B50', '#0B5873'],
    dots: '#7FE6FF',
    body: { fill: '#4A9BE6', shade: '#2F72B8' },
    visor: '#0B2C44',
    eyes: '#9EF0FF',
    back:
      sparkle(80, 120, 16, '#C9F6FF') +
      sparkle(404, 150, 12, '#fff') +
      sparkle(98, 360, 10, '#fff') +
      sparkle(388, 340, 16, '#C9F6FF') +
      // The hood behind the head.
      `<path d="M128 330C120 220 170 158 240 158S360 220 352 330L330 300C326 230 292 196 240 196S154 230 150 300Z" fill="#5B3AB0" ${ink()}/>`,
    front:
      // The hood's edge and its eye, the crystal ball held in two hands, its glow.
      `<path d="M150 300C154 230 188 196 240 196S326 230 330 300" fill="none" stroke="#7E5BDA" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M214 224q26 -18 52 0q-26 18 -52 0Z" fill="#FFD27A" ${ink(4)}/>` +
      `<circle cx="240" cy="224" r="6" fill="${INK}"/>` +
      `<circle cx="240" cy="452" r="86" fill="#9EF0FF" opacity="0.28"/>` +
      `<circle cx="240" cy="452" r="62" fill="url(#ball)" ${ink()}/>` +
      `<path d="M206 430a36 36 0 0 1 30 -24" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M188 520h104l-12 32h-80Z" fill="#7E5BDA" ${ink()}/>` +
      `<rect x="150" y="452" width="40" height="64" rx="20" fill="#4A9BE6" ${ink()}/>` +
      `<rect x="290" y="452" width="40" height="64" rx="20" fill="#4A9BE6" ${ink()}/>`,
  },
  koylu: {
    burst: ['#34209A', '#4C33CC'],
    dots: '#C9BAFF',
    body: { fill: '#F5B640', shade: '#CC8B1C' },
    back:
      // The fork in the right hand, roofs at the foot.
      `<path d="M372 160V600" ${ink(16)}/>` +
      `<path d="M372 160V600" stroke="#9A6532" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M336 96v54q0 16 36 16t36 -16v-54" fill="none" ${ink(15)}/>` +
      `<path d="M372 96v70" ${ink(15)}/>` +
      `<path d="M336 96v54q0 16 36 16t36 -16v-54M372 96v70" fill="none" stroke="#C9CFDA" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M0 560L60 520L120 560V640H0Z" fill="#2A1880"/><path d="M380 560L440 512L480 540V640H380Z" fill="#2A1880"/>`,
    front:
      // The straw hat, rosy cheeks, a smile, the hand on the fork.
      `<ellipse cx="240" cy="222" rx="130" ry="28" fill="#E9C46A" ${ink()}/>` +
      `<path d="M176 218C178 158 206 132 240 132S302 158 304 218Z" fill="#E2B84F" ${ink()}/>` +
      `<path d="M178 200C210 210 270 210 302 200V216C270 226 210 226 178 216Z" fill="#A3261F" ${ink(5)}/>` +
      `<path d="M196 168l10 -6M228 152l8 -4M262 156l10 2M286 174l6 6M134 228l14 -4M330 226l14 4" stroke="#B48A2E" stroke-width="4" stroke-linecap="round"/>` +
      `<ellipse cx="190" cy="330" rx="15" ry="9" fill="#FF8D7A" opacity="0.8"/>` +
      `<ellipse cx="290" cy="330" rx="15" ry="9" fill="#FF8D7A" opacity="0.8"/>` +
      `<path d="M218 336q22 18 44 0" fill="none" ${ink()}/>` +
      `<rect x="338" y="372" width="56" height="40" rx="20" fill="#F5B640" ${ink()}/>`,
  },
  soytari: {
    burst: ['#7A3300', '#A44D00'],
    dots: '#FFD27A',
    body: { fill: '#FF77AB', shade: '#D9508A' },
    back:
      `<path d="M70 120l14 -20 14 20 -14 20Z" fill="#FFD27A" ${ink(4)}/>` +
      `<path d="M404 160l12 -16 12 16 -12 16Z" fill="#9A3FD6" ${ink(4)}/>` +
      `<path d="M90 420l10 -14 10 14 -10 14Z" fill="#fff" ${ink(4)}/>` +
      `<path d="M396 400l12 -16 12 16 -12 16Z" fill="#FFD27A" ${ink(4)}/>` +
      sparkle(410, 280, 12, '#fff'),
    face:
      // Laughing eyes and a wide grin.
      `<rect x="170" y="258" width="140" height="56" rx="28" fill="${INK}" ${ink()}/>` +
      `<path d="M196 292q14 -18 28 0M256 292q14 -18 28 0" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M206 332q34 40 68 0Z" fill="#fff" ${ink(5)}/>` +
      `<path d="M218 342q22 14 44 0" fill="none" stroke="#FF77AB" stroke-width="4"/>`,
    front:
      // The three-pointed hat with its bells, the ruff.
      `<path d="M162 236C150 180 116 160 82 170C120 188 136 210 150 240Z" fill="#FFB547" ${ink()}/>` +
      `<path d="M318 236C330 180 364 160 398 170C360 188 344 210 330 240Z" fill="#9A3FD6" ${ink()}/>` +
      `<path d="M190 228C196 168 220 120 240 100C260 120 284 168 290 228Z" fill="#9A3FD6" ${ink()}/>` +
      `<path d="M200 226C206 180 224 140 240 118V226Z" fill="#B65FF0"/>` +
      `<path d="M156 246C200 222 280 222 324 246L316 262C276 242 204 242 164 262Z" fill="#FFB547" ${ink(5)}/>` +
      `<circle cx="80" cy="172" r="14" fill="#FFD27A" ${ink(5)}/>` +
      `<circle cx="400" cy="172" r="14" fill="#FFD27A" ${ink(5)}/>` +
      `<circle cx="240" cy="96" r="14" fill="#FFD27A" ${ink(5)}/>` +
      `<path d="M164 390l26 -22 24 22 26 -22 26 22 24 -22 26 22v24H164Z" fill="#FFB547" ${ink(5)}/>` +
      `<path d="M190 368l24 22 26 -22 26 22 24 -22" fill="none" stroke="#9A3FD6" stroke-width="6" stroke-linejoin="round"/>`,
  },
  arka: {
    burst: ['#1C1450', '#291D6A'],
    dots: '#B9A2FF',
    back:
      moon(240, 236, 112) +
      bat(84, 110, 1.2) +
      bat(398, 120, 0.9) +
      bat(116, 390, 0.7) +
      bat(380, 360, 0.8) +
      // Two capsules at the foot, one in a vampire's collar: who is who?
      `<path d="M96 640V500a52 52 0 0 1 104 0V640Z" fill="${INK}"/>` +
      `<path d="M280 640V480a56 56 0 0 1 112 0V640Z" fill="${INK}"/>` +
      `<path d="M270 512L248 450L312 494ZM402 512L424 450L360 494Z" fill="${INK}"/>` +
      `<ellipse cx="128" cy="506" rx="7" ry="9" fill="#fff"/><ellipse cx="166" cy="506" rx="7" ry="9" fill="#fff"/>` +
      `<ellipse cx="316" cy="490" rx="8" ry="10" fill="#FF3B5C"/><ellipse cx="356" cy="490" rx="8" ry="10" fill="#FF3B5C"/>`,
    front:
      // A comic balloon with a question mark over the moon.
      `<path d="M160 160C160 112 196 84 240 84S320 112 320 160S284 236 240 236C228 236 216 234 206 230L172 252L182 218C168 204 160 184 160 160Z" fill="#fff" ${ink()}/>` +
      `<path d="M218 140C218 120 232 110 242 110C256 110 266 120 266 134C266 152 244 156 244 176" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>` +
      `<circle cx="244" cy="204" r="9" fill="${INK}"/>`,
  },
};

export function cardSvg(card: Card): string {
  const look = CARDS[card];
  const defs =
    `<defs>` +
    `<clipPath id="body"><path d="${BODY}"/></clipPath>` +
    `<pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="2.4" fill="${look.dots}"/></pattern>` +
    `<pattern id="inkDots" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2" cy="2" r="1.6" fill="${INK}"/></pattern>` +
    `<radialGradient id="edge" cx="240" cy="300" r="380" gradientUnits="userSpaceOnUse"><stop offset="0.35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>` +
    `<mask id="edgeMask"><rect width="${W}" height="${H}" fill="url(#edge)"/></mask>` +
    `<radialGradient id="light" cx="240" cy="290" r="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ball" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#F2FDFF"/><stop offset="0.6" stop-color="#9EE6F7"/><stop offset="1" stop-color="#4FB6D8"/></radialGradient>` +
    `<linearGradient id="foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity="0.55"/></linearGradient>` +
    `</defs>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    defs +
    burst(look.burst) +
    `<rect width="${W}" height="${H}" fill="url(#light)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#edgeMask)" opacity="0.5"/>` +
    // The floor the figure stands on, its halftone shadow.
    `<ellipse cx="246" cy="506" rx="150" ry="26" fill="${INK}" opacity="0.35"/>` +
    (look.back ?? '') +
    figure(look) +
    (look.front ?? '') +
    `<rect y="${H * 0.6}" width="${W}" height="${H * 0.4}" fill="url(#foot)"/>` +
    // The panel's ink frame.
    `<rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="18" fill="none" stroke="${INK}" stroke-width="6"/>` +
    `</svg>`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = resolve(import.meta.dirname, '../../apps/mobile/assets/vampir');
  mkdirSync(dir, { recursive: true });
  for (const card of Object.keys(CARDS) as Card[]) {
    await sharp(Buffer.from(cardSvg(card)))
      .resize(W, H)
      .webp({ quality: 88, effort: 6 })
      .toFile(resolve(dir, `${card}.webp`));
    console.log(`${card}.webp`);
  }
}
