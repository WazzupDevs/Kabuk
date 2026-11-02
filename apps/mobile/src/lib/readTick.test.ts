import { describe, expect, it } from 'vitest';

import { KIT } from '../theme/auraKit';
import { AA_LARGE, contrastRatio } from '../theme/contrast';

// The read tick in the viewer's own bubble (the primary since Aura v65) is --read-on-accent in
// both themes.
describe('read tick in the viewer own bubble', () => {
  it('stays at least 3:1 on the bubble in both themes', () => {
    expect(contrastRatio(KIT.readTick, KIT.bubble.light.mine)).toBeGreaterThanOrEqual(AA_LARGE);
    expect(contrastRatio(KIT.readTick, KIT.bubble.dark.mine)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
