import { seatSize, TABLE } from './vampirTableSize.ts';

// Where the capsule table's people sit, their cards and candles (the reference code's build.py →
// ring, seats), in the scene's frame.
export type Point = readonly [number, number];

const { cx: CX, cy: CY } = TABLE.frame;

// A point `s` along a stadium of half width `a` round the table's middle, from the bottom, round
// to the left (anticlockwise on the screen), and the outward normal's angle there.
export function alongStadium(s: number, a: number): { at: Point; angle: number } {
  const h = TABLE.straight;
  const q = Math.PI * a;
  const per = 2 * q + 4 * h;
  let r = ((s % per) + per) % per;
  if (r < q / 2) {
    const th = Math.PI / 2 + r / a;
    return { at: [CX + a * Math.cos(th), CY + h + a * Math.sin(th)], angle: th };
  }
  r -= q / 2;
  if (r < 2 * h) return { at: [CX - a, CY + h - r], angle: Math.PI };
  r -= 2 * h;
  if (r < q) {
    const th = Math.PI + r / a;
    return { at: [CX + a * Math.cos(th), CY - h + a * Math.sin(th)], angle: th };
  }
  r -= q;
  if (r < 2 * h) return { at: [CX + a, CY - h + r], angle: 0 };
  r -= 2 * h;
  const th = r / a;
  return { at: [CX + a * Math.cos(th), CY + h + a * Math.sin(th)], angle: th };
}

export type SeatPlace = {
  // The seat's (and the face's) middle.
  seat: Point;
  // The card's middle and its turn (its foot towards the person), in degrees.
  card: Point;
  turn: number;
  // The candle's middle.
  candle: Point;
};

// `n` seats at even steps round the table, the first (the person) at the bottom.
export function seatsAround(n: number): SeatPlace[] {
  const g = seatSize(n);
  const a = TABLE.half + g.off;
  const per = 2 * Math.PI * a + 4 * TABLE.straight;
  return Array.from({ length: n }, (_, i) => {
    const { at, angle } = alongStadium((i * per) / n, a);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    const d = g.off + g.cardIn;
    const card: Point = [at[0] - nx * d, at[1] - ny * d];
    return {
      seat: at,
      card,
      turn: (angle * 180) / Math.PI - 90,
      candle: [card[0] - ny * g.candleBy, card[1] + nx * g.candleBy],
    };
  });
}
