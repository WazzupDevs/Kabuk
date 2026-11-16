// Süsle's pictures put on the GPU before they are shown (docs/decisions/skia-build-plani.md →
// "Dokunun önceden yüklenmesi"): a picture is made on the CPU (capsule/prepQueue.ts), and a canvas
// copied it to the GPU the first frame it drew it, every picture of a new look in that one frame
// (docs/perf/akicilik-denetimi.md → 4.12: one `RNSkia.render` of the dice 52–168 ms). Here a
// picture made for the screen (`SHOWN`) or next to the chosen one (`NEAR`) is copied ahead, one at
// a time: the next one starts only after the last one has come back (`convert` does its copy in a
// frame of its own, components/FxSkia.tsx), shown ones first, then in the order they came. The
// copy takes the picture's place under its key (`keep`) only while the store still has that very
// picture there; otherwise the copy is let go (`discard`). A newer generation drops the older
// ones' read ahead still waiting. A copy that fails leaves the picture as it is (it is drawn from
// the CPU, as before), and a build without the copy turns the queue off for good. No dependency:
// unit-tested (features/capsule/textureQueue.test.ts).

import { NEAR, type Priority, SHOWN } from './prepQueue';

export type TextureStats = {
  // Copied and kept, copied but no longer wanted, failed, dropped before they ran.
  made: number;
  discarded: number;
  failed: number;
  skipped: number;
};

export type TextureQueue<V extends object> = {
  // `value`, just made under `key` (`bytes` its size), to be copied ahead. Only `SHOWN` and
  // `NEAR`: what is read ahead and not near is left on the CPU.
  add: (key: string, value: V, bytes: number, priority: Priority, gen: number) => void;
  // A drawing waits for `key` now: first.
  bump: (key: string, priority: Priority) => void;
  // Waiting for its copy (queued or on its way).
  waiting: (key: string) => boolean;
  // `value` would be copied if it were added (the queue on, its copy not failed before).
  wants: (value: V) => boolean;
  // Runs `fn` once `value` is not being copied (at once, or when its copy answers): a picture is
  // let go only after the copy has finished reading it.
  whenLanded: (value: V, fn: () => void) => void;
  // Every job still queued goes (Süsle closed, the switch off); a copy on its way is let go when
  // it comes back (its picture is no longer the store's).
  clear: () => void;
  // Told when a job ends (copied, failed, dropped).
  watch: (listener: () => void) => () => void;
  stats: () => TextureStats;
  readonly pending: number;
  // A build without the copy: nothing is queued any more.
  readonly off: boolean;
};

type Job<V> = {
  key: string;
  value: V;
  bytes: number;
  priority: Priority;
  gen: number;
  seq: number;
};

export function createTextureQueue<V extends object>({
  current,
  convert,
  keep,
  discard,
  schedule,
  enabled,
}: {
  // What the store has under `key` now.
  current: (key: string) => V | undefined;
  // Copies `value`; `done` once, with the copy, or null (failed; `unsupported`: never possible).
  convert: (value: V, done: (made: V | null, unsupported?: boolean) => void) => void;
  keep: (key: string, made: V, bytes: number) => void;
  discard: (made: V) => void;
  // Runs `run` later (the next job: never in the same call as the last one's end).
  schedule: (run: () => void) => void;
  enabled: () => boolean;
}): TextureQueue<V> {
  const jobs = new Map<string, Job<V>>();
  const listeners = new Set<() => void>();
  const stats: TextureStats = { made: 0, discarded: 0, failed: 0, skipped: 0 };
  // Pictures whose copy failed: not tried again.
  const failed = new WeakSet<V>();
  let flying: Job<V> | null = null;
  // What waits for the copy on its way to answer.
  let landing: (() => void)[] = [];
  let armed = false;
  let off = false;
  let generation = 0;
  let seq = 0;

  const wants = (value: V) => !off && !failed.has(value) && enabled();

  const tell = () => {
    for (const l of [...listeners]) l();
  };

  const drop = () => {
    if (jobs.size === 0) return;
    stats.skipped += jobs.size;
    jobs.clear();
    tell();
  };

  const pick = (): Job<V> | undefined => {
    let best: Job<V> | undefined;
    for (const j of jobs.values()) {
      if (!best || j.priority < best.priority || (j.priority === best.priority && j.seq < best.seq))
        best = j;
    }
    return best;
  };

  const arm = () => {
    if (armed || flying || off || jobs.size === 0) return;
    armed = true;
    schedule(() => {
      armed = false;
      run();
    });
  };

  const run = () => {
    if (flying || off) return;
    if (!enabled()) {
      drop();
      return;
    }
    let dropped = false;
    for (;;) {
      const j = pick();
      if (!j) break;
      jobs.delete(j.key);
      // Gone, or another picture under the key since: nothing to copy.
      if (current(j.key) !== j.value) {
        stats.skipped += 1;
        dropped = true;
        continue;
      }
      flying = j;
      let answered = false;
      convert(j.value, (made, unsupported) => {
        if (answered) return;
        answered = true;
        flying = null;
        const landed = landing;
        landing = [];
        if (unsupported) {
          off = true;
          stats.skipped += jobs.size;
          jobs.clear();
        }
        if (!made) {
          stats.failed += 1;
          failed.add(j.value);
        } else if (current(j.key) === j.value) {
          stats.made += 1;
          keep(j.key, made, j.bytes);
        } else {
          stats.discarded += 1;
          discard(made);
        }
        for (const fn of landed) fn();
        tell();
        arm();
      });
      break;
    }
    if (dropped) tell();
  };

  return {
    add(key, value, bytes, priority, gen) {
      if (priority > NEAR || !wants(value)) return;
      if (gen > generation) {
        generation = gen;
        // The older generations' read ahead still queued goes; what is shown stays.
        for (const [k, j] of [...jobs]) {
          if (j.priority !== SHOWN && j.gen < gen) {
            jobs.delete(k);
            stats.skipped += 1;
          }
        }
      }
      if (flying?.key === key && flying.value === value) return;
      const old = jobs.get(key);
      seq += 1;
      jobs.set(key, {
        key,
        value,
        bytes,
        priority: old && old.priority < priority ? old.priority : priority,
        gen: Math.max(gen, old?.gen ?? gen),
        seq: old?.seq ?? seq,
      });
      if (!old) tell();
      arm();
    },
    bump(key, priority) {
      const j = jobs.get(key);
      if (j && priority < j.priority) j.priority = priority;
    },
    waiting: (key) => jobs.has(key) || flying?.key === key,
    wants,
    whenLanded(value, fn) {
      if (flying?.value === value) landing.push(fn);
      else fn();
    },
    clear: drop,
    watch(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    stats: () => ({ ...stats }),
    get pending() {
      return jobs.size + (flying ? 1 : 0);
    },
    get off() {
      return off;
    },
  };
}
