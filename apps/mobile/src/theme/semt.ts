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
    // iskelet.md → 5.1: Keşfet's one featured card on the ink ground; the gate a sticker turned a
    // little, a buddy standing beside it over its lower left, the live dot before the eyebrow.
    art: { tilt: '-7deg', buddy: { width: 46, height: 60 }, overlap: 24, edge: 3 },
    stickerEdge: '#FFFFFF',
    eyebrowGap: 8,
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
  // The picture over the top of Geçit, Açık, Oturum kapandı, Dışarıda and Konum (yeni arayüz tuvali
  // 12, 13, 100, 101, 102: `.hero`, `.hdr`, `.txt`; the canvas's phone is 844 high with a 60 status
  // bar). Heights are under the status bar; the offsets are from the top bar's foot. Scaled with
  // the window's height (`refHeight`) so a short phone keeps the foot in view.
  hero: {
    refHeight: 844,
    minScale: 0.6,
    // The picture's height under the status bar: 400 - 60 (Geçit: 360 - 60; short: 250 - 60).
    tall: 340,
    gate: 300,
    short: 190,
    // The words' offset from the bar's foot (`.txt` margin-top), and the note's (`.note`).
    textTop: 318,
    textTopShort: 168,
    noteTop: 226,
    // The bar (`.hdr`, 56) and the scallop along the picture's foot (cells of 20, notches of 8).
    bar: 56,
    scallop: { cell: 20, radius: 8 },
    // The short pictures' paper ground (`.hero` of 101, 102).
    paper: '#EDE7D7',
    // The round buttons over the picture (`.round.gl`) and the words on it (`.ey2`).
    round: { bg: 'rgba(5, 30, 24, 0.55)', edge: 'rgba(255, 255, 255, 0.18)', ink: '#FFFFFF' },
    onPicture: { ink: '#FFFFFF', soft: 'rgba(255, 255, 255, 0.78)' },
    // Where Oturum kapandı's picture sits in its frame (`object-position` x; the others 50%).
    focusClosed: '78%',
    // The footer's waiting line over the button (`.fnd`).
    findGap: 8,
    findBottom: 8,
  },
  // The question's paper (`.note`): the same paper in both schemes.
  note: {
    paper: '#FBF5E4',
    ink: '#16141C',
    label: '#C2185B',
    radius: 8,
    padTop: 22,
    padX: 20,
    padBottom: 20,
    rotateDeg: -1.4,
    shadow: '0px 12px 26px rgba(0, 0, 0, 0.28)',
    pin: { size: 18, top: -9, color: '#FF4F8B', shadow: '0px 2px 4px rgba(0, 0, 0, 0.3)' },
    // 12 in from the page's sides.
    inset: 12,
    questionTop: 8,
    maxLines: 3,
  },
  // The option tickets (`.op`): two columns 10 apart, 24 under the paper; a stub of 52 behind a
  // dashed line, notches of 8 at the line.
  ticket: {
    top: 24,
    gap: 10,
    minHeight: 62,
    radius: 16,
    stub: 52,
    notch: 8,
    textPadLeft: 18,
    textPadRight: 12,
    textPadY: 10,
    dashInset: 10,
    light: {
      ground: '#FFFFFF',
      stub: '#E3EFE6',
      dash: 'rgba(3, 27, 11, 0.2)',
      onGround: '#CDEFD9',
      onStub: '#0E8745',
      onDash: 'rgba(255, 255, 255, 0.6)',
      onInk: '#FFFFFF',
    },
    dark: {
      ground: '#121614',
      stub: '#1C2320',
      dash: 'rgba(255, 255, 255, 0.2)',
      onGround: 'rgba(61, 220, 132, 0.14)',
      onStub: '#3DDC84',
      onDash: 'rgba(255, 255, 255, 0.6)',
      onInk: '#031B0B',
    },
  },
  // Geçit açıldı's ticket (`.tk`): 88 high, 18 round, a stub of 84, notches of 9.
  entryTicket: {
    top: 24,
    minHeight: 88,
    radius: 18,
    stub: 84,
    notch: 9,
    stubGap: 4,
    icon: 26,
    padTop: 14,
    padRight: 16,
    padBottom: 14,
    padLeft: 20,
    gap: 2,
    dashInset: 12,
    dash: 'rgba(255, 255, 255, 0.7)',
    light: { ground: '#FFFFFF', stub: '#0E8745', ink: '#FFFFFF' },
    dark: { ground: '#121614', stub: '#3DDC84', ink: '#031B0B' },
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
