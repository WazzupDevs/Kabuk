import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { useLaunchStore } from '@/features/launch/launchStore';
import { introCopy } from '@/features/onboarding/introGate';
import { IntroScene } from '@/features/onboarding/IntroScene';
import { useOnboardingStore } from '@/features/onboarding/store';
import { UnderAge } from '@/features/onboarding/UnderAge';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  copyFrame,
  type CopyPart,
  INTRO,
  INTRO_COLORS,
  INTRO_SHAPE,
  introMinHeight,
  introScene,
} from '@/theme/introScene';
import { useTheme } from '@/theme/ThemeProvider';
import { OPACITY, SPACING, TOUCH } from '@/theme/tokens';

// The scene plays once per launch (K-27): coming back to this screen (from "Başlamadan önce", K-28,
// or after an under-18 sign-up) shows it at its end.
let played = false;

// The first screen (docs/SPEC_V4.md §4.C; v45 §2): the logo, the scene "Aynı mekanda, aynı
// masada.", what the app does and "Başla", which opens "Başlamadan önce", the first of the seven
// steps (K-26).
export default function WelcomeScreen() {
  // Set when sign-up ended under 18: the account was deleted, nothing was kept.
  const underAge = useOnboardingStore((s) => s.underAge);
  // Back here, the consents start over (KVKK): whoever reaches the phone step next in this app
  // session, by "Başla" or a link straight to it, ticks the boxes for themselves.
  useFocusEffect(
    useCallback(() => {
      useOnboardingStore.setState({ consented: null });
    }, []),
  );
  if (underAge) return <UnderAge />;
  return <Welcome />;
}

