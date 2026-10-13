import { describe, expect, it } from 'vitest';

import { upperTr } from './textCase';

describe('upperTr', () => {
  it('writes the dotted and dotless i the Turkish way', () => {
    expect(upperTr('kategori')).toBe('KATEGORİ');
    expect(upperTr('yasaklı kelimeler')).toBe('YASAKLI KELİMELER');
    expect(upperTr('niyetin')).toBe('NİYETİN');
    expect(upperTr('1. tur bitti')).toBe('1. TUR BİTTİ');
    expect(upperTr('sizin')).toBe('SİZİN');
  });

  it('keeps capitals and other letters', () => {
    expect(upperTr('Şarkı · Ölçü · Çağ')).toBe('ŞARKI · ÖLÇÜ · ÇAĞ');
    expect(upperTr('İbre')).toBe('İBRE');
  });

  it('turns numbers into text and walks arrays', () => {
    expect(upperTr(3)).toBe('3');
    expect(upperTr(['tur ', 2, ' bitti'])).toEqual(['TUR ', '2', ' BİTTİ']);
  });

  it('leaves other children alone', () => {
    expect(upperTr(null)).toBeNull();
    expect(upperTr(undefined)).toBeUndefined();
    expect(upperTr(true)).toBe(true);
  });
});
