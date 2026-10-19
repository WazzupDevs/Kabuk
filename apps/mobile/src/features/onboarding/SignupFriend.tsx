import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SvgAst } from 'react-native-svg';

import { Text } from '@/components/Text';
import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  FRIEND,
  FRIEND_JUMP,
  FRIEND_NOD,
  FRIEND_SHAKE,
  type FriendMoves,
  type Rect,
  rectsHit,
} from '@/lib/signupFriend';
import {
  type CapsuleEyes,
  type CapsuleKey,
  FRIEND_DARK_INK,
  FRIEND_PUFF_COLORS,
} from '@/theme/capsules';
import { GAME_SHADOW } from '@/theme/gameColors';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { figureDrawing } from './figureDrawing';

export type FriendReaction = { kind: 'ok' | 'err' | 'nod'; key: number };

type Props = {
  look: CapsuleKey;
  // The box's top and right edge in the step's coordinates; the right edge is the screen's.
  top: number;
  right: number;
  // How far it moved up to stay clear (signupFriend.ts → placeFriend); null: hidden on this step.
  shift: number | null;
  // The moves that fit there (friendMoves): one that would cover something is not played.
  moves: FriendMoves;
  reaction: FriendReaction | null;
  // A field is being typed in: it looks at it.
  looking: boolean;
  // "Selam Elif!" beside the title's first line; shown only where it covers nothing.
  bubble: string | null;
  titleLine: Rect | null;
  blockers: readonly Rect[];
  // A new value throws a little burst (the birth date).
  puffKey?: number;
};

const LOOK = { dx: -2.6, dy: 1.8 } as const;
const SQUINT = 0.25;
const BLINK = { atMs: 1200, ms: 140, open: 0.1 } as const;
const REACTION_MS = 800;
const IN = { ms: 420, curve: [0.2, 0.9, 0.3, 1.25] as const, from: 1.2 };
const JUMP = { curve: [0.3, 0.7, 0.4, 1] as const };
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const BUBBLE_MAX = 160;

