// Another person's profile, value for value from the approved board (tuval: Profil.dc.html and
// ProfilMenu.dc.html; 390 × 844, the bar's row 8 under a 42 status bar) where docs/design/
// iskelet.md → 5.6 gives no value of its own. The cover's 0.5, the photo's 0.75 over 60–180 and its
// fade over 120–190 are iskelet's (PROFILE_PAGE.other); the main button's height is the kit's (2.1).
// The board's capsule beside the photo is not drawn: no capsule and no nick on another person's
// profile, a friend's included (CLAUDE.md, rule 4).
import { EXPLORE } from './explore';

export const PERSON = {
  // The page 16 from the sides; the photo 132 across in its 4 white ring, its top 144 from the
  // screen's top (86 over the cover's 230 foot), shrinking from its top centre.
  side: 16,
  face: 132,
  ring: 4,
  faceTop: 144,
  faceOrigin: '50% 0%',
  // The name 18 under the photo, fading over 200–240; the bio 6 under it; "Arkadaşsınız" 12 under
  // that: 28 high, 9 in at its left and 12 at its right, 5 between the tick (14) and the words.
  nameTop: 18,
  nameFade: [200, 240] as const,
  bioTop: 6,
  friendTop: 12,
  friend: { height: 28, padLeft: 9, padRight: 12, gap: 5, icon: 14 },
  // Mesaj 22 under them, at most 300 wide, its icon 20, 9 from the words.
  messageTop: 22,
  message: { maxWidth: 300, gap: 9, icon: 20 },
  // ROZETLER 30 under Mesaj, 10 in and 10 over its card; the card 26 round, 14 inside, the badges 8
  // apart: each 34 high, 6 in at its left and 12 at its right, its white disc 24 with the icon 14,
  // 7 from the words.
  badgesTop: 30,
  eyebrow: { in: 10, bottom: 10 },
  badgeCard: { radius: 26, pad: 14, gap: 8 },
  badge: { height: 34, padLeft: 6, padRight: 12, gap: 7, disc: 24, icon: 14 },
  // The bar: 16 from the sides, 10 between its parts; the back's arrow 20, the dots 18; the small
  // face 30, 8 from the name, rising 8 into place.
  bar: { side: 16, gap: 10, back: 20, more: 18, face: 30, faceGap: 8, rise: 8 },
  // Without a cover: the paper's foot fading into the ground over its last 90.
  paperFoot: 90,
  dot: 1.3,
  light: {
    // The paper: green and pink dots on a 7 grid, half a cell apart (each solid to 1.1 and gone
    // by 1.5: drawn 1.3), over a green-to-peach-to-pink wash.
    paper: 'linear-gradient(160deg, #CDEBD8 0%, #F3E3D3 55%, #F4D3E0 100%)',
    dotGreen: 'rgba(14, 135, 69, 0.16)',
    dotPink: 'rgba(255, 52, 120, 0.14)',
    paperFootCss: 'linear-gradient(180deg, rgba(239, 247, 241, 0) 0%, #EFF7F1 100%)',
    bio: '#4A6550',
    friend: { bg: 'rgba(14, 135, 69, 0.10)', fg: '#0B5E30' },
    eyebrow: '#4A6550',
    card: EXPLORE.light.card,
    badge: {
      green: { bg: '#E3F4E9', icon: '#0E8745' },
      pink: { bg: '#FBE7EF', icon: '#FF3478' },
    },
    badgeDisc: '#FFFFFF',
    barFaceShadow: '0px 2px 6px rgba(3, 27, 11, 0.15)',
  },
  // The dark scheme is not drawn on the board: the riso paper's dark ground, the kit's dark card.
  dark: {
    paper: '#1B231E',
    dotGreen: 'rgba(61, 220, 132, 0.10)',
    dotPink: 'rgba(255, 126, 168, 0.10)',
    paperFootCss: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%)',
    bio: '#A3AEA8',
    friend: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9' },
    eyebrow: '#A3AEA8',
    card: EXPLORE.dark.card,
    badge: {
      green: { bg: 'rgba(61, 220, 132, 0.14)', icon: '#3DDC84' },
      pink: { bg: 'rgba(255, 126, 168, 0.16)', icon: '#FF7EA8' },
    },
    badgeDisc: '#121614',
    barFaceShadow: '',
  },
} as const;

// Which tone and icon a badge wears (the board: "İlk oyun" a green star, "5 farklı masa" pink).
export const BADGE_LOOK = {
  first_game: { tone: 'green', icon: 'star' },
  ten_games: { tone: 'green', icon: 'sparkles' },
  voice_tabu_five_wins: { tone: 'pink', icon: 'chat' },
  five_tables: { tone: 'pink', icon: 'people' },
} as const;
