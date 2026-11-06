import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Image, Pressable, useWindowDimensions, View } from 'react-native';

import { AuraBand } from '@/aura/AuraBackground';
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
// Under the card, the band's soft edge over what scrolls up under the head.
const HEAD_BOTTOM = SPACING[2];
const BAND_FADE = 24;
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
// with the screen's own, so what scrolls under it is hidden (AuraBand).
export function TableScene({
  people,
  profiles,
  me,
  icon,
  inset,
  onPress,
  open,
  onToggle,
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
  children?: ReactNode;
  info?: ReactNode;
}) {
  const { c } = useKit();
  const { width } = useWindowDimensions();
  const narrow = useNarrow();
  const [headHeight, setHeadHeight] = useState(0);
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
      onLayout={(e) => setHeadHeight(e.nativeEvent.layout.height)}
      style={{ paddingTop: inset, paddingBottom: HEAD_BOTTOM, gap: KIT.size.rowGap }}
    >
      <AuraBand top={0} height={headHeight} fade={BAND_FADE} direction="down" />
      {children}
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
          />
        </View>
      </Glass>
    </View>
  );
}
const SEAT_DELAY = 160;
const SEAT_STEP = MOTION.stagger.part;

// The drawer (MasaCekmece, MasaCekmeceAcik, MasaCekmeceGecis, MasaCekmeceDar). One set of faces
// moves between the two layouts on the morph spring (about 500 ms): from the overlapping row to
// their places in the grid, growing to their size there (36 narrow), their white ring fading; the
// names fade in over the second half; the button slides under the grid and its arrow turns over.
// The grid is laid out once, unseen, for its rows' places and its height. Reduce motion: at once.
function PeopleDrawer({
  people,
  first,
  me,
  profiles,
  narrow,
  open,
  onToggle,
  onPeople,
}: {
  people: readonly TablePerson[];
  first: ReadonlySet<string> | null;
  me: string;
  profiles: ReadonlyMap<string, string> | undefined;
  narrow: boolean;
  open: boolean;
  onToggle: () => void;
  onPeople: () => void;
}) {
  const { c } = useKit();
  const d = k.drawer;
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [grid, setGrid] = useState(0);
  const [rows, setRows] = useState<readonly number[]>([]);
  const [progress] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    if (reduce) {
      progress.setValue(open ? 1 : 0);
      return undefined;
    }
    // Layout values (height, place): on the JS side.
    const anim = Animated.spring(progress, {
      ...springConfig(MOTION.springs.morph),
      useNativeDriver: false,
      toValue: open ? 1 : 0,
    });
    anim.start();
    return () => anim.stop();
  }, [open, reduce, progress]);

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
  const lift = (from: number, to: number) =>
    progress.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
  const names = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
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

  return (
    <Animated.View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: lift(d.row, openHeight) }}
    >
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
          <Animated.View
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            onLayout={(e) => setGrid(e.nativeEvent.layout.height)}
            style={{
              position: 'absolute',
              left: -d.out,
              right: -d.out,
              top: 0,
              gap: d.rowGap,
              opacity: names,
            }}
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
          </Animated.View>
          {people.map((p, i) => {
            const fromX = i * step + closedFace / 2 - openFace / 2;
            const fromY = d.row / 2 - openFace / 2;
            const toX = -d.out + (i % perRow) * cell + cell / 2 - openFace / 2;
            const toY = rows[Math.floor(i / perRow)] ?? 0;
            const late = first !== null && !first.has(p.sessionId);
            return (
              <Animated.View
                key={p.sessionId}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: openFace,
                  height: openFace,
                  transform: [
                    { translateX: lift(fromX, toX) },
                    { translateY: lift(fromY, toY) },
                    { scale: lift(closedFace / openFace, 1) },
                  ],
                }}
              >
                <Face
                  person={p}
                  you={p.sessionId === me}
                  publicId={profiles?.get(p.sessionId)}
                  delay={late ? 0 : SEAT_DELAY + i * SEAT_STEP}
                  late={late}
                  narrow={narrow}
                />
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: openFace,
                    height: openFace,
                    borderRadius: openFace / 2,
                    borderWidth: KIT.size.avRing * (openFace / closedFace),
                    borderColor: KIT.white,
                    opacity: lift(1, 0),
                  }}
                />
              </Animated.View>
            );
          })}
        </>
      ) : null}
      <Animated.View style={{ position: 'absolute', right: 0, top: lift(0, grid + d.gap) }}>
        <Round
          label={open ? tr.table.drawerHide : tr.table.drawerShow}
          testID="table-drawer"
          onPress={onToggle}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: lift(0, 180).interpolate({
                    inputRange: [0, 180],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            }}
          >
            <CapIcon name="down" color={c.ink} size={KIT.size.iconSnug} />
          </Animated.View>
        </Round>
      </Animated.View>
    </Animated.View>
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
