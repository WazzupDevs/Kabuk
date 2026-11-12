// The own profile, value for value from the approved board (tuval: Benim.dc.html and
// BenimToplanmis.dc.html, folded at 330; 390 × 844, a 42 status bar) where docs/design/iskelet.md →
// 5.7 gives no value of its own. The cover (230), the photo (124, its 4 ring), the -0.35 rise, the
// fade over 120–300, the 0.92, the 316 and the linear flight into the bar are iskelet's
// (PROFILE_PAGE.own); the two buttons' 48 too. The board's flight eases in and out: iskelet's is
// linear and one to one with the finger (4.1), and stays.
import { EXPLORE } from './explore';

export const OWN_PROFILE = {
  // The name's line on the board (31 at 1.1), the bio 6 under it, the buttons 18 under the bio and
  // 10 apart: "Profili düzenle" 14 in at its left and 16 at its right, its pencil 17; "N arkadaş"
  // 6 and 12, the faces, the words and the arrow (15) 8 apart.
  nameLine: 34,
  bioTop: 6,
  buttonsTop: 18,
  buttonsGap: 10,
  edit: { padLeft: 14, padRight: 16, gap: 8, icon: 17 },
  friends: { padLeft: 6, padLeftBare: 14, padRight: 12, gap: 8, chevron: 15 },
  // The faces 20 apart (28 over each other, 8 under the next).
  stackStep: 20,
  // The upper part shrinks from 30 % down its height, over the whole flight.
  riseOrigin: '50% 30%',
  // The band comes in over the panel's last 40 before the bar.
  band: [276, 316] as const,
  // The panel: 12 inside at its top, 16 at its sides; its handle 40 × 5, 3 round, 4 over the
  // ticket; its parts 14 apart.
  panelTop: 12,
  panelSide: 16,
  grabRadius: 3,
  grabBottom: 4,
  gap: 14,
  // The settings' icon 20.
  settingsIcon: 20,
  light: {
    // The panel's ground: a pink light at its top right and a green one at its left, on the ground;
    // its shadow up and a white line at its top.
    panel:
      'radial-gradient(90% 30% at 100% 0%, #F6DCE6 0%, rgba(246, 220, 230, 0) 70%), radial-gradient(90% 30% at 0% 0%, #D3EEDD 0%, rgba(211, 238, 221, 0) 70%)',
    panelShadow: '0px -12px 34px rgba(3, 27, 11, 0.12), inset 0px 1px 0px rgba(255, 255, 255, 0.9)',
    grab: 'rgba(3, 27, 11, 0.12)',
    chevron: '#4A6550',
    more: { bg: '#E3F4E9', fg: '#0B5E30' },
  },
  // The dark scheme is not drawn on the board: the plain ground, no shadow.
  dark: {
    panel: '',
    panelShadow: '',
    grab: '#2A332F',
    chevron: '#A3AEA8',
    more: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9' },
  },
} as const;

// Set balonu's card on the panel (Benim): `.card`, 26 round, 16 / 18 / 18 inside, its lines 6
// apart; the count's pill 26 high, 10 in; the slots 12 under the note, a slot's parts 6 apart, the
// empty one 62 in a dashed 2 ring, its plus 20.
export const SET_CARD = {
  radius: 26,
  padTop: 16,
  padX: 18,
  padBottom: 18,
  gap: 6,
  count: { height: 26, padX: 10 },
  slotsTop: 12,
  slotGap: 6,
  plus: 20,
  light: {
    card: EXPLORE.light.card,
    count: 'rgba(3, 27, 11, 0.06)',
    note: '#4A6550',
    emptyEdge: 'rgba(11, 90, 45, 0.28)',
    emptyFill: 'rgba(14, 135, 69, 0.05)',
    plus: '#0B5A2D',
  },
  dark: {
    card: EXPLORE.dark.card,
    count: 'rgba(255, 255, 255, 0.08)',
    note: '#A3AEA8',
    emptyEdge: 'rgba(255, 255, 255, 0.16)',
    emptyFill: 'rgba(61, 220, 132, 0.06)',
    plus: '#93EBB9',
  },
} as const;
