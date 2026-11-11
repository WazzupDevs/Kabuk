import { describe, expect, it } from 'vitest';

import { nearFirst, STAGE_AHEAD, stageAhead, tileOrder } from './readAhead';

describe('nearFirst', () => {
  it('goes out from the centre, the one after first', () => {
    expect(nearFirst(10, 5, 2)).toEqual([5, 6, 4, 7, 3]);
  });
  it('stays inside the row', () => {
    expect(nearFirst(3, 0, 5)).toEqual([0, 1, 2]);
    expect(nearFirst(3, 2, 1)).toEqual([2, 1]);
    expect(nearFirst(0, 0, 3)).toEqual([]);
  });
});

describe('stageAhead', () => {
  it('reads the options next to the chosen one, not the chosen one', () => {
    expect(stageAhead(10, 5)).toEqual([6, 4, 7, 3]);
    expect(stageAhead(10, 5)).toHaveLength(STAGE_AHEAD * 2);
    expect(stageAhead(10, 0)).toEqual([1, 2]);
    expect(stageAhead(1, 0)).toEqual([]);
  });
});

describe('tileOrder', () => {
  const slots = [
    { id: 'h', flat: ['h0', 'h1', 'h2'] },
    { id: 'f', flat: ['f0', 'f1', 'f2', 'f3'] },
    { id: 'm', flat: ['m0'] },
  ];
  it("reads the open slot first, from its chosen option out, then the others' in order", () => {
    expect(tileOrder(slots, 'f', 2)).toEqual(['f2', 'f3', 'f1', 'f0', 'h0', 'h1', 'h2', 'm0']);
  });
  it('reads every tile once, whatever is chosen', () => {
    const all = slots.flatMap((s) => s.flat).sort();
    for (const s of slots)
      for (const chosen of [-1, 0, 1, 9])
        expect(tileOrder(slots, s.id, chosen).sort()).toEqual(all);
  });
});
