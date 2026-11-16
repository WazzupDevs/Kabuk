import { describe, expect, it } from 'vitest';

import { NEAR, REST, SHOWN } from '../../capsule/prepQueue';
import { createTextureQueue } from '../../capsule/textureQueue';

type Pic = { id: string; gpu?: true };

function setup({ on = true }: { on?: boolean } = {}) {
  const store = new Map<string, Pic>();
  const calls: Pic[] = [];
  const answers: ((made: Pic | null, unsupported?: boolean) => void)[] = [];
  const kept: string[] = [];
  const discarded: Pic[] = [];
  let later: (() => void)[] = [];
  let enabled = on;
  const q = createTextureQueue<Pic>({
    current: (key) => store.get(key),
    convert: (value, done) => {
      calls.push(value);
      answers.push(done);
    },
    keep: (key, made) => {
      store.set(key, made);
      kept.push(key);
    },
    discard: (made) => discarded.push(made),
    schedule: (run) => later.push(run),
    enabled: () => enabled,
  });
  // One turn of the scheduler (a frame).
  const tick = () => {
    const runs = later;
    later = [];
    for (const r of runs) r();
  };
  const put = (key: string) => {
    const p = { id: key };
    store.set(key, p);
    return p;
  };
  const answer = (unsupported = false, ok = true) => {
    const done = answers.shift();
    const from = calls[calls.length - 1];
    done?.(ok && from ? { id: from.id, gpu: true } : null, unsupported);
  };
  return {
    q,
    store,
    calls,
    kept,
    discarded,
    tick,
    put,
    answer,
    setEnabled: (v: boolean) => {
      enabled = v;
    },
  };
}

