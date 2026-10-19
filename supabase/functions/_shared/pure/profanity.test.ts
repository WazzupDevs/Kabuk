import { describe, expect, it } from 'vitest';

import { containsContact, containsProfanity, prepareTerms } from './profanity.ts';

const terms = prepareTerms(
  ['orospu', 'siktir', 'sik', 'göt', 'amk', 'piç kurusu', 'şerefsiz', 'serefsiz'],
  ['ananı'],
);

describe('containsProfanity', () => {
  it('finds listed words regardless of case, Turkish letters and punctuation', () => {
    expect(containsProfanity('OROSPU', terms)).toBe(true);
    expect(containsProfanity('siktir git', terms)).toBe(true);
    expect(containsProfanity('Şerefsiz!', terms)).toBe(true);
    expect(containsProfanity('serefsiz', terms)).toBe(true);
    expect(containsProfanity('amk.', terms)).toBe(true);
  });

  it('finds suffixed forms of words with 5 or more letters', () => {
    expect(containsProfanity('orospular', terms)).toBe(true);
    expect(containsProfanity("şerefsiz'in", terms)).toBe(true);
  });

  it('does not fold Turkish letters: only listed spellings match', () => {
    expect(containsProfanity('GÖT', terms)).toBe(true);
    expect(containsProfanity('got it', terms)).toBe(false);
    expect(containsProfanity('piç kurusu', terms)).toBe(true);
    expect(containsProfanity('pic kurusu', terms)).toBe(false);
  });

  it('matches short words only as whole words', () => {
    expect(containsProfanity('göt', terms)).toBe(true);
    expect(containsProfanity('götürdüm', terms)).toBe(false);
    expect(containsProfanity('amkara', terms)).toBe(false);
    expect(containsProfanity('sik', terms)).toBe(true);
    for (const word of ['şık', 'sık', 'sıkıcı', 'sıkıldım', 'SIK']) {
      expect(containsProfanity(word, terms), word).toBe(false);
    }
  });

  it('matches whole-word terms only as whole words, whatever their length', () => {
    expect(containsProfanity('ananı', terms)).toBe(true);
    expect(containsProfanity('ANANI!', terms)).toBe(true);
    expect(containsProfanity('ananın yemeği', terms)).toBe(false);
  });

  it('matches phrases on word boundaries', () => {
    expect(containsProfanity('seni piç kurusu', terms)).toBe(true);
    expect(containsProfanity('piç', terms)).toBe(false);
  });

  it('sees through spaced-out letters', () => {
    expect(containsProfanity('o r o s p u', terms)).toBe(true);
    expect(containsProfanity('a.m.k', terms)).toBe(true);
  });

  it('passes clean text', () => {
    expect(containsProfanity('Merhaba, nasılsınız?', terms)).toBe(false);
    expect(containsProfanity('', terms)).toBe(false);
  });
});

