// Another person's profile, value for value from the yeni arayüz tuvali's boards (ProfilBaskasi,
// MekanProfil, MekanProfilIstek, YukleniyorProfil, OrtakArkadaslar; 390 × 844, the bar's buttons
// at 52 under a 44 status bar). The cover's 0.5 speed, the photo's 0.75 over 60–180 and its fade
// over 120–190 are iskelet's (PROFILE_PAGE.other); the buttons' 48 is the kit's. The board's
// capsule is not drawn: no capsule and no nick on another person's profile, a friend's included
// (CLAUDE.md, rule 4). The badge card went with the board (yeni-tuval.md → 4).
import { KIT_TYPE } from './auraKit';
import { EXPLORE } from './explore';

export const PERSON = {
  // The body 20 from the sides; the photo 112 across in its 4 ring, its top 178 from the screen's
  // top (the cover 250), shrinking from its top centre.
  side: 20,
  face: 112,
  ring: 4,
  faceTop: 178,
  faceOrigin: '50% 0%',
  // The name 12 under the photo, fading over 200–240; the bio 4 under it; the buttons 20 under the
  // bio, 12 apart, each as wide as the other.
  nameTop: 12,
  nameFade: [200, 240] as const,
  bioTop: 4,
  actsTop: 20,
  actsGap: 12,
  actPad: 12,
  actIcon: 20,
  // The mutual friends' card 24 under the buttons: one glass card, 22 round, 12 / 16 inside, the
  // faces 36 (10 over each other, a 2 ring), the words and the arrow (18), 12 apart.
  mutual: {
    top: 24,
    radius: 22,
    padY: 12,
    padX: 16,
    gap: 12,
    face: 36,
    overlap: 10,
    ring: 2,
    chevron: 18,
    facesMax: 2,
  },
  // YukleniyorProfil: the loader's centre 470 from the screen's top.
  loaderAt: 470,
  // Without a cover: the paper's foot fading into the ground over its last 90.
  paperFoot: 90,
  dot: 1.3,
  // The bar: 16 from the sides, 10 between its parts; the back's arrow 24, the dots 20; the small
  // face 30, 8 from the name, rising 8 into place.
  bar: { side: 16, gap: 10, back: 24, more: 20, face: 30, faceGap: 8, rise: 8 },
  // The cover's two fades in one: the top 28 % (35 in the dark) black to 34 %, the foot from 55 %
  // into the ground.
  coverShade: {
    light:
      'linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0) 34%, rgba(239, 247, 241, 0) 55%, #EFF7F1 100%)',
    dark: 'linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0) 34%, rgba(0, 0, 0, 0) 55%, #000000 100%)',
  },
  light: {
    // The paper: green and pink dots on a 7 grid, half a cell apart (each solid to 1.1 and gone
    // by 1.5: drawn 1.3), over a green-to-peach-to-pink wash.
    paper: 'linear-gradient(160deg, #CDEBD8 0%, #F3E3D3 55%, #F4D3E0 100%)',
    dotGreen: 'rgba(14, 135, 69, 0.16)',
    dotPink: 'rgba(255, 52, 120, 0.14)',
    paperFootCss: 'linear-gradient(180deg, rgba(239, 247, 241, 0) 0%, #EFF7F1 100%)',
    // `.btn.friend`: --success-soft and --on-success-soft.
    friend: { bg: '#CDEFD9', fg: '#0F5C31' },
    card: EXPLORE.light.card,
    barFaceShadow: '0px 2px 6px rgba(3, 27, 11, 0.15)',
  },
  dark: {
    paper: '#1B231E',
    dotGreen: 'rgba(61, 220, 132, 0.10)',
    dotPink: 'rgba(255, 126, 168, 0.10)',
    paperFootCss: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%)',
    friend: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9' },
    card: EXPLORE.dark.card,
    barFaceShadow: '',
  },
} as const;

// The board's own text where the kit's variants are a few points off (`.nm` 600 28/34 -0.6 px, the
// mutual card's two lines 500 15/20), made of the kit's own faces.
export const PERSON_TYPE = {
  name: { ...KIT_TYPE.h3, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  mutual: { ...KIT_TYPE.body, lineHeight: 20 },
} as const;

// MekanProfilIstek `.pvl`: the chips of what a request shows, 28 high, 10 in, 6 apart, 18 over the
// buttons.
export const REQUEST_SHOWN = { height: 28, padX: 10, gap: 6, bottom: 18 } as const;

// SikayetEt `.rr`: a reason's row 52 high, the radio and the words 12 apart.
export const REPORT_PICK = { row: 52, gap: 12 } as const;
