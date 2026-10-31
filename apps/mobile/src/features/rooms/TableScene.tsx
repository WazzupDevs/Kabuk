import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Pressable, useWindowDimensions, View } from 'react-native';

import { AuraBand } from '@/aura/AuraBackground';
import { Av, Glass, T } from '@/aura/kit';
import { springConfig } from '@/aura/motion';
import { LookAvatar } from '@/components/LookAvatar';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

import { type TablePerson } from './queries';

const CELL_GAP = SPACING[2];
const ROW_GAP = SPACING[2];
const NAME_GAP = SPACING[1];
// The card's padding (docs/design/aura → Masa: .pad-lg, 16 at its top) and the gap between its
// lines.
const PANEL_PAD = KIT.size.padLg;
const PANEL_TOP = 16;
const PANEL_GAP = 4;
// Under the panel, the band's soft edge over what scrolls up under the head.
const HEAD_BOTTOM = SPACING[2];
const BAND_FADE = 24;

type FaceSize = 'seat' | 'md' | 'sm';

// Where the table's 1 to 12 people sit (the owner's call, 29 Ekim: everyone on the screen, small
// faces, nothing folding away): up to four a row, the rows as even as they can be, the fuller
// first; one row of 58 faces (docs/design/aura → Masa), two rows of 44, three rows of 32.
export function seatRows(n: number): { rows: number[]; size: FaceSize } {
  const count = Math.max(1, n);
  const lines = Math.ceil(count / ROW_MAX);
  const base = Math.floor(count / lines);
  const extra = count % lines;
  const rows = Array.from({ length: lines }, (_, i) => base + (i < extra ? 1 : 0));
  return { rows, size: lines === 3 ? 'sm' : lines === 2 ? 'md' : 'seat' };
}
const ROW_MAX = 4;

// Masa's head (the owner's call, 28 and 29 Ekim): it stays put while the games scroll under it,
// and nothing in it folds. On it, in order: `children` (the bar: back, chat, invite, Masadakiler
// and end buttons), then the table's card (docs/design/aura → Masa), as wide as the cards under it,
// with the people (a profiled person's photo, an anonymous one's capsule, each with their name;
// "Sen" first) and `footer` (the table's name, its people and lobby state, the owner's lobby
// button). A press on the faces opens Masadakiler. Only the
// table's people see it (rule 4). The screen's colour clouds lie behind the head, lined up with the
// screen's own, so what scrolls under it is hidden (AuraBand).
export function TableScene({
  people,
  profiles,
  me,
  inset,
  onPress,
  children,
  footer,
}: {
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  me: string;
  // The status bar's height: the head reaches under it.
  inset: number;
  onPress: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const [headHeight, setHeadHeight] = useState(0);
  const ordered = [
    ...people.filter((p) => p.sessionId === me),
    ...people.filter((p) => p.sessionId !== me),
  ];
  const seats = seatRows(ordered.length);
  const { rows } = seats;
  // Who was here when the head first drew: they arrive in turn, later ones with a ring.
  const [first, setFirst] = useState<ReadonlySet<string> | null>(null);
  if (first === null && people.length > 0) setFirst(new Set(people.map((p) => p.sessionId)));

  const inner = width - 2 * (KIT.size.side + PANEL_PAD + KIT.size.edge);
  const cell = Math.floor((inner - (ROW_MAX - 1) * CELL_GAP) / ROW_MAX);
  // A narrow phone has no room for four 58 faces a row: 44 then.
  const size: FaceSize = seats.size === 'seat' && cell < KIT.size.av.seat ? 'md' : seats.size;
  const lines = rows.map((count, r) => {
    const from = rows.slice(0, r).reduce((sum, n) => sum + n, 0);
    return ordered.slice(from, from + count);
  });

  return (
    <View
      onLayout={(e) => setHeadHeight(e.nativeEvent.layout.height)}
      style={{ paddingTop: inset, paddingBottom: HEAD_BOTTOM, gap: KIT.size.rowGap }}
    >
      <AuraBand top={0} height={headHeight} fade={BAND_FADE} direction="down" />
      {children}
      <Glass
        style={{
          marginHorizontal: KIT.size.side,
          paddingHorizontal: PANEL_PAD,
          paddingBottom: PANEL_PAD,
          paddingTop: PANEL_TOP,
          gap: PANEL_GAP,
        }}
        testID="table-panel"
      >
        <Pressable
          testID="table-scene"
          accessibilityRole="button"
          accessibilityLabel={tr.table.whoLabel(people.length)}
          onPress={onPress}
          style={{ gap: ROW_GAP }}
        >
          {lines.map((line, r) => (
            <View key={r} style={{ flexDirection: 'row', justifyContent: 'center', gap: CELL_GAP }}>
              {line.map((p) => {
                const i = ordered.indexOf(p);
                const late = first !== null && !first.has(p.sessionId);
                return (
                  <Seat
                    key={p.sessionId}
                    person={p}
                    you={p.sessionId === me}
                    publicId={profiles?.get(p.sessionId)}
                    size={size}
                    width={cell}
                    delay={late ? 0 : SEAT_DELAY + i * SEAT_STEP}
                    late={late}
                  />
                );
              })}
            </View>
          ))}
        </Pressable>
        {footer}
      </Glass>
    </View>
  );
}
const SEAT_DELAY = 160;
const SEAT_STEP = MOTION.stagger.part;

// One person: the face popping in (someone who sits down later with a ring spreading round it),
// the name under it, as wide as the place it has.
function Seat({
  person,
  you,
  publicId,
  size,
  width,
  delay,
  late,
}: {
  person: TablePerson;
  you: boolean;
  publicId: string | undefined;
  size: FaceSize;
  width: number;
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
  const face = KIT.size.av[size];
  return (
    <View style={{ width, alignItems: 'center', gap: NAME_GAP }} pointerEvents="none">
      <View>
        <Animated.View
          style={{
            position: 'absolute',
            left: -face * RING_OUT,
            top: -face * RING_OUT,
            width: face * (1 + 2 * RING_OUT),
            height: face * (1 + 2 * RING_OUT),
            borderRadius: face,
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
            <Av size={size} name={person.alias}>
              <LookAvatar look={person.look} size={face} />
            </Av>
          ) : (
            <Av size={size} name={person.alias} photoUrl={view.data?.photoUrl ?? null} />
          )}
        </Animated.View>
      </View>
      <T v="fineLg" strong ink center lines={1} fit style={{ alignSelf: 'stretch' }}>
        {name}
      </T>
    </View>
  );
}

// The ring around someone who sits down later.
const RING_MS = 600;
const RING_DELAY = 120;
const RING_OUT = 0.15;
