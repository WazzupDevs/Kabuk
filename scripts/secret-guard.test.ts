import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  BINARY_FORMATS,
  bufferHits,
  checkContent,
  checkPath,
  checkSample,
  contentHits,
  fingerprint,
  MAX_BINARY_BYTES,
  MAX_TEXT_BYTES,
  parseAllow,
  report,
  run,
  SAMPLE_DECK,
  scan,
} from './secret-guard.mjs';

// Fake keys are built at run time from parts, so this file itself never holds a matching value
// (the repository scan below would stop it otherwise).
const fake = {
  phone: '90' + '5321234567',
  supabase: ['sb', 'secret', 'x'.repeat(24)].join('_'),
  github: 'gh' + 'p_' + 'A1'.repeat(18),
  github2: 'gh' + 'p_' + 'K7'.repeat(18),
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
const text = (s: string) => Buffer.from(s, 'utf8');
const rules = (hits: { rule: string }[]) => hits.map((h) => h.rule);

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

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
      [`${fake.phone}=482915,${fake.phone}=730264`, 'test-otp-pair'],
      [`${fake.phone} = "482915"`, 'test-otp-pair'],
      [
        `Authorization: Bearer ${jwt({ role: 'service_role', iss: 'supabase' })}`,
        'service-role-jwt',
      ],
    ];
    for (const [t, rule] of cases) expect(checkContent('src/a.ts', t)).toContain(rule);
  });

  it('lets client keys, placeholders and the local demo key through', () => {
    const ok = [
      `EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_${'p'.repeat(30)}`,
      `EXPO_PUBLIC_POSTHOG_KEY=phc_${'q'.repeat(40)}`,
      'EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}',
      'SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY',
      'SUPABASE_SERVICE_ROLE_KEY=<buraya>',
      '905550000001 = "123456"',
      '<numara>=<kod>',
      `anon ${jwt({ role: 'anon', iss: 'supabase' })}`,
      `local ${jwt({ role: 'service_role', iss: 'supabase-demo' })}`,
    ];
    for (const t of ok) expect(checkContent('src/a.ts', t)).toEqual([]);
  });

  it('reports each matched value apart, with its fingerprint', () => {
    const hits = contentHits('src/a.ts', `${fake.github}\n${fake.github2}\n${fake.github}`);
    expect(hits).toEqual([
      { rule: 'github-token', fp: fingerprint(fake.github) },
      { rule: 'github-token', fp: fingerprint(fake.github2) },
      { rule: 'github-token', fp: fingerprint(fake.github) },
    ]);
  });
});

describe('secret gate: nothing passes unread', () => {
  it('scans a text file over 2 MB whole and finds the key in it', () => {
    const big = 'a'.repeat(3 * 1024 * 1024) + `\n${fake.supabase}\n`;
    expect(rules(bufferHits('docs/big.txt', text(big)))).toEqual(['supabase-secret-key']);
  });

  it('fails a text file too large to scan instead of passing it', () => {
    const huge = Buffer.alloc(MAX_TEXT_BYTES + 1, 0x61);
    expect(bufferHits('docs/huge.txt', huge)).toEqual([{ rule: 'unscannable-too-large' }]);
    const film = Buffer.alloc(MAX_BINARY_BYTES + 1);
    film.write('ftyp', 4, 'latin1');
    expect(bufferHits('docs/film.mp4', film)).toEqual([{ rule: 'unscannable-too-large' }]);
  });

  it('treats a file with NUL bytes as text when its extension is not a known binary format', () => {
    const withNul = Buffer.concat([text('başlık\0\0'), text(fake.github), Buffer.from([0, 0])]);
    expect(rules(bufferHits('notes.dat', withNul))).toEqual(['github-token']);
    const utf16 = Buffer.from(`anahtar ${fake.supabase}`, 'utf16le');
    expect(rules(bufferHits('notes.txt', utf16))).toEqual(['supabase-secret-key']);
    const deck = Buffer.concat([text(JSON.stringify([deckRow])), Buffer.from([0])]);
    expect(rules(bufferHits('content/x.json', deck))).toContain('deck-shape');
  });

  it('fails text dressed as an image', () => {
    expect(bufferHits('assets/a.png', text(JSON.stringify([deckRow])))).toEqual([
      { rule: 'binary-mismatch' },
    ]);
    expect(bufferHits('assets/a.webp', text(`RIFF....${fake.github}`))).toEqual([
      { rule: 'binary-mismatch' },
    ]);
  });

  it('lets the repository’s real images, font and film through', () => {
    for (const ext of ['png', 'webp', 'jpg', 'ttf', 'mp4']) {
      const files = tracked.filter((p) => p.toLowerCase().endsWith(`.${ext}`));
      expect(files.length, ext).toBeGreaterThan(0);
      for (const p of files.slice(0, 25)) {
        expect(bufferHits(p, readFileSync(join(root, p))), p).toEqual([]);
      }
    }
  });

  it('still finds a key hidden in a valid image', () => {
    const png = readFileSync(join(root, tracked.find((p) => p.endsWith('.png')) as string));
    // A PNG text chunk: keyword, NUL, value.
    const doctored = Buffer.concat([png, text('tEXtComment\0'), text(fake.github)]);
    expect(BINARY_FORMATS.png?.(doctored)).toBe(true);
    expect(rules(bufferHits('assets/a.png', doctored))).toEqual(['github-token']);
  });

  it('fails an unreadable file and skips only a file deleted in the work tree', () => {
    const read = (p: string) =>
      p === 'gone.ts' ? undefined : p === 'locked.ts' ? 'unscannable-read-error' : text('ok');
    expect(scan(['gone.ts', 'locked.ts', 'ok.ts'], read).findings).toEqual([
      { path: 'locked.ts', rule: 'unscannable-read-error', fp: undefined },
    ]);
  });
});

