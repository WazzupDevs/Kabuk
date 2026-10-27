import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/Text';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { lookGround, lookPop } from '@/theme/capsuleLook';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { BEAT, type Channel, type Move, sample } from './motion';

// The stage (v46 `.ced-fig` in `.ced-ring`): 60 × 57 units, the circle (48) 6 in from the left and 8
// down, the head free to rise over it.
const STAGE = { width: 60, height: 57, circle: 48, left: 6, top: 8 } as const;
// The feet the capsule moves about (`.cp-b`: transform-origin 24px 48px).
const FEET = `${((24 + STAGE.left) / STAGE.width) * 100}% ${((48 + STAGE.top) / STAGE.height) * 100}%`;
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
  const [fade] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!oldLook) return undefined;
    fade.setValue(1);
    const anim = Animated.timing(fade, {
      toValue: 0,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setOldLook(null);
    });
    return () => anim.stop();
  }, [oldLook, fade]);

  // The move playing (0 → 1 over its length).
  const [progress] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!play || reduce) return undefined;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: play.move.ms,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [play, reduce, progress]);
  const moveStyle = useMemo(() => {
    if (!play) return null;
    const of = (c: Channel) => progress.interpolate(sample(play.move, c, unit));
    const rot = sample(play.move, 'rot');
    return {
      transform: [
        { translateX: of('tx') },
        { translateY: of('ty') },
        {
          rotate: progress.interpolate({
            inputRange: rot.inputRange,
            outputRange: rot.outputRange.map((v) => `${v}deg`),
          }),
        },
        { scaleX: of('sx') },
        { scaleY: of('sy') },
      ],
    };
  }, [play, progress, unit]);

  // The circle's beat.
  const [beating] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (beat === 0 || reduce) return undefined;
    beating.setValue(0);
    const anim = Animated.timing(beating, {
      toValue: 1,
      duration: BEAT.ms,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [beat, reduce, beating]);
  const beatScale = useMemo(() => beating.interpolate(sample(BEAT, 'sx')), [beating]);

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
          <Animated.View
            style={{
              width: size + ring * 2,
              height: size + ring * 2,
              borderRadius: shape.radius.pill,
              borderWidth: ring,
              borderColor: colors.surface,
              backgroundColor: lookGround(shownLook),
              boxShadow: shape.shadow.card,
              transform: [{ scale: beatScale }],
            }}
          >
            <Animated.View style={[figure, { transformOrigin: FEET }, moveStyle]}>
              <SvgXml xml={xml} width="100%" height="100%" />
            </Animated.View>
            {oldXml ? (
              <Animated.View pointerEvents="none" style={[figure, { opacity: fade }]}>
                <SvgXml xml={oldXml} width="100%" height="100%" />
              </Animated.View>
            ) : null}
          </Animated.View>
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
