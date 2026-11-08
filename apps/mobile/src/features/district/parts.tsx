import { router } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Glass, Round, T, useKit } from '@/aura/kit';
import { boxShadowParts } from '@/components/NativeShadow';
import { Screen } from '@/components/Screen';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { RISO_TYPE } from '@/theme/riso';
import { SEMT, SEMT_LAYERS } from '@/theme/semt';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// Semte Git's shared parts (docs/design/aura/project/semt.css; aktarim-semte-git.md §2).

export const RISO = {
  closed: require('../../../assets/riso/semt/gecit-kapali.webp'),
  open: require('../../../assets/riso/semt/gecit-acik.webp'),
  locked: require('../../../assets/riso/semt/gecit-kilitli.webp'),
  map: require('../../../assets/riso/semt/harita-anten-kanki.webp'),
  bench: require('../../../assets/riso/semt/bank-kanki.webp'),
  sign: require('../../../assets/riso/semt/yol-tabelasi-valizli-kanki.webp'),
  door: require('../../../assets/riso/semt/kesfet-kucuk-kapi.webp'),
  doorLocked: require('../../../assets/riso/semt/kesfet-kucuk-kapi-kilitli.webp'),
} as const;

const LAYER = {
  openGround: require('../../../assets/riso/semt/katman/gecit-acik-zemin.webp'),
  light: require('../../../assets/riso/semt/katman/gecit-acik-isik.webp'),
  leaf: require('../../../assets/riso/semt/katman/gecit-kanat-kapali.webp'),
  buddies: [
    require('../../../assets/riso/semt/katman/gecit-kanki-1.webp'),
    require('../../../assets/riso/semt/katman/gecit-kanki-2.webp'),
    require('../../../assets/riso/semt/katman/gecit-kanki-3.webp'),
  ],
  lockedGround: require('../../../assets/riso/semt/katman/gecit-kilitli-zemin.webp'),
  lock: require('../../../assets/riso/semt/katman/gecit-kilit.webp'),
  drop: require('../../../assets/riso/semt/katman/gecit-damla.webp'),
  benchGround: require('../../../assets/riso/semt/katman/bank-kanki-zemin.webp'),
  dot: require('../../../assets/riso/semt/katman/bank-nokta.webp'),
} as const;

const bezier = (b: readonly [number, number, number, number]) =>
  Easing.bezier(b[0], b[1], b[2], b[3]);
const ARRIVE = bezier(MOTION.curves.arrive);
const SWAP = bezier(MOTION.curves.swap);

// The scene as wide as the page (350 on the canvas's 390).
export function useSceneWidth(): number {
  const { width } = useWindowDimensions();
  const { shape } = useTheme();
  return width - 2 * shape.screenPadding;
}

// A picture at its own size in a layer (never absoluteFill: RisoPicture.tsx).
function Layer({
  source,
  left,
  top,
  width,
  height,
}: {
  source: ImageSourcePropType;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return (
    <Image
      source={source}
      fadeDuration={0}
      accessible={false}
      resizeMode="cover"
      style={{ position: 'absolute', left, top, width, height }}
    />
  );
}

// `.scn`: the riso scene, 28 round, its soft shadow in the light scheme only.
export function SceneFrame({
  height,
  label,
  width: own,
  children,
}: {
  // The canvas's height for its 350 width (240, 230 or 250).
  height: number;
  label: string;
  // Narrower than the page (inside the chat's stream).
  width?: number;
  children: (k: number, width: number, height: number) => ReactNode;
}) {
  const { scheme } = useKit();
  const page = useSceneWidth();
  const width = own ?? page;
  const k = width / SEMT.scene.width;
  const h = height * k;
  const r = SEMT.scene.radius;
  const shadow = boxShadowParts(
    useLabOff('golge'),
    scheme === 'light' ? SEMT.scene.shadow : undefined,
    r,
  );
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ width, height: h, borderRadius: r, boxShadow: shadow.boxShadow }}
    >
      {shadow.node}
      <View style={{ width, height: h, borderRadius: r, overflow: 'hidden' }}>
        {children(k, width, h)}
      </View>
    </View>
  );
}

export function StillScene({
  source,
  height,
  label,
  width,
}: {
  source: ImageSourcePropType;
  height: number;
  label: string;
  width?: number;
}) {
  return (
    <SceneFrame height={height} label={label} width={width}>
      {(_k, w, h) => <Layer source={source} left={0} top={0} width={w} height={h} />}
    </SceneFrame>
  );
}

