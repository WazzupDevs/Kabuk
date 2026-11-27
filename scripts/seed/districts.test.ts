// The drawn rings of content/districts.json (docs/SPEC_V4.md §4.V): known places land in the right
// district, a shared border offers both, a district not drawn stays outside.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { type LngLat, locate } from '../../supabase/functions/_shared/pure/district.ts';
import { parseDistricts } from './districts.ts';

const shapes = parseDistricts(
  JSON.parse(readFileSync(join(__dirname, '../../content/districts.json'), 'utf8')),
);

describe('content/districts.json', () => {
  it.each<[string, LngLat, string]>([
    ['Beylikdüzü', [28.64, 40.99], 'beylikduzu'],
    ['Sakarya Üniversitesi Esentepe Kampüsü', [30.3315, 40.7413], 'serdivan'],
    ['Serdivan merkezi', [30.36, 40.762], 'serdivan'],
    ['Adapazarı merkezi', [30.403, 40.781], 'adapazari'],
    ['Sapanca merkezi', [30.267, 40.691], 'sapanca'],
  ])('%s is in its district', (_place, point, ref) => {
    expect(locate(point, shapes)).toEqual({ kind: 'found', ref });
  });

  it('offers both Sakarya districts on their shared border', () => {
    expect(locate([30.387, 40.775], shapes)).toEqual({
      kind: 'choose',
      refs: ['serdivan', 'adapazari'],
    });
  });

  it('leaves Arifiye outside', () => {
    expect(locate([30.363, 40.713], shapes)).toEqual({ kind: 'outside' });
  });
});
