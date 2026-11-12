import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Reanimated, {
  Easing,
  LayoutAnimationConfig,
  LinearTransition,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { type Bezier, MOTION } from '@/theme/aura';

// hareket.json's curves for Reanimated.
const curve = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);
const ARRIVE = curve(MOTION.curves.arrive);
const LEAVE = curve(MOTION.curves.leave);
// The parts' move when one comes or goes (hareket.json gives swap no duration: 300, as Mesajlar's
// disc).
const SWAP_MS = 300;
const SWAP_LAYOUT = LinearTransition.duration(SWAP_MS).easing(curve(MOTION.curves.swap));
const BADGE_RISE = 6;
const BADGE_FROM = 0.3;

// The dissolve's arrival (hareket.json → dissolve): from a little lower and smaller, faded in.
function dissolveIn(delay: number) {
  const d = MOTION.dissolve;
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: d.rise }, { scale: d.fromScale }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, { duration: d.inMs, easing: ARRIVE })),
        transform: [
          { translateY: withDelay(delay, withTiming(0, { duration: d.inMs, easing: ARRIVE })) },
          { scale: withDelay(delay, withTiming(1, { duration: d.inMs, easing: ARRIVE })) },
        ],
      },
    };
  };
}

const fadeOut = () => {
  'worklet';
  return {
    initialValues: { opacity: 1 },
    animations: { opacity: withTiming(0, { duration: MOTION.dissolve.outMs, easing: LEAVE }) },
  };
};

// A count arrives on the pop spring, 6 from below; it leaves smaller and faded.
const badgeIn = () => {
  'worklet';
  const pop = MOTION.springs.pop;
  return {
    initialValues: { opacity: 0, transform: [{ translateY: BADGE_RISE }, { scale: BADGE_FROM }] },
    animations: {
      opacity: withTiming(1, { duration: MOTION.dissolve.outMs }),
      transform: [{ translateY: withSpring(0, pop) }, { scale: withSpring(1, pop) }],
    },
  };
};
const badgeOut = () => {
  'worklet';
  const ms = MOTION.dissolve.outMs;
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: {
      opacity: withTiming(0, { duration: ms, easing: LEAVE }),
      transform: [{ scale: withTiming(BADGE_FROM, { duration: ms, easing: LEAVE }) }],
    },
  };
};

// A part that comes and goes in place (the venue chat card's lines, its "şu an aktif" and count):
// `dissolve` in (after `delay`) and faded out, or a `badge` on the pop spring; `swap` moves it when
// another comes or goes. Still with reduce motion.
export function Arrive({
  kind = 'dissolve',
  delay = 0,
  swap,
  leaves = true,
  style,
  testID,
  accessible,
  accessibilityLabel,
  children,
}: {
  kind?: 'dissolve' | 'badge';
  delay?: number;
  swap?: boolean;
  // Unset: it fades out as it goes.
  leaves?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  children: ReactNode;
}) {
  const reduce = useReduceMotion();
  const badge = kind === 'badge';
  return (
    <Reanimated.View
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      style={style}
      entering={reduce ? undefined : badge ? badgeIn : dissolveIn(delay)}
      exiting={reduce || !leaves ? undefined : badge ? badgeOut : fadeOut}
      layout={reduce || !swap ? undefined : SWAP_LAYOUT}
    >
      {children}
    </Reanimated.View>
  );
}

// What shows when its parts first draw stays put; what comes after arrives (Arrive).
export function ArriveLater({ children }: { children: ReactNode }) {
  return <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>;
}
