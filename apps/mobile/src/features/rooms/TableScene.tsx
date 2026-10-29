import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Animated, Image, Pressable, useWindowDimensions, View } from 'react-native';
import Reanimated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';

import { GROUND_PICTURE } from '@/aura/AuraBackground';
import { Fold } from '@/aura/Fold';
import { Av, Glass, T } from '@/aura/kit';
import { springConfig } from '@/aura/motion';
import { LookAvatar } from '@/components/LookAvatar';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

import { type TablePerson } from './queries';

const CELL_GAP = SPACING[2];
const ROW_GAP = SPACING[2.5];
const NAME_GAP = SPACING[1];
// Under the panel, the band's soft edge over what scrolls up under the head.
const HEAD_BOTTOM = SPACING[2];
const BAND_FADE = 24;
const BAND_STEPS = 8;

type FaceSize = 'lg' | 'row' | 'md';

// Where the table's 1 to 12 people sit (the owner's call, 29 Ekim: everyone always on the screen):
// one row up to four, two rows up to eight, three up to twelve; the rows as even as they can be,
// the fuller first; the faces as large as the widest row allows.
export function seatRows(n: number): { rows: number[]; size: FaceSize } {
  const count = Math.max(1, n);
  const lines = count <= 4 ? 1 : count <= 8 ? 2 : 3;
  const base = Math.floor(count / lines);
  const extra = count % lines;
  const rows = Array.from({ length: lines }, (_, i) => base + (i < extra ? 1 : 0));
  const widest = Math.max(...rows);
  const size: FaceSize = lines === 3 ? 'md' : widest <= 3 ? 'lg' : 'row';
  return { rows, size };
}

// Masa's head (the owner's call, 28 and 29 Ekim): it stays put while the games scroll under it. On
// it, in order: `children` (the bar: back, chat, invite, the lobby and end buttons), then a glass
// panel as wide as the cards under it (the owner's call, 29 Ekim) with the people (a profiled
// person's photo, an anonymous one's capsule, each with their name; "Sen" first) and `footer` (the
// table's name, its people and lobby state). A press on the faces opens Masadakiler. Only the
// table's people see it (rule 4). The screen's colour clouds lie behind the head, lined up with the
// screen's own, so what scrolls under it is hidden; they follow the head as it folds.
export function TableScene({
  people,
  profiles,
  me,
  inset,
  onPress,
  children,
  footer,
  fold,
  onFoldReach,
}: {
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  me: string;
  // The status bar's height: the head reaches under it.
  inset: number;
  onPress: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  // Folds the names and the footer away while the games scroll on (useCollapseOnScroll): only
  // the faces stay under the buttons (the owner's call, 29 Ekim).
  fold?: SharedValue<number>;
  // Told how much shorter the head is folded (the footer and the names), whenever that changes.
  onFoldReach?: (px: number) => void;
}) {
  const { width } = useWindowDimensions();
  const [footerHeight, setFooterHeight] = useState(0);
  const [tagHeight, setTagHeight] = useState(0);
  const [headHeight, setHeadHeight] = useState(0);
  const ordered = [
    ...people.filter((p) => p.sessionId === me),
    ...people.filter((p) => p.sessionId !== me),
  ];
  const { rows, size } = seatRows(ordered.length);
  const reach = footerHeight + tagHeight * rows.length;
  useEffect(() => {
    onFoldReach?.(reach);
  }, [reach, onFoldReach]);
  const folding = useMemo(
    () => (fold ? { progress: fold, onTag: setTagHeight } : undefined),
    [fold],
  );
  // Who was here when the head first drew: they arrive in turn, later ones with a ring.
  const [first, setFirst] = useState<ReadonlySet<string> | null>(null);
  if (first === null && people.length > 0) setFirst(new Set(people.map((p) => p.sessionId)));

  const inner = width - 2 * (KIT.size.side + KIT.size.pad + KIT.size.edge);
  const widest = Math.max(...rows);
  const cell = Math.floor((inner - (widest - 1) * CELL_GAP) / widest);
  const lines = rows.map((count, r) => {
    const from = rows.slice(0, r).reduce((sum, n) => sum + n, 0);
    return ordered.slice(from, from + count);
  });

  return (
    <FoldContext.Provider value={folding}>
      <View
        onLayout={(e) => {
          // Only the unfolded height places the band (folding changes the layout every frame).
          if (!fold || fold.value === 0) setHeadHeight(e.nativeEvent.layout.height);
        }}
        style={{ paddingTop: inset, paddingBottom: HEAD_BOTTOM, gap: KIT.size.rowGap }}
      >
        <HeadBand height={headHeight} fold={fold} reach={reach} />
        {children}
        <Glass
          pad="pad"
          style={{ marginHorizontal: KIT.size.side, gap: KIT.size.rowGap }}
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
              <View
                key={r}
                style={{ flexDirection: 'row', justifyContent: 'center', gap: CELL_GAP }}
              >
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
          <Fold progress={fold} onHeight={setFooterHeight} style={{ gap: KIT.size.rowGap }}>
            {footer}
          </Fold>
        </Glass>
      </View>
    </FoldContext.Provider>
  );
}
const FoldContext = createContext<
  { progress: SharedValue<number>; onTag: (height: number) => void } | undefined
