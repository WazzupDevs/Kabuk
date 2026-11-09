import { describe, expect, it } from 'vitest';

import { blockingEnvFiles, blockingShellVars, updateArgs } from './guard.ts';

describe('production OTA guard', () => {
  it('stops on every env file Expo would read, not on the example', () => {
    expect(
      blockingEnvFiles([
        '.env',
        '.env.local',
        '.env.production',
        '.env.example',
        'app.json',
        'environment.ts',
      ]),
    ).toEqual(['.env', '.env.local', '.env.production']);
    expect(blockingEnvFiles(['.env.example', 'package.json'])).toEqual([]);
    expect(blockingEnvFiles(['.ENV', '.Env.local', '.ENV.EXAMPLE'])).toEqual([
      '.ENV',
      '.Env.local',
    ]);
  });

  it('stops on EXPO_PUBLIC_* values in the shell', () => {
    expect(blockingShellVars({ PATH: '/bin', EXPO_PUBLIC_APP_ENV: 'e2e' })).toEqual([
      'EXPO_PUBLIC_APP_ENV',
    ]);
    expect(blockingShellVars({ PATH: '/bin', EXPO_TOKEN: 'x' })).toEqual([]);
  });

  it('asks for a message and targets only the production channel and environment', () => {
    expect(() => updateArgs(undefined)).toThrow();
    expect(() => updateArgs('  ')).toThrow();
    const args = updateArgs('Sohbet düzeltmesi');
    expect(args.slice(0, 2)).toEqual(['eas-cli', 'update']);
    expect(args[args.indexOf('--channel') + 1]).toBe('production');
    expect(args[args.indexOf('--environment') + 1]).toBe('production');
    expect(args.at(-1)).toBe('Sohbet düzeltmesi');
  });
});
