import { MutationCache } from '@tanstack/react-query';

import { failureHaptic, type HapticMoment } from './hapticMoments';

// The app's mutation cache: a failed mutation that carries FEEL_ERROR is felt; any other fails
// silently (its screen decides what to show). `feel` is `haptic` in the app, a recorder in tests.
export function feelingMutationCache(feel: (moment: HapticMoment) => void): MutationCache {
  return new MutationCache({
    onError: (_error, _variables, _context, mutation) => {
      const moment = failureHaptic(mutation.meta);
      if (moment) feel(moment);
    },
  });
}
