import { describe, expect, it } from 'vitest';

import { metaHiddenAt } from './chatMeta';

describe('metaHiddenAt (Grup 3, P1c: the down arrow never covers the newest time line)', () => {
  it('is the room under the cell, the rows under it and the line top above the cell foot', () => {
    expect(metaHiddenAt({ gapUnder: 12, latest: 0, cellHeight: 80, metaTop: 22 })).toBe(34);
    expect(metaHiddenAt({ gapUnder: 12, latest: 42, cellHeight: 80, metaTop: 22 })).toBe(76);
  });

  it('waits for the whole cell when the newest message has no time line', () => {
    expect(metaHiddenAt({ gapUnder: 12, latest: 0, cellHeight: 80, metaTop: null })).toBe(92);
  });
});
