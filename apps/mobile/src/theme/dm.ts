// The DM, value for value from the approved board (tuval: Dm.dc.html; `menu` its options, `confirm`
// the block's sheet; 390 × 844, the status bar 47 high) where docs/design/iskelet.md → 5.5 gives no
// value of its own. The bubbles' colours and their 20 / 7 corners, the runs' 3 / 12, the capsule's 52
// and its 38 send (5.5), the menu's 256 to 272, 26 round, 6 apart (3.5) and the buttons' heights
// (2.1) are iskelet's; the top bar's heights are the owner's (KIT.size.dmPill).
// Yeni arayüz tuvali (16 Kasım: DmSohbet, DmKlavye, DmYanit, DmTepkiSenin, DmBos; their `.msg`,
// `.day`, `.new`, `.rx`, `.typing`, `.who`, `.fld`, `.snd`, `.eb`) redraws the stream, the top bar
// and the message bar: those values below say so; the rest stays the old board's.
export const DM = {
  // The stream (`.flow`): 12 from the sides; a bubble at most 78 % of the row.
  side: 12,
  share: 0.78,
  // A bubble (`.msg`): 7 above and under its words, 12 in; 18 round, the corner at the author's
  // foot 6 on a run's last (`.msg.g`, the others, all 18); no tail.
  bubble: { padTop: 7, padBottom: 7, padLeft: 12, padRight: 12, radius: 18, foot: 6 },
  // The time (`.s`): in the words' last line at the right, 4 over it, the ticks 16, 2 from it.
  time: { right: 12, bottom: 7, gap: 2, ticks: 16 },
  // The reactions under the bubble (`.rxs`, `.rx`): 4 under it and 6 over the next, 6 apart; a
  // pill 30 high, 4 in at its left and 10 at its right, the face 22 and its count 4 apart; the
  // viewer's own in a 2 ring of the ink.
  reactions: {
    top: 4,
    bottom: 6,
    gap: 6,
    height: 30,
    padLeft: 4,
    padRight: 10,
    face: 22,
    inner: 4,
  },
  mineRing: 2,
  // The quote in another's bubble (`.q`): 10 round, 6 / 10 inside, 8 over the words (`.msg{gap:8}`).
  quote: { radius: 10, padY: 6, padX: 10, gap: 8 },
  // "yazıyor" (`.typing`): a bubble 34 high, 14 in, its three dots 8, 5 apart, 6 under the last.
  typing: { height: 34, padX: 14, dot: 8, gap: 5, top: 6 },
  // The unread line (`.new`): the hairlines and the pill 8 apart, 8 above and under.
  fresh: { gap: 8, margin: 8 },
  // No message yet (DmBos `.demp`): a card 44 from the sides, 28 round, 22 / 20 / 24 inside, 16
  // over the middle (8 % of its height).
  empty: { side: 44, radius: 28, padTop: 22, padX: 20, padBottom: 24, lift: 16 },
  // tuval DmDuzenlendi (`.s .edt`): "düzenlendi" before the time, 500 and slanted, at 90 %, 4 from
  // it.
  edited: { gap: 4, opacity: 0.9 },
  // tuval DmDuzenle (`.msg.edg`): the message being edited outlined 2 in the ink, 2 out from it.
  editing: { outline: 2, offset: 2 },
  // The day (`.flow .day`): a glass pill, 4 / 12 inside, 10 under the previous message and 8 over
  // the next.
  day: { padY: 4, padX: 12, top: 10, bottom: 8 },
  // The top bar (`.top`, `.who`): 16 from the sides, the back and the capsule 8 apart; the capsule
  // 52, the face 40 (in its 2 ring) 6 in and 10 from the name; the menu's bare button (`.ib`) 40
  // wide and 44 high, 2 from the capsule's right, its dots 20.
  bar: {
    side: 16,
    gap: 8,
    pill: 52,
    face: 40,
    ring: 2,
    faceIn: 6,
    nameGap: 10,
    more: 44,
    moreW: 40,
    moreIn: 2,
  },
  // The message bar (`.cmp`): 12 from the sides, the field 52 and the send 8 apart; the words 20 in
  // (the board draws them after its emoji, which the app has not: the app's own); the send 52, its
  // paper plane 22; the edit's tick 18.
  // With nothing to send the send stays, off: 44 in the disabled grey (DmBos `.snd`).
  composer: { side: 12, gap: 8, padLeft: 20, send: 52, sendOff: 44, plane: 22, arrow: 18 },
  // The strip over it (`.eb`, answering and editing): 20 round, 8 above and under, 14 in at its
  // left and 6 at its right, 10 between its parts, the icon 20; its × 36 (icon 18); 8 over the bar.
  strip: { radius: 20, padY: 8, padLeft: 14, padRight: 6, gap: 10, icon: 20, close: 36, x: 18 },
  // The block's sheet: 20 inside, 22 under its last button; the face 64 in a 3 white ring, 18 under
  // the handle; the title 14 under it, the sentence 6 under the title, the buttons 20 and 12 apart.
  confirm: {
    padX: 20,
    padBottom: 22,
    face: 64,
    ring: 3,
    faceTop: 18,
    titleTop: 14,
    noteTop: 6,
    buttonsTop: 20,
    buttonsGap: 12,
  },
  // The held message's faces (`.rbar`): 4 inside, 2 apart, each 40 (its face 36); its menu 220
  // wide (`.hold .pop`).
  pick: { pad: 4, gap: 2, slot: 40, ring: 2, menu: 220 },
  // The menu: 6 inside above and under, its rows 50 high, 16 in, 12 between the icon (20) and the
  // words; the destructive group 6 under a 6 high band.
  menu: { width: 256, padY: 6, row: 50, padX: 16, gap: 12, icon: 20, bandGap: 6 },
  // tuval DmMenuSureDoldu (`.pnote`): the held message's menu's note, 4 under its rows over a
  // hairline, 8 / 12 / 6 inside.
  menuNote: { top: 4, padTop: 8, padX: 12, padBottom: 6 },
  light: {
    // Another's bubble (DmSohbet: `--bubble-dm` #0E8745) and its soft shadow in its colour; the own
    // one's shadow (its line is the kit's, `--bubble-mine-edge`).
    them: '#0E8745',
    themShadow: '0px 4px 12px rgba(14, 135, 69, 0.22)',
    mineShadow: '0px 4px 12px rgba(3, 27, 11, 0.10)',
    // A held bubble over the scrim (DmMesajMenu `.hold .msg`).
    heldShadow: '0px 12px 32px rgba(3, 27, 11, 0.18)',
    // The held message's faces (`.rbar`): the surface, its shadow; the viewer's own face on
    // --surface2 in a 2 ring of the ink (`.f.sel`).
    pick: {
      fill: '#FFFFFF',
      shadow: '0px 12px 32px rgba(3, 27, 11, 0.18)',
      edge: '',
      sel: '#E6F0E8',
      selRing: '#031B0B',
    },
    mineTime: '#4A6550',
    themTime: 'rgba(255, 255, 255, 0.80)',
    // The quote in another's bubble (`.q`): a white veil, the name white, the words at 88 %.
    quote: {
      fill: 'rgba(255, 255, 255, 0.18)',
      name: '#FFFFFF',
      text: 'rgba(255, 255, 255, 0.88)',
    },
    // A reaction's pill (`.rx`): the surface, the raised shadow, the ink words and ring.
    reaction: { fill: '#FFFFFF', shadow: '0px 2px 8px rgba(3, 27, 11, 0.08)', ink: '#031B0B' },
    // "yazıyor"'s three dots (`.typing i`): pink, amber, blue.
    typingDots: ['#FF4F8B', '#FFB547', '#7DB2FF'],
    // The day's pill and the unread line's (`--glass-bg`, `--glass-line`), the ink words; the
    // unread line's hairlines (`--hair`).
    day: {
      fill: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
      edge: 'rgba(255, 255, 255, 0.86)',
      inset: '',
      shadow: '',
    },
    dayInk: '#031B0B',
    freshLine: 'rgba(3, 27, 11, 0.07)',
    // The message bar (`.fld`): `.glass`; the hint (`--placeholder`); the send (`.snd`): the ink
    // round, the white plane, its shadow.
    composer: {
      fill: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
      edge: 'rgba(255, 255, 255, 0.86)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
    },
    hint: '#56785E',
    send: '#031B0B',
    sendInk: '#FFFFFF',
    sendShadow: '0px 4px 12px rgba(3, 27, 11, 0.18)',
    // The strip over the bar (`.eb`): `.glass`, the title in the ink, the words muted.
    strip: {
      fill: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
      edge: 'rgba(255, 255, 255, 0.86)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
    },
    stripMuted: '#4A6550',
    // No message yet (`.demp`): the surface and `--glass-shadow`.
    emptyCard: {
      fill: '#FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
      edge: '',
    },
    // A face's ring in the top bar (`.av`: 2 of --surface) and its shadow (--shadow-raised).
    faceRing: '#FFFFFF',
    faceShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
    // The top bar's name.
    name: '#031B0B',
    // The menu: a whiter glass, its edge, shadow and scrim; the icons, the band, the red.
    menu: {
      fill: 'rgba(250, 252, 250, 0.86)',
      // Without the live blur (iskelet.md → 2.2): the same white laid on the canvas, opaque.
      solid: '#F9FBF9',
      edge: 'rgba(255, 255, 255, 0.95)',
      shadow: '0px 20px 50px rgba(3, 27, 11, 0.25)',
      scrim: 'rgba(3, 27, 11, 0.10)',
      icon: '#31443A',
      band: 'rgba(3, 27, 11, 0.05)',
      danger: '#C8331F',
    },
    // The block's sheet: its ground, the face's ring and shadow, the sentence.
    confirm: {
      ground: '#F7FAF7',
      ring: '#FFFFFF',
      faceShadow: '0px 6px 16px rgba(3, 27, 11, 0.18)',
      note: '#4A6550',
    },
  },
  // The dark scheme is not drawn on the board: the kit's dark surfaces, no shadows.
  // koyu.css and the boards' `.dark` rules.
  dark: {
    them: '#0B783D',
    themShadow: '',
    mineShadow: '0px 4px 12px rgba(0, 0, 0, 0.30)',
    heldShadow: '',
    pick: {
      fill: '#151A18',
      shadow: '',
      edge: 'rgba(255, 255, 255, 0.08)',
      sel: '#262E2B',
      selRing: '#EEF3F0',
    },
    mineTime: '#4A6550',
    themTime: 'rgba(255, 255, 255, 0.74)',
    quote: {
      fill: 'rgba(255, 255, 255, 0.18)',
      name: '#FFFFFF',
      text: 'rgba(255, 255, 255, 0.88)',
    },
    reaction: { fill: '#1B211F', shadow: '', ink: '#EEF3F0' },
    typingDots: ['#FF4F8B', '#FFB547', '#7DB2FF'],
    day: { fill: '#121614', edge: 'rgba(255, 255, 255, 0.09)', inset: '', shadow: '' },
    dayInk: '#EEF3F0',
    freshLine: 'rgba(255, 255, 255, 0.22)',
    composer: { fill: '#121614', edge: 'rgba(255, 255, 255, 0.09)', inset: '', shadow: '' },
    hint: '#8F9A94',
    send: 'rgba(255, 255, 255, 0.94)',
    sendInk: '#0B0E0D',
    sendShadow: '',
    strip: { fill: '#121614', edge: 'rgba(255, 255, 255, 0.08)', inset: '', shadow: '' },
    stripMuted: '#A3AEA8',
    emptyCard: { fill: '#121614', shadow: '', edge: 'rgba(255, 255, 255, 0.08)' },
    faceRing: '#151A18',
    faceShadow: '',
    name: '#E6EEE9',
    menu: {
      fill: 'rgba(18, 22, 20, 0.92)',
      solid: '#121614',
      edge: 'rgba(255, 255, 255, 0.09)',
      shadow: '0px 20px 50px rgba(0, 0, 0, 0.45)',
      scrim: 'rgba(0, 0, 0, 0.20)',
      icon: '#A3AEA8',
      band: 'rgba(255, 255, 255, 0.05)',
      danger: '#FF6B57',
    },
    confirm: {
      ground: '#121614',
      ring: '#121614',
      faceShadow: '',
      note: '#A3AEA8',
    },
  },
} as const;
