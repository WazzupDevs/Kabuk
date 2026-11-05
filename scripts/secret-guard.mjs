// The secret gate (Kaupholl v3.1 → "Gizli içerik kapısı"): stops the real Kaupholl questions and
// answers, their verification files, and access keys from entering this public repository.
//
// One check, three places: the Claude hook (.claude/hooks/guard.mjs, before `git add` / `git
// commit`), the Git hook (.githooks/pre-commit, staged files) and CI (`pnpm guard:secrets` in the
// `checks` job, every tracked file). The local hooks can be skipped; CI is the gate, and it holds
// because the `main` ruleset requires the `ci` check.
//
// Findings name the file and the rule, never the matched value: a key must not reach a CI log.
// Plain JavaScript so the hooks run it with bare `node`. Tested in scripts/secret-guard.test.ts.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAMPLE_DECK = 'content/kaupholl-questions.sample.json';
export const ALLOW_FILE = 'scripts/secret-guard.allow';
const SAMPLE_MAX = 20;
const SAMPLE_PREFIX = 'Örnek soru';
const MAX_BYTES = 2 * 1024 * 1024;

// Paths that never belong here, whatever they hold.
const PATH_RULES = [
  { rule: 'private-content', test: (p) => p.startsWith('content/private/') },
  {
    rule: 'real-deck',
    test: (p) => basename(p).includes('kaupholl-questions') && p !== SAMPLE_DECK,
  },
  {
    rule: 'verification-repo',
    test: (p) => /(^|\/)(kaupholl-sorular|kaupholl-kontrol|dogrulama)\//.test(p),
  },
  { rule: 'key-file', test: (p) => /\.(pem|key|p8|p12|pfx|jks|keystore)$/i.test(p) },
  {
    rule: 'env-file',
    test: (p) =>
      /(^|\/)\.env(\.[^/]*)?$/.test(p) && !p.endsWith('/.env.example') && p !== '.env.example',
  },
];

// A value placed after a key name: not a placeholder, a variable or a CI expression.
const VALUE = String.raw`\s*[=:]\s*['"]?(?![$<{])([A-Za-z0-9._\-+/=]{20,})`;

const TOKEN_RULES = [
  { rule: 'supabase-secret-key', re: /\bsb_secret_[A-Za-z0-9_-]{10,}/ },
  { rule: 'private-key', re: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/ },
  { rule: 'github-token', re: /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{36}\b/ },
  { rule: 'github-token', re: /\bgithub_pat_[A-Za-z0-9_]{22,}/ },
  { rule: 'sentry-token', re: /\bsntrys_[A-Za-z0-9+/=_-]{20,}/ },
  { rule: 'posthog-personal-key', re: /\bphx_[A-Za-z0-9]{20,}/ },
  {
    rule: 'service-role-env',
    re: new RegExp(String.raw`\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)${VALUE}`),
  },
  { rule: 'expo-token', re: new RegExp(String.raw`\bEXPO_TOKEN${VALUE}`) },
];

const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g;

function basename(p) {
  return p.slice(p.lastIndexOf('/') + 1);
}

/** The path rule a file breaks, or null. Paths are repository-relative, with `/`. */
export function checkPath(path) {
  for (const { rule, test } of PATH_RULES) if (test(path)) return rule;
  return null;
}

// A service-role JWT, except Supabase's public local demo key (`iss: supabase-demo`).
function serviceRoleJwt(text) {
  for (const m of text.matchAll(JWT)) {
    try {
      const claims = JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8'));
      if (claims?.role === 'service_role' && claims?.iss !== 'supabase-demo') return true;
    } catch {
      // not a JWT after all
    }
  }
  return false;
}

// Rows that carry both an answer and its source: the shape of a question deck.
function deckRows(value) {
  if (Array.isArray(value)) {
    if (
      value.some(
        (row) =>
          row &&
          typeof row === 'object' &&
          ('answer' in row || 'answer_scaled' in row) &&
          'source' in row,
      )
    ) {
      return true;
    }
    return value.some(deckRows);
  }
  if (value && typeof value === 'object') return Object.values(value).some(deckRows);
  return false;
}

function looksLikeDeck(path, text) {
  if (path.endsWith('.json')) {
    try {
      return deckRows(JSON.parse(text));
    } catch {
      return /"answer(_scaled)?"\s*:/.test(text) && /"source"\s*:/.test(text);
    }
  }
  if (/\.ya?ml$/.test(path))
    return /^\s*-?\s*answer(_scaled)?\s*:/m.test(text) && /^\s*source\s*:/m.test(text);
  if (path.endsWith('.csv')) {
    const head = (text.split(/\r?\n/, 1)[0] ?? '')
      .toLowerCase()
      .split(/[,;\t]/)
      .map((c) => c.trim());
    return (head.includes('answer') || head.includes('answer_scaled')) && head.includes('source');
  }
  return false;
}

