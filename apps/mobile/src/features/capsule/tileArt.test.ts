import type { LookSlot } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import { describe, expect, it } from 'vitest';

import { optionArt, partArt } from './tileArt';

const BODY = '<rect x="10" y="8" width="28" height="56" rx="14"';

describe("the trying strip's art", () => {
  it('draws a part without the capsule', () => {
    for (const p of CAPSULE_CATALOG.parts.slice(0, 40)) {
      const xml = partArt(p.slot as LookSlot, p.id, 'pembe');
      expect(xml).toMatch(/^<svg viewBox="[^"]+" width="100%" height="100%"/);
      expect(xml).not.toContain(BODY);
      expect(xml.length).toBeGreaterThan(80);
    }
  });

  it('draws the eyes alone and a colour as the body', () => {
    const eyes = CAPSULE_CATALOG.eyes[0];
    if (!eyes) throw new Error('no eyes');
    expect(partArt('e', eyes.id, 'mor')).not.toContain(BODY);
    expect(partArt('c', 'pembe', undefined)).toContain(BODY);
  });

  it("draws an accessory as its figure and nothing for 'boş'", () => {
    const a = GIFT_CATALOG.accessories[0];
    if (!a) throw new Error('no accessory');
    expect(optionArt('h', { accessory: a.id }, 'mor')).toContain('viewBox="0 -12 100 140"');
    expect(optionArt('h', {}, 'mor')).toBeNull();
  });

  it('makes each text once', () => {
    const p = CAPSULE_CATALOG.parts[0];
    if (!p) throw new Error('no part');
    const slot = p.slot as LookSlot;
    expect(optionArt(slot, { part: p.id }, 'mor')).toBe(optionArt(slot, { part: p.id }, 'mor'));
  });
});
