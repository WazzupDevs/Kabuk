import { type MutationOptions, QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { FEEL_ERROR, failureHaptic, type HapticMoment } from './hapticMoments';
import { feelingMutationCache } from './mutationHaptics';

// A client with the app's mutation cache, recording what the phone would feel.
function setup() {
  const felt: HapticMoment[] = [];
  const client = new QueryClient({ mutationCache: feelingMutationCache((m) => felt.push(m)) });
  const run = (options: MutationOptions<unknown, Error, void>) =>
    client
      .getMutationCache()
      .build(client, { retry: false, ...options })
      .execute(undefined)
      .catch(() => undefined);
  return { felt, run };
}

const fails = () => Promise.reject(new Error('network'));

describe('failed mutation haptics', () => {
  it('a pressed action whose error shows is felt once', async () => {
    const { felt, run } = setup();
    await run({ mutationFn: fails, meta: FEEL_ERROR });
    expect(felt).toEqual(['failed']);
  });

  // ibreAdvance, sahtekarAdvance, sayAdvance, tabuBeginTurn, ibreTarget: sent by the phones
  // themselves, without FEEL_ERROR.
  it('a call the phone sends by itself fails silently', async () => {
    const { felt, run } = setup();
    await run({ mutationFn: fails });
    await run({ mutationFn: fails, meta: {} });
    expect(felt).toEqual([]);
  });

  it('a success is not felt as a failure', async () => {
    const { felt, run } = setup();
    await run({ mutationFn: () => Promise.resolve('ok'), meta: FEEL_ERROR });
    expect(felt).toEqual([]);
  });

  it('only feelError: true counts', () => {
    expect(failureHaptic({ feelError: true })).toBe('failed');
    expect(failureHaptic({ feelError: false })).toBeNull();
    expect(failureHaptic(undefined)).toBeNull();
  });
});
