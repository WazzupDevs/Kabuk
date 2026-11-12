import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { peekScale } from '@/lib/sheetFit';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import {
  CHECKIN_KANKI,
  CHECKIN_PEEK_FRAME,
  CHECKIN_PEEK_UP,
  KANKI_FRAME_WIDTH,
  KANKI_PEEK,
  type KankiPlace,
  REQUEST_KANKI,
  REQUEST_PEEK_FRAME,
  SIGNUP_KANKI,
  type SignupCast,
} from '@/theme/kankiMotion';
import { SPACING } from '@/theme/tokens';

import { Buddy } from './Buddy';
import { Glass, T } from './kit';
import { RisoKanki, SignupScene } from './RisoKanki';
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

// U30 (Bildirimler `.pk`): two riso buddies, 64 wide (160x200 pictures), 32 in from the sheet's
// left and 36 from its right, turned -8 and 7 degrees; 57 of them stand over the sheet's top edge.
const RISO_PEEK = {
  width: 64,
  height: 80,
  up: 57,
  left: { source: require('../../assets/riso/peek-1.webp'), side: 32, turn: '-8deg' },
  right: { source: require('../../assets/riso/peek-2.webp'), side: 36, turn: '7deg' },
} as const;

// iskelet.md → 5.4: as the sheet opens they look up over its edge on springs.pop, the second a
// part's stagger after the first; at once with reduce motion.
function RisoPeek() {
  const { width, height, up, left, right } = RISO_PEEK;
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
    translateY: p.interpolate({ inputRange: [0, 1], outputRange: [up, 0] }),
  });
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: -up, height: up, overflow: 'hidden' }}
    >
      <Animated.View style={[picture, { left: left.side, transform: [lift(rise.left)] }]}>
        <Image source={left.source} style={{ width, height, transform: [{ rotate: left.turn }] }} />
      </Animated.View>
      <Animated.View style={[picture, { right: right.side, transform: [lift(rise.right)] }]}>
        <Image
          source={right.source}
          style={{ width, height, transform: [{ rotate: right.turn }] }}
        />
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

type Reaction = { kind: 'ok' | 'err' | 'nod'; key: number } | null;

// The speaker's answer to the step: a jump when it went right, a shake when it went wrong. Still
// with reduce motion.
function useSayReaction(reaction: Reaction | undefined) {
  const reduce = useReduceMotion();
  const [move] = useState(() => new Animated.Value(0));
  const [jump] = useState(() => new Animated.Value(0));
  const key = reaction?.key;
  const kind = reaction?.kind;
  useEffect(() => {
    if (key === undefined || reduce) return undefined;
    const anim =
      kind === 'err'
        ? Animated.sequence(
            [1, -1, 1, -1, 0].map((to) =>
              Animated.timing(move, { toValue: to, duration: SHAKE_STEP, useNativeDriver: true }),
            ),
          )
        : Animated.sequence([
            Animated.timing(jump, { toValue: 1, duration: JUMP_UP, useNativeDriver: true }),
            Animated.spring(jump, { ...springConfig(MOTION.springs.pop), toValue: 0 }),
          ]);
    anim.start();
    return () => anim.stop();
  }, [key, kind, reduce, move, jump]);
  return [
    { translateX: move.interpolate({ inputRange: [-1, 1], outputRange: [-SHAKE, SHAKE] }) },
    { translateY: jump.interpolate({ inputRange: [0, 1], outputRange: [0, -JUMP] }) },
  ];
}

export type RisoSayKind = keyof typeof SIGNUP_KANKI;

// U40 (Telefon, Kod; Aura v71 every sign-up step): the sign-up scene with its still riso buddies and
// the step's line in a glass bubble at its top, its tail towards the one who says it; that one still
// jumps and shakes.
export function RisoSayScene({
  kind,
  text,
  reaction,
}: {
  kind: RisoSayKind;
  text: string;
  reaction?: Reaction;
}) {
  const cast: SignupCast = SIGNUP_KANKI[kind];
  const shove = useSayReaction(reaction);
  const [width, setWidth] = useState(0);
  const k = width / KANKI_FRAME_WIDTH;
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexGrow: 1, minHeight: AURA.say.minHeight }}
    >
      <SignupScene width={width}>
        {(s) => (
          <>
            {cast.other ? <RisoKanki place={cast.other} scale={s} /> : null}
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { transform: shove }]}
            >
              <RisoKanki place={cast.speaker} scale={s} />
            </Animated.View>
          </>
        )}
      </SignupScene>
      {width > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: cast.say.top,
            left: cast.say.left * k,
            right: cast.say.right * k,
          }}
        >
          <Glass
            sm
            style={{
              paddingVertical: SPACING[3],
              paddingHorizontal: SPACING[4],
              borderRadius: KIT.size.msgRadius,
              borderBottomLeftRadius:
                cast.say.tail === 'left' ? KIT.size.msgTail : KIT.size.msgRadius,
              borderBottomRightRadius:
                cast.say.tail === 'right' ? KIT.size.msgTail : KIT.size.msgRadius,
            }}
          >
            <T v="fine" ink accessibilityLiveRegion="polite">
              {text}
            </T>
          </Glass>
        </View>
      ) : null}
    </View>
  );
}

// U40: the riso buddies looking over the field (`.behind > .peek`: a strip 58 over the field's top
// edge); only what stands over the edge is drawn, the glass field would show the rest through. A
// `deep` step (the photo picker, room around it) shows the whole 120 strip behind the field.
export function RisoFieldPeek({ kind }: { kind: RisoSayKind }) {
  const cast: SignupCast = SIGNUP_KANKI[kind];
  return <RisoStrip places={cast.peek} frame={KANKI_FRAME_WIDTH} deep={cast.deep} />;
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

const SHAKE = 6;
const SHAKE_STEP = 60;
const JUMP = 14;
const JUMP_UP = 140;
