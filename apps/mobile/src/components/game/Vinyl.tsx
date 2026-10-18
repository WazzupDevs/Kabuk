import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { EQUALISER_COLORS, GAME_SHADOW, ON_GAME, VINYL } from '@/theme/gameColors';
import { EQUALISER, equaliserHeight, VINYL_TURN_MS } from '@/theme/playMotion';
import { SPACING } from '@/theme/tokens';

import { useLoopActive } from '../Loader';

const BOX = 100;
const GROOVE = 4; // one groove every 4 units of the 100 box (v43: 2 px dark, 2 px light)
const LABEL = 18; // the label's radius (v43: 32 % in from each side)

// The label's four quarters, orange and pink in turn.
function quarter(i: number): string {
  const c = BOX / 2;
  const a0 = (i * Math.PI) / 2 - Math.PI / 2;
  const a1 = a0 + Math.PI / 2;
  const x0 = c + LABEL * Math.cos(a0);
  const y0 = c + LABEL * Math.sin(a0);
  const x1 = c + LABEL * Math.cos(a1);
  const y1 = c + LABEL * Math.sin(a1);
  return `M${c} ${c}L${x0.toFixed(2)} ${y0.toFixed(2)}A${LABEL} ${LABEL} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}

type VinylProps = { size?: number; testID?: string };

// Şarkıda Geçsin's record (v43 report §2, the v45 file's .sx-rec): it turns once every 2.4 s while
// its screen is in front, stops off screen and in the background, and stands still with reduce
// motion. Decoration only.
export function Vinyl({ size = 136, testID }: VinylProps) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const turn = useSharedValue(0);
  const shine = `vinyl${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const spinning = active && !reduce;

  useEffect(() => {
    if (!spinning) {
      cancelAnimation(turn);
      return undefined;
    }
    turn.set(
      withRepeat(
        withTiming(turn.get() + 360, { duration: VINYL_TURN_MS, easing: Easing.linear }),
        -1,
      ),
    );
    return () => cancelAnimation(turn);
  }, [spinning, turn]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  const grooves: number[] = [];
  for (let r = BOX / 2 - GROOVE / 2; r > LABEL + 2; r -= GROOVE) grooves.push(r);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        boxShadow: GAME_SHADOW.forbidden,
      }}
    >
      <Animated.View style={style}>
        <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
          <Defs>
            <LinearGradient id={shine} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={ON_GAME} stopOpacity={0.2} />
              <Stop offset="0.45" stopColor={ON_GAME} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Circle cx={BOX / 2} cy={BOX / 2} r={BOX / 2} fill={VINYL.disc} />
          <G fill="none" stroke={VINYL.groove} strokeWidth={GROOVE / 2}>
            {grooves.map((r) => (
              <Circle key={r} cx={BOX / 2} cy={BOX / 2} r={r} />
            ))}
          </G>
          {[0, 1, 2, 3].map((i) => (
            <Path key={i} d={quarter(i)} fill={VINYL.label[i % 2]} />
          ))}
          <Circle cx={BOX / 2} cy={BOX / 2} r={LABEL * 0.14} fill={VINYL.hole} />
          <Rect x={0} y={0} width={BOX} height={BOX} rx={BOX / 2} fill={`url(#${shine})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

type EqualiserProps = {
  // Which side of the singer: the left group and the right group move out of step (v45 offsets).
  group?: 0 | 1;
  height?: number;
};

const BAR = { width: 5, gap: SPACING[1] } as const;

function EqualiserBar({
  clock,
  offset,
  color,
  height,
}: {
  clock: { value: number };
  offset: number;
  color: string;
  height: number;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: equaliserHeight(clock.value, offset) }],
  }));
  return (
    <Animated.View
      style={[
        { width: BAR.width, height, borderRadius: BAR.width / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

// The equaliser beside the person singing in Şarkıda Geçsin (v43 report §2, the v45 file's .sx-eq):
// four bars rising and falling out of step every 0.9 s, on one clock on the UI thread. Still (and
// low) off screen, in the background and with reduce motion. Decoration only.
export function Equaliser({ group = 0, height = 46 }: EqualiserProps) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const clock = useSharedValue(0);
  const frame = useFrameCallback((f) => {
    clock.set(f.timeSinceFirstFrame);
  }, false);

  useEffect(() => {
    frame.setActive(active && !reduce);
    if (!active || reduce) clock.set(0);
  }, [active, reduce, frame, clock]);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="flex-row items-center"
      style={{ gap: BAR.gap, height }}
    >
      {EQUALISER.offsets[group].map((offset, i) => (
        <EqualiserBar
          key={i}
          clock={clock}
          offset={offset}
          color={EQUALISER_COLORS[i] ?? EQUALISER_COLORS[0]}
          height={height}
        />
      ))}
    </View>
  );
}
