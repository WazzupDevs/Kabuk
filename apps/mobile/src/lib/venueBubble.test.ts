import { describe, expect, it } from 'vitest';

import { KIT } from '../theme/auraKit';
import { AA_TEXT, contrastRatio } from '../theme/contrast';

// Grup 3, P4 (K7): the venue chat's own bubble is the primary with white words.
describe('venue chat own bubble', () => {
  it('reads white words on the primary at 4.5:1 or more', () => {
    expect(contrastRatio(KIT.venueBubble.mineInk, KIT.primary)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
