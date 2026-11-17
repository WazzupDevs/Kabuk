import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Animated, type StyleProp, View, type ViewStyle } from 'react-native';
import Reanimated, {
  Easing,
  LayoutAnimationConfig,
  makeMutable,
  type SharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { springConfig } from '@/aura/motion';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { type Bezier, MOTION } from '@/theme/aura';

// A list's rows after a press changed it (the motion table's A3: Mesajlar's Sabitle, Arşivle and
// Sohbeti sil). Before the change each row's place in the list is noted; after it, a row standing
// elsewhere slides from its old place to its new one on springs.morph (3.1, 3.3), a row that left
// fades and shrinks out (3.2), the rows under it closing the gap once it is gone. Only a change the
// press made moves anything: a search, a refresh or a new message still put rows in place at once.
// Everything in place at once with reduce motion.

const curve = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);
const LEAVE = curve(MOTION.curves.leave);
const ARRIVE = curve(MOTION.curves.arrive);
const SWAP = curve(MOTION.curves.swap);
const OUT_MS = MOTION.dissolve.outMs;
// The press's change usually lands with the inbox read again (onSettled): the rows keep their noted
// places that long after the call settled, then stop listening.
const SETTLE_MS = 3000;

// 'move': rows change places (Sabitle, Sabitlemeyi kaldır). 'leave': a row goes and the ones under
// it close up (Arşivle, Arşivden çıkar, Sohbeti sil).
export type ListMoveKind = 'move' | 'leave';
// When what was pressed has closed: a menu closes as it is pressed ('now'); a dialog waits for the
// call and closes on the change ('onChange').
export type ListMoveClose = 'now' | 'onChange';

export type ListMoves = {
  // Right before the call: notes every row's place.
  arm: (kind: ListMoveKind, closes: ListMoveClose) => void;
  // The call settled (done or failed): stop after the inbox's next read.
  settle: () => void;
};

type Measure = (done: (y: number) => void) => void;

type Area = ListMoves & {
  setRoot: (view: View | null) => void;
  root: () => View | null;
  register: (id: string, measure: Measure) => () => void;
  // Where the row stood before the press, while the list listens.
  noted: (id: string) => boolean;
  // A row laid out after the change: from where it stood, how far and after how long.
  laidOut: (id: string, measure: Measure, play: (dy: number, delay: number) => void) => void;
  // The wait before a leaving row fades (-1: not a press's change, it goes at once).
  exitDelay: SharedValue<number>;
};

function createArea(): Area {
  let root: View | null = null;
  const rows = new Map<string, Measure>();
  const before = new Map<string, number>();
  let armed = false;
  let kind: ListMoveKind = 'move';
  let closeEnd: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const exitDelay = makeMutable(-1);
  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const disarm = () => {
    clear();
    armed = false;
    before.clear();
    exitDelay.value = -1;
  };
  return {
    exitDelay,
    setRoot: (view) => {
      root = view;
    },
    root: () => root,
    register: (id, measure) => {
      rows.set(id, measure);
      return () => {
        if (rows.get(id) === measure) rows.delete(id);
      };
    },
    noted: (id) => armed && before.has(id),
    arm: (k, closes) => {
      disarm();
      armed = true;
      kind = k;
      closeEnd = closes === 'now' ? Date.now() + OUT_MS : null;
      // The leaving row waits for the menu or the dialog to close; a move leaves nothing behind.
      exitDelay.value = k === 'leave' ? OUT_MS : -1;
      if (k === 'leave' && closes === 'now') {
        timer = setTimeout(() => {
          if (armed) exitDelay.value = 0;
        }, OUT_MS);
      }
      for (const [id, measure] of rows) measure((y) => before.set(id, y));
    },
    settle: () => {
      if (!armed) return;
      clear();
      timer = setTimeout(disarm, SETTLE_MS);
    },
    laidOut: (id, measure, play) => {
      if (!armed) return;
      const from = before.get(id);
      measure((y) => {
        before.set(id, y);
        if (from === undefined || Math.abs(from - y) < 1) return;
        if (closeEnd === null) closeEnd = Date.now() + OUT_MS;
        // 3.1 after the menu's close; 3.3 once the leaving row is gone (3.2, dissolve.outMs).
        const wait = Math.max(0, closeEnd - Date.now()) + (kind === 'leave' ? OUT_MS : 0);
        play(from - y, wait);
      });
    },
  };
}

const AreaContext = createContext<Area | null>(null);

// One per list screen: the rows' notes and the press's kind.
export function useListMoves(): ListMoves {
  const [area] = useState(createArea);
  return area;
}

