import { describe, expect, it } from 'vitest';

import {
  CURRENT_KVKK_VERSION,
  CURRENT_TERMS_VERSION,
  needsConsent,
  needsGender,
  needsOnboarding,
  needsProfile,
} from './consent.ts';

describe('needsConsent', () => {
  it('is required without a profile', () => {
    expect(needsConsent(null)).toBe(true);
  });

  it('is not required when both current versions are accepted', () => {
    expect(
      needsConsent({ terms_version: CURRENT_TERMS_VERSION, kvkk_version: CURRENT_KVKK_VERSION }),
    ).toBe(false);
  });

  it('is required again when either text changes', () => {
    expect(needsConsent({ terms_version: 'old', kvkk_version: CURRENT_KVKK_VERSION })).toBe(true);
    expect(needsConsent({ terms_version: CURRENT_TERMS_VERSION, kvkk_version: 'old' })).toBe(true);
  });
});

describe('needsOnboarding', () => {
  const done = {
    terms_version: CURRENT_TERMS_VERSION,
    kvkk_version: CURRENT_KVKK_VERSION,
    display_name: 'Deniz',
    has_birth_date: true,
    has_gender: true,
  };

  it('opens the app once consents, the profile and the gender are there', () => {
    expect(needsOnboarding(done)).toBe(false);
  });

  it('keeps an account from before the gender step for the one-time question', () => {
    expect(needsGender({ has_gender: false })).toBe(true);
    expect(needsGender({ has_gender: null })).toBe(true);
    expect(needsOnboarding({ ...done, has_gender: false })).toBe(true);
    // The gender is asked after the profile, which still decides on its own.
    const withoutGender = { ...done, has_gender: false };
    expect(needsProfile(withoutGender)).toBe(false);
  });
});
