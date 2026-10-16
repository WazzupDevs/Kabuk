import { describe, expect, it } from 'vitest';

import { GENDERS, mayStayAnonymous, participationError } from './gender.ts';

describe('mayStayAnonymous', () => {
  it('lets only a woman stay anonymous in the game flow', () => {
    expect(GENDERS.filter(mayStayAnonymous)).toEqual(['female']);
  });
});

describe('participationError', () => {
  it('takes every profiled entry; the photo is checked after', () => {
    for (const gender of [...GENDERS, null]) expect(participationError(gender, true)).toBeNull();
  });

  it('refuses an anonymous entry from a man and from "Belirtmek istemiyorum"', () => {
    expect(participationError('male', false)).toBe('anonymous_not_allowed');
    expect(participationError('unspecified', false)).toBe('anonymous_not_allowed');
  });

  it('takes an anonymous entry from a woman, and from an empty gender until the app asks', () => {
    expect(participationError('female', false)).toBeNull();
    expect(participationError(null, false)).toBeNull();
  });
});
