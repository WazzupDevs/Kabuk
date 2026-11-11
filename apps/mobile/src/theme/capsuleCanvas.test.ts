import { describe, expect, it } from 'vitest';

import { canvasCells, canvasLayerAt, canvasLook, MEASURE_GRID } from './capsuleCanvas';
import { fxTree, placeOf, stillSvg } from './capsuleFx';
import { lookSvg } from './capsuleLook';
import { insidePlan } from './capsuleSkia';

const G = MEASURE_GRID;
const XML = lookSvg(G.look, 'av');
// A phone 360 dp wide, the preview's block taking some of it.
const WIDTH = 320;

describe('the grid on one canvas', () => {
  it("draws the grid's look: a still layer, then its shine inside its clip, in that order", () => {
    const tree = fxTree(XML);
    if (!tree) throw new Error('no tree');
    const look = canvasLook(XML, G.size, 3, true);
    if (!look.layers) throw new Error(look.skip);
    expect(look.layers.map((l) => l.kind)).toEqual(tree.layers.map((l) => l.kind));
    expect(look.layers.map((l) => l.kind)).toEqual(['still', 'inside']);
    const place = placeOf(tree.box, G.size, G.size);
    tree.layers.forEach((l, i) => {
      const got = look.layers[i];
      if (l.kind === 'still') expect(got).toEqual({ kind: 'still', xml: l.xml });
      else if (l.kind === 'inside')
        expect(got).toEqual({ kind: 'inside', plan: insidePlan(l, place, 3) });
    });
  });

  it('reads plans through the cache it is given', () => {
    const asked: string[] = [];
    canvasLook(XML, G.size, 3, true, (layer, place, ratio) => {
      asked.push(layer.fx);
      return insidePlan(layer, place, ratio);
    });
    expect(asked).toEqual(['glint']);
  });

  it('draws the whole drawing still with reduce motion', () => {
    expect(canvasLook(XML, G.size, 3, false)).toEqual({
      layers: [{ kind: 'still', xml: stillSvg(XML) }],
      skip: null,
    });
  });

  it('draws no avatar whose motion inside a clip has no plan, and says why', () => {
    expect(canvasLook(XML, G.size, 3, true, () => null)).toEqual({ layers: null, skip: 'inside' });
  });

  it('draws no avatar with a moving layer, and says why', () => {
    // An Efsanevi's halo: a motion of a group of layers.
    const moving = lookSvg('c:pembe e:koyu x:kuzeyisigi', 'av');
    expect(fxTree(moving)?.layers.some((l) => l.kind === 'move')).toBe(true);
    expect(canvasLook(moving, G.size, 3, true)).toEqual({ layers: null, skip: 'move' });
  });

  it('puts the twelve where the grid of views puts them', () => {
    const { cells, height } = canvasCells(WIDTH, G.count, G.columns, G.size, G.gap);
    expect(cells).toHaveLength(12);
    const column = WIDTH / G.columns;
    cells.forEach((c, i) => {
      expect(c.x).toBeCloseTo((i % 4) * column + (column - G.size) / 2, 9);
      expect(c.y).toBe(Math.floor(i / 4) * (G.size + G.gap));
    });
    expect(height).toBe(3 * (G.size + G.gap));
    // None on another: each its own square, all inside the canvas.
    for (const a of cells) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.x + G.size).toBeLessThanOrEqual(WIDTH);
      expect(a.y + G.size).toBeLessThanOrEqual(height);
      for (const b of cells)
        if (a !== b)
          expect(Math.abs(a.x - b.x) >= G.size || Math.abs(a.y - b.y) >= G.size).toBe(true);
    }
  });

  it("moves each layer to its avatar: a still at the corner, a clip's crop by its own corner", () => {
    const look = canvasLook(XML, G.size, 3, true);
    if (!look.layers) throw new Error(look.skip);
    const { cells } = canvasCells(WIDTH, G.count, G.columns, G.size, G.gap);
    for (const cell of cells)
      for (const l of look.layers) {
        const at = canvasLayerAt(cell, l);
        if (l.kind === 'still') expect(at).toEqual(cell);
        else {
          expect(at.x).toBeCloseTo(cell.x + l.plan.crop.left, 9);
          expect(at.y).toBeCloseTo(cell.y + l.plan.crop.top, 9);
          // The crop stays inside its avatar's square.
          expect(l.plan.crop.left).toBeGreaterThanOrEqual(0);
          expect(l.plan.crop.left + l.plan.crop.width).toBeLessThanOrEqual(G.size + 1);
        }
      }
  });
});
