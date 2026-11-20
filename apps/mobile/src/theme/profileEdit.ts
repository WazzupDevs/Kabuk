// Profili düzenle, value for value from the yeni arayüz tuvali's boards (ProfilDuzenle,
// ProfilDuzenleYaz; 390 × 844, the bar at 52 under a 44 status bar) where docs/design/iskelet.md →
// 5.8 gives no value of its own. The fields are no longer on one card: each stands alone, its label
// row over it and its note under it.
import { KIT_TYPE } from './auraKit';

export const PROFILE_EDIT = {
  // The page 20 from the sides; the bar's parts 12 apart (the back, the title, Kaydet 40).
  side: 20,
  barGap: 12,
  // Kaydet: 40 high, 18 in at either side.
  barPad: 18,
  // The cover 150 high, 22 round, 16 under the bar; "Kapağı değiştir" 34 high, 10 in at its left
  // and 12 at its right, its camera 16, 6 from the words, 10 from the cover's top right.
  cover: 150,
  coverRadius: 22,
  coverTop: 12,
  coverBtn: { height: 34, inset: 10, padLeft: 10, padRight: 12, gap: 6, icon: 16 },
  // The photo 104 in its 4 ring, 52 over the cover's foot, centred; the camera round 38 in a 3 ring,
  // 2 out of its right and at its foot, its icon 18.
  face: 104,
  faceOver: 52,
  camera: { side: 38, ring: 3, right: -2, bottom: 0, icon: 18 },
  // A field: its label row 20 under what is over it and 8 over it, 4 in; the box at least 52 high,
  // 16 round, 1 line (2 focused), 16 in; the bio at least 92, 14 over its words; the note 8 under
  // the box, 4 in.
  field: {
    top: 20,
    labelIn: 4,
    labelBottom: 8,
    min: 52,
    radius: 16,
    edge: 1,
    edgeOn: 2,
    padX: 16,
    tall: 92,
    padTop: 14,
    noteTop: 8,
    gap: 10,
    // Read by Input's `boxed` look, which this screen no longer uses (its own field is
    // features/profile/ProfileField).
    padY: 13,
  },
  light: {
    cameraFill: '#031B0B',
    cameraInk: '#FFFFFF',
    coverBtnFill: 'rgba(3, 27, 11, 0.62)',
    fieldEdge: 'rgba(3, 27, 11, 0.10)',
    fieldFill: '#FFFFFF',
    faceGround: '#0E8745',
    label: '#4A6550',
    note: '#6B7E71',
  },
  dark: {
    cameraFill: 'rgba(255, 255, 255, 0.94)',
    cameraInk: '#0B0E0D',
    coverBtnFill: 'rgba(3, 27, 11, 0.62)',
    fieldEdge: 'rgba(255, 255, 255, 0.08)',
    fieldFill: '#121614',
    faceGround: '#0B783D',
    label: '#A3AEA8',
    note: '#A3AEA8',
  },
} as const;

// The board's own faces: the title 700 19/24 at -0.3 (`.ptb h1`), a field's label 600 13/18 and its
// count 500 12/16, a value 500 16/22, the note 500 13/18.
export const EDIT_TYPE = {
  title: { ...KIT_TYPE.pageBarTitle, fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  label: { ...KIT_TYPE.venuePill },
  counter: { ...KIT_TYPE.menuNote },
  value: { ...KIT_TYPE.boxFieldMulti },
  note: { ...KIT_TYPE.venueHint },
} as const;
