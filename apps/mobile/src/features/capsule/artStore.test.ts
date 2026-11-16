import { describe, expect, it } from 'vitest';

import { createArtStore } from '../../capsule/artStore';

function store(budget: number) {
  const dropped: string[] = [];
  const s = createArtStore<string>({
    limits: { x: { bytes: budget } },
    classOf: () => 'x',
    drop: (_v, key) => dropped.push(key),
  });
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
    expect(s.bytes()).toBe(90);
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
    expect(s.bytes()).toBe(60);
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
    const off = s.watch(['a', 'd'], () => {
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

  it('tells a listener of its own keys only', () => {
    const { s } = store(1000);
    let told = 0;
    s.watch(['a'], () => {
      told += 1;
    });
    s.put('b', 'B', 1);
    expect(told).toBe(0);
    s.put('a', 'A', 1);
    expect(told).toBe(1);
  });

  it('a kind under its own limit: tiles read ahead never push the pictures out', () => {
    const dropped: string[] = [];
    const s = createArtStore<string>({
      limits: { picture: { bytes: 100 }, tile: { bytes: 30, entries: 2 } },
      classOf: (v) => (v.startsWith('uri') ? 'tile' : 'picture'),
      drop: (_v, key) => dropped.push(key),
    });
    s.put('near1', 'image', 50);
    s.put('near2', 'image', 50);
    for (let i = 0; i < 10; i++) s.put(`t${i}`, 'uri', 10);
    expect(s.has('near1')).toBe(true);
    expect(s.has('near2')).toBe(true);
    expect(s.bytes('picture')).toBe(100);
    // The tiles keep to their entries' limit too.
    expect(s.bytes('tile')).toBe(20);
    expect(dropped).toEqual(['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7']);
  });

  it('a new value for a key lets the old one go', () => {
    const { s, dropped } = store(100);
    s.put('a', 'A', 10);
    s.put('a', 'A2', 20);
    expect(dropped).toEqual(['a']);
    expect(s.bytes()).toBe(20);
    expect(s.peek('a')).toBe('A2');
  });
});

describe('stamps', () => {
  it('a value put again under its key gets a new stamp and keeps its bytes counted once', () => {
    const { s } = store(100);
    expect(s.stamp('a')).toBe(0);
    s.put('a', 'A', 40);
    const first = s.stamp('a');
    expect(first).toBeGreaterThan(0);
    expect(s.bytesOf('a')).toBe(40);
    s.acquire('a');
    s.put('a', 'A2', 40);
    expect(s.stamp('a')).not.toBe(first);
    expect(s.peek('a')).toBe('A2');
    expect(s.bytes()).toBe(40);
    // Still held: the count is the key's, whatever value it has.
    expect(s.uses('a')).toBe(1);
    expect(s.bytesOf('b')).toBe(0);
  });
});
