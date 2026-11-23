import type { LookSlot } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import { ACCESSORY_TILE_BOX } from '../../theme/accessoryTiles';
import { ACCESSORY_ART } from '../../theme/capsuleAccessories';
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

  it('knows the seen box of every drawn accessory (theme/accessoryTiles.ts)', () => {
    for (const id of Object.keys(ACCESSORY_ART)) expect(ACCESSORY_TILE_BOX[id], id).toBeDefined();
  });

  it("draws an accessory alone, still, in the middle of its square, and nothing for 'boş'", () => {
    for (const a of GIFT_CATALOG.accessories.filter((x) => !x.retired)) {
      const art = optionArt('h', { accessory: a.id }, 'mor') ?? '';
      const view = /viewBox="([^"]*)"/.exec(art)?.[1]?.split(' ').map(Number) ?? [];
      expect(view[2], a.id).toBeCloseTo(view[3] ?? 0, 6);
      expect(art, a.id).not.toContain('data-fx');
      // No capsule: not the body the figure lays under it.
      expect(art, a.id).not.toContain(
        '<rect x="24" y="22" width="52" height="104" rx="26" fill="#F5E6CC"/>',
      );
    }
    expect(optionArt('h', {}, 'mor')).toBeNull();
  });

  it('makes each text once', () => {
    const p = CAPSULE_CATALOG.parts[0];
    if (!p) throw new Error('no part');
    const slot = p.slot as LookSlot;
    expect(optionArt(slot, { part: p.id }, 'mor')).toBe(optionArt(slot, { part: p.id }, 'mor'));
  });
});
