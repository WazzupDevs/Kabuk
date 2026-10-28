import { describe, expect, it } from 'vitest';

import {
  DEV_PROJECT_HOST,
  deviceReachableUrl,
  isDevProjectUrl,
  isLocalUrl,
  locationCheck,
  refusesMockedPosition,
} from './devProject.ts';

const DEV = `https://${DEV_PROJECT_HOST}`;

describe('locationCheck', () => {
  it('is enforced unless the secret is exactly 1', () => {
    for (const flag of [undefined, '', '0', 'true', 'yes', ' 1']) {
      expect(locationCheck(flag, DEV)).toBe('enforced');
    }
  });

  it('skips only on the local stack and the dev project', () => {
    expect(locationCheck('1', DEV)).toBe('skipped');
    expect(locationCheck('1', 'http://kong:8000')).toBe('skipped');
    expect(locationCheck('1', 'http://127.0.0.1:54321')).toBe('skipped');
  });

  it('ignores the secret on any other project (the pilot)', () => {
    expect(locationCheck('1', 'https://abcdefghijklmnopqrst.supabase.co')).toBe('ignored');
    expect(locationCheck('1', `http://${DEV_PROJECT_HOST}`)).toBe('ignored');
    expect(locationCheck('1', `https://${DEV_PROJECT_HOST}.evil.example`)).toBe('ignored');
    expect(locationCheck('1', undefined)).toBe('ignored');
    expect(locationCheck('1', 'not a url')).toBe('ignored');
  });
});

describe('project urls', () => {
  it('tells the dev project and the local stack apart from everything else', () => {
    expect(isDevProjectUrl(DEV)).toBe(true);
    expect(isDevProjectUrl('https://x.supabase.co')).toBe(false);
    expect(isLocalUrl('http://10.0.2.2:54321')).toBe(true);
    expect(isLocalUrl(DEV)).toBe(false);
  });
});

describe('deviceReachableUrl', () => {
  const signed = 'http://kong:8000/storage/v1/object/sign/profile-photos/p/a.jpg?token=t';

  it('puts the device address in place of the local stack’s internal one', () => {
    expect(deviceReachableUrl(signed, 'http://kong:8000', 'http://10.0.2.2:54321')).toBe(
      'http://10.0.2.2:54321/storage/v1/object/sign/profile-photos/p/a.jpg?token=t',
    );
    expect(deviceReachableUrl(signed, 'http://kong:8000/', 'http://127.0.0.1:54321/')).toBe(
      'http://127.0.0.1:54321/storage/v1/object/sign/profile-photos/p/a.jpg?token=t',
    );
  });

  it('changes nothing without the setting', () => {
    expect(deviceReachableUrl(signed, 'http://kong:8000', undefined)).toBe(signed);
    expect(deviceReachableUrl(signed, 'http://kong:8000', '')).toBe(signed);
  });

  it('changes nothing on a hosted project, even with the setting', () => {
    for (const project of [DEV, 'https://abcdefghijklmnopqrst.supabase.co']) {
      const hosted = `${project}/storage/v1/object/sign/profile-photos/p/a.jpg?token=t`;
      expect(deviceReachableUrl(hosted, project, 'http://10.0.2.2:54321')).toBe(hosted);
    }
  });

  it('never points a URL at a host that is not local', () => {
    expect(deviceReachableUrl(signed, 'http://kong:8000', 'https://evil.example')).toBe(signed);
  });

  it('leaves a URL of another origin alone', () => {
    const other = 'http://127.0.0.1:54321/storage/v1/object/sign/x.jpg?token=t';
    expect(deviceReachableUrl(other, 'http://kong:8000', 'http://10.0.2.2:54321')).toBe(other);
    expect(
      deviceReachableUrl('http://kong:80001/x', 'http://kong:8000', 'http://10.0.2.2:54321'),
    ).toBe('http://kong:80001/x');
  });
});

describe('refusesMockedPosition', () => {
  const PILOT = 'https://abcdefghijklmnop.supabase.co';
  it('refuses a mocked position where the check is enforced or ignored', () => {
    expect(refusesMockedPosition(true, 'enforced', PILOT)).toBe(true);
    expect(refusesMockedPosition(true, 'ignored', PILOT)).toBe(true);
    expect(refusesMockedPosition(true, 'enforced', DEV)).toBe(true);
  });
  it('lets a real position or a phone without the flag through', () => {
    expect(refusesMockedPosition(false, 'enforced', PILOT)).toBe(false);
    expect(refusesMockedPosition(undefined, 'enforced', PILOT)).toBe(false);
  });
  it('lets a mocked position through when the check is skipped or on the local stack', () => {
    expect(refusesMockedPosition(true, 'skipped', DEV)).toBe(false);
    expect(refusesMockedPosition(true, 'enforced', 'http://kong:8000')).toBe(false);
  });
});
