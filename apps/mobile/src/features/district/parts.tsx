import { Image as Photo } from 'expo-image';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Glass, Round, T, useKit } from '@/aura/kit';
import { boxShadowParts } from '@/components/NativeShadow';
import { Screen } from '@/components/Screen';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { CHAT_LOOK } from '@/theme/chatLook';
import { RISO_TYPE } from '@/theme/riso';
import { SEMT, SEMT_LAYERS } from '@/theme/semt';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { Tap } from '@/motion';

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
  // The pictures over the pages (yeni arayüz tuvali 12, 13, 100, 101, 102).
  // Geçit's question in its New Year scene (the owner's ask, 24 Kasım: a new flat picture, not
  // riso; the riso one stays beside it, gecit-soru.webp).
  heroGate: require('../../../assets/riso/semt/gecit-soru-yilbasi.webp'),
  heroOpen: require('../../../assets/riso/semt/gecit-acik-hero.webp'),
  heroEnded: require('../../../assets/riso/semt/oturum-kapandi.webp'),
  heroOutside: require('../../../assets/riso/semt/disarida.webp'),
  heroLocate: require('../../../assets/riso/semt/konum.webp'),
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
  // Stopped while another screen or a sheet covers it and in the background (A-36).
  const active = useLoopActive();
  const m = MOTION.semteGit.gecitClosed;
  const [v] = useState(() => ({
    lock: new Animated.Value(0),
    drops: Array.from({ length: m.drops.count }, () => new Animated.Value(0)),
  }));
  useEffect(() => {
    if (reduce || !active) return undefined;
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
  }, [reduce, active, v, m]);
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
  const active = useLoopActive();
  const m = MOTION.semteGit.typingDots;
  const [dots] = useState(() => Array.from({ length: m.count }, () => new Animated.Value(0)));
  useEffect(() => {
    if (reduce || !active) return undefined;
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
  }, [reduce, active, dots, m]);
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
  const { scheme } = useTheme();
  const k = KIT[scheme];
  const ground = tone === 'danger' ? k.stripDanger : k.stripWarn;
  const ink = tone === 'danger' ? k.onStripDanger : k.onStripWarn;
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

// `.tchip`: the time left, on glass, 36 high; in the extra time "Devam?" and it opens the sheet. In
// the district chat (`chat`, yeni arayüz tuvali SemtSohbet `.tmr`): a plain chip of the surface, 32
// high, the time in bold and `note` ("kaldı") after it in the muted ink.
export function TimeChip({
  text,
  note,
  chat,
  label,
  onPress,
  testID,
}: {
  text: string;
  note?: string;
  chat?: boolean;
  label: string;
  onPress?: () => void;
  testID?: string;
}) {
  const { scheme } = useKit();
  const { colors } = useTheme();
  const c = chat ? { ...SEMT.timeChip, ...CHAT_LOOK.timeChip } : SEMT.timeChip;
  const look = CHAT_LOOK[scheme].emptyCard;
  const content = (
    <>
      {/* SemtSohbet `.tmr`: the clock in --accent, the time 700 13/18, "kaldı" 500 muted. */}
      <CapIcon name="clock" color={chat ? colors.accent : SEMT.eyebrow[scheme]} size={c.icon} />
      <T v={chat ? 'chatTime' : 'fine'} strong={!chat}>
        {text}
      </T>
      {note ? <T v="fine">{note}</T> : null}
    </>
  );
  const row = {
    height: c.height,
    borderRadius: c.height / 2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: c.gap,
    paddingLeft: c.padLeft,
    paddingRight: c.padRight,
  };
  const body = chat ? (
    <View
      style={{
        ...row,
        backgroundColor: look.fill,
        boxShadow: look.shadow || undefined,
        borderWidth: look.edge ? KIT.size.edge : 0,
        borderColor: look.edge || undefined,
      }}
    >
      {content}
    </View>
  ) : (
    <Glass sm radius={c.height / 2} style={row}>
      {content}
    </Glass>
  );
  return onPress ? (
    <Tap
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={SPACING[1]}
    >
      {body}
    </Tap>
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

// ---- The pages with a picture over their top (yeni arayüz tuvali 12, 13, 100, 101, 102) ----

type HeroKind = 'tall' | 'gate' | 'short';

// The picture's height, the words' offset and the content's top padding for this window: the
// canvas's 844-high phone, scaled down on a shorter one (the foot stays in view).
function useHeroLayout(kind: HeroKind) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const h = SEMT.hero;
  const k = Math.min(1, Math.max(h.minScale, height / h.refHeight));
  const offset = kind === 'gate' ? h.noteTop : kind === 'short' ? h.textTopShort : h.textTop;
  return {
    inset: insets.top,
    below: Math.round(h[kind] * k),
    // The bar's foot (4 under its 56 row, Screen's `top`), then the offset.
    padTop: Math.round(offset * k) - SPACING[1],
  };
}

// `.hero`: the picture from the screen's top edge, its foot scalloped (cells of 20, notches of 8 in
// the ground's colour).
function HeroBackdrop({
  kind,
  source,
  focus,
  label,
}: {
  kind: HeroKind;
  source: ImageSourcePropType;
  focus?: `${number}%`;
  label: string;
}) {
  const { scheme } = useKit();
  const { width } = useWindowDimensions();
  const { inset, below } = useHeroLayout(kind);
  const { cell, radius } = SEMT.hero.scallop;
  const short = kind === 'short';
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: inset + below,
        backgroundColor: short ? SEMT.hero.paper : undefined,
      }}
    >
      <Photo
        source={source}
        accessible={false}
        contentFit={short ? 'contain' : 'cover'}
        contentPosition={{ left: focus ?? '50%', top: '100%' }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg width={width} height={radius} style={{ position: 'absolute', left: 0, bottom: 0 }}>
        {Array.from({ length: Math.ceil(width / cell) }, (_, i) => (
          <Circle
            key={i}
            cx={i * cell + cell / 2}
            cy={radius + 1}
            r={radius}
            fill={AURA[scheme].ground}
          />
        ))}
      </Svg>
    </View>
  );
}

