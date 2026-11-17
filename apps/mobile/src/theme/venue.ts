// Mekan, value for value from the new interface boards (yeni arayüz tuvali, 16 Kasım:
// MekanMasaYok, MekanMasa, MekanLobiAc, MekanMasaDolu, MekanKaydir, MasaIstekBekliyor,
// MasaIstekMusaitDegil, MasaBuradayim; 390 × 844, the status bar 47 high). The main and small
// buttons' heights (2.1), the top round (46), the bar band, the fold's 104, 72, 52, 54, 170 and 70
// (AURA.venueCollapse) and MOTION stay iskelet's. The venue chat's card keeps the earlier board's
// values (chat, chatCard); Masana davet et is theme/room.ts's.
import { EXPLORE, type ExploreFace } from './explore';

export const VENUE = {
  // The page 20 from the sides (`.mt`). The bar's row 5 under the status bar (the screen's top
  // stands 8 under it: 3 up), the wordmark at the side. The venue's name 14 under the bar's row (4
  // of the screen's top under it, then 10).
  side: 20,
  headTop: -3,
  wordmarkIn: 0,
  padTop: 10,
  titleIn: 0,
  // The row's parts 8 apart (`.hr`); the identity toggle's slots 36 in a 3 rim (`.tog`).
  headGap: 8,
  toggle: { slot: 36, pad: 3 },
  // The name and "Mekandasın" 8 apart; the tag 28 high, 12 in, its dot 7 and 6 from the words; the
  // spot's chip 8 after it.
  titleGap: 8,
  here: { height: 28, padLeft: 12, padRight: 12, gap: 6, dot: 7 },
  hereRowGap: 8,
  // Scrolled (`.sbar .sv`): the name small on one line and "Mekandasın" 2 under it, its dot 7 and 6
  // from the words; it takes the wordmark's place once the name has gone under the bar.
  bar: { lineGap: 2, dot: 7, dotGap: 6 },
  // Between the parts: the name's block and the table card 24, the table card and the chat 12, the
  // chat and "Açık masalar" 20.
  gaps: { card: 24, chat: 12, lobby: 20 },
  // The table card: 24 round (22 once folded), the glass.
  card: { radius: 24, stripRadius: 22 },
  // No table (`.yk`): the picture on the whole width, 152 high, the words under it 14 / 16 / 16
  // inside, the note 4 under the title; the two buttons 14 under them, 8 apart, 10 in.
  none: {
    picture: 152,
    padTop: 14,
    padX: 16,
    padBottom: 16,
    noteTop: 4,
    buttonsTop: 14,
    gap: 8,
    buttonPadX: 10,
  },
  // A table (`.ms`): the picture 6 inside the card, 20 round in a 2 edge, at least 250 high; the
  // panel on its foot 8 inside it (56 at its top), 16 round in a 2 edge, 10 / 12 inside; the faces
  // 8 under the name's row, the fill 10 under them, the sentence 6 under it. The state 12 from the
  // corner, 28 high, 12 in, its dot 7, 6 from the words. The name's row: the count, then the menu's
  // place.
  table: {
    inset: 6,
    radius: 20,
    edge: 2,
    minHeight: 250,
    pad: 8,
    padTop: 56,
    panel: { radius: 16, edge: 2, padX: 12, padY: 10, facesTop: 8, meterTop: 10, noteTop: 6 },
    status: { inset: 12, height: 28, padLeft: 12, padRight: 12, gap: 6, dot: 7 },
    rowGap: 8,
    // The faces 32 in a 2.5 ring of the panel's ground, 25 apart; the empty chair 32, dashed 2, 28
    // after the last face, its plus 14.
    face: { side: 32, ring: 2.5, pitch: 25, seatPitch: 28, dash: 2, plus: 14 },
    // The thin fill 6 high, 3 round.
    meter: 6,
    // The buttons under the picture (`.bt2`): 10 in and under, 10 under the picture, 8 apart, 10
    // inside, their icons 18 and 6 from the words. Their height is the kit's small button (36,
    // KIT.size.btnSm; the board draws 40).
    buttons: { pad: 10, gap: 8, padX: 10, icon: 18, iconGap: 6 },
  },
  // The strip it folds into (`.mc`): 8 in at its left and 10 at its right, 12 between its parts;
  // the picture 14 round in a 2 edge; its lines 2 apart, the own face 20 and 6 from the words; the
  // owner's two rounds 40, their icons 20.
  strip: {
    padLeft: 8,
    padRight: 10,
    gap: 12,
    radius: 14,
    edge: 2,
    lineGap: 2,
    face: 20,
    faceGap: 6,
    round: 40,
    roundIcon: 20,
  },
  // The venue chat: 27 round; open, 16 inside, 12 apart, the head's chevron 18 and 8 from the
  // words; the field 44 high, 16 in at its left and 6 at its right, its send 36. Folded (54): 18 in
  // at its left and 7 at its right, 10 apart, its send 38.
  chat: {
    radius: 27,
    pad: 16,
    gap: 12,
    chevron: 18,
    headGap: 8,
    field: { height: 44, padLeft: 16, padRight: 6, send: 36, arrow: 16 },
    strip: { padLeft: 18, padRight: 7, gap: 10, send: 38 },
  },
  // "Açık masalar" (`.oh`): its count 10 after it. A row (`.orw`): 8 above and under, 12 between
  // its parts; the picture 60, 16 round in a 2 edge; the name and its line 2 apart, the line's
  // parts 8 apart; the intent's tag 22 high, 8 in, 58 wide; Katıl 76 wide, Bu masadayım 14 in.
  // "Süren masalar" 22 under the rows (the list's 12 and 10), its note 4 under it (`.rnote`).
  lobby: {
    headGap: 10,
    row: { padY: 8, gap: 12, picture: 60, radius: 16, edge: 2, lineGap: 2, partGap: 8 },
    tag: { height: 22, padX: 8, width: 58 },
    join: 76,
    herePadX: 14,
    runningTop: 10,
    noteTop: 4,
  },
  // The request's notice over the tab bar (`.snk`): 16 above it, its loader 22.
  notice: { above: 16, lead: 22 },
  // The menu's first row: 14 / 16 / 12 inside, 8 between its line and its bar; the bar 5 high.
  stay: { padTop: 14, padX: 16, padBottom: 12, gap: 8, bar: 5 },
  light: {
    // The table card's face: the board's `.glass` (skall.css --glass-bg, --glass-line,
    // --glass-shadow).
    card: {
      fill: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
      edge: 'rgba(255, 255, 255, 0.86)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
    } satisfies ExploreFace,
    chatCard: {
      fill: 'rgba(255, 255, 255, 0.86)',
      edge: 'rgba(255, 255, 255, 0.95)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 10px 26px rgba(3, 27, 11, 0.08)',
    } satisfies ExploreFace,
    // "Mekandasın" (--success-soft, --on-success-soft; the dot in the words' colour).
    here: { fill: '#CDEFD9', ink: '#0F5C31', dot: '#0F5C31' },
    // The pictures' edge (the table's picture, its panel, the strip's and the lobby's pictures).
    frame: 'rgba(3, 27, 11, 0.22)',
    panel: { fill: 'rgba(255, 255, 255, 0.95)', shadow: '0px 6px 18px rgba(0, 0, 0, 0.18)' },
    status: { fill: '#FFFFFF', ink: '#031B0B', shadow: '0px 4px 12px rgba(0, 0, 0, 0.18)' },
    dot: { off: '#9AA8A0', open: '#0E8745', full: '#FF4F8B' },
    faceRing: '#FFFFFF',
    faceShadow: '0px 2px 6px rgba(3, 27, 11, 0.16)',
    seat: { edge: '#4A6550', fill: 'transparent', plus: '#4A6550' },
    meter: { track: '#E6F0E8', free: '#0E8745', full: '#FF4F8B' },
    sentence: '#4A6550',
    clearInk: '#0B5A2D',
    // The soft buttons' icons (--accent) and a passive one's words (--muted).
    accent: '#0B783D',
    off: '#4A6550',
    stripSub: '#4A6550',
    // The lobby's intent tag (--surface2, --text).
    tag: { bg: '#E6F0E8', fg: '#031B0B' },
    chevron: '#9AAEA1',
    field: 'rgba(23, 131, 77, 0.08)',
    hint: '#6B7E71',
    count: '#4A6550',
    // The menu's first row.
    stayLabel: '#4A6550',
    stayValue: '#031B0B',
    stayTrack: 'rgba(3, 27, 11, 0.08)',
  },
  // The dark scheme is not drawn on the board: the kit's dark card and inks.
  dark: {
    // `.dark .st`: #121614 in a 1 white 8 % edge, no shadow.
    card: {
      fill: '#121614',
      edge: 'rgba(255, 255, 255, 0.08)',
      inset: '',
      shadow: '',
    } satisfies ExploreFace,
    chatCard: EXPLORE.dark.card,
    here: { fill: 'rgba(61, 220, 132, 0.14)', ink: '#93EBB9', dot: '#93EBB9' },
    frame: 'rgba(255, 255, 255, 0.18)',
    panel: { fill: 'rgba(18, 22, 20, 0.95)', shadow: '' },
    status: { fill: '#121614', ink: '#EEF3F0', shadow: '0px 4px 12px rgba(0, 0, 0, 0.18)' },
    dot: { off: '#9AA8A0', open: '#3DDC84', full: '#FF4F8B' },
    faceRing: '#121614',
    faceShadow: '',
    seat: { edge: '#A6BFAB', fill: 'transparent', plus: '#A6BFAB' },
    meter: { track: '#1B211F', free: '#3DDC84', full: '#FF4F8B' },
    sentence: '#A6BFAB',
    clearInk: '#EEF3F0',
    accent: '#3DDC84',
    off: 'rgba(238, 243, 240, 0.36)',
    stripSub: '#A6BFAB',
    tag: { bg: '#1B211F', fg: '#EEF3F0' },
    chevron: '#A3AEA8',
    field: 'rgba(61, 220, 132, 0.10)',
    hint: '#A3AEA8',
    count: '#A3AEA8',
    stayLabel: '#A3AEA8',
    stayValue: '#EEF3F0',
    stayTrack: 'rgba(255, 255, 255, 0.08)',
  },
} as const;
