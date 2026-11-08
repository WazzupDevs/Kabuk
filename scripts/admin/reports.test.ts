import { describe, expect, it } from 'vitest';

import { formatReport, parseReportCommand } from './reports.ts';

const ID = '0b5c3f0e-6a1d-4b7e-9a51-2f7f3c9d8e01';

describe('parseReportCommand', () => {
  it('reads list, list all and done <id>', () => {
    expect(parseReportCommand(['list'])).toEqual({ kind: 'list', all: false });
    expect(parseReportCommand(['list', 'all'])).toEqual({ kind: 'list', all: true });
    expect(parseReportCommand(['done', ID])).toEqual({ kind: 'done', reportId: ID });
  });

  it('refuses anything else', () => {
    for (const args of [[], ['done'], ['done', 'x'], ['list', 'open'], ['list', 'all', 'x']]) {
      expect(parseReportCommand(args), args.join(' ')).toBeNull();
    }
  });
});

describe('formatReport', () => {
  it('shows when, why, whom and the evidence, long snapshots cut', () => {
    const text = formatReport({
      id: ID,
      created_at: '2026-11-08T21:05:33.123Z',
      status: 'open',
      reason: 'harassment',
      target_type: 'message',
      reported_user_id: null,
      reporter_id: 'u-1',
      messages_snapshot: [{ body: 'x'.repeat(400) }],
      profile_snapshot: null,
      photo_copy: 'reports/a.jpg',
      cover_copy: null,
    });
    const lines = text.split('\n');
    expect(lines[0]).toBe(`${ID}  2026-11-08 21:05  open  message / harassment`);
    expect(lines[1]).toContain('reported user: (deleted)');
    expect(lines[2]?.endsWith('…')).toBe(true);
    expect(lines[2]?.length).toBeLessThan(200);
    expect(lines[3]).toBe('  kept files: reports/a.jpg');
  });
});
