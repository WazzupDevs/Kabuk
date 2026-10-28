import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Image, Pressable, View } from 'react-native';

import { Buddy } from '@/aura/Buddy';
import { Av, Disk, Tag } from '@/aura/kit';
import { springConfig } from '@/aura/motion';
import { SceneGround } from '@/aura/Scene';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';

import { type TablePerson } from './queries';
import { TABLE_ICON_IMAGES } from './tableIconImages';

const S = KIT.stage;
// The board's stage is 330 high; Masa's is lower (the owner's call, 28 Ekim) and everything on it
// stands lower and smaller by as much.
const BOARD_HEIGHT = 330;
const V = S.height / BOARD_HEIGHT;

// Where the people stand on Masa's stage (docs/design/aura → Masa), in the board's 390 wide frame:
// the centre and, for the two in front, the feet below the floor; the two behind stand higher at
// the sides. The person first, in front at the left ("Sen").
const SEATS = [
  { x: 80, front: true },
  { x: 310, front: true },
  { x: 62, front: false },
  { x: 328, front: false },
] as const;
const FRONT_FEET = -16;
const FRONT_FACE = 44;
const FRONT_TAG = 14;
const BACK_BOTTOM = 126;
const BUDDY_FRONT = 147;
const BUDDY_BACK = 96;
const COL_GAP = 4;
// A buddy's figure: 64 wide for 84 high.
const FIG_RATIO = 64 / 84;
// "+n" beside the table when more sit than the stage shows.
const MORE_RIGHT = 24;
const MORE_BOTTOM = 214;

// Masa's header (docs/design/aura → Masa): a scene the screen's width, square at the top behind the
// status bar and rounded at the bottom, the table's picture on a white-ringed disk in the middle,
// the people around it: an anonymous person as their capsule buddy, a profiled one as their photo,
// each with their name on a glass tag. `children` lies over it (the back, invite and end buttons).
// A press opens Masadakiler. Only the table's people see it (rule 4).
export function TableScene({
  icon,
  people,
  profiles,
  me,
  inset,
  onPress,
  onIcon,
  children,
}: {
  icon: string | null;
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  me: string;
  // The status bar's height: the stage reaches under it.
  inset: number;
  onPress: () => void;
  // The owner's: the table's picture opens the icon picker.
  onIcon?: () => void;
  children?: ReactNode;
}) {
  const [width, setWidth] = useState(0);
  // Who was here when the stage first drew: they arrive in a row, later ones with a ring.
  const [first, setFirst] = useState<ReadonlySet<string> | null>(null);
  if (first === null && people.length > 0) setFirst(new Set(people.map((p) => p.sessionId)));
  const ordered = [
    ...people.filter((p) => p.sessionId === me),
    ...people.filter((p) => p.sessionId !== me),
  ];
  const shown = ordered.slice(0, SEATS.length);
  const more = ordered.length - shown.length;
  const k = width > 0 ? Math.min(1, width / S.frame) : 1;
  const kv = k * V;
  const picture = icon ? TABLE_ICON_IMAGES[icon] : undefined;
  const disk = S.disk * kv;
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        height: S.height + inset,
        borderBottomLeftRadius: S.radius,
        borderBottomRightRadius: S.radius,
        overflow: 'hidden',
      }}
    >
      <SceneGround top={0} bottom={S.radius} />
      <Pressable
        testID="table-scene"
        accessibilityRole="button"
        accessibilityLabel={tr.table.whoLabel(people.length)}
        onPress={onPress}
        style={{ position: 'absolute', left: 0, right: 0, top: inset, bottom: 0 }}
      >
        {width > 0
          ? shown.map((p, i) => (
              <Seat
                key={p.sessionId}
                person={p}
                you={p.sessionId === me}
                publicId={profiles?.get(p.sessionId)}
                index={i}
                k={k}
                kv={kv}
                late={first !== null && !first.has(p.sessionId)}
              />
            ))
          : null}
        {more > 0 ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', right: MORE_RIGHT * k, bottom: MORE_BOTTOM * kv }}
          >
            <Tag label={tr.table.more(more)} />
          </View>
        ) : null}
      </Pressable>
      {/* The table's picture; the owner changes it from here (MasaSimgeDegistir). */}
      <View style={{ position: 'absolute', left: (width - disk) / 2, bottom: S.diskBottom * kv }}>
        <Pressable
          testID="table-icon"
          accessibilityRole={onIcon ? 'button' : undefined}
          accessibilityLabel={onIcon ? tr.createTable.iconChange : undefined}
          disabled={!onIcon}
          onPress={onIcon}
        >
          <Disk size={disk} radius={S.diskRadius * kv}>
            {picture ? (
              <Image source={picture} fadeDuration={0} style={{ width: disk, height: disk }} />
            ) : (
              <View style={{ width: disk, height: disk, backgroundColor: KIT.white }} />
            )}
          </Disk>
        </Pressable>
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: inset }}>{children}</View>
    </View>
  );
}

