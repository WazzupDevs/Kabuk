import type { VampirRole } from '@shared/vampir.ts';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Av, usePress } from '@/aura/kit';
import { Piece } from '@/aura/VenueScene';
import { CachedSvg } from '@/components/CachedSvg';
import { useLoopActive } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import type { TablePerson } from '@/features/rooms/queries';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { gradientStyle } from '@/theme/gradient';
import { CROSS_SVG, ROLE_ICON, VAMPIR_LOOK as L } from '@/theme/vampir';

import { DigitalTimer } from './DigitalTimer';
import { NIGHT_SKY, SKY_HEIGHT, VENUE_FRAME } from '@/theme/venueScene';

const MAX_FONT = 1.3;

// Who sits where: the table's people by their table session id (rule 4), the profiles of the
// profiled ones, and the caller.
export type Faces = {
  me: string;
  people: ReadonlyMap<string, TablePerson>;
  profiles: ReadonlyMap<string, string> | undefined;
};

export function nameOf(faces: Faces, sid: string): string {
  if (sid === faces.me) return tr.vampir.you;
  return faces.people.get(sid)?.alias ?? tr.vampir.left;
}

// A person's face: a profiled person's photo, an anonymous one's capsule (rule 4: as at the table).
export function Face({
  faces,
  sid,
  size,
  dim,
}: {
  faces: Faces;
  sid: string;
  size: 'sm' | 'md' | 'row' | 'lg';
  dim?: boolean;
}) {
  const person = faces.people.get(sid);
  const own = useProfile();
  const publicId = person?.profiled
    ? (faces.profiles?.get(sid) ?? (sid === faces.me ? own.data?.public_id : undefined))
    : undefined;
  const view = useProfileView(publicId);
  const side = KIT.size.av[size];
  const name = person?.alias ?? '?';
  return (
    <View style={{ opacity: dim ? DIM : 1 }}>
      {person && !person.profiled && person.look ? (
        <Av size={size} name={name}>
          <LookAvatar look={person.look} size={side} />
        </Av>
      ) : (
        <Av size={size} name={name} photoUrl={view.data?.photoUrl ?? null} />
      )}
    </View>
  );
}
const DIM = 0.5;

// The game's ground (the owner's call, 29 Ekim: fuller, yet easy on the eyes): a still picture of
// the time of day (scripts/art/vampirGround.ts: the sky, the moon or the sun, the village at the
// foot), the dark theme's veil, and at night the venue scene's stars and bats moving. A new time
// fades in over the one before; only the two are drawn.
export type VampirTime = 'night' | 'dawn' | 'day' | 'dusk';

const GROUNDS: Record<VampirTime, ImageSourcePropType> = {
  night: require('../../../../assets/vampir/ground-night.webp'),
  dawn: require('../../../../assets/vampir/ground-dawn.webp'),
  day: require('../../../../assets/vampir/ground-day.webp'),
  dusk: require('../../../../assets/vampir/ground-dusk.webp'),
};

export function VampirGround({ time }: { time: VampirTime }) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const [shown, setShown] = useState<{ now: VampirTime; before: VampirTime | null }>({
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
      duration: reduce ? 0 : L.motion.groundMs,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setShown((s) => ({ now: s.now, before: null }));
    });
    return () => anim.stop();
  }, [shown.now, shown.before, mix, reduce]);
  const veil = time === 'day' || time === 'dawn' ? L.veil[scheme].day : L.veil[scheme].night;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {shown.before ? <Picture source={GROUNDS[shown.before]} /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: shown.before ? mix : 1 }]}>
        <Picture source={GROUNDS[shown.now]} />
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: veil }]} />
      {time === 'night' ? <NightSky /> : null}
    </View>
  );
}

function Picture({ source }: { source: ImageSourcePropType }) {
  return (
    <Image
      source={source}
      fadeDuration={0}
      resizeMode="cover"
      // Its own size, or it draws at the picture's pixels (Image takes a required source's size).
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
      accessible={false}
    />
  );
}

