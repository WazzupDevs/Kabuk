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
  // A group of rows after a note or another group (`.sl` at margin-top 14).
  groupTop: 14,
  // Hesap's locked rows (`.sr.inf`): the lock 16 at the right, the muted ink at 70 %.
  lock: { size: 16, opacity: 0.7 },
  // Hesap's foot (`.foot`): 28 under the rows, its parts 6 apart, the wordmark 26 high, 3 more under it (`.wm` is an inline box).
  foot: { top: 28, gap: 6, mark: 26, markGap: 3 },
  // Telefon bildirimleri's state (`.stt`): 26 high, 10 inside, a 7 dot 5 before the words.
  status: { height: 26, padX: 10, dot: 7, gap: 5 },
  // A person's row's small button (`.ur .btn`: 14 inside, 13/16 600; the kit's height).
  personBtn: { padX: 14 },
  // Engellenenler and Sessize alınanlar empty (`.emp`): centred in the page down to 190 from the
  // screen's foot (the page already keeps its 32 and the 34 safe area under it).
  empty: { bottom: 124 },
  // YasalMetin (`.doc`): 6 under the bar; the meta line (`.meta`: the draft pill, the date 8
  // beside it) 6 over the draft note (`.dn`), that 14 over the text; a heading (`h2`) 22 under a
  // paragraph and 8 over the next, a paragraph 12 over the next; the pill 24 high, 9 inside; a
  // link's underline 1.5 thick, 3 under the words (`text-underline-offset`, the web's only).
  legal: { top: 6, metaGap: 8, metaBottom: 6, draftBottom: 14, h2Top: 22, h2Bottom: 8, p: 12 },
  draftPill: { height: 24, padX: 9 },
  // The back button is the kit's soft round (`.round.soft`; in the dark #121614, no shadow).
  // `switch`: the board's own (`.toggle`; in the dark `.dark .toggle`): the track off and on, the
  // knob off and on. `status`: `.stt` (--success-soft, --on-success-soft). `draft`: `.drf`.
  // `link`: `.doc a`'s underline. `text`: `.doc p.b` (in the dark the ink at 88 %).
  light: {
    hair: 'rgba(3, 27, 11, 0.10)',
    track: '#E0EDE2',
    switch: { off: '#C6E0CC', on: '#0E8745', knob: '#FFFFFF', knobOn: '#FFFFFF' },
    status: { bg: '#CDEFD9', fg: '#0F5C31' },
    draft: { bg: '#FFF1D6', fg: '#8A5A00' },
    link: 'rgba(3, 27, 11, 0.35)',
    text: '#031B0B',
  },
  dark: {
    hair: 'rgba(255, 255, 255, 0.10)',
    track: '#1B211F',
    switch: { off: '#262E2B', on: '#3DDC84', knob: '#EEF3F0', knobOn: '#0B0E0D' },
    status: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9' },
    draft: { bg: 'rgba(255, 181, 71, 0.14)', fg: '#FFC86B' },
    link: 'rgba(238, 243, 240, 0.40)',
    text: 'rgba(238, 243, 240, 0.88)',
  },
} as const;
