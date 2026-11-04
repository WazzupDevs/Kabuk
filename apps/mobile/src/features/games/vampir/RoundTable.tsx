import type { VampirRole } from '@shared/vampir.ts';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { usePress } from '@/aura/kit';
import { CachedSvg } from '@/components/CachedSvg';
import { useLoopActive } from '@/components/Loader';
import { NativeShadow } from '@/components/NativeShadow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { seatsAround, type SeatPlace } from '@/theme/tableGeometry';
import {
  TABLE,
  TABLE_INK as INK,
  TABLE_MOTION as M,
  TABLE_SHADOW,
  TABLE_TYPE,
  X_SVG,
} from '@/theme/vampirTable';
import {
  candleLightSvg,
  candlesSvg,
  flamesSvg,
  type ScenePhase,
  stoolsSvg,
} from '@/theme/vampirScene';
import { seatSize } from '@/theme/vampirTableSize';

import { MEDAL_PICTURE, ROLE_ART, ROOM_PICTURE, TABLE_PICTURE } from './roleArt';
import { type Faces, Face, nameOf } from './VampirParts';

const FW = TABLE.frame.width;
const FH = TABLE.frame.height;

// ---- The table ----

export type SeatMark = {
  sid: string;
  // The chosen one (pink), a vampire's mate (a red ring), not to be chosen (faded), dead.
  pick?: boolean;
  ally?: boolean;
  dim?: boolean;
  dead?: boolean;
  // The day's vote count in the name pill.
  count?: number;
  // The end: the card open on the person's role, and the winners' ring.
  role?: VampirRole;
  win?: boolean;
  // The person's card is at the table's middle: their place is an empty frame.
  slot?: boolean;
  // Who chose this one at night: a vampire sees the other vampires' picks (rule 3).
  pickedBy?: readonly string[];
  // May be pressed now.
  choosable?: boolean;
};

// The scene (Aura v83, the reference's drawCap): the room, the stools, the table, the candles and
// the time's dial, every card in front of its person, everyone round the table and `stage` at its
// middle, the design's 360 × 760 phone scaled to the screen. `dial` the phase's dial (or none).
export function TableScene({
  faces,
  seats,
  phase,
  dial,
  stage,
  onChoose,
}: {
  faces: Faces;
  seats: readonly SeatMark[];
  phase: ScenePhase;
  dial: { y: number; r: number } | null;
  stage?: ReactNode;
  onChoose?: (sid: string) => void;
}) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const k = box ? Math.min(box.w / FW, box.h / FH) : 0;
  // "Sen" at the bottom, everyone else on round in their seats' order.
  const mine = seats.findIndex((s) => s.sid === faces.me);
  const order = mine > 0 ? [...seats.slice(mine), ...seats.slice(0, mine)] : seats;
  const places = useMemo(() => seatsAround(order.length), [order.length]);
  const dead = order.map((s) => !!s.dead);
  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { backgroundColor: INK.ground }]}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {box && k > 0 ? (
        <>
          <ExpoImage
            pointerEvents="none"
            source={ROOM_PICTURE[phase]}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={0}
            accessible={false}
          />
          <SceneBack
            look={{ phase, count: order.length, dead, dial }}
            left={(box.w - FW * k) / 2}
            top={(box.h - FH * k) / 2}
            k={k}
          />
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: (box.w - FW) / 2,
              top: (box.h - FH) / 2,
              width: FW,
              height: FH,
              transform: [{ scale: k }],
            }}
          >
            {order.map((s, i) => (
              <Card key={s.sid} mark={s} place={places[i]} count={order.length} />
            ))}
            {stage}
            {order.map((s, i) => (
              <Seat
                key={s.sid}
                faces={faces}
                mark={s}
                place={places[i]}
                count={order.length}
                onChoose={onChoose && s.choosable ? () => onChoose(s.sid) : undefined}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

type Look = {
  phase: ScenePhase;
  count: number;
  dead: readonly boolean[];
  dial: { y: number; r: number } | null;
};
const lookKey = (l: Look) =>
  `${l.phase}|${l.count}|${l.dead.map((d) => (d ? 1 : 0)).join('')}|${l.dial ? `${l.dial.y},${l.dial.r}` : ''}`;

// What is drawn under the people: a new look (a new phase, a candle gone out) fades in over the one
// before, on the native driver (as the round table's room did).
function SceneBack({ look, left, top, k }: { look: Look; left: number; top: number; k: number }) {
  const reduce = useReduceMotion();
  const key = lookKey(look);
  const [shown, setShown] = useState<{ now: Look; nowKey: string; before: Look | null }>({
    now: look,
    nowKey: key,
    before: null,
  });
  if (shown.nowKey !== key) setShown({ now: look, nowKey: key, before: shown.now });
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
      if (finished) setShown((s) => ({ ...s, before: null }));
    });
    return () => anim.stop();
  }, [shown.nowKey, shown.before, mix, reduce]);
  const frame = { position: 'absolute' as const, left, top, width: FW * k, height: FH * k };
  return (
    <View pointerEvents="none" style={frame}>
      {shown.before ? <Back look={shown.before} k={k} /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: shown.before ? mix : 1 }]}>
        <Back look={shown.now} k={k} />
      </Animated.View>
    </View>
  );
}

