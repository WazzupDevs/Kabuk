// The secret gate (Kaupholl v3.1 → "Gizli içerik kapısı"): stops the real Kaupholl questions and
// answers, their verification files, and access keys from entering this public repository.
//
// One check, three places: the Claude hook (.claude/hooks/guard.mjs, before `git add` / `git
// commit`), the Git hook (.githooks/pre-commit, staged files) and CI (`pnpm guard:secrets` in the
// `checks` job, every tracked file). The local hooks can be skipped; CI is the gate, and it holds
// because the `main` ruleset requires the `ci` check.
//
// Nothing passes unread. A file the gate cannot scan (too large, unreadable, a submodule, a
// binary whose bytes are not the format its extension names) is a finding, never a clean file.
// Only a short list of binary formats is read as binary; everything else is text, NUL bytes or not.
//
// Findings name the file and the rule, never the matched value: a key must not reach a CI log.
// Plain JavaScript so the hooks run it with bare `node`. Tested in scripts/secret-guard.test.ts.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAMPLE_DECK = 'content/kaupholl-questions.sample.json';
export const ALLOW_FILE = 'scripts/secret-guard.allow';
const SAMPLE_MAX = 20;
const SAMPLE_PREFIX = 'Örnek soru';
/** Text is read whole up to this size; a larger text file fails the gate. */
export const MAX_TEXT_BYTES = 20 * 1024 * 1024;
/** A known binary format is read up to this size; a larger one fails the gate. */
export const MAX_BINARY_BYTES = 50 * 1024 * 1024;

// The binary formats the repository holds (images, the font, the motion film), each with the
// bytes it must start with. A file with one of these extensions and other bytes fails the gate
// (`binary-mismatch`): a text file cannot hide behind `.png`. Binary bytes are still searched
// for access keys (as Latin-1), since metadata chunks can carry text.
const at = (offset, ascii) => (b) =>
  b.length >= offset + ascii.length &&
  b.subarray(offset, offset + ascii.length).toString('latin1') === ascii;
const bytes =
  (...xs) =>
  (b) =>
    b.length >= xs.length && xs.every((x, i) => b[i] === x);
export const BINARY_FORMATS = {
  png: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
  jpg: bytes(0xff, 0xd8, 0xff),
  jpeg: bytes(0xff, 0xd8, 0xff),
  webp: (b) => at(0, 'RIFF')(b) && at(8, 'WEBP')(b),
  gif: (b) => at(0, 'GIF87a')(b) || at(0, 'GIF89a')(b),
  ttf: (b) => bytes(0x00, 0x01, 0x00, 0x00)(b) || at(0, 'true')(b),
  otf: at(0, 'OTTO'),
  woff: at(0, 'wOFF'),
  woff2: at(0, 'wOF2'),
  mp4: at(4, 'ftyp'),
};

// Paths that never belong here, whatever they hold. Never exemptable.
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

// Findings that say the gate could not do its job. Never exemptable.
const UNSCANNABLE = new Set([
  'unscannable-too-large',
  'unscannable-read-error',
  'unscannable-submodule',
  'binary-mismatch',
]);

// A value placed after a key name: not a placeholder, a variable or a CI expression.
const VALUE = String.raw`\s*[=:]\s*['"]?(?![$<{])([A-Za-z0-9._\-+/=]{20,})`;

const TOKEN_RULES = [
  { rule: 'supabase-secret-key', re: /\bsb_secret_[A-Za-z0-9_-]{10,}/g },
  { rule: 'private-key', re: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/g },
  { rule: 'github-token', re: /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{36}\b/g },
  { rule: 'github-token', re: /\bgithub_pat_[A-Za-z0-9_]{22,}/g },
  { rule: 'sentry-token', re: /\bsntrys_[A-Za-z0-9+/=_-]{20,}/g },
  { rule: 'posthog-personal-key', re: /\bphx_[A-Za-z0-9]{20,}/g },
  {
    rule: 'service-role-env',
    re: new RegExp(String.raw`\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)${VALUE}`, 'g'),
  },
  { rule: 'expo-token', re: new RegExp(String.raw`\bEXPO_TOKEN${VALUE}`, 'g') },
];

const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g;

function basename(p) {
  return p.slice(p.lastIndexOf('/') + 1);
}

function extension(p) {
  const name = basename(p);
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
}

/**
 * A short, one-way fingerprint of a matched value (or of a whole file for the deck rules): what
 * an allow-list line names. 16 hex characters of SHA-256; the value itself is never stored.
 */
