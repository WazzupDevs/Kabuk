// Masa kur and Masa bitti (yeni arayüz tuvali: MasaKur 32a, MasaKurLobi 32b, MasaKurGorsel 32c,
// MasaBitti 64, MasaCikarildin 132): the values the shared kit does not have, value for value.
// Light from the boards' `.phone`, dark from `.dark`. The rest (the sheet, buttons, the switch, the
// type) is the kit's (theme/auraKit.ts).
export const TABLE_SETUP = {
  // The sheet (`.mks`) reaches 60 from the screen's top.
  sheetTop: 60,
  // The chosen picture (`.pvw`): 214 high, 22 round, a 2 ink edge drawn over it; 150 while the
  // lobby's choices are open (`.lb .pvw`). 16 under the title.
  preview: {
    height: 214,
    heightLobby: 150,
    top: 16,
    radius: 24,
    edge: 2,
    edgeColor: '#031B0B',
    // The name's pill at the bottom left (`.pnm`) and "Rastgele" at the top right (`.rnd`), 12 in.
    inset: 12,
    pill: { height: 32, padX: 14, ground: 'rgba(255, 255, 255, 0.94)', ink: '#031B0B' },
    shuffle: { height: 36, padLeft: 10, padRight: 12, gap: 6, icon: 18 },
    // "ÖNERİ" (`.ob`): 2 / 7 inside, 2 after "Rastgele".
    badge: { padY: 2, padX: 7, gap: 2, light: '#E6F0E8', dark: '#1B211F' },
  },
  // "Masa görseli · Tümüne bak" (`.sch`): 20 above, 10 under; 16 above with the lobby open.
  head: { top: 20, topLobby: 16, bottom: 10, linkGap: 2, chevron: 16 },
  // The pictures (`.th`): 3:2, 12 round, an ink edge of 1.5, 8 apart; the chosen one in a 3 primary
  // outline 2 off it; one at another table faded (`.th.tk`).
  thumb: {
    ratio: 3 / 2,
    radius: 12,
    gap: 8,
    edge: 1.5,
    edgeColor: 'rgba(3, 27, 11, 0.70)',
    ring: 3,
    ringOff: 2,
    ringColor: { light: '#0E8745', dark: '#3DDC84' },
    taken: 0.35,
  },
  // The rows ("Lobide görünsün", the identity; `.row2`): a line above, 14 above and under (12 with
  // the lobby open), 18 under the pictures (14), 14 between the words and the switch.
  row: {
    top: 18,
    topLobby: 14,
    padY: 14,
    padYLobby: 12,
    gap: 14,
    textGap: 2,
    line: { light: 'rgba(3, 27, 11, 0.10)', dark: 'rgba(255, 255, 255, 0.10)' },
    face: 40,
  },
  // "Niyetin (isteğe bağlı)" (`.niy`): its label 8 over the two parts (`.sg2`: 4 in, 4 apart, 36
  // high), the games 10 under them, the note 8 under the games, 12 under the whole.
  intent: {
    padTop: 2,
    padBottom: 12,
    labelGap: 8,
    pad: 4,
    gap: 4,
    item: 36,
    gamesTop: 10,
    noteTop: 8,
  },
  // A game's chip (`.gc`): its picture round at the start, 4 in; 14 after the name, 8 between.
  game: {
    pad: 4,
    padRight: 14,
    gap: 8,
    light: { ground: '#FFFFFF', ring: 'rgba(3, 27, 11, 0.10)' },
    dark: { ground: '#1B211F', ring: 'transparent' },
  },
  // Masa görseli (32c, `.grd`): two columns 12 apart, rows 14 apart, 16 under the title; the name 6
  // under its picture, its check after it (`.on2`: 20, the check 14); "Başka masada" at the top left
  // (`.tkt`: 8 in, 24 high, 9 inside).
  grid: {
    top: 16,
    colGap: 12,
    rowGap: 14,
    nameTop: 6,
    nameGap: 6,
    check: 20,
    checkIcon: 14,
    light: { check: '#1C8C4E', onCheck: '#FFFFFF' },
    dark: { check: '#3DDC84', onCheck: '#0B0E0D' },
    tag: {
      inset: 8,
      height: 24,
      padX: 9,
      ground: 'rgba(255, 255, 255, 0.94)',
      ink: '#031B0B',
    },
  },
  // Masa bitti (64, 132; `.mbw`): an empty 56 bar under the status bar, the table's picture 200
  // high and 28 round, the title 16 under it, the line 4 under the title.
  end: {
    bar: 56,
    hero: 200,
    heroRadius: 28,
    titleTop: 16,
    lineTop: 4,
    // "Masadakiler · …" (`.sec`): 20 above, 2 under, 4 in.
    secTop: 20,
    secBottom: 2,
    secIn: 4,
    // A person (`.pr2`): at least 64 high, 12 between, the line 1 under the name; a line between.
    rowMin: 64,
    rowGap: 12,
    nameGap: 1,
    success: { light: '#1C7843', dark: '#3DDC84' },
  },
} as const;
