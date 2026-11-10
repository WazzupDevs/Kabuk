import { describe, expect, it } from 'vitest';

import {
  apply,
  boxUnder,
  defBox,
  IDENTITY,
  intersect,
  multiply,
  parseTransform,
  pathPoints,
  shapeBox,
} from './svgBox';

const near = (a: readonly number[] | null, b: readonly number[]) => {
  expect(a).not.toBeNull();
  b.forEach((v, i) => expect(a?.[i]).toBeCloseTo(v, 6));
};

describe('svg boxes', () => {
  it('reads a transform, the first one outermost', () => {
    near(parseTransform('translate(10 4.8) scale(0.8)'), [0.8, 0, 0, 0.8, 10, 4.8]);
    near(
      parseTransform('translate(-2.923,-3.846)scale(0.53846)'),
      [0.53846, 0, 0, 0.53846, -2.923, -3.846],
    );
    const r = parseTransform('rotate(90 10 0)');
    near(apply(r ?? IDENTITY, 10, 5), [5, 0]);
    expect(parseTransform('perspective(2)')).toBeNull();
    near(multiply([2, 0, 0, 2, 0, 0], [1, 0, 0, 1, 3, 4]), [2, 0, 0, 2, 6, 8]);
  });

  it('holds a path with its control points and its arcs', () => {
    const pts = pathPoints('M20 34C18 16 32 6 50 6C68 6 82 16 80 34Z') ?? [];
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    expect(Math.min(...xs)).toBe(18);
    expect(Math.max(...xs)).toBe(82);
    expect(Math.min(...ys)).toBe(6);
    near(shapeBox('<path d="M10 10h5v5H10z"/>'), [10, 10, 5, 5]);
    near(shapeBox('<path d="M1 1l2 2 3-1"/>'), [1, 1, 5, 2]);
    // A half circle of radius 9 from (50 13) to (50 31) reaches x 59: within the arc's box.
    const arc = shapeBox('<path d="M50 13A9 9 0 0 1 50 31"/>') ?? [0, 0, 0, 0];
    expect(arc[0] + arc[2]).toBeGreaterThanOrEqual(59);
    // Radii too small for the chord grow to it.
    const small = shapeBox('<path d="M0 0a1 1 0 0 1 20 0"/>') ?? [0, 0, 0, 0];
    expect(small[1]).toBeLessThanOrEqual(-10);
    expect(pathPoints('M0 0 X 5')).toBeNull();
  });

  it('reads the simple shapes', () => {
    near(shapeBox('<rect x="24" y="22" width="52" height="104" rx="26"/>'), [24, 22, 52, 104]);
    near(shapeBox('<circle cx="50" cy="22" r="9"/>'), [41, 13, 18, 18]);
    near(shapeBox('<ellipse cx="5" cy="6" rx="2" ry="3"/>'), [3, 3, 4, 6]);
    near(shapeBox('<polygon points="0,0 4,1 2,5"/>'), [0, 0, 4, 5]);
    expect(shapeBox('<use href="#a"/>')).toBeNull();
  });

  it('boxes a clip without its strokes and a mask with them, under its transforms', () => {
    const m = parseTransform('translate(10 0) scale(2)') ?? IDENTITY;
    near(
      defBox(
        '<clipPath id="c"><rect x="0" y="0" width="5" height="5" stroke="#000" stroke-width="4"/></clipPath>',
        m,
      ),
      [10, 0, 10, 10],
    );
    near(
      defBox(
        '<mask id="m"><g transform="translate(1 1)"><circle cx="0" cy="0" r="1" fill="#fff" stroke="#fff" stroke-width="2"/></g></mask>',
        IDENTITY,
      ),
      [-1, -1, 4, 4],
    );
    // A miter corner of a stroke may reach out to its limit.
    near(
      defBox(
        '<mask id="m"><path d="M0 0L10 0" fill="none" stroke="#fff" stroke-width="2"/></mask>',
        IDENTITY,
      ),
      [-4, -4, 18, 8],
    );
    near(
      defBox(
        '<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="3" height="100"><rect x="-5" y="2" width="20" height="4" fill="#fff"/></mask>',
        IDENTITY,
      ),
      [0, 2, 3, 4],
    );
    // Shapes inside a nested definition are not drawn.
    near(
      defBox(
        '<mask id="m"><defs><clipPath id="q"><rect x="-90" y="-90" width="1" height="1"/></clipPath></defs><rect x="1" y="1" width="1" height="1" fill="#fff"/></mask>',
        IDENTITY,
      ),
      [1, 1, 1, 1],
    );
    expect(
      defBox(
        '<clipPath id="c" clipPathUnits="objectBoundingBox"><rect x="0" y="0" width="1" height="1"/></clipPath>',
        IDENTITY,
      ),
    ).toBeNull();
    expect(defBox('<clipPath id="c"><use href="#a"/></clipPath>', IDENTITY)).toBeNull();
  });

  it('meets and turns boxes', () => {
    near(intersect([0, 0, 10, 10], [5, 5, 10, 10]), [5, 5, 5, 5]);
    expect(intersect([0, 0, 1, 1], [2, 2, 1, 1])).toBeNull();
    near(boxUnder(parseTransform('rotate(90)') ?? IDENTITY, [0, 0, 2, 1]), [-1, 0, 1, 2]);
  });
});
