// The capsule avatars (v43 report §2 "Kapsül avatarlar", the v45 file's AV module; docs/SPEC_V4.md
// §4.C and §4.D): a capsule made of the logo's bars, the same size in every variant, only its colours
// and accessory change. 28 variants for anonymous people; a pale ghost capsule for a profile whose
// photo was hidden or removed (K-4). Pure: the SVG is built here as text (capsules.test.ts checks
// it); src/components/CapsuleAvatar.tsx draws it with react-native-svg. Which variant a person gets
// is assigned and stored on the server (step 4.4).

const INK = '#14112B';

export type CapsuleKey =
  | 'none'
  | 'patch'
  | 'pirate'
  | 'captain'
  | 'vampire'
  | 'shades'
  | 'party'
  | 'crown'
  | 'headphones'
  | 'mustache'
  | 'cat'
  | 'devil'
  | 'angel'
  | 'beanie'
  | 'cowboy'
  | 'ninja'
  | 'bow'
  | 'monocle'
  | 'nerd'
  | 'flower'
  | 'alien'
  | 'wizard'
  | 'tophat'
  | 'shy'
  | 'scarf'
  | 'viking'
  | 'bunny'
  | 'hero';

type Variant = {
  key: CapsuleKey;
  body: string;
  bg: string;
  // The visor: the default white band, a dark one, or none (the accessory draws the eyes).
  visor?: 'dark' | 'none';
  eye?: string;
  vc?: string; // the visor's colour
  op?: number; // the body's opacity
  sh?: number; // the body's shade
  front?: string; // over the body
  back?: string; // behind the body
};

