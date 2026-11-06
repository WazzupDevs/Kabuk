import { describe, expect, it, vi } from 'vitest';

import { AFTER_ARRIVAL_MS, createTabActivity } from './tabActivity';

describe('tab activity (B6)', () => {
  it('tells whether the tab is on screen', () => {
    const tab = createTabActivity(true);
    expect(tab.active()).toBe(true);
    tab.set(false);
    expect(tab.active()).toBe(false);
  });

  it('a tab coming back is heard once; staying hidden or shown is not', () => {
    const tab = createTabActivity(false);
    const fn = vi.fn();
    tab.onResume(fn);
    tab.set(false);
    expect(fn).not.toHaveBeenCalled();
    tab.set(true);
    tab.set(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('a clock gone no longer hears it', () => {
    const tab = createTabActivity(false);
    const fn = vi.fn();
    tab.onResume(fn)();
    tab.set(true);
    expect(fn).not.toHaveBeenCalled();
  });

  it('the catch-up waits out the arrival and its cascade', () => {
    expect(AFTER_ARRIVAL_MS).toBe(240 + 5 * 35);
  });
});
