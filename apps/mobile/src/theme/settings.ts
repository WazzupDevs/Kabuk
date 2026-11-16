// Ayarlar as a full page (yeni arayüz tuvali, 16 Kasım: docs/design/yeni-arayuz/project/
// Ayarlar.dc.html with skall.css, ekran.css, koyu.css; 390 × 844, the status bar 47 high), value
// for value where docs/design/iskelet.md → 5.9 gives no value of its own. The page's ground is the
// canvas with no clouds (`.pg`), in the dark the flat black.
export const SETTINGS = {
  // The page's top (`.ptop`): 5 under the status bar, 16 from the sides, a 48 row with the 44 round
  // back button and the title 12 beside it. The content (`.pl`) starts under that row and is cut
  // there; its parts 20 from the sides, the first rows 4 under the row (`.sl`).
  page: { barTop: 5, barSide: 16, barRow: 48, barGap: 12, side: 20, top: 4 },
  // A row (`.sr`): 56 at least, its icon 24 and 14 to the words, the chevron 18; the hairline from
  // 38 (under the words) to the row's right edge. No card: the rows lie on the ground.
  row: { height: 56, gap: 14, icon: 24, chevron: 18, hairIn: 38 },
  // A section's head (`.sh3`): 26 under what is above it, 8 over its seg, in small letters.
  section: { top: 26, bottom: 8 },
  // The note under a seg (`.nt`): 8 under it; more than one 4 apart.
  note: { top: 8, gap: 4 },
  // Çıkış yap's row (`.sl` at margin-top 18) under the last note.
  signOut: { top: 18 },
  // The seg (`.seg`): a sunk track 4 inside, its parts 36 high and 4 apart, a pill.
  seg: { item: 36, gap: 4 },
  // The back button is the kit's soft round (`.round.soft`; in the dark #121614, no shadow).
  light: { hair: 'rgba(3, 27, 11, 0.10)', track: '#E0EDE2' },
  dark: { hair: 'rgba(255, 255, 255, 0.10)', track: '#1B211F' },
} as const;
