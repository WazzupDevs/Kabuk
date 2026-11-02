import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Component, type ReactNode, useEffect, useMemo, useState } from 'react';
import { type ImageSourcePropType, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
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
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { BRAND, LAUNCH_LIGHT } from '@/theme/brand';
import {
  CLEAR_SCENE,
  flareCircle,
  glintPath,
  type LaunchApart,
  launchFrame,
  type LaunchGeometry,
  LAUNCH_BAND,
  launchGeometry,
  type LaunchKind,
  type LaunchScene,
  launchTimeline,
  type Rect as R,
  RISO_BOIL_OFFSET,
  RISO_MISREGISTER,
  risoIn,
  risoVariant,
} from '@/theme/launchMotion';
import { LAUNCH_TEXTURE_BOX, type TextureLayer } from '@/theme/launchTextures';

import { decideLaunchKind, launchGuard, useLaunchStore } from './launchStore';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// The kind is read from storage; if that takes longer, the launch goes on as a cold one.
const KIND_TIMEOUT_MS = 300;
// Android's splash leaving (its own fade) before the curtain moves.
const SPLASH_HANDOFF_MS = 420;
const KIND_INDEX: Record<LaunchKind, number> = { cold: 0, first: 1, quick: 2 };
const KINDS: readonly LaunchKind[] = ['cold', 'first', 'quick'];
// E2E flows wait until this view is gone before they look at the first screen.
const TEST_ID = 'launch-curtain';

// The riso textures (assets/launch, cut by `pnpm launch:textures` to src/theme/launchTextures.ts),
// three boil variants each; the paper ground is the set's whole screen.
type Variants = readonly [ImageSourcePropType, ImageSourcePropType, ImageSourcePropType];
const GROUND: ImageSourcePropType = require('../../../assets/launch/zemin-lif.webp');
const GLOW: Variants = [
  require('../../../assets/launch/kirpik-parilti-1.webp'),
  require('../../../assets/launch/kirpik-parilti-2.webp'),
  require('../../../assets/launch/kirpik-parilti-3.webp'),
];
const PURPLE: Variants = [
  require('../../../assets/launch/kirpik-mor-1.webp'),
  require('../../../assets/launch/kirpik-mor-2.webp'),
  require('../../../assets/launch/kirpik-mor-3.webp'),
];
const PINK: Variants = [
  require('../../../assets/launch/kirpik-pembe-1.webp'),
  require('../../../assets/launch/kirpik-pembe-2.webp'),
  require('../../../assets/launch/kirpik-pembe-3.webp'),
];
const WHITE: Variants = [
  require('../../../assets/launch/kirpik-beyaz-1.webp'),
  require('../../../assets/launch/kirpik-beyaz-2.webp'),
  require('../../../assets/launch/kirpik-beyaz-3.webp'),
];
const LETTERS: readonly [Variants, Variants, Variants] = [
  [
    require('../../../assets/launch/kirpik-harf-s-1.webp'),
    require('../../../assets/launch/kirpik-harf-s-2.webp'),
    require('../../../assets/launch/kirpik-harf-s-3.webp'),
  ],
  [
    require('../../../assets/launch/kirpik-harf-k-1.webp'),
    require('../../../assets/launch/kirpik-harf-k-2.webp'),
    require('../../../assets/launch/kirpik-harf-k-3.webp'),
  ],
  [
    require('../../../assets/launch/kirpik-harf-a-1.webp'),
    require('../../../assets/launch/kirpik-harf-a-2.webp'),
    require('../../../assets/launch/kirpik-harf-a-3.webp'),
  ],
];

function rectProps(r: R) {
  'worklet';
  const w = Math.max(0, r[2]);
  return { x: r[0], y: r[1], width: w, height: Math.max(0, r[3]), rx: w / 2 };
}
const NOTHING: R = [0, 0, 0, 0];

type Props = { children: ReactNode };

// The launch (hareket.md → Soğuk, İlk, Hızlı açılış; riso, Aura v65 §14): the system splash's
// frame, drawn again by JS and handed over without a jump, turns into its riso print while the
// splash leaves, into the wordmark (or breathes, when quick), and the print parts (its inks move
// apart as the curtain fades) to show the app. The app renders underneath from the first moment and
// never waits: if its first screen is late, the ll seesaw until it is there. Runs on the UI thread
// (Reanimated); touches go through to the app. The app's view stays where it is in the tree before,
// during and after the launch, so nothing in it remounts. Guarded (src/lib/launchGuard.ts): the
// system splash goes at the latest after 3 s, and a curtain that fails (its drawing throws, a frame
// throws) is dropped and reported; the app shows either way.
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
  // Time since the curtain's first frame: the riso coming in and the boil.
  const since = useSharedValue(-1);
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

  // From the curtain's first frame on. The system splash goes first; the curtain holds its first
  // frame (the same mark on the same ink, its riso coming in) while Android takes the splash away,
  // then moves. Started together, the splash's mark stayed over the moving curtain for a moment (the
  // owner's report, 27 Ekim: a double picture).
  const clock = useFrameCallback((frame) => {
    'worklet';
    if (kind.value < 0 || !active.value) return;
    try {
      if (broken.value) throw new Error('scene');
      if (began.value < 0) began.value = frame.timestamp;
      const ms = frame.timestamp - began.value;
      since.value = ms;
      if (ms < SPLASH_HANDOFF_MS) return;
      const k = KINDS[kind.value] ?? 'cold';
      const now = 500 + ms - SPLASH_HANDOFF_MS;
      const T = launchTimeline(k, reduce, wait.value);
      // Not ready where the print should part: one more cycle of the wait motion.
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
    const id = requestAnimationFrame(() => {
      launchGuard.begin();
      clock.setActive(true);
    });
    return () => cancelAnimationFrame(id);
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
  const riso = useDerivedValue(() => risoIn(since.value));
  const variant = useDerivedValue(() => risoVariant(since.value, reduce));

  // The app under the curtain settles from 1.06 around the overlap as the print parts.
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
            <CurtainArt
              scene={scene}
              riso={riso}
              variant={variant}
              g={g}
              w={w}
              h={h}
              onDrawn={() => setDrawn(true)}
            />
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

type Art = {
  scene: SharedValue<LaunchScene>;
  variant: SharedValue<number>;
  g: LaunchGeometry;
  w: number;
  h: number;
};

// The curtain as still pictures in views (§14.2.2): a frame changes only transforms, opacities and
// the capsules' clipping boxes, and no picture is drawn again (the owner's report, 29 Ekim:
// react-native-svg draws each changed picture again in software). From the bottom: the ink and its
// paper; the glow; the splash's flat mark, which the riso print takes over while the splash leaves
// (§14.2.4); the print's inks, each a layer of its own (the letters, the purple, the pink, the white
// overlap); and in a band around the centre the flat ring, flare and glint (decision 12.11).
function CurtainArt({
  scene,
  riso,
  variant,
  g,
  w,
  h,
  onDrawn,
}: Art & { riso: SharedValue<number>; onDrawn: () => void }) {
  const root = useAnimatedStyle(() => ({ opacity: scene.value.curtain }));
  const paper = useAnimatedStyle(() => ({ opacity: riso.value }));
  const flat = useAnimatedStyle(() => ({ opacity: 1 - riso.value }));
  const glow = useAnimatedStyle(() => ({ opacity: scene.value.glow * riso.value }));
  const marks = useAnimatedStyle(() => ({ opacity: scene.value.marks * riso.value }));
  const art = { scene, variant, g, w, h };
  return (
    <Animated.View
      testID={TEST_ID}
      collapsable={false}
      pointerEvents="none"
      needsOffscreenAlphaCompositing
      style={[StyleSheet.absoluteFill, styles.ink, root]}
      onLayout={onDrawn}
    >
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, paper]}>
        <Image source={GROUND} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, glow]}>
        <Texture layer="glow" sources={GLOW} variant={variant} g={g} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, flat]}>
        <FlatMark g={g} w={w} />
      </Animated.View>
      <Animated.View needsOffscreenAlphaCompositing style={[StyleSheet.absoluteFill, marks]}>
        <Letters {...art} />
        <Capsule {...art} ink="a" sources={PURPLE} />
        <Capsule {...art} ink="b" sources={PINK} />
        <Overlap {...art} />
      </Animated.View>
      <Lights scene={scene} g={g} w={w} />
    </Animated.View>
  );
}

