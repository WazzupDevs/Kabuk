import { StatusBar } from 'expo-status-bar';
import { Component, type ReactNode, useEffect, useMemo, useState } from 'react';
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
  CLEAR_SCENE,
  flareCircle,
  glintPath,
  launchFrame,
  type LaunchGeometry,
  LAUNCH_BAND,
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

import { decideLaunchKind, launchGuard, useLaunchStore } from './launchStore';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const [S, K, A] = SKA_LETTERS.map(parsePath) as [ParsedPath, ParsedPath, ParsedPath];
// The kind is read from storage; if that takes longer, the launch goes on as a cold one.
const KIND_TIMEOUT_MS = 300;
// Android's splash leaving (its own fade) before the curtain moves.
const SPLASH_HANDOFF_MS = 420;
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
// in the tree before, during and after the launch, so nothing in it remounts. Guarded
// (src/lib/launchGuard.ts): the system splash goes at the latest after 3 s, and a curtain that fails
// (its drawing throws, a frame throws) is dropped and reported; the app shows either way.
export function LaunchCurtain({ children }: Props) {
  const reduce = useReducedMotion();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // Off when the launch ends, the guard drops it, or it fails.
  const shown = useLaunchStore((s) => s.curtain);
  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const g = useMemo(() => launchGeometry(w / 2, h / 2), [w, h]);
  const t = useSharedValue(500);
  const wait = useSharedValue(0);
  const ready = useSharedValue(false);
  const kind = useSharedValue(-1);
  const began = useSharedValue(-1);
  const active = useSharedValue(true);
  // A frame threw on the UI thread: the curtain draws nothing and is dropped.
  const broken = useSharedValue(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };

  const finish = () => {
    useLaunchStore.setState({ curtain: false });
  };
  const failOnUI = (message: string) => {
    launchGuard.fail(new Error(`launch frame: ${message}`));
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
    try {
      if (broken.value) throw new Error('scene');
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
    } catch (e) {
      active.value = false;
      runOnJS(failOnUI)(e instanceof Error ? e.message : String(e));
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
    if (!drawn || !kindKnown || !shown) return undefined;
    // The system splash goes first; the curtain holds its first frame (the same mark on the same
    // ink) while Android takes the splash away, then moves. Started together, the splash's mark
    // stayed over the moving curtain for a moment (the owner's report, 27 Ekim: a double picture).
    let hold: ReturnType<typeof setTimeout> | undefined;
    const id = requestAnimationFrame(() => {
      launchGuard.begin();
      hold = setTimeout(() => clock.setActive(true), SPLASH_HANDOFF_MS);
    });
    return () => {
      cancelAnimationFrame(id);
      if (hold) clearTimeout(hold);
    };
  }, [drawn, kindKnown, shown, clock]);

  // Dropped (the guard) or failed: the clock stops and the app keeps its own size.
  useEffect(() => {
    if (shown) return;
    active.set(false);
    clock.setActive(false);
  }, [shown, active, clock]);

  const scene = useDerivedValue(() => {
    try {
      return launchFrame(KINDS[kind.value] ?? 'cold', reduce, g, t.value, wait.value);
    } catch {
      broken.set(true);
      return CLEAR_SCENE;
    }
  });

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
        <CurtainBoundary>
          {size ? (
            <CurtainArt scene={scene} g={g} w={w} h={h} onDrawn={() => setDrawn(true)} />
          ) : (
            // Until the size is known the system splash is still on top.
            <View
              testID={TEST_ID}
              collapsable={false}
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.ink]}
            />
          )}
        </CurtainBoundary>
      ) : null}
    </View>
  );
}

// The curtain's own error boundary: a drawing that throws drops the curtain and is reported; the
// app beside it is outside the boundary and stays mounted.
class CurtainBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    launchGuard.fail(error);
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