// One look, in the reference's order: the room, the stools, the table, the candles and the dial,
// the candles' light (laid on with screen), the flames. The SVG layers are drawn at the size they
// show (a picture scaled up would blur).
function Back({ look, k }: { look: Look; k: number }) {
  const w = FW * k;
  const h = FH * k;
  const { phase, count, dead, dial } = look;
  return (
    <View style={StyleSheet.absoluteFill}>
      <ExpoImage
        source={ROOM_PICTURE[phase]}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        transition={0}
        accessible={false}
      />
      <View style={StyleSheet.absoluteFill}>
        <CachedSvg xml={stoolsSvg(phase, count)} width={w} height={h} />
      </View>
      <ExpoImage
        source={TABLE_PICTURE[phase]}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        transition={0}
        accessible={false}
      />
      <View style={StyleSheet.absoluteFill}>
        <CachedSvg xml={candlesSvg(phase, count, dial)} width={w} height={h} />
      </View>
      <View style={[StyleSheet.absoluteFill, { mixBlendMode: 'screen' }]}>
        <CachedSvg xml={candleLightSvg(phase, count, dead)} width={w} height={h} />
      </View>
      <View style={StyleSheet.absoluteFill}>
        <CachedSvg xml={flamesSvg(phase, count, dead)} width={w} height={h} />
      </View>
    </View>
  );
}

// A person's card on the table in front of them (the panels' .card): its back, or at the end its
// role (the vampire's with a pink glow); a dead person's darkened. While the person's own card is
// at the middle, an empty frame.
function Card({
  mark,
  place,
  count,
}: {
  mark: SeatMark;
  place: SeatPlace | undefined;
  count: number;
}) {
  if (!place) return null;
  const [w, h] = seatSize(count).card;
  const vampire = mark.role === 'vampir';
  const style = {
    position: 'absolute' as const,
    left: place.card[0] - w / 2,
    top: place.card[1] - h / 2,
    width: w,
    height: h,
    transform: [{ rotate: `${place.turn}deg` }],
  };
  if (mark.slot) {
    return (
      <View
        pointerEvents="none"
        style={[
          style,
          {
            borderRadius: TABLE.cardCorner,
            borderWidth: 1.5,
            borderColor: INK.slotEdge,
            backgroundColor: INK.slot,
          },
        ]}
      />
    );
  }
  return (
    <View pointerEvents="none" style={style}>
      <NativeShadow
        css={vampire ? TABLE_SHADOW.vampirCard : TABLE_SHADOW.card}
        radius={TABLE.cardCorner}
      />
      <View
        style={{
          flex: 1,
          borderRadius: TABLE.cardCorner,
          borderWidth: vampire ? 1.5 : 1,
          borderColor: vampire ? INK.pink : INK.cardEdge,
          overflow: 'hidden',
          filter: mark.dead && !mark.role ? DEAD_CARD : undefined,
        }}
      >
        <Image source={ROLE_ART[mark.role ?? 'arka']} style={styles.art} resizeMode="cover" />
      </View>
    </View>
  );
}
const DEAD_CARD = [{ brightness: 0.42 }, { saturate: 0.5 }];

