// The riso launch's textures (Aura v65 §14.2–14.3; apps/mobile/assets/launch/README.md). The
// texture set is drawn full screen for a 390x844 dp phone at 3x; decoded whole, its 22 pictures
// would take about 260 MB. scripts/build-launch-textures.ts (`pnpm launch:textures`) cuts each to
// the part the launch uses, and LaunchCurtain places the cuts around the screen's centre with these
// boxes, so a screen of another size sees them centred. No imports: the script reads this file.

// The texture set's screen in dp, and its scale.
export const LAUNCH_ART = { w: 390, h: 844, scale: 3 } as const;

// A box from the screen's centre, in whole dp (whole pixels at 3x): [x, y, w, h].
export type TextureBox = readonly [x: number, y: number, w: number, h: number];

// Where each texture is used. The capsules' and the overlap's: everywhere their capsule goes in any
// launch (launchMotion.test.ts), and 4 dp for the boil; the letters': the wordmark's letters at
// the end of the word; the glow's: its 480x540 dp ellipse where it falls on the set's screen.
export const LAUNCH_TEXTURE_BOX = {
  glow: [-195, -270, 390, 540],
  a: [-102, -78, 229, 151],
  b: [-27, -73, 169, 151],
  cross: [-27, -73, 154, 146],
  letters: [-136, -48, 220, 97],
} as const satisfies Record<string, TextureBox>;
export type TextureLayer = keyof typeof LAUNCH_TEXTURE_BOX;

// The cut files (apps/mobile/assets/launch/<out>-<variant>.webp) and what each is cut from.
export const LAUNCH_TEXTURE_FILES: readonly { source: string; out: string; box: TextureLayer }[] = [
  { source: 'parilti-yarimton', out: 'kirpik-parilti', box: 'glow' },
  { source: 'mor-doku', out: 'kirpik-mor', box: 'a' },
  { source: 'pembe-doku', out: 'kirpik-pembe', box: 'b' },
  { source: 'beyaz-doku', out: 'kirpik-beyaz', box: 'cross' },
  { source: 'harf-s', out: 'kirpik-harf-s', box: 'letters' },
  { source: 'harf-k', out: 'kirpik-harf-k', box: 'letters' },
  { source: 'harf-a', out: 'kirpik-harf-a', box: 'letters' },
];
// Each texture's boil variants (1..3).
export const RISO_VARIANTS = 3;
