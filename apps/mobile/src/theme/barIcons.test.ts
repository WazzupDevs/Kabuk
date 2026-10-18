import { describe, expect, it } from 'vitest';

import { BAR, BAR_ICONS, barRect, BELL, BELL_BADGE } from './barIcons';
import { BRAND } from './brand';
import { BADGE } from './gameColors';

describe('bar icons (v45: .bi, IC → S)', () => {
  it('a bar is a round-ended rect turned about its centre', () => {
    expect(barRect(BAR_ICONS.plus.a, BAR.thin)).toEqual({
      x: 12 - 2.3,
      y: 3,
      width: 4.6,
      height: 18,
      rx: 2.3,
      rotate: [0, 12, 12],
    });
    expect(barRect(BAR_ICONS.plus.b, BAR.thin).rotate).toEqual([90, 12, 12]);
  });

  it('plus and cross cross at the centre; the cross is the plus turned 45°', () => {
    for (const kind of ['plus', 'cross'] as const) {
      expect(BAR_ICONS[kind].a.c).toEqual([12, 12]);
      expect(BAR_ICONS[kind].b.c).toEqual([12, 12]);
    }
    expect(BAR_ICONS.cross.a.r - BAR_ICONS.plus.a.r).toBe(45);
  });

  it('the open lobby icon shrinks its slot away', () => {
    expect(BAR_ICONS.lobby.s.o).toBe(0.8);
    expect(BAR_ICONS.minus.s.o).toBe(0);
    const slot = barRect(BAR_ICONS.minus.s, BAR.thick);
    expect(slot.width).toBeCloseTo(BAR.thick * 0.3);
  });

  it('every bar stays inside the 24-unit box before its turn', () => {
    for (const icon of Object.values(BAR_ICONS)) {
      for (const p of Object.values(icon)) {
        const r = barRect(p, BAR.thick);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.y + r.height).toBeLessThanOrEqual(24);
      }
    }
  });
});

describe('the bell', () => {
  it("is the logo's colours, with the badge colour on its count", () => {
    expect(BELL.colors).toMatchObject({
      dome: BRAND.purple,
      bar: BRAND.pink,
      clapper: BRAND.orange,
    });
    expect(BELL_BADGE.color).toBe(BADGE);
  });
});
