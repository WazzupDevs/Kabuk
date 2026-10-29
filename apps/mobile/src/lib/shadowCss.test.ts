import { describe, expect, it } from 'vitest';

import { KIT } from '../theme/auraKit';
import { parseShadows, splitShadows } from './shadowCss';

describe('parseShadows', () => {
  it('reads the glass shadow (two layers) as numbers', () => {
    expect(parseShadows(KIT.light.glassShadow)).toEqual([
      { x: 0, y: 18, blur: 44, spread: 0, color: 'rgba(54, 36, 140, 0.10)' },
      { x: 0, y: 2, blur: 6, spread: 0, color: 'rgba(54, 36, 140, 0.05)' },
    ]);
  });

  it('reads a spread and a hex colour', () => {
    expect(parseShadows('0px 0px 0px 3px #FFFFFF')).toEqual([
      { x: 0, y: 0, blur: 0, spread: 3, color: '#FFFFFF' },
    ]);
  });

  it('gives up on an inset shadow or another unit', () => {
    expect(parseShadows('inset 0px 1px 0px #FFFFFF')).toBeNull();
    expect(parseShadows('0 1em 2px red')).toBeNull();
  });

  it('reads every shadow the kit draws natively', () => {
    for (const css of [
      KIT.light.glassShadow,
      KIT.dark.glassShadow,
      KIT.primaryShadow,
      KIT.light.raisedShadow,
      KIT.avShadow,
    ])
      expect(parseShadows(css), css).not.toBeNull();
  });
});

describe('splitShadows', () => {
  it('splits outer shadows from inset ones, keeping their order', () => {
    expect(
      splitShadows(
        '0px 4px 10px 0px rgba(123, 92, 255, 0.22), inset 0px 1px 1px 0px #FFFFFF, inset 0px -2px 6px 0px rgba(123, 92, 255, 0.18)',
      ),
    ).toEqual({
      outer: '0px 4px 10px 0px rgba(123, 92, 255, 0.22)',
      inset: 'inset 0px 1px 1px 0px #FFFFFF, inset 0px -2px 6px 0px rgba(123, 92, 255, 0.18)',
    });
  });

  it('gives nothing for nothing', () => {
    expect(splitShadows(undefined)).toEqual({ outer: undefined, inset: undefined });
    expect(splitShadows('')).toEqual({ outer: undefined, inset: undefined });
  });
});
