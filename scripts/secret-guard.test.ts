import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  checkContent,
  checkPath,
  checkSample,
  parseAllow,
  report,
  run,
  SAMPLE_DECK,
  scan,
} from './secret-guard.mjs';

// Fake keys are built at run time from parts, so this file itself never holds a matching value
// (the repository scan below would stop it otherwise).
const fake = {
  supabase: ['sb', 'secret', 'x'.repeat(24)].join('_'),
  github: 'gh' + 'p_' + 'A1'.repeat(18),
  githubPat: 'github' + '_pat_' + 'B2'.repeat(20),
  sentry: 'sntr' + 'ys_' + 'C3'.repeat(16),
  posthog: 'ph' + 'x_' + 'D4'.repeat(12),
  privateKey: ['-----BEGIN', 'RSA PRIVATE', 'KEY-----'].join(' '),
  serviceEnv: 'SUPABASE_SERVICE' + '_ROLE_KEY=' + 'e'.repeat(40),
  secretEnv: 'SUPABASE_SECRET' + '_KEY: "' + 'f'.repeat(40) + '"',
  expo: 'EXPO' + '_TOKEN=' + 'g'.repeat(40),
};
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (claims: object) =>
  `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}.${'s'.repeat(43)}`;

const deckRow = { id: 'q1', text: 'Bir yılda kaç saat var?', answer: 8760, source: 'hesap' };
const sample = (rows: object[], extra: object = { sample: true }) =>
  JSON.stringify({ ...extra, questions: rows });

describe('secret gate: paths', () => {
  it('stops private content, real decks, verification repos, key files and env files', () => {
    expect(checkPath('content/private/sorular.json')).toBe('private-content');
    expect(checkPath('content/kaupholl-questions.json')).toBe('real-deck');
    expect(checkPath('scripts/kaupholl-questions.ts')).toBe('real-deck');
    expect(checkPath('kaupholl-sorular/sorular.json')).toBe('verification-repo');
    expect(checkPath('x/kaupholl-kontrol/a.json')).toBe('verification-repo');
    expect(checkPath('dogrulama/q1.json')).toBe('verification-repo');
    for (const p of ['a.pem', 'b/c.key', 'k.p8', 'k.p12', 'k.pfx', 'release.jks', 'x.keystore']) {
      expect(checkPath(p)).toBe('key-file');
    }
    for (const p of ['.env', 'apps/mobile/.env', 'supabase/.env.local', '.env.production']) {
      expect(checkPath(p)).toBe('env-file');
    }
  });

  it('lets the sample deck, .env.example and ordinary files through', () => {
    expect(checkPath(SAMPLE_DECK)).toBeNull();
    expect(checkPath('apps/mobile/.env.example')).toBeNull();
    expect(checkPath('.env.example')).toBeNull();
    expect(checkPath('content/tabu-cards.json')).toBeNull();
    expect(checkPath('docs/keyboard.md')).toBeNull();
  });
});

describe('secret gate: deck shape', () => {
  it('stops rows with an answer and a source outside the sample deck', () => {
    expect(checkContent('content/x.json', JSON.stringify([deckRow]))).toContain('deck-shape');
    expect(
      checkContent('a/b.json', JSON.stringify({ q: [{ answer_scaled: 1, source: 's' }] })),
    ).toContain('deck-shape');
    expect(checkContent('a/b.json', '{"answer": 1, "source": "x", broken')).toContain('deck-shape');
    expect(checkContent('a/b.yaml', '- id: q1\n  answer: 8760\n  source: hesap\n')).toContain(
      'deck-shape',
    );
    expect(checkContent('a/b.csv', 'id,text,answer,source\nq1,x,1,y\n')).toContain('deck-shape');
  });

  it('lets other JSON through', () => {
    expect(checkContent('content/x.json', JSON.stringify([{ answer: 1 }]))).toEqual([]);
    expect(checkContent('content/x.json', JSON.stringify({ source: 'docs' }))).toEqual([]);
    expect(checkContent('a/b.csv', 'id,answer\n1,2\n')).toEqual([]);
    expect(checkContent('a/notes.md', '"answer": 1, "source": "x"')).toEqual([]);
  });

  it('holds the sample deck to its own rules', () => {
    const row = { ...deckRow, text: 'Örnek soru 1: kaç?' };
    expect(checkSample(sample([row]))).toBeNull();
    expect(checkContent(SAMPLE_DECK, sample([row]))).toEqual([]);
    expect(checkSample(sample([row], {}))).toBe('sample-deck-unmarked');
    expect(checkSample(sample([row], { sample: 'true' }))).toBe('sample-deck-unmarked');
    expect(checkSample(sample(Array.from({ length: 21 }, () => row)))).toBe('sample-deck-too-long');
    expect(checkSample(sample([row, deckRow]))).toBe('sample-deck-real-question');
    expect(checkSample('{')).toBe('sample-deck-invalid');
    expect(checkContent(SAMPLE_DECK, sample([deckRow]))).toContain('sample-deck-real-question');
  });
});

