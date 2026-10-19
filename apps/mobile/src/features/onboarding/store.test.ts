import { describe, expect, it } from 'vitest';

import { resetOnboarding, useOnboardingStore } from './store';

describe('the sign-up store', () => {
  it('forgets every answer and the consents on reset, so the next account starts unticked', () => {
    useOnboardingStore.setState({
      consented: { terms: 't', kvkk: 'k' },
      name: 'Elif',
      birthDate: '2000-01-15',
      nameError: 'Bu ad kullanılamaz.',
      extrasPending: true,
      gender: 'female',
    });
    resetOnboarding();
    expect(useOnboardingStore.getState()).toEqual({
      consented: null,
      name: '',
      birthDate: null,
      nameError: null,
      extrasPending: false,
      underAge: false,
      gender: null,
    });
  });

  it('keeps the under-18 notice across the sign-out that follows it', () => {
    useOnboardingStore.setState({ underAge: true, consented: { terms: 't', kvkk: 'k' } });
    resetOnboarding();
    expect(useOnboardingStore.getState().underAge).toBe(true);
    expect(useOnboardingStore.getState().consented).toBeNull();
  });
});
