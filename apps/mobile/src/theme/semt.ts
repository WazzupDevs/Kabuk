// Semte Git and Geçit (docs/design/aura/project/semt.css, aktarim-semte-git.md §2): the values the
// shared kit does not have, value for value. Light from `:root`, dark from `.dark`. The rest (glass,
// buttons, chips, the chat) is the kit's (theme/auraKit.ts) and the theme's palette.
export const SEMT = {
  // The riso scenes (`.scn`): 350 wide on the canvas, 28 round; the dark scheme draws no shadow.
  scene: {
    width: 350,
    gecit: 240,
    // SemteGitKonum, SemtOdaBos (`.s230`) and SemtDisari (`.s250`).
    short: 230,
    tall: 250,
    radius: 28,
    shadow: '0px 10px 22px rgba(3, 27, 11, 0.10)',
    // Under the top bar 8, the title 20 (Konum) or 24 (Açık, Kapalı, Dışarı, Bitti) below it.
    top: 8,
    titleTop: 20,
    titleTopCentered: 24,
    textTop: 8,
    chipTop: 16,
    countdownTop: 20,
  },
  // Keşfet's card (`.sg-card`): 16 inside, 14 between the words and the door, 22 round.
  card: {
    pad: 16,
    gap: 14,
    radius: 22,
    lineGap: 4,
    buttonTop: 8,
    door: { width: 72, height: 86, radius: 16, shadow: '0px 6px 14px rgba(4, 73, 35, 0.16)' },
    meta: { gap: 6, icon: 16 },
    // The skeleton (`.sk`): its bars' widths and heights.
    skeleton: {
      gap: 8,
      eyebrow: { width: 84, height: 14 },
      title: { width: '90%', height: 18 },
      line: { width: '70%', height: 14 },
      button: { width: 110, height: 36 },
      radius: 12,
    },
  },
  // The eyebrow's ink (`.sg-eb`, `.tchip .ci`, `.sg-meta .ci`).
  eyebrow: { light: '#0A7139', dark: '#3DDC84' },
  // The question's paper (`.note`): the same paper in both schemes.
  note: {
    paper: '#FBF6E4',
    ink: '#1B1A14',
    label: '#B0124F',
    radius: 6,
    padTop: 18,
    padX: 18,
    padBottom: 16,
    rotateDeg: -1.2,
    shadow: '0px 10px 20px rgba(3, 27, 11, 0.16)',
    darkEdge: 'rgba(255, 255, 255, 0.06)',
    pin: { size: 16, top: -8, color: '#E8457A', shadow: '0px 3px 4px rgba(0, 0, 0, 0.25)' },
    // It lies 56 over the scene's foot, 14 in from its sides.
    overlap: 56,
    inset: 14,
    questionTop: 6,
    maxLines: 3,
  },
  // The option tickets (`.tk`): two columns 10 apart, 20 under the paper.
  ticket: {
    top: 20,
    gap: 10,
    minHeight: 56,
    radius: 12,
    stub: 44,
    notch: 6,
    textPadX: 12,
    textPadY: 10,
    light: {
      ground: '#FFFFFF',
      edge: 'rgba(3, 27, 11, 0.12)',
      dash: 'rgba(3, 27, 11, 0.18)',
      onGround: '#CDEFD9',
      onEdge: '#0E8745',
      onDash: 'rgba(14, 135, 69, 0.45)',
      onLetter: '#0A7139',
    },
    dark: {
      ground: '#151A18',
      edge: 'rgba(255, 255, 255, 0.12)',
      dash: 'rgba(255, 255, 255, 0.16)',
      onGround: 'rgba(61, 220, 132, 0.14)',
      onEdge: '#3DDC84',
      onDash: 'rgba(61, 220, 132, 0.45)',
      onLetter: '#3DDC84',
    },
  },
  // The waiting ring (`.spin`).
  spin: { size: 20, line: 2 },
  // The time chip (`.tchip`): 36 high, 10 before the clock icon, 14 after the words.
  timeChip: { height: 36, padLeft: 10, padRight: 14, gap: 6, icon: 16, top: 8 },
  // The countdown (`.cd`).
  countdown: { pad: 16, gap: 4, radius: 22 },
  // The warning row (`.wrow`): in the flow over the buttons, never over one.
  warn: { radius: 16, padX: 14, padY: 10, gap: 10, icon: 16 },
  // The "Devam?" bar (`.prog`).
  progress: {
    height: 6,
    light: { fill: '#0E8745', track: '#E0EDE2' },
    dark: { fill: '#3DDC84', track: '#1B211F' },
  },
  // The identity strip (`.idst`): 6 inside, 22 round, a 30 face.
  identity: { pad: 6, radius: 22, gap: 10, rowGap: 6, labelGap: 8, face: 30 },
  // The skeleton's ground (`.sk`).
  skeleton: {
    light: { ground: 'rgba(255, 255, 255, 0.74)', edge: '#FFFFFF' },
    dark: { ground: '#1B211F', edge: 'rgba(255, 255, 255, 0)' },
  },
  // The empty room (SemtOdaBos): the title `title`, the words `body`.
  empty: { gap: 8 },
  // The dev project's hand pick of a district.
  pickGap: 8,
} as const;

// The layers of the moving scenes, in the 350 × 240 (bank: 350 × 230) scene's dp
// (aktarim-semte-git.md §5; pictures at 3x, their dp from their pixels).
export const SEMT_LAYERS = {
  // The closed leaf over the doorway (x 119–231, y 54–204); its picture 119 × 160.
  leaf: { left: 119, top: 49, width: 119.3, height: 159.7 },
  // The light from the doorway down to the floor, centred on the doorway.
  light: { width: 243.3, height: 187.7, bottom: 0 },
  // The three buddies' centres; each picture about 40 × 52.
  buddies: [
    { x: 147, y: 172, width: 40.3, height: 52 },
    { x: 179, y: 166, width: 40.3, height: 52.7 },
    { x: 205, y: 176, width: 40, height: 52.3 },
  ],
  // The padlock's centre and picture.
  lock: { x: 175, y: 140, width: 36, height: 43.7 },
  // The four drops from the cloud, between x 230 and 260, y 138 and 152.
  drop: { width: 10, height: 12.7, x: [230, 240, 250, 260], y: [138, 152, 142, 148] },
  // The bench's three dots (bank-nokta, r 3.8).
  dots: { size: 12, y: 66, x: [176, 190, 204] },
} as const;
