import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { artifactOf, isShot, listed, passedOf, planShots, shotFlows } from './tuval-images.ts';

describe("the design canvas's images (tuval-goruntu)", () => {
  it('knows the run artifacts by name', () => {
    expect(artifactOf('e2e-run-light-1')).toEqual({ theme: 'light', shard: 1 });
    expect(artifactOf('e2e-run-dark-4')).toEqual({ theme: 'dark', shard: 4 });
    expect(artifactOf('e2e-run-large-2')).toEqual({ theme: 'large', shard: 2 });
    expect(artifactOf('e2e-run-visual')).toEqual({ theme: 'visual', shard: null });
    expect(artifactOf('e2e-apk')).toBeNull();
    expect(artifactOf('e2e-run-light-5')).toBeNull();
  });

  it("takes a shard's screenshots, not its first attempt's nor its debug output", () => {
    expect(isShot('light', 'screenshots/04-table.png')).toBe(true);
    expect(isShot('light', 'screenshots/2026-11-12/04-table.png')).toBe(true);
    expect(isShot('light', 'attempt-1/screenshots/04-table.png')).toBe(false);
    expect(isShot('light', 'maestro/.maestro/tests/screenshot-x.png')).toBe(false);
    expect(isShot('light', 'screenshots/commands.json')).toBe(false);
    expect(isShot('visual', 'aday/galeri-sohbet-light-1.png')).toBe(true);
    expect(isShot('visual', 'aday2/galeri-sohbet-light-1.png')).toBe(false);
    expect(isShot('visual', 'fark/galeri-sohbet-light-1.png')).toBe(false);
  });

  it('reads whether the shard or the gate passed', () => {
    expect(passedOf('light', '<testsuite><testcase name="a"/></testsuite>')).toBe(true);
    expect(passedOf('light', '<testcase name="a"><failure>x</failure></testcase>')).toBe(false);
    expect(passedOf('dark', '<testcase name="a"><error>x</error></testcase>')).toBe(false);
    expect(passedOf('large', null)).toBeNull();
    expect(passedOf('visual', '{"ok": true}')).toBe(true);
    expect(passedOf('visual', '{"ok": false}')).toBe(false);
    expect(passedOf('visual', 'not json')).toBeNull();
  });

  it('keeps one file a name and theme, the lowest shard that took it', () => {
    const shots = planShots(
      [
        { artifact: 'e2e-run-light-2', path: 'screenshots/01-welcome.png', passed: false },
        { artifact: 'e2e-run-light-1', path: 'screenshots/01-welcome.png', passed: true },
        { artifact: 'e2e-run-light-1', path: 'attempt-1/screenshots/09-old.png', passed: true },
        { artifact: 'e2e-run-large-3', path: 'screenshots/01-welcome.png', passed: null },
        { artifact: 'e2e-run-visual', path: 'aday/ekran-dm-dark-1.png', passed: true },
        { artifact: 'e2e-apk', path: 'screenshots/x.png', passed: true },
      ],
      (name) => (name === '01-welcome' ? 'e2e/maestro/flows/01-login.yaml' : null),
    ).map(listed);
    expect(shots).toEqual([
      {
        name: '01-welcome',
        theme: 'large',
        file: 'large/01-welcome.png',
        flow: 'e2e/maestro/flows/01-login.yaml',
        shard: 3,
        passed: null,
      },
      {
        name: '01-welcome',
        theme: 'light',
        file: 'light/01-welcome.png',
        flow: 'e2e/maestro/flows/01-login.yaml',
        shard: 1,
        passed: true,
      },
      {
        name: 'ekran-dm-dark-1',
        theme: 'visual',
        file: 'visual/ekran-dm-dark-1.png',
        flow: null,
        shard: null,
        passed: true,
      },
    ]);
  });

  it('finds the flow that takes a shot', () => {
    const flows = shotFlows([
      { path: 'e2e/maestro/flows/b.yaml', text: '- takeScreenshot: 02-b\n' },
      { path: 'e2e/maestro/flows/a.yaml', text: '- tapOn: x\n    - takeScreenshot: 01-a\n' },
    ]);
    expect(flows.get('01-a')).toBe('e2e/maestro/flows/a.yaml');
    expect(flows.get('02-b')).toBe('e2e/maestro/flows/b.yaml');
  });
});

// The job itself (.github/workflows/e2e.yml → tuval-goruntu): what it is allowed and when it runs.
describe('the tuval-goruntu job', () => {
  const yml = readFileSync(resolve(import.meta.dirname, '../../.github/workflows/e2e.yml'), 'utf8');
  const at = yml.indexOf('\n  tuval-goruntu:\n');
  const job = yml.slice(at);

  it('is the only job that may write to the repository', () => {
    expect(at).toBeGreaterThan(-1);
    const before = yml
      .slice(0, at)
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'));
    expect(before.join('\n')).not.toContain('contents: write');
    expect(job).toContain('contents: write');
  });

  it('runs nightly and by hand on main only, whatever the shards did', () => {
    expect(job).toContain(
      "github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'",
    );
    expect(job).toContain("github.ref == 'refs/heads/main'");
    expect(job).toContain('needs: [e2e, visual]');
    expect(job).toContain('!cancelled()');
  });

  it('pins every action it uses to a commit', () => {
    const uses = [...job.matchAll(/uses: (\S+)/g)].map((m) => m[1] ?? '');
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u, u).toMatch(/@[0-9a-f]{40}$/);
  });
});
