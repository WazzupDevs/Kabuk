import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { blockReason, commitCandidates, secretReason } from '../.claude/hooks/guard.mjs';

const blocked = (command: string, dirty = false) => blockReason(command, { dirty }) !== null;

describe('guard hook', () => {
  it('stops what CLAUDE.md forbids', () => {
    expect(blocked('pnpm supabase config push')).toBe(true);
    expect(blocked('npx supabase config push --project-ref abc')).toBe(true);
    expect(blocked('psql "$DB" -f supabase/local/secrets.sql')).toBe(true);
    expect(blocked('supabase db execute --linked -f supabase/local/secrets.sql')).toBe(true);
    expect(blocked('git push origin main')).toBe(true);
    expect(blocked('git push -f origin HEAD:main')).toBe(true);
    expect(blocked('git push origin +main')).toBe(true);
    expect(blocked('git push origin HEAD:refs/heads/main')).toBe(true);
    expect(blocked('eas update --channel production --message x')).toBe(true);
    expect(blocked('eas update --branch=production')).toBe(true);
    expect(blocked('npx eas submit -p android')).toBe(true);
  });

  it('lets everyday commands through', () => {
    expect(blocked('pnpm db:reset')).toBe(false);
    expect(blocked('git push -u origin temizlik-2')).toBe(false);
    expect(blocked('git push -u origin feat-main-menu')).toBe(false);
    expect(blocked('git push --force-with-lease origin lobi-ince')).toBe(false);
    expect(blocked('git fetch origin main && git rebase origin/main')).toBe(false);
    expect(blocked('eas update --channel preview --message x')).toBe(false);
    expect(blocked('pnpm supabase start')).toBe(false);
    expect(blocked('git reset --hard origin/main')).toBe(false);
  });

  it('keeps uncommitted work from being thrown away', () => {
    expect(blocked('git reset --hard origin/main', true)).toBe(true);
    expect(blocked('git checkout -- .', true)).toBe(true);
    expect(blocked('git clean -fd', true)).toBe(true);
    expect(blocked('git status', true)).toBe(false);
  });
});

describe('guard hook: secret gate before git add and git commit', () => {
  let dir = '';
  const git = (args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  const repo = () => {
    dir = mkdtempSync(join(tmpdir(), 'guard-hook-'));
    git(['init', '-q']);
    git(['config', 'user.email', 't@example.com']);
    git(['config', 'user.name', 't']);
    put('README.md', 'temiz\n');
    git(['add', '.']);
    git(['commit', '-qm', 'ilk']);
  };
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = '';
  });
  // Built from parts: this file must not hold a matching value itself.
  const token = 'gh' + 'p_' + 'Z9'.repeat(18);

  it('stops adding a private question file and committing a staged key', async () => {
    repo();
    put('content/private/sorular.json', '[]');
    expect(await secretReason('git add content/private/sorular.json', dir)).toMatch(
      /content\/private\/sorular\.json: private-content/,
    );
    expect(await secretReason('git add -A && git commit -m x', dir)).toMatch(/private-content/);
    put('src/a.ts', `const t = '${token}';\n`);
    git(['add', 'src/a.ts']);
    const reason = await secretReason('git commit -m "add a file"', dir);
    expect(reason).toMatch(/src\/a\.ts: github-token/);
    expect(reason).not.toContain(token);
  });

  it('lets clean adds and commits through, and ignores other commands', async () => {
    repo();
    put('src/ok.ts', 'export const a = 1;\n');
    expect(await secretReason('git add src/ok.ts', dir)).toBeNull();
    expect(await secretReason('git add . && git commit -m "add ok"', dir)).toBeNull();
    put('content/private/x.json', '[]');
    expect(await secretReason('git status && git log --oneline', dir)).toBeNull();
    expect(await secretReason('git add src/ok.ts', dir)).toBeNull();
  });

  it('reads the files a command would commit', () => {
    repo();
    put('a.txt', 'a');
    put('b/c.txt', 'c');
    put('README.md', 'değişti');
    const g = (args: string[]) => git(args);
    expect(commitCandidates('git add a.txt', g)).toEqual(['a.txt']);
    expect(commitCandidates('git add .', g).sort()).toEqual(['README.md', 'a.txt', 'b/c.txt']);
    expect(commitCandidates('git -C . add -A', g).sort()).toEqual([
      'README.md',
      'a.txt',
      'b/c.txt',
    ]);
    expect(commitCandidates('git commit -m "add a.txt"', g)).toEqual([]);
    expect(commitCandidates('git commit -am "x"', g)).toEqual(['README.md']);
    expect(commitCandidates('git log -p', g)).toEqual([]);
  });
});
