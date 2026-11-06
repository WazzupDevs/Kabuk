import { type ReactNode, useEffect, useRef, useState } from 'react';
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Animated, Image, Pressable, useWindowDimensions, View } from 'react-native';

import { AuraBand, AuraPatch } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Av, Glass, Round, T, useKit } from '@/aura/kit';
import { springConfig } from '@/aura/motion';
import { LookAvatar } from '@/components/LookAvatar';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { useNarrow } from '@/lib/useNarrow';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

import { type TablePerson } from './queries';
import { TABLE_CARD_WIDE } from './tableIconImages';

const k = KIT.table;
// Under the card: room before what scrolls up under the head.
const HEAD_BOTTOM = SPACING[2];
// MasaCekmeceAcik (`.grid`): four people a row; narrow (MasaCekmeceDar), three.
const ROW_MAX = 4;
const NARROW_ROW_MAX = 3;

// Masa's head (the owner's call, 28 and 29 Ekim): it stays put while the games scroll under it.
// On it, in order: `children` (the bar: back, chat, invite, Masadakiler and end buttons), then the
// table's card (U22, docs/design/aura → Masa): its wide riso card as a strip, `info` (the table's
// name and line, the owner's lobby button), then the people's drawer (MasaCekmece, the owner's
// call, 6 Kasım): closed, their faces overlap in one row without names and take little room; the
// round button at the right (or a press on the faces) opens it into everyone four a row ("Sen"
// first) with their names, the button under them. Open, a press on the faces opens Masadakiler.
// Only the table's people see it (rule 4). The screen's colour clouds lie behind the head, lined up
// with the screen's own, so what scrolls under it is hidden: a band down to the card's lower corners
// and the ground in the card's shape behind it (AuraPatch), so what scrolls up ends along the
// card's rounded foot (the owner's report, 6 Kasım, round 3).
export function TableScene({
  people,
  profiles,
  me,
  icon,
  inset,
  onPress,
  open,
  onToggle,
  onRestHeight,
  progress,
  travel,
  children,
  info,
}: {
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  me: string;
  // The table's riso card (K-82); an old table without one has a plain strip.
  icon: string | null;
  // The status bar's height: the head reaches under it.
  inset: number;
  // Masadakiler (a press on the open drawer's faces).
  onPress: () => void;
  // The people's drawer, open or closed (the screen closes it on back and on a scroll).
  open: boolean;
  onToggle: () => void;
  // The head's height with the drawer closed and at rest: where what scrolls starts. Not reported
  // while the drawer moves or is open (it opens over the games), so the screen does not render
  // again each frame (the owner's report, 6 Kasım, round 3: the drawer opened at a low frame rate).
  onRestHeight: (height: number) => void;
  // The drawer's opening, 0 to 1, and its travel in points (useDrawerScroll).
  progress: SharedValue<number>;
  travel: SharedValue<number>;
  children?: ReactNode;
  info?: ReactNode;
}) {
  const { c } = useKit();
  const { width } = useWindowDimensions();
  const narrow = useNarrow();
  // Where the card starts on the screen (it does not move; only its height changes with the
  // drawer): the ground over the head ends there and goes on in the card's shape (AuraPatch).
  const [cardTop, setCardTop] = useState<number | null>(null);
  const latest = useRef(0);
  const moving = useRef(false);
  const ordered = [
    ...people.filter((p) => p.sessionId === me),
    ...people.filter((p) => p.sessionId !== me),
  ];
  // Who was here when the head first drew: they arrive in turn, later ones with a ring.
  const [first, setFirst] = useState<ReadonlySet<string> | null>(null);
  if (first === null && people.length > 0) setFirst(new Set(people.map((p) => p.sessionId)));

  // The strip as wide as the card's inside; the picture covers it, seen at 40 % down (`.mimg`).
  const strip = width - 2 * (KIT.size.side + k.pad + KIT.size.edge);
  const picture = icon ? TABLE_CARD_WIDE[icon] : undefined;
  const source = picture ? Image.resolveAssetSource(picture) : null;
  const drawn = source && source.width > 0 ? (strip * source.height) / source.width : k.strip;
  const pictureHeight = Math.max(k.strip, drawn);

  return (
    <View
      onLayout={(e) => {
        latest.current = e.nativeEvent.layout.height;
        if (!open && !moving.current) onRestHeight(latest.current);
      }}
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
            <AuraPatch top={cardTop} left={0} fill={{ left: 0, right: 0, bottom: k.radius }} />
            <AuraPatch
              top={cardTop}
              left={KIT.size.side}
              radius={k.radius}
              fill={{ left: KIT.size.side, right: KIT.size.side, bottom: 0 }}
            />
          </>
        ) : null}
        <Glass
          radius={k.radius}
          style={{ marginHorizontal: KIT.size.side, padding: k.pad }}
          testID="table-panel"
        >
          <View
            style={{
              height: k.strip,
              borderRadius: k.stripRadius,
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
                  top: -(pictureHeight - k.strip) * k.stripFocus,
                }}
              />
            ) : null}
          </View>
          <View
            style={{
              paddingTop: k.body.top,
              paddingHorizontal: k.body.x,
              paddingBottom: k.body.bottom,
              gap: k.body.gap,
            }}
          >
            {info}
            <PeopleDrawer
              people={ordered}
              first={first}
              me={me}
              profiles={profiles}
              narrow={narrow}
              open={open}
              onToggle={onToggle}
              onPeople={onPress}
              progress={progress}
              travel={travel}
              onMove={(m) => {
                moving.current = m;
                if (!m && !open) onRestHeight(latest.current);
              }}
            />
          </View>
        </Glass>
      </View>
    </View>
  );
}
// The drawer closes under the finger (the owner's call, 6 Kasım, round 3: it closed at its own pace
// whatever the drag): while it is open, a drag up the games closes it as far as the finger goes
// over its travel; let go past halfway it closes, short of it it opens again. The screen's scroll
// view takes `onScroll`; the drawer plays `progress` and gives its travel.
export function useDrawerScroll(open: boolean, setOpen: (open: boolean) => void) {
  const progress = useSharedValue(open ? 1 : 0);
  const travel = useSharedValue(0);
  const isOpen = useSharedValue(open);
  const from = useSharedValue(-1);
  useEffect(() => {
    isOpen.set(open);
  }, [open, isOpen]);
  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: (e) => {
      from.set(isOpen.get() && travel.get() > 0 ? e.contentOffset.y : -1);
    },
    onScroll: (e) => {
      const y0 = from.get();
      if (y0 < 0) return;
      progress.set(Math.min(1, Math.max(0, 1 - (e.contentOffset.y - y0) / travel.get())));
    },
    onEndDrag: () => {
      if (from.get() < 0) return;
      from.set(-1);
      if (progress.get() < DRAG_CLOSE) runOnJS(setOpen)(false);
      else progress.set(withSpring(1, MORPH));
    },
  });
  return { progress, travel, onScroll };
}
const DRAG_CLOSE = 0.5;

