import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { capIconsSource, GENERATED, parseIcon } from './capIcons.ts';

const root = join(import.meta.dirname, '../..');

describe('capsule icons', () => {
  it('are the canvas drawings, generated', () => {
    expect(readFileSync(join(root, GENERATED), 'utf8')).toBe(capIconsSource(root));
  });

  it('reads a part with its layer', () => {
    expect(
      parseIcon('<svg><rect data-layer="b" x="1" y="2" width="3" height="4" rx="1.5"/></svg>', 't'),
    ).toEqual([{ t: 'rect', l: 'b', x: 1, y: 2, width: 3, height: 4, rx: 1.5 }]);
  });

  it('refuses a part without a layer', () => {
    expect(() => parseIcon('<svg><circle cx="1" cy="1" r="1"/></svg>', 't')).toThrow();
  });
});
