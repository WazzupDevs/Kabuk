import type { VampirRole } from '@shared/vampir.ts';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

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
import { stopPaint } from '@/theme/svgStop';
import { useTheme } from '@/theme/ThemeProvider';
import { CROSS_SVG, ROLE_ICON, VAMPIR_LOOK as L } from '@/theme/vampir';
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

// The game's ground: the night blue or the day red under skall's colour clouds, the dark theme's
// veil, and at night the stars and bats of the venue scene's sky. Day and night cross over.
export function VampirGround({ day }: { day: boolean }) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const [mix] = useState(() => new Animated.Value(day ? 1 : 0));
  useEffect(() => {
    const anim = Animated.timing(mix, {
      toValue: day ? 1 : 0,
      duration: reduce ? 0 : L.motion.groundMs,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [day, mix, reduce]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Layer look="night" veil={L.veil[scheme].night} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: mix }]}>
        <Layer look="day" veil={L.veil[scheme].day} />
      </Animated.View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: mix.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
        ]}
      >
        <NightSky />
      </Animated.View>
    </View>
  );
}

function Layer({ look, veil }: { look: 'night' | 'day'; veil: string }) {
  const g = L[look];
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`vg-${look}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset={0} {...stopPaint(g.top)} />
            <Stop offset={1} {...stopPaint(g.bottom)} />
          </LinearGradient>
          {g.glows.map((c, i) => (
            <RadialGradient key={i} id={`vr-${look}-${i}`} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry}>
              <Stop offset={0} {...stopPaint(c.color)} />
              <Stop offset={1} {...stopPaint(c.color, 0)} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#vg-${look})`} />
        {g.glows.map((_, i) => (
          <Rect key={i} x={0} y={0} width={100} height={100} fill={`url(#vr-${look}-${i})`} />
        ))}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: veil }]} />
    </View>
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

// The phase's clock as a thin bar under the top (.vk-prog): it empties over the phase; amber in
// the last seconds.
export function ClockBar({ left, total }: { left: number; total: number }) {
  const low = left <= L.motion.lowSeconds && left > 0;
  return (
    <View
      style={{
        height: L.size.bar,
        borderRadius: L.size.bar / 2,
        backgroundColor: L.bar,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(1, total > 0 ? left / total : 0)) * 100}%`,
          height: '100%',
          borderRadius: L.size.bar / 2,
          backgroundColor: low ? L.barLow : L.tileOn,
        }}
      />
    </View>
  );
}

// "Gündüz başlıyor" and its emptying bar, at the foot of the morning and the verdict.
export function NextBar({ label, left, total }: { label: string; left: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.rowGap }}>
      <VText v="fine" center={false}>
        {label}
      </VText>
      <View style={{ flex: 1 }}>
        <ClockBar left={left} total={total} />
      </View>
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
              <Tile faces={faces} tile={t} onChoose={onChoose} />
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
}: {
  faces: Faces;
  tile: TileState;
  onChoose?: (sid: string) => void;
}) {
  const press = usePress();
  const can = !!onChoose && !tile.off && !tile.dead;
  const name = nameOf(faces, tile.sid);
  const body = (
    <Animated.View
      style={{
        alignItems: 'center',
        gap: 4,
        minHeight: 44,
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
        maxFontSizeMultiplier={MAX_FONT}
        style={[
          KIT_TYPE.fine,
          KIT_TYPE.strong,
          {
            color: tile.chosen ? L.dark : L.ink,
            textAlign: 'center',
            textDecorationLine: tile.dead ? 'line-through' : 'none',
          },
        ]}
      >
        {name}
      </Text>
      {tile.small && tile.small.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {tile.small.slice(0, 4).map((s, i) => (
            <View key={s} style={{ marginLeft: i === 0 ? 0 : -5 }}>
              <Face faces={faces} sid={s} size="sm" />
            </View>
          ))}
        </View>
      ) : null}
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
