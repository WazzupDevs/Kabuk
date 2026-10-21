import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { V46_BUTTON_MOTION, type V46ButtonIcon } from '@/theme/parts.generated';

import { BarGlyph } from './BarGlyph';
import { keyframeRest, keyframeSequence, transitionStyle } from './motion';
import { V46Svg } from './V46Svg';

type SendIcon = Extract<V46ButtonIcon, { send: unknown }>;
type DrawnIcon = Extract<V46ButtonIcon, { drawing: unknown }>;

// A count that started a motion: the motion plays each time it changes after the first render.
function useChanged(value: number, play: () => void) {
  const first = useRef(value);
  useEffect(() => {
    if (value !== first.current) play();
    // `play` reads the latest values itself; the motion only follows the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

// v46's send icon (`.send-ic`): its two bars, each turned about its own middle, drawn as Views so
// their fill and turn ease between waiting and `ready` with v46's transition (`.send-ic rect`: fill
// .2s, turn .42s with an overshoot; with reduce motion the fill only). Each new `shot` sends the
// bars off and back (`.send.shoot .sg`; v46 drops it with reduce motion).
export function SendBars({
  icon,
  ready = false,
  shot = 0,
}: {
  icon: SendIcon;
  ready?: boolean;
  shot?: number;
}) {
  const reduce = useReduceMotion();
  const [width, height] = icon.size;
  const k = width / icon.send.viewBox[2];
  const shoot = V46_BUTTON_MOTION.shoot;
  const bars = V46_BUTTON_MOTION.sendBars;
  const x = useSharedValue(keyframeRest(shoot, 'translateX'));
  const opacity = useSharedValue(keyframeRest(shoot, 'opacity'));
  useChanged(shot, () => {
    if (reduce && shoot.offWhenReduced) return;
    const nextX = keyframeSequence(shoot, 'translateX', k);
    const nextOpacity = keyframeSequence(shoot, 'opacity');
    if (nextX) x.set(nextX);
    if (nextOpacity) opacity.set(nextOpacity);
  });
  const group = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }],
  }));
  return (
    <Animated.View style={[{ width, height }, group]}>
      {(ready ? icon.send.ready : icon.send.waiting).map((b, i) => (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              left: b.x * k,
              top: b.y * k,
              width: b.width * k,
              height: b.height * k,
              borderRadius: b.rx * k,
              backgroundColor: b.fill,
              transform: [
                { translateX: b.translateX * k },
                { translateY: b.translateY * k },
                { rotate: `${b.rotate}deg` },
              ],
            },
            transitionStyle(reduce && bars.reduced.length ? bars.reduced : bars.transitions, {
              fill: 'backgroundColor',
            }),
          ]}
        />
      ))}
    </Animated.View>
  );
}

// The bell (`.nb-ic`) as v46 draws it, its clapper (`.nb-clap`) on a layer of its own. Each new
// `ring` swings it: the bell turns about its own point (`transform-origin: 50% 14%`), the clapper
// moves side to side (`nbRing`, `nbClap`; v46 drops both with reduce motion).
export function BellGlyph({ icon, ring = 0 }: { icon: DrawnIcon; ring?: number }) {
  const reduce = useReduceMotion();
  const [width, height] = icon.size;
  const k = width / icon.drawing.viewBox[2];
  const turn = V46_BUTTON_MOTION.bellRing;
  const swing = V46_BUTTON_MOTION.bellClap;
  const rotate = useSharedValue(keyframeRest(turn, 'rotate'));
  const clapX = useSharedValue(keyframeRest(swing, 'translateX'));
  useChanged(ring, () => {
    if (reduce && turn.offWhenReduced) return;
    const nextTurn = keyframeSequence(turn, 'rotate');
    const nextSwing = keyframeSequence(swing, 'translateX', k);
    if (nextTurn) rotate.set(nextTurn);
    if (nextSwing) clapX.set(nextSwing);
  });
  const bell = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const clapper = useAnimatedStyle(() => ({ transform: [{ translateX: clapX.value }] }));
  return (
    <Animated.View style={[{ width, height, transformOrigin: [...icon.origin, 0] }, bell]}>
      <V46Svg drawing={icon.drawing} size={icon.size} />
      {icon.clap ? (
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, clapper]}>
          <V46Svg drawing={icon.clap} size={icon.size} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

// A button's icon as v46 draws it there, at rest: a bar icon with its fills, the measured drawing
// (with its clapper, if it has one), or the send icon waiting.
export function ButtonGlyph({ icon }: { icon: V46ButtonIcon }) {
  if ('bar' in icon) return <BarGlyph kind={icon.bar} fills={icon.fills} size={icon.size} />;
  if ('send' in icon) return <SendBars icon={icon} />;
  if (!icon.clap) return <V46Svg drawing={icon.drawing} size={icon.size} />;
  return (
    <View>
      <V46Svg drawing={icon.drawing} size={icon.size} />
      <View style={{ position: 'absolute', top: 0, left: 0 }}>
        <V46Svg drawing={icon.clap} size={icon.size} />
      </View>
    </View>
  );
}
