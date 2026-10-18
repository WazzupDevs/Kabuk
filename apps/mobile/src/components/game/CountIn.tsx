import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { ON_GAME } from '@/theme/gameColors';
import { COUNT_IN, COUNT_IN_MS, countInStep, EASE_BACK } from '@/theme/gameMotion';

import { Text } from '../Text';

type Props = {
  // Called once, 250 ms after "Başla".
  onDone: () => void;
  testID?: string;
};

const NUMBERS = ['3', '2', '1'] as const;

// "3, 2, 1, Başla" over a game's ground before a turn (v43 report §5, the v45 file's .tg-cd): big
// white figures, one every 650 ms, each popping in. It fills its parent and lets touches through.
// With reduce motion the figures change without the pop; the timing stays, so every phone reaches
// "Başla" together.
export function CountIn({ onDone, testID }: Props) {
  const reduce = useReduceMotion();
  const [step, setStep] = useState(0);
  const [pop] = useState(() => new Animated.Value(reduce ? 1 : 0));
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const started = Date.now();
    const timers = Array.from({ length: COUNT_IN.steps }, (_, i) =>
      setTimeout(() => setStep(countInStep(Date.now() - started) ?? i), i * COUNT_IN.stepMs),
    );
    const end = setTimeout(() => done.current(), COUNT_IN_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
    };
  }, []);

  useEffect(() => {
    if (reduce) {
      pop.setValue(1);
      return undefined;
    }
    pop.setValue(0);
    const anim = Animated.timing(pop, {
      toValue: 1,
      duration: COUNT_IN.popMs,
      easing: (u) => EASE_BACK(u),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [step, pop, reduce]);

  const go = step >= NUMBERS.length;
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
      testID={testID}
    >
      <Animated.View
        accessibilityLiveRegion="assertive"
        style={{
          opacity: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [COUNT_IN.popFrom, 1] }) },
          ],
        }}
      >
        <Text variant={go ? 'countInGo' : 'countIn'} color={ON_GAME} align="center">
          {go ? tr.gameParts.go : NUMBERS[step]}
        </Text>
      </Animated.View>
    </View>
  );
}
