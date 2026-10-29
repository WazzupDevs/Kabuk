import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { TABLE_ART } from './vampirArt';

const DIR = resolve(import.meta.dirname, '../../assets/vampir/table');

describe('Vampir Köylü table pictures', () => {
  it('are drawn from the SVG text as it is now (else: node --experimental-strip-types scripts/art/vampirTable.ts)', () => {
    const manifest = JSON.parse(readFileSync(resolve(DIR, 'manifest.json'), 'utf8')) as Record<
      string,
      string
    >;
    const art = TABLE_ART();
    expect(Object.keys(manifest).sort()).toEqual(Object.keys(art).sort());
    for (const [name, svg] of Object.entries(art)) {
      expect(createHash('sha256').update(svg).digest('hex'), name).toBe(manifest[name]);
      expect(existsSync(resolve(DIR, `${name}.webp`)), name).toBe(true);
    }
  });
});
