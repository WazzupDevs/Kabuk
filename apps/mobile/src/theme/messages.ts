// Mesajlar and its Bildirimler sheet, value for value from the approved board (tuval:
// Mesajlar.dc.html, tab "a" Sohbetler, "b" İstekler, `sheet` Bildirimler; 390 × 844, the status bar
// 47 high) where docs/design/iskelet.md → 5.4 gives no value of its own. The bell (46), the bar band,
// the main button's heights and the search capsule (5.4) are iskelet's.
import { EXPLORE } from './explore';

export const MESSAGES = {
  // The page: the title's row 15 under the status bar (62 on the board), its cards 16 from the
  // sides, the title 22 in from the screen's left and the bell 18 from its right; the field 22 under
  // the title's row, the list 18 under the field. The screen's fixed top (Screen → `top`) stands 20
  // in, 8 under the status bar and 4 over the content: the values here are what is left of the
  // board's after it.
  headTop: 7,
  side: 16,
  titleIn: 2,
  bellIn: -2,
  fieldTop: 18,
  listTop: 18,
  // The tabs: a glass capsule 48 high, 24 round, its two parts 40 inside it, the chosen one white.
  tabs: { item: 40, radius: 24 },
  // The bell's icon 21; its dot 10, 9 from its top and 10 from its right, in a 2 white ring.
  bell: { icon: 21, dot: 10, dotTop: 9, dotRight: 10, dotRing: 2 },
  // The conversations' card: 26 round, 4 / 6 inside; a row 10 / 8 inside, 13 between the face and
  // the words; the face 54 in a 2 white ring outside it; the words 4 above and under, their lines 3
  // apart, the hairline over them (not the face); the name's line 8 between its parts, the ticks
  // 18 × 12.
  card: { radius: 26, padX: 6, padY: 4 },
  row: { padX: 8, padY: 10, gap: 13, face: 54, ring: 2, lineGap: 3, wordsPadY: 4, metaGap: 8 },
  ticks: { width: 18, height: 12 },
  // The new chat's round: 26 from the right, 22 over the tab bar (6 more than the kit's room over
  // it); its plus 24.
  newChat: { right: 26, aboveBar: 6, icon: 24 },
  // Bildirimler: the sheet 16 inside, 10 over its handle, 18 under its last card; the handle 40 × 5;
  // the title 14 under the handle, 6 in at its left and 2 at its right; ÖNCEKİ 16 under the title, 10
  // in, 8 over its card; the card 26 round, 4 / 6 inside; a row 10 / 8 inside, 13 between its parts,
  // the face 48 in a 2 white ring, its two lines 2 apart; the message round 42, its icon 19; the
  // hairline from 69 in (the face's right) to the card's edge. The buddies 56 × 70, 40 in from the
  // left and 44 from the right, 62 over the sheet's top edge, rising from 40 below.
  sheet: { padX: 16, padTop: 10, padBottom: 18, headTop: 14, titleIn: 6, closeIn: 2 },
  eyebrow: { top: 16, bottom: 8, in: 10 },
  notice: { padX: 8, padY: 10, gap: 13, face: 48, ring: 2, lineGap: 2, action: 42, icon: 19 },
  peek: { width: 56, height: 70, left: 40, right: 44, up: 62, rise: 40 },
  light: {
    // `.glass` of the tabs (iskelet.md → 2.2) and `.card` of the list.
    tabsGlass: EXPLORE.light.glass,
    tabOnShadow: '0px 3px 10px rgba(3, 27, 11, 0.10)',
    card: EXPLORE.light.card,
    hair: '#E6EDE8',
    time: '#6B7E71',
    preview: '#4A6550',
    none: '#7C8F82',
    ticks: '#0E8745',
    faceRing: '#FFFFFF',
    faceShadow: '0px 3px 10px rgba(3, 27, 11, 0.15)',
    dot: '#FF3478',
    dotRing: '#FFFFFF',
    // The sheet's ground: a pink light at its top right and a green one at its left, on #F7FAF7.
    sheetGround:
      'radial-gradient(80% 40% at 100% 0%, #F8E3EB 0%, rgba(248, 227, 235, 0) 70%), radial-gradient(80% 40% at 0% 0%, #DDF1E5 0%, rgba(221, 241, 229, 0) 70%)',
    sheetBase: '#F7FAF7',
    eyebrow: '#4A6550',
    noticeCard: {
      fill: 'rgba(255, 255, 255, 0.90)',
      edge: '#FFFFFF',
      inset: '',
      shadow: '0px 1px 2px rgba(3, 27, 11, 0.04), 0px 12px 30px rgba(3, 27, 11, 0.06)',
    },
    noticeLine: '#31443A',
    action: '#0E8745',
  },
  // The dark scheme is not drawn on the board: the kit's dark glass and hairline, no shadows.
  dark: {
    tabsGlass: EXPLORE.dark.glass,
    tabOnShadow: '',
    card: EXPLORE.dark.card,
    hair: 'rgba(255, 255, 255, 0.07)',
    time: '#A3AEA8',
    preview: '#A3AEA8',
    none: '#7E8A84',
    ticks: '#3DDC84',
    faceRing: '#121614',
    faceShadow: '',
    dot: '#FF3478',
    dotRing: '#121614',
    sheetGround: '',
    sheetBase: '#121614',
    eyebrow: '#A3AEA8',
    noticeCard: {
      fill: '#1B211F',
      edge: 'rgba(255, 255, 255, 0.09)',
      inset: '',
      shadow: '',
    },
    noticeLine: '#C9D2CD',
    action: '#3DDC84',
  },
} as const;
