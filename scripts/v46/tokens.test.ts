import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { bundledMetrics } from './fontMetrics.ts';
import {
  parseBorder,
  parseColor,
  parseFont,
  parsePadding,
  parseRadius,
  parseShadow,
  readInventory,
} from './inventory.ts';
import { PALETTE_REFS } from './palette.ts';
import { COMPONENT_GRADIENTS } from './supplement.ts';
import { narrowBreakpoint, parseEase, parseTransform, readMeasured } from './measured.ts';
import {
  buildPartsModule,
  buildTokensModule,
  look,
  PARTS_MODULE,
  resolveColor,
  TOKENS_MODULE,
  typeKey,
} from './tokens.ts';

const root = resolve(import.meta.dirname, '../..');
const inventory = readInventory(root);
const metrics = bundledMetrics(root);

describe(TOKENS_MODULE, () => {
  // The owner's rule (v46 native, step 1): the tokens change only through their source.
  it('is what `pnpm tokens` writes from the inventory now', async () => {
    expect(readFileSync(resolve(root, TOKENS_MODULE), 'utf8')).toBe(await buildTokensModule(root));
  });

  it('is measured from the v46 in the repository', () => {
    expect(inventory.meta.source_sha256).toBe(
      '1063519b7e116fe2a9039b3746e08b7d8675ed6bd7818c288003f831c477d2d4',
    );
  });
});

describe(PARTS_MODULE, () => {
  it('is what `pnpm tokens` writes from the measurement now', async () => {
    expect(readFileSync(resolve(root, PARTS_MODULE), 'utf8')).toBe(await buildPartsModule(root));
  });

  // The measurement adds to the inventory; both are of the same v46 file, and every component is
  // measured.
  it('is measured from the same v46 as the inventory, every component', () => {
    const measured = readMeasured(root);
    expect(measured.meta.source_sha256).toBe(inventory.meta.source_sha256);
    expect(Object.keys(measured.components)).toEqual(inventory.components.map((c) => c.id));
  });
});

describe('the measurement as React Native values', () => {
  it('reads timing functions as cubic-bezier', () => {
    expect(parseEase('ease')).toEqual([0.25, 0.1, 0.25, 1]);
    expect(parseEase('cubic-bezier(0.2, 0.8, 0.2, 1)')).toEqual([0.2, 0.8, 0.2, 1]);
    expect(() => parseEase('steps(4)')).toThrow();
  });

  it('reads transforms that scale, turn and move', () => {
    expect(parseTransform('none')).toBeNull();
    expect(parseTransform('matrix(0.97, 0, 0, 0.97, 0, 0)')).toEqual({
      scale: 0.97,
      rotate: 0,
      translateX: 0,
      translateY: 0,
    });
    expect(parseTransform('matrix(1, 0, 0, 1, 0, -5)')?.translateY).toBe(-5);
    expect(parseTransform('matrix(0.375877, -0.136808, 0.136808, 0.375877, 0, 0)')).toEqual({
      scale: 0.4,
      rotate: -20,
      translateX: 0,
      translateY: 0,
    });
    expect(() => parseTransform('matrix(1, 0, 0.5, 1, 0, 0)')).toThrow();
  });

  it('finds v46 has one small-screen width', () => {
    const html = readFileSync(resolve(root, 'docs/design/v46', inventory.meta.source), 'utf8');
    expect(narrowBreakpoint(html)).toBe(350);
    expect(() =>
      narrowBreakpoint('@media (max-width:350px){} @media (max-width:400px){}'),
    ).toThrow();
  });
});

describe('the inventory as React Native values', () => {
  it('reads every component in both schemes', () => {
    expect(inventory.components).toHaveLength(59);
    for (const c of inventory.components) {
      for (const scheme of ['light', 'dark'] as const) {
        expect(() => look(c.id, c[scheme], scheme, metrics), c.id).not.toThrow();
      }
    }
  });

  // envanter F4, F5: the primary button is .btn.btn-room in three sizes; .btn-primary is not used.
  it('takes the primary button from .btn.btn-room, in its three sizes', () => {
    const rooms = inventory.components.filter(
      (c) => c.class === 'btn btn-room' && c.variants.includes('pressed'),
    );
    expect(rooms.map((c) => [c.id, c.light.height, c.light.font])).toEqual([
      ['birincil-52', '52px', '16px/700/normal'],
      ['birincil-48', '48px', '14px/700/normal'],
      ['birincil-48-15', '48px', '15px/700/normal'],
    ]);
    expect(inventory.components.some((c) => c.class.includes('btn-primary'))).toBe(false);
    expect(resolveColor(inventory, PALETTE_REFS.primary, 'light')).toBe('#6A47F5');
  });

  it('gives every gradient background its value, and no other component one', () => {
    const gradients = inventory.components
      .filter((c) => c.light.bg === 'gradient' || c.dark.bg === 'gradient')
      .map((c) => c.id);
    expect(gradients.sort()).toEqual(Object.keys(COMPONENT_GRADIENTS).sort());
  });

  it('names every palette colour in both schemes', () => {
    for (const ref of Object.values(PALETTE_REFS)) {
      for (const scheme of ['light', 'dark'] as const) {
        expect(resolveColor(inventory, ref, scheme)).toMatch(/^(#[0-9A-F]{6}|rgba\(.+\))$/);
      }
    }
  });

  it('gives each type style its own key', () => {
    const keys = inventory.type_styles.map(typeKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('t28w800l34sm0_8'); // h1
  });
});

describe('CSS to React Native', () => {
  it('reads colours, with alpha and without', () => {
    expect(parseColor('#6a47f5')).toBe('#6A47F5');
    expect(parseColor('#14112B/0.06')).toBe('rgba(20, 17, 43, 0.06)');
    expect(parseColor('#000000/0')).toBe('transparent');
    expect(parseColor('rgb(106, 71, 245)')).toBe('#6A47F5');
    expect(parseColor('rgba(0, 0, 0, 0.5)')).toBe('rgba(0, 0, 0, 0.5)');
    expect(() => parseColor('gradient')).toThrow();
  });

  it('reads radii, borders, fonts and paddings', () => {
    expect(parseRadius('999px', 52)).toBe(999);
    expect(parseRadius('50%', 44)).toBe(22);
    expect(parseRadius('28px 28px 0px 0px', 234)).toEqual([28, 28, 0, 0]);
    expect(parseBorder('none')).toBeNull();
    expect(parseBorder('1px #DAD3F2')).toEqual({ width: 1, color: '#DAD3F2' });
    expect(parseFont('15px/600/21px')).toEqual({ size: 15, weight: 600, lineHeight: 21 });
    expect(parseFont('16px/700/normal')).toEqual({ size: 16, weight: 700, lineHeight: null });
    expect(parsePadding('6px 12px 6px 6px')).toEqual([6, 12, 6, 6]);
  });

  it('writes shadows as React Native boxShadow strings, inset included', () => {
    expect(parseShadow('none')).toBeNull();
    expect(
      parseShadow(
        'rgba(40, 30, 90, 0.16) 0px 10px 26px 0px, rgba(255, 255, 255, 0.95) 0px 1.5px 1px 0px inset',
      ),
    ).toBe(
      '0px 10px 26px 0px rgba(40, 30, 90, 0.16), inset 0px 1.5px 1px 0px rgba(255, 255, 255, 0.95)',
    );
  });
});
