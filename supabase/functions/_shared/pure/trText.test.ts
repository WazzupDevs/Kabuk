// MVP_SPEC §6. Tests first (CLAUDE.md).
import { describe, expect, it } from 'vitest';

import { capitalizeTr, inflectTr, normalize, tokenize, upperTr } from './trText.ts';

describe('normalize', () => {
  it('lowercases with Turkish rules and folds Turkish letters', () => {
    expect(normalize('DENİZ')).toBe('deniz');
    expect(normalize('Denize')).toBe('denize');
    expect(normalize('Ilık')).toBe('ilik');
    expect(normalize('ılık')).toBe('ilik');
    expect(normalize('İstanbul')).toBe('istanbul');
    expect(normalize('istanbul')).toBe('istanbul');
    expect(normalize('öğretmen')).toBe('ogretmen');
    expect(normalize('ogretmen')).toBe('ogretmen');
    expect(normalize('ÇĞIİÖŞÜ çğıiöşü')).toBe('cgiiosu cgiiosu');
  });

  it('turns everything but letters and digits into spaces', () => {
    expect(normalize("deniz'de")).toBe('deniz de');
    expect(normalize('deniz, de!')).toBe('deniz  de ');
    expect(normalize('3-2')).toBe('3 2');
    expect(normalize('d e n i z')).toBe('d e n i z');
  });

  it('can keep Turkish letters (profanity matching)', () => {
    expect(normalize('ŞIK Sık İyi', { fold: false })).toBe('şık sık iyi');
    expect(normalize("GÖT'ü", { fold: false })).toBe('göt ü');
  });

  it('keeps letters of other alphabets as letters', () => {
    expect(normalize('Café')).toBe('café');
  });
});

describe('tokenize', () => {
  it('splits on spaces and drops empty tokens', () => {
    expect(tokenize("  Deniz'de   yüzdük ")).toEqual(['deniz', 'de', 'yuzduk']);
    expect(tokenize('')).toEqual([]);
  });

  it('can keep Turkish letters', () => {
    expect(tokenize('ş ı k olmuş', { fold: false })).toEqual(['şık', 'olmuş']);
  });

  it('joins runs of single letters', () => {
    expect(tokenize('d e n i z')).toEqual(['deniz']);
    expect(tokenize('bu d-e-n-i-z mavi')).toEqual(['bu', 'deniz', 'mavi']);
    expect(tokenize('a')).toEqual(['a']);
  });
});

// Shown words follow Turkish case rules: "isim" → "İsim", "ılık" → "Ilık" (a plain toUpperCase or
// Android's textTransform makes "i" into "I").
describe('capitalizeTr and upperTr', () => {
  it('capitalizes the first letter the Turkish way', () => {
    expect(capitalizeTr('isim')).toBe('İsim');
    expect(capitalizeTr('ılık')).toBe('Ilık');
    expect(capitalizeTr('çiçek')).toBe('Çiçek');
    expect(capitalizeTr('aşk')).toBe('Aşk');
    expect(capitalizeTr('Meyve')).toBe('Meyve');
    expect(capitalizeTr('')).toBe('');
  });

  it('uppercases the Turkish way', () => {
    expect(upperTr('Kategori')).toBe('KATEGORİ');
    expect(upperTr('ılık')).toBe('ILIK');
    expect(upperTr('Tur 1 bitti')).toBe('TUR 1 BİTTİ');
  });
});

