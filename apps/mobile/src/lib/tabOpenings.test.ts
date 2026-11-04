import { describe, expect, it, vi } from 'vitest';

import { createTabOpenings } from './tabOpenings';

describe('tab openings (B2)', () => {
  it('every part listening hears an opening, once each', () => {
    const openings = createTabOpenings();
    const a = vi.fn();
    const b = vi.fn();
    openings.subscribe(a);
    openings.subscribe(b);
    openings.open();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('a part gone no longer hears it', () => {
    const openings = createTabOpenings();
    const a = vi.fn();
    const off = openings.subscribe(a);
    off();
    openings.open();
    expect(a).not.toHaveBeenCalled();
  });

  it('a part leaving while the others are told does not stop them', () => {
    const openings = createTabOpenings();
    const b = vi.fn();
    let offB = () => {};
    openings.subscribe(() => offB());
    offB = openings.subscribe(b);
    openings.open();
    expect(b).toHaveBeenCalledTimes(1);
    openings.open();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('nothing listening is no error', () => {
    expect(() => createTabOpenings().open()).not.toThrow();
  });
});
