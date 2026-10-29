import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Av } from '@/aura/kit';
import { LookAvatar } from '@/components/LookAvatar';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import type { TablePerson } from '@/features/rooms/queries';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { KIT } from '@/theme/auraKit';
import { VAMPIR_LOOK as L } from '@/theme/vampir';

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
