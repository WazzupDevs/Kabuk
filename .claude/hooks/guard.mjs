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
  const reason = blockReason(command, { dirty: isDirty(input.cwd || process.cwd()) });
  if (reason) {
    process.stderr.write(`Durduruldu: ${reason}\n`);
    process.exit(2);
  }
}
