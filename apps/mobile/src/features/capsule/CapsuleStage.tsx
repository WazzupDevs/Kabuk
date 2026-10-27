import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Reanimated, {
  Easing as ReEasing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { lookGround, lookPop } from '@/theme/capsuleLook';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { BEAT, type Channel, type Move, sample } from './motion';
import { CachedSvg } from '@/components/CachedSvg';

// The stage (v46 `.ced-fig` in `.ced-ring`): 60 × 57 units, the circle (48) 6 in from the left and 8
// down, the head free to rise over it.
const STAGE = { width: 60, height: 57, circle: 48, left: 6, top: 8 } as const;
// The feet the capsule moves about (`.cp-b`: transform-origin 24px 48px), as a share of the stage's
// height (the stage's middle across).
const FEET_Y = (48 + STAGE.top) / STAGE.height;
const FADE_MS = 240;
const BUBBLE_MS = 340;

export type Play = { move: Move; key: number };

// The capsule large in its circle (skall tuvali, KapsulSusle): a tap on it shows the next feeling
// (the face, a little move and the things around it, for a moment), the circle beats once. A part
// put on makes it jump, "Karıştır" wobble while the new look fades in over the old one (the owner's
// call, 27 Ekim). The feeling's name rises in a bubble at the circle's top right. No motion with
// reduce motion: the face and the look still change.
export function CapsuleStage({
  look,
  feeling,
  play,
  beat,
  size,
  label,
  hint,
  onPress,
  testID,
}: {
  look: string;
  // The feeling's id ('' for none) and its name in the bubble.
  feeling: { id: string; name: string; key: number } | null;
  play: Play | null;
  // Each new value beats the circle.
  beat: number;
  // The circle's diameter.
  size: number;
  label: string;
  // Over the circle until the first tap ("Kafama dokun").
  hint: string | null;
  onPress: () => void;
  testID?: string;
}) {
  const { colors, shape } = useTheme();
  const reduce = useReduceMotion();
  const unit = size / STAGE.circle;
  const ring = SPACING[1.5];

  // The look before a change, fading out over the new one.
  const [shownLook, setShownLook] = useState(look);
  const [oldLook, setOldLook] = useState<string | null>(null);
  if (look !== shownLook) {
    setOldLook(reduce ? null : shownLook);
    setShownLook(look);
  }
  // Reanimated, not Animated's native driver: on Android the SVG inside a view moved by the native
  // driver was not drawn until the move ended (the owner's video, 27 Ekim: an empty circle).
  const fade = useSharedValue(0);
  useEffect(() => {
    if (!oldLook) return;
    fade.set(1);
    fade.set(
      withTiming(0, { duration: FADE_MS, easing: ReEasing.out(ReEasing.quad) }, (done) => {
        if (done) runOnJS(setOldLook)(null);
      }),
    );
  }, [oldLook, fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  // The move playing (0 → 1 over its length), about the feet: the pivot is set by moving there and
  // back, since transformOrigin did not hold on Android.
  const t = useSharedValue(1);
  const curves = useMemo(() => {
    if (!play) return null;
    const of = (c: Channel) => sample(play.move, c, unit);
    return { tx: of('tx'), ty: of('ty'), rot: of('rot'), sx: of('sx'), sy: of('sy') };
  }, [play, unit]);
  useEffect(() => {
    if (!play || reduce) return;
    t.set(0);
    t.set(withTiming(1, { duration: play.move.ms, easing: ReEasing.linear }));
  }, [play, reduce, t]);
  const pivot = (FEET_Y - 0.5) * STAGE.height * unit;
  const moveStyle = useAnimatedStyle(() => {
    if (!curves) return {};
    const v = (c: { inputRange: number[]; outputRange: number[] }) =>
      interpolate(t.value, c.inputRange, c.outputRange, Extrapolation.CLAMP);
    return {
      transform: [
        { translateY: pivot },
        { translateX: v(curves.tx) },
        { translateY: v(curves.ty) },
        { rotate: `${v(curves.rot)}deg` },
        { scaleX: v(curves.sx) },
        { scaleY: v(curves.sy) },
        { translateY: -pivot },
      ],
    };
  });

  // The circle's beat.
  const beating = useSharedValue(1);
  const beatCurve = useMemo(() => sample(BEAT, 'sx'), []);
  useEffect(() => {
    if (beat === 0 || reduce) return;
    beating.set(0);
    beating.set(withTiming(1, { duration: BEAT.ms, easing: ReEasing.linear }));
  }, [beat, reduce, beating]);
  const beatStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          beating.value,
          beatCurve.inputRange,
          beatCurve.outputRange,
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const xml = useMemo(() => lookPop(shownLook, feeling?.id ?? ''), [shownLook, feeling?.id]);
  const oldXml = useMemo(() => (oldLook ? lookPop(oldLook) : null), [oldLook]);
  const figure = {
    position: 'absolute' as const,
    left: -STAGE.left * unit,
    top: -STAGE.top * unit,
    width: STAGE.width * unit,
    height: STAGE.height * unit,
  };

  return (
    <View style={{ paddingTop: STAGE.top * unit, alignItems: 'center' }}>
      <View style={{ width: size + ring * 2 }}>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
        >
          <Reanimated.View
            style={[
              {
                width: size + ring * 2,
                height: size + ring * 2,
                borderRadius: shape.radius.pill,
                borderWidth: ring,
                borderColor: colors.surface,
                backgroundColor: lookGround(shownLook),
                boxShadow: shape.shadow.card,
              },
              beatStyle,
            ]}
          >
            <Reanimated.View style={[figure, moveStyle]}>
              <CachedSvg xml={xml} width="100%" height="100%" />
            </Reanimated.View>
            {oldXml ? (
              <Reanimated.View pointerEvents="none" style={[figure, fadeStyle]}>
                <CachedSvg xml={oldXml} width="100%" height="100%" />
              </Reanimated.View>
            ) : null}
          </Reanimated.View>
        </Pressable>
        {feeling ? (
          <Bubble key={feeling.key} text={feeling.name} reduce={reduce} top={-STAGE.top * unit} />
        ) : hint ? (
          <Bubble text={hint} reduce top={-STAGE.top * unit} />
        ) : null}
      </View>
    </View>
  );
}

// v46 `.ced-bub` (left 74% of the circle, at the stage's top): a white bubble at the circle's top
// right, its tail at the bottom left; it pops in
// (scale .5 → 1, .34s cubic-bezier(.34,1.56,.64,1)).
function Bubble({ text, reduce, top }: { text: string; reduce: boolean; top: number }) {
  const { colors, shape } = useTheme();
  const [shown] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return undefined;
    const anim = Animated.timing(shown, {
      toValue: 1,
      duration: BUBBLE_MS,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduce, shown]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: '74%',
        paddingHorizontal: SPACING[3],
        paddingVertical: SPACING[1.5],
        borderRadius: shape.radius.lg,
        borderBottomLeftRadius: SPACING[1],
        backgroundColor: colors.surface,
        boxShadow: shape.shadow.sheet,
        opacity: shown.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transformOrigin: '0% 100%',
        transform: [
          { scale: shown.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
          { translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [SPACING[1.5], 0] }) },
        ],
      }}
    >
      <Text variant="label">{text}</Text>
    </Animated.View>
  );
}
