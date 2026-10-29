import type { VampirRole } from '@shared/vampir.ts';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';

import { usePress } from '@/aura/kit';
import { CachedSvg } from '@/components/CachedSvg';
import { useLoopActive } from '@/components/Loader';
import { NativeShadow } from '@/components/NativeShadow';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import {
  FANG_SVG,
  groundCss,
  GROUND_BOARDS,
  PEEK_CARD_SVG,
  SEAT_X_SVG,
  TABLE,
  TABLE_INK as INK,
  TABLE_MOTION as M,
  TABLE_SHADOW,
  TABLE_TYPE,
  type TableTime,
  TICK_SVG,
  X_SVG,
} from '@/theme/vampirTable';

import { MEDAL_PICTURE, ROLE_ART, TABLE_PICTURE } from './roleArt';
import {
  type Curve,
  curveBetween,
  curvePath,
  measure,
  type Point,
  ring,
} from '@/theme/tableGeometry';
import { type Faces, Face, nameOf } from './VampirParts';

const FW = TABLE.frame.width;
const FH = TABLE.frame.height;
const CX = TABLE.frame.cx;
const CY = TABLE.frame.cy;

// ---- The ground ----

// The room behind the table (the file's .m.night, .dawn, .day, .dusk): a new time of day fades in
// over the one before, on the native driver.
export function TableGround({ time }: { time: TableTime }) {
  const { width } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [shown, setShown] = useState<{ now: TableTime; before: TableTime | null }>({
    now: time,
    before: null,
  });
  if (shown.now !== time) setShown({ now: time, before: shown.now });
  const [mix] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (shown.before === null) return undefined;
    mix.setValue(0);
    const anim = Animated.timing(mix, {
      toValue: 1,
      duration: reduce ? 0 : M.groundMs,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setShown((s) => ({ now: s.now, before: null }));
    });
    return () => anim.stop();
  }, [shown.now, shown.before, mix, reduce]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {shown.before ? <Ground time={shown.before} width={width} /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: shown.before ? mix : 1 }]}>
        <Ground time={shown.now} width={width} />
      </Animated.View>
    </View>
  );
}

// One time's ground: React Native's own gradients on the GPU (theme/vampirArt.ts → groundCss), at
// night the floor's boards over them.
function Ground({ time, width }: { time: TableTime; width: number }) {
  const style = useMemo(() => gradientStyle(groundCss(time)), [time]);
  const boards =
    time === 'night'
      ? Array.from({ length: Math.ceil(width / GROUND_BOARDS.every) }, (_, i) => i)
      : [];
  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      {boards.map((i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: i * GROUND_BOARDS.every,
            width: GROUND_BOARDS.width,
            backgroundColor: GROUND_BOARDS.color,
          }}
        />
      ))}
    </View>
  );
}

// ---- The table ----

export type SeatMark = {
  sid: string;
  // The chosen one (glowing), a vampire's mate (a red ring), not to be chosen (faded), dead.
  pick?: boolean;
  ally?: boolean;
  dim?: boolean;
  dead?: boolean;
  // A vote count, the mate's fang, ready, the role at the end.
  count?: number;
  fang?: boolean;
  tick?: boolean;
  role?: VampirRole;
  // May be pressed now.
  choosable?: boolean;
};

// A line across the table: a mate's pick, a vote; `flow` the person's own before it counts.
export type TableLine = { from: string; to: string; color: string; flow?: boolean };

