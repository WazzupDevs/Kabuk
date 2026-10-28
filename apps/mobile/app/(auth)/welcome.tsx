import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
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

import { AuraBackground } from '@/aura/AuraBackground';
import { Btn, T } from '@/aura/kit';
import { Gathering, SceneGround } from '@/aura/Scene';
import { TABLE_ICON_IMAGES } from '@/features/rooms/tableIconImages';
import { WordmarkRow } from '@/features/venue/VenueHead';
import { useLaunchStore } from '@/features/launch/launchStore';
import { introCopy } from '@/features/onboarding/introGate';
import { useOnboardingStore } from '@/features/onboarding/store';
import { UnderAge } from '@/features/onboarding/UnderAge';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { copyFrame, type CopyPart, INTRO, introMinHeight } from '@/theme/introScene';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
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
  const reduce = useReduceMotion();
  const { height: windowHeight } = useWindowDimensions();
  // The scene waits for the launch curtain to open (src/features/launch/LaunchCurtain.tsx).
  const curtain = useLaunchStore((s) => s.curtain);
  // Seen before in this launch (K-27, K-28): it stands at its end. Read once, as the screen opens.
  const [seen] = useState(() => played);
  const t = useSharedValue<number>(seen || reduce ? INTRO.endMs : 0);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

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
      style={[styles.fill, { backgroundColor: AURA[scheme].ground }]}
    >
      {/* docs/design/aura → Main: the colour clouds. */}
      <AuraBackground running />
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.fill}>
        <ScrollView
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
          <Words part="logo" t={t} still={copy.shown.includes('logo')}>
            <WordmarkRow small />
          </Words>
          <View
            onLayout={onSceneLayout}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              flexGrow: 1,
              minHeight: introMinHeight(windowHeight),
              borderRadius: AURA.scene.radius,
              overflow: 'hidden',
            }}
          >
            {/* The table and the buddies around it (Main); each comes in with its bounce. */}
            <SceneGround />
            {box ? (
              <Gathering
                kind="welcome"
                width={box.w}
                delay={SCENE_DELAY}
                center={
                  <Image
                    source={TABLE_ICON_IMAGES[WELCOME_TABLE]}
                    fadeDuration={0}
                    style={{ width: '100%', height: '100%' }}
                  />
                }
              />
            ) : null}
          </View>
          <View style={{ gap: SPACING[3] }}>
            <View accessible accessibilityRole="header" accessibilityLabel={tr.signup.welcomeTitle}>
              <Words part="line1" t={t} still={copy.shown.includes('line1')}>
                <T v="display" style={KIT_TYPE.welcome}>
                  {tr.signup.welcomeHalves[0]}
                </T>
              </Words>
              <Words part="line2" t={t} still={copy.shown.includes('line2')}>
                <T v="display" style={KIT_TYPE.welcome}>
                  {tr.signup.welcomeHalves[1]}
                </T>
              </Words>
            </View>
            <Words part="body" t={t} still={copy.shown.includes('body')}>
              <T v="body">{tr.signup.welcomeBody}</T>
            </Words>
          </View>
          <Words
            part="foot"
            t={t}
            still={copy.shown.includes('foot')}
            style={{ gap: SPACING[3], alignItems: 'center' }}
          >
            <Btn
              block
              icon="forward"
              testID="welcome-start"
              label={tr.signup.start}
              onPress={() => {
                skip();
                router.push('/agree');
              }}
            />
            <T v="fine" center>
              {tr.signup.adultsOnly}
            </T>
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
                borderRadius: KIT.size.btnSm,
                backgroundColor: KIT[scheme].raised,
                borderWidth: KIT.size.edge,
                borderColor: KIT[scheme].raisedEdge,
                opacity: pressed ? OPACITY.pressed : 1,
              },
            ]}
          >
            <T v="btnSm">{tr.signup.skip}</T>
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

const WELCOME_GAP = 22;
const SCENE_DELAY = 200;
const WELCOME_TABLE = 'kamp-ates';

const styles = StyleSheet.create({
  fill: { flex: 1 },
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
