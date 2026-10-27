import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { wallsSource } from './walls.ts';

describe('chat walls', () => {
  it('the generated file is the canvas files', () => {
    const root = join(import.meta.dirname, '../..');
    const generated = readFileSync(
      join(root, 'apps/mobile/src/theme/chatWalls.generated.ts'),
      'utf8',
    );
    expect(generated).toBe(wallsSource(root));
  });
});