// The table from above (the file's .m): the lamp, the table, the lines, `center` at its middle (the
// medallion, the role card) and everyone round it, scaled to the room it has.
export function RoundTable({
  faces,
  seats,
  lines = [],
  time,
  center,
  onChoose,
}: {
  faces: Faces;
  seats: readonly SeatMark[];
  lines?: readonly TableLine[];
  time: TableTime;
  center?: ReactNode;
  onChoose?: (sid: string) => void;
}) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const k = box ? Math.min(box.w / FW, box.h / FH) : 0;
  const face = seats.length > TABLE.face.many ? TABLE.face.small : TABLE.face.big;
  const spots = useMemo(() => ring(seats.length), [seats.length]);
  // "Sen" at the bottom, everyone else on round in their seats' order.
  const mine = seats.findIndex((s) => s.sid === faces.me);
  const order = mine > 0 ? [...seats.slice(mine), ...seats.slice(0, mine)] : seats;
  const where = new Map(order.map((s, i) => [s.sid, spots[i] ?? ([CX, CY] as Point)]));
  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {box && k > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: (box.w - FW) / 2,
            top: (box.h - FH) / 2,
            width: FW,
            height: FH,
            transform: [{ scale: k }],
          }}
        >
          <ExpoImage
            pointerEvents="none"
            source={TABLE_PICTURE[time]}
            style={StyleSheet.absoluteFill}
            contentFit="fill"
            transition={0}
            accessible={false}
          />
          <Lines lines={lines} where={where} face={face} />
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: 0,
              width: FW,
              top: CY - CENTER_BOX / 2,
              height: CENTER_BOX,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {center}
          </View>
          {seats.map((s) => {
            const p = where.get(s.sid) ?? ([CX, CY] as Point);
            return (
              <Seat
                key={s.sid}
                faces={faces}
                mark={s}
                at={p}
                face={face}
                onChoose={onChoose && s.choosable ? () => onChoose(s.sid) : undefined}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
const CENTER_BOX = 260;

// One person round the table (the file's .seat): the face in its white ring, its marks, the name
// under it and at the end the role.
function Seat({
  faces,
  mark,
  at,
  face,
  onChoose,
}: {
  faces: Faces;
  mark: SeatMark;
  at: Point;
  face: number;
  onChoose?: () => void;
}) {
  const press = usePress();
  const name = nameOf(faces, mark.sid);
  const ringed = face + 2 * TABLE.face.ring;
  const scale = ringed / KIT.size.av.md;
  const body = (
    <View style={{ width: face, height: face }}>
      {mark.pick ? <PickGlow face={face} /> : null}
      {mark.pick || mark.ally ? (
        <View
          style={{
            position: 'absolute',
            left: -TABLE.face.pickRing,
            top: -TABLE.face.pickRing,
            width: face + 2 * TABLE.face.pickRing,
            height: face + 2 * TABLE.face.pickRing,
            borderRadius: face,
            borderWidth: TABLE.face.pickRing,
            borderColor: mark.pick ? INK.pick : INK.ally,
          }}
        />
      ) : null}
      <View
        style={{
          position: 'absolute',
          left: (face - KIT.size.av.md) / 2,
          top: (face - KIT.size.av.md) / 2,
          transform: [{ scale }],
          filter: mark.dead ? DEAD_FILTER : undefined,
        }}
      >
        <Face faces={faces} sid={mark.sid} size="md" />
      </View>
      {mark.count ? (
        <View style={[styles.badge, styles.count]}>
          <Text maxFontSizeMultiplier={1} style={[TABLE_TYPE.badge, { color: INK.ink }]}>
            {mark.count}
          </Text>
        </View>
      ) : null}
      {mark.fang ? (
        <View style={[styles.badge, styles.fang]}>
          <CachedSvg xml={FANG_SVG} width={12} height={12} />
        </View>
      ) : null}
      {mark.tick ? (
        <View style={[styles.badge, styles.corner, { backgroundColor: INK.tick }]}>
          <CachedSvg xml={TICK_SVG} width={10} height={10} />
        </View>
      ) : null}
      {mark.dead ? (
        <View style={[styles.badge, styles.corner, { backgroundColor: INK.cross }]}>
          <CachedSvg xml={SEAT_X_SVG} width={9} height={9} />
        </View>
      ) : null}
    </View>
  );
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: at[0] - SEAT_BOX / 2,
        top: at[1] - face / 2,
        width: SEAT_BOX,
        alignItems: 'center',
        gap: SEAT_GAP,
        opacity: mark.dim ? DIM : 1,
      }}
    >
      {onChoose ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={name}
          accessibilityState={{ selected: !!mark.pick }}
          onPress={onChoose}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          hitSlop={HIT}
        >
          <Animated.View style={{ transform: [{ scale: press.scale }] }}>{body}</Animated.View>
        </Pressable>
      ) : (
        body
      )}
      <View style={[styles.pill, { opacity: mark.dead ? DEAD_NAME : 1 }]} pointerEvents="none">
        <Text
          maxFontSizeMultiplier={1}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[
            TABLE_TYPE.name,
            { color: INK.white, textDecorationLine: mark.dead ? 'line-through' : 'none' },
          ]}
        >
          {name}
        </Text>
      </View>
      {mark.role ? (
        <View style={[styles.pill, { backgroundColor: INK.roles[mark.role] }]} pointerEvents="none">
          <Text maxFontSizeMultiplier={1} style={[TABLE_TYPE.role, { color: INK.white }]}>
            {ROLE_NAME[mark.role]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
const SEAT_BOX = 96;
const SEAT_GAP = 4;
const DIM = 0.55;
const DEAD_NAME = 0.6;
const HIT = 8;
const DEAD_FILTER = [{ grayscale: 1 }, { brightness: 0.62 }];

// The role names on the chips.
const ROLE_NAME: Record<VampirRole, string> = {
  vampir: tr.vampir.roles.vampir.name,
  doktor: tr.vampir.roles.doktor.name,
  gozcu: tr.vampir.roles.gozcu.name,
  koylu: tr.vampir.roles.koylu.name,
  soytari: tr.vampir.roles.soytari.name,
};

// The chosen seat's glow breathing (the file's glow: 2s ease-in-out, 22px 6px to 30px 10px).
function PickGlow({ face }: { face: number }) {
  const active = useLoopActive();
  const reduce = useReduceMotion();
  const [on] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active || reduce) return undefined;
    const half = M.pickMs / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(on, {
          toValue: 1,
          duration: half,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(on, {
          toValue: 0,
          duration: half,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduce, on]);
  const box = { position: 'absolute' as const, left: 0, top: 0, width: face, height: face };
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[box, { opacity: on.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
      >
        <NativeShadow css={TABLE_SHADOW.pick} radius={face / 2} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[box, { opacity: on }]}>
        <NativeShadow css={TABLE_SHADOW.pickOn} radius={face / 2} />
      </Animated.View>
    </>
  );
}
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

// The lines across the table: drawn once; the person's own before it counts as dashes flowing to
// its end (the file's flow: 1.2s, 28 along).
function Lines({
  lines,
  where,
  face,
}: {
  lines: readonly TableLine[];
  where: ReadonlyMap<string, Point>;
  face: number;
}) {
  const key = lines
    .map(
      (l) =>
        `${l.from}>${l.to}:${l.color}:${l.flow ? 1 : 0}@${where.get(l.from)}|${where.get(l.to)}`,
    )
    .join(',');
  const curves = useMemo(
    () =>
      lines.flatMap((l) => {
        const a = where.get(l.from);
        const b = where.get(l.to);
        return a && b && l.from !== l.to ? [{ line: l, curve: curveBetween(a, b, face) }] : [];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` holds the lines and their seats
    [key, face],
  );
  if (curves.length === 0) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={FW} height={FH}>
        {curves.map(({ line, curve }, i) => (
          <Path
            key={`l${i}`}
            d={curvePath(curve)}
            fill="none"
            stroke={line.flow ? 'none' : line.color}
            strokeWidth={LINE_WIDTH}
            strokeLinecap="round"
            opacity={SOLID}
          />
        ))}
        {curves.map(({ line, curve }, i) => (
          <Circle key={`d${i}`} cx={curve.b[0]} cy={curve.b[1]} r={END_DOT} fill={line.color} />
        ))}
      </Svg>
      {curves
        .filter(({ line }) => line.flow)
        .map(({ line, curve }, i) => (
          <FlowLine key={`f${i}`} curve={curve} color={line.color} />
        ))}
    </View>
  );
}
const LINE_WIDTH = 3;
const SOLID = 0.92;
const END_DOT = 4.5;

function FlowLine({ curve, color }: { curve: Curve; color: string }) {
  const active = useLoopActive();
  const reduce = useReduceMotion();
  const [q] = useState(() => new Animated.Value(0));
  const period = M.flowDash + M.flowGap;
  useEffect(() => {
    if (!active || reduce) return undefined;
    const loop = Animated.loop(
      Animated.timing(q, {
        toValue: 1,
        duration: (M.flowMs * period) / M.flowRun,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduce, q, period]);
  const dashes = useMemo(() => {
    const { length, pointAt } = measure(curve);
    const out: { x: number[]; y: number[]; angle: number; seen: { at: number[]; v: number[] } }[] =
      [];
    for (let i = -1; i * period <= length; i++) {
      const mid = i * period + M.flowDash / 2;
      const qs = [0, 0.5, 1];
      const pts = qs.map((t) => pointAt(mid + period * t));
      const a = pointAt(mid + period / 2 - 0.5);
      const b = pointAt(mid + period / 2 + 0.5);
      // Seen while its middle is on the line.
      const enter = Math.max(0, Math.min(1, -mid / period));
      const leave = Math.max(0, Math.min(1, (length - mid) / period));
      if (leave <= enter) continue;
      const at = [0, enter, Math.min(1, enter + EPS), Math.max(0, leave - EPS), leave, 1];
      const v = [0, 0, 1, 1, 0, 0];
      if (enter === 0) v[0] = v[1] = 1;
      if (leave === 1) v[4] = v[5] = 1;
      out.push({
        x: pts.map((p) => p[0]),
        y: pts.map((p) => p[1]),
        angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
        seen: { at: monotone(at), v },
      });
    }
    return out;
  }, [curve, period]);
  const long = M.flowDash + LINE_WIDTH;
  return (
    <>
      {dashes.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: -long / 2,
            top: -LINE_WIDTH / 2,
            width: long,
            height: LINE_WIDTH,
            borderRadius: LINE_WIDTH / 2,
            backgroundColor: color,
            opacity: q.interpolate({ inputRange: d.seen.at, outputRange: d.seen.v }),
            transform: [
              { translateX: q.interpolate({ inputRange: [0, 0.5, 1], outputRange: d.x }) },
              { translateY: q.interpolate({ inputRange: [0, 0.5, 1], outputRange: d.y }) },
              { rotate: `${d.angle}deg` },
            ],
          }}
        />
      ))}
    </>
  );
}
const EPS = 0.001;

// An interpolation's input must rise: equal neighbours are nudged apart.
function monotone(at: number[]): number[] {
  const out: number[] = [];
  for (const v of at) {
    const last = out[out.length - 1];
    out.push(last !== undefined && v <= last ? last + EPS / 10 : v);
  }
  return out;
}

// ---- What sits at the table's middle ----

// The role card on the table (the file's .card): its back turned a little; held, it turns over to
// the role's picture, turned the other way. Only the person holding it sees it.
export function TableCard({
  role,
  open,
  onHold,
  label,
}: {
  role: VampirRole;
  open: boolean;
  onHold: (held: boolean) => void;
  label: string;
}) {
  const reduce = useReduceMotion();
  const [turnOver] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    const anim = Animated.timing(turnOver, {
      toValue: open ? 1 : 0,
      duration: reduce ? 0 : M.cardMs,
      easing: Easing.bezier(...M.card),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [open, turnOver, reduce]);
  const c = TABLE.card;
  const tilt = turnOver.interpolate({
    inputRange: [0, 1],
    outputRange: [`${c.back}deg`, `${c.front}deg`],
  });
  const side = (which: 'back' | 'front') => ({
    position: 'absolute' as const,
    width: c.width,
    height: c.height,
    borderRadius: c.radius,
    borderWidth: c.edge,
    borderColor: INK.cardEdge,
    overflow: 'hidden' as const,
    backfaceVisibility: 'hidden' as const,
    transform: [
      { perspective: PERSPECTIVE },
      {
        rotateY: turnOver.interpolate({
          inputRange: [0, 1],
          outputRange: which === 'back' ? ['0deg', '180deg'] : ['180deg', '360deg'],
        }),
      },
    ],
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => onHold(true)}
      onPressOut={() => onHold(false)}
      style={{ width: c.width, height: c.height }}
      testID="vampir-card"
    >
      <Animated.View style={{ width: c.width, height: c.height, transform: [{ rotate: tilt }] }}>
        <View style={styles.cardShadow}>
          <NativeShadow css={TABLE_SHADOW.card} radius={c.radius} />
        </View>
        <Animated.View style={side('back')}>
          <Image source={ROLE_ART.arka} style={styles.art} resizeMode="cover" />
        </Animated.View>
        <Animated.View style={side('front')}>
          <Image source={ROLE_ART[role]} style={styles.art} resizeMode="cover" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
const PERSPECTIVE = 1000;

// A still picture card at the middle (the end: the winners' role).
export function StillCard({ role }: { role: VampirRole | 'arka' }) {
  const c = TABLE.endCard;
  return (
    <View style={{ width: c.width, height: c.height, transform: [{ rotate: `${c.turn}deg` }] }}>
      <View style={styles.cardShadow}>
        <NativeShadow css={TABLE_SHADOW.card} radius={TABLE.card.radius} />
      </View>
      <View
        style={{
          width: c.width,
          height: c.height,
          borderRadius: TABLE.card.radius,
          borderWidth: TABLE.card.edge,
          borderColor: INK.cardEdge,
          overflow: 'hidden',
        }}
      >
        <Image source={ROLE_ART[role]} style={styles.art} resizeMode="cover" />
      </View>
    </View>
  );
}

// The medallion with something still in it: the night's dead or the voted out, greyed, and a
// line under them; or a mark (nobody died, the vote was tied).
export function MedalWith({
  faces,
  sid,
  label,
  mark,
}: {
  faces: Faces;
  sid?: string;
  label?: string;
  mark?: string;
}) {
  const m = TABLE.medal;
  const pad = 8;
  const f = TABLE.medalFace;
  return (
    <View style={{ width: m, height: m, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
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
      {sid ? (
        <View style={{ width: f, height: f }}>
          <View
            style={{
              position: 'absolute',
              left: (f - KIT.size.av.lg) / 2,
              top: (f - KIT.size.av.lg) / 2,
              transform: [{ scale: f / KIT.size.av.lg }],
              filter: MEDAL_FILTER,
            }}
          >
            <Face faces={faces} sid={sid} size="lg" />
          </View>
        </View>
      ) : null}
      {mark ? <CachedSvg xml={mark} width={MARK} height={MARK} /> : null}
      {label ? (
        <Text maxFontSizeMultiplier={1} style={[TABLE_TYPE.medal, { color: INK.medalLabel }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
const MEDAL_FILTER = [{ grayscale: 1 }, { brightness: 0.75 }];
const MARK = 56;

// ---- The page round it ----

// A round at the top (the file's .rb): the game's close, and "Rolüm".
export function TableRound({
  label,
  onPress,
  onPressIn,
  onPressOut,
  on,
  xml,
  testID,
}: {
  label: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  on?: boolean;
  xml: string;
  testID?: string;
}) {
  const press = usePress();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        press.onPressIn();
        onPressIn?.();
      }}
      onPressOut={() => {
        press.onPressOut();
        onPressOut?.();
      }}
      hitSlop={4}
      testID={testID}
    >
      <Animated.View
        style={{
          width: TABLE.bar,
          height: TABLE.bar,
          borderRadius: TABLE.bar / 2,
          backgroundColor: on ? INK.roundOn : INK.round,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: press.scale }],
        }}
      >
        <CachedSvg xml={xml} width={xml === X_SVG ? 16 : 20} height={xml === X_SVG ? 16 : 20} />
      </Animated.View>
    </Pressable>
  );
}
export { PEEK_CARD_SVG, X_SVG };

// The file's buttons (.btn.main, .btn.ghost).
export function TableBtn({
  label,
  onPress,
  ghost,
  disabled,
  loading,
  testID,
}: {
  label: string;
  onPress?: () => void;
  ghost?: boolean;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const press = usePress();
  const off = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={{
          height: TABLE.button,
          borderRadius: TABLE.button / 2,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: KIT.size.btnPadX,
          opacity: disabled && !loading ? DIM_BUTTON : 1,
          transform: [{ scale: press.scale }],
          ...(ghost
            ? { borderWidth: 2, borderColor: INK.ghostEdge }
            : { backgroundColor: INK.mainFill }),
        }}
      >
        {ghost ? null : <NativeShadow css={TABLE_SHADOW.button} radius={TABLE.button / 2} />}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={MAX_FONT}
          style={[TABLE_TYPE.btn, { color: ghost ? INK.white : INK.mainInk }]}
        >
          {loading ? '…' : label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
const DIM_BUTTON = 0.45;
const MAX_FONT = 1.3;

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: INK.white,
    borderRadius: 999,
  },
  count: {
    top: -6,
    right: -8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    backgroundColor: INK.count,
  },
  fang: { top: -5, left: -6, width: 22, height: 22, backgroundColor: INK.fang },
  corner: { bottom: -3, right: -5, width: 20, height: 20 },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: INK.namePill,
    maxWidth: SEAT_BOX,
  },
  art: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  cardShadow: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
});
