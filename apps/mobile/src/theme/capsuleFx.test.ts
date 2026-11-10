import { describe, expect, it } from 'vitest';

import { GIFT_CATALOG } from '../../../../supabase/functions/_shared/pure/giftCatalog.ts';

import { ACCESSORY_ART } from './capsuleAccessories';
import {
  cropOf,
  FX,
  type FxInside,
  type FxLayer,
  framesOf,
  fxTree,
  insideBox,
  insideCuts,
  insideFrames,
  placeOf,
  sampled,
  stillSvg,
  valueAt,
} from './capsuleFx';
import { lookCard, lookPop, lookSvg } from './capsuleLook';
import { apply, IDENTITY, type Matrix, multiply, parseTransform, shapeBox } from './svgBox';

describe('accessory motions', () => {
  it('knows every motion the drawings name', () => {
    for (const [id, a] of Object.entries(ACCESSORY_ART)) {
      const text = `${a.back ?? ''}${a.skin ?? ''}${a.art}`;
      for (const m of text.matchAll(/data-fx="([^"]*)"/g))
        expect(FX[m[1] ?? ''], `${id} ${m[1]}`).toBeDefined();
    }
  });

  it('moves the Efsanevi and Destansı ones only (Sıradan and Nadir stay still)', () => {
    for (const a of GIFT_CATALOG.accessories) {
      const art = ACCESSORY_ART[a.id];
      const moves = /data-fx=/.test(`${art?.back ?? ''}${art?.skin ?? ''}${art?.art ?? ''}`);
      if (a.retired) continue;
      expect(moves, a.id).toBe(a.tier === 'efsanevi' || a.tier === 'destansi');
    }
  });

  it('follows the keyframes with their timing function', () => {
    const halo = FX.halo;
    if (!halo) throw new Error('halo');
    expect(valueAt(halo, 'scale', 0)).toBeCloseTo(0.9);
    expect(valueAt(halo, 'scale', 0.5)).toBeCloseTo(1.04);
    expect(valueAt(halo, 'scale', 0.25)).toBeCloseTo(0.97);
    expect(valueAt(halo, 'tx', 0.3)).toBe(0);
    expect(valueAt(halo, 'sx', 0.3)).toBe(1);
  });

  it('starts a delayed motion part way, both sides of its seam', () => {
    const wave2 = FX.wave2;
    if (!wave2) throw new Error('wave2');
    const r = sampled(wave2, 'rotate');
    // -0.8 s of 1.6 s: the clock's start is the cycle's middle.
    expect(r.outputRange[0]).toBeCloseTo(7);
    for (let i = 1; i < r.inputRange.length; i++)
      expect(r.inputRange[i]).toBeGreaterThanOrEqual(r.inputRange[i - 1] ?? 0);
  });

  it('shows a shine as pictures, the still part as one', () => {
    const glint = FX.glint;
    if (!glint) throw new Error('glint');
    const frames = framesOf(glint);
    expect(frames[0]).toMatchObject({ from: 0, tx: -70 });
    expect(frames[0]?.to).toBeCloseTo(0.575);
    expect(frames.length).toBeGreaterThan(10);
    expect(frames[frames.length - 1]?.to).toBe(1);
  });
});

