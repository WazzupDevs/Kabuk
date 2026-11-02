import { describe, expect, it } from 'vitest';

import { TABLE_ICON_THEMES, TABLE_ICONS } from './tableIcons.ts';
import { isTableIcon } from './tables.ts';

describe('table icons (K-45)', () => {
  // The 55 riso table cards, one list (docs/decisions/masa-kimligi-riso.md).
  it('are the 55 riso cards, in one list', () => {
    expect(TABLE_ICONS).toHaveLength(55);
    expect(TABLE_ICON_THEMES).toHaveLength(1);
    expect(TABLE_ICONS[0]).toEqual({ id: '01-fener', name: 'Balinanın Feneri', theme: 'Masa' });
  });

  it('accepts only an id of the list', () => {
    expect(isTableIcon('16-lale')).toBe(true);
    expect(isTableIcon('kis-kardanadam')).toBe(false);
    expect(isTableIcon(3)).toBe(false);
  });
});
