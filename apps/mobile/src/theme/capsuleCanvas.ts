// Kapsül ölçümü's grid on one canvas (docs/decisions/skia-build-plani.md → P9): every avatar drawn
// whole by Skia on a single canvas, none of them a view of its own. What the canvas draws, as pure
// plans: an avatar's layers in the drawing's order (capsuleFx.ts → fxTree) and where each avatar
// stands. Pure: the canvas (features/design/capsuleGridCanvas.tsx) only draws what these give.

import { type FxInside, type FxPlace, fxTree, placeOf, stillSvg } from './capsuleFx';
import { insidePlan, type SkiaPlan } from './capsuleSkia';
import { SPACING } from './tokens';

// Kapsül ölçümü's grid, both ways (a view an avatar, one canvas): the most a table seats
// (MAX_TABLE_PHONES), all on the screen at once. With 48, four times that, the scene died of a memory
// error on the first measurement (T0, 10 Kasım).
export const MEASURE_GRID = {
  look: 'c:pembe e:koyu x:kistakimi',
  columns: 4,
  count: 12,
  size: SPACING[14],
  gap: SPACING[2],
} as const;

// A layer as the canvas draws it, in the avatar's own points: a still layer over the whole avatar,
// a motion inside its clip as FxSkia draws it (its mask and content at the plan's crop, the content
// moved on the UI thread).
export type CanvasLayer = { kind: 'still'; xml: string } | { kind: 'inside'; plan: SkiaPlan };

// What one canvas cannot draw: a moving layer (no transform of a group of layers yet), a motion
// inside its clip with no plan. The canvas draws no avatar then and says so; nothing is drawn wrong.
export type CanvasSkip = 'move' | 'inside';

export type CanvasLook = { layers: CanvasLayer[]; skip: null } | { layers: null; skip: CanvasSkip };

type PlanOf = (layer: FxInside, place: FxPlace, ratio: number) => SkiaPlan | null;

// An avatar's layers at `size` points square (the avatar's drawing, lookSvg 'av'). Still (with
// reduce motion, or nothing in it moves): the whole drawing with its marks out, as FxSvg draws it
// still. `plan` reads a layer's plan (FxSkia.tsx → planOf, its cache).
export function canvasLook(
  xml: string,
  size: number,
  ratio: number,
  moving: boolean,
  plan: PlanOf = insidePlan,
): CanvasLook {
  const tree = moving ? fxTree(xml) : null;
  if (!tree) return { layers: [{ kind: 'still', xml: stillSvg(xml) }], skip: null };
  const place = placeOf(tree.box, size, size);
  const layers: CanvasLayer[] = [];
  for (const l of tree.layers) {
    if (l.kind === 'still') layers.push({ kind: 'still', xml: l.xml });
    else if (l.kind === 'move') return { layers: null, skip: 'move' };
    else {
      const p = plan(l, place, ratio);
      if (!p) return { layers: null, skip: 'inside' };
      layers.push({ kind: 'inside', plan: p });
    }
  }
  return { layers, skip: null };
}

// Where each avatar's corner stands on the canvas, as the grid of views lays them out (Grid: each
// in a column `width / columns` wide, in its middle, `gap` under each row), and the canvas's height.
export type CanvasCell = { x: number; y: number };

export function canvasCells(
  width: number,
  count: number,
  columns: number,
  size: number,
  gap: number,
): { cells: CanvasCell[]; height: number } {
  const column = width / columns;
  const cells = Array.from({ length: count }, (_, i) => ({
    x: (i % columns) * column + (column - size) / 2,
    y: Math.floor(i / columns) * (size + gap),
  }));
  return { cells, height: Math.ceil(count / columns) * (size + gap) };
}

// Where a layer's drawing starts on the canvas: a still layer at the avatar's corner, a motion
// inside its clip at its crop's corner (the plan's, in the avatar's points) moved to the avatar.
export function canvasLayerAt(cell: CanvasCell, layer: CanvasLayer): CanvasCell {
  return layer.kind === 'still'
    ? cell
    : { x: cell.x + layer.plan.crop.left, y: cell.y + layer.plan.crop.top };
}
