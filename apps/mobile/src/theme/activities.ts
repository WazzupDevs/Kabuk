// Aktiviteler and its game sheet, value for value from the approved boards (tuval: Aktivite.dc.html,
// its tabs "etk" and "gecmis", and Sohbet.dc.html, the game's sheet over Geçmiş; 390 × 844, the
// status bar 47 high) where docs/design/iskelet.md → 5.3 gives no value of its own. The gift card's
// own values: theme/gifts.ts → GIFT_CARD.
export const ACTIVITIES = {
  // The page: 15 under the status bar (62 on the board), its cards 16 from the sides, the title 6
  // further in; the tabs 22 under the gift card, the events' card 22 under the tabs.
  top: 15,
  side: 16,
  titleIn: 6,
  tabsTop: 22,
  listTop: 22,
  // The tabs: a glass capsule 48 high, 24 round, its two parts 40 inside it, the chosen one white.
  tabs: { item: 40, radius: 24 },
  // Geçmiş: a day's heading 26 over it (6 in, the count 8 after it), 12 over its card; the card
  // 26 round, 6 inside; a game's row 10 inside, 14 between the picture and the words, its lines 3
  // apart, the time 4 down at the right; the picture 56, 14 round; the hairline from the words to 10
  // short of the right.
  dayTop: 26,
  dayGap: 8,
  dayBottom: 12,
  card: { radius: 26, pad: 6 },
  row: { pad: 10, gap: 14, lineGap: 3, timeTop: 4 },
  thumb: { side: 56, radius: 14 },
  // The game's sheet: its picture 54, 16 round, 14 from the title, its lines 3 apart; the note 12 /
  // 14 in, 18 round, its icon 18 and 10 from the words; MASADAKİLER 20 under the note, 10 in, 8
  // over the card; the card 26 round, 4 / 6 inside; a person's row 10 / 8 inside, its parts 12
  // apart, the face 48 with its buddy 34 × 45 at 7, 5 in it; the name and its line 2 apart; the
  // small actions 36, the button 11 in at its left and 14 at its right, its icon 14 and 5 from the
  // words; the three dots 18.
  sheet: {
    art: 54,
    artRadius: 16,
    artGap: 14,
    titleGap: 3,
    note: { padX: 14, padY: 12, radius: 18, icon: 18, gap: 10 },
    eyebrowTop: 20,
    eyebrowIn: 10,
    eyebrowBottom: 8,
    card: { radius: 26, padX: 6, padY: 4 },
    row: { padX: 8, padY: 10, gap: 12, nameGap: 2 },
    face: 48,
    buddy: { width: 34, height: 45, left: 7, top: 5 },
    action: { padLeft: 11, padRight: 14, icon: 14, gap: 5 },
    // Once pressed: the soft pill 12 in, its check 15.
    done: { padX: 12, icon: 15 },
    more: 18,
  },
  light: {
    // `.glass` of the tabs and `.card` of the lists (iskelet.md → 2.2).
    tabsGlass: {
      fill: 'rgba(255, 255, 255, 0.60)',
      edge: 'rgba(255, 255, 255, 0.90)',
      inset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.95)',
      shadow: '0px 10px 30px rgba(3, 27, 11, 0.08)',
    },
    tabOnShadow: '0px 3px 10px rgba(3, 27, 11, 0.10)',
    hair: '#E3EBE5',
    thumbShadow: '0px 3px 10px rgba(3, 27, 11, 0.12)',
    artShadow: '0px 4px 12px rgba(3, 27, 11, 0.15)',
    note: { fill: 'rgba(14, 135, 69, 0.08)', ink: '#0B5E30' },
    people: { fill: 'rgba(255, 255, 255, 0.90)', edge: '#FFFFFF', hair: '#E6EDE8' },
    // A buddy's ground, by the row's place in the list.
    faces: ['#FBE3EC', '#E3F3EC', '#FBF1DC', '#E0F2EA', '#FDEADF', '#E4EEF8'],
    added: { fill: 'rgba(14, 135, 69, 0.10)', ink: '#0B5E30' },
    more: { fill: 'rgba(3, 27, 11, 0.05)', ink: '#31443A' },
  },
  // The dark scheme is not drawn on the boards: the kit's dark glass and hairline, soft tints.
  dark: {
    tabsGlass: { fill: '#121614', edge: 'rgba(255, 255, 255, 0.09)', inset: '', shadow: '' },
    tabOnShadow: '',
    hair: 'rgba(255, 255, 255, 0.07)',
    thumbShadow: '',
    artShadow: '',
    note: { fill: 'rgba(31, 220, 117, 0.14)', ink: '#1FDC75' },
    people: {
      fill: '#1B211F',
      edge: 'rgba(255, 255, 255, 0.09)',
      hair: 'rgba(255, 255, 255, 0.07)',
    },
    faces: ['#3A1E28', '#1B2E24', '#33291A', '#1B2E26', '#36241C', '#1C2632'],
    added: { fill: 'rgba(61, 220, 132, 0.14)', ink: '#93EBB9' },
    more: { fill: 'rgba(255, 255, 255, 0.06)', ink: '#A3AEA8' },
  },
} as const;
