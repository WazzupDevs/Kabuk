// The own profile, value for value from the yeni arayüz tuvali's boards (ProfilBen, ProfilBenKaydir,
// DarProfilim; 390 × 844, the bar's buttons at 52 under a 44 status bar). One flow: the cover
// (PROFILE_PAGE.own), the photo over its foot, the name, the bio, two buttons, the ticket, the Set
// balonu; no panel, no handle, no light on the ground (yeni-tuval.md → "Tuvale sadık kalınır").
import { KIT_TYPE } from './auraKit';
import { EXPLORE } from './explore';

export const OWN_PROFILE = {
  // The body 20 from the sides; the name 12 under the photo, the bio 4 under it, the buttons 20
  // under the bio and 10 apart (each as wide as the other; stacked at 320 dp or the largest text,
  // 8 apart and 52 high at least).
  side: 20,
  nameTop: 12,
  bioTop: 4,
  buttonsTop: 20,
  buttonsGap: 10,
  buttonsGapNarrow: 8,
  buttonNarrow: 52,
  // "Profili düzenle": 12 in at either side, its pencil 18.
  edit: { pad: 12, icon: 18 },
  // "N arkadaş" (`.fr`, a glass card): the faces, the words and the arrow (16) 6 apart, 6 in at its
  // left (12 without faces) and 12 at its right.
  friends: { padLeft: 6, padLeftBare: 12, padRight: 12, gap: 6, chevron: 16 },
  // The ticket and the Set balonu 28 under what is over them.
  sectionTop: 28,
  // The settings' icon 24, the board's `.ci`.
  settingsIcon: 24,
  cover: { narrow: 200 },
  light: {
    // `.fr .av` ring: the ground's colour; the letter's ground (`.pic`) the primary; the friends'
    // card the kit's glass.
    stackRing: '#EFF7F1',
    faceGround: '#0E8745',
    card: EXPLORE.light.card,
  },
  dark: {
    stackRing: '#121614',
    faceGround: '#0B783D',
    card: EXPLORE.dark.card,
  },
} as const;

// The board's own faces on the own profile (`.nm` 600 28/34 at -0.6 px, `.sbt` 700 17/22 at -0.2 px,
// `.btn` 600 15/20, the friends card's 600 14/18), made of the kit's.
export const OWN_TYPE = {
  name: { ...KIT_TYPE.h3, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  bar: { ...KIT_TYPE.venueBarName, fontSize: 17, lineHeight: 22 },
} as const;

// Set balonu on the page (ProfilBen `.sh`, `.stag`, `.sd`, `.parts`, `.prt`): the small title and
// the balloon's tag (24 high, 10 in) on one line, the note 6 under it, the three parts 14 under
// that, 8 apart (two to a row at 320 dp); a part's picture 84, its name 8 under it. The empty slot
// stays 62 in a dashed 2 ring, its plus 20.
export const SET_CARD = {
  tag: { height: 24, padX: 10 },
  noteTop: 6,
  slotsTop: 14,
  slotsGap: 8,
  nameTop: 8,
  plus: 20,
  light: {
    // `.stag`: --success-soft and --on-success-soft.
    tagOn: { bg: '#CDEFD9', fg: '#0F5C31' },
    card: EXPLORE.light.card,
    count: 'rgba(3, 27, 11, 0.06)',
    note: '#4A6550',
    emptyEdge: 'rgba(11, 90, 45, 0.28)',
    emptyFill: 'rgba(14, 135, 69, 0.05)',
    plus: '#0B5A2D',
  },
  dark: {
    tagOn: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9' },
    card: EXPLORE.dark.card,
    count: 'rgba(255, 255, 255, 0.08)',
    note: '#A3AEA8',
    emptyEdge: 'rgba(255, 255, 255, 0.16)',
    emptyFill: 'rgba(61, 220, 132, 0.06)',
    plus: '#93EBB9',
  },
} as const;
