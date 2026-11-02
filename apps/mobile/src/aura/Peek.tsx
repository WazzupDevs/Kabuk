import { Image } from 'expo-image';
import { type ReactNode, useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { peekScale } from '@/lib/sheetFit';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';

import { Buddy } from './Buddy';
import { Glass, T } from './kit';
import { springConfig } from './motion';
import { SceneGround } from './Scene';

export type PeekKind = Exclude<keyof typeof AURA.peek, 'up' | 'height'>;

// Buddies looking over a card's top edge (aura.css `.behind > .peek`): drawn before the card, so
// the card hides their lower half. Placed in a 350 wide frame, scaled to the card. `fit` scales the
// strip over the edge and how far down each starts too (Check-in, aura v37: 61 high on a 370 wide
// sheet), not only their size and place.
export function Peek({ kind, delay = 0, fit }: { kind: PeekKind; delay?: number; fit?: boolean }) {
  if (kind === 'notifications') return <RisoPeek />;
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

function RisoPeek() {
  const { width, height, up, left, right } = RISO_PEEK;
  const picture = { position: 'absolute', top: 0, width, height } as const;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: -up, height: up, overflow: 'hidden' }}
    >
      <Image
        source={left.source}
        style={[picture, { left: left.side, transform: [{ rotate: left.turn }] }]}
      />
      <Image
        source={right.source}
        style={[picture, { right: right.side, transform: [{ rotate: right.turn }] }]}
      />
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

// A card with buddies peeking over it (aura.css `.behind`).
export function Behind({ kind, children }: { kind: PeekKind; children: ReactNode }) {
  return (
    <View>
      <Peek kind={kind} />
      {children}
    </View>
  );
}

// A buddy and its words in a scene (docs/design/aura → Telefon, Kod: `.scene` with `.glass.say`):
// the bubble at the top, its tail towards the buddy standing at the side. The buddy jumps when
// something goes right and shakes when it goes wrong.
export function SayScene({
  look,
  text,
  side = 'left',
  reaction,
  testID,
}: {
  look: string;
  text: string;
  side?: 'left' | 'right';
  reaction?: { kind: 'ok' | 'err' | 'nod'; key: number } | null;
  testID?: string;
}) {
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
  const h = AURA.say.buddy;
  return (
    <View
      testID={testID}
      style={{
        flexGrow: 1,
        minHeight: AURA.say.minHeight,
        borderRadius: AURA.scene.radius,
        overflow: 'hidden',
      }}
    >
      <SceneGround />
      <View
        style={{
          position: 'absolute',
          top: SAY_TOP,
          left: side === 'left' ? h * FIG_RATIO + SAY_GAP : KIT.size.side - SAY_INSET,
          right: side === 'left' ? KIT.size.side - SAY_INSET : h * FIG_RATIO + SAY_GAP,
        }}
      >
        <Glass
          sm
          style={{
            paddingVertical: SAY_PAD_Y,
            paddingHorizontal: SAY_PAD_X,
            borderRadius: KIT.size.msgRadius,
            borderBottomLeftRadius: side === 'left' ? KIT.size.msgTail : KIT.size.msgRadius,
            borderBottomRightRadius: side === 'right' ? KIT.size.msgTail : KIT.size.msgRadius,
          }}
        >
          <T v="fine" ink accessibilityLiveRegion="polite">
            {text}
          </T>
        </Glass>
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: BUDDY_FOOT,
          [side]: KIT.size.side - SAY_INSET,
          transform: [
            { translateX: move.interpolate({ inputRange: [-1, 1], outputRange: [-SHAKE, SHAKE] }) },
            { translateY: jump.interpolate({ inputRange: [0, 1], outputRange: [0, -JUMP] }) },
          ],
        }}
      >
        <Buddy look={look} height={h} />
      </Animated.View>
    </View>
  );
}

const FIG_RATIO = 64 / 84;
const SAY_TOP = 18;
const SAY_GAP = 4;
const SAY_INSET = 4;
const SAY_PAD_Y = 14;
const SAY_PAD_X = 16;
const BUDDY_FOOT = -10;
const SHAKE = 6;
const SHAKE_STEP = 60;
const JUMP = 14;
const JUMP_UP = 140;
