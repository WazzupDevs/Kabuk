import { describe, expect, it } from 'vitest';

import { createPrepQueue, type Deadline, NEAR, REST, SHOWN } from '../../capsule/prepQueue';

// A queue whose turns run when the test says, with as much time as it says.
function queue(perSlice = 8) {
  const done = new Set<string>();
  const ran: string[] = [];
  const turns: { slice: (d: Deadline) => void; urgent: boolean }[] = [];
  const q = createPrepQueue({
    isDone: (key) => done.has(key),
    schedule: (slice, urgent) => turns.push({ slice, urgent }),
    perSlice,
  });
  const job = (key: string) => () => {
    ran.push(key);
    done.add(key);
  };
  const turn = (time = Infinity) => {
    const t = turns.shift();
    t?.slice({ timeRemaining: () => time });
    return t;
  };
  const all = () => {
    while (turns.length) turn();
  };
  return { q, done, ran, turns, job, turn, all };
}

describe('createPrepQueue', () => {
  it('runs what is shown first, then what is near, then the rest', () => {
    const { q, ran, job, all } = queue();
    const gen = q.next();
    q.ahead('r1', job('r1'), REST, gen);
    q.ahead('n1', job('n1'), NEAR, gen);
    q.want('s1', job('s1'));
    q.ahead('n2', job('n2'), NEAR, gen);
    all();
    expect(ran).toEqual(['s1', 'n1', 'n2', 'r1']);
  });

  it('asks for an urgent turn when a drawing waits, an idle one otherwise', () => {
    const { q, job, turns } = queue();
    q.ahead('a', job('a'), REST, q.next());
    expect(turns.map((t) => t.urgent)).toEqual([false]);
    q.want('b', job('b'));
    expect(turns.map((t) => t.urgent)).toEqual([false, true]);
  });

  it('a new generation drops what the last one read ahead, not what is made or wanted', () => {
    const { q, ran, job, all, turn, done } = queue(1);
    const g1 = q.next();
    q.ahead('a', job('a'), NEAR, g1);
    q.ahead('b', job('b'), NEAR, g1);
    q.want('w', job('w'));
    turn();
    expect(ran).toEqual(['w']);
    turn();
    expect(ran).toEqual(['w', 'a']);
    const g2 = q.next();
    q.ahead('c', job('c'), NEAR, g2);
    // An old generation's late job is not queued.
    q.ahead('d', job('d'), NEAR, g1);
    all();
    expect(ran).toEqual(['w', 'a', 'c']);
    expect(done.has('a')).toBe(true);
    expect(q.stats().cancelled).toBe(2);
  });

  it('a wanted job outlives the generations', () => {
    const { q, ran, job, all } = queue();
    q.want('w', job('w'));
    q.next();
    q.next();
    all();
    expect(ran).toEqual(['w']);
  });

  it('a job nothing wants any more goes', () => {
    const { q, ran, job, all } = queue();
    const off = q.want('w', job('w'));
    off();
    off();
    all();
    expect(ran).toEqual([]);
    expect(q.stats().cancelled).toBe(1);
  });

  it('a job read ahead and wanted stays when the wish goes', () => {
    const { q, ran, job, all } = queue();
    const gen = q.next();
    q.ahead('a', job('a'), REST, gen);
    const off = q.want('a', job('a'));
    off();
    all();
    expect(ran).toEqual(['a']);
  });

  it('never makes the same key twice', () => {
    const { q, ran, job, all } = queue();
    const gen = q.next();
    q.ahead('a', job('a'), REST, gen);
    q.ahead('a', job('a'), NEAR, gen);
    q.want('a', job('a'));
    all();
    q.ahead('a', job('a'), REST, gen);
    q.want('a', job('a'));
    q.now('a', job('a'));
    all();
    expect(ran).toEqual(['a']);
    expect(q.stats().prepared).toBe(1);
    expect(q.stats().cached).toBe(3);
  });

  it('a wish raises the queued job to the front', () => {
    const { q, ran, job, all } = queue();
    const gen = q.next();
    q.ahead('a', job('a'), REST, gen);
    q.ahead('b', job('b'), REST, gen);
    q.want('b', job('b'), SHOWN);
    all();
    expect(ran).toEqual(['b', 'a']);
  });

  it('runs one job at least each turn, more while the turn lasts, at most perSlice', () => {
    const { q, ran, job, turn } = queue(3);
    const gen = q.next();
    for (const k of ['a', 'b', 'c', 'd', 'e']) q.ahead(k, job(k), REST, gen);
    turn(0);
    expect(ran).toEqual(['a']);
    turn();
    expect(ran).toEqual(['a', 'b', 'c', 'd']);
    turn();
    expect(ran).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(q.pending).toBe(0);
  });

  it('makes one now, out of its turn', () => {
    const { q, ran, job, all } = queue();
    const gen = q.next();
    q.ahead('a', job('a'), REST, gen);
    q.now('a', job('a'));
    expect(ran).toEqual(['a']);
    all();
    expect(ran).toEqual(['a']);
  });

  it('a job that throws does not stop the queue', () => {
    const { q, ran, job, all } = queue();
    const gen = q.next();
    q.ahead(
      'x',
      () => {
        throw new Error('x');
      },
      NEAR,
      gen,
    );
    q.ahead('a', job('a'), REST, gen);
    all();
    expect(ran).toEqual(['a']);
    expect(q.stats().failed).toBe(1);
  });

  it('times its jobs only with a clock', () => {
    let t = 0;
    const q = createPrepQueue({
      isDone: () => false,
      schedule: (slice) => slice({ timeRemaining: () => 1 }),
      now: () => t,
    });
    q.ahead(
      'a',
      () => {
        t += 5;
      },
      REST,
      q.next(),
    );
    expect(q.stats().ms).toBe(5);
  });
});