// The stars twinkle and the bats cross, only while the screen is in front (loopGuard).
function NightSky() {
  const { width } = useWindowDimensions();
  const k = width / VENUE_FRAME.width;
  const reduce = useReduceMotion();
  const active = useLoopActive();
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: SKY_HEIGHT * k }}>
      {NIGHT_SKY.map((p) => (
        <Piece
          key={p.id}
          piece={p}
          k={k}
          // The ground is dark in both themes: pale stars, bats a shade lighter than the sky.
          scheme={p.id.startsWith('sky-bat') ? 'light' : 'dark'}
          moving={active && !reduce}
          frameHeight={SKY_HEIGHT}
        />
      ))}
    </View>
  );
}

// The file's white pill (.tbtn.main), and its outlined twin (.tbtn.ghost); the label in the
// phase's colour.
export function VBtn({
  label,
  onPress,
  ghost,
  tint,
  disabled,
  loading,
  testID,
}: {
  label: string;
  onPress?: () => void;
  ghost?: boolean;
  tint: string;
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
      style={{ alignSelf: 'stretch' }}
    >
      <Animated.View
        style={{
          height: L.size.button,
          borderRadius: L.size.button / 2,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: KIT.size.btnPadX,
          opacity: disabled && !loading ? DIM_BUTTON : 1,
          transform: [{ scale: press.scale }],
          ...(ghost
            ? { backgroundColor: L.ghostFill, borderWidth: 2, borderColor: L.ghostEdge }
            : { backgroundColor: L.tileOn }),
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={MAX_FONT}
          style={[KIT_TYPE.btn, { color: ghost ? L.ink : tint }]}
        >
          {loading ? '…' : label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
const DIM_BUTTON = 0.45;

// White text on the ground: the title, the line under it, the small note.
export function VText({
  v,
  children,
  center = true,
  soft,
}: {
  v: 'title' | 'h3' | 'body' | 'fine' | 'display';
  children: ReactNode;
  center?: boolean;
  soft?: boolean;
}) {
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT}
      style={[
        KIT_TYPE[v],
        v === 'body' || v === 'fine' ? KIT_TYPE.strong : null,
        { color: soft ? L.inkSoft : L.ink, textAlign: center ? 'center' : undefined },
      ]}
    >
      {children}
    </Text>
  );
}

// The day's clock (the owner's call, 29 Ekim: richer, and moving): the minutes and seconds on a
// digital display in a ring that empties smoothly with the talk, a light running at its end, ticks
// round its face and a warm glow breathing behind it; the last seconds in amber. The ring follows
// the phone's clock (`now`, four times a second: a step too small to see), the glow and the beat
// run on the native driver; still with reduce motion.
export function DayClock({
  left,
  endsAt,
  total,
  now,
}: {
  left: number;
  endsAt: number;
  total: number;
  now: number;
}) {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const low = left <= L.motion.lowSeconds && left > 0;
  const size = L.size.dayClock;
  const stroke = L.size.dayRing;
  const mid = size / 2;
  const r = mid - stroke / 2 - L.size.dayRingIn;
  const round = 2 * Math.PI * r;
  const share = Math.max(0, Math.min(1, (endsAt - now) / (total * 1000)));
  const [breath] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce || !active) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: BREATH_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: BREATH_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, active, breath]);
  const ticks = useMemo(() => {
    let d = '';
    for (let i = 0; i < CLOCK_TICKS; i++) {
      const a = (i / CLOCK_TICKS) * Math.PI * 2;
      const long = i % 3 === 0;
      const r1 = r - stroke / 2 - L.size.tickGap;
      const r2 = r1 - (long ? L.size.tickLong : L.size.tickShort);
      d += `M${mid + Math.sin(a) * r1} ${mid - Math.cos(a) * r1}L${mid + Math.sin(a) * r2} ${mid - Math.cos(a) * r2}`;
    }
    return d;
  }, [mid, r, stroke]);
  const ink = low ? L.barLow : L.tileOn;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          gradientStyle(`radial-gradient(closest-side, ${L.clockGlow}, transparent)`),
          {
            position: 'absolute',
            width: size * GLOW_SCALE,
            height: size * GLOW_SCALE,
            borderRadius: size,
            opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
            transform: [
              { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }) },
            ],
          },
        ]}
      />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={mid} cy={mid} r={r} fill={L.clockFace} stroke={L.bar} strokeWidth={stroke} />
        <Path d={ticks} stroke={L.inkSoft} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${round} ${round}`}
          strokeDashoffset={round * (1 - share)}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      </Svg>
      {/* The light at the ring's end, going round with it. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          transform: [{ rotate: `${share * 360}deg` }],
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: mid - L.size.ringDot / 2,
            top: mid - r - L.size.ringDot / 2,
            width: L.size.ringDot,
            height: L.size.ringDot,
            borderRadius: L.size.ringDot / 2,
            backgroundColor: ink,
            boxShadow: L.shadow.ringDot,
          }}
        />
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <DigitalTimer seconds={left} size="lg" />
        <Text
          maxFontSizeMultiplier={MAX_FONT}
          style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.inkSoft }]}
        >
          {tr.vampir.timeLeft}
        </Text>
      </View>
    </View>
  );
}
const CLOCK_TICKS = 24;
const BREATH_MS = 1800;
const GLOW_SCALE = 1.4;

// The phase's clock on the ground (the owner's call, 29 Ekim: digital, in place of a bar): the
// display in a dark pill.
export function TimerPill({ left }: { left: number }) {
  return (
    <View
      style={{
        alignSelf: 'center',
        height: L.size.timerPill,
        paddingHorizontal: 14,
        borderRadius: L.size.timerPill / 2,
        backgroundColor: L.timerPill,
        justifyContent: 'center',
      }}
    >
      <DigitalTimer seconds={left} size="sm" />
    </View>
  );
}

// "Gündüz başlıyor" and the time to it, at the foot of the morning and the verdict.
export function NextBar({ label, left }: { label: string; left: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: KIT.size.rowGap,
      }}
    >
      <VText v="fine" center={false}>
        {label}
      </VText>
      <TimerPill left={left} />
    </View>
  );
}

// A role's tag (.vk-tag): its mark on a white disc and its name, in its colour.
export function RoleTag({ role }: { role: VampirRole }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: L.size.tag,
        paddingLeft: 6,
        paddingRight: 12,
        borderRadius: L.size.tag / 2,
        backgroundColor: L.roles[role],
        alignSelf: 'center',
      }}
    >
      <View
        style={{
          width: L.size.tagIcon,
          height: L.size.tagIcon,
          borderRadius: L.size.tagIcon / 2,
          backgroundColor: L.tileOn,
          padding: 2,
        }}
      >
        <CachedSvg xml={ROLE_ICON[role]} width="100%" height="100%" />
      </View>
      <Text
        maxFontSizeMultiplier={MAX_FONT}
        style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.ink }]}
      >
        {tr.vampir.roles[role].name}
      </Text>
    </View>
  );
}

// The result card (.vk-card): a face, a line, a role and a note; it pops in.
export function ResultCard({
  faces,
  sid,
  dead,
  title,
  role,
  note,
}: {
  faces: Faces;
  sid?: string;
  dead?: boolean;
  title: string;
  role?: VampirRole;
  note?: string;
}) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const [pop] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return undefined;
    const anim = Animated.timing(pop, {
      toValue: 1,
      duration: L.motion.popMs,
      easing: Easing.bezier(...L.motion.pop),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [pop, reduce]);
  return (
    <Animated.View
      style={{
        alignSelf: 'center',
        alignItems: 'center',
        gap: 6,
        minWidth: 220,
        maxWidth: 300,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: L.size.card,
        backgroundColor: L.card[scheme],
        boxShadow: L.shadow.card,
        opacity: pop,
        transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
      }}
    >
      {sid ? <Face faces={faces} sid={sid} size="lg" dim={dead} /> : null}
      <Text
        maxFontSizeMultiplier={MAX_FONT}
        style={[KIT_TYPE.h3, { color: L.cardInk[scheme], textAlign: 'center' }]}
      >
        {title}
      </Text>
      {role ? <RoleTag role={role} /> : null}
      {note ? (
        <Text
          maxFontSizeMultiplier={MAX_FONT}
          style={[
            KIT_TYPE.fine,
            KIT_TYPE.strong,
            { color: L.cardMuted[scheme], textAlign: 'center' },
          ]}
        >
          {note}
        </Text>
      ) : null}
    </Animated.View>
  );
}

// One person in the grid (.vk-t): the face and the name; chosen it turns white; a vote count and
// the voters' small faces; the dead crossed out.
export type TileState = {
  sid: string;
  chosen?: boolean;
  off?: boolean;
  dead?: boolean;
  count?: number;
  small?: string[];
};

export function PeopleGrid({
  faces,
  tiles,
  onChoose,
}: {
  faces: Faces;
  tiles: TileState[];
  onChoose?: (sid: string) => void;
}) {
  const cols = tiles.length <= 6 ? L.size.fewCols : L.size.cols;
  // Every tile as tall as the others (the owner's report, 29 Ekim: the votes made them uneven):
  // when any shows faces under its name, all keep the room for them.
  const reserve = tiles.some((t) => t.small !== undefined);
  const rows: TileState[][] = [];
  tiles.forEach((t, i) => {
    if (i % cols === 0) rows.push([t]);
    else rows[rows.length - 1]?.push(t);
  });
  return (
    <View style={{ alignSelf: 'stretch', gap: L.size.gridGap }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
          {row.map((t) => (
            <View key={t.sid} style={{ flex: 1 }}>
              <Tile faces={faces} tile={t} onChoose={onChoose} reserve={reserve} />
            </View>
          ))}
          {Array.from({ length: cols - row.length }, (_, j) => (
            <View key={`e${j}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Tile({
  faces,
  tile,
  onChoose,
  reserve,
}: {
  faces: Faces;
  tile: TileState;
  onChoose?: (sid: string) => void;
  reserve: boolean;
}) {
  const press = usePress();
  const can = !!onChoose && !tile.off && !tile.dead;
  const name = nameOf(faces, tile.sid);
  const body = (
    <Animated.View
      style={{
        alignItems: 'center',
        gap: 4,
        paddingVertical: L.size.tilePad,
        paddingHorizontal: 2,
        borderRadius: L.size.tile,
        backgroundColor: tile.chosen ? L.tileOn : L.tile,
        boxShadow: tile.chosen ? L.shadow.tile : undefined,
        opacity: tile.off ? DIM_BUTTON : 1,
        transform: [{ scale: press.scale }],
      }}
    >
      <Face faces={faces} sid={tile.sid} size="md" dim={tile.dead} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        maxFontSizeMultiplier={MAX_FONT}
        style={[
          KIT_TYPE.fine,
          KIT_TYPE.strong,
          {
            alignSelf: 'stretch',
            color: tile.chosen ? L.dark : L.ink,
            textAlign: 'center',
            textDecorationLine: tile.dead ? 'line-through' : 'none',
          },
        ]}
      >
        {name}
      </Text>
      {reserve ? <Voters faces={faces} sids={tile.small ?? []} /> : null}
      {tile.count ? (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 6,
            minWidth: 22,
            height: 22,
            paddingHorizontal: 6,
            borderRadius: 11,
            backgroundColor: L.count,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            maxFontSizeMultiplier={1}
            style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.dark }]}
          >
            {tile.count}
          </Text>
        </View>
      ) : null}
      {tile.dead ? (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: '22%',
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: L.dark,
            borderWidth: 2,
            borderColor: L.tileOn,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CachedSvg xml={CROSS_SVG} width={10} height={10} />
        </View>
      ) : null}
    </Animated.View>
  );
  if (!onChoose) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected: !!tile.chosen, disabled: !can }}
      disabled={!can}
      onPress={() => onChoose(tile.sid)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
    >
      {body}
    </Pressable>
  );
}

