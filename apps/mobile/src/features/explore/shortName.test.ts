import { describe, expect, it } from 'vitest';

import { NAME_LIMIT, shortVenueName } from './shortName';

describe('shortVenueName', () => {
  it('keeps a university its full word and leaves out the campus', () => {
    expect(shortVenueName('Koç Üniversitesi Rumelifeneri')).toBe('Koç Üniversitesi');
  });

  it('cuts a name past the limit and ends it in an ellipsis', () => {
    const out = shortVenueName('İstanbul Gelişim Üniversitesi');
    expect(out).toBe('İstanbul Gelişim Ünive…');
    expect(Array.from(out).length).toBe(NAME_LIMIT + 1);
  });

  it('leaves a short name as it is', () => {
    expect(shortVenueName('Kahve Durağı')).toBe('Kahve Durağı');
  });

  it('drops the space before the ellipsis', () => {
    expect(shortVenueName('Abcdefghijklmnopqrstu vwxyz')).toBe('Abcdefghijklmnopqrstu…');
  });
});