// The rings round a face (the panels' .seat .f): cream in ink; the person white; the chosen one
// and the winners pink; a vampire's mate red.
function ringOf(mark: SeatMark, me: boolean): { color: string; inner: number; outer: number } {
  if (mark.pick) return { color: INK.pink, inner: 3, outer: 5 };
  if (mark.win) return { color: INK.pink, inner: 2.5, outer: 4.5 };
  if (mark.ally) return { color: INK.ally, inner: 3, outer: 5 };
  if (me) return { color: INK.white, inner: 2.5, outer: 4.5 };
  return { color: INK.cream, inner: 2, outer: 4 };
}

// A face in its rings, the capsule or photo inside (Av's own white ring under the colour).
export function RingedFace({
  faces,
  sid,
  size,
  ring,
  dead,
  shadow,
}: {
  faces: Faces;
  sid: string;
  size: number;
  ring: { color: string; inner: number; outer: number };
  dead?: boolean;
  // Its shadow (none when not given).
  shadow?: string;
}) {
  const out = size + 2 * ring.outer;
  const av = size + 2 * ring.inner;
  return (
    <View style={{ width: out, height: out }}>
      {shadow ? <NativeShadow css={shadow} radius={out / 2} /> : null}
      <View style={[styles.round, { width: out, height: out, backgroundColor: INK.ink }]} />
      <View
        style={{
          position: 'absolute',
          left: ring.outer - ring.inner - (KIT.size.av.md - av) / 2,
          top: ring.outer - ring.inner - (KIT.size.av.md - av) / 2,
          transform: [{ scale: av / KIT.size.av.md }],
          filter: dead ? DEAD_FACE : undefined,
        }}
      >
        <Face faces={faces} sid={sid} size="md" />
      </View>
      <View
        style={[
          styles.round,
          {
            left: ring.outer - ring.inner,
            top: ring.outer - ring.inner,
            width: av,
            height: av,
            borderWidth: ring.inner,
            borderColor: ring.color,
          },
        ]}
      />
    </View>
  );
}
const DEAD_FACE = [{ grayscale: 1 }, { brightness: 0.5 }];

// One person round the table (the panels' .seat): the face in its rings, the name pill under it
// with the vote count, and who chose them at night round the face's top.
function Seat({
  faces,
  mark,
  place,
  count,
  onChoose,
}: {
  faces: Faces;
  mark: SeatMark;
  place: SeatPlace | undefined;
  count: number;
  onChoose?: () => void;
}) {
  const press = usePress();
  if (!place) return null;
  const g = seatSize(count);
  const small = count > TABLE.many;
  const [x, y] = place.seat;
  const name = nameOf(faces, mark.sid);
  const ring = ringOf(mark, mark.sid === faces.me);
  const out = g.face + 2 * ring.outer;
  const face = (
    <View style={{ width: out, height: out }}>
      {mark.pick ? <PickGlow size={out} /> : null}
      {mark.win ? <NativeShadow css={TABLE_SHADOW.win} radius={out / 2} /> : null}
      <RingedFace
        faces={faces}
        sid={mark.sid}
        size={g.face}
        ring={ring}
        dead={mark.dead}
        shadow={TABLE_SHADOW.face}
      />
    </View>
  );
  return (
    <>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: x - out / 2,
          top: y - out / 2,
          width: out,
          height: out,
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
            <Animated.View style={{ transform: [{ scale: press.scale }] }}>{face}</Animated.View>
          </Pressable>
        ) : (
          face
        )}
        {(mark.pickedBy ?? []).map((v, j, all) => (
          <Voter
            key={v}
            faces={faces}
            sid={v}
            at={voterAt(j, all.length, out / 2, VOTER)}
            size={VOTER}
            color={INK.pink}
            center={out / 2}
          />
        ))}
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - NAME_BOX / 2,
          top: y + (small ? TABLE.nameTop.small : TABLE.nameTop.big),
          width: NAME_BOX,
          alignItems: 'center',
          opacity: mark.dim ? DIM : 1,
        }}
      >
        <NamePill name={name} count={mark.count} pick={mark.pick} dead={mark.dead} small={small} />
      </View>
    </>
  );
}
const DIM = 0.55;
const HIT = 8;
const NAME_BOX = 120;
const VOTER = 15;