// The faces under a name (who voted for this person; the vampires' choices at night): up to three
// overlapping, then "+n"; a row of the same height when nobody.
function Voters({ faces, sids }: { faces: Faces; sids: readonly string[] }) {
  const shown = sids.slice(0, VOTERS_SHOWN);
  const more = sids.length - shown.length;
  return (
    <View
      style={{
        height: KIT.size.av.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {shown.map((s, i) => (
        <View key={s} style={{ marginLeft: i === 0 ? 0 : -VOTERS_OVERLAP }}>
          <Face faces={faces} sid={s} size="sm" />
        </View>
      ))}
      {more > 0 ? (
        <Text
          maxFontSizeMultiplier={1}
          style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.ink, marginLeft: 4 }]}
        >
          {tr.vampir.moreVoters(more)}
        </Text>
      ) : null}
    </View>
  );
}
const VOTERS_SHOWN = 3;
const VOTERS_OVERLAP = 10;

// The ready row under the role card: everyone's small face, lit when ready.
export function ReadyRow({
  faces,
  seats,
  ready,
}: {
  faces: Faces;
  seats: readonly string[];
  ready: readonly string[];
}) {
  const on = useMemo(() => new Set(ready), [ready]);
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <VText v="fine">{tr.vampir.readyCount(ready.length, seats.length)}</VText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
        {seats.map((s) => (
          <Face key={s} faces={faces} sid={s} size="sm" dim={!on.has(s)} />
        ))}
      </View>
    </View>
  );
}

