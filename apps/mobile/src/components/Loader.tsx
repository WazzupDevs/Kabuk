import { useIsFocused } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';

import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  drawingFor,
  LOADER_MIN_VISIBLE_MS,
  LOADER_SHOW_AFTER_MS,
  type LoaderKind,
  loaderMotion,
  missMotion,
  STILL_MOTION,
} from '@/theme/markMotion';

import { type MarkColors, MotionMark } from './Mark';

export type { LoaderKind };

// True where every loop holds its first frame: the visual gate's states
// (features/design/gorsel/GateState.tsx), so a loader is photographed the same on every run.
export const LoopsHeld = createContext(false);

// Whether a looping animation should run: its screen is focused and the app is in the
// foreground. Loops off screen and in the background stop.
export function useLoopActive(): boolean {
  const held = useContext(LoopsHeld);
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setForeground(s === 'active'));
    return () => sub.remove();
  }, []);
  const still = useLabOff('hareket');
  return !held && focused && foreground && !still;
}

type Props = {
  // `seesaw` Tahterevalli (full-screen loading, the lobby), `swap` Kesişme (waiting for an answer,
  // "yazıyor"), `meet` Buluş (buttons, inline), `spin` Dönüş (refresh).
  kind?: LoaderKind;
  size?: number;
  // One colour, with a gap in the ground's colour around the second capsule: inside a filled button.
  mono?: { color: string; ground: string };
  // Each part's own colour (v46's loader inside a button; src/ui/Button.tsx).
  fills?: { a: string; b: string; overlap: string };
  onInk?: boolean;
  // Read by screen readers; null when a label next to it already says it.
  label?: string | null;
  // How long the wait runs before the loader shows (a quick answer shows none). A button shows its
  // loader at once, in place of its label.
  delay?: number;
};

// The skall loaders (the design system → hareket.md): one mark, only the offset changes. Shows
// after 300 ms; with reduce motion the mark stays put and breathes. Pair it with `useLoaderHold`
// where it replaces content, so a shown loader stays at least 600 ms.
export function Loader({
  kind = 'seesaw',
  size = 48,
  mono,
  fills,
  onInk,
  label = tr.common.loading,
  delay = LOADER_SHOW_AFTER_MS,
}: Props) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const [shown, setShown] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) return undefined;
    const id = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  const m = drawingFor(size);
  const motions = useMemo(() => [reduce ? STILL_MOTION : loaderMotion(kind, m)], [reduce, kind, m]);
  const colors: MarkColors = mono
    ? { mono: mono.color, ground: mono.ground }
    : fills
      ? { fills }
      : { onInk };

  return (
    <View
      accessible={label !== null}
      accessibilityRole={label !== null ? 'progressbar' : undefined}
      accessibilityLabel={label ?? undefined}
      style={{ width: size, height: size }}
    >
      {shown ? (
        <MotionMark
          // A new kind or reduce motion is a new set of loops.
          key={`${kind}:${reduce ? 'still' : 'move'}`}
          size={size}
          scene={{ m, dx: m.dx, dy: m.dy }}
          motions={motions}
          active={active}
          colors={colors}
        />
      ) : null}
    </View>
  );
}

// A request that did not meet (markMotion → missMotion), played once where its waiting mark was:
// the capsules collide without an overlap and the mark fades out, then the place stays empty. One
// run on the native driver, no loop: its last frame is already transparent, so nothing has to take
// it away (a busy JS thread cannot make it play twice).
export function MissMark({ size }: { size: number }) {
  const reduce = useReduceMotion();
  const m = drawingFor(size);
  const miss = useMemo(() => missMotion(m, reduce), [m, reduce]);
  const motions = useMemo(() => [miss.motion], [miss]);
  return (
    <View accessible={false} style={{ width: size, height: size }}>
      <MotionMark size={size} scene={miss.scene} motions={motions} once />
    </View>
  );
}

// True while `pending`, and after it for as long as a loader that showed must stay: it shows
// 300 ms into the wait and then stays at least 600 ms. A quick answer never shows one.
export function useLoaderHold(pending: boolean): boolean {
  const shownAt = useRef<number | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (pending) {
      if (shownAt.current !== null) return undefined;
      const id = setTimeout(() => {
        shownAt.current = Date.now();
        setShown(true);
      }, LOADER_SHOW_AFTER_MS);
      return () => clearTimeout(id);
    }
    if (shownAt.current === null) return undefined;
    const left = shownAt.current + LOADER_MIN_VISIBLE_MS - Date.now();
    const id = setTimeout(
      () => {
        shownAt.current = null;
        setShown(false);
      },
      Math.max(0, left),
    );
    return () => clearTimeout(id);
  }, [pending]);
  return pending || shown;
}
