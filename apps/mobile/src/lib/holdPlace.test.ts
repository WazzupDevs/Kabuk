import { describe, expect, it } from 'vitest';

import { holdPlace } from './holdPlace';

const edges = { top: 40, bottom: 800 };
const gap = 8;
const BAR = 50;
const MENU = 200;

describe('a held message stays put; its bar and menu go over or under it', () => {
  it('in the middle: the bar over the message, the menu under it', () => {
    const p = holdPlace({ y: 300, height: 60 }, BAR, MENU, edges, gap);
    expect(p).toEqual({
      barTop: 300 - 8 - 50,
      menuTop: 300 + 60 + 8,
      barBelow: false,
      menuBelow: true,
    });
  });

  it('near the foot: the menu goes over the message and the bar under it', () => {
    const p = holdPlace({ y: 700, height: 60 }, BAR, MENU, { top: 40, bottom: 840 }, gap);
    expect(p.menuTop).toBe(700 - 8 - 200);
    expect(p.menuBelow).toBe(false);
    expect(p.barTop).toBe(700 + 60 + 8);
    expect(p.barBelow).toBe(true);
  });

  it('near the foot with no room under for the bar: the bar over the menu', () => {
    const p = holdPlace({ y: 720, height: 70 }, BAR, MENU, edges, gap);
    expect(p.menuTop).toBe(720 - 8 - 200);
    expect(p.barTop).toBe(720 - 8 - 200 - 8 - 50);
    expect(p.barBelow).toBe(false);
  });

  it('near the top: the bar under the message and the menu under the bar', () => {
    const p = holdPlace({ y: 60, height: 60 }, BAR, MENU, edges, gap);
    expect(p.barTop).toBe(60 + 60 + 8);
    expect(p.menuTop).toBe(60 + 60 + 8 + 50 + 8);
    expect([p.barBelow, p.menuBelow]).toEqual([true, true]);
  });

  it('a message too tall for either: the bar at the top edge, the menu at the foot', () => {
    const p = holdPlace({ y: 50, height: 740 }, BAR, MENU, edges, gap);
    expect(p.barTop).toBe(40);
    expect(p.menuTop).toBe(800 - 200);
  });

  it('without a bar or without a menu, only the other is placed', () => {
    expect(holdPlace({ y: 300, height: 60 }, null, MENU, edges, gap).barTop).toBeNull();
    expect(holdPlace({ y: 300, height: 60 }, BAR, null, edges, gap).menuTop).toBeNull();
    expect(holdPlace({ y: 760, height: 30 }, null, MENU, edges, gap).menuTop).toBe(760 - 8 - 200);
  });

  it('never moves the message: it is not part of the answer', () => {
    expect(Object.keys(holdPlace({ y: 300, height: 60 }, BAR, MENU, edges, gap)).sort()).toEqual([
      'barBelow',
      'barTop',
      'menuBelow',
      'menuTop',
    ]);
  });
});
