import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  cleanText,
  cutoff,
  dayKey,
  ipBucket,
  isDeviceId,
  normalizeEmail,
  normalizeTrPhone,
  parseSchoolApplication,
  parseVenueApplication,
  parseVote,
  schoolKey,
  venueMail,
} from './forms.ts';

const DEVICE = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';

describe('schoolKey', () => {
  it('joins spellings of one school', () => {
    expect(schoolKey('İstanbul Teknik Üniversitesi')).toBe(
      schoolKey('istanbul  teknik üniversitesi.'),
    );
    expect(schoolKey('ISPARTA')).toBe(schoolKey('isparta'));
    expect(schoolKey('Işık Üniversitesi')).toBe('işik üniversitesi');
    expect(schoolKey('TOBB Ekonomi ve Teknoloji Üniversitesi')).toBe(
      'tobb ekonomi ve teknoloji üniversitesi',
    );
  });

  it('matches the seeded lists (d1/0002_okullar.sql, 0003_tum_universiteler.sql)', () => {
    const keys = new Set<string>();
    for (const file of ['0002_okullar.sql', '0003_tum_universiteler.sql']) {
      const sql = readFileSync(resolve(import.meta.dirname, 'd1', file), 'utf8');
      const rows = [...sql.matchAll(/\('((?:[^']|'')+)', '((?:[^']|'')+)', 'approved'/g)];
      expect(rows.length).toBeGreaterThan(40);
      for (const [, name, key] of rows) {
        expect(key).toBe(schoolKey(String(name).replaceAll("''", "'")));
        // One school, one row, across the files.
        expect(keys.has(String(key))).toBe(false);
        keys.add(String(key));
      }
    }
    // Every state and foundation university on YÖK's list but the two where skall already is.
    expect(keys.size).toBe(200);
    expect(keys.has(schoolKey('Sakarya Üniversitesi'))).toBe(false);
    expect(keys.has(schoolKey('İstanbul Gelişim Üniversitesi'))).toBe(false);
  });
});

describe('cleanText', () => {
  it('collapses spaces and drops control characters', () => {
    expect(cleanText('  Kafe\n\tLale  ', 20)).toBe('Kafe Lale');
    expect(cleanText('   ', 20)).toBeNull();
    expect(cleanText('x'.repeat(21), 20)).toBeNull();
    expect(cleanText(5, 20)).toBeNull();
  });
});

describe('normalizeTrPhone', () => {
  it.each([
    ['0532 123 45 67', '+905321234567'],
    ['+90 (532) 123-45-67', '+905321234567'],
    ['905321234567', '+905321234567'],
    ['5321234567', '+905321234567'],
    ['0216 555 11 22', '+902165551122'],
  ])('%s', (input, expected) => {
    expect(normalizeTrPhone(input)).toBe(expected);
  });

  it.each(['123', '0632 123 45 67', '+44 20 7946 0958', '0532abc4567', ''])(
    'rejects %s',
    (input) => {
      expect(normalizeTrPhone(input)).toBeNull();
    },
  );
});

describe('normalizeEmail', () => {
  it('lowers and checks the shape', () => {
    expect(normalizeEmail(' Kafe@Ornek.COM ')).toBe('kafe@ornek.com');
    expect(normalizeEmail('kafe@ornek')).toBeNull();
    expect(normalizeEmail('a b@ornek.com')).toBeNull();
    expect(normalizeEmail('@ornek.com')).toBeNull();
  });
});

describe('parseVote', () => {
  it('takes a school, a device and a token', () => {
    expect(parseVote({ schoolId: 3, device: DEVICE, token: 't' })).toEqual({
      ok: true,
      value: { schoolId: 3, device: DEVICE, token: 't' },
    });
  });

  it('refuses the rest', () => {
    expect(parseVote({ schoolId: '3', device: DEVICE, token: 't' }).ok).toBe(false);
    expect(parseVote({ schoolId: 3, device: 'x', token: 't' }).ok).toBe(false);
    expect(parseVote({ schoolId: 3, device: DEVICE })).toMatchObject({
      ok: false,
      code: 'verification_failed',
    });
    expect(parseVote(null).ok).toBe(false);
    expect(isDeviceId(DEVICE)).toBe(true);
  });
});

describe('parseSchoolApplication', () => {
  it('wants a name and the 18+ box', () => {
    expect(
      parseSchoolApplication({
        name: ' Ege  Üniversitesi ',
        adult: true,
        device: DEVICE,
        token: 't',
      }),
    ).toEqual({
      ok: true,
      value: { name: 'Ege Üniversitesi', key: 'ege üniversitesi', device: DEVICE, token: 't' },
    });
    expect(
      parseSchoolApplication({ name: 'Ege', adult: false, device: DEVICE, token: 't' }),
    ).toMatchObject({
      code: 'adult_required',
    });
    expect(
      parseSchoolApplication({ name: '..', adult: true, device: DEVICE, token: 't' }),
    ).toMatchObject({
      code: 'bad_name',
    });
  });
});

describe('parseVenueApplication', () => {
  const good = {
    venueName: 'Kafe Lale',
    district: 'Kadıköy',
    contactName: 'Ayşe Yılmaz',
    phone: '0532 123 45 67',
    email: 'ayse@ornek.com',
    noticeRead: true,
    token: 't',
  };

  it('normalizes a good application', () => {
    expect(parseVenueApplication(good)).toEqual({
      ok: true,
      value: {
        venueName: 'Kafe Lale',
        district: 'Kadıköy',
        contactName: 'Ayşe Yılmaz',
        phone: '+905321234567',
        email: 'ayse@ornek.com',
        token: 't',
      },
    });
  });

  it('names every wrong field', () => {
    const result = parseVenueApplication({
      ...good,
      venueName: '',
      phone: '12',
      noticeRead: false,
    });
    expect(result).toMatchObject({
      ok: false,
      code: 'bad_fields',
      fields: ['venueName', 'phone', 'notice'],
    });
  });

  it('wants the token after the fields', () => {
    expect(parseVenueApplication({ ...good, token: '' })).toMatchObject({
      code: 'verification_failed',
    });
  });
});

describe('venueMail', () => {
  it('names the venue and the row, no person', () => {
    const mail = venueMail(
      { id: 7, venueName: 'Kafe Lale', district: 'Kadıköy' },
      new Date('2026-11-28T10:00:00Z'),
    );
    expect(mail.subject).toBe('Pilot mekan başvurusu: Kafe Lale');
    expect(mail.text).toContain('İlçe: Kadıköy');
    expect(mail.text).toContain('where id = 7;');
    expect(mail.text).toContain('Zaman: 2026-11-28T10:00:00.000Z');
    expect(mail.text).not.toMatch(/Telefon|E-posta|Yetkili:/);
  });
});

describe('ipBucket', () => {
  it('keeps IPv4 and takes the /64 of IPv6', () => {
    expect(ipBucket('203.0.113.7')).toBe('203.0.113.7');
    expect(ipBucket('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:1:2::/64');
    expect(ipBucket('2001:0DB8:0001:0002::1')).toBe('2001:db8:1:2::/64');
    expect(ipBucket('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(ipBucket('::1')).toBe('0:0:0:0::/64');
  });
});

describe('dates', () => {
  it('days and cut-offs are UTC', () => {
    expect(dayKey(new Date('2026-11-28T23:30:00Z'))).toBe('2026-11-28');
    expect(cutoff(new Date('2026-11-28T00:00:00Z'), 2)).toBe('2026-11-26T00:00:00.000Z');
  });
});
