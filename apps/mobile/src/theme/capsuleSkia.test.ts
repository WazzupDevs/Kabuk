import { describe, expect, it } from 'vitest';

import { FX, type FxInside, type FxLayer, framesOf, fxTree, placeKey, placeOf } from './capsuleFx';
import { FEELINGS, lookPop, lookSvg } from './capsuleLook';
import {
  CAPSULE_SKIA,
  CAPSULE_SKIA_OS,
  capsulePainter,
  capsuleSkiaOn,
  clockLead,
  curveAt,
  insideAt,
  insideContentSvg,
  insideCurve,
  insideMaskSvg,
  insidePlan,
  insidePlanKey,
  skiaAccessories,
  skiaAt,
} from './capsuleSkia';
import { defBox, multiply } from './svgBox';

// docs/decisions/skia-build-plani.md → Kapsam: the 15, with how many motions inside a clip each.
const KAPSAM: Readonly<Record<string, number>> = {
  kistakimi: 1,
  buyucutakimi: 1,
  yildiztakimi: 1,
  korsantakimi: 1,
  dalgictakimi: 1,
  seftakimi: 1,
  doktortakimi: 1,
  rocktakimi: 1,
  astronottakimi: 1,
  hawaiitakimi: 1,
  ormanteni: 1,
  geceteni: 1,
  kunaikolyesi: 1,
  neongozluk: 1,
  gokkusagiatki: 3,
};
const MASK_OPACITY: Readonly<Record<string, readonly string[]>> = {
  kistakimi: ['.16', '.35'],
  yildiztakimi: ['.8'],
  dalgictakimi: ['.7'],
  astronottakimi: ['.88', '.9'],
};
const WHITE = new Set(['#ffffff', 'none']);

function insides(layers: readonly FxLayer[]): FxInside[] {
  return layers.flatMap((l) =>
    l.kind === 'inside' ? [l] : l.kind === 'move' ? insides(l.layers) : [],
  );
}

// Süsle's big capsule (CapsuleStage: lookPop, ~208 dp) and the grid's avatar (56 dp), at 3x.
const SIZES = [
  { svg: (id: string) => lookPop(`c:pembe e:koyu x:${id}`), width: 219, height: 208 },
  { svg: (id: string) => lookSvg(`c:pembe e:koyu x:${id}`, 'av'), width: 56, height: 56 },
];

describe('the switch', () => {
  it('is on for Android only (P7; no iPhone was compared)', () => {
    expect(CAPSULE_SKIA).toBe(true);
    expect(CAPSULE_SKIA_OS).toEqual(['android']);
    expect(capsuleSkiaOn('android')).toBe(true);
    expect(capsuleSkiaOn('ios')).toBe(false);
    expect(capsuleSkiaOn('web')).toBe(false);
  });

  it('draws what the switch says while the panel is closed', () => {
    expect(capsulePainter(true, null)).toBe('skia');
    expect(capsulePainter(false, null)).toBe('svg');
  });

  it("draws what the panel's switch says while the panel is open", () => {
    expect(capsulePainter(true, false)).toBe('svg');
    expect(capsulePainter(true, true)).toBe('skia');
    expect(capsulePainter(false, false)).toBe('svg');
    expect(capsulePainter(false, true)).toBe('skia');
  });
});

