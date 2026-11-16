// What Süsle prepares, in order, a few at a time (docs/decisions/skia-build-plani.md → "Bütün kapsül
// Skia'da"): one job makes one resource, and none is made in a render. A drawing on the screen
// that waits for its resource asks for it (`want`, first, at once); what is read ahead (`ahead`)
// belongs to a generation, and a new generation (a new choice) drops the older one's jobs that
// nothing wants, never a resource already made. The same key is not queued twice, and a key
// already made (`isDone`) is not made again. Each turn runs at least one job and goes on while its
// turn lasts (an idle call's deadline), at most `perSlice`. No dependency: unit-tested
// (features/capsule/prepQueue.test.ts).

// Shown (a drawing waits for it), next to the chosen one, the rest.
export const SHOWN = 0;
export const NEAR = 1;
export const REST = 2;
export type Priority = typeof SHOWN | typeof NEAR | typeof REST;

export type Deadline = { timeRemaining: () => number };
export type PrepStats = {
  // Made, found made already, dropped before they ran, thrown while made, ms spent making.
  prepared: number;
  cached: number;
  cancelled: number;
  failed: number;
  ms: number;
};

export type PrepQueue = {
  // A drawing waits for `key`: first, at once. Its return lets go of the wish (a job nothing else
  // wants and no generation reads ahead goes).
  want: (key: string, run: () => void, priority?: Priority) => () => void;
  // Read ahead in generation `gen` (from `next`). `once`: a job that leaves nothing in the store
  // under its key (it finds what to make and queues it): remembered as done (`remember` of them at
  // most), so the next generations do not run it again.
  ahead: (key: string, run: () => void, priority: Priority, gen: number, once?: boolean) => void;
  // Forgets the jobs remembered as done (Süsle closed: what they queued is let go).
  forget: () => void;
  // A new generation: the older ones' jobs nothing wants are dropped.
  next: () => number;
  // Made here and now unless made already (a drawing with nothing to show yet).
  now: (key: string, run: () => void) => void;
  stats: () => PrepStats;
  readonly pending: number;
  // The generation now (what reads ahead with the last `next`).
  readonly generation: number;
};

type Job = {
  key: string;
  once: boolean;
  run: () => void;
  priority: Priority;
  seq: number;
  wants: number;
  // The newest generation that reads it ahead; null when only wants hold it.
  gen: number | null;
};

export function createPrepQueue({
  isDone,
  schedule,
  now: clock,
  perSlice = 8,
  remember = 2000,
  onFail,
}: {
  isDone: (key: string) => boolean;
  // Runs `slice` later: at once (`urgent`: a drawing waits) or in idle time.
  schedule: (slice: (deadline: Deadline) => void, urgent: boolean) => void;
  // Timing, only where it is read (the drawing lab, development): undefined costs nothing.
  now?: () => number;
  perSlice?: number;
  remember?: number;
  // Told of a job that threw (its key only: no text of what it made), after it is counted.
  onFail?: (key: string) => void;
}): PrepQueue {
  const jobs = new Map<string, Job>();
  const stats: PrepStats = { prepared: 0, cached: 0, cancelled: 0, failed: 0, ms: 0 };
  // The `once` jobs done, oldest first.
  const ran = new Set<string>();
  const done = (key: string) => ran.has(key) || isDone(key);
  let generation = 0;
  let seq = 0;
  let urgentArmed = false;
  let idleArmed = false;

  const stale = (j: Job) => j.wants <= 0 && (j.gen === null || j.gen < generation);

  const pick = (): Job | undefined => {
    let best: Job | undefined;
    for (const j of jobs.values()) {
      if (!best || j.priority < best.priority || (j.priority === best.priority && j.seq < best.seq))
        best = j;
    }
    return best;
  };

  const runJob = (j: Job) => {
    const t0 = clock?.();
    try {
      j.run();
      stats.prepared += 1;
      if (j.once) {
        ran.add(j.key);
        if (ran.size > remember) {
          const oldest = ran.values().next();
          if (!oldest.done) ran.delete(oldest.value);
        }
      }
    } catch {
      // A job lets nothing escape (it keeps its failure as a value); one that does is counted,
      // and told (the drawing lab, development). The queue goes on with the next one.
      stats.failed += 1;
      onFail?.(j.key);
    }
    if (clock && t0 !== undefined) stats.ms += clock() - t0;
  };

  const arm = () => {
    if (jobs.size === 0) return;
    let urgent = false;
    for (const j of jobs.values()) {
      if (j.priority === SHOWN) {
        urgent = true;
        break;
      }
    }
    if (urgent && !urgentArmed) {
      urgentArmed = true;
      schedule((d) => {
        urgentArmed = false;
        slice(d);
      }, true);
    } else if (!urgent && !urgentArmed && !idleArmed) {
      idleArmed = true;
      schedule((d) => {
        idleArmed = false;
        slice(d);
      }, false);
    }
  };

  const slice = (deadline: Deadline) => {
    let made = 0;
    while (made < perSlice) {
      const j = pick();
      if (!j) break;
      jobs.delete(j.key);
      if (done(j.key)) {
        stats.cached += 1;
        continue;
      }
      runJob(j);
      made += 1;
      if (deadline.timeRemaining() <= 0) break;
    }
    arm();
  };

  const add = (
    key: string,
    run: () => void,
    priority: Priority,
    wants: number,
    gen: number | null,
    once = false,
  ) => {
    seq += 1;
    jobs.set(key, { key, once, run, priority, seq, wants, gen });
  };

  return {
    want(key, run, priority = SHOWN) {
      if (isDone(key)) {
        stats.cached += 1;
        return () => undefined;
      }
      const j = jobs.get(key);
      if (j) {
        j.wants += 1;
        if (priority < j.priority) j.priority = priority;
      } else add(key, run, priority, 1, null);
      arm();
      let held = true;
      return () => {
        if (!held) return;
        held = false;
        const job = jobs.get(key);
        if (!job) return;
        job.wants -= 1;
        if (stale(job)) {
          jobs.delete(key);
          stats.cancelled += 1;
        }
      };
    },
    ahead(key, run, priority, gen, once = false) {
      if (gen < generation) {
        stats.cancelled += 1;
        return;
      }
      if (done(key)) {
        stats.cached += 1;
        return;
      }
      const j = jobs.get(key);
      if (j) {
        if (priority < j.priority) j.priority = priority;
        if (j.gen === null || j.gen < gen) j.gen = gen;
      } else add(key, run, priority, 0, gen, once);
      arm();
    },
    forget() {
      ran.clear();
    },
    next() {
      generation += 1;
      for (const [key, j] of [...jobs]) {
        if (!stale(j)) continue;
        jobs.delete(key);
        stats.cancelled += 1;
      }
      return generation;
    },
    now(key, run) {
      if (isDone(key)) {
        stats.cached += 1;
        return;
      }
      const j = jobs.get(key);
      jobs.delete(key);
      runJob(j ?? { key, once: false, run, priority: SHOWN, seq: 0, wants: 0, gen: null });
    },
    stats: () => ({ ...stats }),
    get pending() {
      return jobs.size;
    },
    get generation() {
      return generation;
    },
  };
}
