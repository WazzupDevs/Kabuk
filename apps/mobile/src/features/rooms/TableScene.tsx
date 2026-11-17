import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Image, Pressable, useWindowDimensions, View } from 'react-native';

import { AuraBand, AuraPatch } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Av, Glass, T, useKit } from '@/aura/kit';
import { springConfig } from '@/aura/motion';
import { LookAvatar } from '@/components/LookAvatar';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { ROOM } from '@/theme/room';
import { SPACING } from '@/theme/tokens';
import { VENUE } from '@/theme/venue';

import { type TablePerson } from './queries';
import { TABLE_CARD_WIDE } from './tableIconImages';

const C = ROOM.card;
const F = ROOM.faces;
// Under the card: room before what scrolls up under the head.
const HEAD_BOTTOM = SPACING[2];

// Masa's head (the owner's call, 28 and 29 Ekim: it stays put while the games scroll under it; yeni
// arayüz tuvali, Masa): `children` (the bar: back, the table's pill, the chat and the ⋮ menu), then
// the table's card: its wide riso picture, the people's faces in one row ("Sen" first) with the
// chevron (a press opens Masadakiler), "Masa dolu…" once full, and `actions` (the owner's lobby
// button and "Davet et"). Only the table's people see it (rule 4). The screen's colour clouds lie
// behind the head, lined up with the screen's own, so what scrolls under it is hidden: a band down
// to the card's lower corners and the ground in the card's shape behind it (AuraPatch).
export function TableScene({
  people,
  profiles,
  me,
  icon,
  phones,
  inset,
  onPeople,
  onRestHeight,
  children,
  actions,
}: {
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  me: string;
  // The table's riso card (K-82); an old table without one has a plain picture.
  icon: string | null;
  phones: number;
  // The status bar's height: the head reaches under it.
  inset: number;
  // Masadakiler (a press on the faces' row).
  onPeople: () => void;
  // The head's height: where what scrolls starts.
  onRestHeight: (height: number) => void;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const { c, scheme } = useKit();
  const { width } = useWindowDimensions();
  // Where the card starts on the screen: the ground over the head ends there and goes on in the
  // card's shape (AuraPatch).
  const [cardTop, setCardTop] = useState<number | null>(null);
  const ordered = [
    ...people.filter((p) => p.sessionId === me),
    ...people.filter((p) => p.sessionId !== me),
  ];
  // Who was here when the head first drew: they arrive in turn, later ones with a ring.
  const [first, setFirst] = useState<ReadonlySet<string> | null>(null);
  if (first === null && people.length > 0) setFirst(new Set(people.map((p) => p.sessionId)));
  const full = phones >= MAX_TABLE_PHONES;

  // The picture as wide as the card's inside; it covers it, seen at 40 % down.
  const strip = width - 2 * (KIT.size.side + C.pad + KIT.size.edge);
  const picture = icon ? TABLE_CARD_WIDE[icon] : undefined;
  const source = picture ? Image.resolveAssetSource(picture) : null;
  const drawn = source && source.width > 0 ? (strip * source.height) / source.width : C.picture;
  const pictureHeight = Math.max(C.picture, drawn);

  return (
    <View
      onLayout={(e) => onRestHeight(e.nativeEvent.layout.height)}
      style={{ paddingTop: inset, paddingBottom: HEAD_BOTTOM, gap: KIT.size.rowGap }}
    >
      {cardTop !== null ? <AuraBand top={0} height={cardTop} fade={0} direction="down" /> : null}
      {children}
      <View
        onLayout={(e) => {
          const y = e.nativeEvent.layout.y;
          setCardTop((prev) => (prev === y ? prev : y));
        }}
      >
        {cardTop !== null ? (
          <>
            {/* Beside the card down to its lower corners, then the card's own shape. */}
            <AuraPatch top={cardTop} left={0} fill={{ left: 0, right: 0, bottom: C.radius }} />
            <AuraPatch
              top={cardTop}
              left={KIT.size.side}
              radius={C.radius}
              fill={{ left: KIT.size.side, right: KIT.size.side, bottom: 0 }}
            />
          </>
        ) : null}
        <Glass
          radius={C.radius}
          face={VENUE[scheme].card}
          style={{
            marginHorizontal: KIT.size.side,
            paddingTop: C.pad,
            paddingHorizontal: C.pad,
            paddingBottom: C.padBottom,
          }}
          testID="table-panel"
        >
          <View
            style={{
              height: C.picture,
              borderRadius: C.pictureRadius,
              overflow: 'hidden',
              backgroundColor: c.placeholder,
            }}
          >
            {picture ? (
              <Image
                source={picture}
                fadeDuration={0}
                accessible={false}
                resizeMode="cover"
                style={{
                  position: 'absolute',
                  left: 0,
                  width: strip,
                  height: pictureHeight,
                  top: -(pictureHeight - C.picture) * KIT.table.stripFocus,
                }}
              />
            ) : null}
          </View>
          <Faces people={ordered} first={first} me={me} profiles={profiles} onPress={onPeople} />
          {full ? (
            <T
              v="fine"
              testID="table-full-note"
              style={{ marginTop: ROOM.caption.top, marginHorizontal: ROOM.caption.x }}
            >
              {tr.table.fullNote}
            </T>
          ) : null}
          {actions ? (
            <View
              style={{
                marginTop: ROOM.buttons.top,
                marginHorizontal: ROOM.buttons.x,
                flexDirection: 'row',
                gap: ROOM.buttons.gap,
              }}
            >
              {actions}
            </View>
          ) : null}
        </Glass>
      </View>
    </View>
  );
}

const SEAT_DELAY = 160;
const SEAT_STEP = MOTION.stagger.part;

// The faces' row (`.fr`): everyone's face, 24, spread across the row (overlapping when they do not
// fit, at 320 dp), the chevron at the right; the whole row opens Masadakiler.
function Faces({
  people,
  first,
  me,
  profiles,
  onPress,
}: {
  people: readonly TablePerson[];
  first: ReadonlySet<string> | null;
  me: string;
  profiles: ReadonlyMap<string, string> | undefined;
  onPress: () => void;
}) {
  const { c } = useKit();
  const [width, setWidth] = useState(0);
  const face = KIT.size.av.roomFace;
  const side = face + 2 * F.ring;
  const n = people.length;
  // `space-between`: the first at the start, the last at the end, the rest evenly between.
  const step = n > 1 ? Math.max(0, (width - side) / (n - 1)) : 0;
  return (
    <Pressable
      testID="table-people-open"
      accessibilityRole="button"
      accessibilityLabel={tr.table.facesLabel(n)}
      onPress={onPress}
      style={{
        marginTop: F.top,
        marginLeft: F.left,
        marginRight: F.right,
        flexDirection: 'row',
        alignItems: 'center',
        gap: F.gap,
      }}
    >
      <View
        testID="table-scene"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ flex: 1, height: side }}
      >
        {width > 0
          ? people.map((p, i) => {
              const late = first !== null && !first.has(p.sessionId);
              return (
                <View
                  key={p.sessionId}
                  pointerEvents="none"
                  style={{ position: 'absolute', top: F.ring, left: F.ring + i * step }}
                >
                  <Face
                    person={p}
                    you={p.sessionId === me}
                    publicId={profiles?.get(p.sessionId)}
                    delay={late ? 0 : SEAT_DELAY + i * SEAT_STEP}
                    late={late}
                  />
                </View>
              );
            })
          : null}
      </View>
      <CapIcon name="forward" color={c.muted} size={F.chevron} />
    </Pressable>
  );
}

// One person's face: popping in (someone who sits down later with a ring spreading round it).
function Face({
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
  const { scheme } = useKit();
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
  const face = KIT.size.av.roomFace;
  // The face in a ring of the card's ground (`.fcs .av`: 0 0 0 2px var(--surface)).
  const board = { ring: F.ring, ringColor: VENUE[scheme].faceRing, shadow: '' };
  return (
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
          transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.7] }) }],
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
          <Av size="roomFace" name={person.alias} board={board}>
            <LookAvatar look={person.look} size={face} />
          </Av>
        ) : (
          <Av
            size="roomFace"
            name={person.alias}
            photoUrl={view.data?.photoUrl ?? null}
            board={board}
          />
        )}
      </Animated.View>
    </View>
  );
}

// The ring around someone who sits down later.
const RING_MS = 600;
const RING_DELAY = 120;
const RING_OUT = 0.15;