// Case suffixes on names (canvas: Faz 2 · 22.5): screens never write them by hand. Spelling
// decides: an apostrophe, harmony from the last written vowel, n or y after a final vowel.
describe('inflectTr', () => {
  const genitive = (name: string) => inflectTr(name, 'genitive');
  const dative = (name: string) => inflectTr(name, 'dative');

  it('puts the genitive after an apostrophe, with n after a vowel', () => {
    expect(genitive('Leylek')).toBe("Leylek'in");
    expect(genitive('Martı')).toBe("Martı'nın");
    expect(genitive('Ece')).toBe("Ece'nin");
    expect(genitive('Deniz')).toBe("Deniz'in");
    expect(genitive('Badem')).toBe("Badem'in");
    expect(genitive('Baykuş')).toBe("Baykuş'un");
    expect(genitive('Doğu')).toBe("Doğu'nun");
    expect(genitive('Gül')).toBe("Gül'ün");
    expect(genitive('Öykü')).toBe("Öykü'nün");
    expect(genitive('Suricat')).toBe("Suricat'ın");
  });

  it('puts the dative after an apostrophe, with y after a vowel', () => {
    expect(dative('Serçe')).toBe("Serçe'ye");
    expect(dative('Badem')).toBe("Badem'e");
    expect(dative('Martı')).toBe("Martı'ya");
    expect(dative('Lokma')).toBe("Lokma'ya");
    expect(dative('Baykuş')).toBe("Baykuş'a");
    expect(dative('Gül')).toBe("Gül'e");
  });

  it('follows the last word of an alias or a full name', () => {
    expect(genitive('Kibar Badem')).toBe("Kibar Badem'in");
    expect(genitive('Sakin Martı')).toBe("Sakin Martı'nın");
    expect(dative('Çevik Serçe')).toBe("Çevik Serçe'ye");
    expect(genitive('Deniz Kaya')).toBe("Deniz Kaya'nın");
  });

  // Common names read with a soft l take a front vowel whatever their last written vowel.
  it('gives names with a soft l a front vowel', () => {
    for (const name of [
      'Kemal',
      'Cemal',
      'Celal',
      'Bilal',
      'Hilal',
      'Nihal',
      'Meral',
      'İkbal',
      'İclal',
      'Hayal',
    ]) {
      expect(genitive(name)).toBe(`${name}'in`);
      expect(dative(name)).toBe(`${name}'e`);
    }
    expect(genitive('Mustafa Kemal')).toBe("Mustafa Kemal'in");
    expect(dative('Mustafa Kemal')).toBe("Mustafa Kemal'e");
    expect(genitive('KEMAL')).toBe("KEMAL'in");
    expect(dative('KEMAL')).toBe("KEMAL'e");
    expect(genitive('Kemâl')).toBe("Kemâl'in");
    expect(dative('Kemâl')).toBe("Kemâl'e");
    // Only the whole last word: other names ending in -al keep their harmony.
    expect(genitive('Kemal Bal')).toBe("Kemal Bal'ın");
    expect(genitive('Kemalcan')).toBe("Kemalcan'ın");
  });

  it('reads capitals the Turkish way', () => {
    expect(genitive('IŞIK')).toBe("IŞIK'ın");
    expect(genitive('İNCİ')).toBe("İNCİ'nin");
    expect(dative('SERÇE')).toBe("SERÇE'ye");
  });

  it('reads a final number aloud', () => {
    expect(genitive('Masa 5')).toBe("Masa 5'in");
    expect(dative('Masa 5')).toBe("Masa 5'e");
    expect(genitive('6')).toBe("6'nın");
    expect(dative('6')).toBe("6'ya");
    expect(genitive('Ali2')).toBe("Ali2'nin");
    expect(genitive('3')).toBe("3'ün");
    expect(genitive('4')).toBe("4'ün");
    expect(dative('9')).toBe("9'a");
    expect(genitive('10')).toBe("10'un");
    expect(dative('10')).toBe("10'a");
    expect(genitive('20')).toBe("20'nin");
    expect(genitive('40')).toBe("40'ın");
    expect(dative('90')).toBe("90'a");
    expect(genitive('100')).toBe("100'ün");
    expect(dative('100')).toBe("100'e");
    expect(genitive('2000')).toBe("2000'in");
    expect(genitive('25000')).toBe("25000'in");
    expect(genitive('3000000')).toBe("3000000'un");
    expect(genitive('0')).toBe("0'ın");
  });

  it('reads an accented letter as its base letter', () => {
    expect(genitive('Zoë')).toBe("Zoë'nin");
    expect(dative('José')).toBe("José'ye");
    expect(genitive('Renée')).toBe("Renée'nin");
    expect(genitive('Ana María')).toBe("Ana María'nın");
    expect(genitive('Noël')).toBe("Noël'in");
    expect(dative('Ángel')).toBe("Ángel'e");
  });

  it('counts w, q and x as consonants', () => {
    expect(genitive('Max')).toBe("Max'ın");
    expect(dative('Max')).toBe("Max'a");
    expect(genitive('Andrew')).toBe("Andrew'in");
    expect(genitive('Iraq')).toBe("Iraq'ın");
  });

  it('skips trailing symbols but puts the suffix after the whole name', () => {
    expect(genitive('Ali 🙂')).toBe("Ali 🙂'nin");
    expect(dative('Deniz!')).toBe("Deniz!'e");
    expect(genitive('Masa 5!')).toBe("Masa 5!'in");
  });

  it('takes the e-forms without a vowel', () => {
    expect(genitive('Brr')).toBe("Brr'in");
    expect(dative('Brr')).toBe("Brr'e");
    expect(genitive('Анна')).toBe("Анна'in");
    expect(dative('🙂')).toBe("🙂'e");
  });
});
