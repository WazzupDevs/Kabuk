// Arkadaşlar, value for value from the approved board (tuval: Arkadaslar.dc.html; 390 × 844) where
// docs/design/iskelet.md → 5.8 gives no value of its own. The message round's 46 is iskelet's.
import { EXPLORE } from './explore';

export const FRIENDS_LIST = {
  // The page 16 from the sides; the title 6 in, "N arkadaş" 4 under it, the list 64 under that.
  side: 16,
  titleIn: 6,
  subTop: 4,
  listTop: 64,
  // The card: 26 round, 4 / 6 inside; a row 10 / 8 inside, 13 between its parts; the face 54 in a
  // 2 white ring (inside it), its lines 3 apart; the message's icon 20; the hairline 78 in, to
  // the card's edge.
  card: { radius: 26, padX: 6, padY: 4 },
  row: { padX: 8, padY: 10, gap: 13, face: 54, ring: 2, lineGap: 3, icon: 20, hairIn: 78 },
  light: {
    card: EXPLORE.light.card,
    sub: '#4A6550',
    since: '#6B7E71',
    hair: '#E6EDE8',
    faceRing: '#FFFFFF',
    message: '#0E8745',
  },
  // The dark scheme is not drawn on the board: the kit's dark card.
  dark: {
    card: EXPLORE.dark.card,
    sub: '#A3AEA8',
    since: '#A3AEA8',
    hair: 'rgba(255, 255, 255, 0.07)',
    faceRing: '#121614',
    message: '#3DDC84',
  },
} as const;
