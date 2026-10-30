import { describe, expect, it } from 'vitest';

import { dayPart } from './dayPart';

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
