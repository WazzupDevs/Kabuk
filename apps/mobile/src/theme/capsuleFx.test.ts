import { describe, expect, it } from 'vitest';

import { GIFT_CATALOG } from '../../../../supabase/functions/_shared/pure/giftCatalog.ts';

import { ACCESSORY_ART } from './capsuleAccessories';
import { FX, framesOf, fxTree, sampled, stillSvg, valueAt } from './capsuleFx';
import { lookPop, lookSvg } from './capsuleLook';

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
            else if (l.kind === 'frames') xmls.push(...l.frames.map((f) => f.xml));
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
