import { describe, expect, it } from 'vitest';

import { KIT } from '../theme/auraKit';
import { AA_LARGE, contrastRatio } from '../theme/contrast';

// Grup 3, P1a: the read tick in the viewer's own bubble is #4A5CE6 in both themes (the dark
// theme's #7DB2FF on #ECE9F8 was 1.82:1).
describe('read tick in the viewer own bubble', () => {
  it('stays at least 3:1 on the bubble in both themes', () => {
    expect(contrastRatio(KIT.readTick, KIT.bubble.light.mine)).toBeGreaterThanOrEqual(AA_LARGE);
    expect(contrastRatio(KIT.readTick, KIT.bubble.dark.mine)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