// The name pill (the panels' .nm, .nm b): the name, and the vote count in amber.
export function NamePill({
  name,
  count,
  pick,
  dead,
  small,
  tag,
}: {
  name?: string;
  count?: number;
  pick?: boolean;
  dead?: boolean;
  small?: boolean;
  tag?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: tag ? TAG_HIGH : small ? 15 : 17,
        paddingHorizontal: name ? (small ? 4 : 6) : 0,
        borderRadius: tag ? 5 : 4,
        backgroundColor: !name ? undefined : pick ? INK.pink : INK.namePill,
        borderWidth: name && !pick ? 1 : 0,
        borderColor: INK.nameEdge,
        maxWidth: NAME_BOX,
      }}
    >
      {name ? (
        <Text
          maxFontSizeMultiplier={1}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[
            tag ? TABLE_TYPE.tag : small ? TABLE_TYPE.nameSmall : TABLE_TYPE.name,
            {
              color: pick || tag ? INK.white : dead ? INK.deadName : INK.name,
              textDecorationLine: dead ? 'line-through' : 'none',
              flexShrink: 1,
            },
          ]}
        >
          {name}
        </Text>
      ) : null}
      {count ? (
        <View style={[styles.count, { marginLeft: name ? 5 : 0 }]}>
          <Text maxFontSizeMultiplier={1} style={[TABLE_TYPE.count, { color: INK.amberInk }]}>
            {count}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
const TAG_HIGH = 18;

// Where the j-th of `all` small faces sits round a face of radius `r` (build.py → cand: from the
// top, 0.78 apart), its top left from the face's middle.
export function voterAt(j: number, all: number, r: number, size: number): [number, number] {
  const a = -Math.PI / 2 + (j - (all - 1) / 2) * VOTER_STEP;
  const R = r + size / 2 + 1;
  return [Math.cos(a) * R - size / 2, Math.sin(a) * R - size / 2];
}
const VOTER_STEP = 0.78;

// A small face of someone who chose this one (the panels' .vr): its edge in amber (votes) or pink
// (the night's picks).
export function Voter({
  faces,
  sid,
  at,
  size,
  color,
  center,
}: {
  faces: Faces;
  sid: string;
  at: [number, number];
  size: number;
  color: string;
  center: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: center + at[0], top: center + at[1], zIndex: 2 }}
    >
      <RingedFace
        faces={faces}
        sid={sid}
        size={size - 3}
        ring={{ color, inner: 1.5, outer: 1.5 }}
        shadow={TABLE_SHADOW.voter}
      />
    </View>
  );
}

// The chosen seat's glow breathing (as on the round table: 2s ease-in-out).
function PickGlow({ size }: { size: number }) {
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
  const box = { position: 'absolute' as const, left: 0, top: 0, width: size, height: size };
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[box, { opacity: on.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
      >
        <NativeShadow css={TABLE_SHADOW.pick} radius={size / 2} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[box, { opacity: on }]}>
        <NativeShadow css={TABLE_SHADOW.pickOn} radius={size / 2} />
      </Animated.View>
    </>
  );
}
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

