import { describe, expect, it } from 'vitest';

import { V46_COMPONENTS, V46_PALETTE } from './tokens.generated';
import { galleryGroups, galleryTestId } from './v46Gallery';

describe('the v46 gallery', () => {
  it('lists every inventory component once, in its group', () => {
    const groups = galleryGroups();
    const ids = groups.flatMap((g) => g.ids);
    expect(ids).toEqual(Object.keys(V46_COMPONENTS));
    expect(new Set(groups.map((g) => g.name)).size).toBe(groups.length);
    for (const g of groups) {
      for (const id of g.ids) expect(V46_COMPONENTS[id].group).toBe(g.name);
    }
    expect(groups.map((g) => g.name)[0]).toBe('Düğmeler');
  });

  it('names entries as v46 names its gallery anchors', () => {
    expect(galleryTestId('birincil-52')).toBe('gal-birincil-52');
    expect(galleryTestId('birincil-52', 'pressed')).toBe('gal-birincil-52-pressed');
  });

  it('has the same colour names in both schemes', () => {
    expect(Object.keys(V46_PALETTE.dark)).toEqual(Object.keys(V46_PALETTE.light));
  });
});
