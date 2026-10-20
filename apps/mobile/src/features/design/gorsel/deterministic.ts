// The visual gate's fixed world (CLAUDE.md → Görsel kapı): while a gate state is on screen the
// clock stands still and Math.random repeats the same numbers, so counters, "3 dk önce" and
// shuffles draw the same every run. Test builds only (the gorsel route); restored on leaving.

// 15 January 2026, 12:00 in Istanbul: a weekday noon, far from midnight and month ends.
export const GATE_NOW = Date.parse('2026-01-15T12:00:00+03:00');
export const GATE_SEED = 46;

// mulberry32: small, fast, and the same sequence on every engine.
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Freezes Date.now and seeds Math.random; the returned function puts both back.
export function freezeWorld(now = GATE_NOW, seed = GATE_SEED): () => void {
  const realNow = Date.now;
  const realRandom = Math.random;
  Date.now = () => now;
  Math.random = seededRandom(seed);
  return () => {
    Date.now = realNow;
    Math.random = realRandom;
  };
}
