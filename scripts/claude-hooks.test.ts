import { describe, expect, it } from 'vitest';

import { blockReason } from '../.claude/hooks/guard.mjs';

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
