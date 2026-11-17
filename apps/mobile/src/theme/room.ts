// Masa, value for value from the new interface boards (yeni arayüz tuvali, 16 Kasım: Masa,
// MasaSecenek, Masadakiler, MasaDavet, MasaAt; 390 × 844, the status bar 47 high). Colours are the
// kit's and Mekan's (theme/venue.ts: the card's face, the faces' ring, the green ink); the buttons'
// heights are the kit's (KIT.size, iskelet.md → 2.1), not the board's 40.
export const ROOM = {
  // The bar (`.mtop`): 5 under the status bar, 16 from the sides, its parts 8 apart; the table's
  // pill 52 high, 18 inside, its name and line one under the other.
  bar: { top: 5, side: 16, gap: 8, pill: 52, pillPadX: 18 },
  // The table's card (`.tcd`): 28 round, 8 inside and 12 under; its picture 136 high, 22 round.
  card: { radius: 28, pad: 8, padBottom: 12, picture: 136, pictureRadius: 22 },
  // The faces' row (`.fr`): 12 under the picture, 4 in at the right and 8 at the left, 8 from the
  // chevron (18); the faces 24 in a 2 ring of the card's ground, spread across the row.
  faces: { top: 12, right: 4, left: 8, gap: 8, chevron: 18, ring: 2 },
  // "Masa dolu…" (`.fcap`): 8 under the faces, 8 in.
  caption: { top: 8, x: 8 },
  // The owner's buttons (`.tb2`): 12 under, 4 in, 8 apart.
  buttons: { top: 12, x: 4, gap: 8 },
  // "Oyunlar" and its count (`.gh`): 22 under the card's place, 10 over the games, 4 in, 8 apart.
  games: { top: 22, bottom: 10, x: 4, gap: 8, card: 126 },
  // A card's votes (MasaOyunSec, MasaOyunOyla `.gc .vc`): 6 in from its bottom right, 26 high; the
  // person's own vote rings the card 3 wide in the ink (`.gc.mine`).
  vote: { right: 6, bottom: 6, height: 26, ring: 3 },
  // Masadakiler (`.msh.mg`): two columns 10 apart, a person 10 above and under, 7 between the
  // parts, the face 32; the hairline over the rows from the second, from 40 in; the note 10 under.
  people: { colGap: 10, padY: 10, gap: 7, hairIn: 40, noteTop: 10, listTop: 10 },
  // Masana davet et (`.pg`): the note 14 under the bar; the rows 8 under it, 8 above and under,
  // 48 at least, 12 between the parts, the face 44, the hairline from 56 to 8 short of the right;
  // the button and "Gönderildi" 96 wide at least, its check 18 and 4 from the words.
  invite: {
    noteTop: 14,
    listTop: 8,
    padY: 8,
    min: 48,
    gap: 12,
    hairIn: 56,
    hairOut: 8,
    action: 96,
    check: 18,
    checkGap: 4,
  },
  // Masadan at (`.dlg .dav`): the person's face over the title, 64.
  dialogFace: 64,
} as const;
