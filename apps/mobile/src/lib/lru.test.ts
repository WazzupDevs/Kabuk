import { describe, expect, it } from 'vitest';

import { createLru, createOrder } from './lru';

describe('createLru', () => {
  it('drops the oldest entry, not everything, when full', () => {
    const c = createLru<number>(3);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.set('d', 4);
    expect(c.size).toBe(3);
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe(2);
    expect(c.get('d')).toBe(4);
  });

  it('keeps an entry that was read recently', () => {
    const c = createLru<number>(3);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.get('a');
    c.set('d', 4);
    expect(c.get('a')).toBe(1);
    expect(c.get('b')).toBeUndefined();
  });

  it('rewriting a key does not grow it', () => {
    const c = createLru<number>(2);
    c.set('a', 1);
    c.set('a', 2);
    c.set('b', 3);
    expect(c.size).toBe(2);
    expect(c.get('a')).toBe(2);
  });
});

describe('createOrder', () => {
  it('only the newest call is the latest', () => {
    const o = createOrder();
    const a = o.next();
    const b = o.next();
    expect(o.isLatest(a)).toBe(false);
    expect(o.isLatest(b)).toBe(true);
  });
});
