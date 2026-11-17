import { describe, expect, it } from 'vitest';

import { formatReport, formatReportInFull, parseReportCommand } from './reports.ts';

const ID = '0b5c3f0e-6a1d-4b7e-9a51-2f7f3c9d8e01';

describe('parseReportCommand', () => {
  it('reads list, list all and done <id>', () => {
    expect(parseReportCommand(['list'])).toEqual({ kind: 'list', all: false });
    expect(parseReportCommand(['list', 'all'])).toEqual({ kind: 'list', all: true });
    expect(parseReportCommand(['done', ID])).toEqual({ kind: 'done', reportId: ID });
    expect(parseReportCommand(['show', ID])).toEqual({ kind: 'show', reportId: ID });
  });

  it('refuses anything else', () => {
    for (const args of [
      [],
      ['done'],
      ['done', 'x'],
      ['show'],
      ['show', 'x'],
      ['list', 'open'],
      ['list', 'all', 'x'],
    ]) {
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

describe('formatReportInFull', () => {
  it('prints every message and its earlier texts, nothing cut', () => {
    const long = 'y'.repeat(400);
    const messages = [
      {
        from: 'reported',
        body: long,
        edited: true,
        versions: [
          { version: 1, body: 'ilk', saved_at: '2026-11-08T21:00:00Z' },
          { version: 2, body: 'ikinci', saved_at: '2026-11-08T21:01:00Z' },
        ],
      },
    ];
    const text = formatReportInFull({
      id: ID,
      created_at: '2026-11-08T21:05:33.123Z',
      status: 'open',
      reason: 'harassment',
      target_type: 'dm',
      reported_user_id: 'u-2',
      reporter_id: 'u-1',
      messages_snapshot: messages,
      profile_snapshot: null,
      photo_copy: null,
      cover_copy: null,
    });
    expect(text).toContain(long);
    expect(text).toContain('"ilk"');
    expect(text).toContain('"ikinci"');
    expect(text).not.toContain('…');
    expect(text.split('\n')[0]).toBe(`${ID}  2026-11-08 21:05  open  dm / harassment`);
  });
});
