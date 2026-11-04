import { useCallback, useRef, useState } from 'react';

import { type Dated, mergeOlder, olderBefore, rereadOlder } from '@/lib/olderPages';

type OlderState<T> = {
  key: string;
  older: T[];
  // The first older page's `before` (src/lib/olderPages.ts → mergeOlder).
  until: string | null;
  done: boolean;
  loading: boolean;
  failed: boolean;
};
const fresh = <T>(key: string): OlderState<T> => ({
  key,
  older: [],
  until: null,
  done: false,
  loading: false,
  failed: false,
});

// The older pages of a chat (src/lib/olderPages.ts): `newest` is the chat's live page, oldest
// first; `read(before)` one older page, oldest first. `key` names the chat: a new one starts with
// no older pages.
export function useOlderPages<T>({
  key,
  newest,
  pageSize,
  dated,
  read,
}: {
  key: string;
  newest: readonly T[] | undefined;
  pageSize: number;
  dated: (item: T) => Dated;
  read: (before: string) => Promise<T[]>;
}) {
  const [state, setState] = useState<OlderState<T>>(() => fresh(key));
  // A gap (src/lib/olderPages.ts → mergeOlder): the older pages are dropped, and the next read
  // starts again before the newest page.
  const own = state.key === key ? state : fresh<T>(key);
  const merged = mergeOlder(newest ?? [], own.older, own.until, dated, pageSize);
  const current = merged.gap ? fresh<T>(key) : own;
  const { rows } = merged;

  const before = newest ? olderBefore(newest, current.older, dated, pageSize, current.done) : null;
  const busy = current.loading;
  const kept = state.key === key && !merged.gap;
  const fetchOlder = useCallback(() => {
    if (before === null || busy) return;
    setState((s) => ({
      ...(kept && s.key === key ? s : fresh<T>(key)),
      until: kept && s.key === key && s.until !== null ? s.until : before,
      loading: true,
      failed: false,
    }));
    read(before).then(
      (page) => {
        setState((s) =>
          s.key === key
            ? { ...s, older: [...page, ...s.older], done: page.length < pageSize, loading: false }
            : s,
        );
      },
      () => {
        setState((s) => (s.key === key ? { ...s, loading: false, failed: true } : s));
      },
    );
  }, [before, busy, kept, key, pageSize, read]);

  // The list's top reached: the next page, unless the last read failed (then only "Tekrar dene").
  const failed = current.failed;
  const loadOlder = useCallback(() => {
    if (!failed) fetchOlder();
  }, [failed, fetchOlder]);

  // A message gone from the chat (its sender deleted it): out of the older pages too.
  const forget = useCallback(
    (id: string) => setState((s) => ({ ...s, older: s.older.filter((m) => dated(m).id !== id) })),
    [dated],
  );

  // A reaction moved or a sender deleted a message (the chat's broadcast): the older pages on the
  // screen are read again (src/lib/olderPages.ts → rereadOlder). One read at a time; broadcasts
  // heard meanwhile make one more read after it.
  const rereading = useRef<'idle' | 'busy' | 'again'>('idle');
  const until = kept ? current.until : null;
  const oldest = current.older[0];
  const oldestAt = oldest === undefined ? null : dated(oldest).at;
  const reread = useCallback(() => {
    if (until === null || oldestAt === null) return;
    if (rereading.current !== 'idle') {
      rereading.current = 'again';
      return;
    }
    rereading.current = 'busy';
    const run = (): void => {
      rereadOlder(read, until, oldestAt, dated, pageSize).then(
        (again) => {
          const from = again.older[0];
          setState((s) =>
            s.key === key && s.until === until
              ? {
                  ...s,
                  // Pages read further back meanwhile stay, before what was read again.
                  older: [
                    ...(from === undefined
                      ? []
                      : s.older.filter((m) => dated(m).at < dated(from).at)),
                    ...again.older,
                  ],
                  done: s.done || again.done,
                }
              : s,
          );
          if (rereading.current === 'again') {
            rereading.current = 'busy';
            run();
          } else rereading.current = 'idle';
        },
        // Not read: the pages stay as they were; the next broadcast tries again.
        () => {
          rereading.current = 'idle';
        },
      );
    };
    run();
  }, [until, oldestAt, read, dated, pageSize, key]);

  return {
    rows,
    forget,
    reread,
    loadOlder,
    retryOlder: fetchOlder,
    loadingOlder: current.loading,
    olderFailed: current.failed,
  };
}
