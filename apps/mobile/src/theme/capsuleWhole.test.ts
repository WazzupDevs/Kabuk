import { describe, expect, it } from 'vitest';

import { ACCESSORY_ART } from './capsuleAccessories';
import { fxTree, placeOf } from './capsuleFx';
import { lookPop } from './capsuleLook';
import {
  CAPSULE_SKIA_WHOLE,
  capsuleWholeOn,
  moveMatrixAt,
  moveOpacityAt,
  type WholeLayer,
  wholeLayers,
  type WholeMove,
} from './capsuleSkia';

const W = 260;
const H = 247;

const count = (layers: readonly WholeLayer[], kind: WholeLayer['kind']): number =>
  layers.reduce(
    (n, l) => n + (l.kind === kind ? 1 : 0) + (l.kind === 'move' ? count(l.layers, kind) : 0),
    0,
  );

const still: WholeMove = {
  ms: 1000,
  ox: 30,
  oy: 40,
  tx: null,
  ty: null,
  rotate: null,
  scale: null,
  sx: null,
  sy: null,
  skewX: null,
  opacity: null,
};
const flat = (v: number) => ({ input: [0, 1], output: [v, v] });
// The point (x, y) through a matrix in rows.
const through = (m: number[], x: number, y: number) => [
  (m[0] ?? 0) * x + (m[1] ?? 0) * y + (m[3] ?? 0),
  (m[4] ?? 0) * x + (m[5] ?? 0) * y + (m[7] ?? 0),
];

describe('the whole drawing on one canvas', () => {
  it('is off until the two are compared on a phone, and on by the panel', () => {
    expect(CAPSULE_SKIA_WHOLE).toBe(false);
    expect(capsuleWholeOn('android', false)).toBe(false);
    expect(capsuleWholeOn('android', true)).toBe(true);
    expect(capsuleWholeOn('ios', true)).toBe(true);
  });

  it('draws every accessory: each look that moves gives layers, none left to the pictures', () => {
    const place = (xml: string) => {
      const tree = fxTree(xml);
      return tree ? { tree, place: placeOf(tree.box, W, H) } : null;
    };
    let moving = 0;
    for (const id of Object.keys(ACCESSORY_ART)) {
      const xml = lookPop(`c:pembe e:koyu x:${id}`);
      if (!xml.includes(' data-fx="')) continue;
      const at = place(xml);
      if (!at) continue;
      moving += 1;
      const layers = wholeLayers(at.tree.layers, at.place, 3);
      expect(layers, id).not.toBeNull();
      expect((layers ?? []).length, id).toBeGreaterThan(0);
    }
    expect(moving).toBeGreaterThan(10);
  });

  it('keeps the order and the kinds of the picture way', () => {
    const xml = lookPop('c:pembe e:koyu x:kistakimi');
    const tree = fxTree(xml);
    expect(tree).not.toBeNull();
    if (!tree) return;
    const layers = wholeLayers(tree.layers, placeOf(tree.box, W, H), 3) ?? [];
    expect(count(layers, 'inside')).toBe(1);
    expect(count(layers, 'still')).toBeGreaterThan(0);
  });

  it('gives up whole when a motion inside its clip has no plan', () => {
    const xml = lookPop('c:pembe e:koyu x:kistakimi');
    const tree = fxTree(xml);
    if (!tree) throw new Error('no tree');
    expect(wholeLayers(tree.layers, placeOf(tree.box, W, H), 3, () => null)).toBeNull();
  });

  it('a move with nothing moving is no move', () => {
    expect(moveMatrixAt(still, 0.3)).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    expect(moveOpacityAt(still, 0.3)).toBe(1);
  });

  it('turns, scales and skews about the pivot, and translates in points', () => {
    const turned = moveMatrixAt({ ...still, rotate: flat(Math.PI / 2) }, 0.5);
    // The pivot stays; a point 10 to its right goes 10 under it.
    expect(through(turned, 30, 40)[0]).toBeCloseTo(30);
    expect(through(turned, 30, 40)[1]).toBeCloseTo(40);
    expect(through(turned, 40, 40)[0]).toBeCloseTo(30);
    expect(through(turned, 40, 40)[1]).toBeCloseTo(50);

    const scaled = moveMatrixAt({ ...still, scale: flat(2), tx: flat(5), ty: flat(-3) }, 0.5);
    expect(through(scaled, 30, 40)).toEqual([35, 37]);
    expect(through(scaled, 40, 45)).toEqual([55, 47]);

    // skewX leans x by y (CSS, React Native): a point 10 under the pivot goes right.
    const skewed = moveMatrixAt({ ...still, skewX: flat(Math.PI / 4) }, 0.5);
    expect(through(skewed, 30, 50)[0]).toBeCloseTo(40);
    expect(through(skewed, 30, 50)[1]).toBeCloseTo(50);

    expect(moveOpacityAt({ ...still, opacity: { input: [0, 1], output: [0, 1] } }, 0.25)).toBe(
      0.25,
    );
  });
});
