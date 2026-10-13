// MVP_SPEC §6. Tests first (CLAUDE.md).
import { describe, expect, it } from 'vitest';

import { capitalizeTr, normalize, tokenize, upperTr } from './trText.ts';

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
