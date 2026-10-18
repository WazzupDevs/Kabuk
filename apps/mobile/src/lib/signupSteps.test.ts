import { describe, expect, it } from 'vitest';

import { finishLabel, SIGNUP_STEPS, SIGNUP_TOTAL, stepNumber } from './signupSteps';

describe('sign-up steps (K-19, K-33)', () => {
  it('asks for the consents first, the photo last, in seven steps', () => {
    expect(SIGNUP_STEPS).toEqual(['consents', 'phone', 'code', 'name', 'birth', 'gender', 'photo']);
    expect(SIGNUP_TOTAL).toBe(7);
    expect(stepNumber('consents')).toBe(1);
    expect(stepNumber('phone')).toBe(2);
    expect(stepNumber('gender')).toBe(6);
    expect(stepNumber('photo')).toBe(7);
  });

  it('ends with "Bitir", or "Fotoğrafsız bitir" without a photo (K-29)', () => {
    const labels = { finish: 'Bitir', noPhoto: 'Fotoğrafsız bitir' };
    expect(finishLabel(true, labels)).toBe('Bitir');
    expect(finishLabel(false, labels)).toBe('Fotoğrafsız bitir');
  });
});
