import { describe, expect, it } from 'vitest';

import {
  minBuildFor,
  minBuildFrom,
  needsUpdate,
  parseBuild,
  platformFrom,
  storeUrl,
} from './appVersion.ts';

describe('parseBuild', () => {
  it('reads a positive whole build number only', () => {
    expect(parseBuild('12')).toBe(12);
    expect(parseBuild(' 7 ')).toBe(7);
    for (const bad of [null, undefined, '', '0', '-3', '1.2', 'abc', '1e3']) {
      expect(parseBuild(bad), String(bad)).toBeNull();
    }
  });
});

describe('needsUpdate', () => {
  it('is open when the minimum is 0 or unset, even without a header', () => {
    expect(minBuildFrom(undefined)).toBe(0);
    expect(minBuildFrom('nonsense')).toBe(0);
    expect(needsUpdate(null, 0)).toBe(false);
    expect(needsUpdate('3', 0)).toBe(false);
  });

  it('refuses a missing, malformed or older build once a minimum is set', () => {
    expect(needsUpdate(null, 5)).toBe(true);
    expect(needsUpdate('abc', 5)).toBe(true);
    expect(needsUpdate('4', 5)).toBe(true);
    expect(needsUpdate('5', 5)).toBe(false);
    expect(needsUpdate('12', 5)).toBe(false);
  });
});

describe('platformFrom', () => {
  it('is iOS only when the header says so; anything else, missing too, is Android', () => {
    expect(platformFrom('ios')).toBe('ios');
    expect(platformFrom(' iOS ')).toBe('ios');
    for (const other of [null, undefined, '', 'android', 'web', 'iphone']) {
      expect(platformFrom(other), String(other)).toBe('android');
    }
  });
});

describe('minBuildFor', () => {
  it("takes each platform's own minimum, so an Android minimum never closes iOS", () => {
    const minimums = { android: '42', ios: undefined };
    expect(minBuildFor('android', minimums)).toBe(42);
    expect(minBuildFor('ios', minimums)).toBe(0);
    expect(needsUpdate('1', minBuildFor('ios', minimums))).toBe(false);
    expect(needsUpdate('1', minBuildFor('android', minimums))).toBe(true);
    expect(minBuildFor('ios', { android: '42', ios: '3' })).toBe(3);
  });
});

describe('storeUrl', () => {
  it('sends Android to Play or its override, iOS to TestFlight or its override', () => {
    expect(storeUrl('android', 'app.kabuk.mobile', {})).toBe(
      'https://play.google.com/store/apps/details?id=app.kabuk.mobile',
    );
    expect(storeUrl('android', 'x', { android: 'https://apk', ios: 'https://ios' })).toBe(
      'https://apk',
    );
    expect(storeUrl('ios', 'app.kabuk.mobile', { android: 'https://apk' })).toBe('itms-beta://');
    expect(storeUrl('ios', 'x', { ios: 'https://apps.apple.com/app/id1' })).toBe(
      'https://apps.apple.com/app/id1',
    );
  });
});
