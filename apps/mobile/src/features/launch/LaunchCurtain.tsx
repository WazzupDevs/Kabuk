import { SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { BRAND, LAUNCH_LIGHT, LAUNCH_MASK } from '@/theme/brand';
import {
  glintPath,
  launchFrame,
  type LaunchGeometry,
  launchGeometry,
  type LaunchKind,
  type LaunchScene,
  launchTimeline,
  type ParsedPath,
  parsePath,
  type Rect as R,
  shiftedPath,
} from '@/theme/launchMotion';
import { SKA_LETTERS } from '@/theme/wordmark';

import { decideLaunchKind, useLaunchStore } from './launchStore';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const [S, K, A] = SKA_LETTERS.map(parsePath) as [ParsedPath, ParsedPath, ParsedPath];
// The kind is read from storage; if that takes longer, the launch goes on as a cold one.
const KIND_TIMEOUT_MS = 300;
const KIND_INDEX: Record<LaunchKind, number> = { cold: 0, first: 1, quick: 2 };
const KINDS: readonly LaunchKind[] = ['cold', 'first', 'quick'];
// E2E flows wait until this view is gone before they look at the first screen.
const TEST_ID = 'launch-curtain';

function rectProps(r: R) {
  'worklet';
  const w = Math.max(0, r[2]);
  return { x: r[0], y: r[1], width: w, height: Math.max(0, r[3]), rx: w / 2 };
}
const NOTHING: R = [0, 0, 0, 0];

type Props = { children: ReactNode };

// The launch (hareket.md → Soğuk, İlk, Hızlı açılış): the system splash's frame, drawn again by JS
// and handed over without a jump, turns into the wordmark (or breathes, when quick) and opens the
// app through a window that grows from the capsules' overlap. The app renders underneath from the
// first moment and never waits: if its first screen is late, the ll seesaw until it is there. Runs
// on the UI thread (Reanimated); touches go through to the app. The app's view stays where it is
// in the tree before, during and after the launch, so nothing in it remounts.
export function LaunchCurtain({ children }: Props) {
  const reduce = useReducedMotion();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [shown, setShown] = useState(true);
  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const g = useMemo(() => launchGeometry(w / 2, h / 2), [w, h]);
  const t = useSharedValue(500);
  const wait = useSharedValue(0);
  const ready = useSharedValue(false);
  const kind = useSharedValue(-1);
  const began = useSharedValue(-1);
  const active = useSharedValue(true);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };

  const finish = () => {
    setShown(false);
    useLaunchStore.setState({ curtain: false });
  };

  // The app's first screen.
  useEffect(() => {
    const apply = (r: boolean) => {
      if (r) ready.value = true;
    };
    apply(useLaunchStore.getState().ready);
    return useLaunchStore.subscribe((s) => apply(s.ready));
  }, [ready]);

  const clock = useFrameCallback((frame) => {
    'worklet';
    if (kind.value < 0 || !active.value) return;
    if (began.value < 0) began.value = frame.timestamp;
    const k = KINDS[kind.value] ?? 'cold';
    const now = 500 + frame.timestamp - began.value;
    const T = launchTimeline(k, reduce, wait.value);
    // Not ready where the window should open: one more cycle of the wait motion.
    if (!ready.value && now >= T.gate + wait.value) wait.value += T.cycle;
    t.value = now;
    if (now >= launchTimeline(k, reduce, wait.value).R1) {
      active.value = false;
      runOnJS(finish)();
    }
  }, false);

  // The kind (from storage, or cold if it is slow), then the first frame on screen: hand over from
  // the system splash and start.
  const [kindKnown, setKindKnown] = useState(false);
  useEffect(() => {
    let live = true;
    const settle = (k: LaunchKind) => {
      if (!live || kind.value >= 0) return;
      kind.value = KIND_INDEX[k];
      setKindKnown(true);
    };
    const timer = setTimeout(() => settle('cold'), KIND_TIMEOUT_MS);
    void decideLaunchKind().then(settle);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [kind]);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (!drawn || !kindKnown) return undefined;
    const id = requestAnimationFrame(() => {
      void SplashScreen.hideAsync();
      clock.setActive(true);
    });
    return () => cancelAnimationFrame(id);
  }, [drawn, kindKnown, clock]);

  const scene = useDerivedValue(() =>
    launchFrame(KINDS[kind.value] ?? 'cold', reduce, g, t.value, wait.value),
  );

  // The app under the curtain settles from 1.06 around the overlap as the window opens.
  const appStyle = useAnimatedStyle(() => {
    if (!active.value) return { transform: [] };
    const s = scene.value;
    const dx = s.origin[0] - w / 2;
    const dy = s.origin[1] - h / 2;
    return {
      transform: [
        { translateX: dx },
        { translateY: dy },
        { scale: s.appScale },
        { translateX: -dx },
        { translateY: -dy },
      ],
    };
  });

  return (
    <View style={styles.fill} onLayout={onLayout}>
      <Animated.View style={[styles.fill, appStyle]}>{children}</Animated.View>
      {shown ? (
        size ? (
          <CurtainArt scene={scene} g={g} w={w} h={h} onDrawn={() => setDrawn(true)} />
        ) : (
          // Until the size is known the system splash is still on top.
          <View
            testID={TEST_ID}
            collapsable={false}
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.ink]}
          />
        )
      ) : null}
    </View>
  );
}

