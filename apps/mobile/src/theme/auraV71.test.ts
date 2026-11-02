import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { THEME } from './theme';

const mobile = join(import.meta.dirname, '..', '..');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
  });
}

describe('aura v71 kit colours', () => {
  it('lively and its ink are the theme palette (no copy in the kit)', () => {
    const { light, dark } = THEME.palettes;
    expect([light.lively, light.onLively]).toEqual(['#FFE6C7', '#7A4300']);
    expect([dark.lively, dark.onLively]).toEqual(['#46290B', '#FFD8A3']);
  });
});

describe('capsule icon names (F2)', () => {
  const calls = [...files(join(mobile, 'app')), ...files(join(mobile, 'src'))].filter(
    (p) => !p.endsWith('AppIcon.tsx'),
  );
  it.each(['camera-outline', 'flag-outline', 'arrow-forward'])('no %s call is left', (name) => {
    const left = calls.filter((p) =>
      [`"${name}"`, `'${name}'`].some((q) => readFileSync(p, 'utf8').includes(q)),
    );
    expect(left).toEqual([]);
  });
});