// The band around the centre the ring, the flare and the glint move in (theme/launchMotion.ts).
const BAND = LAUNCH_BAND;

// One texture's three boil variants, one over the other where its box puts them; a frame changes
// only which one shows. Each variant sits at its own small offset (the boil's jitter).
function Texture({
  layer,
  sources,
  variant,
  g,
}: {
  layer: TextureLayer;
  sources: Variants;
  variant: SharedValue<number>;
  g: LaunchGeometry;
}) {
  const [x, y, bw, bh] = LAUNCH_TEXTURE_BOX[layer];
  return (
    <>
      {sources.map((source, i) => {
        const [dx, dy] = RISO_BOIL_OFFSET[layer][i] ?? [0, 0];
        return (
          <TextureVariant
            key={i}
            index={i}
            variant={variant}
            source={source}
            box={{ left: g.cx + x + dx, top: g.cy + y + dy, width: bw, height: bh }}
          />
        );
      })}
    </>
  );
}

function TextureVariant({
  index,
  variant,
  source,
  box,
}: {
  index: number;
  variant: SharedValue<number>;
  source: ImageSourcePropType;
  box: { left: number; top: number; width: number; height: number };
}) {
  const shows = useAnimatedStyle(() => ({ opacity: variant.value === index ? 1 : 0 }));
  return (
    <Animated.View style={[styles.at, box, shows]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="fill" />
    </Animated.View>
  );
}

// An ink's layer: its fixed misregistration and, as the print parts, its offset.
function useInk(scene: SharedValue<LaunchScene>, ink: keyof LaunchApart) {
  return useAnimatedStyle(() => {
    const [mx, my] = RISO_MISREGISTER[ink];
    const [ax, ay] = scene.value.apart[ink];
    return { transform: [{ translateX: mx + ax }, { translateY: my + ay }] };
  });
}

// A capsule's clipping box at `r` (the texture inside stays fixed to the screen: as the capsule
// grows, its dots keep their size).
function clipStyle(r: R) {
  'worklet';
  const cw = Math.max(0, r[2]);
  return {
    width: cw,
    height: Math.max(0, r[3]),
    borderRadius: cw / 2,
    transform: [{ translateX: r[0] }, { translateY: r[1] }],
  };
}
function unclip(r: R) {
  'worklet';
  return { transform: [{ translateX: -r[0] }, { translateY: -r[1] }] };
}

function Capsule({
  scene,
  variant,
  g,
  w,
  h,
  ink,
  sources,
}: Art & { ink: 'a' | 'b'; sources: Variants }) {
  const layer = useInk(scene, ink);
  const clip = useAnimatedStyle(() => clipStyle(scene.value[ink]));
  const inside = useAnimatedStyle(() => unclip(scene.value[ink]));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, layer]}>
      <Animated.View style={[styles.clip, clip]}>
        <Animated.View style={[styles.at, { width: w, height: h }, inside]}>
          <Texture layer={ink} sources={sources} variant={variant} g={g} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// The white where the capsules overlap: the second capsule's shape inside the first's.
