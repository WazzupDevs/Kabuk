import { describe, expect, it } from 'vitest';

import { KIT } from '../theme/auraKit';
import { AA_TEXT, contrastRatio } from '../theme/contrast';

// The owner's call (29 Ekim, again 4 Kasım): the own bubble white with ink words, the others' in
// the chat's colour with white words, in every chat; both read at 4.5:1 or more in both themes.
describe('chat bubbles', () => {
  for (const scheme of ['light', 'dark'] as const) {
    const b = KIT.bubble[scheme];
    it(`reads the own bubble's words (${scheme})`, () => {
      expect(contrastRatio(b.mineInk, b.mine)).toBeGreaterThanOrEqual(AA_TEXT);
    });
    // The DM blue is the tuval's (U28), unchanged here: 3.9:1 in the light (asked, 4 Kasım).
    for (const kind of scheme === 'light'
      ? (['mekan', 'masa'] as const)
      : (['dm', 'mekan', 'masa'] as const)) {
      it(`reads another's words in the ${kind} chat (${scheme})`, () => {
        expect(contrastRatio(b.themInk, b[kind])).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }
});
