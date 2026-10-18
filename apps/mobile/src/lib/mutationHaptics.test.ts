import { type MutationOptions, QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { FEEL_ERROR, failureHaptic, type HapticMoment } from './hapticMoments';
import { feelingMutationCache } from './mutationHaptics';

// A client with the app's mutation cache, recording what the phone would feel.
function setup() {
  const felt: HapticMoment[] = [];
  const presses: number[] = [];
  const client = new QueryClient({
    mutationCache: feelingMutationCache(
      (m) => felt.push(m),
      () => presses.push(felt.length),
    ),
  });
  const run = (options: MutationOptions<unknown, Error, void>) =>
    client
      .getMutationCache()
      .build(client, { retry: false, ...options })
      .execute(undefined)
      .catch(() => undefined);
  return { felt, presses, run };
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

  it('a press ends the typing pause before its answer (K-30): a fast failure is still felt', async () => {
    const { felt, presses, run } = setup();
    await run({ mutationFn: fails, meta: FEEL_ERROR });
    // The pause ended when the press began, before the failure was felt.
    expect(presses).toEqual([0]);
    expect(felt).toEqual(['failed']);
    // A call the phone sends by itself is not a press.
    await run({ mutationFn: fails });
    expect(presses).toEqual([0]);
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
