import { useEffect, useMemo, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { type GameGround, GAME_SHADOW, mainButtonInk, ON_GAME } from '@/theme/gameColors';
import { CURVES, LETTER_WHEEL, letterWheelTimes } from '@/theme/playMotion';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from '../Text';

type Props = {
  // The round's letter, where the wheel lands.
  letter: string;
  // The letters it ticks through on the way (the round's pool).
  pool: readonly string[];
  // A new key spins it again.
  spinKey: string | number;
  ground: GameGround;
  testID?: string;
};

// The tile's side (v43: .hx-big, 150 wide).
const TILE = 150;

// Harf Kapmaca's letter wheel (v43 report §2, the v45 file's .hx-big): a white tile ticks through
// letters, slowing down, and lands on the round's letter with a pop. The letter the server drew is
// the one it lands on; the ones on the way are decoration. With reduce motion the letter shows at
// once. Screen readers hear only the round's letter.
export function LetterWheel({ letter, pool, spinKey, ground, testID }: Props) {
  const { shape } = useTheme();
  const reduce = useReduceMotion();
  const times = useMemo(() => letterWheelTimes(), []);
  const [ticking, setShown] = useState(pool[0] ?? letter);
  const still = reduce || pool.length === 0;
  const shown = still ? letter : ticking;
  const land = useSharedValue(1);

  useEffect(() => {
    if (still) return undefined;
    const timers = times.map((at, k) =>
      setTimeout(() => {
        const last = k === times.length - 1;
        // A steady walk through the pool: the same spin looks the same on every phone.
        setShown(last ? letter : (pool[(k * 7 + String(spinKey).length) % pool.length] ?? letter));
        if (last) {
          land.set(LETTER_WHEEL.landFrom);
          land.set(
            withTiming(1, { duration: LETTER_WHEEL.landMs, easing: Easing.bezier(...CURVES.back) }),
          );
        }
      }, at),
    );
    return () => timers.forEach(clearTimeout);
  }, [spinKey, letter, pool, still, times, land]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: land.value }] }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={letter}
      testID={testID}
      className="items-center justify-center self-center"
      style={[
        {
          width: TILE,
          aspectRatio: 1,
          borderRadius: shape.radius.xl + 10,
          backgroundColor: ON_GAME,
          boxShadow: GAME_SHADOW.forbidden,
        },
        pop,
      ]}
    >
      <Text variant="letterTile" color={mainButtonInk(ground)} align="center">
        {shown}
      </Text>
    </Animated.View>
  );
}