// K-34 (docs/SPEC_V4.md §4.C): a bio or a display name with a way to reach someone off the app.
describe('containsContact', () => {
  it('finds phone numbers, however they are spaced', () => {
    for (const text of [
      '5321234567',
      '0532 123 45 67',
      '+90 (532) 123-45-67',
      'ara: 0532.123.45.67',
      'numaram 5 3 2 1 2 3 4 5 6 7',
    ]) {
      expect(containsContact(text), text).toBe(true);
    }
  });

  it('finds e-mail addresses', () => {
    expect(containsContact('yaz bana elif.k@gmail.com')).toBe(true);
    expect(containsContact('ELIF_99@Hotmail.COM')).toBe(true);
  });

  it('finds usernames', () => {
    expect(containsContact('insta: @elif.kaya')).toBe(true);
    expect(containsContact('@deniz_99 takip et')).toBe(true);
  });

  it('finds links and bare domains', () => {
    for (const text of [
      'https://example.org/x',
      'http://kisa.link',
      'www.elif.net',
      'instagram.com/elif',
      't.me/deniz',
      'wa.me/905321234567',
      'site: elifkaya.com.tr',
      'Linktr.ee/elif',
    ]) {
      expect(containsContact(text), text).toBe(true);
    }
  });

  it('leaves ordinary names and bios alone', () => {
    for (const text of [
      'Deniz K.',
      'Ayşe Nur',
      'Dr. Elif',
      '1998 doğumlu, 2 kedi',
      'Sakarya Üni. 2. sınıf',
      'Kahve, kitap ve Kapsül Anlat.',
      '2019-2023 arası Ankara',
      'puan 10/10',
      'İstanbul’da yaşıyorum.',
      'Kitap severim.Kahve de.',
      'e-posta yok, tel yok',
      'a.k.a. Deniz',
      'mail@ desem de yok',
    ]) {
      expect(containsContact(text), text).toBe(false);
    }
  });

  // The CTO's review of WazzupDevs/Kabuk#145: what slipped through and what was wrongly refused.
  it('sees through invisible characters, full-width forms and Turkish capitals', () => {
    for (const text of [
      '0532\u200B123\u200B45\u200B67',
      '０５３２ １２３ ４５ ６７',
      'e\u200Blif@gmail.com',
      'ｗｗｗ.elif.net',
      '﹫elif',
      '＠elif',
      '@İrem',
      '@IREM',
    ]) {
      expect(containsContact(text), text).toBe(true);
    }
  });

  it('finds phone numbers spaced with other marks or written with O and l', () => {
    for (const text of [
      '0532_123_45_67',
      '0532,123,45,67',
      '0532·123·45·67',
      '0532*123*45*67',
      '0532|123|45|67',
      'O532 l23 45 67',
      'o5321234567',
    ]) {
      expect(containsContact(text), text).toBe(true);
    }
  });

  it('leaves runs of years and dates alone', () => {
    for (const text of [
      '1071 1453 1923',
      '1903 1905 1907',
      'ODTÜ 2016-2020/2020-2022',
      '01.01.2000 - 31.12.2020',
      'Mezuniyet 2012, 2016, 2020',
    ]) {
      expect(containsContact(text), text).toBe(false);
    }
  });

  it('finds usernames written after a platform without @', () => {
    for (const text of [
      'ig: elif.kaya',
      'snap: elif_k',
      'tg: elif',
      'insta=elif',
      'tiktok - elif',
      'Instagram elif.kaya',
      'insta elif99',
      'snapchat elif_k',
      'discord: elif#1234',
      'x: elif',
      'onlyfans: elif',
      'ig_elif',
    ]) {
      expect(containsContact(text), text).toBe(true);
    }
  });

  it('leaves a platform named in a sentence alone', () => {
    for (const text of [
      'insta yok',
      'insta elif',
      'Instagram yok. Kahve var',
      "Twitter'da yokum",
      'snap 3 yıldır yok',
      'x-men severim',
      'Haftada 3 x 10 km koşarım',
      'DC-Marvel tartışmasına varım',
    ]) {
      expect(containsContact(text), text).toBe(false);
    }
  });

  it('finds links with spaced dots, any extension before a path, and more bare domains', () => {
    for (const text of [
      't. me/elif',
      'instagram com/elif',
      'instagram . com / elif',
      'goo.gl/abc',
      'elif.site/abc',
      'Instagram.Com/elif',
      'elif.ai',
      'elif.online',
      'www . elif . net',
    ]) {
      expect(containsContact(text), text).toBe(true);
    }
  });

  it('finds e-mail addresses with spaces, without an extension or with [at] and [dot]', () => {
    for (const text of [
      'elif @ gmail . com',
      'elif@gmail',
      'elif @ hotmail',
      'elif [at] gmail [dot] com',
      'elif (at) gmail (dot) com',
      'elif@Site.Com',
    ]) {
      expect(containsContact(text), text).toBe(true);
    }
  });

  it('finds @ followed by a space at the start of a line or after a platform', () => {
    for (const text of ['@ elif', 'Kahve\n@ elif', 'ig @ elif', 'insta: @ elif', 'x: @ elif']) {
      expect(containsContact(text), text).toBe(true);
    }
  });

  it('leaves a workplace or a school after a spaced @ alone', () => {
    for (const text of [
      'Öğrenci @ SAÜ',
      'Bilgisayar Müh. @ SAÜ',
      'Barista @ Starbucks',
      'Ayşe @ Moda',
    ]) {
      expect(containsContact(text), text).toBe(false);
    }
  });

  it('leaves a sentence with no space after its full stop alone', () => {
    for (const text of [
      'Kafa dengi.Net konuşurum',
      'Kahve severim.Dev gibi',
      'film.tv izlerim',
      'Mim.Fak/2020',
      'Konuştuğum diller TR/EN',
      'iOS app/web',
      'puan 4.5/5',
      'Bilgisayar Müh. 2. sınıf/ODTÜ',
    ]) {
      expect(containsContact(text), text).toBe(false);
    }
  });
});