// A sign-up step's friend (v45 report §3): a capsule leaning in from the right edge. It looks at a
// field being typed in, nods, jumps when a step is done and shakes its head only when an error text
// shows (the text says the error; the friend never alone). Decoration: hidden from screen readers,
// never touched, never over a word, field or button. With reduce motion it shows without sliding
// and does not move; its eyes still turn at once.
export function SignupFriend({
  look,
  top,
  right,
  shift,
  moves,
  reaction,
  looking,
  bubble,
  titleLine,
  blockers,
  puffKey,
}: Props) {
  const { scheme, colors, shape } = useTheme();
  const reduce = useReduceMotion();
  // The eyes squint for a moment after a shake: until that reaction's key is marked done.
  const [squintDone, setSquintDone] = useState<number | null>(null);
  const squint = reaction?.kind === 'err' && reaction.key !== squintDone;
  const [blink, setBlink] = useState(false);
  const [bubbleSize, setBubbleSize] = useState<{ width: number; height: number } | null>(null);
  const slide = useSharedValue(reduce ? 0 : IN.from);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue<number>(FRIEND.angle);

  // In from the right edge when the step opens.
  useEffect(() => {
    if (reduce) {
      slide.set(0);
      return;
    }
    slide.set(withTiming(0, { duration: IN.ms, easing: Easing.bezier(...IN.curve) }));
  }, [look, reduce, slide]);

  // One blink, a moment after it arrives.
  useEffect(() => {
    if (reduce) return;
    const on = setTimeout(() => setBlink(true), BLINK.atMs);
    const off = setTimeout(() => setBlink(false), BLINK.atMs + BLINK.ms);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [look, reduce]);

  // The squint after an error ends on its own, tied to that reaction only: a new layout (and so
  // new moves) while it lasts does not keep the eyes narrow.
  const errKey = reaction?.kind === 'err' ? reaction.key : null;
  useEffect(() => {
    if (errKey === null) return;
    const t = setTimeout(() => setSquintDone(errKey), REACTION_MS);
    return () => clearTimeout(t);
  }, [errKey]);

  // A reaction: jump (v45: palJump), shake (palNo, with the eyes squinting) or nod (palNod).
  const lastReaction = useRef(reaction?.key);
  useEffect(() => {
    if (!reaction || reaction.key === lastReaction.current) return;
    lastReaction.current = reaction.key;
    if (reaction.kind === 'err') {
      if (!reduce && moves.shake) {
        rot.set(
          withSequence(
            withTiming(FRIEND_SHAKE.angle, { duration: 100, easing: EASE }),
            withTiming(-5, { duration: 125, easing: EASE }),
            withTiming(-20, { duration: 125, easing: EASE }),
            withTiming(FRIEND.angle, { duration: 150, easing: EASE }),
          ),
        );
      }
      return;
    }
    if (reduce) return;
    if (reaction.kind === 'ok' && moves.jump) {
      const e = Easing.bezier(...JUMP.curve);
      tx.set(
        withSequence(
          withTiming(FRIEND_JUMP.dx, { duration: 240, easing: e }),
          withTiming(0, { duration: 210, easing: e }),
        ),
      );
      ty.set(
        withSequence(
          withTiming(FRIEND_JUMP.dy, { duration: 240, easing: e }),
          withTiming(2, { duration: 210, easing: e }),
          withTiming(0, { duration: 150, easing: e }),
        ),
      );
      rot.set(
        withSequence(
          withTiming(FRIEND_JUMP.angle, { duration: 240, easing: e }),
          withTiming(-16, { duration: 210, easing: e }),
          withTiming(FRIEND.angle, { duration: 150, easing: e }),
        ),
      );
    } else if (reaction.kind === 'nod' && moves.nod) {
      ty.set(
        withSequence(
          withTiming(FRIEND_NOD.dy, { duration: 210, easing: EASE }),
          withTiming(0, { duration: 210, easing: EASE }),
        ),
      );
    }
    return undefined;
  }, [reaction, reduce, moves.jump, moves.shake, moves.nod, rot, tx, ty]);

  const figure = useAnimatedStyle(() => ({
    transform: [
      { translateX: slide.value * FRIEND.width + tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  if (shift === null) return null;

  const eyes: CapsuleEyes = {
    ...(looking ? LOOK : {}),
    open: squint ? SQUINT : blink ? BLINK.open : 1,
  };
  const boxTop = top - shift;
  const boxLeft = right - FRIEND.box;

  // The bubble beside the title's first line, right of the words; never over anything.
  let bubbleTop: number | null = null;
  if (bubble && titleLine && bubbleSize) {
    const rect: Rect = {
      x: right - 50 - bubbleSize.width,
      y: titleLine.y + (titleLine.height - bubbleSize.height) / 2,
      width: bubbleSize.width,
      height: bubbleSize.height,
    };
    if (!blockers.some((b) => rectsHit(rect, b, FRIEND.bubbleMargin))) bubbleTop = rect.y - boxTop;
  }

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: boxLeft,
        top: boxTop,
        width: FRIEND.box,
        height: FRIEND.box + 24,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: -FRIEND.overhang,
            top: 0,
            width: FRIEND.width,
            height: FRIEND.height,
            transformOrigin: '100% 100%',
          },
          figure,
        ]}
      >
        <SvgAst
          ast={figureDrawing(look, eyes, scheme === 'dark' ? FRIEND_DARK_INK : undefined)}
          override={{ width: FRIEND.width, height: FRIEND.height }}
        />
      </Animated.View>
      {puffKey !== undefined && !reduce ? <Puff key={puffKey} /> : null}
      {bubble ? (
        <View
          onLayout={(e: LayoutChangeEvent) => {
            const { width, height } = e.nativeEvent.layout;
            if (!bubbleSize || bubbleSize.width !== width || bubbleSize.height !== height) {
              setBubbleSize({ width, height });
            }
          }}
          style={{
            position: 'absolute',
            right: 50,
            top: bubbleTop ?? 0,
            maxWidth: BUBBLE_MAX,
            paddingHorizontal: SPACING[2.5] + 1,
            paddingVertical: SPACING[1.5] + 1,
            borderRadius: shape.radius.sm + 2,
            borderBottomRightRadius: shape.radius.xs - 2,
            backgroundColor: colors.surface,
            boxShadow: GAME_SHADOW.toast,
            opacity: bubbleTop === null ? 0 : 1,
          }}
        >
          <Text variant="label">{bubble}</Text>
        </View>
      ) : null}
    </View>
  );
}

// Seven little pieces thrown up and out from the friend (v45: puff()), 700 ms.
function Puff() {
  return (
    <>
      {FRIEND_PUFF_COLORS.concat(FRIEND_PUFF_COLORS.slice(0, 2)).map((color, i) => (
        <PuffPiece key={i} i={i} color={color} />
      ))}
    </>
  );
}

function PuffPiece({ i, color }: { i: number; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: 700, easing: Easing.bezier(0.2, 0.7, 0.4, 1) }));
  }, [t]);
  const a = -Math.PI * (0.55 + i * 0.1);
  const dx = Math.cos(a) * (26 + i * 3);
  const dy = Math.sin(a) * (30 + (i % 3) * 8);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: dx * t.value },
      { translateY: dy * t.value },
      { rotate: `${i * 70 * t.value}deg` },
      { scale: 0.5 + 0.5 * t.value },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: FRIEND.box / 2,
          top: FRIEND.height / 3,
          width: SPACING[1.5],
          height: SPACING[2.5],
          borderRadius: SPACING[0.5],
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
