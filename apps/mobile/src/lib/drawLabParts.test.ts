import { describe, expect, it } from 'vitest';

import {
  CHAT_PARTS,
  DRAW_PARTS,
  DRAW_STEPS,
  partsOff,
  SWITCH_PARTS,
  togglePart,
} from './drawLabParts';

describe('Çizim ölçümü parts (B4)', () => {
  it('nothing is off when no step runs and nothing is turned off by hand', () => {
    expect(partsOff({ step: null, manual: [] })).toEqual([]);
  });

  it('the frost, the blur, the arrival and the cascade turn off each on its own', () => {
    for (const part of ['buzlu', 'bulanma', 'gelis', 'kademe'] as const) {
      const off = partsOff({ step: null, manual: [part] });
      expect(off).toEqual([part]);
    }
    expect(partsOff({ step: null, manual: ['buzlu'] })).not.toContain('cam');
    expect(partsOff({ step: null, manual: ['cam'] })).not.toContain('buzlu');
  });

  it('a running step and the parts turned off by hand add up, each once', () => {
    const cam = DRAW_STEPS.findIndex((s) => s.key === 'cam');
    expect(partsOff({ step: cam, manual: ['bulanma', 'cam'] })).toEqual(['cam', 'bulanma']);
  });

  it('a switch pressed twice is back on', () => {
    const once = togglePart([], 'gelis');
    expect(once).toEqual(['gelis']);
    expect(togglePart(once, 'gelis')).toEqual([]);
  });

  it('the timed steps begin and end with everything on; every switch part is a part', () => {
    expect(DRAW_STEPS[0]?.off).toEqual([]);
    expect(DRAW_STEPS[DRAW_STEPS.length - 1]?.off).toEqual([]);
    for (const p of SWITCH_PARTS) expect(DRAW_PARTS).toContain(p);
    for (const p of CHAT_PARTS) expect(DRAW_PARTS).toContain(p);
    // No timed step turns the chat's own parts off: by hand only.
    for (const s of DRAW_STEPS) expect(s.off).not.toContain('duvar');
  });
});