>(undefined);
const SEAT_DELAY = 160;
const SEAT_STEP = MOTION.stagger.part;

// The screen's still colour clouds (AuraBackground) cut to the head and lined up with the screen's,
// so the games scroll away under it; its foot fades in strips (React Native has no mask). Folding
// lifts the foot by what folds away, on the UI thread.
function HeadBand({
  height,
  fold,
  reach,
}: {
  height: number;
  fold?: SharedValue<number>;
  reach: number;
}) {
  const off = useLabOff('zemin');
  const bottom = useDerivedValue(() => height - (fold ? fold.value : 0) * reach);
  if (off || height === 0) return null;
  const strip = BAND_FADE / BAND_STEPS;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
      <BandPart bottom={bottom} offset={0} height={null} opacity={1} />
      {Array.from({ length: BAND_STEPS }, (_, i) => (
        <BandPart
          key={i}
          bottom={bottom}
          offset={i * strip}
          height={strip}
          opacity={1 - (i + 1) / (BAND_STEPS + 1)}
        />
      ))}
    </View>
  );
}

// One part of the band: the head itself (`height` null: from the top to the foot) or a strip of
// the fade `offset` under the foot. The picture inside stays where the screen's is.
function BandPart({
  bottom,
  offset,
  height,
  opacity,
}: {
  bottom: SharedValue<number>;
  offset: number;
  height: number | null;
  opacity: number;
}) {
  const { scheme } = useTheme();
  const { width, height: screen } = useWindowDimensions();
  const box = useAnimatedStyle(() =>
    height === null
      ? { height: Math.max(0, bottom.value) }
      : { transform: [{ translateY: bottom.value + offset }] },
  );
  const picture = useAnimatedStyle(() =>
    height === null ? {} : { transform: [{ translateY: -(bottom.value + offset) }] },
  );
  return (
    <Reanimated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width, overflow: 'hidden', opacity },
        height === null ? null : { height },
        box,
      ]}
    >
      <Reanimated.View style={[{ position: 'absolute', left: 0, top: 0 }, picture]}>
        <Image
          source={GROUND_PICTURE[scheme]}
          fadeDuration={0}
          resizeMode="cover"
          style={{ width, height: screen }}
          accessible={false}
        />
      </Reanimated.View>
    </Reanimated.View>
  );
}

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
  const fold = useContext(FoldContext);
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
      <View style={{ alignSelf: 'stretch' }}>
        <Fold progress={fold?.progress} onHeight={fold?.onTag}>
          <T v="fine" strong ink center lines={1} fit>
            {name}
          </T>
        </Fold>
      </View>
    </View>
  );
}

// The ring around someone who sits down later.
const RING_MS = 600;
const RING_DELAY = 120;
const RING_OUT = 0.15;
