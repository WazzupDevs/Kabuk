import { describe, expect, it } from 'vitest';

import { prepareTerms } from './profanity.ts';
import {
  checkBio,
  checkDisplayName,
  isLegacyPhotoPath,
  isPhotoPath,
  newPhotoPath,
} from './profile.ts';

const terms = prepareTerms(['siktir', 'göt']);

describe('checkDisplayName', () => {
  it('trims and collapses spaces, 2–24 characters', () => {
    expect(checkDisplayName('  Ayşe   Nur ', terms)).toEqual({ ok: true, value: 'Ayşe Nur' });
    expect(checkDisplayName('A', terms)).toEqual({ ok: false, reason: 'length' });
    expect(checkDisplayName('ş'.repeat(25), terms)).toEqual({ ok: false, reason: 'length' });
    expect(checkDisplayName('ş'.repeat(24), terms).ok).toBe(true);
  });

  it('rejects profanity', () => {
    expect(checkDisplayName('Siktir Ali', terms)).toEqual({ ok: false, reason: 'profanity' });
  });
});

describe('checkBio', () => {
  it('clears on empty and allows up to 160 characters', () => {
    expect(checkBio('   ', terms)).toEqual({ ok: true, value: null });
    expect(checkBio('Kahve ve Tabu ', terms)).toEqual({ ok: true, value: 'Kahve ve Tabu' });
    expect(checkBio('a'.repeat(161), terms)).toEqual({ ok: false, reason: 'length' });
  });

  it('rejects profanity but not everyday words', () => {
    expect(checkBio('göt', terms)).toEqual({ ok: false, reason: 'profanity' });
    expect(checkBio('çok şık bir kafe', terms).ok).toBe(true);
  });
});

// Photo paths carry nothing of the account (rule 4): p/{random uuid}.jpg. The pending upload, not
// the path, says whose it is (profile function).
describe('photo paths', () => {
  const uuid = '22222222-2222-4222-8222-222222222222';
  const publicId = '11111111-1111-4111-8111-111111111111';

  it('builds p/{uuid}.jpg from a random uuid only', () => {
    expect(newPhotoPath(uuid)).toBe(`p/${uuid}.jpg`);
    expect(() => newPhotoPath('../x')).toThrow();
    expect(() => newPhotoPath(`${publicId}/${uuid}`)).toThrow();
  });

  it('accepts only p/{uuid}.jpg', () => {
    expect(isPhotoPath(`p/${uuid}.jpg`)).toBe(true);
    expect(isPhotoPath(`${publicId}/${uuid}.jpg`)).toBe(false);
    expect(isPhotoPath(`p/../${uuid}.jpg`)).toBe(false);
    expect(isPhotoPath(`p/${uuid}.png`)).toBe(false);
    expect(isPhotoPath(`p/${uuid}.jpg/x`)).toBe(false);
  });

  it('tells a photo from before random paths: {public_id}/{uuid}.jpg', () => {
    expect(isLegacyPhotoPath(`${publicId}/${uuid}.jpg`)).toBe(true);
    expect(isLegacyPhotoPath(`p/${uuid}.jpg`)).toBe(false);
    expect(isLegacyPhotoPath(`${publicId}/../${uuid}.jpg`)).toBe(false);
  });
});
