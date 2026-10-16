import { describe, expect, it } from 'vitest';

import { gameFlowView, GENDERS, mayStayAnonymous, participationError } from './gender.ts';

describe('mayStayAnonymous', () => {
  it('lets only a woman stay anonymous in the game flow', () => {
    expect(GENDERS.filter(mayStayAnonymous)).toEqual(['female']);
  });
});

describe('participationError', () => {
  it('takes every profiled entry; the photo is checked after', () => {
    for (const gender of GENDERS) expect(participationError(gender, true)).toBeNull();
  });

  it('refuses an anonymous entry from a man and from "Belirtmek istemiyorum"', () => {
    expect(participationError('male', false)).toBe('anonymous_not_allowed');
    expect(participationError('unspecified', false)).toBe('anonymous_not_allowed');
  });

  it('takes an anonymous entry from a woman', () => {
    expect(participationError('female', false)).toBeNull();
  });

  it('asks an empty gender first, anonymous or profiled', () => {
    expect(participationError(null, false)).toBe('gender_required');
    expect(participationError(null, true)).toBe('gender_required');
  });
});

describe('gameFlowView', () => {
  it('offers the choice to a woman and the profile to a man and "Belirtmek istemiyorum"', () => {
    expect(gameFlowView('female', null)).toBe('choice');
    expect(gameFlowView('male', null)).toBe('profile');
    expect(gameFlowView('unspecified', null)).toBe('profile');
  });

  it('asks an empty gender, also when the server says so', () => {
    expect(gameFlowView(null, null)).toBe('gender');
    for (const gender of [...GENDERS, undefined]) {
      expect(gameFlowView(gender, 'gender_required')).toBe('gender');
    }
  });

  it('keeps the choice until the own profile answers, and shows the profile once refused', () => {
    expect(gameFlowView(undefined, null)).toBe('choice');
    expect(gameFlowView(undefined, 'anonymous_not_allowed')).toBe('profile');
    expect(gameFlowView('female', 'anonymous_not_allowed')).toBe('profile');
  });
});
