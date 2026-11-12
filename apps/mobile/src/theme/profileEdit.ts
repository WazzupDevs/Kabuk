// Profili düzenle, value for value from the approved board (tuval: Duzenle.dc.html; 390 × 844)
// where docs/design/iskelet.md → 5.8 gives no value of its own. The fields' height (48) and the small
// buttons' (36) are the kit's (CLAUDE.md → Ekran davranışı); the focus ring (3, 18 %) and Kaydet are
// iskelet's (2.1, 5.8); the birth date's square is a settings row's (2.4: 32, 10 round, white on
// colour).
import { EXPLORE } from './explore';

export const PROFILE_EDIT = {
  // The page 16 from the sides, its parts 14 apart; the title 6 in.
  side: 16,
  gap: 14,
  titleIn: 6,
  // The preview 236 high: the cover 172, 28 round, on its shadow; "Kapak" 12 from its top right,
  // 10 in at its left and 12 at its right, its camera 16, 6 from the words. The photo 116 in its 4
  // white ring, its top 112 down, centred; the camera round 4 out of its right and 2 over its foot,
  // its icon 16.
  preview: 236,
  cover: 172,
  coverRadius: 28,
  coverBtn: { inset: 12, padLeft: 10, padRight: 12, gap: 6, icon: 16 },
  face: 116,
  faceTop: 112,
  camera: { right: -4, bottom: 2, icon: 16 },
  // The fields' card: 26 round, 16 inside, its parts 8 apart, the hairline 8 more over and under.
  card: { radius: 26, pad: 16, gap: 8, hairGap: 8 },
  // A field: 16 round, its edge 1.5, 16 inside (the bio 13 over and under); its label and note 4
  // in. The bio three lines high.
  field: { radius: 16, edge: 1.5, padX: 16, padY: 13, labelIn: 4, tall: 96 },
  // The birth date's card: 26 round, 14 / 16 inside, 12 between its parts, its lines 2 apart; the
  // lock 14, 5 from "Değiştirilemez".
  row: { radius: 26, padY: 14, padX: 16, gap: 12, lineGap: 2, lock: 14, lockGap: 5 },
  light: {
    coverShadow: '0px 14px 34px rgba(3, 27, 11, 0.14)',
    cameraFill: 'rgba(255, 255, 255, 0.90)',
    card: EXPLORE.light.card,
    hair: '#E6EDE8',
    label: '#4A6550',
    note: '#6B7E71',
    fieldEdge: '#DCE6DF',
    fieldFill: '#FFFFFF',
  },
  // The dark scheme is not drawn on the board: the kit's dark card and field.
  dark: {
    coverShadow: '',
    cameraFill: '#1B211F',
    card: EXPLORE.dark.card,
    hair: 'rgba(255, 255, 255, 0.07)',
    label: '#A3AEA8',
    note: '#A3AEA8',
    fieldEdge: 'rgba(255, 255, 255, 0.08)',
    fieldFill: '#1B211F',
  },
} as const;
