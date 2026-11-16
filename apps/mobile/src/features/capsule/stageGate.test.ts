import { describe, expect, it } from 'vitest';

import { stagePasses, TILE_WAIT_MS, tileShown } from '../../capsule/stageGate';

describe('tileShown', () => {
  it('a tile on the screen keeps its last picture until the new one is made', () => {
    expect(tileShown(null, 'old')).toBe('old');
    expect(tileShown('new', 'old')).toBe('new');
  });
  it('falls back to the SVG only when it never had a picture', () => {
    expect(tileShown(null, null)).toBeNull();
    expect(tileShown('new', null)).toBe('new');
  });
});

describe('stagePasses', () => {
  it('the stage waits for the tiles on the screen, up to its limit', () => {
    expect(stagePasses(true, false, false)).toBe(false);
    expect(stagePasses(true, true, false)).toBe(true);
    expect(stagePasses(true, false, true)).toBe(true);
  });
  it('never comes without its own pictures', () => {
    expect(stagePasses(false, true, false)).toBe(false);
    expect(stagePasses(false, true, true)).toBe(false);
  });
  it('waits a few turns at most', () => {
    expect(TILE_WAIT_MS).toBeGreaterThan(0);
    expect(TILE_WAIT_MS).toBeLessThanOrEqual(300);
  });
});
