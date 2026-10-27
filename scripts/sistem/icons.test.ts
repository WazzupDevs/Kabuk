import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { iconsSource } from './icons.ts';

const root = join(import.meta.dirname, '../..');

describe('canvas icons', () => {
  it('are the canvas drawings, generated', () => {
    expect(readFileSync(join(root, 'apps/mobile/src/theme/canvasIcons.generated.ts'), 'utf8')).toBe(
      iconsSource(root),
    );
  });
});
