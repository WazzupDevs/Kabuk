import {
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MOTION } from '@/theme/aura';

import { useReduceMotion } from './useReduceMotion';

// A head that folds away while the reader scrolls on and comes back when they scroll back (the
// owner's call, 29 Ekim: Masa leaves only the faces, Kapsülün only the capsule and drops its
// buttons). `progress` goes 0 (open) to 1 (folded), on the UI thread; a scroll that moves the
// content without a finger or a fling on it (a head folding, content coming or going) changes
// nothing, so the head cannot fold and unfold by itself.
const STEP = 4;
// Near the top the head is always open.
const TOP = 24;
const SWAP = MOTION.curves.swap;
const FOLD_MS = 240;

// `onFold`: told on the JS thread when the head folds (true) or opens, for what must stop taking
// touches while it is away.
export function useCollapseOnScroll(onFold?: (folded: boolean) => void): {
  progress: SharedValue<number>;
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
} {
  const reduce = useReduceMotion();
  const progress = useSharedValue(0);
  const target = useSharedValue(0);
  const last = useSharedValue(0);
  const moving = useSharedValue(false);
  const duration = reduce ? 0 : FOLD_MS;
  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: (e) => {
      moving.value = true;
      last.value = e.contentOffset.y;
    },
    onEndDrag: () => {
      moving.value = false;
    },
    onMomentumBegin: () => {
      moving.value = true;
    },
    onMomentumEnd: () => {
      moving.value = false;
    },
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - last.value;
      last.value = y;
      const to = y <= TOP ? 0 : !moving.value ? target.value : dy > STEP ? 1 : dy < -STEP ? 0 : -1;
      if (to < 0 || to === target.value) return;
      target.value = to;
      if (onFold) runOnJS(onFold)(to === 1);
      progress.value = withTiming(to, {
        duration,
        easing: Easing.bezier(SWAP[0], SWAP[1], SWAP[2], SWAP[3]),
      });
    },
  });
  return { progress, onScroll };
}