// The curtain in three parts, so that a frame redraws as little as it can (the owner's report, 29
// Ekim: the launch stuttered; react-native-svg draws each changed picture again in software, and
// the one picture of the whole screen with its mask was drawn again on every frame). Until the
// window opens: the ink and the glow are a view and a still picture (only their opacity moves),
// and the marks, the ring and the flare move in a band around the centre. While the window opens:
// everything once more, cut by the window, in the whole screen's picture, which is still before
// (its props do not change, so it is never drawn again). The same drawing as before, in the same
// places.
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
  const root = useAnimatedStyle(() => ({ opacity: scene.value.curtain }));
  const before = useAnimatedStyle(() => ({ opacity: scene.value.window ? 0 : 1 }));
  const glowView = useAnimatedStyle(() => ({
    opacity: scene.value.window ? 0 : scene.value.glow,
  }));
  const opening = useAnimatedStyle(() => ({ opacity: scene.value.window ? 1 : 0 }));
  const bandTop = g.cy - BAND / 2;
  return (
    <Animated.View
      testID={TEST_ID}
      collapsable={false}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, root]}
      onLayout={onDrawn}
    >
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, styles.ink, before]} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: g.cx - GLOW_RX,
            top: g.cy - GLOW_RY,
            width: GLOW_RX * 2,
            height: GLOW_RY * 2,
          },
          glowView,
        ]}
      >
        <Svg width={GLOW_RX * 2} height={GLOW_RY * 2}>
          <Defs>
            <RadialGradient id="launch-glow-still">
              <Stop offset="0" stopColor={LAUNCH_LIGHT.glow} stopOpacity={0.8} />
              <Stop offset="1" stopColor={LAUNCH_LIGHT.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={GLOW_RX}
            cy={GLOW_RY}
            rx={GLOW_RX}
            ry={GLOW_RY}
            fill="url(#launch-glow-still)"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[{ position: 'absolute', left: 0, top: bandTop, width: w, height: BAND }, before]}
      >
        <Svg width={w} height={BAND} viewBox={`0 ${bandTop} ${w} ${BAND}`}>
          <Marks scene={scene} g={g} h={h} id="band" phase="before" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, opening]}>
        <WindowArt scene={scene} g={g} w={w} h={h} />
      </Animated.View>
    </Animated.View>
  );
}

// The glow's ellipse around the centre and the band the marks move in (theme/launchMotion.ts).
const GLOW_RX = 240;
const GLOW_RY = 270;
const BAND = LAUNCH_BAND;

// The marks (the letters, the capsules, the glint), the ring and the flare. They move only in their
// `phase` (before the window, or while it opens); otherwise their props stay as they are and their
// picture is not drawn again.
function Marks({
  scene,
  g,
  h,
  id,
  phase,
}: {
  scene: SharedValue<LaunchScene>;
  g: LaunchGeometry;
  h: number;
  id: string;
  phase: 'before' | 'window';
}) {
  const before = phase === 'before';
  const on = (s: LaunchScene) => {
    'worklet';
    return (s.window === null) === before ? s : CLEAR_SCENE;
  };
  const marks = useAnimatedProps(() => ({ opacity: on(scene.value).marks }));
  const pillA = useAnimatedProps(() => rectProps(on(scene.value).a));
  const pillB = useAnimatedProps(() => rectProps(on(scene.value).b));
  const overlap = useAnimatedProps(() => rectProps(on(scene.value).b));
  const clipA = useAnimatedProps(() => rectProps(on(scene.value).a));
  const llA = useAnimatedProps(() => rectProps(on(scene.value).a));
  const llB = useAnimatedProps(() => rectProps(on(scene.value).b));
  const lettersClip = useAnimatedProps(() => ({
    width: Math.max(0, on(scene.value).lettersClip + 10),
  }));
  const letter0 = useAnimatedProps(() => ({ d: shiftedPath(S, on(scene.value).letters[0]) }));
  const letter1 = useAnimatedProps(() => ({ d: shiftedPath(K, on(scene.value).letters[1]) }));
  const letter2 = useAnimatedProps(() => ({ d: shiftedPath(A, on(scene.value).letters[2]) }));
  const glint = useAnimatedProps(() => {
    const s = on(scene.value);
    const gl = s.glint;
    return gl
      ? { d: glintPath(gl.x, g.cy, s.a[1] - 2, s.a[1] + s.a[3] + 2), opacity: gl.opacity }
      : { d: 'M0 0Z', opacity: 0 };
  });
  const ring = useAnimatedProps(() => {
    const r = on(scene.value).ring;
    return r
      ? { cx: r.cx, cy: r.cy, r: r.r, strokeWidth: r.width, opacity: r.opacity }
      : { cx: 0, cy: 0, r: 0, strokeWidth: 0, opacity: 0 };
  });
  const flare = useAnimatedProps(() => flareCircle(on(scene.value).flare));
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}-flare`}>
          <Stop offset="0" stopColor={BRAND.white} stopOpacity={0.95} />
          <Stop offset="0.3" stopColor={LAUNCH_LIGHT.flash} stopOpacity={0.5} />
          <Stop offset="1" stopColor={BRAND.pink} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={BRAND.white} stopOpacity={0} />
          <Stop offset="0.5" stopColor={BRAND.white} stopOpacity={0.85} />
          <Stop offset="1" stopColor={BRAND.white} stopOpacity={0} />
        </LinearGradient>
        <ClipPath id={`${id}-first`}>
          <AnimatedRect animatedProps={clipA} />
        </ClipPath>
        <ClipPath id={`${id}-ll`}>
          <AnimatedRect animatedProps={llA} />
          <AnimatedRect animatedProps={llB} />
        </ClipPath>
        <ClipPath id={`${id}-letters`}>
          <AnimatedRect x={-10} y={0} height={h} animatedProps={lettersClip} />
        </ClipPath>
      </Defs>
      <AnimatedG animatedProps={marks}>
        <G clipPath={`url(#${id}-letters)`}>
          <G translateX={g.wordX} translateY={g.wordY} scale={g.wordScale} fill={BRAND.white}>
            <AnimatedPath animatedProps={letter0} />
            <AnimatedPath animatedProps={letter1} />
            <AnimatedPath animatedProps={letter2} />
          </G>
        </G>
        <AnimatedRect animatedProps={pillA} fill={BRAND.purple} />
        <AnimatedRect animatedProps={pillB} fill={BRAND.pink} />
        <AnimatedRect animatedProps={overlap} fill={BRAND.white} clipPath={`url(#${id}-first)`} />
        <G clipPath={`url(#${id}-ll)`}>
          <AnimatedPath animatedProps={glint} fill={`url(#${id}-glint)`} />
        </G>
      </AnimatedG>
      <AnimatedCircle animatedProps={ring} fill="none" stroke={BRAND.white} />
      <AnimatedCircle animatedProps={flare} fill={`url(#${id}-flare)`} />
    </>
  );
}

