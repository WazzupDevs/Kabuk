import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// capsuleDrawing.js is the v46 drawing library as it is, with a header and an export.
describe('capsule drawing copy', () => {
  it('is the v46 source', () => {
    const root = resolve(__dirname, '../../../..');
    const source = readFileSync(
      resolve(root, 'docs/design/v46/kaynak/kapsul/kapsul-cizim-kutuphanesi.js'),
      'utf8',
    );
    const copy = readFileSync(resolve(__dirname, 'capsuleDrawing.js'), 'utf8');
    expect(copy.endsWith(`${source}\nexport default LOOK;\n`)).toBe(true);
  });
});
