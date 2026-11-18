import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { type GateConfig, pullRequestOf, runShots } from './states.ts';

const config = {
  esik: 99.5,
  durumlar: [
    { id: 'eski', app: 'ekran/eski' },
    { id: 'bu-pr', app: 'ekran/bu-pr' },
    { id: 'deneme', app: 'ekran/deneme', baz: false },
    { id: 'bazsiz', app: 'ekran/bazsiz' },
  ],
} as GateConfig;

function repo(): string {
  const root = mkdtempSync(join(tmpdir(), 'runshots-'));
  mkdirSync(join(root, 'e2e/visual/baz'), { recursive: true });
  for (const id of ['eski', 'bu-pr']) {
    for (const theme of ['light', 'dark']) {
      writeFileSync(join(root, `e2e/visual/baz/${id}-${theme}-1.png`), '');
    }
  }
  writeFileSync(
    join(root, 'e2e/visual/kapsam.json'),
    JSON.stringify([
      { durum: 'eski', kanit: 700 },
      { durum: 'bu-pr', kanit: 747 },
      { durum: null, kanit: 747 },
    ]),
  );
  return root;
}

const PR = { GITHUB_EVENT_NAME: 'pull_request', GITHUB_REF: 'refs/pull/747/merge' };
const ids = (root: string, env: Record<string, string>) => [
  ...new Set(runShots(root, config, env).map((s) => s.state.id)),
];

describe('runShots', () => {
  it('reads the pull request from the run', () => {
    expect(pullRequestOf(PR)).toBe(747);
    expect(pullRequestOf({ GITHUB_EVENT_NAME: 'schedule', GITHUB_REF: 'refs/heads/main' })).toBe(
      null,
    );
    expect(pullRequestOf({})).toBe(null);
  });

  it('takes every shot outside a pull request', () => {
    const root = repo();
    expect(ids(root, {})).toEqual(['eski', 'bu-pr', 'deneme', 'bazsiz']);
    expect(ids(root, { GITHUB_EVENT_NAME: 'schedule', GITHUB_REF: 'refs/heads/main' })).toEqual([
      'eski',
      'bu-pr',
      'deneme',
      'bazsiz',
    ]);
  });

  it("takes only the PR's own states on a pull request", () => {
    // On trial, without a baseline yet, or named by a kapsam row with this PR as its evidence.
    expect(ids(repo(), PR)).toEqual(['bu-pr', 'deneme', 'bazsiz']);
  });

  it('takes every shot on a pull request that has none of its own', () => {
    const root = repo();
    const settled = { ...config, durumlar: config.durumlar.slice(0, 2) } as GateConfig;
    const other = { GITHUB_EVENT_NAME: 'pull_request', GITHUB_REF: 'refs/pull/900/merge' };
    expect(runShots(root, settled, other).map((s) => s.name)).toHaveLength(4);
  });
});
