import type { CapsuleKey } from '@/theme/capsules';

import type { SignupStep } from './signupSteps';

// The sign-up friends (docs/SPEC_V4.md §4.C, the v45 report §3): on each step a different capsule
// peeks from the right edge. Decoration only: it never covers a word, a field or a button. If it
// would, it moves up by at most 18 dp (staying under the top row); if it still would, it does not
// show on that step (v45: palFit; K-31 accepts that at 320 dp with the largest text). Pure, so
// signupFriend.test.ts pins the geometry; SignupFriend.tsx draws it.

export const FRIEND_LOOKS: Record<SignupStep, CapsuleKey> = {
  consents: 'shades',
  phone: 'pirate',
  code: 'patch',
  name: 'cat',
  birth: 'party',
  gender: 'none',
  photo: 'captain',
};

// The figure: 58 x 80, turned -14° about its bottom-right corner, 16 dp past the screen's edge.
// Its box is 60 wide; the title and the line under it keep 42 dp clear on the right.
export const FRIEND = {
  width: 58,
  height: 80,
  angle: -14,
  overhang: 16,
  box: 60,
  textInset: 42,
  shifts: [0, 6, 12, 18],
  margin: 4, // around what it must not cover
  bubbleMargin: 14,
  greetMax: 12, // characters of a name in "Selam …!"
} as const;

export type Rect = { x: number; y: number; width: number; height: number };
export type Point = readonly [number, number];

// Where the figure goes besides its rest (SignupFriend.tsx animates to these): the top of its jump
// (v45: palJump, 4 left, 18 up, turned -4°), the widest turn of its head shake (palNo, -24°) and the
// bottom of its nod (palNod, 6 down). A move whose pose would cover something is not played
// (friendMoves; the CTO's 4.3d review).
export type Pose = { angle: number; dx: number; dy: number };
export const FRIEND_REST: Pose = { angle: FRIEND.angle, dx: 0, dy: 0 };
export const FRIEND_JUMP: Pose = { angle: -4, dx: -4, dy: -18 };
export const FRIEND_SHAKE: Pose = { angle: -24, dx: 0, dy: 0 };
export const FRIEND_NOD: Pose = { angle: FRIEND.angle, dx: 0, dy: 6 };

// The turned figure's corners when its box's right edge is at `right` and its top at `top`, in a
// pose (its rest by default).
export function figurePoly(right: number, top: number, pose: Pose = FRIEND_REST): Point[] {
  const a = (pose.angle * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const ox = right + FRIEND.overhang + pose.dx;
  const oy = top + FRIEND.height + pose.dy;
  const corners: Point[] = [
    [0, 0],
    [-FRIEND.width, 0],
    [-FRIEND.width, -FRIEND.height],
    [0, -FRIEND.height],
  ];
  return corners.map(([x, y]) => [ox + x * c - y * s, oy + x * s + y * c] as const);
}

// Whether the turned figure and a rectangle (grown by `margin`) overlap: separating axes.
export function polyHits(poly: readonly Point[], r: Rect, margin: number = FRIEND.margin): boolean {
  const box: Point[] = [
    [r.x - margin, r.y - margin],
    [r.x + r.width + margin, r.y - margin],
    [r.x + r.width + margin, r.y + r.height + margin],
    [r.x - margin, r.y + r.height + margin],
  ];
  const p0 = poly[0] as Point;
  const p1 = poly[1] as Point;
  const p2 = poly[2] as Point;
  const edges: Point[] = [
    [1, 0],
    [0, 1],
    [p1[0] - p0[0], p1[1] - p0[1]],
    [p2[0] - p1[0], p2[1] - p1[1]],
  ];
  return edges.every(([ex, ey]) => {
    const ax = -ey;
    const ay = ex;
    const pa = poly.map(([x, y]) => x * ax + y * ay);
    const ra = box.map(([x, y]) => x * ax + y * ay);
    return Math.max(...pa) > Math.min(...ra) && Math.max(...ra) > Math.min(...pa);
  });
}

// How far up the friend goes on this step (0, 6, 12 or 18), or null when it does not show:
// `right` is the screen's edge, `top` its resting top, `topLimit` the bottom of the top row.
export function fitFriend(
  right: number,
  top: number,
  blockers: readonly Rect[],
  topLimit: number,
): number | null {
  for (const shift of FRIEND.shifts) {
    const poly = figurePoly(right, top - shift, FRIEND_REST);
    const highest = Math.min(...poly.map(([, y]) => y));
    if (highest < topLimit - 2) continue;
    if (!blockers.some((r) => polyHits(poly, r))) return shift;
  }
  return null;
}

export type FriendMoves = { jump: boolean; shake: boolean; nod: boolean };

// Where the friend rests and which moves it plays there, or null when it does not show: among the
// heights where it fits at rest (fitFriend's), the one where the most moves fit too, the lowest on
// a tie. It shows exactly where fitFriend would let it; moving up a little more buys it its moves.
export function placeFriend(
  right: number,
  top: number,
  blockers: readonly Rect[],
  topLimit: number,
): { shift: number; moves: FriendMoves } | null {
  let best: { shift: number; moves: FriendMoves; count: number } | null = null;
  for (const shift of FRIEND.shifts) {
    const poly = figurePoly(right, top - shift, FRIEND_REST);
    if (Math.min(...poly.map(([, y]) => y)) < topLimit - 2) continue;
    if (blockers.some((r) => polyHits(poly, r))) continue;
    const moves = friendMoves(right, top, shift, blockers, topLimit);
    const count = Number(moves.jump) + Number(moves.shake) + Number(moves.nod);
    if (!best || count > best.count) best = { shift, moves, count };
  }
  return best && { shift: best.shift, moves: best.moves };
}

// Which moves fit where it rests (`top` moved up by `shift`): one whose pose would cover a word, a
// field, the step counter (in `blockers`) or, for the shake and the nod, rise into the top row is
// not played and the friend stays still. Its jump may rise into the top row, but not over the
// counter. The error is said by its text anyway; the eyes still squint.
export function friendMoves(
  right: number,
  top: number,
  shift: number,
  blockers: readonly Rect[],
  topLimit: number,
): FriendMoves {
  const clear = (pose: Pose, underRow: boolean) => {
    const poly = figurePoly(right, top - shift, pose);
    if (underRow && Math.min(...poly.map(([, y]) => y)) < topLimit - 2) return false;
    return !blockers.some((r) => polyHits(poly, r));
  };
  return {
    jump: clear(FRIEND_JUMP, false),
    shake: clear(FRIEND_SHAKE, true),
    nod: clear(FRIEND_NOD, true),
  };
}

// Whether two rectangles overlap, the first grown by `margin` (the bubble against the words).
export function rectsHit(a: Rect, b: Rect, margin: number): boolean {
  return !(
    b.x + b.width < a.x - margin ||
    b.x > a.x + a.width + margin ||
    b.y + b.height < a.y ||
    b.y > a.y + a.height
  );
}

// The name step's bubble (v45: palName): "Selam Elif!", or "Selam!" for a name over 12 characters;
// none while the name is not valid.
export function greeting(
  name: string,
  valid: boolean,
  labels: { named: (n: string) => string; plain: string },
): string | null {
  if (!valid) return null;
  const trimmed = name.trim();
  return [...trimmed].length <= FRIEND.greetMax ? labels.named(trimmed) : labels.plain;
}
