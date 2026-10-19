import { describe, expect, it } from 'vitest';

import { TABLE_ICON_THEMES, TABLE_ICONS } from './tableIcons.ts';
import { isTableIcon } from './tables.ts';

describe('table icons (K-45)', () => {
  it('are v46’s 100 icons in 20 themes, five each', () => {
    expect(TABLE_ICONS).toHaveLength(100);
    expect(TABLE_ICON_THEMES).toHaveLength(20);
    for (const theme of TABLE_ICON_THEMES) {
      expect(
        TABLE_ICONS.filter((i) => i.theme === theme),
        theme,
      ).toHaveLength(5);
    }
    expect(TABLE_ICONS[0]).toEqual({ id: 'kis-kardanadam', name: 'Kardan adam', theme: 'Kış' });
  });

  it('accepts only an id of the list', () => {
    expect(isTableIcon('kis-kardanadam')).toBe(true);
    expect(isTableIcon('kis-yok')).toBe(false);
    expect(isTableIcon(3)).toBe(false);
  });
});
