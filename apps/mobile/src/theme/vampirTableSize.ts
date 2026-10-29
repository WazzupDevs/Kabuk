// The round table's sizes (docs/design/vampir/yuvarlak-masa.html), apart from its colours and type
// so its geometry and test read no React Native types (vampirTable.ts re-exports it).
export const TABLE = {
  // The table's own frame: as wide as the file's phone, from the top seat's face to the bottom
  // seat's role chip; its middle where the file's table is (180, 420 on the phone).
  frame: { width: 360, height: 484, cx: 180, cy: 222 },
  // The seats' ellipse, the wood and the felt (the file's tableSvg).
  seat: { rx: 134, ry: 196, width: 76 },
  rim: { rx: 118, ry: 182 },
  felt: { rx: 101, ry: 165 },
  // Faces: up to eight people 46, more 40 (the file's twelve).
  face: { many: 8, big: 46, small: 40, ring: 2, pickRing: 3 },
  // A line keeps this far from the middle, so it never runs under the medallion.
  clear: 90,
  medal: 148,
  card: { width: 150, height: 200, edge: 4, radius: 14, back: -4, front: 3 },
  endCard: { width: 120, height: 160, turn: -3 },
  // The medallion's face for the morning's dead and the voted out.
  medalFace: 72,
  // The page round the table (the file's .m: status 32, bar 38, prompt 90, foot 20 from the end).
  bar: 42,
  barTop: 6,
  promptTop: 10,
  promptSide: 22,
  side: 16,
  footGap: 10,
  footBottom: 20,
  button: 52,
} as const;