const SEAT_DELAY = 160;
const SEAT_STEP = MOTION.stagger.part;
const MORPH = MOTION.springs.morph;

// The drawer (MasaCekmece, MasaCekmeceAcik, MasaCekmeceGecis, MasaCekmeceDar). One set of faces
// moves between the two layouts on the morph spring (about 500 ms): from the overlapping row to
// their places in the grid, growing to their size there (36 narrow), their white ring fading; the
// names fade in over the second half; the button slides under the grid and its arrow turns over.
// The grid is laid out once, unseen, for its rows' places and its height. Reduce motion: at once.
// Played on the UI thread (Reanimated): on the JavaScript side with its height a layout value the
// drawer opened at a low frame rate (the owner's report, 6 Kasım, round 3).
function PeopleDrawer({
  people,
  first,
  me,
  profiles,
  narrow,
  open,
  onToggle,
  onPeople,
  progress,
  travel,
  onMove,
}: {
  people: readonly TablePerson[];
  first: ReadonlySet<string> | null;
  me: string;
  profiles: ReadonlyMap<string, string> | undefined;
  narrow: boolean;
  open: boolean;
  onToggle: () => void;
  onPeople: () => void;
  progress: SharedValue<number>;
  travel: SharedValue<number>;
  // The drawer starts (true) and stops (false) moving.
  onMove: (moving: boolean) => void;
}) {
  const { c } = useKit();
  const d = k.drawer;
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [grid, setGrid] = useState(0);
  const [rows, setRows] = useState<readonly number[]>([]);
  const shown = useRef(open);
  useEffect(() => {
    if (shown.current === open) return;
    shown.current = open;
    const to = open ? 1 : 0;
    if (reduce) {
      progress.set(to);
      return;
    }
    onMove(true);
    progress.set(
      withSpring(to, MORPH, (finished) => {
        if (finished) runOnJS(onMove)(false);
      }),
    );
  }, [open, reduce, progress, onMove]);

  const n = people.length;
  const closedFace = d.face;
  const openFace = narrow ? d.faceNarrow : d.face;
  const perRow = narrow ? NARROW_ROW_MAX : ROW_MAX;
  const button = KIT.size.roundLg;
  // Closed: the row left of the button; a full table overlaps more when it must (320 dp).
  const rowWidth = Math.max(closedFace, width - button - d.gap);
  const step =
    n > 1 ? Math.min(closedFace * (1 - d.overlap), (rowWidth - closedFace) / (n - 1)) : 0;
  // Open: the grid 8 past the body on each side, no column gap.
  const cell = (width + 2 * d.out) / perRow;
  const openHeight = Math.max(d.row, grid + d.gap + button);
  const row = d.row;
  useEffect(() => {
    travel.set(openHeight - row);
  }, [travel, openHeight, row]);
  const lines: TablePerson[][] = [];
  people.forEach((p, i) => {
    if (i % perRow === 0) lines.push([p]);
    else lines[lines.length - 1]?.push(p);
  });
  const placeRow = (r: number, y: number) =>
    setRows((prev) => {
      if (prev[r] === y) return prev;
      const next = [...prev];
      next[r] = y;
      return next;
    });

  const boxStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.get(), [0, 1], [row, openHeight]),
  }));
  const namesStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP),
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [0, grid + d.gap]) }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.get(), [0, 1], [0, 180])}deg` }],
  }));

  return (
    <Reanimated.View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={boxStyle}>
      <Pressable
        testID="table-scene"
        accessibilityRole="button"
        accessibilityLabel={open ? tr.table.whoLabel(n) : tr.table.drawerLabel(n)}
        accessibilityState={{ expanded: open }}
        onPress={open ? onPeople : onToggle}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, right: open ? 0 : button }}
      />
      {width > 0 ? (
        <>
          <Reanimated.View
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            onLayout={(e) => setGrid(e.nativeEvent.layout.height)}
            style={[
              {
                position: 'absolute',
                left: -d.out,
                right: -d.out,
                top: 0,
                gap: d.rowGap,
              },
              namesStyle,
            ]}
          >
            {lines.map((line, r) => (
              <View
                key={r}
                style={{ flexDirection: 'row' }}
                onLayout={(e) => placeRow(r, e.nativeEvent.layout.y)}
              >
                {line.map((p) => (
                  <View
                    key={p.sessionId}
                    style={{ width: cell, alignItems: 'center', gap: d.nameGap }}
                  >
                    <View style={{ width: openFace, height: openFace }} />
                    <T v="member" center lines={1} fit style={{ alignSelf: 'stretch' }}>
                      {p.sessionId === me ? tr.table.youTag : p.alias}
                    </T>
                  </View>
                ))}
              </View>
            ))}
          </Reanimated.View>
          {people.map((p, i) => {
            const late = first !== null && !first.has(p.sessionId);
            return (
              <DrawerSeat
                key={p.sessionId}
                progress={progress}
                fromX={i * step + closedFace / 2 - openFace / 2}
                fromY={row / 2 - openFace / 2}
                toX={-d.out + (i % perRow) * cell + cell / 2 - openFace / 2}
                toY={rows[Math.floor(i / perRow)] ?? 0}
                closedFace={closedFace}
                openFace={openFace}
              >
                <Face
                  person={p}
                  you={p.sessionId === me}
                  publicId={profiles?.get(p.sessionId)}
                  delay={late ? 0 : SEAT_DELAY + i * SEAT_STEP}
                  late={late}
                  narrow={narrow}
                />
              </DrawerSeat>
            );
          })}
        </>
      ) : null}
      <Reanimated.View style={[{ position: 'absolute', right: 0, top: 0 }, buttonStyle]}>
        <Round
          label={open ? tr.table.drawerHide : tr.table.drawerShow}
          testID="table-drawer"
          onPress={onToggle}
        >
          <Reanimated.View style={arrowStyle}>
            <CapIcon name="down" color={c.ink} size={KIT.size.iconSnug} />
          </Reanimated.View>
        </Round>
      </Reanimated.View>
    </Reanimated.View>
  );
}

// One face's place in the drawer: from the closed row to its cell in the grid, its white ring
// fading as it opens (transforms and opacity only, on the UI thread).
function DrawerSeat({
  progress,
  fromX,
  fromY,
  toX,
  toY,
  closedFace,
  openFace,
  children,
}: {
  progress: SharedValue<number>;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  closedFace: number;
  openFace: number;
  children: ReactNode;
}) {
  const seat = useAnimatedStyle(() => {
    const t = progress.get();
    return {
      transform: [
        { translateX: fromX + (toX - fromX) * t },
        { translateY: fromY + (toY - fromY) * t },
        { scale: closedFace / openFace + (1 - closedFace / openFace) * t },
      ],
    };
  });
  const ring = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
  return (
    <Reanimated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0, width: openFace, height: openFace }, seat]}
    >
      {children}
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: openFace,
            height: openFace,
            borderRadius: openFace / 2,
            borderWidth: KIT.size.avRing * (openFace / closedFace),
            borderColor: KIT.white,
          },
          ring,
        ]}
      />
    </Reanimated.View>
  );
}

// One person's face: popping in (someone who sits down later with a ring spreading round it).
function Face({
  person,
  you,
  publicId,
  delay,
  late,
  narrow,
}: {
  person: TablePerson;
  you: boolean;
  publicId: string | undefined;
  delay: number;
  late: boolean;
  narrow: boolean;
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
  const size = narrow ? 'member' : 'sm';
  const face = KIT.size.av[size];
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
          <Av size={size} name={person.alias}>
            <LookAvatar look={person.look} size={face} />
          </Av>
        ) : (
          <Av size={size} name={person.alias} photoUrl={view.data?.photoUrl ?? null} />
        )}
      </Animated.View>
    </View>
  );
}

// The ring around someone who sits down later.
const RING_MS = 600;
const RING_DELAY = 120;
const RING_OUT = 0.15;
