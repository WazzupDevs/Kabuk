import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { emotesSource } from './emotes.ts';

const root = join(import.meta.dirname, '../..');

describe('reaction faces', () => {
  it('are the canvas drawings, generated', () => {
    expect(readFileSync(join(root, 'apps/mobile/src/theme/emotes.generated.ts'), 'utf8')).toBe(
      emotesSource(root),
    );
  });
});
