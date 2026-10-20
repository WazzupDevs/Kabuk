import { resolve } from 'node:path';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const eslint = new ESLint({ cwd: root });

// The v46 native components' rule (eslint.config.mjs → apps/mobile/src/ui): only the messages of
// that rule count here.
async function restricted(source: string): Promise<number[]> {
  const [result] = await eslint.lintText(source, {
    filePath: resolve(root, 'apps/mobile/src/ui/Example.tsx'),
  });
  return (result?.messages ?? [])
    .filter((m) => m.ruleId === 'no-restricted-syntax')
    .map((m) => m.line);
}

describe('apps/mobile/src/ui: no colour, size or spacing written in a component', () => {
  it('refuses colour literals and numbers in sizes', async () => {
    const lines = await restricted(
      [
        "export const a = { color: '#FFFFFF' };",
        "export const b = { backgroundColor: 'rgba(0, 0, 0, 0.5)' };",
        'export const c = { padding: 12, borderRadius: 999 };',
        'export const d = { marginTop: -4 };',
        'export const e = { minHeight: 48, fontSize: 16 };',
      ].join('\n'),
    );
    expect(lines).toEqual([1, 2, 3, 3, 4, 5, 5]);
  }, 60_000);

  it('takes values from the theme, and 0 and flex as they are', async () => {
    const lines = await restricted(
      [
        "import { V46_COMPONENTS } from '../theme/tokens.generated';",
        "const button = V46_COMPONENTS['birincil-52'].light;",
        'export const a = { height: button.height, backgroundColor: button.bg ?? undefined };',
        'export const b = { margin: 0, flex: 1, zIndex: 2 };',
      ].join('\n'),
    );
    expect(lines).toEqual([]);
  }, 60_000);
});
