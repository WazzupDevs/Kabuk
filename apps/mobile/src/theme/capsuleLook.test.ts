import { describe, expect, it } from 'vitest';

import LOOK from './capsuleDrawing';
import { GIFT_CATALOG } from '../../../../supabase/functions/_shared/pure/giftCatalog.ts';

import { ACCESSORY_ART, accessoryFigure } from './capsuleAccessories';
import { eyeLayers, lookParts, lookPop, lookSvg, posedEyes } from './capsuleLook';

describe('capsule look', () => {
  it('reads a stored code into slots, the first id a slot', () => {
    expect(lookParts('c:pembe e:koyu h:kulaklik h:sapka x:yok')).toEqual({
      c: 'pembe',
      e: 'koyu',
      h: 'kulaklik',
    });
  });

  it('draws the avatar disc in the colour ground', () => {
    const svg = lookSvg('c:pembe e:klasik');
    expect(svg.startsWith('<svg viewBox="0 0 48 48"')).toBe(true);
    expect(svg).toContain('#FF5C93');
  });
});

describe('pack accessory', () => {
  // The first catalog's eight; the 40 + 20 of §4.U ("Genişleyen katalog") come with their screens.
  it('has a drawing for every accessory of the first catalog', () => {
    const first = GIFT_CATALOG.accessories.filter((a) => a.retired || a.id === 'ejderboynuzu');
    expect(first).toHaveLength(8);
    for (const a of first) expect(ACCESSORY_ART[a.id]).toBeDefined();
  });

  it('draws the worn accessory over the capsule, in every drawing', () => {
    const plain = lookSvg('c:mor e:klasik');
    const worn = lookSvg('c:mor e:klasik x:tac');
    expect(worn).not.toBe(plain);
    expect(worn).toContain('scale(0.53846)');
    expect(worn.endsWith('</g></svg>')).toBe(true);
    expect(lookSvg('c:mor e:klasik x:tac', 'fig')).toContain('scale(0.53846)');
    expect(lookPop('c:mor e:klasik x:tac')).toContain('scale(0.53846)');
    // The eyes stay where the blink finds them.
    expect(eyeLayers(worn)?.above).toContain('scale(0.53846)');
  });

  it('draws nothing for an unknown accessory', () => {
    expect(lookSvg('c:mor e:klasik x:yok')).toBe(lookSvg('c:mor e:klasik'));
  });

  it('draws a silhouette in one colour', () => {
    const fills = accessoryFigure('tac', '#123456').match(/fill="#[0-9A-Fa-f]+"/g) ?? [];
    expect(new Set(fills)).toEqual(new Set(['fill="#123456"']));
  });
});

describe('posed eyes', () => {
  const svg = lookSvg('c:mor e:klasik', 'av');
  it('leaves the drawing as it is without a pose', () => {
    expect(posedEyes(svg, {})).toBe(svg);
  });
  it('gathers the eyes into one squashed group for a blink, the rest unchanged', () => {
    const blink = posedEyes(svg, { blink: true });
    expect(blink).toContain('scale(1 0.12)');
    const eyes = svg.match(/class="eye"/g)?.length ?? 0;
    expect(eyes).toBeGreaterThan(0);
    expect(blink.match(/class="eye"/g)?.length).toBe(eyes);
    expect(
      blink.replace(/<g transform="translate\(0 20\.5\)[^"]*">/, '').replace('</g>', ''),
    ).not.toBe('');
  });
  it('moves the eyes along their line to look aside', () => {
    expect(posedEyes(svg, { look: -1.6 })).toContain('translate(-1.6 20.5) scale(1 1)');
  });
  it('splits into layers that hold the whole drawing in its order', () => {
    const layers = eyeLayers(svg);
    expect(layers).not.toBeNull();
    if (!layers) return;
    const root = svg.match(/^<svg\b[^>]*>/)?.[0] ?? '';
    const inner = (x: string | null) => (x ? x.slice(root.length, x.length - '</svg>'.length) : '');
    expect(layers.below.startsWith(root)).toBe(true);
    expect(inner(layers.below) + inner(layers.open) + inner(layers.above)).toBe(inner(svg));
    // The closed eyes are posedEyes' blink group.
    const blink = posedEyes(svg, { blink: true });
    expect(blink).toContain(inner(layers.closed));
  });
  it('splits every part of the catalogue, the eyes never inside a group', () => {
    const EYE = /class="eye"/;
    for (const mode of ['av', 'fig'] as const)
      for (const [slot] of LOOK.SLOTS)
        for (const [rack] of LOOK.RACKS)
          for (const item of LOOK.items(rack, slot)) {
            const code = slot === 'c' ? `c:${item.id}` : `c:mor ${slot}:${item.id}`;
            const drawn = lookSvg(code, mode);
            if (!EYE.test(drawn)) continue;
            const first = drawn.search(EYE);
            const before = drawn.slice(0, first);
            const open =
              (before.match(/<g\b/g) ?? []).length - (before.match(/<\/g>/g) ?? []).length;
            expect(open, code).toBe(0);
            expect(eyeLayers(drawn), code).not.toBeNull();
          }
  });
});