describe('textureQueue', () => {
  it('copies one picture at a time: the next only after the last has answered', () => {
    const t = setup();
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    t.q.add('b', t.put('b'), 4, SHOWN, 0);
    t.tick();
    t.tick();
    expect(t.calls.map((c) => c.id)).toEqual(['a']);
    t.answer();
    // Its answer does not start the next one in the same call.
    expect(t.calls).toHaveLength(1);
    t.tick();
    expect(t.calls.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('takes the shown first, then the near ones, in the order they came', () => {
    const t = setup();
    t.q.add('n1', t.put('n1'), 4, NEAR, 0);
    t.q.add('s1', t.put('s1'), 4, SHOWN, 0);
    t.q.add('n2', t.put('n2'), 4, NEAR, 0);
    t.q.add('s2', t.put('s2'), 4, SHOWN, 0);
    const order: string[] = [];
    for (let i = 0; i < 4; i++) {
      t.tick();
      order.push(t.calls[t.calls.length - 1]?.id ?? '');
      t.answer();
    }
    expect(order).toEqual(['s1', 's2', 'n1', 'n2']);
  });

  it('a near one wanted on the screen goes first', () => {
    const t = setup();
    t.q.add('n1', t.put('n1'), 4, NEAR, 0);
    t.q.add('n2', t.put('n2'), 4, NEAR, 0);
    t.q.bump('n2', SHOWN);
    t.tick();
    expect(t.calls[0]?.id).toBe('n2');
  });

  it('leaves what is read ahead and not near on the CPU', () => {
    const t = setup();
    t.q.add('r', t.put('r'), 4, REST, 0);
    expect(t.q.waiting('r')).toBe(false);
    t.tick();
    expect(t.calls).toHaveLength(0);
  });

  it('puts the copy in the picture’s place, and waits for it until then', () => {
    const t = setup();
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    expect(t.q.waiting('a')).toBe(true);
    t.tick();
    expect(t.q.waiting('a')).toBe(true);
    t.answer();
    expect(t.kept).toEqual(['a']);
    expect(t.store.get('a')?.gpu).toBe(true);
    expect(t.q.waiting('a')).toBe(false);
  });

  it('lets the copy go when its picture left the store while it was made', () => {
    const t = setup();
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    t.tick();
    t.store.delete('a');
    t.answer();
    expect(t.kept).toEqual([]);
    expect(t.discarded.map((d) => d.id)).toEqual(['a']);
  });

  it('lets the copy go when another picture took the key meanwhile', () => {
    const t = setup();
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    t.tick();
    t.put('a');
    t.answer();
    expect(t.discarded).toHaveLength(1);
    expect(t.store.get('a')?.gpu).toBeUndefined();
  });

  it('skips a job whose picture is gone before it runs', () => {
    const t = setup();
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    t.store.delete('a');
    t.tick();
    expect(t.calls).toHaveLength(0);
    expect(t.q.stats().skipped).toBe(1);
  });

  it('a newer generation drops the older read ahead, never what is shown', () => {
    const t = setup();
    t.q.add('n1', t.put('n1'), 4, NEAR, 1);
    t.q.add('s1', t.put('s1'), 4, SHOWN, 1);
    t.q.add('n2', t.put('n2'), 4, NEAR, 2);
    expect(t.q.waiting('n1')).toBe(false);
    expect(t.q.waiting('s1')).toBe(true);
    expect(t.q.waiting('n2')).toBe(true);
  });

  it('a failed copy leaves the picture as it is, and is not tried again', () => {
    const t = setup();
    const a = t.put('a');
    t.q.add('a', a, 4, SHOWN, 0);
    t.tick();
    t.answer(false, false);
    expect(t.store.get('a')).toBe(a);
    expect(t.q.waiting('a')).toBe(false);
    expect(t.q.wants(a)).toBe(false);
    t.q.add('a', a, 4, SHOWN, 0);
    expect(t.q.waiting('a')).toBe(false);
  });

  it('a build without the copy turns the queue off for good', () => {
    const t = setup();
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    t.q.add('b', t.put('b'), 4, SHOWN, 0);
    t.tick();
    t.answer(true, false);
    expect(t.q.off).toBe(true);
    expect(t.q.waiting('b')).toBe(false);
    t.q.add('c', t.put('c'), 4, SHOWN, 0);
    t.tick();
    expect(t.calls).toHaveLength(1);
  });

  it('switched off: nothing is queued, and what waited goes', () => {
    const t = setup({ on: false });
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    expect(t.q.waiting('a')).toBe(false);
    t.setEnabled(true);
    t.q.add('b', t.put('b'), 4, SHOWN, 0);
    t.setEnabled(false);
    t.tick();
    expect(t.calls).toHaveLength(0);
    expect(t.q.waiting('b')).toBe(false);
  });

  it('cleared (Süsle closed): the queued go, the one on its way is let go when it answers', () => {
    const t = setup();
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    t.q.add('b', t.put('b'), 4, SHOWN, 0);
    t.tick();
    t.q.clear();
    t.store.clear();
    expect(t.q.waiting('b')).toBe(false);
    t.answer();
    expect(t.discarded.map((d) => d.id)).toEqual(['a']);
    t.tick();
    expect(t.calls).toHaveLength(1);
  });

  it('a picture is let go only after its copy has read it', () => {
    const t = setup();
    const a = t.put('a');
    t.q.add('a', a, 4, SHOWN, 0);
    t.tick();
    const gone: string[] = [];
    t.q.whenLanded(a, () => gone.push('a'));
    expect(gone).toEqual([]);
    t.answer();
    expect(gone).toEqual(['a']);
    t.q.whenLanded({ id: 'x' }, () => gone.push('x'));
    expect(gone).toEqual(['a', 'x']);
  });

  it('tells its listeners when a job is queued and when it ends', () => {
    const t = setup();
    let told = 0;
    const off = t.q.watch(() => {
      told += 1;
    });
    t.q.add('a', t.put('a'), 4, SHOWN, 0);
    expect(told).toBe(1);
    t.tick();
    t.answer();
    expect(told).toBe(2);
    off();
    t.q.add('b', t.put('b'), 4, SHOWN, 0);
    expect(told).toBe(2);
  });
});
