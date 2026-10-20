// The visual gate's fixed world (CLAUDE.md → Görsel kapı): while a gate state is on screen the
// clock stands still and Math.random repeats the same numbers, so counters, "3 dk önce" and
// shuffles draw the same every run. Test builds only (the gorsel route).

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

// Stops Date.now at the gate's moment for the rest of the process and starts Math.random's
// sequence again from the seed. Never put back: the gate starts the app afresh for every shot
// (scripts/visual/flow.ts), and putting it back on leaving a state undid the next state's freeze
// (the leaving screen's cleanup ran after the next one had frozen the clock). A test build opened
// on the route by hand keeps the stopped clock until it is restarted.
export function freezeWorld(now = GATE_NOW, seed = GATE_SEED): void {
  Date.now = () => now;
  Math.random = seededRandom(seed);
}
