import { useEffect, useRef, useState } from 'react';

import type { FriendReaction } from './SignupFriend';

// A step's friend: its reaction (jump, nod, shake), whether a field is being typed in, and a burst.
// `react` plays a reaction; `onFocus`/`onBlur` go on the step's fields.
export function useFriend() {
  const [reaction, setReaction] = useState<FriendReaction | null>(null);
  const [looking, setLooking] = useState(false);
  const [puffKey, setPuffKey] = useState<number | undefined>(undefined);
  return {
    reaction,
    looking,
    puffKey,
    react: (kind: FriendReaction['kind']) => setReaction((r) => ({ kind, key: (r?.key ?? 0) + 1 })),
    puff: () => setPuffKey((k) => (k ?? 0) + 1),
    onFocus: () => setLooking(true),
    onBlur: () => setLooking(false),
  };
}

// The friend shakes its head when an error text appears or changes, never without one (v45 §3).
export function useShakeOnError(error: string | null | undefined, shake: () => void) {
  const last = useRef<string | null | undefined>(null);
  useEffect(() => {
    if (error && error !== last.current) shake();
    last.current = error;
  }, [error, shake]);
}

// The friend jumps once when `done` turns true (a valid number, a set date).
export function useJumpWhen(done: boolean, jump: () => void) {
  const was = useRef(done);
  useEffect(() => {
    if (done && !was.current) jump();
    was.current = done;
  }, [done, jump]);
}