// The whole screen cut by the window, with the white that fills it and its rim: drawn only while
// the window opens.
function WindowArt({
  scene,
  g,
  w,
  h,
}: {
  scene: SharedValue<LaunchScene>;
  g: LaunchGeometry;
  w: number;
  h: number;
}) {
  const open = (s: LaunchScene) => {
    'worklet';
    return s.window;
  };
  const windowA = useAnimatedProps(() => rectProps(open(scene.value)?.a ?? NOTHING));
  const windowB = useAnimatedProps(() => rectProps(open(scene.value)?.b ?? NOTHING));
  const windowA2 = useAnimatedProps(() => rectProps(open(scene.value)?.a ?? NOTHING));
  const windowB2 = useAnimatedProps(() => rectProps(open(scene.value)?.b ?? NOTHING));
  const rimA = useAnimatedProps(() => rectProps(open(scene.value)?.a ?? NOTHING));
  const rimB = useAnimatedProps(() => rectProps(open(scene.value)?.b ?? NOTHING));
  const rimClipA = useAnimatedProps(() => rectProps(open(scene.value)?.a ?? NOTHING));
  const rimClipB = useAnimatedProps(() => rectProps(open(scene.value)?.b ?? NOTHING));
  const white = useAnimatedProps(() => ({ opacity: open(scene.value)?.white ?? 0 }));
  const rim = useAnimatedProps(() => ({ opacity: open(scene.value)?.rim ?? 0 }));
  const glow = useAnimatedProps(() => ({
    opacity: open(scene.value) ? scene.value.glow : 0,
  }));
  return (
    <Svg width={w} height={h}>
      <Defs>
        <RadialGradient id="launch-glow">
          <Stop offset="0" stopColor={LAUNCH_LIGHT.glow} stopOpacity={0.8} />
          <Stop offset="1" stopColor={LAUNCH_LIGHT.glow} stopOpacity={0} />
        </RadialGradient>
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
      <G mask="url(#launch-window)">
        <Rect x={0} y={0} width={w} height={h} fill={BRAND.ink} />
        <AnimatedEllipse
          cx={g.cx}
          cy={g.cy}
          rx={GLOW_RX}
          ry={GLOW_RY}
          fill="url(#launch-glow)"
          animatedProps={glow}
        />
        <Marks scene={scene} g={g} h={h} id="window" phase="window" />
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
    </Svg>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  ink: { backgroundColor: BRAND.ink },
});