// GecitAcik (hareket.json → semteGit.gecitOpen): the leaf turns open on its hinge, the light comes
// from the doorway, the three buddies pop in; the full picture is the last frame. Reduce motion:
// the full picture, still.
export function GecitOpenScene({ label }: { label: string }) {
  const reduce = useReduceMotion();
  const m = MOTION.semteGit.gecitOpen;
  const [v] = useState(() => ({
    leaf: new Animated.Value(0),
    light: new Animated.Value(0),
    buddies: m.buddies.startMs.map(() => new Animated.Value(0)),
    fade: m.buddies.startMs.map(() => new Animated.Value(0)),
    last: new Animated.Value(0),
  }));
  useEffect(() => {
    if (reduce) return undefined;
    const pop = MOTION.springs.pop;
    const run = Animated.parallel([
      Animated.timing(v.leaf, {
        toValue: 1,
        duration: m.leaf.ms[1] - m.leaf.ms[0],
        delay: m.leaf.ms[0],
        easing: ARRIVE,
        useNativeDriver: true,
      }),
      Animated.timing(v.light, {
        toValue: 1,
        duration: m.light.ms[1] - m.light.ms[0],
        delay: m.light.ms[0],
        easing: ARRIVE,
        useNativeDriver: true,
      }),
      ...m.buddies.startMs.flatMap((at, i) => [
        Animated.sequence([
          Animated.delay(at),
          Animated.spring(v.buddies[i] as Animated.Value, {
            toValue: 1,
            stiffness: pop.stiffness,
            damping: pop.damping,
            mass: pop.mass,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(v.fade[i] as Animated.Value, {
          toValue: 1,
          duration: m.buddies.fadeMs,
          delay: at,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(v.last, {
        toValue: 1,
        duration: m.buddies.fadeMs,
        delay: m.totalMs,
        useNativeDriver: true,
      }),
    ]);
    run.start();
    return () => run.stop();
  }, [reduce, v, m]);
  if (reduce) return <StillScene source={RISO.open} height={SEMT.scene.gecit} label={label} />;
  const L = SEMT_LAYERS;
  return (
    <SceneFrame height={SEMT.scene.gecit} label={label}>
      {(k, w, h) => (
        <>
          <Layer source={LAYER.openGround} left={0} top={0} width={w} height={h} />
          <Animated.View
            style={{
              position: 'absolute',
              left: (m.light.origin[0] - L.light.width / 2) * k,
              top: h - L.light.height * k,
              width: L.light.width * k,
              height: L.light.height * k,
              opacity: v.light,
              transform: [
                {
                  scale: v.light.interpolate({
                    inputRange: [0, 1],
                    outputRange: [...m.light.scale],
                  }),
                },
              ],
            }}
          >
            <Layer
              source={LAYER.light}
              left={0}
              top={0}
              width={L.light.width * k}
              height={L.light.height * k}
            />
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute',
              left: L.leaf.left * k,
              top: L.leaf.top * k,
              width: L.leaf.width * k,
              height: L.leaf.height * k,
              transformOrigin: 'left',
              transform: [
                { perspective: m.leaf.perspective * k },
                {
                  rotateY: v.leaf.interpolate({
                    inputRange: [0, 1],
                    outputRange: m.leaf.rotateYDeg.map((d) => `${d}deg`),
                  }),
                },
              ],
            }}
          >
            <Layer
              source={LAYER.leaf}
              left={0}
              top={0}
              width={L.leaf.width * k}
              height={L.leaf.height * k}
            />
          </Animated.View>
          {L.buddies.map((b, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: (b.x - b.width / 2) * k,
                top: (b.y - b.height / 2) * k,
                width: b.width * k,
                height: b.height * k,
                opacity: v.fade[i],
                transform: [
                  {
                    scale: (v.buddies[i] as Animated.Value).interpolate({
                      inputRange: [0, 1],
                      outputRange: [m.buddies.fromScale, 1],
                    }),
                  },
                ],
              }}
            >
              <Layer
                source={LAYER.buddies[i] as ImageSourcePropType}
                left={0}
                top={0}
                width={b.width * k}
                height={b.height * k}
              />
            </Animated.View>
          ))}
          <Animated.View
            style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: v.last }}
          >
            <Layer source={RISO.open} left={0} top={0} width={w} height={h} />
          </Animated.View>
        </>
      )}
    </SceneFrame>
  );
}

// GecitKapali (semteGit.gecitClosed): the padlock rocks ±4°, four drops fall from the cloud; slow
// loops on the native driver (loopGuard.test.ts). Reduce motion: the full picture, still.
export function GecitClosedScene({ label }: { label: string }) {
  const reduce = useReduceMotion();
  const m = MOTION.semteGit.gecitClosed;
  const [v] = useState(() => ({
    lock: new Animated.Value(0),
    drops: Array.from({ length: m.drops.count }, () => new Animated.Value(0)),
  }));
  useEffect(() => {
    if (reduce) return undefined;
    const half = m.lock.periodMs / 2;
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(v.lock, {
            toValue: 1,
            duration: half,
            easing: SWAP,
            useNativeDriver: true,
          }),
          Animated.timing(v.lock, {
            toValue: 0,
            duration: half,
            easing: SWAP,
            useNativeDriver: true,
          }),
        ]),
      ),
      ...v.drops.map((d, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * m.drops.staggerMs),
            Animated.timing(d, {
              toValue: 1,
              duration: m.drops.ms,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(d, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.delay((m.drops.count - 1 - i) * m.drops.staggerMs),
          ]),
        ),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, v, m]);
  if (reduce) return <StillScene source={RISO.locked} height={SEMT.scene.gecit} label={label} />;
  const L = SEMT_LAYERS;
  return (
    <SceneFrame height={SEMT.scene.gecit} label={label}>
      {(k, w, h) => {
        const lockLeft = (L.lock.x - L.lock.width / 2) * k;
        const lockTop = (L.lock.y - L.lock.height / 2) * k;
        return (
          <>
            <Layer source={LAYER.lockedGround} left={0} top={0} width={w} height={h} />
            <Animated.View
              style={{
                position: 'absolute',
                left: lockLeft,
                top: lockTop,
                width: L.lock.width * k,
                height: L.lock.height * k,
                transformOrigin: [m.lock.pivot[0] * k - lockLeft, m.lock.pivot[1] * k - lockTop, 0],
                transform: [
                  {
                    rotate: v.lock.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${-m.lock.rotateDeg}deg`, `${m.lock.rotateDeg}deg`],
                    }),
                  },
                ],
              }}
            >
              <Layer
                source={LAYER.lock}
                left={0}
                top={0}
                width={L.lock.width * k}
                height={L.lock.height * k}
              />
            </Animated.View>
            {v.drops.map((d, i) => (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  left: ((L.drop.x[i] ?? 0) - L.drop.width / 2) * k,
                  top: ((L.drop.y[i] ?? 0) - L.drop.height / 2) * k,
                  width: L.drop.width * k,
                  height: L.drop.height * k,
                  opacity: d.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                  transform: [
                    {
                      translateY: d.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, m.drops.fallPx * k],
                      }),
                    },
                  ],
                }}
              >
                <Layer
                  source={LAYER.drop}
                  left={0}
                  top={0}
                  width={L.drop.width * k}
                  height={L.drop.height * k}
                />
              </Animated.View>
            ))}
          </>
        );
      }}
    </SceneFrame>
  );
}

// SemtOdaBos (semteGit.typingDots): the bench, the buddy's three dots blinking one after another.
export function BenchScene({ label, width }: { label: string; width?: number }) {
  const reduce = useReduceMotion();
  const m = MOTION.semteGit.typingDots;
  const [dots] = useState(() => Array.from({ length: m.count }, () => new Animated.Value(0)));
  useEffect(() => {
    if (reduce) return undefined;
    const half = m.periodMs / 2;
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * m.staggerMs),
          Animated.timing(d, { toValue: 1, duration: half, easing: SWAP, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: half, easing: SWAP, useNativeDriver: true }),
          Animated.delay((m.count - 1 - i) * m.staggerMs),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, dots, m]);
  if (reduce) {
    return <StillScene source={RISO.bench} height={SEMT.scene.short} label={label} width={width} />;
  }
  const D = SEMT_LAYERS.dots;
  return (
    <SceneFrame height={SEMT.scene.short} label={label} width={width}>
      {(k, w, h) => (
        <>
          <Layer source={LAYER.benchGround} left={0} top={0} width={w} height={h} />
          {dots.map((d, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: ((D.x[i] ?? 0) - D.size / 2) * k,
                top: (D.y - D.size / 2) * k,
                width: D.size * k,
                height: D.size * k,
                opacity: d.interpolate({ inputRange: [0, 1], outputRange: [...m.opacity] }),
              }}
            >
              <Layer source={LAYER.dot} left={0} top={0} width={D.size * k} height={D.size * k} />
            </Animated.View>
          ))}
        </>
      )}
    </SceneFrame>
  );
}

// `.spin`: the waiting ring, a turn in 800 ms on the native driver.
export function Spin({ color }: { color: string }) {
  const reduce = useReduceMotion();
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: MOTION.semteGit.waitSpinner.msPerTurn,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, turn]);
  const s = SEMT.spin.size;
  return (
    <Animated.View
      accessible={false}
      style={{
        width: s,
        height: s,
        borderRadius: s / 2,
        borderWidth: SEMT.spin.line,
        borderColor: color,
        borderTopColor: 'transparent',
        transform: [
          { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
        ],
      }}
    />
  );
}

// `.wrow`: a warning in the flow, over the buttons and never on one (the connection: `warn`; an
// error: `danger`).
export function WarnRow({
  text,
  tone = 'warn',
  icon,
  testID,
}: {
  text: string;
  tone?: 'warn' | 'danger';
  icon?: CapIconName;
  testID?: string;
}) {
  const { colors } = useTheme();
  const ground = tone === 'danger' ? colors.dangerSoft : colors.warnSoft;
  const ink = tone === 'danger' ? colors.onDangerSoft : colors.onWarnSoft;
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SEMT.warn.gap,
        paddingHorizontal: SEMT.warn.padX,
        paddingVertical: SEMT.warn.padY,
        borderRadius: SEMT.warn.radius,
        backgroundColor: ground,
      }}
    >
      <CapIcon
        name={icon ?? (tone === 'danger' ? 'warn' : 'cloudOff')}
        color={ink}
        size={SEMT.warn.icon}
      />
      <T v="fine" strong color={ink} style={{ flex: 1 }}>
        {text}
      </T>
    </View>
  );
}

// `.tchip`: the time left, on glass, 36 high; in the extra time "Devam?" and it opens the sheet.
export function TimeChip({
  text,
  label,
  onPress,
  testID,
}: {
  text: string;
  label: string;
  onPress?: () => void;
  testID?: string;
}) {
  const { scheme } = useKit();
  const c = SEMT.timeChip;
  const body = (
    <Glass
      sm
      radius={c.height / 2}
      style={{
        height: c.height,
        borderRadius: c.height / 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: c.gap,
        paddingLeft: c.padLeft,
        paddingRight: c.padRight,
      }}
    >
      <CapIcon name="clock" color={SEMT.eyebrow[scheme]} size={c.icon} />
      <T v="fine" strong>
        {text}
      </T>
    </Glass>
  );
  return onPress ? (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={SPACING[1]}
    >
      {body}
    </Pressable>
  ) : (
    <View testID={testID} accessible accessibilityLabel={label}>
      {body}
    </View>
  );
}

// `.cd`: the countdown on glass, its eyebrow and the clock.
export function Countdown({
  eyebrow,
  clock,
  label,
}: {
  eyebrow: string;
  clock: string;
  label: string;
}) {
  const c = SEMT.countdown;
  return (
    <Glass
      style={{ alignItems: 'center', gap: c.gap, padding: c.pad, borderRadius: c.radius }}
      radius={c.radius}
    >
      <T v="eyebrow">{eyebrow}</T>
      <View accessible accessibilityRole="timer" accessibilityLabel={label}>
        <T v="title" ink style={RISO_TYPE.clock} testID="gecit-countdown">
          {clock}
        </T>
      </View>
    </Glass>
  );
}

// The page of a scene (GecitAcik, GecitKapali, SemtDisari, SemtBitti, SemteGitKonum): the bar with
// the back or the close, the scene, the title, the words; the buttons in the fixed foot.
export function ScenePage({
  close,
  onClose,
  scene,
  title,
  body,
  centered,
  children,
  footer,
  testID,
}: {
  // Kapat on the right (Açık, Kapalı, Bitti); otherwise Geri on the left.
  close?: boolean;
  onClose?: () => void;
  scene: ReactNode;
  title: string;
  body: string;
  centered?: boolean;
  children?: ReactNode;
  footer: ReactNode;
  testID?: string;
}) {
  const leave =
    onClose ?? (() => (router.canGoBack() ? router.back() : router.navigate('/explore')));
  return (
    <Screen
      top={
        <View
          style={{
            minHeight: TOP_BAR,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: close ? 'flex-end' : 'flex-start',
          }}
        >
          <Round
            icon={close ? 'close' : 'back'}
            label={close ? tr.district.close : tr.common.back}
            testID={close ? 'district-close' : 'district-back'}
            onPress={leave}
          />
        </View>
      }
      footer={footer}
    >
      <View testID={testID}>
        {scene}
        <View style={{ marginTop: centered ? SEMT.scene.titleTopCentered : SEMT.scene.titleTop }}>
          <T v="display" center={centered} accessibilityRole="header">
            {title}
          </T>
        </View>
        <View style={{ marginTop: SEMT.scene.textTop }}>
          <T v="body" center={centered}>
            {body}
          </T>
        </View>
        {children}
      </View>
    </Screen>
  );
}
// `.top56`.
const TOP_BAR = 56;

// The foot's buttons, 8 apart (`.foot`).
export function Foot({ children }: { children: ReactNode }) {
  return <View style={{ gap: SPACING[2] }}>{children}</View>;
}
