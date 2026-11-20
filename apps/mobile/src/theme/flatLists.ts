// Bildirimler, İstekler, Arkadaşlar and Aktiviteler → Geçmiş as the new board draws them (yeni
// arayüz tuvali, 16 Kasım: docs/design/yeni-arayuz/project/ Bildirimler, BildirimlerBos,
// MasaDavetGeldi, MasaDavetSuresiDoldu, IsteklerBos, IsteklerDolu, Arkadaslar, ArkadaslarKaydir,
// ArkadaslarBos, AktivitelerBos, AktivitelerDolu, Gecmis, GecmisKaydir, GecmisMasa; 390 × 844, the
// status bar 47 high), value for value. No card: the rows lie on the ground, no hairline between
// them (`.rw`); the colours are the kit's.
export const FLAT = {
  // The page (`.content`: 20 from the sides, 12 between its parts). A page's top row (`.tb2`: the
  // 44 round back button and the title block, 56 high) stands 5 under the status bar.
  page: { side: 20, gap: 12 },
  bar: { top: 5, row: 56, gap: 12, fieldTop: 8 },
  // A list row (`.rw`): 10 above and under, 12 between its parts, 72 at least.
  row: { padY: 10, gap: 12, minHeight: 72 },
  // A day's heading in Geçmiş (`.hs`): the name 16/600 and its count 13/500 on one baseline, 8
  // apart; its first row 6 under it (the list's -6 margin), a game's picture 52, 14 round, drawn
  // 1.04 times (the board's `scale(1.04)`).
  day: { gap: 8, listTop: -6, headTop: 8 },
  thumb: { side: 52, radius: 16, scale: 1.04 },
  // Bildirimler's sheet (`.nsh`): 12 under the handle, 20 from the sides, 28 under the last row;
  // the section label (`.sl`) 18 over and 4 under it; a row (`.nr`) 10 above and under, 12 between
  // its parts, its lines 2 apart; a new one's dot 6, 12 left of the row.
  sheet: { padBottom: 28, labelTop: 18, labelBottom: 4, rowPadY: 10, rowGap: 12, lineGap: 2 },
  dot: { side: 6, out: 12 },
  // A sheet's empty state (`.nsh .emp`): 28 over it, 40 under it.
  sheetEmpty: { top: 28, bottom: 40 },
  // Mesajlar → İstekler (`.rq`): a row 10 above and under, 12 between its parts; the head 14 over
  // and 4 under it (`.rqh`); the list 4 under the tabs.
  request: { rowPadY: 10, gap: 12, headTop: 14, headBottom: 4, listTop: 4 },
  // The face without a photo (`.rqa`): the first letter, 20/700 in white, on a disc 52 across, its
  // colour one of five fixed ones picked from the name shown (the same in both schemes: the board
  // sets them inline). Never from an account or a profile id (rule 4).
  requestFace: {
    side: 52,
    radius: 28,
    inks: ['#7B5CFF', '#2C63D6', '#E2456F', '#0B783D', '#C77700'],
  },
  // Aktiviteler's game sheet (`.msh`): the picture 56, 14 round, 14 from the title, 14 under the
  // handle; the note 14 under it; MASADAKİLER 20 over and 4 under it; a person (`.mr`) 64 high, 12
  // between its parts, the face 44.
  game: {
    art: 56,
    artRadius: 16,
    artGap: 14,
    headTop: 14,
    noteTop: 14,
    labelTop: 20,
    labelBottom: 4,
  },
  person: { height: 64, gap: 12, face: 44 },
} as const;