function Seat({
  person,
  you,
  publicId,
  index,
  k,
  kv,
  late,
}: {
  person: TablePerson;
  you: boolean;
  publicId: string | undefined;
  index: number;
  // Across (the frame's width) and up (the frame's width and the stage's lowering).
  k: number;
  kv: number;
  late: boolean;
}) {
  const seat = SEATS[index] ?? SEATS[0];
  const x = seat.x * k;
  const name = you ? tr.table.youTag : person.alias;
  const buddy = !person.profiled && person.look ? person.look : null;
  const delay = late ? 0 : SEAT_DELAY + index * MOTION.stagger.part;
  const label = <Tag label={name} />;
  if (seat.front) {
    const h = BUDDY_FRONT * kv;
    return (
      <>
        {buddy ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: x - (h * FIG_RATIO) / 2, bottom: FRONT_FEET * kv }}
          >
            <Buddy look={buddy} height={h} delay={delay} phase={index * PHASE} />
          </View>
        ) : (
          <Centered x={x} bottom={FRONT_FACE * kv}>
            <Face person={person} publicId={publicId} delay={delay} late={late} you={you} />
          </Centered>
        )}
        <Centered x={x} bottom={FRONT_TAG * kv}>
          {label}
        </Centered>
      </>
    );
  }
  return (
    <Centered x={x} bottom={BACK_BOTTOM * kv}>
      <View style={{ alignItems: 'center', gap: COL_GAP }}>
        {buddy ? (
          <Buddy look={buddy} height={BUDDY_BACK * kv} delay={delay} phase={index * PHASE} />
        ) : (
          <Face person={person} publicId={publicId} delay={delay} late={late} you={you} />
        )}
        {label}
      </View>
    </Centered>
  );
}
const SEAT_DELAY = 200;
const PHASE = 470;

// A child centred on `x`, its bottom at `bottom`.
function Centered({ x, bottom, children }: { x: number; bottom: number; children: ReactNode }) {
  const [w, setW] = useState(0);
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ position: 'absolute', left: x - w / 2, bottom, opacity: w > 0 ? 1 : 0 }}
    >
      {children}
    </View>
  );
}

// A profiled person's photo, popping in with a bounce; someone who sits down later with a ring
// spreading around them.
function Face({
  person,
  publicId,
  delay,
  late,
  you,
}: {
  person: TablePerson;
  publicId: string | undefined;
  delay: number;
  late: boolean;
  // The phone's own seat: its photo from the own profile (the table's list holds the others).
  you: boolean;
}) {
  const own = useProfile();
  const view = useProfileView(
    person.profiled ? (publicId ?? (you ? own.data?.public_id : undefined)) : undefined,
  );
  const reduce = useReduceMotion();
  const [pop] = useState(() => new Animated.Value(reduce ? 1 : 0));
  const [ring] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce) return undefined;
    const anim = Animated.parallel([
      Animated.spring(pop, { ...springConfig(MOTION.springs.pop), toValue: 1, delay }),
      ...(late
        ? [
            Animated.timing(ring, {
              toValue: 1,
              duration: RING_MS,
              delay: RING_DELAY,
              useNativeDriver: true,
            }),
          ]
        : []),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduce, delay, late, pop, ring]);
  const f = KIT.size.av.lg;
  return (
    <View>
      <Animated.View
        style={{
          position: 'absolute',
          left: -f * RING_OUT,
          top: -f * RING_OUT,
          width: f * (1 + 2 * RING_OUT),
          height: f * (1 + 2 * RING_OUT),
          borderRadius: f,
          borderWidth: KIT.size.disk,
          borderColor: KIT.diskRing,
          opacity: ring.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 0.8, 0] }),
          transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.7] }) }],
        }}
      />
      <Animated.View
        style={{
          opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
            { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          ],
        }}
      >
        <Av size="lg" name={person.alias} photoUrl={view.data?.photoUrl ?? null} />
      </Animated.View>
    </View>
  );
}

// The ring around someone who sits down later.
const RING_MS = 600;
const RING_DELAY = 120;
const RING_OUT = 0.15;