// `.round.gl`: a round button over the picture, dark glass and a white icon, in both schemes.
export function HeroRound({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: CapIconName;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const r = SEMT.hero.round;
  return (
    <Tap
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: KIT.size.round,
        height: KIT.size.round,
        borderRadius: KIT.size.round / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: r.bg,
        borderWidth: KIT.size.edge,
        borderColor: r.edge,
      }}
    >
      <CapIcon name={icon} color={r.ink} size={KIT.size.icon} />
    </Tap>
  );
}

// `.hdr`: the bar over the picture, 56 high; the close on the right or what the page puts in it.
export function HeroBar({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        minHeight: SEMT.hero.bar,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[3],
      }}
    >
      {children}
    </View>
  );
}

// The screen of these pages: the picture behind the status bar and the bar, the content from the
// words' offset, the buttons in the fixed foot.
export function HeroScreen({
  kind,
  source,
  focus,
  label,
  top,
  footer,
  children,
}: {
  kind: HeroKind;
  source: ImageSourcePropType;
  focus?: `${number}%`;
  label: string;
  top: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const { padTop } = useHeroLayout(kind);
  return (
    <Screen
      top={top}
      barTop={0}
      padTop={padTop}
      footer={footer}
      backdrop={<HeroBackdrop kind={kind} source={source} focus={focus} label={label} />}
    >
      {children}
    </Screen>
  );
}

// Açık, Oturum kapandı, Dışarıda and Konum: the picture, the close on the right (`onClose`), the
// title and the words centred (`.txt`); what the page adds goes under them.
export function HeroPage({
  kind = 'tall',
  source,
  focus,
  label,
  onClose,
  title,
  body,
  children,
  footer,
  testID,
}: {
  kind?: 'tall' | 'short';
  source: ImageSourcePropType;
  focus?: `${number}%`;
  label: string;
  onClose?: () => void;
  title: string;
  body: string;
  children?: ReactNode;
  footer: ReactNode;
  testID?: string;
}) {
  const leave =
    onClose ?? (() => (router.canGoBack() ? router.back() : router.navigate('/explore')));
  return (
    <HeroScreen
      kind={kind}
      source={source}
      focus={focus}
      label={label}
      top={
        <HeroBar>
          <View style={{ flex: 1 }} />
          <HeroRound
            icon="close"
            label={tr.district.close}
            testID="district-close"
            onPress={leave}
          />
        </HeroBar>
      }
      footer={footer}
    >
      <View testID={testID}>
        <T v="display" center accessibilityRole="header">
          {title}
        </T>
        <View style={{ marginTop: SEMT.scene.textTop }}>
          <T v="body" center>
            {body}
          </T>
        </View>
        {children}
      </View>
    </HeroScreen>
  );
}

// A ticket (`.op`, `.tk`): a stub and a body behind a dashed line, a notch at the line's ends cut
// out of the edges (drawn in the ground's colour; the ground is the clouds' flat colour).
export function TicketShell({
  stub,
  stubWidth,
  stubGround,
  ground,
  radius,
  notch,
  minHeight,
  dash,
  dashInset,
  children,
}: {
  stub: ReactNode;
  stubWidth: number;
  stubGround: string;
  ground: string;
  radius: number;
  notch: number;
  minHeight: number;
  dash: string;
  dashInset: number;
  children: ReactNode;
}) {
  const { scheme, c } = useKit();
  const shadow = boxShadowParts(useLabOff('golge'), c.raisedShadow || undefined, radius);
  const hole = AURA[scheme].ground;
  return (
    <View style={{ borderRadius: radius, boxShadow: shadow.boxShadow }}>
      {shadow.node}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          minHeight,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: ground,
        }}
      >
        <View
          style={{
            width: stubWidth,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: stubGround,
          }}
        >
          {stub}
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>{children}</View>
        <View
          accessible={false}
          style={{
            position: 'absolute',
            left: stubWidth - 1,
            top: dashInset,
            bottom: dashInset,
            width: 2,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: dash,
          }}
        />
        {[{ top: -notch }, { bottom: -notch }].map((at, i) => (
          <View
            key={i}
            accessible={false}
            style={{
              position: 'absolute',
              left: stubWidth - notch,
              width: notch * 2,
              height: notch * 2,
              borderRadius: notch,
              backgroundColor: hole,
              ...at,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// `.fnd`: the waiting line over the foot's button (a ring and the words).
export function FindRow({ text }: { text: string }) {
  const { scheme } = useKit();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityLabel={text}
      accessibilityState={{ busy: true }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SEMT.hero.findGap,
        marginBottom: SEMT.hero.findBottom,
      }}
    >
      <Spin color={SEMT.progress[scheme].fill} />
      <T v="body" strong>
        {text}
      </T>
    </View>
  );
}