function Welcome() {
  const { scheme, shape } = useTheme();
  const pal = INTRO_COLORS[scheme];
  const reduce = useReduceMotion();
  const { height: windowHeight } = useWindowDimensions();
  // The scene waits for the launch curtain to open (src/features/launch/LaunchCurtain.tsx).
  const curtain = useLaunchStore((s) => s.curtain);
  // Seen before in this launch (K-27, K-28): it stands at its end. Read once, as the screen opens.
  const [seen] = useState(() => played);
  const t = useSharedValue<number>(seen || reduce ? INTRO.endMs : 0);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const scene = useMemo(() => (box ? introScene(box.w, box.h) : null), [box]);

  // The words, "Başla" and "Geç" on React's side (introGate.ts): each stands still once its
  // motion ends, all of them at once with reduce motion, and at the cap if the curtain never opens.
  // They never wait for the UI thread's frames or for the curtain's signal.
  const [mountedAt] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [now, setNow] = useState(mountedAt);
  const copy = introCopy({
    sinceMount: now - mountedAt,
    sinceStart: startedAt === null ? null : now - startedAt,
    still: seen || reduce || skipped,
  });
  useEffect(() => {
    if (copy.next === null) return undefined;
    const id = setTimeout(() => setNow(Date.now()), copy.next);
    return () => clearTimeout(id);
  }, [copy.next, now]);

  // Starts once the curtain is gone and the scene has its size, from its first frame; with reduce
  // motion it stands at its end from the start.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || curtain || !box || copy.giveUp) return undefined;
    if (seen || reduce) {
      started.current = true;
      t.set(INTRO.endMs);
      return undefined;
    }
    // On the next frame, so the React clock and the motion start together; a new size before then
    // schedules it again.
    const id = requestAnimationFrame(() => {
      started.current = true;
      played = true;
      const at = Date.now();
      setStartedAt(at);
      setNow(at);
      t.set(0);
      t.set(withTiming(INTRO.endMs, { duration: INTRO.endMs, easing: Easing.linear }));
    });
    return () => cancelAnimationFrame(id);
  }, [curtain, box, copy.giveUp, seen, reduce, t]);
  // The curtain did not open by the cap: the scene goes to its end and does not play later.
  useEffect(() => {
    if (!copy.giveUp) return;
    started.current = true;
    played = true;
    t.set(INTRO.endMs);
  }, [copy.giveUp, t]);
  // Reduce motion turned on while it plays: it stops at its end.
  useEffect(() => {
    if (reduce) t.set(INTRO.endMs);
  }, [reduce, t]);

  // "Geç" and "Başla" jump to the end; the words stand at once.
  const skip = () => {
    t.set(INTRO.endMs);
    setSkipped(true);
  };
  // A new size (the safe area arriving late, a turned screen, a new text size) lays the scene out
  // again where it is: every frame is a function of the size and the time, so nothing is skipped.
  const onSceneLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (box && box.w === width && box.h === height) return;
    setBox({ w: width, h: height });
  };

  return (
    <View
      testID="welcome"
      collapsable={false}
      style={[styles.fill, { backgroundColor: pal.sky.stops[2] }]}
    >
      <Sky scheme={scheme} />
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.fill}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: shape.screenPadding,
            paddingTop: SPACING[5],
            paddingBottom: SPACING[2.5],
          }}
        >
          <Words part="logo" t={t} still={copy.shown.includes('logo')} style={styles.logo}>
            <Wordmark height={INTRO_SHAPE.logo} />
          </Words>
          <View
            onLayout={onSceneLayout}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              flexGrow: 1,
              minHeight: introMinHeight(windowHeight),
              marginTop: SPACING[3],
              marginHorizontal: -shape.screenPadding,
            }}
          >
            {scene ? <IntroScene scene={scene} t={t} still={reduce} /> : null}
          </View>
          <View style={{ gap: SPACING[2], paddingTop: SPACING[1.5] }}>
            <View
              accessible
              accessibilityRole="header"
              accessibilityLabel={tr.signup.welcomeTitle}
              style={styles.title}
            >
              <Words part="line1" t={t} still={copy.shown.includes('line1')}>
                <Text variant="display">{tr.signup.welcomeHalves[0]}</Text>
              </Words>
              <Words part="line2" t={t} still={copy.shown.includes('line2')}>
                <Text variant="display">{tr.signup.welcomeHalves[1]}</Text>
              </Words>
            </View>
            <Words part="body" t={t} still={copy.shown.includes('body')}>
              <Text tone="muted">{tr.signup.welcomeBody}</Text>
            </Words>
          </View>
          <Words
            part="foot"
            t={t}
            still={copy.shown.includes('foot')}
            style={{ gap: SPACING[2], paddingTop: SPACING[4] }}
          >
            <Button
              testID="welcome-start"
              label={tr.signup.start}
              onPress={() => {
                skip();
                router.push('/agree');
              }}
            />
            <Text variant="fine" tone="muted" align="center">
              {tr.signup.adultsOnly}
            </Text>
          </Words>
        </ScrollView>
        {copy.skip ? (
          <Pressable
            testID="intro-skip"
            accessibilityRole="button"
            onPress={skip}
            style={({ pressed }) => [
              styles.skip,
              {
                borderRadius: shape.radius.pill,
                backgroundColor: pal.skip.fill,
                opacity: pressed ? OPACITY.pressed : 1,
              },
            ]}
          >
            <Text variant="buttonSmall" color={pal.skip.text}>
              {tr.signup.skip}
            </Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

// A piece of the words coming in with the scene (src/theme/introScene.ts → copyFrame). Still, it
// is a plain view that React draws in full: nothing on the UI thread can hold it back
// (introGate.ts).
function Words({
  part,
  t,
  still,
  style,
  children,
}: {
  part: CopyPart;
  t: SharedValue<number>;
  still: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const motion = useAnimatedStyle(() => {
    const f = copyFrame(part, t.value);
    return { opacity: f.opacity, transform: [{ translateY: f.dy }] };
  });
  if (still) return <View style={style}>{children}</View>;
  return <Animated.View style={[style, motion]}>{children}</Animated.View>;
}

// The screen's sky (v45: .obf): a pink glow at the top over a soft vertical wash.
function Sky({ scheme }: { scheme: 'light' | 'dark' }) {
  const { sky } = INTRO_COLORS[scheme];
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
          {sky.stops.map((color, i) => (
            <Stop key={i} offset={sky.at[i]} stopColor={color} />
          ))}
        </LinearGradient>
        <RadialGradient id="glow" cx="50%" cy="0%" rx="120%" ry="60%" fx="50%" fy="0%">
          <Stop offset="0" stopColor={sky.glow} stopOpacity={1} />
          <Stop offset="0.7" stopColor={sky.glow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#wash)" />
      <Rect width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  logo: { alignItems: 'center' },
  title: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACING[2] },
  skip: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    minWidth: SPACING[16],
    minHeight: TOUCH.min,
    paddingHorizontal: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
