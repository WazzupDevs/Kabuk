import { describe, expect, it, vi } from 'vitest';

import { createTabOpenings, LEAVE_PREPARE_MS } from './tabOpenings';

describe('tab openings (B2, B5)', () => {
  it('every part listening hears each event, once each', () => {
    const openings = createTabOpenings();
    const a = vi.fn();
    const b = vi.fn();
    openings.subscribe(a);
    openings.subscribe(b);
    openings.emit('leave');
    openings.emit('open');
    expect(a.mock.calls).toEqual([['leave'], ['open']]);
    expect(b.mock.calls).toEqual([['leave'], ['open']]);
  });

  it('a part gone no longer hears it', () => {
    const openings = createTabOpenings();
    const a = vi.fn();
    const off = openings.subscribe(a);
    off();
    openings.emit('open');
    expect(a).not.toHaveBeenCalled();
  });

  it('a part leaving while the others are told does not stop them', () => {
    const openings = createTabOpenings();
    const b = vi.fn();
    let offB = () => {};
    openings.subscribe(() => offB());
    offB = openings.subscribe(b);
    openings.emit('open');
    expect(b).toHaveBeenCalledTimes(1);
    openings.emit('open');
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('nothing listening is no error', () => {
    expect(() => createTabOpenings().emit('settle')).not.toThrow();
  });

  it('the parts are prepared after the leaving screen is gone, well before a tab comes back', () => {
    expect(LEAVE_PREPARE_MS).toBeGreaterThanOrEqual(100);
    expect(LEAVE_PREPARE_MS).toBeLessThanOrEqual(250);
  });
});
