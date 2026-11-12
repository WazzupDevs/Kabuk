import { describe, expect, it } from 'vitest';

import { tr } from '../i18n/tr';

import { dayLine, dayPart } from './dayPart';

// The phone's own clock: 12 Kasım 2026 is a Thursday.
const local = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);

describe('dayLine', () => {
  it("reads the phone's weekday and part of the day", () => {
    expect(dayLine(local(12, 19))).toEqual({ weekday: 4, part: 'evening' });
    expect(dayLine(local(12, 9))).toEqual({ weekday: 4, part: 'morning' });
    expect(dayLine(local(12, 12))).toEqual({ weekday: 4, part: 'day' });
    expect(dayLine(local(12, 16, 59))).toEqual({ weekday: 4, part: 'day' });
    expect(dayLine(local(12, 17))).toEqual({ weekday: 4, part: 'evening' });
  });

  it('keeps the night before 05:00 as the evening before, Sunday back to Saturday', () => {
    expect(dayLine(local(12, 1))).toEqual({ weekday: 3, part: 'evening' });
    expect(dayLine(local(15, 4, 59))).toEqual({ weekday: 6, part: 'evening' });
    expect(dayLine(local(15, 5))).toEqual({ weekday: 0, part: 'morning' });
  });

  it('says it in Turkish', () => {
    expect(tr.explore.dayLine(4, 'evening')).toBe('Perşembe akşamı');
    expect(tr.explore.dayLine(0, 'morning')).toBe('Pazar sabahı');
    expect(tr.explore.dayLine(3, 'day')).toBe('Çarşamba öğleden sonrası');
  });
});

// Istanbul time is UTC+3.
const at = (hhmm: string) => Date.parse(`2026-10-30T${hhmm}:00+03:00`);

describe('dayPart', () => {
  it('is the morning from 05:00 to 12:00', () => {
    expect(dayPart(at('05:00'))).toBe('morning');
    expect(dayPart(at('10:20'))).toBe('morning');
    expect(dayPart(at('11:59'))).toBe('morning');
  });

  it('is the day from 12:00 to 17:00', () => {
    expect(dayPart(at('12:00'))).toBe('day');
    expect(dayPart(at('16:59'))).toBe('day');
  });

  it('is the evening from 17:00, through the night, to 05:00', () => {
    expect(dayPart(at('17:00'))).toBe('evening');
    expect(dayPart(at('23:30'))).toBe('evening');
    expect(dayPart(at('02:00'))).toBe('evening');
    expect(dayPart(at('04:59'))).toBe('evening');
  });
});