// ---- What sits at the table's middle ----

// The role card at the middle (the panels' .rolec, 104 × 139, turned −2°): its back; held, it
// turns over to the role's picture. Only the person holding it sees it.
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
  const side = (which: 'back' | 'front') => ({
    position: 'absolute' as const,
    width: c.width,
    height: c.height,
    borderRadius: c.radius,
    borderWidth: 1,
    borderColor: INK.bigCardEdge,
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
      <View style={{ width: c.width, height: c.height, transform: [{ rotate: `${c.turn}deg` }] }}>
        <View style={styles.fill}>
          <NativeShadow css={TABLE_SHADOW.bigCardGlow} radius={c.radius} />
          <NativeShadow css={TABLE_SHADOW.bigCard} radius={c.radius} />
        </View>
        <Animated.View style={side('back')}>
          <Image source={ROLE_ART.arka} style={styles.art} resizeMode="cover" />
        </Animated.View>
        <Animated.View style={side('front')}>
          <Image source={ROLE_ART[role]} style={styles.art} resizeMode="cover" />
        </Animated.View>
      </View>
    </Pressable>
  );
}
const PERSPECTIVE = 1000;

// The medallion with something still in it (the verdict's, kept from the round table): the voted
// out, greyed, and a line under them; or a mark (the vote was tied).
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

// A round at the top (the panels' .x): the game's close, and "Rolüm".
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
  const r = TABLE.round;
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
          width: r,
          height: r,
          borderRadius: r / 2,
          backgroundColor: on ? INK.roundOn : INK.round,
          borderWidth: 1.5,
          borderColor: INK.roundEdge,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: press.scale }],
        }}
      >
        <NativeShadow css={TABLE_SHADOW.round} radius={r / 2} border={1.5} />
        <CachedSvg xml={xml} width={xml === X_SVG ? 16 : 20} height={xml === X_SVG ? 16 : 20} />
      </Animated.View>
    </Pressable>
  );
}

// The glass button at the foot (the panels' .btn.sec, "Masaya dön"; the owner's "Geceyi başlat").
export function GlassBtn({
  label,
  onPress,
  loading,
  width,
  testID,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  width?: number;
  testID?: string;
}) {
  const press = usePress();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: !!loading }}
      disabled={loading}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={width ? { width } : { flex: 1 }}
    >
      <Animated.View
        style={{
          height: KIT.size.btn,
          borderRadius: KIT.size.btn / 2,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: KIT.size.btnPadXSm,
          backgroundColor: INK.glass,
          borderWidth: 1,
          borderColor: INK.glassEdge,
          transform: [{ scale: press.scale }],
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={MAX_FONT}
          style={[TABLE_TYPE.glassBtn, { color: INK.white }]}
        >
          {loading ? '…' : label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// The glass sign at the foot (the panels' .sign: "Gündüz başlıyor").
export function GlassSign({ children, after }: { children: ReactNode; after?: ReactNode }) {
  return (
    <View
      style={{
        alignSelf: 'center',
        minHeight: TABLE.sign,
        paddingHorizontal: 18,
        borderRadius: TABLE.sign / 2,
        backgroundColor: INK.glass,
        borderWidth: 1,
        borderColor: INK.glassEdge,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text maxFontSizeMultiplier={MAX_FONT} style={[TABLE_TYPE.sign, { color: INK.white }]}>
        {children}
      </Text>
      {after}
    </View>
  );
}

// The foot's dark fall under the buttons (the panels' .foot).
export function FootShade() {
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, right: 0, bottom: 0, height: TABLE.foot },
        gradientStyle(INK.foot),
      ]}
    />
  );
}

export { X_SVG };
const MAX_FONT = 1.3;

const styles = StyleSheet.create({
  art: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  round: { position: 'absolute', left: 0, top: 0, borderRadius: 999 },
  count: {
    minWidth: 15,
    height: 13,
    paddingHorizontal: 4,
    borderRadius: 7,
    backgroundColor: INK.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