describe('secret gate: allow list', () => {
  const line = (path: string, rule: string, fp: string) => `${path} ${rule} ${fp}`;

  it('exempts one value of one rule in one file, not the file', () => {
    const allow = new Set([line('docs/a.md', 'github-token', fingerprint(fake.github))]);
    const clean = scan(['docs/a.md'], () => text(`örnek ${fake.github}`), allow);
    expect(clean.findings).toEqual([]);
    expect([...clean.used]).toEqual([...allow]);
    // A real key added later to the same file is caught.
    const later = scan(['docs/a.md'], () => text(`örnek ${fake.github}\n${fake.github2}`), allow);
    expect(later.findings).toEqual([
      { path: 'docs/a.md', rule: 'github-token', fp: fingerprint(fake.github2) },
    ]);
    // Another rule in the same file is caught too.
    const other = scan(['docs/a.md'], () => text(`${fake.github} ${fake.supabase}`), allow);
    expect(rules(other.findings)).toEqual(['supabase-secret-key']);
  });

  it('pins an allowed fake deck to its exact content', () => {
    const deck = JSON.stringify([{ ...deckRow, text: 'sahte' }]);
    const allow = new Set([line('scripts/x.json', 'deck-shape', fingerprint(deck))]);
    expect(scan(['scripts/x.json'], () => text(deck), allow).findings).toEqual([]);
    const changed = JSON.stringify([{ ...deckRow, text: 'sahte' }, deckRow]);
    expect(rules(scan(['scripts/x.json'], () => text(changed), allow).findings)).toEqual([
      'deck-shape',
    ]);
  });

  it('never exempts path rules or unscannable files', () => {
    const exists = () => true;
    const { entries, errors } = parseAllow(
      [
        `content/private/a.md private-content ${'a'.repeat(16)} # olmaz`,
        `x.png binary-mismatch ${'b'.repeat(16)} # olmaz`,
        `x.txt unscannable-too-large ${'c'.repeat(16)} # olmaz`,
      ].join('\n'),
      exists,
    );
    expect(entries.size).toBe(0);
    expect(errors).toHaveLength(3);
    for (const e of errors) expect(e).toMatch(/istisna olamaz/);
    const read = () => text(fake.github);
    const allowAll = new Set([
      line('content/private/a.md', 'private-content', fingerprint(fake.github)),
    ]);
    expect(rules(scan(['content/private/a.md'], read, allowAll).findings)).toContain(
      'private-content',
    );
  });

  it('rejects a malformed line, a missing reason, a bad fingerprint and a missing file', () => {
    const exists = (p: string) => p === 'docs/a.md';
    const fp = 'a'.repeat(16);
    const { entries, errors } = parseAllow(
      [
        '# yorum',
        '',
        `docs/a.md github-token ${fp} # sahte örnek anahtar`,
        'docs/a.md # eski biçim, yalnız yol',
        `docs/a.md github-token ${fp}`,
        'docs/a.md github-token XYZ # gerekçe',
        `yok.md github-token ${fp} # gerekçe`,
      ].join('\n'),
      exists,
    );
    expect([...entries]).toEqual([`docs/a.md github-token ${fp}`]);
    expect(errors).toHaveLength(4);
    expect(errors[0]).toMatch(/:4: "yol kural parmakizi # gerekçe" bekleniyor/);
    expect(errors[1]).toMatch(/:5: gerekçe yok/);
    expect(errors[2]).toMatch(/:6: parmakizi/);
    expect(errors[3]).toMatch(/:7: yok\.md yok/);
  });
});

