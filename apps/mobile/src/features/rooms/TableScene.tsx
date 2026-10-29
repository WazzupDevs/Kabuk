import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { Fold } from '@/aura/Fold';
import { Av, T, Tag, useKit } from '@/aura/kit';
import { springConfig } from '@/aura/motion';
import { SceneGround } from '@/aura/Scene';
import { LookAvatar } from '@/components/LookAvatar';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

import { type TablePerson } from './queries';

const S = KIT.stage;
// The faces in one row, at most this many; more show as "+n" in the last place.
const ROW_MAX = 5;
const FACE = KIT.size.av.row;
const FACE_GAP = SPACING[2.5];
const NAME_GAP = SPACING[1];

// Masa's head (the owner's call, 28 and 29 Ekim): a low scene under the status bar that stays put
// while the games scroll under it, square at the top and rounded at the bottom. On it, in order:
// `children` (the back, chat, invite and end buttons), the people in one neat row (a profiled
// person's photo, an anonymous one's capsule, each with their name; "Sen" first), and `footer`
// (the table's name, its people and lobby state, the owner's lobby button). No table picture: the
// table is its people. A press on the faces opens Masadakiler. Only the table's people see it
// (rule 4).
export function TableScene({
  people,
  profiles,
  me,
  inset,
  onPress,
  children,
  footer,
  fold,
}: {
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  me: string;
  // The status bar's height: the scene reaches under it.
  inset: number;
  onPress: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  // Folds the names and the footer away while the games scroll on (useCollapseOnScroll): only
  // the faces stay under the buttons (the owner's call, 29 Ekim).
  fold?: SharedValue<number>;
}) {
  // Who was here when the scene first drew: they arrive in a row, later ones with a ring.
  const [first, setFirst] = useState<ReadonlySet<string> | null>(null);
  if (first === null && people.length > 0) setFirst(new Set(people.map((p) => p.sessionId)));
  const ordered = [
    ...people.filter((p) => p.sessionId === me),
    ...people.filter((p) => p.sessionId !== me),
  ];
  const overflow = ordered.length > ROW_MAX;
  const shown = overflow ? ordered.slice(0, ROW_MAX - 1) : ordered;
  const more = ordered.length - shown.length;
  return (
    <FoldContext.Provider value={fold}>
      <View
        style={{
          paddingTop: inset,
          paddingBottom: KIT.size.pad,
          gap: KIT.size.rowGap,
          borderBottomLeftRadius: S.radius,
          borderBottomRightRadius: S.radius,
          overflow: 'hidden',
        }}
      >
        <SceneGround top={0} bottom={S.radius} />
        {children}
        <Pressable
          testID="table-scene"
          accessibilityRole="button"
          accessibilityLabel={tr.table.whoLabel(people.length)}
          onPress={onPress}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: FACE_GAP,
            paddingHorizontal: KIT.size.side,
          }}
        >
          {shown.map((p, i) => (
            <Seat
              key={p.sessionId}
              person={p}
              you={p.sessionId === me}
              publicId={profiles?.get(p.sessionId)}
              delay={first !== null && !first.has(p.sessionId) ? 0 : SEAT_DELAY + i * SEAT_STEP}
              late={first !== null && !first.has(p.sessionId)}
            />
          ))}
          {more > 0 ? <MoreFace count={more} /> : null}
        </Pressable>
        <Fold progress={fold} style={{ paddingHorizontal: KIT.size.side, gap: KIT.size.rowGap }}>
          {footer}
        </Fold>
      </View>
    </FoldContext.Provider>
  );
}
const FoldContext = createContext<SharedValue<number> | undefined>(undefined);
const SEAT_DELAY = 160;
const SEAT_STEP = MOTION.stagger.part;

// "+n" in the last place when more sit than the row shows.
function MoreFace({ count }: { count: number }) {
  const { c } = useKit();
  return (
    <View style={{ alignItems: 'center', gap: NAME_GAP }} pointerEvents="none">
      <View
        style={{
          width: FACE,
          height: FACE,
          borderRadius: FACE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.raisedRound,
          borderWidth: KIT.size.avRing,
          borderColor: KIT.white,
        }}
      >
        <T v="h3">{tr.table.more(count)}</T>
      </View>
    </View>
  );
}

// One person: the face popping in (someone who sits down later with a ring spreading round it),
// the name on a glass tag under it.
function Seat({
  person,
  you,
  publicId,
  delay,
  late,
}: {
  person: TablePerson;
  you: boolean;
  publicId: string | undefined;
  delay: number;
  late: boolean;
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
  const name = you ? tr.table.youTag : person.alias;
  const fold = useContext(FoldContext);
  return (
    <View style={{ alignItems: 'center', gap: NAME_GAP }} pointerEvents="none">
      <View>
        <Animated.View
          style={{
            position: 'absolute',
            left: -FACE * RING_OUT,
            top: -FACE * RING_OUT,
            width: FACE * (1 + 2 * RING_OUT),
            height: FACE * (1 + 2 * RING_OUT),
            borderRadius: FACE,
            borderWidth: KIT.size.disk,
            borderColor: KIT.diskRing,
            opacity: ring.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 0.8, 0] }),
            transform: [
              { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.7] }) },
            ],
          }}
        />
        <Animated.View
          style={{
            opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            transform: [
              { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
              { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            ],
          }}
        >
          {!person.profiled && person.look ? (
            <Av size="row" name={person.alias}>
              <LookAvatar look={person.look} size={FACE} />
            </Av>
          ) : (
            <Av size="row" name={person.alias} photoUrl={view.data?.photoUrl ?? null} />
          )}
        </Animated.View>
      </View>
      <Fold progress={fold}>
        <Tag label={name} fit />
      </Fold>
    </View>
  );
}

// The ring around someone who sits down later.
const RING_MS = 600;
const RING_DELAY = 120;
const RING_OUT = 0.15;
