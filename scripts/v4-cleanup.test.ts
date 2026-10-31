import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// Step 4.8 (docs/SPEC_V4.md §4.H "4.8 temizliği"): the old table model goes in two PRs, as 23.4
// did (reveal-removed.test.ts). 4.8a takes every reader out of the app, the Edge Functions, the
// scripts and the integration tests; 4.8b's migration (…_v4_cleanup.sql) then drops the tables,
// the columns and the SQL functions. This shows the first half before the migration and keeps the
// names from coming back: nothing outside the generated types (database.ts) and the migrations
// names them.
//
// Not here yet: what 4.8b changes together with SQL (venue_chat_profiled and the venue chat's
// `profiled` field, kept for apps before 0.9.3; rooms_end's decision_seconds; start_table_session's
// key) and each game's own side rules, which go with that game's per-person step (4.6.x).
const root = resolve(import.meta.dirname, '..');
const SOURCES = [
  'apps/mobile/app',
  'apps/mobile/src',
  'supabase/functions',
  'supabase/tests',
  'scripts',
  'e2e',
];
const SKIP_DIRS = new Set(['node_modules', 'android', 'ios', '.expo', 'dist']);
const SKIP_FILES = new Set([
  'supabase/functions/_shared/pure/database.ts',
  // This file names what it looks for.
  'scripts/v4-cleanup.test.ts',
  // Says the old propose-game action answers update_required; becomes "function gone" in 4.8b.
  'supabase/tests/rooms.test.ts',
]);

// The game proposals, the side model, the old lobby reads, the headcount at check-in and the
// owner/guest copies on rooms.
const NAMES = [
  'game_proposals',
  'rooms_propose_game',
  'rooms_answer_game',
  'side_headcount',
  'max_side_phones',
  'was_on_side',
  'MAX_SIDE_PHONES',
  'sideHeadcount',
  'roomSeat',
  'venue_lobby',
  'venue_lobby_phones',
  'venue_lobby_tags',
  'venue_running_rooms',
  'alias_rerolls',
  'team_capable',
  'owner_headcount',
  'owner_phones',
  'owner_profiled',
  'owner_alias',
  'guest_session_id',
  'guest_headcount',
  'guest_phones',
  'guest_profiled',
  'guest_alias',
];

function sourceFiles(dir: string): string[] {
  return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : sourceFiles(path);
    return /\.(ts|tsx|js|sql|ya?ml)$/.test(entry.name) && !SKIP_FILES.has(path) ? [path] : [];
  });
}

describe('the old table model has no reader left (step 4.8a)', () => {
  const files = SOURCES.flatMap(sourceFiles);

  it('looks at the app, the Edge Functions, the tests and the scripts', () => {
    expect(files).toContain('apps/mobile/src/lib/api.ts');
    expect(files).toContain('supabase/functions/rooms/index.ts');
    expect(files).toContain('supabase/tests/tableModel.test.ts');
    expect(files).toContain('scripts/e2e/bot-table.ts');
  });

  it('names none of its tables, columns or functions outside the generated types', () => {
    const found = files.flatMap((file) => {
      const text = readFileSync(resolve(root, file), 'utf8');
      return NAMES.filter((name) => new RegExp(`\\b${name}\\b`).test(text)).map(
        (name) => `${relative('.', file)}: ${name}`,
      );
    });
    expect(found).toEqual([]);
  });

  it('has no side in a join request and no headcount in a check-in schema', () => {
    const rooms = readFileSync(resolve(root, 'supabase/functions/rooms/index.ts'), 'utf8');
    const checkin = readFileSync(resolve(root, 'supabase/functions/checkin/index.ts'), 'utf8');
    expect(rooms).not.toMatch(/\bside:\s*z\./);
    expect(checkin).not.toMatch(/\b(headcount|teams):\s*z\./);
  });

  it('loads no Poppins or Manrope package (Plus Jakarta Sans and Roboto only, §4.C)', () => {
    const app = readFileSync(resolve(root, 'apps/mobile/package.json'), 'utf8');
    expect(app).not.toMatch(/@expo-google-fonts\/(poppins|manrope)/);
  });
});