describe('secret gate: report', () => {
  it('never prints a matched value; fingerprints only when asked', () => {
    const { findings } = scan(['src/a.ts'], () =>
      text(`${fake.github} ${fake.github2} ${fake.serviceEnv}`),
    );
    const out = report({ findings, errors: [] }).join('\n');
    expect(out).toContain('src/a.ts: github-token (×2)');
    expect(out).toContain('src/a.ts: service-role-env');
    for (const value of [fake.github, fake.github2, 'e'.repeat(40), fingerprint(fake.github)]) {
      expect(out).not.toContain(value);
    }
    const withFp = report({ findings, errors: [] }, { withFingerprints: true }).join('\n');
    expect(withFp).toContain(fingerprint(fake.github));
    expect(withFp).not.toContain(fake.github);
  });
});

describe('secret gate: in a repository', () => {
  const cli = join(here, 'secret-guard.mjs');
  let dir = '';
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  const put = (path: string, data: string | Buffer) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), data);
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
    expect(r.stderr + r.stdout).not.toContain(fingerprint(fake.supabase));
  });

  it('catches a key in a tracked text file over 2 MB', () => {
    repo();
    put('docs/big.log.txt', 'x'.repeat(3 * 1024 * 1024) + `\n${fake.github}\n`);
    git('add', '.');
    const r = runCli();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('docs/big.log.txt: github-token');
    expect(r.stderr).not.toContain(fake.github);
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
    expect(rules(run(dir, { mode: 'staged' }).findings)).toEqual(['github-token']);
  });

  it('fails on a submodule, whose content it cannot see', () => {
    repo();
    git('update-index', '--add', '--cacheinfo', `160000,${'1'.repeat(40)},vendor/lib`);
    expect(rules(run(dir).findings)).toEqual(['unscannable-submodule']);
  });

  it('uses the allow list by value, and fails on a stale or broken entry', () => {
    repo();
    put('docs/ornek.md', `Sahte anahtar: ${fake.github}\n`);
    put(
      'scripts/secret-guard.allow',
      `docs/ornek.md github-token ${fingerprint(fake.github)} # belgedeki sahte örnek\n`,
    );
    git('add', '.');
    expect(runCli().status).toBe(0);
    put('docs/ornek.md', `Sahte anahtar: ${fake.github}\nGerçek: ${fake.github2}\n`);
    git('add', '.');
    const r = runCli();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('docs/ornek.md: github-token');
    expect(r.stderr).not.toContain(fake.github2);
    put('docs/ornek.md', 'Artık anahtar yok.\n');
    git('add', '.');
    const stale = runCli();
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain('kullanılmayan istisna (docs/ornek.md github-token)');
    put('scripts/secret-guard.allow', 'yok.md github-token aaaaaaaaaaaaaaaa # gerekçe\n');
    git('add', '.');
    expect(runCli().stderr).toContain('yok.md yok');
  });

  it('prints fingerprints only with --fingerprints', () => {
    repo();
    put('docs/ornek.md', `${fake.github}\n`);
    git('add', '.');
    expect(runCli().stderr).not.toContain(fingerprint(fake.github));
    const r = runCli('--fingerprints');
    expect(r.stderr).toContain(`docs/ornek.md: github-token ${fingerprint(fake.github)}`);
    expect(r.stderr).not.toContain(fake.github);
  });

  it('passes this repository as it stands', () => {
    const { findings, errors } = run(root);
    expect(errors).toEqual([]);
    expect(findings).toEqual([]);
  });
});
