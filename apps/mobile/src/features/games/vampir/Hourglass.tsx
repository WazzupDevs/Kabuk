import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { CachedSvg } from '@/components/CachedSvg';
import { useLoopActive } from '@/components/Loader';
import { NativeShadow } from '@/components/NativeShadow';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  GLASS,
  GLASS_IN_MEDAL,
  glassBackSvg,
  glassFrontSvg,
  rimHalfSvg,
  type SandTone,
  sandSvg,
  sparkShadow,
  TABLE,
  TABLE_MOTION as M,
  TABLE_SHADOW,
} from '@/theme/vampirTable';

import { GLASS_PICTURE, MEDAL_PICTURE } from './roleArt';

// The game's time as an hourglass (the owner's call, 29 Ekim: not digital; the file's .timer).
// Its sand runs with the server's clock (`endsAt`), on the native driver from its share now to the
// end, so nothing is drawn again while it runs. The medallion's glass hides its sand outside the
// bulbs with the medallion's own colour; the small one cuts its sand to the bulbs and lets it run
// in moving windows. When the time is up the glass turns over, as the file's does.
type Clock = { endsAt: number; totalMs: number };

const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);
const EASE_IN = Easing.bezier(...M.easeIn);

function useSand({ endsAt, totalMs }: Clock) {
  const reduce = useReduceMotion();
  const [p] = useState(() => new Animated.Value(shareOf(endsAt, totalMs)));
  const [flip] = useState(() => new Animated.Value(0));
  // The last seconds of this clock (the phase's `endsAt`), until its time is up.
  const [lowFor, setLowFor] = useState<number | null>(null);
  useEffect(() => {
    const left = Math.max(0, endsAt - Date.now());
    const lowMs = M.lowSeconds * 1000;
    p.setValue(shareOf(endsAt, totalMs));
    flip.setValue(0);
    const lowTimer =
      left > 0 ? setTimeout(() => setLowFor(endsAt), Math.max(0, left - lowMs)) : undefined;
    const run = Animated.timing(p, {
      toValue: 1,
      duration: left,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    run.start(({ finished }) => {
      if (!finished) return;
      setLowFor(null);
      if (reduce) return;
      Animated.timing(flip, {
        toValue: 1,
        duration: M.flipMs,
        easing: Easing.bezier(...M.flip),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      run.stop();
      clearTimeout(lowTimer);
    };
  }, [endsAt, totalMs, p, flip, reduce]);
  return { p, flip, low: lowFor === endsAt };
}

function shareOf(endsAt: number, totalMs: number): number {
  if (totalMs <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - (endsAt - Date.now()) / totalMs));
}

// What runs only while the sand does: the stream, the grains, the light on the edge.
function untilEnd(p: Animated.Value) {
  return p.interpolate({ inputRange: [0, END, 1], outputRange: [1, 1, 0] });
}
const END = 0.9999;
const HALF_GONE = 0.5001;

const turn = (v: Animated.Value | Animated.AnimatedInterpolation<number>, deg: number) =>
  v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${deg}deg`] });

// The medallion at the table's middle with its hourglass and the edge that runs down with it.
export function Medal({ endsAt, totalMs, tone }: Clock & { tone: SandTone }) {
  const { p, flip, low } = useSand({ endsAt, totalMs });
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const [shake] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [red] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!low || !active || reduce) {
      shake.setValue(0);
      pulse.setValue(0);
      return undefined;
    }
    const quarter = M.shakeMs / 4;
    const loops = Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(shake, {
            toValue: -1,
            duration: quarter,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: 1,
            duration: quarter * 2,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: 0,
            duration: quarter,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: M.pulseMs / 2,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: M.pulseMs / 2,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);
    loops.start();
    return () => loops.stop();
  }, [low, active, reduce, shake, pulse]);
  useEffect(() => {
    const anim = Animated.timing(red, {
      toValue: low ? 1 : 0,
      duration: reduce ? 0 : M.rimRedMs,
      easing: EASE_IN_OUT,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [low, red, reduce]);
  const m = TABLE.medal;
  const pad = 8;
  const sand = GLASS.sand[tone];
  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={tr.vampir.timeLeftLabel(clockText(endsAt))}
      style={{ width: m, height: m }}
    >
      <ExpoImage
        pointerEvents="none"
        source={MEDAL_PICTURE}
        style={{
          position: 'absolute',
          left: -pad,
          top: -pad,
          width: m + pad * 2,
          height: m + pad * 2,
        }}
        contentFit="fill"
        transition={0}
        accessible={false}
      />
      {/* The last seconds: the medallion's edge throbs red. */}
      <Animated.View pointerEvents="none" style={[styles.fill, { opacity: pulse }]}>
        <NativeShadow css={TABLE_SHADOW.low} radius={m / 2} />
        <View style={styles.lowRing} />
      </Animated.View>
      <Rim p={p} color={sand.top} />
      <Animated.View pointerEvents="none" style={[styles.fill, { opacity: red }]}>
        <Rim p={p} color={GLASS.rimLow} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, { opacity: untilEnd(p), transform: [{ rotate: turn(p, 360) }] }]}
      >
        <View style={styles.spark}>
          <NativeShadow css={sparkShadow(tone)} radius={GLASS.rim.spark / 2} />
        </View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, { transform: [{ rotate: turn(flip, 180) }] }]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              transform: [
                {
                  rotate: shake.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [`${-M.shakeDeg}deg`, `${M.shakeDeg}deg`],
                  }),
                },
              ],
            },
          ]}
        >
          <MedalGlass p={p} tone={tone} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function clockText(endsAt: number): string {
  const s = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// The medallion's edge: what is left of the time, from where the light is round to twelve. Each
// half turns inside its own half of the round (twelve to six, six to twelve), so the part that is
// gone slides out of sight; the round end at twelve stays until the time is up.
function Rim({ p, color }: { p: Animated.Value; color: string }) {
  const m = TABLE.medal;
  const c = m / 2;
  const w = GLASS.rim.width;
  const right = p.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
  });
  const left = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '0deg', '180deg'] });
  return (
    <View pointerEvents="none" style={styles.fill}>
      <View
        style={{ position: 'absolute', left: c, top: 0, width: c, height: m, overflow: 'hidden' }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: -c,
            top: 0,
            width: m,
            height: m,
            // Gone once the light is past six (its round start would stay there).
            opacity: p.interpolate({
              inputRange: [0, 0.5, HALF_GONE, 1],
              outputRange: [1, 1, 0, 0],
            }),
            transform: [{ rotate: right }],
          }}
        >
          <CachedSvg xml={rimHalfSvg(color, 'right')} width={m} height={m} />
        </Animated.View>
      </View>
      <View
        style={{ position: 'absolute', left: 0, top: 0, width: c, height: m, overflow: 'hidden' }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: m,
            height: m,
            transform: [{ rotate: left }],
          }}
        >
          <CachedSvg xml={rimHalfSvg(color, 'left')} width={m} height={m} />
        </Animated.View>
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          left: c,
          top: c - GLASS.rim.r - w / 2,
          width: w / 2,
          height: w,
          borderTopRightRadius: w / 2,
          borderBottomRightRadius: w / 2,
          backgroundColor: color,
          opacity: untilEnd(p),
        }}
      />
    </View>
  );
}

// The medallion's glass: its inside, the two heaps of sand in their bulbs' boxes, the stream and
// the grains falling, then the glass and its frame over them.
function MedalGlass({ p, tone }: { p: Animated.Value; tone: SandTone }) {
  const k = GLASS_IN_MEDAL.k;
  const ox = GLASS_IN_MEDAL.x;
  const oy = GLASS_IN_MEDAL.y;
  const w = GLASS.width;
  const h = w * GLASS_RATIO;
  const m = TABLE.medal;
  return (
    <>
      <View style={{ position: 'absolute', left: ox, top: oy }}>
        <CachedSvg xml={glassBackSvg()} width={w} height={h} />
      </View>
      <SandBox
        box={GLASS.topBox}
        ox={ox}
        oy={oy}
        k={k}
        move={p.interpolate({ inputRange: [0, 1], outputRange: [0, GLASS.topRun * k] })}
        xml={sandSvg(tone, 'top', false)}
      />
      <SandBox
        box={GLASS.bottomBox}
        ox={ox}
        oy={oy}
        k={k}
        move={p.interpolate({ inputRange: [0, 1], outputRange: [GLASS.bottomRun * k, 0] })}
        xml={sandSvg(tone, 'bottom', false)}
      />
      <Animated.View pointerEvents="none" style={[styles.fill, { opacity: untilEnd(p) }]}>
        <Stream tone={tone} ox={ox} oy={oy} k={k} />
        {GLASS.grains.map((g, i) => (
          <Grain key={i} tone={tone} ox={ox} oy={oy} k={k} grain={g} delay={i * M.grainDelay} />
        ))}
      </Animated.View>
      <ExpoImage
        pointerEvents="none"
        source={GLASS_PICTURE[tone]}
        style={[styles.fill, { width: m, height: m }]}
        contentFit="fill"
        transition={0}
        accessible={false}
      />
    </>
  );
}
const GLASS_RATIO = 1.5625;

// A heap of sand in its bulb's box: the box stays, the heap moves in it.
function SandBox({
  box,
  ox,
  oy,
  k,
  move,
  xml,
}: {
  box: { x: number; y: number; w: number; h: number };
  ox: number;
  oy: number;
  k: number;
  move: Animated.AnimatedInterpolation<number>;
  xml: string;
}) {
  const w = 64 * k;
  return (
    <View
      style={{
        position: 'absolute',
        left: ox + box.x * k,
        top: oy + box.y * k,
        width: box.w * k,
        height: box.h * k,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: -box.x * k,
          top: -box.y * k,
          transform: [{ translateY: move }],
        }}
      >
        <CachedSvg xml={xml} width={w} height={w * GLASS_RATIO} />
      </Animated.View>
    </View>
  );
}

// The thin stream from the neck down: dashes riding down it (the file's 3 on, 3 off).
function Stream({ tone, ox, oy, k }: { tone: SandTone; ox: number; oy: number; k: number }) {
  const active = useLoopActive();
  const reduce = useReduceMotion();
  const [run] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active || reduce) return undefined;
    const loop = Animated.loop(
      Animated.timing(run, {
        toValue: 1,
        duration: M.streamMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduce, run]);
  const s = GLASS.stream;
  const step = s.dash + s.gap;
  const top = GLASS.bottomBox.y;
  const dashes: number[] = [];
  for (let y = s.y1 - step; y <= s.y2; y += step) dashes.push(y);
  return (
    <View
      style={{
        position: 'absolute',
        left: ox + (s.x - s.width / 2) * k,
        top: oy + top * k,
        width: s.width * k,
        height: (s.y2 + s.width / 2 - top) * k,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          transform: [
            { translateY: run.interpolate({ inputRange: [0, 1], outputRange: [0, step * k] }) },
          ],
        }}
      >
        {dashes.map((y) => (
          <View
            key={y}
            style={{
              position: 'absolute',
              left: 0,
              top: (y - s.width / 2 - top) * k,
              width: s.width * k,
              height: (s.dash + s.width) * k,
              borderRadius: (s.width * k) / 2,
              backgroundColor: GLASS.sand[tone].top,
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

// A grain falling from the neck (the file's hgGrain: .9s ease-in, seen from its first 15 per cent).
function Grain({
  tone,
  ox,
  oy,
  k,
  grain,
  delay,
}: {
  tone: SandTone;
  ox: number;
  oy: number;
  k: number;
  grain: { x: number; y: number; r: number };
  delay: number;
}) {
  const active = useLoopActive();
  const reduce = useReduceMotion();
  const [fall] = useState(() => new Animated.Value(0));
  const [seen] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active || reduce) return undefined;
    const show = M.grainMs * M.grainShow;
    const once = Animated.parallel([
      Animated.sequence([
        Animated.timing(fall, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(fall, {
          toValue: 1,
          duration: M.grainMs,
          easing: EASE_IN,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(seen, {
          toValue: 1,
          duration: show,
          easing: EASE_IN,
          useNativeDriver: true,
        }),
        Animated.timing(seen, {
          toValue: 0,
          duration: M.grainMs - show,
          easing: EASE_IN,
          useNativeDriver: true,
        }),
      ]),
    ]);
    const anim = Animated.sequence([Animated.delay(delay), Animated.loop(once)]);
    anim.start();
    return () => anim.stop();
  }, [active, reduce, fall, seen, delay]);
  const d = grain.r * 2 * k;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: ox + (grain.x - grain.r) * k,
        top: oy + (grain.y - grain.r) * k,
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: GLASS.sand[tone].top,
        opacity: seen,
        transform: [
          {
            translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, M.grainFall * k] }),
          },
        ],
      }}
    />
  );
}

// The small hourglass beside "Gündüz başlıyor" and "Gece geliyor".
export function MiniGlass({ endsAt, totalMs, tone }: Clock & { tone: SandTone }) {
  const { p, flip } = useSand({ endsAt, totalMs });
  const w = GLASS.mini;
  const h = w * GLASS_RATIO;
  const k = w / 64;
  const tb = GLASS.topBox;
  const bb = GLASS.bottomBox;
  // The top heap's window: its top edge from the full heap's surface down to the neck.
  const topFrom = 16;
  const topRun = GLASS.topBox.y + GLASS.topBox.h - topFrom;
  // The bottom heap's window: its top edge from the bulb's foot up to the full heap's peak.
  const botTo = 64;
  const botRun = bb.y + bb.h - botTo;
  const down = p.interpolate({ inputRange: [0, 1], outputRange: [0, topRun * k] });
  const up = p.interpolate({ inputRange: [0, 1], outputRange: [0, -botRun * k] });
  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={tr.vampir.timeLeftLabel(clockText(endsAt))}
      style={{ width: w, height: h }}
    >
      <Animated.View style={[styles.fill, { transform: [{ rotate: turn(flip, 180) }] }]}>
        <CachedSvg xml={glassBackSvg()} width={w} height={h} />
        <Window
          x={tb.x * k}
          y={topFrom * k}
          w={tb.w * k}
          h={topRun * k}
          move={down}
          inner={p.interpolate({ inputRange: [0, 1], outputRange: [0, -topRun * k] })}
          xml={sandSvg(tone, 'top', true)}
          size={[w, h]}
        />
        <Window
          x={bb.x * k}
          y={(bb.y + bb.h) * k}
          w={bb.w * k}
          h={botRun * k}
          move={up}
          inner={p.interpolate({ inputRange: [0, 1], outputRange: [0, botRun * k] })}
          xml={sandSvg(tone, 'bottom', true)}
          size={[w, h]}
        />
        <Animated.View pointerEvents="none" style={[styles.fill, { opacity: untilEnd(p) }]}>
          <Stream tone={tone} ox={0} oy={0} k={k} />
        </Animated.View>
        <View style={styles.fill}>
          <CachedSvg xml={glassFrontSvg(tone, true)} width={w} height={h} />
        </View>
      </Animated.View>
    </View>
  );
}

// A window over a heap cut to its bulb: the window moves, the heap inside it stays where it is, so
// the window's edge is the sand's surface.
function Window({
  x,
  y,
  w,
  h,
  move,
  inner,
  xml,
  size,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  move: Animated.AnimatedInterpolation<number>;
  inner: Animated.AnimatedInterpolation<number>;
  xml: string;
  size: readonly [number, number];
}) {
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: 'hidden',
        transform: [{ translateY: move }],
      }}
    >
      <Animated.View
        style={{ position: 'absolute', left: -x, top: -y, transform: [{ translateY: inner }] }}
      >
        <CachedSvg xml={xml} width={size[0]} height={size[1]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  lowRing: {
    position: 'absolute',
    left: -2,
    top: -2,
    width: TABLE.medal + 4,
    height: TABLE.medal + 4,
    borderRadius: TABLE.medal / 2 + 2,
    borderWidth: 2,
    borderColor: GLASS.lowRing,
  },
  spark: {
    position: 'absolute',
    left: TABLE.medal / 2 - GLASS.rim.spark / 2,
    top: TABLE.medal / 2 - GLASS.rim.r - GLASS.rim.spark / 2,
    width: GLASS.rim.spark,
    height: GLASS.rim.spark,
    borderRadius: GLASS.rim.spark / 2,
    backgroundColor: GLASS.spark,
  },
});
