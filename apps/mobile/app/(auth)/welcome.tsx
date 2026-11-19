import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
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

import { Btn } from '@/aura/kit';
import { IntroStage } from '@/aura/IntroStage';
import { useLoopActive } from '@/components/Loader';
import { WordmarkRow } from '@/features/venue/VenueHead';
import { useLaunchStore } from '@/features/launch/launchStore';
import { introCopy } from '@/features/onboarding/introGate';
import { useOnboardingStore } from '@/features/onboarding/store';
import { UnderAge } from '@/features/onboarding/UnderAge';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { copyFrame, type CopyPart, INTRO, INTRO_STAGE, introMinHeight } from '@/theme/introScene';
import { AURA } from '@/theme/aura';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';
import { SIGNUP_FONT_SCALE, useSignupLook } from '@/features/onboarding/look';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// The scene plays once per launch (K-27): coming back to this screen (from "Başlamadan önce", K-28,
// or after an under-18 sign-up) shows it at its end.
let played = false;

// The first screen (docs/SPEC_V4.md §4.C; yeni arayüz tuvali, pano 47 KayitAcilis): the riso scene,
// the logo, "Aynı mekanda, aynı masada.", what the app does and "Başla", which opens "Başlamadan
// önce", the first of the seven steps (K-26).
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
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const look = useSignupLook();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // The scene waits for the launch curtain to open (src/features/launch/LaunchCurtain.tsx).
  const curtain = useLaunchStore((s) => s.curtain);
  // Seen before in this launch (K-27, K-28): it stands at its end. Read once, as the screen opens.
  const [seen] = useState(() => played);
  const t = useSharedValue<number>(seen || reduce ? INTRO.endMs : 0);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  // The words and "Başla" on React's side (introGate.ts): each stands still once its motion ends,
  // all of them at once with reduce motion, and at the cap if the curtain never opens. They never
  // wait for the UI thread's frames or for the curtain's signal.
  const [mountedAt] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [cut, setCut] = useState(false);
  const [now, setNow] = useState(mountedAt);
  const copy = introCopy({
    sinceMount: now - mountedAt,
    sinceStart: startedAt === null ? null : now - startedAt,
    still: seen || reduce || cut,
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

  // The board's endless loops (bob, swing, twinkle) run from the scene's start, or at once when it
  // stands at its end; never with reduce motion, only on top with the app in front.
  const loops = !reduce && active && (seen || copy.giveUp || startedAt !== null);
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
      style={[styles.fill, { backgroundColor: AURA[scheme].ground }]}
    >
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.fill}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: shape.screenPadding,
            paddingTop: SPACING[3],
            paddingBottom: SPACING[6],
            gap: WELCOME_GAP,
          }}
          bounces={false}
          overScrollMode="never"
        >
          {/* KayitAcilis `.stage`: edge to edge, no taller than the board's 390 x 470. */}
          <View
            onLayout={onSceneLayout}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              flexGrow: 1,
              marginHorizontal: -shape.screenPadding,
              minHeight: introMinHeight(windowHeight),
              maxHeight: Math.max(
                introMinHeight(windowHeight),
                (windowWidth * INTRO_STAGE.height) / INTRO_STAGE.width,
              ),
            }}
          >
            {box ? (
              <IntroStage
                width={box.w}
                height={box.h}
                t={t}
                still={copy.stageStill}
                loops={loops}
              />
            ) : null}
          </View>
          <Words
            part="logo"
            t={t}
            still={copy.shown.includes('logo')}
            style={{ alignItems: 'center' }}
          >
            <WordmarkRow small />
          </Words>
          <View style={{ alignItems: 'center', marginTop: SIGNUP.welcome.titleTop - WELCOME_GAP }}>
            <Words part="title" t={t} still={copy.shown.includes('title')}>
              <View
                accessible
                accessibilityRole="header"
                accessibilityLabel={tr.signup.welcomeTitle}
              >
                {tr.signup.welcomeHalves.map((half) => (
                  <Text
                    key={half}
                    maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                    style={[SIGNUP_TYPE.title, { color: look.ink, textAlign: 'center' }]}
                  >
                    {half}
                  </Text>
                ))}
              </View>
            </Words>
            <Words
              part="body"
              t={t}
              still={copy.shown.includes('body')}
              style={{ maxWidth: SIGNUP.welcome.bodyMax, marginTop: SIGNUP.titleGap }}
            >
              <Text
                maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
                style={[SIGNUP_TYPE.body, { color: look.muted, textAlign: 'center' }]}
              >
                {tr.signup.welcomeBody}
              </Text>
            </Words>
          </View>
          {/* KayitAcilis `.kft`: at the screen's bottom. */}
          <Words
            part="foot"
            t={t}
            still={copy.shown.includes('foot')}
            style={{ gap: SIGNUP.footGap, alignItems: 'stretch', marginTop: 'auto' }}
          >
            <Btn
              block

              testID="welcome-start"
              label={tr.signup.start}
              onPress={() => {
                // The words stand at once; the scene goes to its end.
                t.set(INTRO.endMs);
                setCut(true);
                router.push('/agree');
              }}
            />
            <Text
              maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
              style={[SIGNUP_TYPE.foot, { color: look.muted, textAlign: 'center' }]}
            >
              {tr.signup.adultsOnly}
            </Text>
          </Words>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// A piece of the words coming in after the scene (src/theme/introScene.ts → copyFrame). Still, it
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
    return { opacity: f.opacity, transform: [{ translateY: f.dy }, { scale: f.scale }] };
  });
  if (still) return <View style={style}>{children}</View>;
  return <Animated.View style={[style, motion]}>{children}</Animated.View>;
}

const WELCOME_GAP = 22;

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