// The list the rows' places are noted in (its content, so a scroll moves nothing).
export function ListMoveArea({
  moves,
  style,
  children,
}: {
  moves: ListMoves;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const area = moves as Area;
  const root = useRef<View>(null);
  useLayoutEffect(() => {
    area.setRoot(root.current);
    return () => area.setRoot(null);
  }, [area]);
  return (
    <AreaContext.Provider value={area}>
      <View ref={root} collapsable={false} style={style}>
        {children}
      </View>
    </AreaContext.Provider>
  );
}

// 3.2: the leaving row fades and shrinks out once the menu or dialog has closed; outside a press's
// change it goes at once.
function rowLeave(delay: SharedValue<number>) {
  return () => {
    'worklet';
    const d = delay.value;
    if (d < 0) {
      return {
        initialValues: { opacity: 1 },
        animations: { opacity: withTiming(0, { duration: 0 }) },
      };
    }
    const out = { duration: OUT_MS, easing: LEAVE };
    return {
      initialValues: { opacity: 1, transform: [{ scale: 1 }] },
      animations: {
        opacity: withDelay(d, withTiming(0, out)),
        transform: [{ scale: withDelay(d, withTiming(MOTION.dissolve.fromScale, out)) }],
      },
    };
  };
}

// A row's first arrival: faded and lifted in, the n-th a little after the one before (as Rise).
function rowRise(index: number) {
  const d = MOTION.dissolve;
  const delay = Math.min(index * MOTION.stagger.row, MOTION.stagger.row * MOTION.stagger.max);
  return () => {
    'worklet';
    const t = { duration: d.inMs, easing: ARRIVE };
    return {
      initialValues: { opacity: 0, transform: [{ translateY: d.rise }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, t)),
        transform: [{ translateY: withDelay(delay, withTiming(0, t)) }],
      },
    };
  };
}

// A row of the list, known by `id`. `version` changes with the list's data (each change lays the
// rows out again). `rise`: it rises in when the list first draws (the inbox's rows), not when a
// press moved it here.
export function ListMove({
  id,
  version,
  index = 0,
  rise = true,
  style,
  children,
}: {
  id: string;
  version: number;
  index?: number;
  rise?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const area = useContext(AreaContext);
  const reduce = useReduceMotion();
  const box = useRef<View>(null);
  const [shift] = useState(() => new Animated.Value(0));
  // Moved here by a press (from another card): it slides from its old place instead of rising.
  const [moved] = useState(() => area?.noted(id) ?? false);
  useLayoutEffect(() => {
    if (!area) return undefined;
    const measure: Measure = (done) => {
      const root = area.root();
      if (!box.current || !root) return;
      box.current.measureLayout(root, (_x, y) => done(y), noop);
    };
    return area.register(id, measure);
  }, [area, id]);
  useLayoutEffect(() => {
    if (!area || reduce) return;
    const measure: Measure = (done) => {
      const root = area.root();
      if (!box.current || !root) return;
      box.current.measureLayout(root, (_x, y) => done(y), noop);
    };
    area.laidOut(id, measure, (dy, delay) => {
      shift.setValue(dy);
      Animated.spring(shift, { ...springConfig(MOTION.springs.morph), toValue: 0, delay }).start();
    });
  }, [area, id, version, reduce, shift]);
  return (
    <Reanimated.View
      style={style}
      entering={reduce || !rise || moved ? undefined : rowRise(index)}
      exiting={reduce || !area ? undefined : rowLeave(area.exitDelay)}
    >
      <Animated.View ref={box} collapsable={false} style={{ transform: [{ translateY: shift }] }}>
        {children}
      </Animated.View>
    </Reanimated.View>
  );
}

const noop = () => undefined;

// 3.4: a number that changes (Arşivlenenler's count): the old one fades out as the new one fades in,
// tab.iconFadeMs on the swap curve, with the leaving row. The one drawn with the list stands still.
function swapIn(delay: SharedValue<number> | null) {
  return () => {
    'worklet';
    const d = delay ? Math.max(0, delay.value) : 0;
    return {
      initialValues: { opacity: 0 },
      animations: {
        opacity: withDelay(d, withTiming(1, { duration: MOTION.tab.iconFadeMs, easing: SWAP })),
      },
    };
  };
}
function swapOut(delay: SharedValue<number> | null) {
  return () => {
    'worklet';
    const d = delay ? Math.max(0, delay.value) : 0;
    return {
      initialValues: { opacity: 1 },
      animations: {
        opacity: withDelay(d, withTiming(0, { duration: MOTION.tab.iconFadeMs, easing: SWAP })),
      },
    };
  };
}

export function CountSwap({ value, children }: { value: string; children: ReactNode }) {
  const area = useContext(AreaContext);
  const reduce = useReduceMotion();
  const delay = area?.exitDelay ?? null;
  return (
    <LayoutAnimationConfig skipEntering>
      <Reanimated.View
        key={value}
        entering={reduce ? undefined : swapIn(delay)}
        exiting={reduce ? undefined : swapOut(delay)}
      >
        {children}
      </Reanimated.View>
    </LayoutAnimationConfig>
  );
}