function CurtainArt({
  scene,
  g,
  w,
  h,
  onDrawn,
}: {
  scene: SharedValue<LaunchScene>;
  g: LaunchGeometry;
  w: number;
  h: number;
  onDrawn: () => void;
}) {
  const curtain = useAnimatedProps(() => ({ opacity: scene.value.curtain }));
  const windowA = useAnimatedProps(() => rectProps(scene.value.window?.a ?? NOTHING));
  const windowB = useAnimatedProps(() => rectProps(scene.value.window?.b ?? NOTHING));
  const windowA2 = useAnimatedProps(() => rectProps(scene.value.window?.a ?? NOTHING));
  const windowB2 = useAnimatedProps(() => rectProps(scene.value.window?.b ?? NOTHING));
  const rimA = useAnimatedProps(() => rectProps(scene.value.window?.a ?? NOTHING));
  const rimB = useAnimatedProps(() => rectProps(scene.value.window?.b ?? NOTHING));
  const rimClipA = useAnimatedProps(() => rectProps(scene.value.window?.a ?? NOTHING));
  const rimClipB = useAnimatedProps(() => rectProps(scene.value.window?.b ?? NOTHING));
  const white = useAnimatedProps(() => ({ opacity: scene.value.window?.white ?? 0 }));
  const rim = useAnimatedProps(() => ({ opacity: scene.value.window?.rim ?? 0 }));
  const glow = useAnimatedProps(() => ({ opacity: scene.value.glow }));
  const marks = useAnimatedProps(() => ({ opacity: scene.value.marks }));
  const pillA = useAnimatedProps(() => rectProps(scene.value.a));
  const pillB = useAnimatedProps(() => rectProps(scene.value.b));
  const overlap = useAnimatedProps(() => rectProps(scene.value.b));
  const clipA = useAnimatedProps(() => rectProps(scene.value.a));
  const llA = useAnimatedProps(() => rectProps(scene.value.a));
  const llB = useAnimatedProps(() => rectProps(scene.value.b));
  const lettersClip = useAnimatedProps(() => ({
    width: Math.max(0, scene.value.lettersClip + 10),
  }));
  const letter0 = useAnimatedProps(() => ({ d: shiftedPath(S, scene.value.letters[0]) }));
  const letter1 = useAnimatedProps(() => ({ d: shiftedPath(K, scene.value.letters[1]) }));
  const letter2 = useAnimatedProps(() => ({ d: shiftedPath(A, scene.value.letters[2]) }));
  const glint = useAnimatedProps(() => {
    const s = scene.value;
    const gl = s.glint;
    return gl
      ? { d: glintPath(gl.x, g.cy, s.a[1] - 2, s.a[1] + s.a[3] + 2), opacity: gl.opacity }
      : { d: 'M0 0Z', opacity: 0 };
  });
  const ring = useAnimatedProps(() => {
    const r = scene.value.ring;
    return r
      ? { cx: r.cx, cy: r.cy, r: r.r, strokeWidth: r.width, opacity: r.opacity }
      : { cx: 0, cy: 0, r: 0, strokeWidth: 0, opacity: 0 };
  });
  const flare = useAnimatedProps(() => {
    const f = scene.value.flare;
    return f
      ? { cx: f.cx, cy: f.cy, r: f.r, opacity: f.opacity }
      : { cx: 0, cy: 0, r: 0, opacity: 0 };
  });

  return (
    <View
      testID={TEST_ID}
      collapsable={false}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={onDrawn}
    >
      <StatusBar style="light" />
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id="launch-glow">
            <Stop offset="0" stopColor={LAUNCH_LIGHT.glow} stopOpacity={0.8} />
            <Stop offset="1" stopColor={LAUNCH_LIGHT.glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="launch-flare">
            <Stop offset="0" stopColor={BRAND.white} stopOpacity={0.95} />
            <Stop offset="0.3" stopColor={LAUNCH_LIGHT.flash} stopOpacity={0.5} />
            <Stop offset="1" stopColor={BRAND.pink} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="launch-glint" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={BRAND.white} stopOpacity={0} />
            <Stop offset="0.5" stopColor={BRAND.white} stopOpacity={0.85} />
            <Stop offset="1" stopColor={BRAND.white} stopOpacity={0} />
          </LinearGradient>
          <ClipPath id="launch-first">
            <AnimatedRect animatedProps={clipA} />
          </ClipPath>
          <ClipPath id="launch-ll">
            <AnimatedRect animatedProps={llA} />
            <AnimatedRect animatedProps={llB} />
          </ClipPath>
          <ClipPath id="launch-letters">
            <AnimatedRect x={-10} y={0} height={h} animatedProps={lettersClip} />
          </ClipPath>
          <ClipPath id="launch-rim-a">
            <AnimatedRect animatedProps={rimClipA} />
          </ClipPath>
          <ClipPath id="launch-rim-b">
            <AnimatedRect animatedProps={rimClipB} />
          </ClipPath>
          {/* The window: the curtain is cut where its capsules are. */}
          <Mask id="launch-window" maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <Rect x={0} y={0} width={w} height={h} fill={LAUNCH_MASK.keep} />
            <AnimatedRect animatedProps={windowA} fill={LAUNCH_MASK.cut} />
            <AnimatedRect animatedProps={windowB} fill={LAUNCH_MASK.cut} />
          </Mask>
        </Defs>
        <AnimatedG animatedProps={curtain}>
          <G mask="url(#launch-window)">
            <Rect x={0} y={0} width={w} height={h} fill={BRAND.ink} />
            <AnimatedEllipse
              cx={g.cx}
              cy={g.cy}
              rx={240}
              ry={270}
              fill="url(#launch-glow)"
              animatedProps={glow}
            />
            <AnimatedG animatedProps={marks}>
              <G clipPath="url(#launch-letters)">
                <G translateX={g.wordX} translateY={g.wordY} scale={g.wordScale} fill={BRAND.white}>
                  <AnimatedPath animatedProps={letter0} />
                  <AnimatedPath animatedProps={letter1} />
                  <AnimatedPath animatedProps={letter2} />
                </G>
              </G>
              <AnimatedRect animatedProps={pillA} fill={BRAND.purple} />
              <AnimatedRect animatedProps={pillB} fill={BRAND.pink} />
              <AnimatedRect
                animatedProps={overlap}
                fill={BRAND.white}
                clipPath="url(#launch-first)"
              />
              <G clipPath="url(#launch-ll)">
                <AnimatedPath animatedProps={glint} fill="url(#launch-glint)" />
              </G>
            </AnimatedG>
            <AnimatedCircle animatedProps={ring} fill="none" stroke={BRAND.white} />
            <AnimatedCircle animatedProps={flare} fill="url(#launch-flare)" />
          </G>
          {/* The window fills white as it opens, with a thin light where its capsules meet. */}
          <AnimatedG animatedProps={white} fill={BRAND.white}>
            <AnimatedRect animatedProps={windowA2} />
            <AnimatedRect animatedProps={windowB2} />
          </AnimatedG>
          <AnimatedG animatedProps={rim} fill="none" stroke={BRAND.white} strokeWidth={2.4}>
            <G clipPath="url(#launch-rim-b)">
              <AnimatedRect animatedProps={rimA} />
            </G>
            <G clipPath="url(#launch-rim-a)">
              <AnimatedRect animatedProps={rimB} />
            </G>
          </AnimatedG>
        </AnimatedG>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  ink: { backgroundColor: BRAND.ink },
});
