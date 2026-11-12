// Mekan, value for value from the approved board (tuval: Mekan.dc.html with masa, kisi=12, davet and
// menu; 390 × 844, the status bar 47 high) where docs/design/iskelet.md → 5.11 gives no value of its
// own. The main and small buttons' heights (2.1), the top round (46), the bar band, the fold's 104,
// 72, 52, 54, 170 and 70 (AURA.venueCollapse) and MOTION are iskelet's.
import { EXPLORE, type ExploreFace } from './explore';

export const VENUE = {
  // The page 16 from the sides. The bar's row 3 under the status bar (the screen's top stands 8
  // under it: 5 up), the wordmark 22 in (6 more than the side), the round 16 from the right. The
  // venue's name 16 under the bar's row (4 of the screen's top under it, then 12), 22 in.
  side: 16,
  headTop: -5,
  wordmarkIn: 6,
  padTop: 12,
  titleIn: 6,
  // The name and "Mekandasın" 6 apart; the tag 28 high, 10 in at its left and 12 at its right, its
  // dot 7 and 6 from the words.
  titleGap: 6,
  here: { height: 28, padLeft: 10, padRight: 12, gap: 6, dot: 7 },
  // Between the parts: the name's block and the table card 26, the table card and the chat 18, the
  // chat and "Açık masalar" 32 (22 and the heading's own 10), the heading and its list 12.
  gaps: { card: 26, chat: 18, lobby: 22 },
  // The table card: 30 round (22 once folded), white 90 % with one soft shadow.
  card: { radius: 30, stripRadius: 22 },
  // No table: the picture over the whole card, 300 high, seen at 70 % across and 60 % down; the
  // words 24 / 22 inside, 230 wide, 8 apart; the button 12 more under them, 18 in at its left and
  // 22 at its right, its plus 18.
  none: {
    height: 300,
    picX: '70%',
    picY: '60%',
    padY: 24,
    padX: 22,
    words: 230,
    gap: 8,
    buttonTop: 12,
    buttonPadLeft: 18,
    buttonPadRight: 22,
    icon: 18,
  },
  // A table: its picture on the whole width, 210; the dark fade over its lower 110; the name 18 in
  // and 16 up; the state 14 from the corner, 30 high, 10 / 12 in, its dot 7, 6 from the words. Under
  // it 14 / 16 / 18 inside, 14 between the people's block and the buttons, 8 inside the block.
  table: {
    height: 210,
    shadeHeight: 110,
    nameX: 18,
    nameY: 16,
    status: { inset: 14, height: 30, padLeft: 10, padRight: 12, gap: 6, dot: 7 },
    body: { top: 14, x: 16, bottom: 18, gap: 14, inner: 8 },
    // The faces 32 in a 2.5 ring of the card's ground, 25 apart; the empty chair 32, dashed 2, 28
    // after the last face, its plus 14.
    face: { side: 32, ring: 2.5, pitch: 25, seatPitch: 28, dash: 2, plus: 14 },
    // The thin fill 6 high, 3 round.
    meter: 6,
    // The buttons 10 apart, their icons 17, 8 from the words; Davet et 3 short of the right.
    buttons: { gap: 10, icon: 17, iconGap: 8, inviteRight: 3 },
  },
  // The strip it folds into: 10 in, 12 between its parts; the picture 52 and 14 round; its lines 2
  // apart, the state's dot 7 and 6 from the words; its button 14 in.
  strip: { padX: 10, gap: 12, radius: 14, lineGap: 2, dot: 7, dotGap: 6, buttonPadX: 14 },
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
  // "Açık masalar": its count 8 after it, the heading 10 under what is above it and 6 in.
  lobby: { headTop: 10, headIn: 6, headGap: 8, gap: 12 },
  // Masana davet et: the sheet 16 inside, 20 under its card, the title 12 under the handle and 6 in;
  // the note 6 under the title's row, 6 in, 14 over the card; the card 26 round, 4 / 6 inside; a
  // row 9 / 8 inside, 12 between its parts, the face 48; the hairline 70 in; the button 11 in at its
  // left and 14 at its right, 5 between its plus (14) and its words; "Gönderildi" 8 / 12 in, its
  // ring 22 (3 wide), 6 from the words.
  invite: {
    padX: 16,
    padBottom: 20,
    headTop: 12,
    titleIn: 6,
    closeIn: 0,
    noteTop: 6,
    noteIn: 6,
    noteBottom: 14,
    card: { radius: 26, padX: 6, padY: 4 },
    row: { padX: 8, padY: 9, gap: 12, face: 48, hairIn: 70 },
    send: { padLeft: 11, padRight: 14, gap: 5, icon: 14 },
    sent: { padLeft: 8, padRight: 12, gap: 6, ring: 22, line: 3 },
  },
  // The menu's first row: 14 / 16 / 12 inside, 8 between its line and its bar; the bar 5 high.
  stay: { padTop: 14, padX: 16, padBottom: 12, gap: 8, bar: 5 },
  light: {
    // The table card's face: white 90 % under the board's `.card` edge and top light, one shadow.
    card: {
      fill: 'rgba(255, 255, 255, 0.90)',
      edge: 'rgba(255, 255, 255, 0.95)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 14px 34px rgba(3, 27, 11, 0.10)',
    } satisfies ExploreFace,
    chatCard: {
      fill: 'rgba(255, 255, 255, 0.86)',
      edge: 'rgba(255, 255, 255, 0.95)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 10px 26px rgba(3, 27, 11, 0.08)',
    } satisfies ExploreFace,
    here: { fill: 'rgba(14, 135, 69, 0.10)', ink: '#0B5E30', dot: '#0E8745' },
    // No table: the paper's fade from the left over the picture, 110°.
    paperFade:
      'linear-gradient(110deg, rgba(251, 247, 238, 0.96) 0%, rgba(251, 247, 238, 0.85) 38%, rgba(251, 247, 238, 0) 70%)',
    paper: '#FBF7EE',
    heroTitle: '#031B0B',
    heroNote: '#31443A',
    shade: 'linear-gradient(180deg, rgba(3, 27, 11, 0) 0%, rgba(3, 27, 11, 0.62) 100%)',
    status: { fill: 'rgba(255, 255, 255, 0.82)', ink: '#031B0B' },
    dot: { off: '#9AAEA1', open: '#0E8745', full: '#FF3478' },
    faceRing: '#F5F8F6',
    faceShadow: '0px 2px 6px rgba(3, 27, 11, 0.16)',
    seat: { edge: 'rgba(11, 90, 45, 0.30)', fill: 'rgba(255, 255, 255, 0.60)', plus: '#0B5A2D' },
    meter: { track: 'rgba(3, 27, 11, 0.07)', free: '#0E8745', full: '#FF3478' },
    sentence: '#4A6550',
    clearInk: '#0B5A2D',
    stripSub: '#4A6550',
    chevron: '#9AAEA1',
    field: 'rgba(23, 131, 77, 0.08)',
    hint: '#6B7E71',
    count: '#4A6550',
    // Masana davet et.
    sheetGround:
      'radial-gradient(80% 30% at 100% 0%, #F8E3EB 0%, rgba(248, 227, 235, 0) 70%), radial-gradient(80% 30% at 0% 0%, #DDF1E5 0%, rgba(221, 241, 229, 0) 70%)',
    sheetBase: '#F5F8F6',
    inviteNote: '#4A6550',
    inviteCard: {
      fill: 'rgba(255, 255, 255, 0.92)',
      edge: '#FFFFFF',
      inset: '',
      shadow: '0px 1px 2px rgba(3, 27, 11, 0.04), 0px 12px 30px rgba(3, 27, 11, 0.06)',
    } satisfies ExploreFace,
    // The face 48 with no ring, its soft shadow (Av → board).
    inviteFace: { ring: 0, ringColor: 'transparent', shadow: '0px 2px 6px rgba(3, 27, 11, 0.14)' },
    hair: '#E6EDE8',
    sent: { fill: 'rgba(14, 135, 69, 0.10)', ink: '#0B5E30', track: 'rgba(14, 135, 69, 0.18)' },
    // The menu's first row.
    stayLabel: '#4A6550',
    stayValue: '#031B0B',
    stayTrack: 'rgba(3, 27, 11, 0.08)',
  },
  // The dark scheme is not drawn on the board: the kit's dark card and inks.
  dark: {
    card: EXPLORE.dark.card,
    chatCard: EXPLORE.dark.card,
    here: { fill: 'rgba(61, 220, 132, 0.14)', ink: '#93EBB9', dot: '#3DDC84' },
    paperFade:
      'linear-gradient(110deg, rgba(236, 228, 206, 0.96) 0%, rgba(236, 228, 206, 0.85) 38%, rgba(236, 228, 206, 0) 70%)',
    paper: '#ECE4CE',
    heroTitle: '#031B0B',
    heroNote: '#2B3A30',
    shade: 'linear-gradient(180deg, rgba(3, 27, 11, 0) 0%, rgba(3, 27, 11, 0.62) 100%)',
    status: { fill: 'rgba(255, 255, 255, 0.82)', ink: '#031B0B' },
    dot: { off: '#9AAEA1', open: '#3DDC84', full: '#FF3478' },
    faceRing: '#121614',
    faceShadow: '',
    seat: { edge: 'rgba(255, 255, 255, 0.30)', fill: 'rgba(255, 255, 255, 0.06)', plus: '#A3AEA8' },
    meter: { track: 'rgba(255, 255, 255, 0.07)', free: '#3DDC84', full: '#FF3478' },
    sentence: '#A3AEA8',
    clearInk: '#EEF3F0',
    stripSub: '#A3AEA8',
    chevron: '#A3AEA8',
    field: 'rgba(61, 220, 132, 0.10)',
    hint: '#A3AEA8',
    count: '#A3AEA8',
    sheetGround: '',
    sheetBase: '#121614',
    inviteNote: '#A3AEA8',
    inviteCard: {
      fill: '#1B211F',
      edge: 'rgba(255, 255, 255, 0.09)',
      inset: '',
      shadow: '',
    } satisfies ExploreFace,
    inviteFace: { ring: 0, ringColor: 'transparent', shadow: '' },
    hair: 'rgba(255, 255, 255, 0.07)',
    sent: {
      fill: 'rgba(61, 220, 132, 0.14)',
      ink: '#93EBB9',
      track: 'rgba(61, 220, 132, 0.22)',
    },
    stayLabel: '#A3AEA8',
    stayValue: '#EEF3F0',
    stayTrack: 'rgba(255, 255, 255, 0.08)',
  },
} as const;
