import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Image, Pressable, useWindowDimensions, View } from 'react-native';

import { AuraBand } from '@/aura/AuraBackground';
import { Av, Glass, T, useKit } from '@/aura/kit';
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
// U22 (Masa `.grid`): four people a row.
const ROW_MAX = 4;
const NARROW_ROW_MAX = 3;
const NARROW_ROW_GAP = 12;

// Masa's head (the owner's call, 28 and 29 Ekim): it stays put while the games scroll under it,
// and nothing in it folds. On it, in order: `children` (the bar: back, chat, invite, Masadakiler
// and end buttons), then the table's card (U22, docs/design/aura → Masa): its wide riso card as a
// strip, `info` (the table's name and line, the owner's lobby button), then everyone at the table
// four a row ("Sen" first), each face with its name under it. A press on the faces opens
// Masadakiler. Only the table's people see it (rule 4). The screen's colour clouds lie behind the
// head, lined up with the screen's own, so what scrolls under it is hidden (AuraBand).
export function TableScene({
  people,
  profiles,
  me,
  icon,
  inset,
  onPress,
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
  onPress: () => void;
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
  const inner = strip - 2 * k.body.x;
  // Aura v75 MasaDar: narrow (src/lib/narrow.ts), three to a row, the faces 44, 12 between rows.
  const perRow = narrow ? NARROW_ROW_MAX : ROW_MAX;
  const cell = Math.floor((inner - (perRow - 1) * k.colGap) / perRow);
  const lines: TablePerson[][] = [];
  ordered.forEach((p, i) => {
    if (i % perRow === 0) lines.push([p]);
    else lines[lines.length - 1]?.push(p);
  });

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
          <Pressable
            testID="table-scene"
            accessibilityRole="button"
            accessibilityLabel={tr.table.whoLabel(people.length)}
            onPress={onPress}
            style={{ gap: narrow ? NARROW_ROW_GAP : k.rowGap }}
          >
            {lines.map((line, r) => (
              <View key={r} style={{ flexDirection: 'row', gap: k.colGap }}>
                {line.map((p) => {
                  const i = ordered.indexOf(p);
                  const late = first !== null && !first.has(p.sessionId);
                  return (
                    <Seat
                      key={p.sessionId}
                      person={p}
                      you={p.sessionId === me}
                      publicId={profiles?.get(p.sessionId)}
                      width={cell}
                      delay={late ? 0 : SEAT_DELAY + i * SEAT_STEP}
                      late={late}
                      narrow={narrow}
                    />
                  );
                })}
              </View>
            ))}
          </Pressable>
        </View>
      </Glass>
    </View>
  );
}
const SEAT_DELAY = 160;
const SEAT_STEP = MOTION.stagger.part;

// One person: the face popping in (someone who sits down later with a ring spreading round it),
// the name under it (11/600, muted), as wide as the place it has.
function Seat({
  person,
  you,
  publicId,
  width,
  delay,
  late,
  narrow,
}: {
  person: TablePerson;
  you: boolean;
  publicId: string | undefined;
  width: number;
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
  const name = you ? tr.table.youTag : person.alias;
  const size = narrow ? 'md' : 'member';
  const face = KIT.size.av[size];
  return (
    <View style={{ width, alignItems: 'center', gap: k.nameGap }} pointerEvents="none">
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
      <T v="member" center lines={1} fit style={{ alignSelf: 'stretch' }}>
        {name}
      </T>
    </View>
  );
}

// The ring around someone who sits down later.
const RING_MS = 600;
const RING_DELAY = 120;
const RING_OUT = 0.15;
