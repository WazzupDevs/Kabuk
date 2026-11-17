import { describe, expect, it } from 'vitest';

import { tr } from './tr';

describe('seat suffixes (Sahtekar)', () => {
  it('follow how the seat number is read', () => {
    expect(tr.sahtekar.passTo('A1')).toBe("Telefonu A1'e ver");
    expect(tr.krot.voteFor(['Burak'])).toBe("Burak'a oy ver");
    expect(tr.krot.voteFor(['kapsul-fv10'])).toBe("kapsul-fv10'a oy ver");
    expect(tr.krot.voteFor(['Ece', 'Can'])).toBe("Ece ve Can'a oy ver");
    expect(tr.krot.pickSuspects(1)).toBe('1 şüpheli seç');
    expect(tr.krot.pickSuspects(2)).toBe('2 şüpheli seç');
    expect(tr.sahtekar.passTo('A2')).toBe("Telefonu A2'ye ver");
    expect(tr.sahtekar.passTo('B3')).toBe("Telefonu B3'e ver");
    expect(tr.sahtekar.turnOf('A3')).toBe("Sıra A3'te");
    expect(tr.sahtekar.turnOf('B2')).toBe("Sıra B2'de");
    expect(tr.sahtekar.ready('A2')).toBe("Ben A2'yim, kartımı göster");
    expect(tr.sahtekar.ready('A4')).toBe("Ben A4'üm, kartımı göster");
  });
});

// The birth date confirmation (K-55, K-63; KayitDogumOnay): the date asked, the month by name, the
// age said in the line under it.
describe('birth date confirmation', () => {
  it('asks the date and says the age', () => {
    expect(tr.signup.birthConfirmTitle({ year: 2001, month: 4, day: 5 })).toBe(
      '5 Nisan 2001 doğru mu?',
    );
    expect(tr.signup.birthConfirmTitle({ year: 1999, month: 12, day: 31 })).toBe(
      '31 Aralık 1999 doğru mu?',
    );
    expect(tr.signup.birthConfirmBody(25)).toBe(
      'Profilinde 25 yaşında görünürsün. Doğum tarihini sonra değiştiremezsin.',
    );
  });
});
