import type { ColorScheme } from './tokens';

// Every game's pre-game page (GameLobby), value for value from the new interface boards (yeni
// arayüz tuvali, 16 Kasım: OyunLobi, OyunLobiGozlemci, TakimLobi, DarOyunLobi; 390 × 844, the
// status bar 47 high). The buttons' heights are the kit's (KIT.size, iskelet.md → 2.1): the board's
// 34 high Karıştır and 36 high Katıl are the small one, its 56 high Oyunu başlat the long one.
export const LOBBY = {
  // The head (`.lt`): 5 under the status bar, 16 from the sides, its parts 12 apart; the poster
  // 84 × 54, 14 round.
  head: { top: 5, side: 16, gap: 12, posterW: 84, posterH: 54, posterRadius: 14 },
  // The body (`.lb`): 18 under the head, 20 from the sides.
  body: { top: 18 },
  // The rules (`.tgs`): 26 high, 10 inside, 6 apart.
  chip: { height: 26, padX: 10, gap: 6 },
  // A section's heading (`.sh`): 22 above, 4 under; its note (`.usub`) 2 under it and 4 over the
  // list.
  section: { top: 22, bottom: 4, noteTop: 2, noteBottom: 4 },
  // The people (`.pg2`, `.pr`): two columns 12 apart, a person 46 high at least, 8 between the
  // face and the name; the hairline over the rows from the second, 10 past the face (46 in). Watchers (`.og`)
  // 42 high, 4 closer to their row, their faces faded.
  // The face 36 (28 in a team's list and under "Henüz seçmeyenler", `.tm2`, `.ug`).
  people: {
    colGap: 12,
    min: 46,
    gap: 8,
    hairPast: 10,
    face: 36,
    smallFace: 28,
    quietMin: 42,
    quietTop: -4,
    quietFace: 0.8,
  },
  // A row (`.lr`): 64 high at least, 12 between its parts, the hairline from 52; the first 10
  // under the list; its disc 40 with the icon 20.
  row: { min: 64, gap: 12, hairIn: 52, first: 10, disc: 40, icon: 20 },
  // A team (`.tgr`, `.tc`): two 12 apart, 6 under the heading; 12 inside, 22 round, 6 between its
  // parts; its bar 8 × 18, 4 round, 8 from the name; its list 108 high at least, a person 36.
  team: { gap: 12, top: 6, pad: 12, radius: 22, inner: 6, barW: 8, barH: 18, barRadius: 4 },
  teamList: { min: 108, person: 36, gap: 8 },
  // The foot (`.lf`): 12 above, 20 from the sides, its parts 10 apart; the warning's icon 16, 6
  // from its words.
  foot: { top: 12, gap: 10, warnIcon: 16, warnGap: 6 },
} as const;

// The boards' colours: the rules' and the rows' disc ground (`.tgs span`, `.li2`), the warning's
// ink (`.wr`), a team's ground (the team's colour at 8 %, 10 % in the dark).
export const LOBBY_COLORS: Record<
  ColorScheme,
  { soft: string; warn: string; team: { purple: string; pink: string } }
> = {
  light: {
    soft: 'rgba(3, 27, 11, 0.06)',
    warn: '#A86A00',
    team: { purple: 'rgba(123, 92, 255, 0.08)', pink: 'rgba(232, 51, 111, 0.08)' },
  },
  dark: {
    soft: '#151A18',
    warn: '#FFC861',
    team: { purple: 'rgba(156, 134, 255, 0.10)', pink: 'rgba(255, 126, 168, 0.10)' },
  },
};