describe('the drawing in layers', () => {
  it('is null for a still drawing', () => {
    expect(fxTree(lookSvg('c:mor e:klasik x:filiz'))).toBeNull();
  });

  it('cuts a moving one into whole drawings that hold all of it', () => {
    for (const code of [
      'c:mor e:klasik x:kuzeyisigi',
      'c:pembe e:koyu x:korsantakimi',
      'c:mor x:gokkusagiatki x:ormanteni',
    ]) {
      for (const svg of [lookSvg(code), lookSvg(code, 'fig'), lookPop(code)]) {
        const tree = fxTree(svg);
        expect(tree, code).not.toBeNull();
        const xmls: string[] = [];
        const walk = (layers: NonNullable<typeof tree>['layers']) => {
          for (const l of layers) {
            if (l.kind === 'still') xmls.push(l.xml);
            else if (l.kind === 'inside')
              xmls.push(
                ...insideFrames(l).map((f) => f.xml),
                ...insideFrames(l, l.box).map((f) => f.xml),
              );
            else walk(l.layers);
          }
        };
        walk(tree?.layers ?? []);
        expect(xmls.length).toBeGreaterThan(1);
        for (const x of xmls) {
          expect(x.startsWith('<svg')).toBe(true);
          expect(x.endsWith('</svg>')).toBe(true);
          expect(x).not.toContain('data-fx');
          const opens = (x.match(/<g\b[^>]*[^/]>|<g>/g) ?? []).length;
          expect((x.match(/<\/g>/g) ?? []).length, code).toBe(opens);
          for (const m of x.matchAll(/url\(#([^)]*)\)/g)) expect(x).toContain(`id="${m[1]}"`);
        }
      }
    }
  });

  it('draws still what reduce motion shows', () => {
    const svg = lookSvg('c:mor e:klasik x:alevsac');
    expect(stillSvg(svg)).not.toContain('data-fx');
    expect(stillSvg(svg).length).toBeLessThan(svg.length);
  });
});

// Every accessory with a motion inside a clip (FX[…].frames): glint, scan, shift.
const INSIDE: Readonly<Record<string, number>> = {
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

function insides(layers: readonly FxLayer[]): FxInside[] {
  return layers.flatMap((l) =>
    l.kind === 'inside' ? [l] : l.kind === 'move' ? insides(l.layers) : [],
  );
}

const area = (b: readonly number[]) => (b[2] ?? 0) * (b[3] ?? 0);

// The points a definition's shapes stand on (each shape's box corners, its groups' transforms on),
// in the root viewBox's units.
function shapePoints(def: string, m: Matrix): [number, number][] {
  const out: [number, number][] = [];
  const stack: { m: Matrix; hidden: boolean }[] = [{ m, hidden: false }];
  const tokens = def.match(/<[^>]+>/g) ?? [];
  for (const t of tokens.slice(1, -1)) {
    const top = stack[stack.length - 1] ?? { m, hidden: false };
    if (t.startsWith('</')) {
      stack.pop();
      continue;
    }
    const tr = /\stransform="([^"]*)"/.exec(t)?.[1];
    const here = {
      m: tr ? multiply(top.m, parseTransform(tr) ?? IDENTITY) : top.m,
      hidden: top.hidden || /^<(defs|clipPath)\b/.test(t),
    };
    const b = here.hidden ? null : shapeBox(t);
    if (b) {
      const [x, y, w, h] = b;
      out.push(
        apply(here.m, x, y),
        apply(here.m, x + w, y),
        apply(here.m, x, y + h),
        apply(here.m, x + w, y + h),
      );
    }
    if (!t.endsWith('/>')) stack.push(here);
  }
  return out;
}

// The matrix of the groups round the clip's own group (the one that names it).
function holderMatrix(layer: FxInside): Matrix {
  let m = IDENTITY;
  const ref = new RegExp(`(?:clip-path|mask)="url\\(#${layer.clip?.id ?? ''}\\)"`);
  for (const t of layer.outer) {
    const tr = /\stransform="([^"]*)"/.exec(t)?.[1];
    if (tr) m = multiply(m, parseTransform(tr) ?? IDENTITY);
    if (ref.test(t)) break;
  }
  return m;
}

const WHITE = new Set(['#fff', '#ffffff', 'white', 'none']);

// A suit's mask is the suit itself drawn white (capsuleAccessories.ts), so its see-through parts
// keep their `opacity`: the shine is as faint there as the part is. White at an opacity is still
// alpha only (what a canvas draws as an alpha mask); the values are listed so a change is seen.
const MASK_OPACITY: Readonly<Record<string, readonly string[]>> = {
  kistakimi: ['.16', '.35'],
  yildiztakimi: ['.8'],
  dalgictakimi: ['.7'],
  astronottakimi: ['.88', '.9'],
};

