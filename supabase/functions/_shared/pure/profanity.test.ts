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
});
