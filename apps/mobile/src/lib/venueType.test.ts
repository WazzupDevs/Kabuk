import { VENUE_CATEGORIES } from '@shared/venueKind.ts';
import { describe, expect, it } from 'vitest';

import { tr } from '../i18n/tr';
import { venueType } from './venueType';

describe('venueType', () => {
  it("draws a cafe-kind venue by its category: v46's cafe, tea garden and food", () => {
    expect(VENUE_CATEGORIES.map((category) => venueType({ kind: 'cafe', category }))).toEqual([
      'kafe',
      'cay',
      'yemek',
    ]);
  });

  it('tells a campus by its kind and takes a cafe without a category for a kafe', () => {
    expect(venueType({ kind: 'campus', category: null })).toBe('kampus');
    expect(venueType({ kind: 'cafe', category: null })).toBe('kafe');
  });

  it('has a word for every type', () => {
    for (const type of ['kafe', 'cay', 'yemek', 'kampus'] as const) {
      expect(tr.explore.typeLabel[type].length, type).toBeGreaterThan(0);
    }
  });
});
