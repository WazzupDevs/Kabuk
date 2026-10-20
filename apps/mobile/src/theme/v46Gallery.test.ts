import { describe, expect, it } from 'vitest';

import { V46_SCREEN_PARTS } from './parts.generated';
import { V46_COMPONENTS, V46_PALETTE } from './tokens.generated';
import { galleryGroups, galleryInfo, galleryTestId } from './v46Gallery';

describe('the v46 gallery', () => {
  it('lists every inventory component and screen part once, in its group', () => {
    const groups = galleryGroups();
    const ids = groups.flatMap((g) => g.ids);
    const inventory = Object.keys(V46_COMPONENTS);
    const parts = Object.keys(V46_SCREEN_PARTS);
    expect([...ids].sort()).toEqual([...inventory, ...parts].sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(groups.map((g) => g.name)).size).toBe(groups.length);
    // The inventory's own order, the screen parts after the inventory's ids of their group.
    expect(ids.filter((id) => inventory.includes(id))).toEqual(inventory);
    for (const g of groups) {
      for (const id of g.ids) {
        const group =
          id in V46_SCREEN_PARTS
            ? V46_SCREEN_PARTS[id as keyof typeof V46_SCREEN_PARTS].group
            : V46_COMPONENTS[id as keyof typeof V46_COMPONENTS].group;
        expect(group).toBe(g.name);
      }
    }
    expect(groups.map((g) => g.name)[0]).toBe('Düğmeler');
    // The tab bars with Keşfet and Aktiviteler selected go with the inventory's (Sekme çubuğu).
    expect(groups.find((g) => g.ids.includes('alt-sekme-kesfet'))?.ids).toContain(
      'alt-sekme-mekan',
    );
  });

  it('names an entry as v46 does and gives its measured box', () => {
    expect(galleryInfo('alt-sekme-kesfet')).toEqual(V46_SCREEN_PARTS['alt-sekme-kesfet']);
    expect(galleryInfo('birincil-52')).toEqual({
      name: V46_COMPONENTS['birincil-52'].name,
      width: V46_COMPONENTS['birincil-52'].width,
      height: V46_COMPONENTS['birincil-52'].light.height,
    });
  });

  it('names entries as v46 names its gallery anchors', () => {
    expect(galleryTestId('birincil-52')).toBe('gal-birincil-52');
    expect(galleryTestId('birincil-52', 'pressed')).toBe('gal-birincil-52-pressed');
  });

  it('has the same colour names in both schemes', () => {
    expect(Object.keys(V46_PALETTE.dark)).toEqual(Object.keys(V46_PALETTE.light));
  });
});