describe('a motion inside its clip', () => {
  for (const [id, count] of Object.entries(INSIDE)) {
    it(`${id}: is ${count} motion(s) inside a clip, not whole drawings`, () => {
      for (const svg of [
        lookSvg(`c:mor e:klasik x:${id}`),
        lookSvg(`c:mor e:klasik x:${id}`, 'fig'),
        lookPop(`c:mor e:klasik x:${id}`),
        lookCard(`c:mor e:klasik x:${id}`),
      ]) {
        const tree = fxTree(svg);
        expect(tree, id).not.toBeNull();
        if (!tree) continue;
        expect(JSON.stringify(tree)).not.toContain('"frames"');
        const found = insides(tree.layers);
        expect(found.length, id).toBe(count);
        for (const l of found) {
          expect(l.clip, id).not.toBeNull();
          expect(l.matrix, id).not.toBeNull();
          expect(l.content).not.toContain('data-fx');
          expect(l.content).not.toContain('translate(');
        }
      }
    });

    it(`${id}: its box is the clip's, inside the drawing's and smaller`, () => {
      const tree = fxTree(lookSvg(`c:mor e:klasik x:${id}`));
      if (!tree) throw new Error(id);
      const [vx, vy, vw, vh] = tree.box;
      for (const l of insides(tree.layers)) {
        const [x, y, w, h] = l.box;
        expect(x).toBeGreaterThanOrEqual(vx);
        expect(y).toBeGreaterThanOrEqual(vy);
        expect(x + w).toBeLessThanOrEqual(vx + vw + 1e-9);
        expect(y + h).toBeLessThanOrEqual(vy + vh + 1e-9);
        expect(area(l.box)).toBeGreaterThan(0);
        expect(area(l.box)).toBeLessThan(area(tree.box));
        // Every point a shape of the clip stands on, where the drawing shows it, is in the box.
        const pts = shapePoints(l.clip?.xml ?? '', holderMatrix(l));
        expect(pts.length).toBeGreaterThan(0);
        for (const [px, py] of pts) {
          const cx = Math.min(Math.max(px, vx), vx + vw);
          const cy = Math.min(Math.max(py, vy), vy + vh);
          expect(cx, `${id} ${px}`).toBeGreaterThanOrEqual(x - 1e-9);
          expect(cx, `${id} ${px}`).toBeLessThanOrEqual(x + w + 1e-9);
          expect(cy, `${id} ${py}`).toBeGreaterThanOrEqual(y - 1e-9);
          expect(cy, `${id} ${py}`).toBeLessThanOrEqual(y + h + 1e-9);
        }
      }
    });

    it(`${id}: a mask of it is white only`, () => {
      const tree = fxTree(lookSvg(`c:mor e:klasik x:${id}`));
      for (const l of insides(tree?.layers ?? [])) {
        if (l.clip?.kind !== 'mask') continue;
        const xml = l.clip.xml;
        for (const m of xml.matchAll(/\s(fill|stroke)="([^"]*)"/g))
          expect(WHITE.has((m[2] ?? '').toLowerCase()), `${id} ${m[0]}`).toBe(true);
        expect(xml, id).not.toMatch(/\s(?:fill-|stroke-)opacity="/);
        const seen = [...new Set([...xml.matchAll(/\sopacity="([^"]*)"/g)].map((m) => m[1]))];
        expect(seen.sort(), id).toEqual([...(MASK_OPACITY[id] ?? [])].sort());
        expect(xml, id).not.toMatch(/Gradient\b|style="/);
      }
    });

    it(`${id}: its cut pictures are the whole ones with another viewBox`, () => {
      const tree = fxTree(lookSvg(`c:mor e:klasik x:${id}`));
      if (!tree) throw new Error(id);
      for (const l of insides(tree.layers)) {
        const motion = FX[l.fx];
        if (!motion) throw new Error(l.fx);
        const steps = framesOf(motion);
        const whole = insideFrames(l);
        const crop = cropOf(l.box, placeOf(tree.box, 40, 40), 2.625);
        const cut = insideFrames(l, crop.viewBox);
        expect(whole.length).toBe(steps.length);
        expect(cut.length).toBe(steps.length);
        const noBox = (x: string) => x.replace(/ viewBox="[^"]*"/, '');
        for (let i = 0; i < steps.length; i++) {
          const w = whole[i]?.xml ?? '';
          const c = cut[i]?.xml ?? '';
          expect(w.startsWith(`<svg viewBox="${tree.box.join(' ')}"`)).toBe(true);
          expect(c).not.toBe(w);
          expect(noBox(c)).toBe(noBox(w));
          expect(w).toContain(
            `${l.outer.join('')}<g transform="translate(${steps[i]?.tx} ${steps[i]?.ty})">${l.content}</g>`,
          );
          expect(w).toContain(l.defs);
          expect([whole[i]?.from, whole[i]?.to]).toEqual([steps[i]?.from, steps[i]?.to]);
        }
      }
    });
  }

  for (const id of Object.keys(INSIDE)) {
    it(`${id}: a view's pictures are the whole ones cut to what each shows`, () => {
      const tree = fxTree(lookSvg(`c:mor e:klasik x:${id}`));
      if (!tree) throw new Error(id);
      const place = placeOf(tree.box, 208, 208);
      const noBox = (x: string) => x.replace(/ viewBox="[^"]*"/, '');
      for (const l of insides(tree.layers)) {
        const whole = insideFrames(l);
        const cuts = insideCuts(l, place, 3);
        const clip = cropOf(l.box, place, 3);
        expect(cuts.length, id).toBeGreaterThan(0);
        expect(cuts.length, id).toBeLessThanOrEqual(whole.length);
        let drawn = 0;
        for (const c of cuts) {
          const w = whole.find((f) => f.from === c.from && f.to === c.to);
          expect(noBox(c.xml), id).toBe(noBox(w?.xml ?? ''));
          // Inside the clip's own cut, on whole pixels.
          for (const v of [c.crop.left, c.crop.top, c.crop.width, c.crop.height])
            expect(Math.abs(v * 3 - Math.round(v * 3))).toBeLessThan(1e-6);
          expect(c.crop.left).toBeGreaterThanOrEqual(clip.left - 1e-6);
          expect(c.crop.top).toBeGreaterThanOrEqual(clip.top - 1e-6);
          expect(c.crop.left + c.crop.width).toBeLessThanOrEqual(clip.left + clip.width + 1e-6);
          expect(c.crop.top + c.crop.height).toBeLessThanOrEqual(clip.top + clip.height + 1e-6);
          drawn += c.crop.width * c.crop.height;
        }
        // Never more than the clip's box for every picture; a shine's band is far less.
        const all = whole.length * clip.width * clip.height;
        expect(drawn, id).toBeLessThanOrEqual(all);
        if (l.fx === 'glint') expect(drawn, id).toBeLessThan(all / 2);
      }
    });
  }

  it('leaves out a picture whose content stands off its clip', () => {
    const tree = fxTree(lookSvg('c:mor e:klasik x:kistakimi'));
    const [l] = insides(tree?.layers ?? []);
    if (!l) throw new Error('kistakimi');
    expect(insideBox(l, 0, 0)).not.toBeNull();
    expect(insideBox(l, 1e4, 0)).toBeNull();
  });

  it('places a cut picture on whole pixels, at the whole one’s scale, round its box', () => {
    const box: [number, number, number, number] = [6.77, 0.31, 41.23, 23.9];
    for (const ratio of [1, 2, 2.625, 3, 3.5]) {
      for (const [w, h] of [
        [40, 40],
        [36.5, 36.5],
        [88, 120],
      ] as const) {
        const place = placeOf([0, 0, 48, 48], w, h);
        const c = cropOf(box, place, ratio);
        for (const v of [c.left, c.top, c.width, c.height])
          expect(Math.abs(v * ratio - Math.round(v * ratio))).toBeLessThan(1e-9);
        // The cut viewBox draws at the same scale and the same place as the whole one.
        expect(c.width / c.viewBox[2]).toBeCloseTo(place.unit, 9);
        expect(c.height / c.viewBox[3]).toBeCloseTo(place.unit, 9);
        expect(place.dx + (c.viewBox[0] - place.bx) * place.unit).toBeCloseTo(c.left, 9);
        expect(place.dy + (c.viewBox[1] - place.by) * place.unit).toBeCloseTo(c.top, 9);
        // It holds the box.
        expect(c.viewBox[0]).toBeLessThanOrEqual(box[0]);
        expect(c.viewBox[1]).toBeLessThanOrEqual(box[1]);
        expect(c.viewBox[0] + c.viewBox[2]).toBeGreaterThanOrEqual(box[0] + box[2] - 1e-9);
        expect(c.viewBox[1] + c.viewBox[3]).toBeGreaterThanOrEqual(box[1] + box[3] - 1e-9);
      }
    }
  });
});