/** The sample deck's own rules: marked as a sample, few rows, every question an obvious fake. */
export function checkSample(text) {
  let deck;
  try {
    deck = JSON.parse(text);
  } catch {
    return 'sample-deck-invalid';
  }
  const rows = deck?.questions;
  if (deck?.sample !== true || !Array.isArray(rows)) return 'sample-deck-unmarked';
  if (rows.length > SAMPLE_MAX) return 'sample-deck-too-long';
  if (!rows.every((r) => typeof r?.text === 'string' && r.text.startsWith(SAMPLE_PREFIX))) {
    return 'sample-deck-real-question';
  }
  return null;
}

/** The content rules a file breaks (empty when clean). */
export function checkContent(path, text) {
  const found = [];
  if (path === SAMPLE_DECK) {
    const bad = checkSample(text);
    if (bad) found.push(bad);
  } else if (/\.(json|ya?ml|csv)$/.test(path) && looksLikeDeck(path, text)) {
    found.push('deck-shape');
  }
  for (const { rule, re } of TOKEN_RULES)
    if (re.test(text) && !found.includes(rule)) found.push(rule);
  if (serviceRoleJwt(text)) found.push('service-role-jwt');
  return found;
}

/**
 * The allow list: `path # reason` per line, for files that hold only fake values. It exempts a
 * file from the content rules, never from the path rules. Returns the paths and the list's own
 * errors (a missing file or an empty reason).
 */
export function parseAllow(text, exists) {
  const paths = new Set();
  const errors = [];
  for (const [i, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const at = line.indexOf('#');
    const path = (at < 0 ? line : line.slice(0, at)).trim();
    const reason = at < 0 ? '' : line.slice(at + 1).trim();
    if (reason === '') errors.push(`${ALLOW_FILE}:${i + 1}: gerekçe yok`);
    else if (!exists(path)) errors.push(`${ALLOW_FILE}:${i + 1}: ${path} yok`);
    else paths.add(path);
  }
  return { paths, errors };
}

/** Every finding for these files: `read(path)` gives the content, or null for a binary file. */
export function scan(paths, read, allow = new Set()) {
  const findings = [];
  for (const path of paths) {
    const byPath = checkPath(path);
    if (byPath) findings.push({ path, rule: byPath });
    if (allow.has(path)) continue;
    const text = read(path);
    if (text === null) continue;
    for (const rule of checkContent(path, text)) findings.push({ path, rule });
  }
  return findings;
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

const split0 = (out) => out.split('\0').filter(Boolean);

function textOf(buf) {
  if (buf.length > MAX_BYTES || buf.includes(0)) return null;
  return buf.toString('utf8');
}

/**
 * Runs the gate in a repository. `mode`: 'tracked' (every tracked file, from the work tree: CI),
 * 'staged' (the index: the Git hook) or 'files' (the given paths from the work tree: the Claude
 * hook, before `git add`).
 */
export function run(cwd, { mode = 'tracked', files = [] } = {}) {
  let paths;
  let read;
  if (mode === 'staged') {
    paths = split0(git(cwd, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']));
    read = (p) =>
      textOf(execFileSync('git', ['show', `:${p}`], { cwd, maxBuffer: 64 * 1024 * 1024 }));
  } else {
    paths = mode === 'files' ? files : split0(git(cwd, ['ls-files', '-z']));
    read = (p) => {
      const full = join(cwd, p);
      return existsSync(full) ? textOf(readFileSync(full)) : null;
    };
  }
  const allowPath = join(cwd, ALLOW_FILE);
  const { paths: allow, errors } = existsSync(allowPath)
    ? parseAllow(readFileSync(allowPath, 'utf8'), (p) => existsSync(join(cwd, p)))
    : { paths: new Set(), errors: [] };
  return { findings: scan(paths, read, allow), errors };
}

/** The report lines: path and rule only. */
export function report({ findings, errors }) {
  return [...errors, ...findings.map((f) => `${f.path}: ${f.rule}`)];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv.includes('--staged') ? 'staged' : 'tracked';
  const result = run(process.cwd(), { mode });
  const lines = report(result);
  if (lines.length > 0) {
    process.stderr.write(
      `Gizli içerik kapısı durdurdu (Kaupholl v3.1; docs/OPS.md → Gizli içerik kapısı):\n${lines.map((l) => `  ${l}`).join('\n')}\n`,
    );
    process.exit(1);
  }
  process.stdout.write('Gizli içerik kapısı: temiz.\n');
}
