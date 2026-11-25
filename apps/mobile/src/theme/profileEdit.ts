// Profili düzenle, from the new interface's board (yeni arayüz tuvali, ProfilDuzenle and
// ProfilDuzenleYaz; 390 × 844). Heights, corners and type come from the shared base
// (docs/decisions/temel.md): the board's 34 chip is the kit's 32, its 52 field the kit's 44, its 38
// camera the round button's 40, its 22 cover corner the scale's 24.

export const PROFILE_EDIT = {
  // `.pe`: the page 20 from the sides; the back button, the title beside it and Kaydet on one 48
  // row, 12 apart (`.ptb`).
  side: 20,
  bar: { row: 48, gap: 12 },
  // `.ecov`: the cover 16 under the bar, 150 high; "Kapağı değiştir" 10 in from its top right,
  // 10 in at its left and 12 at its right, its camera 16, 6 from the words.
  coverTop: 16,
  cover: 150,
  coverRadius: 24,
  coverBtn: { inset: 10, padLeft: 10, padRight: 12, gap: 6, icon: 16 },
  // `.eav`: the photo 104 in its 4 ring of the page's ground, half over the cover's foot, centred;
  // the camera round 2 out of its right, on its foot, in a 3 ring of the ground, its icon 18, the
  // body at 60 % under the full lens (`.cb`).
  face: 104,
  faceRing: 4,
  camera: { right: -2, bottom: 0, ring: 3, icon: 18, soft: 0.6 },
  // `.fl`: a field's label 20 under what is over it.
  fieldTop: 20,
  // `.fi`: a field 16 round, its edge 1 (2 focused), 16 inside; its label and note 4 in. The bio
  // `.fi.ta` 92 high.
  field: { radius: 16, edge: 1, padX: 16, padY: 13, labelIn: 4, tall: 92 },
  // `.fi.ro`: the birth date's lock 20.
  lock: 20,
  light: {
    // `.chip2`: the dark glass over the cover, its words and icon white.
    coverBtnFill: 'rgba(3, 27, 11, 0.62)',
    coverBtnInk: '#FFFFFF',
    cameraFill: '#031B0B',
    cameraInk: '#FFFFFF',
    note: '#6B7E71',
    fieldEdge: 'rgba(3, 27, 11, 0.10)',
    fieldFill: '#FFFFFF',
  },
  dark: {
    coverBtnFill: 'rgba(3, 27, 11, 0.62)',
    coverBtnInk: '#FFFFFF',
    cameraFill: 'rgba(255, 255, 255, 0.94)',
    cameraInk: '#0B0E0D',
    note: '#A3AEA8',
    fieldEdge: 'rgba(255, 255, 255, 0.08)',
    fieldFill: '#121614',
  },
} as const;
