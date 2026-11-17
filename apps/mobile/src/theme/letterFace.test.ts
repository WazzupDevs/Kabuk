import { describe, expect, it } from 'vitest';

import { letterFace } from './avatar';
import { AA_LARGE, contrastRatio } from './contrast';
import { FLAT } from './flatLists';

describe('request row letter face (IsteklerDolu: .rqa)', () => {
  it('takes the first letter and one colour of the board per name, the same every time', () => {
    expect(letterFace('Zeynep').letter).toBe('Z');
    expect(letterFace('Mert')).toEqual(letterFace('Mert'));
    for (const n of ['Ayşe', 'Mert', 'Deniz', 'Selin', 'Z', '']) {
      expect(FLAT.requestFace.inks).toContain(letterFace(n).color);
    }
  });

  it('reads white at 20/700 (large text, 3:1) on every colour', () => {
    for (const ink of FLAT.requestFace.inks) {
      expect(contrastRatio('#FFFFFF', ink), ink).toBeGreaterThanOrEqual(AA_LARGE);
    }
  });
});
