import {
  activePlayers,
  nextActive,
  type SprengjaPhase,
  type SprengjaResult,
  type SprengjaState,
} from '@shared/sprengja.ts';

// What Sprengja's screens draw from the table's open state (docs/SPEC_V4.md §4.F "Adım 4.6.8",
// Aura v99): the ring's seats, the throw's arc, the score rows, the end's words and the one touch.
// Pure, so it is tested (sprengjaView.test.ts).

// ------------------------------------------------------------------ the ring

export type RingSeat = { sid: string; angle: number; out: boolean };

// The seats round the table: 360/n apart clockwise in the throwing order, the caller at the
// bottom (90°, the screen's y pointing down); a watcher sees the order's first there.
export function ringSeats(
  order: readonly string[],
  gone: readonly string[],
  me: string,
): RingSeat[] {
  const n = order.length;
  if (n === 0) return [];
  const mine = order.indexOf(me);
  const base = mine < 0 ? 0 : mine;
  return order.map((sid, i) => ({
    sid,
    angle: 90 + (((i - base + n) % n) * 360) / n,
    out: gone.includes(sid),
  }));
}

export type Point = { x: number; y: number };

export function onCircle(angle: number, radius: number, centre: number): Point {
  const a = (angle * Math.PI) / 180;
  return { x: centre + radius * Math.cos(a), y: centre + radius * Math.sin(a) };
}

// The throw's arc from the holder to the one it goes to, clockwise, past any seat of one who left:
// an SVG path on a circle of `radius` round (centre, centre).
export function arcPath(from: number, to: number, radius: number, centre: number): string {
  const a = onCircle(from, radius, centre);
  const b = onCircle(to, radius, centre);
  const sweep = (((to - from) % 360) + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  const r = round(radius);
  return `M${round(a.x)} ${round(a.y)} A${r} ${r} 0 ${large} 1 ${round(b.x)} ${round(b.y)}`;
}
const round = (v: number) => Math.round(v * 100) / 100;

// How many throws until the bomb reaches `me` from the holder (1: `me` is next); null when it
// never does (a watcher, one who left).
export function throwsUntil(
  state: Pick<SprengjaState, 'order' | 'gone' | 'holder'>,
  me: string,
): number | null {
  if (!state.holder || !state.order.includes(me) || state.gone.includes(me)) return null;
  let at: string | null = state.holder;
  for (let k = 1; k <= state.order.length; k++) {
    at = at ? nextActive(state.order, state.gone, at) : null;
    if (at === null) return null;
    if (at === me) return k;
  }
  return null;
}

// ------------------------------------------------------------------ the scores

export type ScoreRow = { sid: string; hits: number; out: boolean };

// Those still in the game first, fewest blasts first (the throwing order between equals); then
// those who left the same way.
export function scoreRows(state: Pick<SprengjaState, 'order' | 'gone' | 'hits'>): ScoreRow[] {
  const row = (sid: string): ScoreRow => ({
    sid,
    hits: state.hits[sid] ?? 0,
    out: state.gone.includes(sid),
  });
  const byHits = (a: ScoreRow, b: ScoreRow) => a.hits - b.hits;
  const active = activePlayers(state).map(row).sort(byHits);
  const left = state.order
    .filter((s) => state.gone.includes(s))
    .map(row)
    .sort(byHits);
  return [...active, ...left];
}

// The rows whose points show in --buzz at the end: those still in the game with the most blasts,
// unless everyone has as many.
export function mostHit(rows: readonly ScoreRow[]): Set<string> {
  const active = rows.filter((r) => !r.out);
  if (active.length === 0) return new Set();
  const most = Math.max(...active.map((r) => r.hits));
  const least = Math.min(...active.map((r) => r.hits));
  return new Set(most > least ? active.filter((r) => r.hits === most).map((r) => r.sid) : []);
}

// ------------------------------------------------------------------ the end

// The end's heading (the report's "Ortak kazanan metinleri"): who won, ordered as they sat, the
// caller among them or not, and how often the bomb went off in each winner's hands.
export type EndWords =
  | { kind: 'abandoned' }
  | { kind: 'all'; hits: number }
  | { kind: 'one'; sid: string; you: boolean; hits: number }
  | { kind: 'two'; others: string[]; you: boolean; hits: number }
  | { kind: 'many'; winners: string[]; you: boolean; hits: number };

export function endWords(result: SprengjaResult, me: string): EndWords {
  if (result.abandoned || result.winners.length === 0) return { kind: 'abandoned' };
  const winners = result.order.filter((s) => result.winners.includes(s));
  const active = result.order.filter((s) => !result.gone.includes(s));
  const hits = result.hits[winners[0] as string] ?? 0;
  const you = winners.includes(me);
  if (winners.length === active.length && active.length > 1) return { kind: 'all', hits };
  if (winners.length === 1) return { kind: 'one', sid: winners[0] as string, you, hits };
  if (winners.length === 2) {
    return { kind: 'two', others: winners.filter((s) => s !== me), you, hits };
  }
  return { kind: 'many', winners, you, hits };
}

// ------------------------------------------------------------------ the touch

// What the phone saw before this state: the game, round and phase.
export type Seen = { gameNo: number; round: number; phase: SprengjaPhase };

// The one strong touch of Sprengja (the owner's decision, 5 Kasım): only to the one the bomb went
// off with, only once the server settled it (the state moved on from the round's burning fuse with
// the blast in this person's hands), never from a guess on the phone, at most once a game and
// round. The key to remember it by, or null. `done` holds the keys already felt.
export function blastBuzz(
  done: ReadonlySet<string>,
  before: Seen | null,
  now: SprengjaState,
  me: string,
): string | null {
  if (!before || before.phase !== 'lit' || before.gameNo !== now.gameNo) return null;
  const blast = now.lastBlast;
  if (!blast || blast.holder !== me || blast.gone || blast.round !== before.round) return null;
  if (now.phase === 'lit' && now.round === before.round) return null;
  const key = `${now.gameNo}:${blast.round}`;
  return done.has(key) ? null : key;
}
