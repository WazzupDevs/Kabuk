// PreToolUse hook on Bash: stops the commands CLAUDE.md → "Ortamlar ve asla" forbids before they
// run. Reads the hook's JSON on stdin; exit 2 with the reason on stderr blocks the command (the
// reason goes back to the session). Tested in scripts/claude-hooks.test.ts.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RULES = [
  {
    test: (c) => /\bsupabase\b[^;&|\n]*\bconfig\s+push\b/.test(c),
    why: '`supabase config push` asla çalıştırılmaz (CLAUDE.md → Ortamlar ve asla).',
  },
  {
    test: (c) =>
      /\bsecrets\.sql\b/.test(c) &&
      /(--linked|--db-url|supabase\.co|pooler\.supabase\.com|\bpsql\b)/.test(c),
    why: '`supabase/local/secrets.sql` yalnızca yerel DB içindir (pnpm db:reset).',
  },
  {
    test: (c) => /\bgit\s+push\b/.test(c) && /(^|[\s:+])(refs\/heads\/)?main(\s|$|;|&)/.test(c),
    why: "main'e doğrudan push yok; her değişiklik PR'la girer (CLAUDE.md → Çalışma şekli).",
  },
  {
    test: (c) => /\beas\s+update\b/.test(c) && /--(channel|branch)[\s=]+['"]?production\b/.test(c),
    why: 'Üretim kanalına OTA yalnızca proje sahibinindir.',
  },
  {
    test: (c) => /\beas\s+submit\b/.test(c),
    why: 'Mağazaya gönderim yalnızca proje sahibinindir.',
  },
];

/** The reason a command must not run, or null. `dirty`: the working tree has uncommitted work. */
export function blockReason(command, { dirty = false } = {}) {
  for (const rule of RULES) if (rule.test(command)) return rule.why;
  if (dirty && /\bgit\s+(reset\s+--hard|checkout\s+--\s+\.|clean\s+-[a-z]*f)/.test(command)) {
    return 'Commit edilmemiş değişiklik var; önce commit ya da stash (CLAUDE.md → Oturum ve dal düzeni).';
  }
  return null;
}

// The git subcommand of a word list: the first word after `git` that is not a global option
// (`-C <dir>` and `-c <key=value>` take a value).
function subcommandAt(words) {
  if (words[0] !== 'git') return -1;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === '-C' || words[i] === '-c') i++;
    else if (!words[i].startsWith('-')) return i;
  }
  return -1;
}

// `git add` / `git commit` segments of a command, as the words after the subcommand.
function gitSegments(command, verb) {
  return command
    .split(/&&|\|\||;|\||\n/)
    .map((s) => s.trim().replace(/['"]/g, '').split(/\s+/))
    .map((w) => ({ w, at: subcommandAt(w) }))
    .filter(({ w, at }) => at > 0 && w[at] === verb)
    .map(({ w, at }) => w.slice(at + 1));
}

const ALL = new Set(['.', '-A', '--all', '-u', '--update', ':/', '*']);

/**
 * The files a command would put into a commit, for the secret gate (scripts/secret-guard.mjs):
 * what `git add` picks up (every changed or new file for `.` / `-A`, else its pathspecs), and
 * what `git commit` takes (the index, and every changed tracked file with `-a`).
 */
export function commitCandidates(command, git) {
  const files = new Set();
  const add = (out) => out.split('\0').forEach((f) => f && files.add(f));
  for (const args of gitSegments(command, 'add')) {
    const specs = args.filter((a) => !a.startsWith('-') || ALL.has(a));
    if (specs.length === 0 || specs.some((a) => ALL.has(a))) {
      add(git(['ls-files', '-z', '-m', '-o', '--exclude-standard']));
    } else {
      add(git(['ls-files', '-z', '-m', '-o', '--exclude-standard', '--', ...specs]));
    }
  }
  for (const args of gitSegments(command, 'commit')) {
    add(git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']));
    // `-a`, `--all`, or a short-flag cluster with `a` (`-am`); a value after `-m` is a message.
    const flags = args.filter((w, i) => args[i - 1] !== '-m' && args[i - 1] !== '-F');
    if (flags.some((w) => w === '-a' || w === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(w))) {
      add(git(['ls-files', '-z', '-m']));
    }
  }
  return [...files];
}

/** Why the secret gate stops this command, or null (CLAUDE.md → Kaupholl gizli içerik kapısı). */
export async function secretReason(command, cwd) {
  if (!/\bgit\b/.test(command) || !/\b(add|commit)\b/.test(command)) return null;
  const { run, report } = await import('../../scripts/secret-guard.mjs');
  const git = (args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
  let files;
  try {
    files = commitCandidates(command, git);
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  const lines = report(run(cwd, { mode: 'files', files }));
  return lines.length === 0
    ? null
    : `gizli içerik kapısı (scripts/secret-guard.mjs): ${lines.join('; ')}`;
}

function isDirty(cwd) {
  try {
    return execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' }).trim() !== '';
  } catch {
    return false;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    process.exit(0);
  }
  const command = input?.tool_input?.command;
  if (typeof command !== 'string') process.exit(0);
  const cwd = input.cwd || process.cwd();
  const reason =
    blockReason(command, { dirty: isDirty(cwd) }) ?? (await secretReason(command, cwd));
  if (reason) {
    process.stderr.write(`Durduruldu: ${reason}\n`);
    process.exit(2);
  }
}
