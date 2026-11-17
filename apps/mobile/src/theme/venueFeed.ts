// Mekan akışı, value for value from the new interface boards (yeni arayüz tuvali, 17 Kasım:
// MekanAkis, MekanAkisKaydir, AkisYaz, AkisYazBos; 390 × 844; docs/SPEC_V4.md §4.Y). The page's
// sides, the head and the tab bar stay Mekan's (theme/venue.ts, AURA).
export const VENUE_FEED_LOOK = {
  // The "Masalar / Akış" switch 24 under "Mekandasın" (`.segw`).
  switchTop: 24,
  // The field to write in (`.cmp`): 16 under the switch, 56 high, round, 7 in at the left (the face
  // 40) and 16 at the right, 12 between its parts; the line under it 8 down and 4 in (`.nt`).
  field: { top: 16, height: 56, padLeft: 7, padRight: 16, gap: 12, edge: 1 },
  note: { top: 8, left: 4 },
  // The posts start 2 under the line (`.fd`).
  listTop: 2,
  // A post (`.po`): 14 over and 8 under, the face 40 and 12 from the words; the hairline between
  // posts from 52 in to 8 from the right edge.
  post: { padTop: 14, padBottom: 8, gap: 12, hairLeft: 52, hairRight: 8 },
  // Name, time and the ⋮ on one row 20 high, 6 apart; the ⋮ 28 across, its icon 18; the words 2
  // under it.
  head: { height: 20, gap: 6, more: 28, moreIcon: 18, textTop: 2 },
  // Under the words (`.pa2`): 6 under, the two buttons 20 apart, 32 high, their icon 18 and 6 from
  // the count.
  actions: { top: 6, gap: 20, height: 32, icon: 18, iconGap: 6 },
  // The older posts' foot.
  foot: { top: 12 },
  // The page to write (`.cz`): the bar 44 high with 8 in at the left and 16 at the right, "Paylaş"
  // 84 wide at least; the person's row 18 under it, 20 in; the words 16 under it, 20 in; the foot's
  // row (the count at the right) 12 under the words.
  compose: {
    bar: 44,
    barLeft: 8,
    barRight: 16,
    share: 84,
    whoTop: 18,
    side: 20,
    whoGap: 12,
    face: 40,
    textTop: 16,
    textMin: 120,
    footTop: 12,
    footPad: 12,
  },
} as const;
