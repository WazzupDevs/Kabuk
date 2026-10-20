import { describe, expect, it } from 'vitest';

import { tr } from './tr';

describe('seat suffixes (Sahtekar)', () => {
  it('follow how the seat number is read', () => {
    expect(tr.sahtekar.passTo('A1')).toBe("Telefonu A1'e ver");
    expect(tr.sahtekar.passTo('A2')).toBe("Telefonu A2'ye ver");
    expect(tr.sahtekar.passTo('B3')).toBe("Telefonu B3'e ver");
    expect(tr.sahtekar.turnOf('A3')).toBe("Sıra A3'te");
    expect(tr.sahtekar.turnOf('B2')).toBe("Sıra B2'de");
    expect(tr.sahtekar.ready('A2')).toBe("Ben A2'yim, kartımı göster");
    expect(tr.sahtekar.ready('A4')).toBe("Ben A4'üm, kartımı göster");
  });
});

// The birth date confirmation (K-55, K-63): v46's words, the month by name.
describe('birth date confirmation', () => {
  it('says the age and the date as v46 does', () => {
    expect(tr.signup.birthConfirmTitle(25)).toBe('25 yaşındasın');
    expect(tr.signup.birthConfirmBody({ year: 2001, month: 4, day: 5 })).toBe(
      'Doğum tarihin 5 Nisan 2001. Sonra değiştiremezsin.',
    );
    expect(tr.signup.birthConfirmBody({ year: 1999, month: 12, day: 31 })).toBe(
      'Doğum tarihin 31 Aralık 1999. Sonra değiştiremezsin.',
    );
  });
});
