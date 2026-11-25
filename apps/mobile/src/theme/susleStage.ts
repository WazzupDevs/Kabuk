// The ground behind Süsle's large capsule (Atölye `susleStage`, the owner's ask, 22 Kasım): a white,
// silver or glowing accessory stands out and the room over the circle is not empty. B, the night
// card, approved (22 Kasım) and drawn by features/capsule/SceneNight.tsx; C stays the draft's.
export const SUSLE_STAGE = {
  // B: a night card from under the top bar to over the two buttons.
  night: {
    radius: 28,
    ground:
      'radial-gradient(55% 45% at 50% 63%, rgba(155, 110, 255, 0.45), transparent 70%), ' +
      'linear-gradient(180deg, #151236 0%, #1E1A4A 60%, #161335 100%)',
    star: '#FFFFFF',
    starSoft: '#CFC6FF',
    edge: 'rgba(190, 160, 255, 0.18)',
  },
  // C: a soft purple light round the circle only.
  glow: {
    ground: 'radial-gradient(50% 50% at 50% 50%, rgba(139, 108, 255, 0.38), transparent 70%)',
  },
  // The stars of B, in shares of the card (x, y, radius in dp, soft or bright).
  stars: [
    [0.12, 0.14, 1.6, 0],
    [0.24, 0.32, 1, 1],
    [0.08, 0.55, 1.2, 1],
    [0.18, 0.8, 1.6, 0],
    [0.86, 0.12, 1.2, 1],
    [0.78, 0.28, 1.8, 0],
    [0.92, 0.46, 1, 1],
    [0.84, 0.74, 1.4, 0],
    [0.62, 0.08, 1, 1],
    [0.36, 0.1, 1.2, 1],
  ] as const,
} as const;
