import { MOTION } from './aura';

// Hediye paketleri's motion (the transfer report's `motionHediye` table, 7 Kasım; docs/SPEC_V4.md
// §4.U): springs and curves from the standard (aura.ts → MOTION), the rest its own numbers.
export const GIFT_MOTION = {
  // Kart → Paketler morph; back morphBack.
  open: MOTION.springs.morph,
  back: MOTION.springs.morphBack,
  // The card's packs float: y ±3, 2.6 s, each pack 0.65 s later.
  cardFloat: { px: 3, ms: 2600, stepMs: 650 },
  // The ring floats: y ±4, 2.6 s, 0.65 s apart.
  ringFloat: { px: 4, ms: 2600, stepMs: 650 },
  // The ring turns 0.4° a pixel; let go, it settles on the nearest 90° (morph); a fling of at least
  // 0.5 px/ms goes to the next pack; round and round.
  ring: { degPerPx: 0.4, flingPxPerMs: 0.5, settle: MOTION.springs.morph },
  // The info under the ring while it turns: 0.35; settled, it dissolves in over 220 ms.
  info: { turningOpacity: 0.35, inMs: 220 },
  // Opening: the pack zooms to the rip (morph, about 550 ms), the others leave (220), the X, the
  // title, the hint and Atla arrive (220).
  zoom: { spring: MOTION.springs.morph, otherMs: 220, chromeMs: 220 },
  // The badge beats in 1.6 s: 1 → 1.12 → 1; its ring 1 → 2.1, 0.85 → 0.
  badge: { ms: 1600, scale: 1.12, ringTo: 2.1, ringFrom: 0.85 },
  // Buttons press to 0.94 in 100 ms, back on 500/22.
  press: { scale: 0.94, downMs: 100, spring: MOTION.springs.press },
  // The odds sheet: morph; its scrim arrives in 450, closes in 220.
  sheet: { spring: MOTION.springs.morph, scrimInMs: 450, outMs: 220 },
  // The rip: done at 70 %; under it morphBack; past it the strip 450 ms, the card 500, the pack 300;
  // about 1150 ms from the release to the result.
  rip: { threshold: 0.7, back: MOTION.springs.morphBack, stripMs: 450, cardMs: 500, packMs: 300 },
  // The card tilts 0.3° a pixel, ±22° about Y and the angle/12 about Z, perspective 900; the band
  // at 50 % − 2.2 × angle (screen), the holo at 120° + 6 × angle and 30 % + angle/40 (overlay); let
  // go, morphBack.
  tilt: { degPerPx: 0.3, max: 22, zPer: 12, perspective: 900, back: MOTION.springs.morphBack },
  // Tak: the avatar pops (260/17).
  wear: MOTION.springs.pop,
  curves: MOTION.curves,
} as const;
