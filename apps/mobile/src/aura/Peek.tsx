import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { peekScale } from '@/lib/sheetFit';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { MESSAGES } from '@/theme/messages';
import {
  CHECKIN_KANKI,
  CHECKIN_PEEK_FRAME,
  CHECKIN_PEEK_UP,
  KANKI_FRAME_WIDTH,
  KANKI_PEEK,
  type KankiPlace,
  REQUEST_KANKI,
  REQUEST_PEEK_FRAME,
} from '@/theme/kankiMotion';

import { Buddy } from './Buddy';
import { RisoKanki } from './RisoKanki';
import { springConfig } from './motion';

export type PeekKind = Exclude<keyof typeof AURA.peek, 'up' | 'height'>;

// Buddies looking over a card's top edge (aura.css `.behind > .peek`): drawn before the card, so
// the card hides their lower half. Placed in a 350 wide frame, scaled to the card. `fit` scales the
// strip over the edge and how far down each starts too (Check-in, aura v37: 61 high on a 370 wide
// sheet), not only their size and place.
export function Peek({ kind, delay = 0, fit }: { kind: PeekKind; delay?: number; fit?: boolean }) {
  if (kind === 'notifications') return <RisoPeek />;
  if (kind === 'request') return <RisoStrip places={REQUEST_KANKI} frame={REQUEST_PEEK_FRAME} />;
  // ui 5.1: the check-in sheet's buddies are riso pictures, the strip scaled to the sheet.
  if (kind === 'checkin') {
    return (
      <RisoStrip places={CHECKIN_KANKI} frame={CHECKIN_PEEK_FRAME} up={CHECKIN_PEEK_UP} scaled />
    );
  }
  return <BuddyPeek kind={kind} delay={delay} fit={fit} />;
}

// tuval Mesajlar (Bildirimler): two riso buddies 56 × 70, 40 in from the sheet's left and 44 from
// its right, upright; 62 of them stand over the sheet's top edge, rising from 40 below.
const RISO_PEEK = {
  width: MESSAGES.peek.width,
  height: MESSAGES.peek.height,
  up: MESSAGES.peek.up,
  rise: MESSAGES.peek.rise,
  left: { source: require('../../assets/riso/peek-1.webp'), side: MESSAGES.peek.left },
  right: { source: require('../../assets/riso/peek-2.webp'), side: MESSAGES.peek.right },
} as const;

// iskelet.md → 5.4: as the sheet opens they look up over its edge on springs.pop, the second a
// part's stagger after the first; at once with reduce motion.
function RisoPeek() {
  const { width, height, up, rise: from, left, right } = RISO_PEEK;
  const reduce = useReduceMotion();
  const [rise] = useState(() => ({
    left: new Animated.Value(reduce ? 1 : 0),
    right: new Animated.Value(reduce ? 1 : 0),
  }));
  useEffect(() => {
    if (reduce) return undefined;
    const anim = Animated.stagger(
      MOTION.stagger.part,
      [rise.left, rise.right].map((p) =>
        Animated.spring(p, { ...springConfig(MOTION.springs.pop), toValue: 1 }),
      ),
    );
    anim.start();
    return () => anim.stop();
  }, [reduce, rise]);
  const picture = { position: 'absolute', top: 0, width, height } as const;
  const lift = (p: Animated.Value) => ({
    translateY: p.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }),
  });
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: -up, height: up, overflow: 'hidden' }}
    >
      <Animated.View style={[picture, { left: left.side, transform: [lift(rise.left)] }]}>
        <Image source={left.source} style={{ width, height }} />
      </Animated.View>
      <Animated.View style={[picture, { right: right.side, transform: [lift(rise.right)] }]}>
        <Image source={right.source} style={{ width, height }} />
      </Animated.View>
    </View>
  );
}

function BuddyPeek({ kind, delay = 0, fit }: { kind: PeekKind; delay?: number; fit?: boolean }) {
  const [width, setWidth] = useState(0);
  const cast = AURA.peek[kind];
  const { k, strip: fitted } = peekScale(width, AURA.peek.up);
  const strip = fit ? fitted : AURA.peek.up;
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: -strip,
        // Only what stands over the card's edge: the card is see-through glass, and the buddies'
        // bodies showed through it (the owner's report, 28 Ekim).
        height: strip,
        overflow: 'hidden',
      }}
    >
      {width > 0
        ? cast.map((c, i) => (
            <View
              key={c.look + i}
              style={{ position: 'absolute', left: c.x * k, top: fit ? c.top * k : c.top }}
            >
              <Buddy look={c.look} height={c.height * k} delay={delay + i * 80} phase={i * 530} />
            </View>
          ))
        : null}
    </View>
  );
}

// Riso buddies looking over a card in the 350 wide frame (Arkadaslar's list).
export function RisoPeekOver({ places }: { places: readonly KankiPlace[] }) {
  return <RisoStrip places={places} frame={KANKI_FRAME_WIDTH} />;
}

// Room over the strip for a head standing higher than it (MasaIstek: -12).
const STRIP_OVER = 16;

// Riso buddies placed in a `frame` wide board over a card's top edge, scaled to the card.
function RisoStrip({
  places,
  frame,
  deep,
  up = KANKI_PEEK.up,
  scaled,
}: {
  places: readonly KankiPlace[];
  frame: number;
  deep?: boolean;
  // How far the strip stands over the edge; `scaled` scales it with the card.
  up?: number;
  scaled?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const k = width / frame;
  const rise = scaled && width > 0 ? up * k : up;
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: -rise - STRIP_OVER,
        height: (deep ? KANKI_PEEK.height : rise) + STRIP_OVER,
        overflow: 'hidden',
      }}
    >
      {width > 0
        ? places.map((p) => (
            <RisoKanki
              key={p.id}
              place={p.top !== undefined ? { ...p, top: p.top + STRIP_OVER / k } : p}
              scale={k}
              shadow={false}
            />
          ))
        : null}
    </View>
  );
}