describe('secret gate: access keys', () => {
  it('stops every key kind', () => {
    const cases: [string, string][] = [
      [`const k = '${fake.supabase}'`, 'supabase-secret-key'],
      [`token ${fake.github}`, 'github-token'],
      [`token ${fake.githubPat}`, 'github-token'],
      [`SENTRY_AUTH_TOKEN=${fake.sentry}`, 'sentry-token'],
      [`key: ${fake.posthog}`, 'posthog-personal-key'],
      [`${fake.privateKey}\nMIIE\n`, 'private-key'],
      [fake.serviceEnv, 'service-role-env'],
      [fake.secretEnv, 'service-role-env'],
      [fake.expo, 'expo-token'],
      [
        `Authorization: Bearer ${jwt({ role: 'service_role', iss: 'supabase' })}`,
        'service-role-jwt',
      ],
    ];
    for (const [text, rule] of cases) expect(checkContent('src/a.ts', text)).toContain(rule);
  });

  it('lets client keys, placeholders and the local demo key through', () => {
    const ok = [
      `EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_${'p'.repeat(30)}`,
      `EXPO_PUBLIC_POSTHOG_KEY=phc_${'q'.repeat(40)}`,
      'EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}',
      'SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY',
      'SUPABASE_SERVICE_ROLE_KEY=<buraya>',
      `anon ${jwt({ role: 'anon', iss: 'supabase' })}`,
      `local ${jwt({ role: 'service_role', iss: 'supabase-demo' })}`,
    ];
    for (const text of ok) expect(checkContent('src/a.ts', text)).toEqual([]);
  });
});

describe('secret gate: allow list and report', () => {
  it('exempts a listed file from content rules, never from path rules', () => {
    const read = () => `x ${fake.github}`;
    expect(scan(['docs/a.md'], read)).toEqual([{ path: 'docs/a.md', rule: 'github-token' }]);
    expect(scan(['docs/a.md'], read, new Set(['docs/a.md']))).toEqual([]);
    expect(scan(['content/private/a.md'], read, new Set(['content/private/a.md']))).toEqual([
      { path: 'content/private/a.md', rule: 'private-content' },
    ]);
  });

  it('rejects a list line without a reason or with a missing file', () => {
    const exists = (p: string) => p === 'docs/a.md';
    const { paths, errors } = parseAllow(
      '# yorum\n\ndocs/a.md # sahte örnek anahtar\ndocs/a.md\nyok.md # gerekçe\n',
      exists,
    );
    expect([...paths]).toEqual(['docs/a.md']);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/:4: gerekçe yok/);
    expect(errors[1]).toMatch(/:5: yok\.md yok/);
  });

  it('never prints the matched value', () => {
    const findings = scan(['src/a.ts'], () => `${fake.github} ${fake.serviceEnv}`);
    const out = report({ findings, errors: [] }).join('\n');
    expect(out).toContain('src/a.ts: github-token');
    expect(out).not.toContain(fake.github);
    expect(out).not.toContain('e'.repeat(40));
  });

  it('skips binary files', () => {
    expect(scan(['img.png'], () => null)).toEqual([]);
  });
});

describe('secret gate: in a repository', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const cli = join(here, 'secret-guard.mjs');
  let dir = '';
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  const repo = () => {
    dir = mkdtempSync(join(tmpdir(), 'secret-guard-'));
    git('init', '-q');
    git('config', 'user.email', 't@example.com');
    git('config', 'user.name', 't');
    put('.gitignore', 'content/private/\n');
    put('README.md', 'temiz\n');
    git('add', '.');
  };
  const runCli = (...args: string[]) =>
    spawnSync('node', [cli, ...args], { cwd: dir, encoding: 'utf8' });
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = '';
  });

  it('passes a clean repository and fails on a tracked secret, without printing it', () => {
    repo();
    expect(runCli().status).toBe(0);
    put('src/a.ts', `export const k = '${fake.supabase}';\n`);
    git('add', 'src/a.ts');
    const r = runCli();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('src/a.ts: supabase-secret-key');
    expect(r.stderr + r.stdout).not.toContain(fake.supabase);
  });

  it('checks the index in staged mode and ignores untracked, ignored files', () => {
    repo();
    put('content/private/sorular.json', JSON.stringify([deckRow]));
    expect(runCli().status).toBe(0);
    expect(runCli('--staged').status).toBe(0);
    put('kaupholl-questions.json', JSON.stringify([deckRow]));
    git('add', 'kaupholl-questions.json');
    const r = runCli('--staged');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('kaupholl-questions.json: real-deck');
    expect(r.stderr).toContain('kaupholl-questions.json: deck-shape');
  });

  it('reads the staged content, not the work tree', () => {
    repo();
    put('src/b.ts', `const t = '${fake.github}';\n`);
    git('add', 'src/b.ts');
    put('src/b.ts', 'const t = 1;\n');
    expect(run(dir, { mode: 'staged' }).findings).toEqual([
      { path: 'src/b.ts', rule: 'github-token' },
    ]);
  });

  it('fails on a broken allow list', () => {
    repo();
    put('scripts/secret-guard.allow', 'yok.md # gerekçe\n');
    git('add', '.');
    const r = runCli();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('yok.md yok');
  });

  it('passes this repository as it stands', () => {
    const root = join(here, '..');
    const { findings, errors } = run(root);
    expect(errors).toEqual([]);
    expect(findings).toEqual([]);
  });
});
