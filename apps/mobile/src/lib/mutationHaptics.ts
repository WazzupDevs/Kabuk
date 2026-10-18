import { MutationCache } from '@tanstack/react-query';

import { failureHaptic, type HapticMoment } from './hapticMoments';

// The app's mutation cache: a failed mutation that carries FEEL_ERROR is felt; any other fails
// silently (its screen decides what to show). Such a press also ends the typing pause (K-30): a send
// or a save failing right after the last keystroke is still felt. `feel` and `pressed` are `haptic`
// and `stoppedTyping` in the app, recorders in tests.
export function feelingMutationCache(
  feel: (moment: HapticMoment) => void,
  pressed: () => void = () => undefined,
): MutationCache {
  return new MutationCache({
    onMutate: (_variables, mutation) => {
      if (failureHaptic(mutation.meta)) pressed();
    },
    onError: (_error, _variables, _context, mutation) => {
      const moment = failureHaptic(mutation.meta);
      if (moment) feel(moment);
    },
  });
}
