import { describe, expect, it } from 'vitest';

import { KINSHI, KINSHI_TYPE, KINSHI_MIN_TYPE, kinshiDeck } from './kinshi';

describe('kinshiDeck', () => {
  it('is the panels’ card on 390 dp', () => {
    const d = kinshiDeck(390);
    expect(d.scale).toBe(1);
    expect(d.card).toEqual(KINSHI.card);
    expect(d.edges).toEqual([...KINSHI.edges]);
    expect(d.panel.width).toBe(KINSHI.panel.width);
  });

  it('is the screen less 94 at 320 dp, 3:4, the rest scaled with it', () => {
    const d = kinshiDeck(320);
    expect(d.card.width).toBe(226);
    expect(d.card.height).toBe(301);
    expect(d.edges.at(-1)).toBeCloseTo((15 * 226) / 296);
    expect(d.peek.above).toBeCloseTo((78 * 226) / 296);
    expect(d.panel.width).toBe(226 - 32);
  });

  it('never grows past the drawn card', () => {
    expect(kinshiDeck(430).card.width).toBe(KINSHI.card.width);
  });

  it('lets the words shrink no further than 22 and 16', () => {
    expect(KINSHI_TYPE.word.fontSize).toBe(30);
    expect(KINSHI_TYPE.forbidden.fontSize).toBe(20);
    expect(KINSHI_MIN_TYPE).toEqual({ word: 22, forbidden: 16 });
  });
});
