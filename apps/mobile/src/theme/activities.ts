// Aktiviteler and its game sheet, value for value from the new boards (yeni arayüz tuvali, 16
// Kasım: AktivitelerBos, AktivitelerDolu, Gecmis, GecmisKaydir, GecmisMasa; 390 × 844, the status
// bar 47 high) where docs/design/iskelet.md → 5.3 gives no value of its own. The gift card's own
// values: theme/gifts.ts → GIFT_CARD; the list's (theme/flatLists.ts) are shared with Mesajlar's.
export const ACTIVITIES = {
  // The page: 13 under the status bar (60 on the board), 20 from the sides; the tabs 12 under the
  // gift card, the list 12 under the tabs.
  top: 13,
  side: 20,
  tabsTop: 12,
  listTop: 12,
  // The empty state keeps this much under the gift card on a short screen.
  emptyMin: 240,
  // An event's card: the gift card's height and corner (theme/gifts.ts → GIFT_CARD), 16 inside,
  // its two lines 4 apart on a dark fade over the scene's lower half, in both schemes.
  eventCard: {
    pad: 16,
    lineGap: 4,
    shade: 'linear-gradient(180deg, rgba(3, 27, 11, 0) 30%, rgba(3, 27, 11, 0.78) 100%)',
    title: '#FFFFFF',
    venue: 'rgba(255, 255, 255, 0.86)',
  },
  // The tabs (`.sg`): a glass capsule 44 high, 4 inside, its two parts 36 and 22 round, the chosen
  // one white (the ink in the dark), the words 14/600.
  tabs: { item: 36, radius: 24 },
  // The game's sheet (`.msh`): the picture 56, 14 round, 14 from the title, its lines 3 apart; a
  // person's row 12 between its parts, the face 44 with its buddy 31 × 41 at 6, 4 in it; the name
  // and its line 2 apart; the small action 14 in at either side, its icon 16 and 4 from the
  // words; once pressed the soft pill 12 in, its check 15.
  sheet: {
    art: 56,
    artRadius: 16,
    artGap: 14,
    titleGap: 3,
    row: { gap: 12, nameGap: 2 },
    face: 44,
    buddy: { width: 31, height: 41, left: 6, top: 4 },
    action: { padLeft: 14, padRight: 14, icon: 16, gap: 4 },
    done: { padX: 12, icon: 15 },
  },
  light: {
    tabsGlass: {
      fill: 'rgba(255, 255, 255, 0.60)',
      edge: 'rgba(255, 255, 255, 0.90)',
      inset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.95)',
      shadow: '0px 10px 30px rgba(3, 27, 11, 0.08)',
    },
    tabOnShadow: '0px 3px 10px rgba(3, 27, 11, 0.10)',
    // A buddy's ground, by the row's place in the list.
    faces: ['#FBE3EC', '#E3F3EC', '#FBF1DC', '#E0F2EA', '#FDEADF', '#E4EEF8'],
    added: { fill: 'rgba(14, 135, 69, 0.10)', ink: '#0B5E30' },
  },
  // The dark scheme: the kit's dark glass and hairline, soft tints.
  dark: {
    tabsGlass: { fill: '#121614', edge: 'rgba(255, 255, 255, 0.09)', inset: '', shadow: '' },
    tabOnShadow: '',
    faces: ['#3A1E28', '#1B2E24', '#33291A', '#1B2E26', '#36241C', '#1C2632'],
    added: { fill: 'rgba(61, 220, 132, 0.14)', ink: '#93EBB9' },
  },
} as const;