describe('the Skia drawing', () => {
  it('knows the 15 from the drawings', () => {
    expect(skiaAccessories()).toEqual(Object.keys(KAPSAM).sort());
  });

  for (const id of Object.keys(KAPSAM)) {
    for (const size of SIZES) {
      it(`${id} at ${size.width}: every motion inside a clip has its plan`, () => {
        const tree = fxTree(size.svg(id));
        if (!tree) throw new Error(id);
        const place = placeOf(tree.box, size.width, size.height);
        const found = insides(tree.layers);
        expect(found.length).toBe(KAPSAM[id]);
        for (const l of found) {
          const plan = insidePlan(l, place, 3);
          expect(plan, id).not.toBeNull();
          if (!plan) continue;
          expect(plan.crop.width).toBeGreaterThan(0);
          expect(plan.width).toBeGreaterThan(0);
          for (const xml of [plan.mask, plan.content]) {
            expect(xml.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="')).toBe(true);
            expect(xml.endsWith('</svg>')).toBe(true);
            const opens = (xml.match(/<g\b[^>]*[^/]>|<g>/g) ?? []).length;
            expect((xml.match(/<\/g>/g) ?? []).length, id).toBe(opens);
            for (const m of xml.matchAll(/url\(#([^)]*)\)/g)) expect(xml).toContain(`id="${m[1]}"`);
          }
        }
      });
    }

    it(`${id}: its mask is white only and keeps the opacities`, () => {
      const tree = fxTree(lookPop(`c:pembe e:koyu x:${id}`));
      for (const l of insides(tree?.layers ?? [])) {
        const xml = insideMaskSvg(l, l.box);
        for (const m of xml.matchAll(/\s(fill|stroke|stop-color|color)="([^"]*)"/g))
          expect(WHITE.has((m[2] ?? '').toLowerCase()), `${id} ${m[0]}`).toBe(true);
        expect(xml).not.toMatch(/Gradient\b|style="|<image\b|<text\b/);
        expect(xml).toContain('<rect x="-10000" y="-10000" width="20000" height="20000"');
        // Its own clip and the ones further out, nothing of the content.
        expect(xml).toContain(`id="${l.clip?.id ?? ''}"`);
        expect(xml).not.toContain(l.content);
        const seen = [...new Set([...xml.matchAll(/\sopacity="([^"]*)"/g)].map((m) => m[1]))];
        if (l.clip?.kind === 'mask')
          expect(seen.sort(), id).toEqual([...(MASK_OPACITY[id] ?? [])].sort());
        else expect(seen, id).toEqual([]);
      }
    });

    it(`${id}: its content is whole and unclipped`, () => {
      const tree = fxTree(lookPop(`c:pembe e:koyu x:${id}`));
      for (const l of insides(tree?.layers ?? [])) {
        const xml = insideContentSvg(l, [0, 0, 1, 1]);
        expect(xml).toContain(`<g>${l.content}</g>`);
        expect(xml).toContain(l.defs);
        const head = xml.slice(0, xml.indexOf(l.content));
        expect(head.slice(head.indexOf(l.defs) + l.defs.length)).not.toMatch(
          /\s(?:clip-path|mask)="/,
        );
      }
    });

    it(`${id}: on the clock it stands where each picture stands`, () => {
      for (const size of SIZES) {
        const tree = fxTree(size.svg(id));
        if (!tree) throw new Error(id);
        const place = placeOf(tree.box, size.width, size.height);
        for (const l of insides(tree.layers)) {
          const motion = FX[l.fx];
          const plan = insidePlan(l, place, 3);
          if (!motion || !plan || !l.matrix) throw new Error(id);
          const base = defBox(`<mask>${l.content}</mask>`, l.matrix);
          if (!base) throw new Error(id);
          for (const f of framesOf(motion)) {
            // The picture's content box on the screen, against the canvas's corner.
            const moved = defBox(
              `<mask>${l.content}</mask>`,
              multiply(l.matrix, [1, 0, 0, 1, f.tx, f.ty]),
            );
            if (!moved) throw new Error(id);
            const want = {
              x: place.dx + (moved[0] - place.bx) * place.unit - plan.crop.left,
              y: place.dy + (moved[1] - place.by) * place.unit - plan.crop.top,
            };
            const pad = 2;
            const got = insideAt(plan, f.from);
            expect(got.x + pad, `${id} ${f.from}`).toBeCloseTo(want.x, 1);
            expect(got.y + pad, `${id} ${f.from}`).toBeCloseTo(want.y, 1);
            expect(curveAt(plan.curve.input, plan.curve.tx, f.from)).toBeCloseTo(f.tx, 2);
            expect(curveAt(plan.curve.input, plan.curve.ty, f.from)).toBeCloseTo(f.ty, 2);
          }
        }
      }
    });
  }
});

describe('the clock', () => {
  it('runs along each cycle and starts it again at its seam', () => {
    for (const name of ['glint', 'scan', 'shift']) {
      const motion = FX[name];
      if (!motion) throw new Error(name);
      const c = insideCurve(motion);
      expect(c.input[0]).toBe(0);
      expect(c.input[c.input.length - 1]).toBe(1);
      for (let i = 1; i < c.input.length; i++)
        expect(c.input[i] ?? 0).toBeGreaterThan(c.input[i - 1] ?? 0);
      // At 1 the cycle has started again; just before it, it stands at its end.
      expect(curveAt(c.input, c.tx, 1)).toBeCloseTo(curveAt(c.input, c.tx, 0), 9);
      const end = motion.keys.tx?.[motion.keys.tx.length - 1]?.[1] ?? 0;
      expect(curveAt(c.input, c.tx, 1 - 1e-4)).toBeCloseTo(end, 6);
    }
    // The shine does not run back across the suit at the end of its cycle.
    const glint = FX.glint;
    if (!glint) throw new Error('glint');
    const c = insideCurve(glint);
    expect(curveAt(c.input, c.tx, 0.999)).toBeGreaterThan(89);
  });

  it('reads straight between its points', () => {
    expect(curveAt([0, 0.5, 1], [0, 10, 0], 0.25)).toBe(5);
    expect(curveAt([0, 0.5, 1], [0, 10, 0], -1)).toBe(0);
    expect(curveAt([0, 0.5, 1], [0, 10, 0], 2)).toBe(0);
    expect(curveAt([], [], 0.3)).toBe(0);
  });

  it('runs a stopped one to its cycle’s end first, as the pictures’ clock', () => {
    expect(clockLead(0, 3000)).toBeNull();
    expect(clockLead(1, 3000)).toBeNull();
    expect(clockLead(0.25, 3000)).toBe(2250);
  });
});

describe('the caches', () => {
  const pop = (id: string, emo = '') => lookPop(`c:pembe e:koyu x:${id}`, emo);
  const layerOf = (svg: string) => {
    const tree = fxTree(svg);
    if (!tree) throw new Error(svg);
    const layer = insides(tree.layers)[0];
    if (!layer) throw new Error(svg);
    return { tree, layer };
  };

  // Why CapsuleStage keeps lookPop's text (popOf): the drawing library names its clip anew each
  // time, so the same look drawn again is another text, and every cache keyed on it misses.
  it('lookPop makes another text for the same look each time', () => {
    expect(pop('kistakimi')).not.toBe(pop('kistakimi'));
  });

  it('keys a plan by everything it reads: equal keys, equal plans', () => {
    const svg = pop('kistakimi');
    const a = layerOf(svg);
    const b = layerOf(svg);
    const place = placeOf(a.tree.box, 219, 208);
    expect(insidePlanKey(a.layer, place, 3)).toBe(insidePlanKey(b.layer, { ...place }, 3));
    expect(insidePlan(a.layer, place, 3)).toEqual(insidePlan(b.layer, place, 3));
  });

  it('tells apart another size, ratio, accessory or feeling', () => {
    const { tree, layer } = layerOf(pop('kistakimi'));
    const place = placeOf(tree.box, 219, 208);
    const key = insidePlanKey(layer, place, 3);
    expect(insidePlanKey(layer, placeOf(tree.box, 56, 56), 3)).not.toBe(key);
    expect(insidePlanKey(layer, place, 2)).not.toBe(key);
    expect(insidePlanKey(layerOf(pop('buyucutakimi')).layer, place, 3)).not.toBe(key);
    const happy = layerOf(pop('kistakimi', FEELINGS[0]?.[0] ?? ''));
    expect(insidePlanKey(happy.layer, place, 3)).not.toBe(key);
    expect(placeKey(place, 3)).not.toBe(placeKey(place, 2));
    expect(placeKey(place, 3)).toBe(placeKey({ ...place }, 3));
  });

  it("gives the UI thread the plan's numbers only, which place it as the plan does", () => {
    const { tree, layer } = layerOf(pop('kistakimi'));
    const plan = insidePlan(layer, placeOf(tree.box, 219, 208), 3);
    if (!plan) throw new Error('no plan');
    const at = skiaAt(plan);
    expect(Object.keys(at).sort()).toEqual(['a', 'b', 'c', 'curve', 'd', 'x', 'y']);
    for (const t of [0, 0.1, 0.37, 0.5, 0.99]) expect(insideAt(at, t)).toEqual(insideAt(plan, t));
  });
});