function Overlap({ scene, variant, g, w, h }: Art) {
  const layer = useInk(scene, 'cross');
  const clipA = useAnimatedStyle(() => clipStyle(scene.value.a));
  const clipB = useAnimatedStyle(() => {
    const { a, b } = scene.value;
    return clipStyle([b[0] - a[0], b[1] - a[1], b[2], b[3]]);
  });
  const inside = useAnimatedStyle(() => unclip(scene.value.b));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, layer]}>
      <Animated.View style={[styles.clip, clipA]}>
        <Animated.View style={[styles.clip, clipB]}>
          <Animated.View style={[styles.at, { width: w, height: h }, inside]}>
            <Texture layer="cross" sources={WHITE} variant={variant} g={g} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// The letters, each coming out from behind the first l: they show only left of `lettersClip`. The
// clip is a screen-wide box moved left so that its right edge is there, and moved back inside.
function Letters({ scene, variant, g, w, h }: Art) {
  const layer = useInk(scene, 'letters');
  const clip = useAnimatedStyle(() => ({
    transform: [{ translateX: scene.value.lettersClip - w }],
  }));
  const inside = useAnimatedStyle(() => ({
    transform: [{ translateX: w - scene.value.lettersClip }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, layer]}>
      <Animated.View style={[styles.clip, { width: w, height: h }, clip]}>
        <Animated.View style={[styles.at, { width: w, height: h }, inside]}>
          {LETTERS.map((sources, i) => (
            <Letter key={i} index={i} scene={scene} variant={variant} g={g} sources={sources} />
          ))}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

function Letter({
  index,
  scene,
  variant,
  g,
  sources,
}: {
  index: number;
  scene: SharedValue<LaunchScene>;
  variant: SharedValue<number>;
  g: LaunchGeometry;
  sources: Variants;
}) {
  const moved = useAnimatedStyle(() => ({
    transform: [{ translateX: (scene.value.letters[index] ?? 0) * g.wordScale }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, moved]}>
      <Texture layer="letters" sources={sources} variant={variant} g={g} />
    </Animated.View>
  );
}

// The system splash's mark, flat (its first frame): still, drawn once.
function FlatMark({ g, w }: { g: LaunchGeometry; w: number }) {
  const bandTop = g.cy - BAND / 2;
  return (
    <View style={[styles.at, { top: bandTop, width: w, height: BAND }]}>
      <Svg width={w} height={BAND} viewBox={`0 ${bandTop} ${w} ${BAND}`}>
        <Defs>
          <ClipPath id="launch-flat-first">
            <Rect {...rectProps(g.a0)} />
          </ClipPath>
        </Defs>
        <Rect {...rectProps(g.a0)} fill={BRAND.purple} />
        <Rect {...rectProps(g.b0)} fill={BRAND.pink} />
        <Rect {...rectProps(g.b0)} fill={BRAND.white} clipPath="url(#launch-flat-first)" />
      </Svg>
    </View>
  );
}

// The ring, the flare and the glint, flat as before (decision 12.11), in the band around the
// centre. Their props stay as they are while none shows, so the picture is not drawn again.
function Lights({
  scene,
  g,
  w,
}: {
  scene: SharedValue<LaunchScene>;
  g: LaunchGeometry;
  w: number;
}) {
  const glinting = (s: LaunchScene) => {
    'worklet';
    return s.glint !== null;
  };
  const llA = useAnimatedProps(() => rectProps(glinting(scene.value) ? scene.value.a : NOTHING));
  const llB = useAnimatedProps(() => rectProps(glinting(scene.value) ? scene.value.b : NOTHING));
  const glint = useAnimatedProps(() => {
    const s = scene.value;
    const gl = s.glint;
    return gl
      ? {
          d: glintPath(gl.x, g.cy, s.a[1] - 2, s.a[1] + s.a[3] + 2),
          opacity: gl.opacity * s.marks,
        }
      : { d: 'M0 0Z', opacity: 0 };
  });
  const ring = useAnimatedProps(() => {
    const r = scene.value.ring;
    return r
      ? { cx: r.cx, cy: r.cy, r: r.r, strokeWidth: r.width, opacity: r.opacity }
      : { cx: 0, cy: 0, r: 0, strokeWidth: 0, opacity: 0 };
  });
  const flare = useAnimatedProps(() => flareCircle(scene.value.flare));
  const bandTop = g.cy - BAND / 2;
  return (
    <View style={[styles.at, { top: bandTop, width: w, height: BAND }]}>
      <Svg width={w} height={BAND} viewBox={`0 ${bandTop} ${w} ${BAND}`}>
        <Defs>
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
          <ClipPath id="launch-ll">
            <AnimatedRect animatedProps={llA} />
            <AnimatedRect animatedProps={llB} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#launch-ll)">
          <AnimatedPath animatedProps={glint} fill="url(#launch-glint)" />
        </G>
        <AnimatedCircle animatedProps={ring} fill="none" stroke={BRAND.white} />
        <AnimatedCircle animatedProps={flare} fill="url(#launch-flare)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  ink: { backgroundColor: BRAND.ink },
  at: { position: 'absolute', left: 0, top: 0 },
  clip: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
});
