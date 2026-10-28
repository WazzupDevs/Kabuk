import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { Buddy } from '@/aura/Buddy';
import { springConfig } from '@/aura/motion';
import { SceneGround } from '@/aura/Scene';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { type TablePerson } from './queries';
import { PersonFace } from './RoomPeople';
import { TableIcon } from './TableIcon';

const T = AURA.table;

// The table as a scene (docs/design/aura → Masa): its icon in the middle on a white ring, everyone
// at it around it: an anonymous person as their capsule buddy, a profiled one as their photo. The
// people arrive one after another with a bounce; someone who sits down later pops in with a ring
// spreading around them. A press opens Masadakiler. Only the table's people see it (rule 4).
export function TableScene({
  icon,
  people,
  profiles,
  onPress,
}: {
  icon: string | null;
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  onPress: () => void;
}) {
  const { shape, scheme } = useTheme();
  const glass = AURA[scheme].glass;
  const [width, setWidth] = useState(0);
  // Who was here when the scene first drew: they arrive in a row, later ones with a ring.
  const [first, setFirst] = useState<ReadonlySet<string> | null>(null);
  if (first === null && people.length > 0) setFirst(new Set(people.map((p) => p.sessionId)));
  const shown = people.slice(0, T.max);
  const more = people.length - shown.length;
  return (
    <Pressable
      testID="table-scene"
      accessibilityRole="button"
      accessibilityLabel={tr.table.whoLabel(people.length)}
      onPress={onPress}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        height: T.height,
        borderRadius: AURA.scene.radius,
        overflow: 'hidden',
      }}
    >
      <SceneGround />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: T.tableTop, alignItems: 'center' }}
      >
        <View
          style={{
            borderRadius: shape.radius.lg,
            borderWidth: T.ring,
            borderColor: AURA.mark.light,
            boxShadow: glass.shadow,
          }}
        >
          <TableIcon icon={icon} size="stage" />
        </View>
      </View>
      {width > 0
        ? shown.map((p, i) => (
            <Seat
              key={p.sessionId}
              person={p}
              publicId={profiles?.get(p.sessionId)}
              index={i}
              x={(T.seats[i]?.[0] ?? 0.5) * width}
              y={(T.seats[i]?.[1] ?? 0.5) * T.height}
              late={first !== null && !first.has(p.sessionId)}
            />
          ))
        : null}
      {more > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: SPACING[3],
            top: SPACING[3],
            paddingHorizontal: SPACING[2],
            borderRadius: shape.radius.pill,
            backgroundColor: glass.fill,
          }}
        >
          <Text variant="fine" tone="text">
            {tr.table.more(more)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Seat({
  person,
  publicId,
  index,
  x,
  y,
  late,
}: {
  person: TablePerson;
  publicId: string | undefined;
  index: number;
  x: number;
  y: number;
  late: boolean;
}) {
  const reduce = useReduceMotion();
  const delay = late ? 0 : 200 + index * MOTION.stagger.part;
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

  if (!person.profiled && person.look) {
    // A buddy stands with its feet on the seat.
    const h = T.buddy;
    return (
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: x - (h * 64) / 84 / 2, top: y - h * 0.62 }}
      >
        <Buddy look={person.look} height={h} delay={delay} phase={index * 470} />
      </View>
    );
  }
  const f = T.face;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - f / 2, top: y - f / 2 }}>
      <Animated.View
        style={{
          position: 'absolute',
          left: -f * 0.15,
          top: -f * 0.15,
          width: f * 1.3,
          height: f * 1.3,
          borderRadius: f,
          borderWidth: T.ring,
          borderColor: AURA.mark.overlap,
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
        <PersonFace person={person} publicId={publicId} size="md" />
      </Animated.View>
    </View>
  );
}

// The ring around someone who sits down later.
const RING_MS = 600;
const RING_DELAY = 120;
