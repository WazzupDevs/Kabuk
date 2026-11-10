import { describe, expect, it } from 'vitest';

import LOOK from './capsuleDrawing';
import { GIFT_CATALOG } from '../../../../supabase/functions/_shared/pure/giftCatalog.ts';

import { ACCESSORY_ART, accessoryFigure } from './capsuleAccessories';
import { fxTree, type FxLayer, insideFrames } from './capsuleFx';
import { eyeLayers, lookCard, lookParts, lookPop, lookSvg, posedEyes } from './capsuleLook';

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
  it('has a drawing for every accessory of the catalog', () => {
    expect(GIFT_CATALOG.accessories.length).toBeGreaterThanOrEqual(67);
    for (const a of GIFT_CATALOG.accessories) expect(ACCESSORY_ART[a.id], a.id).toBeDefined();
  });

  it('names every id of a drawing its own, so that two worn together never meet', () => {
    const seen = new Map<string, string>();
    for (const [id, a] of Object.entries(ACCESSORY_ART)) {
      const text = `${a.back ?? ''}${a.skin ?? ''}${a.art}`;
      for (const m of text.matchAll(/ id="([^"]*)"/g)) {
        const name = m[1] ?? '';
        expect(seen.get(name) ?? id, name).toBe(id);
        seen.set(name, id);
      }
      for (const m of text.matchAll(/url\(#([^)]*)\)/g)) {
        expect(text, `${id} → ${m[1]}`).toContain(`id="${m[1]}"`);
      }
    }
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

  it('draws several, one in each slot, each covering the part in its slot', () => {
    const parts = lookSvg('c:mor e:klasik h:fiyonk n:inci');
    const hat = lookSvg('c:mor e:klasik');
    const covered = lookSvg('c:mor e:klasik h:fiyonk n:inci x:filiz x:ipkravat');
    expect(covered).toContain('M50 23V12');
    // The capsule's own hat is not drawn under the accessory.
    expect(covered.startsWith(hat.replace('</svg>', ''))).toBe(true);
    expect(parts).not.toBe(hat);
    expect((covered.match(/scale\(0\.53846\)/g) ?? []).length).toBe(2);
  });

  it('takes the eyes for an eyes accessory and lays a skin under the visor', () => {
    expect(lookSvg('c:mor e:klasik x:baklagoz')).not.toContain('class="eye"');
    const skin = lookSvg('c:mor e:klasik x:ormanteni');
    expect(skin.indexOf('ormantenis-gTn')).toBeLessThan(skin.indexOf('<rect x="14" y="15"'));
    // A halo lies behind the body.
    const halo = lookSvg('c:mor e:klasik x:kuzeyisigi');
    expect(halo.indexOf('data-fx="halo"')).toBeLessThan(halo.indexOf('<rect x="10" y="8"'));
  });

  it('puts the stage accessory with the capsule, not inside its halo', () => {
    const svg = lookPop('c:mor e:klasik x:kuzeyisigi');
    const halo = svg.indexOf('data-fx="halo"');
    const body = svg.indexOf('<g class="cp-b">');
    expect(halo).toBeGreaterThan(-1);
    expect(halo).toBeLessThan(body);
    // The front comes after the capsule's own group closes, outside the halo's.
    const front = svg.indexOf('kuzeyisigi-');
    expect(front).toBeGreaterThan(body);
  });

  it('gives the card room for the highest accessories, the circle where it was', () => {
    const svg = lookCard('c:mor e:klasik x:ejderboynuzu');
    expect(svg).toContain('viewBox="-6 -26 60 75"');
    expect(svg).toContain('M-6 -26H54V24H48A24 24 0 0 1 0 24H-6Z');
    expect(svg).toContain('-contour');
  });

  it('makes every accessory its card from its drawing, a new pack too', () => {
    const bare = lookCard('c:krem e:klasik');
    for (const a of GIFT_CATALOG.accessories) {
      const card = lookCard(`c:krem e:klasik x:${a.id}`);

      expect(card.length, a.id).toBeGreaterThan(bare.length);
      if (card.includes('data-fx=')) expect(fxTree(card), a.id).not.toBeNull();
    }
  });

  it('lets only the head go over the ring: other accessories and the halo stay in it', () => {
    const svg = lookPop('c:mor e:klasik x:ejderboynuzu x:gokkusagiatki');
    const ring = svg.indexOf('<g clip-path="url(#in-ring)">');
    expect(ring).toBeGreaterThan(-1);
    // The scarf (a neck accessory) inside the ring's clip, the horns (head) outside it.
    const inside = svg.slice(ring);
    expect(inside.indexOf('gokkusagiatki')).toBeGreaterThan(-1);
    const horns = svg.lastIndexOf('ejderboynuzu-gLava');
    expect(svg.slice(horns - 400, horns)).not.toContain('url(#in-ring)');
  });

  it('keeps the other slots out of a skin, in the pop and the card (M15-26)', () => {
    const others = ['ayisigigozleri', 'elfkulaklari', 'kunaikolyesi'];
    const skins = GIFT_CATALOG.accessories.filter((a) => a.slots.includes('c'));
    expect(skins.length).toBeGreaterThan(1);
    const descendants = (layers: readonly FxLayer[]): string[] =>
      layers.flatMap((l) =>
        l.kind === 'still'
          ? [l.xml]
          : l.kind === 'inside'
            ? insideFrames(l).map((f) => f.xml)
            : descendants(l.layers),
      );
    // A drawing tag of the accessory that stands in no defs (and, `still`, in no motion group).
    const markOf = (id: string, still = false): string => {
      const open: string[] = [];
      for (const t of (ACCESSORY_ART[id]?.art ?? '').match(/<[^>]+>/g) ?? []) {
        if (t.startsWith('</')) open.pop();
        else if (t.endsWith('/>')) {
          if (
            /^<(path|circle|ellipse|rect)\b/.test(t) &&
            !open.some((o) => o.startsWith('<defs') || (still && o.includes('data-fx=')))
          )
            return t;
        } else open.push(t);
      }
      return '';
    };
    // The tags still open where `name` stands (the clips' numbers aside).
    const openGroups = (svg: string, name: string): string[] => {
      const at = svg.indexOf(name);
      expect(at, name).toBeGreaterThan(-1);
      const open: string[] = [];
      for (const t of svg.slice(0, at).match(/<[^>]+>/g) ?? []) {
        if (t.startsWith('</')) open.pop();
        else if (!t.endsWith('/>')) open.push(t.replace(/cpc\d+/g, 'cpc'));
      }
      return open;
    };
    for (const skin of skins) {
      const dressedCode = `c:pembe e:koyu x:${skin.id} ${others.map((o) => `x:${o}`).join(' ')}`;
      const bareCode = `c:pembe e:koyu ${others.map((o) => `x:${o}`).join(' ')}`;
      for (const draw of [lookPop, lookCard]) {
        const svg = draw(dressedCode);
        // Each other accessory sits under the same open groups with the skin as without it
        // (the body clip's group).
        for (const o of others) {
          const name = markOf(o);
          expect(name, o).not.toBe('');
          const withSkin = openGroups(svg, name);
          expect(withSkin, `${skin.id} ${o}`).toEqual(openGroups(draw(bareCode), name));
        }
        for (const top of fxTree(svg)?.layers ?? []) {
          if (top.kind !== 'move') continue;
          const inside = descendants(top.layers).join('');
          for (const o of others) {
            const mark = markOf(o, true);
            if (mark) expect(inside, `${skin.id} ${o}`).not.toContain(mark);
          }
        }
      }
    }
  });

  it('draws nothing for an unknown accessory', () => {
    expect(lookSvg('c:mor e:klasik x:yok')).toBe(lookSvg('c:mor e:klasik'));
  });

  it('draws a silhouette in one colour, without its halo', () => {
    for (const id of ['tac', 'kuzeyisigi', 'ormanteni', 'korsantakimi']) {
      const svg = accessoryFigure(id, '#123456');
      const fills = svg.match(/fill="[^"]+"/g) ?? [];
      expect(new Set(fills.filter((f) => f !== 'fill="none"')), id).toEqual(
        new Set(['fill="#123456"']),
      );
      expect(svg, id).not.toContain('data-fx');
    }
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
  // MASA-8: the ring's capsule (lookPop) has its eyes inside its clip and body groups; every layer
  // must be a whole SVG, for every accessory worn.
  it('splits the ring capsule into whole SVGs, with every accessory', () => {
    const whole = (x: string) => {
      const stack: string[] = [];
      for (const m of x.matchAll(/<(\/?)([A-Za-z][\w:-]*)\b[^>]*?(\/?)>/g)) {
        if (m[3]) continue;
        if (m[1]) {
          if (stack.pop() !== m[2]) return false;
        } else stack.push(m[2] ?? '');
      }
      return stack.length === 0;
    };
    const looks = [
      'c:krem e:klasik',
      ...GIFT_CATALOG.accessories.map((a) => `c:krem e:klasik x:${a.id}`),
    ];
    for (const code of looks)
      for (const drawn of [lookPop(code), lookPop(code, '', 2), lookSvg(code), lookCard(code)]) {
        const layers = eyeLayers(drawn);
        if (!layers) continue;
        for (const layer of [layers.below, layers.open, layers.closed, layers.above]) {
          if (layer) expect(whole(layer), `${code}: ${layer}`).toBe(true);
        }
        expect(layers.open, code).toContain('class="eye"');
      }
  });
});