// The game's close (.tg-x): a round, white on a see-through white.
export function CloseRound({ label, onPress }: { label: string; onPress: () => void }) {
  const press = usePress();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      testID="vampir-exit"
    >
      <Animated.View
        style={{
          width: KIT.size.round,
          height: KIT.size.round,
          borderRadius: KIT.size.round / 2,
          backgroundColor: L.chip,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: press.scale }],
        }}
      >
        <CachedSvg xml={CROSS_SVG} width={16} height={16} />
      </Animated.View>
    </Pressable>
  );
}

// The winners' confetti (the file's .conf): capsules in the brand's colours falling once over the
// end, on the native driver; none with reduce motion.
export function Confetti() {
  const reduce = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const [fall] = useState(() => new Animated.Value(0));
  const bits = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        x: ((i * 37) % 100) / 100,
        delay: ((i * 53) % 90) / 100,
        dx: ((i * 29) % 80) - 40,
        turn: ((i * 71) % 540) - 270,
        color: L.confetti[i % L.confetti.length] ?? L.ink,
      })),
    [],
  );
  useEffect(() => {
    if (reduce) return undefined;
    const anim = Animated.timing(fall, {
      toValue: 1,
      duration: CONFETTI_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [fall, reduce]);
  if (reduce) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bits.map((b, i) => {
        const start = b.delay / 2;
        const t = fall.interpolate({
          inputRange: [0, start, 1],
          outputRange: [0, 0, 1],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: b.x * width,
              top: -20,
              width: 8,
              height: 16,
              borderRadius: 4,
              backgroundColor: b.color,
              transform: [
                {
                  translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }),
                },
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, b.dx] }) },
                {
                  rotate: t.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${b.turn}deg`],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
const CONFETTI_COUNT = 26;
const CONFETTI_MS = 2600;