// The v45 file's AV.V, in its order (its "Sade", "Göz bandı", … names are not shown in the app).
export const CAPSULES: readonly Variant[] = [
  { key: 'none', body: '#7B5CFF', bg: '#FFE2B3' },
  {
    key: 'patch',
    body: '#FFB547',
    bg: '#E2D9FF',
    front:
      '<path d="M9.5 13.2L38.5 24.4" stroke="#14112B" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="28" cy="20.8" rx="4.4" ry="4.1" fill="#14112B"/>',
  },
  {
    key: 'pirate',
    body: '#FF7A59',
    bg: '#D6ECFF',
    front:
      '<path d="M4 14.5C8 11.5 15 10.5 24 10.5S40 11.5 44 14.5C42 7 35 2 24 2S6 7 4 14.5Z" fill="#14112B"/><path d="M6.6 12.7C11 10.6 17 9.7 24 9.7S37 10.6 41.4 12.7" stroke="#FFB547" stroke-width="1.2" fill="none"/><circle cx="24" cy="6" r="2.3" fill="#fff"/><rect x="20.3" y="7.9" width="7.4" height="1.3" rx=".65" fill="#fff" transform="rotate(22 24 8.55)"/><rect x="20.3" y="7.9" width="7.4" height="1.3" rx=".65" fill="#fff" transform="rotate(-22 24 8.55)"/>',
  },
  {
    key: 'captain',
    body: '#FF4F8B',
    bg: '#FFF1C2',
    front:
      '<path d="M9.5 13.2L38.5 24.4" stroke="#14112B" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="28" cy="20.8" rx="4.4" ry="4.1" fill="#14112B"/><path d="M4 14.5C8 11.5 15 10.5 24 10.5S40 11.5 44 14.5C42 7 35 2 24 2S6 7 4 14.5Z" fill="#14112B"/><path d="M6.6 12.7C11 10.6 17 9.7 24 9.7S37 10.6 41.4 12.7" stroke="#FFB547" stroke-width="1.2" fill="none"/><circle cx="24" cy="6" r="2.3" fill="#fff"/><rect x="20.3" y="7.9" width="7.4" height="1.3" rx=".65" fill="#fff" transform="rotate(22 24 8.55)"/><rect x="20.3" y="7.9" width="7.4" height="1.3" rx=".65" fill="#fff" transform="rotate(-22 24 8.55)"/>',
  },
  {
    key: 'vampire',
    body: '#B9A6FF',
    bg: '#2A1C66',
    visor: 'dark',
    eye: '#FF4F8B',
    front:
      '<path d="M10 21C10 13 16 8 24 8S38 13 38 21C36.4 16.6 33 14 29 14L24 16.4L19 14C15 14 11.6 16.6 10 21Z" fill="#2A1C66"/><path d="M18.5 29.6q5.5 2.6 11 0" stroke="#14112B" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M19.9 30.3l1.1 3 1.2-2.4zM25.8 30.9l1.2 2.4 1.1-3z" fill="#fff"/>',
  },
  {
    key: 'shades',
    body: '#00B8A9',
    bg: '#FFE2B3',
    visor: 'none',
    front:
      '<rect x="11.5" y="16" width="11" height="8" rx="4" fill="#14112B"/><rect x="25.5" y="16" width="11" height="8" rx="4" fill="#14112B"/><rect x="21" y="18.2" width="6" height="1.8" rx=".9" fill="#14112B"/><rect x="13.6" y="17.6" width="4" height="1.5" rx=".75" fill="#fff" opacity=".55"/><rect x="27.6" y="17.6" width="4" height="1.5" rx=".75" fill="#fff" opacity=".55"/><path d="M21.5 30q3 1.6 5.6-.4" stroke="#14112B" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  },
  {
    key: 'party',
    body: '#3BA9FF',
    bg: '#FFF1C2',
    front:
      '<path d="M15.5 12.6L25 2.6L31.5 11.2Z" fill="#FF4F8B"/><path d="M19.4 8.6L29.4 8.1M22.2 5.6L27.4 5.4" stroke="#FFB547" stroke-width="1.6" stroke-linecap="round"/><circle cx="25" cy="2.6" r="2.1" fill="#7B5CFF"/>',
  },
  {
    key: 'crown',
    body: '#7B5CFF',
    bg: '#FFD3E2',
    front:
      '<path d="M14.5 12.6L13.6 4.8L19 8.6L24 3.2L29 8.6L34.4 4.8L33.5 12.6Z" fill="#FFB547"/><rect x="14.5" y="11" width="19" height="2.6" rx="1.3" fill="#E08E00"/><circle cx="24" cy="8.9" r="1.5" fill="#FF4F8B"/><circle cx="18" cy="10" r="1" fill="#fff"/><circle cx="30" cy="10" r="1" fill="#fff"/>',
  },
  {
    key: 'headphones',
    body: '#FF4F8B',
    bg: '#DDF6F3',
    visor: 'dark',
    front:
      '<path d="M9.2 24A14.8 14.8 0 0 1 38.8 24" stroke="#14112B" stroke-width="2.6" fill="none"/><rect x="5.6" y="18.6" width="6.6" height="11" rx="3.3" fill="#FFB547"/><rect x="35.8" y="18.6" width="6.6" height="11" rx="3.3" fill="#FFB547"/>',
  },
  {
    key: 'mustache',
    body: '#FFB547',
    bg: '#D6ECFF',
    front:
      '<path d="M24 29.2c-1.5-1.8-4.5-2.2-6.5-.6-1.2 1-2.6 1.4-3.7.8 1 2.6 4.4 3.6 7 2.4 1.4-.6 2.4-1.4 3.2-2.6zM24 29.2c1.5-1.8 4.5-2.2 6.5-.6 1.2 1 2.6 1.4 3.7.8-1 2.6-4.4 3.6-7 2.4-1.4-.6-2.4-1.4-3.2-2.6z" fill="#14112B"/>',
  },
  {
    key: 'cat',
    body: '#FF4F8B',
    bg: '#FFE2B3',
    back: '<path d="M11 16L11.8 4.4L20.4 9.4Z" fill="#FF4F8B"/><path d="M37 16L36.2 4.4L27.6 9.4Z" fill="#FF4F8B"/><path d="M13 12.6L13.4 7.2L17.6 9.8Z" fill="#FFD3E2"/><path d="M35 12.6L34.6 7.2L30.4 9.8Z" fill="#FFD3E2"/>',
    front:
      '<path d="M22.6 28.4h2.8l-1.4 1.6z" fill="#14112B"/><path d="M8 27.6h6M8.4 30.4l5.4-1.2M40 27.6h-6M39.6 30.4l-5.4-1.2" stroke="#14112B" stroke-width=".9" stroke-linecap="round"/>',
  },
  {
    key: 'devil',
    body: '#FF7A59',
    bg: '#FFE0D6',
    visor: 'dark',
    eye: '#FFB547',
    front:
      '<path d="M14.2 12.4C11.4 10.6 10.8 6.6 12.4 3.4C13.4 6.6 15.6 8.4 18.6 9.3Z" fill="#14112B"/><path d="M33.8 12.4C36.6 10.6 37.2 6.6 35.6 3.4C34.6 6.6 32.4 8.4 29.4 9.3Z" fill="#14112B"/><path d="M19.5 29.2q4.5 3.4 9 0" stroke="#14112B" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  },
  {
    key: 'angel',
    body: '#FFFFFF',
    bg: '#D6ECFF',
    visor: 'dark',
    front:
      '<ellipse cx="24" cy="4.4" rx="8.6" ry="2.4" fill="none" stroke="#FFB547" stroke-width="2.2"/><ellipse cx="15.6" cy="27.8" rx="2.8" ry="1.7" fill="#FF4F8B" opacity=".45"/><ellipse cx="32.4" cy="27.8" rx="2.8" ry="1.7" fill="#FF4F8B" opacity=".45"/><path d="M21 29.2q3 2.4 6 0" stroke="#14112B" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  },
  {
    key: 'beanie',
    body: '#FFD23F',
    bg: '#E2D9FF',
    front:
      '<path d="M10.2 13.6C10.2 6.8 16.4 3 24 3S37.8 6.8 37.8 13.6Z" fill="#3BA9FF"/><rect x="9" y="11.2" width="30" height="4.4" rx="2.2" fill="#1F7FD1"/><path d="M14 11.6v3.6M18 11.4v4M22 11.3v4.2M26 11.3v4.2M30 11.4v4M34 11.6v3.6" stroke="#1667B0" stroke-width=".9"/><circle cx="24" cy="3.2" r="2.6" fill="#fff"/>',
  },
  {
    key: 'cowboy',
    body: '#00B8A9',
    bg: '#FFF1C2',
    front:
      '<path d="M16 12.6C16 6 18 3.6 20.5 3.6C22 3.6 22.8 5 24 5S26 3.6 27.5 3.6C30 3.6 32 6 32 12.6Z" fill="#A0602A"/><rect x="16" y="9.4" width="16" height="2.2" fill="#5A3212"/><path d="M4.6 12.4C8 15.2 14 15.8 24 15.8S40 15.2 43.4 12.4C40 10.9 34 10.7 24 10.7S8 10.9 4.6 12.4Z" fill="#8A4F1F"/>',
  },
  {
    key: 'ninja',
    body: '#2A2550',
    bg: '#FFD3E2',
    vc: '#FFE2B3',
    front:
      '<path d="M17 9.8H31L35.6 14.2H12.4Z" fill="#E0402C"/><path d="M34.4 12.2L41.6 9L40.2 12.2L42.8 15L35 14.6Z" fill="#E0402C"/>',
  },
  {
    key: 'bow',
    body: '#B9A6FF',
    bg: '#FFF1C2',
    front:
      '<path d="M31.4 9.6L25.6 6V13.2Z" fill="#FF4F8B"/><path d="M31.4 9.6L37.2 6V13.2Z" fill="#FF4F8B"/><circle cx="31.4" cy="9.6" r="1.9" fill="#C51F62"/><path d="M21 29.2q3 2.4 6 0" stroke="#14112B" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  },
  {
    key: 'monocle',
    body: '#2FAE68',
    bg: '#FFE0D6',
    front:
      '<circle cx="28" cy="20.5" r="4.3" fill="none" stroke="#FFB547" stroke-width="1.6"/><path d="M31.6 23.2q2.4 6 -.6 12" stroke="#FFB547" stroke-width="1" fill="none"/><path d="M24 29.2c-1.5-1.8-4.5-2.2-6.5-.6-1.2 1-2.6 1.4-3.7.8 1 2.6 4.4 3.6 7 2.4 1.4-.6 2.4-1.4 3.2-2.6zM24 29.2c1.5-1.8 4.5-2.2 6.5-.6 1.2 1 2.6 1.4 3.7.8-1 2.6-4.4 3.6-7 2.4-1.4-.6-2.4-1.4-3.2-2.6z" fill="#14112B"/>',
  },
  {
    key: 'nerd',
    body: '#3BA9FF',
    bg: '#FFE2B3',
    front:
      '<circle cx="20" cy="20.5" r="4.2" fill="none" stroke="#14112B" stroke-width="1.5"/><circle cx="28" cy="20.5" r="4.2" fill="none" stroke="#14112B" stroke-width="1.5"/><path d="M15.8 19.8h-4.6M32.2 19.8h4.6" stroke="#14112B" stroke-width="1.5"/><path d="M20.5 29h7" stroke="#14112B" stroke-width="1.4" stroke-linecap="round"/><rect x="22.5" y="29" width="3" height="2.6" rx=".7" fill="#fff"/>',
  },
  {
    key: 'flower',
    body: '#2FAE68',
    bg: '#FFF1C2',
    front:
      '<g fill="#FF9DC0"><circle cx="15.4" cy="6.6" r="2.3"/><circle cx="19" cy="8.4" r="2.3"/><circle cx="18" cy="12.2" r="2.3"/><circle cx="14" cy="12.4" r="2.3"/><circle cx="12.6" cy="8.8" r="2.3"/></g><circle cx="15.6" cy="9.8" r="1.8" fill="#FFB547"/><path d="M21 29.2q3 2.4 6 0" stroke="#14112B" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  },
  {
    key: 'alien',
    body: '#7ED957',
    bg: '#E2D9FF',
    visor: 'dark',
    front:
      '<path d="M19.4 9.6L16.2 3.8M28.6 9.6L31.8 3.8" stroke="#14112B" stroke-width="1.4" stroke-linecap="round"/><circle cx="16" cy="3.6" r="2" fill="#FF4F8B"/><circle cx="32" cy="3.6" r="2" fill="#FF4F8B"/>',
  },
  {
    key: 'wizard',
    body: '#FFB547',
    bg: '#DDF6F3',
    front:
      '<path d="M12.6 13L25 -1.5L35.4 12.4Z" fill="#3B25A6"/><ellipse cx="24" cy="12.8" rx="15" ry="2.6" fill="#3B25A6"/><path d="M25 5.6l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="#FFD23F"/>',
  },
  {
    key: 'tophat',
    body: '#FF4F8B',
    bg: '#DDF6F3',
    front:
      '<rect x="16" y="2.2" width="16" height="9" rx="1" fill="#14112B"/><rect x="16" y="8" width="16" height="2.2" fill="#FFB547"/><rect x="10.6" y="10.6" width="26.8" height="3" rx="1.5" fill="#14112B"/>',
  },
  {
    key: 'shy',
    body: '#B9A6FF',
    bg: '#FFE0D6',
    front:
      '<ellipse cx="15.6" cy="27.8" rx="2.8" ry="1.7" fill="#FF4F8B" opacity=".45"/><ellipse cx="32.4" cy="27.8" rx="2.8" ry="1.7" fill="#FF4F8B" opacity=".45"/><path d="M21 29.2q3 2.4 6 0" stroke="#14112B" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  },
  {
    key: 'scarf',
    body: '#3BA9FF',
    bg: '#FFE0D6',
    visor: 'dark',
    front:
      '<rect x="10" y="31" width="28" height="5.4" fill="#E0402C"/><rect x="15" y="31" width="2.4" height="5.4" fill="#fff"/><rect x="22" y="31" width="2.4" height="5.4" fill="#fff"/><path d="M27.6 35.4h5.4l.8 9h-5.4z" fill="#E0402C"/><path d="M28.3 39h5.1" stroke="#fff" stroke-width="1.6"/>',
  },
  {
    key: 'viking',
    body: '#FF7A59',
    bg: '#E2D9FF',
    front:
      '<path d="M13 11.4C9.6 10.6 8.6 7.4 10.2 4.2C11.2 6.6 13.2 7.6 15.6 7.6Z" fill="#FFF1C2"/><path d="M35 11.4C38.4 10.6 39.4 7.4 37.8 4.2C36.8 6.6 34.8 7.6 32.4 7.6Z" fill="#FFF1C2"/><path d="M10.6 14.6C10.6 8 16.6 4 24 4S37.4 8 37.4 14.6Z" fill="#A9A6B8"/><rect x="10" y="12.4" width="28" height="3.2" rx="1.6" fill="#8A8799"/><circle cx="24" cy="8.4" r="1.4" fill="#8A8799"/>',
  },
  {
    key: 'bunny',
    body: '#FFFFFF',
    bg: '#FFD3E2',
    visor: 'dark',
    back: '<rect x="14.6" y="1.4" width="6.4" height="15" rx="3.2" fill="#FFFFFF"/><rect x="27" y="1.4" width="6.4" height="15" rx="3.2" fill="#FFFFFF"/><rect x="16.4" y="3.4" width="2.8" height="9" rx="1.4" fill="#FF9DC0"/><rect x="28.8" y="3.4" width="2.8" height="9" rx="1.4" fill="#FF9DC0"/>',
    front: '<path d="M22.6 28.4h2.8l-1.4 1.6z" fill="#FF4F8B"/>',
  },
  {
    key: 'hero',
    body: '#7B5CFF',
    bg: '#FFF1C2',
    visor: 'none',
    front:
      '<path d="M8.4 17.2C8.4 14.6 12 14 16 14.6C19 15 21.5 16.6 24 16.6S29 15 32 14.6C36 14 39.6 14.6 39.6 17.2C39.6 21.6 37 25.6 32.5 25.6C29 25.6 27 23 24 23S19 25.6 15.5 25.6C11 25.6 8.4 21.6 8.4 17.2Z" fill="#E0402C"/><ellipse cx="17.6" cy="19.8" rx="3.4" ry="2.6" fill="#fff"/><ellipse cx="30.4" cy="19.8" rx="3.4" ry="2.6" fill="#fff"/><circle cx="18.2" cy="20" r="1.6" fill="#14112B"/><circle cx="29.8" cy="20" r="1.6" fill="#14112B"/><path d="M21 29.2q3 2.4 6 0" stroke="#14112B" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  },
];

export const CAPSULE_KEYS: readonly CapsuleKey[] = CAPSULES.map((v) => v.key);

// The ghost: no accessory, pale (v45: AV.ghost).
const GHOST: Omit<Variant, 'key'> = {
  bg: '#E8E4F4',
  body: '#FFFFFF',
  op: 0.95,
  sh: 0.06,
  vc: '#DFD9EF',
  eye: '#9C94B8',
};

export type CapsuleLook = CapsuleKey | 'ghost';

// The avatar as SVG text in a 48-unit box: a disc in the variant's ground with the capsule clipped
// to it (`disc`); without the disc, the capsule standing alone in a 48 x 58 box (v45: AV.fig, the
// sign-up friends and the first screen's scene, step 4.3).
export function capsuleSvg(look: CapsuleLook, disc = true): string {
  const v = look === 'ghost' ? GHOST : (CAPSULES.find((c) => c.key === look) ?? CAPSULES[0]!);
  const eye = v.eye;
  let face = '';
  if (v.visor === 'dark') {
    face =
      `<rect x="12" y="15" width="24" height="10" rx="5" fill="${INK}"/>` +
      `<ellipse cx="19" cy="20" rx="2.8" ry="2" fill="${eye ?? '#fff'}"/>` +
      `<ellipse cx="29" cy="20" rx="2.8" ry="2" fill="${eye ?? '#fff'}"/>`;
  } else if (v.visor !== 'none') {
    face =
      `<rect x="14" y="15" width="20" height="11" rx="5.5" fill="${v.vc ?? '#fff'}"/>` +
      `<circle cx="20" cy="20.5" r="2.1" fill="${eye ?? INK}"/>` +
      `<circle cx="28" cy="20.5" r="2.1" fill="${eye ?? INK}"/>`;
  }
  const capsule =
    (v.back ?? '') +
    `<rect x="10" y="8" width="28" height="56" rx="14" fill="${v.body}"${v.op ? ` opacity="${v.op}"` : ''}/>` +
    `<path d="M30 10a14 14 0 0 1 8 12v42h-8z" fill="${INK}" opacity="${v.sh ?? 0.12}"/>` +
    face +
    (v.front ?? '');
  if (!disc) return `<svg viewBox="0 0 48 58" xmlns="http://www.w3.org/2000/svg">${capsule}</svg>`;
  return (
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><clipPath id="disc"><circle cx="24" cy="24" r="24"/></clipPath></defs>' +
    `<g clip-path="url(#disc)"><circle cx="24" cy="24" r="24" fill="${v.bg}"/>${capsule}</g></svg>`
  );
}
