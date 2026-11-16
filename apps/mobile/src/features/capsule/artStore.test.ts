import { describe, expect, it } from 'vitest';

import { createArtStore } from '../../capsule/artStore';

function store(budget: number) {
  const dropped: string[] = [];
  const s = createArtStore<string>({ budget, drop: (_v, key) => dropped.push(key) });
  return { s, dropped };
}

describe('createArtStore', () => {
  it('drops the oldest over its byte limit, not by count', () => {
    const { s, dropped } = store(100);
    s.put('a', 'A', 40);
    s.put('b', 'B', 40);
    s.put('c', 'C', 10);
    expect(s.size).toBe(3);
    s.put('d', 'D', 40);
    expect(dropped).toEqual(['a']);
    expect(s.has('a')).toBe(false);
    expect(s.bytes).toBe(90);
  });

  it('keeps what a drawing holds over the limit', () => {
    const { s, dropped } = store(100);
    s.put('a', 'A', 60);
    s.acquire('a');
    s.put('b', 'B', 60);
    expect(s.has('a')).toBe(true);
    // The newest unheld one goes instead: the held one stays even over the limit.
    expect(dropped).toEqual(['b']);
    s.put('c', 'C', 60);
    expect(s.has('a')).toBe(true);
    expect(s.bytes).toBe(60);
  });

  it('holds a key before it is made', () => {
    const { s } = store(50);
    s.acquire('a');
    s.put('a', 'A', 60);
    expect(s.has('a')).toBe(true);
  });

  it('throws nothing out on release: the next put trims', () => {
    const { s, dropped } = store(100);
    s.put('a', 'A', 80);
    s.acquire('a');
    s.acquire('b');
    s.put('b', 'B', 80);
    s.release('a');
    expect(dropped).toEqual([]);
    s.acquire('a');
    s.release('a');
    s.put('c', 'C', 10);
    expect(dropped).toEqual(['a']);
    expect(s.has('b')).toBe(true);
  });

  it('a held key is the last of the unheld ones once let go', () => {
    const { s, dropped } = store(100);
    s.put('a', 'A', 30);
    s.put('b', 'B', 30);
    s.acquire('a');
    s.release('a');
    s.put('c', 'C', 50);
    expect(dropped).toEqual(['b']);
  });

  it('reading changes nothing', () => {
    const { s, dropped } = store(100);
    s.put('a', 'A', 50);
    s.put('b', 'B', 50);
    expect(s.peek('a')).toBe('A');
    expect(s.has('a')).toBe(true);
    s.put('c', 'C', 10);
    expect(dropped).toEqual(['a']);
  });

  it('counts uses', () => {
    const { s } = store(100);
    s.acquire('a');
    s.acquire('a');
    expect(s.uses('a')).toBe(2);
    s.release('a');
    s.release('a');
    expect(s.uses('a')).toBe(0);
  });

  it('drops what nothing holds when asked, and tells its listeners', () => {
    const { s, dropped } = store(1000);
    let told = 0;
    const off = s.subscribe(() => {
      told += 1;
    });
    s.put('a', 'image', 10);
    s.put('b', 'uri', 10);
    s.put('c', 'image', 10);
    s.acquire('c');
    told = 0;
    s.dropUnused((v) => v === 'image');
    expect(dropped).toEqual(['a']);
    expect(s.has('b')).toBe(true);
    expect(s.has('c')).toBe(true);
    expect(told).toBe(1);
    off();
    s.put('d', 'x', 1);
    expect(told).toBe(1);
  });

  it('a new value for a key lets the old one go', () => {
    const { s, dropped } = store(100);
    s.put('a', 'A', 10);
    s.put('a', 'A2', 20);
    expect(dropped).toEqual(['a']);
    expect(s.bytes).toBe(20);
    expect(s.peek('a')).toBe('A2');
  });
});
