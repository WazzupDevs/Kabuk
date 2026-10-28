import { type ReactNode, useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';

import { Buddy } from './Buddy';
import { Glass, T } from './kit';
import { springConfig } from './motion';
import { SceneGround } from './Scene';

export type PeekKind = Exclude<keyof typeof AURA.peek, 'up' | 'height'>;

// Buddies looking over a card's top edge (aura.css `.behind > .peek`): drawn before the card, so
// the card hides their lower half. Placed in a 350 wide frame, scaled to the card.
export function Peek({ kind, delay = 0 }: { kind: PeekKind; delay?: number }) {
  const [width, setWidth] = useState(0);
  const cast = AURA.peek[kind];
  const k = width > 0 ? width / PEEK_FRAME : 1;
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: -AURA.peek.up,
        height: AURA.peek.height,
      }}
    >
      {width > 0
        ? cast.map((c, i) => (
            <View key={c.look + i} style={{ position: 'absolute', left: c.x * k, top: c.top }}>
              <Buddy look={c.look} height={c.height * k} delay={delay + i * 80} phase={i * 530} />
            </View>
          ))
        : null}
    </View>
  );
}
const PEEK_FRAME = 350;

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