export function fingerprint(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

/** The path rule a file breaks, or null. Paths are repository-relative, with `/`. */
export function checkPath(path) {
  for (const { rule, test } of PATH_RULES) if (test(path)) return rule;
  return null;
}

// Every service-role JWT, except Supabase's public local demo key (`iss: supabase-demo`).
function serviceRoleJwts(text) {
  const found = [];
  for (const m of text.matchAll(JWT)) {
    try {
      const claims = JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8'));
      if (claims?.role === 'service_role' && claims?.iss !== 'supabase-demo') found.push(m[0]);
    } catch {
      // not a JWT after all
    }
  }
  return found;
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
  if (/\.ya?ml$/.test(path)) {
    return /^\s*-?\s*answer(_scaled)?\s*:/m.test(text) && /^\s*source\s*:/m.test(text);
  }
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

// Access keys in a text, each with its fingerprint. Several matches of one rule are separate
// findings, so an allowed fake key does not cover a real one beside it.
function keyHits(text) {
  const hits = [];
  for (const { rule, re } of TOKEN_RULES) {
    for (const m of text.matchAll(re)) hits.push({ rule, fp: fingerprint(m[0]) });
  }
  for (const token of serviceRoleJwts(text)) {
    hits.push({ rule: 'service-role-jwt', fp: fingerprint(token) });
  }
  return hits;
}

/** The content findings of a text file: `{ rule, fp }`, where `fp` is what an allow line names. */
export function contentHits(path, text) {
  const hits = [];
  if (path === SAMPLE_DECK) {
    const bad = checkSample(text);
    if (bad) hits.push({ rule: bad, fp: fingerprint(text) });
  } else if (/\.(json|ya?ml|csv)$/.test(path) && looksLikeDeck(path, text)) {
    hits.push({ rule: 'deck-shape', fp: fingerprint(text) });
  }
  hits.push(...keyHits(text));
  // UTF-16 and other NUL-padded text: search again with the NUL bytes taken out.
  if (text.includes('\0')) {
    const seen = new Set(hits.map((h) => `${h.rule} ${h.fp}`));
    for (const h of keyHits(text.replace(/\0/g, ''))) {
      if (!seen.has(`${h.rule} ${h.fp}`)) hits.push(h);
    }
  }
  return hits;
}

/** The rule names a text breaks (for tests and callers that need no fingerprints). */
export function checkContent(path, text) {
  return [...new Set(contentHits(path, text).map((h) => h.rule))];
}

/**
 * The findings for one file's bytes. A known binary format must carry its format's bytes and is
 * searched for keys only; everything else is text and gets every content rule.
 */
export function bufferHits(path, buf) {
  const ext = extension(path);
  const format = BINARY_FORMATS[ext];
  if (format) {
    if (buf.length > MAX_BINARY_BYTES) return [{ rule: 'unscannable-too-large' }];
    if (!format(buf)) return [{ rule: 'binary-mismatch' }];
    return keyHits(buf.toString('latin1'));
  }
  if (buf.length > MAX_TEXT_BYTES) return [{ rule: 'unscannable-too-large' }];
  return contentHits(path, buf.toString('utf8'));
}

/**
 * The allow list: `path rule fingerprint # reason` per line. It exempts exactly one matched value
 * (or, for the deck rules, one exact file content) of one content rule in one file; a new key in
 * the same file, or any change to an allowed fake deck, is a finding again. Path rules and the
 * unscannable findings are never exempt. Returns the entries and the list's own errors.
 */
export function parseAllow(text, exists) {
  const entries = new Set();
  const errors = [];
  for (const [i, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const hash = line.indexOf('#');
    const fields = (hash < 0 ? line : line.slice(0, hash)).trim().split(/\s+/);
    const reason = hash < 0 ? '' : line.slice(hash + 1).trim();
    const where = `${ALLOW_FILE}:${i + 1}`;
    const [path, rule, fp] = fields;
    if (fields.length !== 3) errors.push(`${where}: "yol kural parmakizi # gerekçe" bekleniyor`);
    else if (reason === '') errors.push(`${where}: gerekçe yok`);
    else if (PATH_RULES.some((r) => r.rule === rule) || UNSCANNABLE.has(rule)) {
      errors.push(`${where}: ${rule} istisna olamaz`);
    } else if (!/^[0-9a-f]{16}$/.test(fp)) errors.push(`${where}: parmakizi 16 onaltılık karakter`);
    else if (!exists(path)) errors.push(`${where}: ${path} yok`);
    else entries.add(`${path} ${rule} ${fp}`);
  }
  return { entries, errors };
}

/**
 * Every finding for these files. `read(path)` gives the file's bytes (a Buffer), or a finding
 * rule string when the file cannot be read. `allow` holds `path rule fingerprint` entries.
 * Returns the findings and the allow entries that were used.
 */
export function scan(paths, read, allow = new Set()) {
  const findings = [];
  const used = new Set();
  for (const path of paths) {
    const byPath = checkPath(path);
    if (byPath) findings.push({ path, rule: byPath });
    const got = read(path);
    if (got === undefined) continue; // deleted in the work tree: nothing to add
    const hits = typeof got === 'string' ? [{ rule: got }] : bufferHits(path, got);
    for (const hit of hits) {
      const key = `${path} ${hit.rule} ${hit.fp}`;
      if (hit.fp && allow.has(key)) used.add(key);
      else findings.push({ path, rule: hit.rule, fp: hit.fp });
    }
  }
  return { findings, used };
}

function git(cwd, args, encoding = 'utf8') {
  return execFileSync('git', args, { cwd, encoding, maxBuffer: 256 * 1024 * 1024 });
}

const split0 = (out) => out.split('\0').filter(Boolean);

// Tracked entries with their modes: `160000` is a submodule, whose content the gate cannot see.
function lsFiles(cwd, extra = []) {
  const entries = new Map();
  for (const line of split0(git(cwd, ['ls-files', '-s', '-z', ...extra]))) {
    const tab = line.indexOf('\t');
    entries.set(line.slice(tab + 1), line.split(' ')[0]);
  }
  return entries;
}

function readWorkTree(cwd, modes, deleted) {
  return (p) => {
    if (modes.get(p) === '160000') return 'unscannable-submodule';
    if (deleted.has(p)) return undefined;
    const full = join(cwd, p);
    try {
      const st = lstatSync(full);
      if (st.isSymbolicLink()) return Buffer.from(readlinkSync(full), 'utf8');
      if (!st.isFile()) return 'unscannable-read-error';
      return readFileSync(full);
    } catch (e) {
      return e?.code === 'ENOENT' ? undefined : 'unscannable-read-error';
    }
  };
}

/**
 * Runs the gate in a repository. `mode`: 'tracked' (every tracked file, from the work tree: CI),
 * 'staged' (the index: the Git hook) or 'files' (the given paths from the work tree: the Claude
 * hook, before `git add`). In 'tracked' mode an allow-list entry that no longer matches anything
 * is an error, so the list cannot hold stale exemptions.
 */
export function run(cwd, { mode = 'tracked', files = [] } = {}) {
  let paths;
  let read;
  if (mode === 'staged') {
    const modes = lsFiles(cwd);
    paths = split0(git(cwd, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']));
    read = (p) => {
      if (modes.get(p) === '160000') return 'unscannable-submodule';
      try {
        return git(cwd, ['show', `:${p}`], 'buffer');
      } catch {
        return 'unscannable-read-error';
      }
    };
  } else {
    const modes = lsFiles(cwd);
    const deleted = new Set(split0(git(cwd, ['ls-files', '-d', '-z'])));
    paths = mode === 'files' ? files : [...modes.keys()];
    read = readWorkTree(cwd, modes, deleted);
  }
  let allowText = '';
  try {
    allowText = readFileSync(join(cwd, ALLOW_FILE), 'utf8');
  } catch {
    // no allow list
  }
  const exists = (p) => {
    try {
      return lstatSync(join(cwd, p)).isFile();
    } catch {
      return false;
    }
  };
  const { entries, errors } = parseAllow(allowText, exists);
  const { findings, used } = scan(paths, read, entries);
  if (mode === 'tracked') {
    for (const entry of entries) {
      if (!used.has(entry))
        errors.push(
          `${ALLOW_FILE}: kullanılmayan istisna (${entry.split(' ').slice(0, 2).join(' ')})`,
        );
    }
  }
  return { findings, errors };
}

/**
 * The report lines: path, rule and how many times, never a value. `withFingerprints` adds the
 * fingerprints, for writing an allow line on a developer machine (`--fingerprints`); CI never
 * passes it.
 */
export function report({ findings, errors }, { withFingerprints = false } = {}) {
  const counts = new Map();
  for (const f of findings) {
    const key = withFingerprints && f.fp ? `${f.path}: ${f.rule} ${f.fp}` : `${f.path}: ${f.rule}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...errors, ...[...counts].map(([k, n]) => (n > 1 ? `${k} (×${n})` : k))];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv.includes('--staged') ? 'staged' : 'tracked';
  const withFingerprints = process.argv.includes('--fingerprints');
  const result = run(process.cwd(), { mode });
  const lines = report(result, { withFingerprints });
  if (lines.length > 0) {
    process.stderr.write(
      `Gizli içerik kapısı durdurdu (docs/OPS.md → Gizli içerik kapısı):\n${lines.map((l) => `  ${l}`).join('\n')}\n`,
    );
    process.exit(1);
  }
  process.stdout.write('Gizli içerik kapısı: temiz.\n');
}
