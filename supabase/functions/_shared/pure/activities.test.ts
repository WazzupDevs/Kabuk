import { describe, expect, it } from 'vitest';

import { groupHistory, historyDay, historyResult, historySessions } from './activities.ts';

// Local times: the groups follow the phone's calendar day, like Mesajlar's stamps.
const now = new Date(2026, 9, 19, 14, 30);
const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m).toISOString();

describe('historyDay', () => {
  it('is today from midnight on', () => {
    expect(historyDay(at(19, 0, 1), now)).toBe('today');
    expect(historyDay(at(19, 14, 0), now)).toBe('today');
  });

  it('is yesterday for the day before, whatever the hour', () => {
    expect(historyDay(at(18, 23, 59), now)).toBe('yesterday');
    expect(historyDay(at(18, 0, 0), now)).toBe('yesterday');
  });

  it('is this week within the last seven days, then earlier', () => {
    expect(historyDay(at(17, 12), now)).toBe('week');
    expect(historyDay(at(13, 12), now)).toBe('week');
    expect(historyDay(at(12, 12), now)).toBe('earlier');
    expect(historyDay(at(1, 12), now)).toBe('earlier');
  });

  it('counts a record from a clock ahead of the phone as today', () => {
    expect(historyDay(at(19, 16), now)).toBe('today');
  });
});

describe('groupHistory', () => {
  it('keeps the newest-first order and puts each day under one heading', () => {
    const rows = [
      { id: 'a', played_at: at(19, 13) },
      { id: 'b', played_at: at(19, 9) },
      { id: 'c', played_at: at(18, 22) },
      { id: 'd', played_at: at(15, 20) },
      { id: 'e', played_at: at(2, 20) },
    ];
    expect(groupHistory(rows, now).map((g) => [g.day, g.rows.map((r) => r.id).join('')])).toEqual([
      ['today', 'ab'],
      ['yesterday', 'c'],
      ['week', 'd'],
      ['earlier', 'e'],
    ]);
  });

  it('leaves out the days with nothing', () => {
    const rows = [{ id: 'a', played_at: at(16, 13) }];
    expect(groupHistory(rows, now).map((g) => g.day)).toEqual(['week']);
    expect(groupHistory([], now)).toEqual([]);
  });
});

describe('historyResult', () => {
  const results = [
    { room_id: 'r1', concept: 'tabu', won: false, completed_at: at(19, 13) },
    { room_id: 'r1', concept: 'tabu', won: true, completed_at: at(19, 12) },
    { room_id: 'r1', concept: 'ibre', won: true, completed_at: at(19, 13, 30) },
    { room_id: 'r2', concept: 'harf', won: null, completed_at: at(19, 11) },
  ];

  it("is the room's last result of the record's game", () => {
    expect(historyResult({ room_id: 'r1', concept: 'tabu' }, results)).toBe('lost');
    expect(historyResult({ room_id: 'r1', concept: 'ibre' }, results)).toBe('won');
  });

  it('says nothing for a game without a winner, another room or no room', () => {
    expect(historyResult({ room_id: 'r2', concept: 'harf' }, results)).toBeNull();
    expect(historyResult({ room_id: 'r3', concept: 'tabu' }, results)).toBeNull();
    expect(historyResult({ room_id: null, concept: 'tabu' }, results)).toBeNull();
  });

  it('is "done" for Sohbet kartları, which has no winner, and nothing for a chat', () => {
    expect(historyResult({ room_id: 'r1', concept: 'sohbet' }, results)).toBe('done');
    expect(historyResult({ room_id: 'r1', concept: 'chat' }, results)).toBeNull();
  });
});

describe('historySessions', () => {
  const rec = (id: string, room: string | null, concept = 'vampir') => ({
    id,
    room_id: room,
    concept,
  });

  it('makes one row of a table and game, its people in order', () => {
    const rows = [rec('a', 'r1'), rec('b', 'r1'), rec('c', 'r2'), rec('d', 'r1')];
    const sessions = historySessions(rows);
    expect(sessions.map((s) => s.people.map((p) => p.id))).toEqual([['a', 'b', 'd'], ['c']]);
    expect(sessions[0]?.first.id).toBe('a');
  });

  it('keeps two games of the same table apart, and records without a table alone', () => {
    const rows = [rec('a', 'r1', 'vampir'), rec('b', 'r1', 'chat'), rec('c', null), rec('d', null)];
    expect(historySessions(rows).map((s) => s.people.map((p) => p.id))).toEqual([
      ['a'],
      ['b'],
      ['c'],
      ['d'],
    ]);
  });
});
