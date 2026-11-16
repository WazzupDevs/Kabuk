import { describe, expect, it } from 'vitest';

import {
  fadeCanvas,
  lookPasses,
  stagePasses,
  TEXTURE_WAIT_MS,
  TILE_WAIT_MS,
  tileShown,
} from '../../capsule/stageGate';

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

describe('fadeCanvas', () => {
  it('is not on the screen before the first fade', () => {
    expect(fadeCanvas(false, false)).toEqual({ mounted: false, idle: true });
  });
  it('comes with the first fade and stays after it, idle', () => {
    let at = fadeCanvas(false, true);
    expect(at).toEqual({ mounted: true, idle: false });
    at = fadeCanvas(at.mounted, false);
    expect(at).toEqual({ mounted: true, idle: true });
    // The next change fades on the same canvas.
    expect(fadeCanvas(at.mounted, true)).toEqual({ mounted: true, idle: false });
  });
  it('is on the screen only while a look fades when it is not kept', () => {
    expect(fadeCanvas(true, false, false)).toEqual({ mounted: false, idle: true });
    expect(fadeCanvas(true, true, false)).toEqual({ mounted: true, idle: false });
  });
});

describe('lookPasses', () => {
  it('a made look waits for its pictures on the GPU, up to its limit', () => {
    expect(lookPasses(true, false, false)).toBe(false);
    expect(lookPasses(true, true, false)).toBe(true);
    // Past the limit: the pictures as they are (from the CPU, as before).
    expect(lookPasses(true, false, true)).toBe(true);
  });
  it('a look not made yet never passes', () => {
    expect(lookPasses(false, true, true)).toBe(false);
  });
  it('waits a few frames only', () => {
    expect(TEXTURE_WAIT_MS).toBeGreaterThan(0);
    expect(TEXTURE_WAIT_MS).toBeLessThanOrEqual(250);
  });
});
