import { Image } from 'expo-image';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import { springConfig } from '@/aura/motion';
import { Av, Round, T, useKit } from '@/aura/kit';
import { LookAvatar } from '@/components/LookAvatar';
import { shadowParts } from '@/components/NativeShadow';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import type { TablePerson } from '@/features/rooms/queries';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { RISO as R, RISO_TYPE, risoDeck, risoDeckHeight, type RisoDeck } from '@/theme/riso';
import { useTheme } from '@/theme/ThemeProvider';

import { type RisoBuddy, risoArt, type RisoTimer } from './risoArt';

// The riso card games' shared parts (Aura v85 Kinshi, v86 Krot): who sits where and their faces,
// the top bar, the time capsule and strip, the buddies, the 3D deck. Each game draws its own card
// faces and screens over them (kinshi/, sahtekar/).

// Who sits where: the table's people by their table session id (rule 4), the profiles of the
// profiled ones, and the caller.
export type Faces = {
  me: string;
  people: ReadonlyMap<string, TablePerson>;
  profiles: ReadonlyMap<string, string> | undefined;
};

export function nameOf(faces: Faces, sid: string): string {
  if (sid === faces.me) return tr.games.you;
  return faces.people.get(sid)?.alias ?? tr.games.left;
}

// A person's face (the strip, the person chip, the rows, the line-up): a profiled person's photo,
// an anonymous one's capsule (rule 4: as at the table).
export function Face({ faces, sid, size = R.face }: { faces: Faces; sid: string; size?: number }) {
  const person = faces.people.get(sid);
  const own = useProfile();
  const publicId = person?.profiled
    ? (faces.profiles?.get(sid) ?? (sid === faces.me ? own.data?.public_id : undefined))
    : undefined;
  const view = useProfileView(publicId);
  const name = person?.alias ?? '?';
  if (person && !person.profiled && person.look) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <LookAvatar look={person.look} size={size} />
      </View>
    );
  }
  const photo = view.data?.photoUrl ?? null;
  return photo ? (
    <Image
      source={{ uri: photo }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View style={{ width: size, height: size, transform: [{ scale: size / KIT.size.av.sm }] }}>
      <Av size="sm" name={name} />
    </View>
  );
}

// Faces overlapping, each ringed in the screen's colour (`.stk`).
export function FaceStack({ faces, sids }: { faces: Faces; sids: readonly string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {sids.map((s, i) => (
        <View
          key={s}
          style={{
            marginLeft: i === 0 ? 0 : -R.faceOverlap,
            borderRadius: R.face,
            borderWidth: R.faceRing,
            borderColor: colors.canvas,
            margin: -R.faceRing,
          }}
        >
          <Face faces={faces} sid={s} />
        </View>
      ))}
    </View>
  );
}

// The top bar (`.top`): the close at the left, what the game puts in the middle (Kinshi's score,
// Krot's phase), a round at the right (the chat, Krot's "Rolüm") or its room left empty. When the
// middle does not fit between the rounds it goes under them on its own line (`under`).
export function GameTopBar({
  close,
  middle,
  right,
  under,
}: {
  close: { label: string; onPress: () => void; loading?: boolean; testID?: string };
  middle?: ReactNode;
  right?: ReactNode;
  under?: boolean;
}) {
  return (
    <View style={{ marginTop: R.barTop, alignItems: 'center', gap: BAR_LINE_GAP }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          alignSelf: 'stretch',
        }}
      >
        <Round
          icon="close"
          label={close.label}
          onPress={close.onPress}
          loading={close.loading}
          testID={close.testID}
        />
        {under ? null : middle}
        {right ?? <View style={{ width: KIT.size.round }} />}
      </View>
      {under ? middle : null}
    </View>
  );
}
// Between the rounds' line and the middle when it goes under them.
const BAR_LINE_GAP = 8;

// The chat round at the right of the top bar.
export function ChatRound({ onPress }: { onPress: () => void }) {
  return <Round icon="chat" label={tr.games.chat} onPress={onPress} />;
}

// The time capsule: full, half, or low in the phase's last 10 seconds.
export function TimeCapsule({ stage }: { stage: RisoTimer }) {
  return (
    <View
      style={{
        width: R.capsule.width,
        height: R.capsule.height,
        filter: [
          {
            dropShadow: {
              offsetX: 0,
              offsetY: R.capsuleShadow.y,
              standardDeviation: R.capsuleShadow.blur / 2,
              color: R.capsuleShadow.color,
            },
          },
        ],
      }}
    >
      <Image
        source={risoArt.timer[stage]}
        style={{ width: R.capsule.width, height: R.capsule.height }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

// The time strip (`.strip`): the capsule, the time (in --buzz in the last 10 seconds), the title
// (none when empty), and under them a line (a note, faces, a chip).
export function TimeStrip({
  stage,
  clock,
  clockLabel,
  late,
  title,
  line,
}: {
  stage: RisoTimer;
  clock: string;
  clockLabel: string;
  late: boolean;
  title?: string;
  line: ReactNode;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.stripGap, zIndex: 2 }}>
      <TimeCapsule stage={stage} />
      <View style={{ flex: 1, gap: R.stripLineGap }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: R.stripWordGap,
            flexWrap: 'wrap',
          }}
        >
          <Text
            accessibilityRole="timer"
            accessibilityLabel={clockLabel}
            maxFontSizeMultiplier={1}
            style={[RISO_TYPE.clock, { color: late ? colors.buzz : c.ink }]}
          >
            {clock}
          </Text>
          {title ? (
            <View style={{ flexShrink: 1 }}>
              <T v="h3">{title}</T>
            </View>
          ) : null}
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: R.stripLineGap,
            flexWrap: 'wrap',
          }}
        >
          {line}
        </View>
      </View>
    </View>
  );
}

// Something arriving on the pop spring, from 0.3 of its size (hareket.json → springs.pop: "people,
// capsule buddies, badges and cards arriving"). Its parent's key plays it again. At once when motion
// is reduced.
export function Pop({ children }: { children: ReactNode }) {
  const reduce = useReduceMotion();
  const [p] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return undefined;
    const anim = Animated.spring(p, {
      ...springConfig(MOTION.springs.pop),
      toValue: 1,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduce, p]);
  return (
    <Animated.View
      style={{
        opacity: p.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
        transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [POP_FROM, 1] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
const POP_FROM = 0.3;

// A buddy peeking (riso, 320 × 420): `height` high.
export function Buddy({
  buddy,
  height,
  style,
}: {
  buddy: RisoBuddy;
  height: number;
  style?: object;
}) {
  return (
    <Image
      source={risoArt.buddies[buddy]}
      style={[{ position: 'absolute', height, width: height * R.buddyRatio }, style]}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

// The two buddies peeking over the top edge of what stands under them (the deck, Krot's line-up),
// from behind it: the left one turned −8°, the right one 7° and a little lower.
export function PeekPair({
  peek,
  height,
  inset,
  rightDrop,
}: {
  peek: readonly [RisoBuddy, RisoBuddy];
  height: number;
  inset: number;
  rightDrop: number;
}) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <Buddy
        buddy={peek[0]}
        height={height}
        style={{ left: inset, transform: [{ rotate: R.peek.leftTurn }] }}
      />
      <Buddy
        buddy={peek[1]}
        height={height}
        style={{ right: inset, top: rightDrop, transform: [{ rotate: R.peek.rightTurn }] }}
      />
    </View>
  );
}

// A card's back picture, filling its card.
export function CardBack({ source, radius }: { source: ImageSourcePropType; radius: number }) {
  return (
    <Image
      source={source}
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      contentFit="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

// The deck's geometry for this screen's width (`theme/riso.ts` → `risoDeck`).
export function useRisoDeck(): RisoDeck {
  return risoDeck(useWindowDimensions().width);
}

// The 3D deck (`.d3`): the card tipped back (perspective 1100, rotateX 13°, rotateZ −1.2° from
// 50 % 60 %), six paper edges under it, two backs fanned behind, a blurred shadow beneath; the two
// buddies peek over its top edge from behind (`.peek`). `top` is what lies on the top card (the
// game's face); without it the top card shows its back.
export function Deck({
  back,
  top,
  peek,
  children,
  reach,
}: {
  back: ImageSourcePropType;
  top?: ReactNode;
  peek: readonly [RisoBuddy, RisoBuddy];
  // Laid over the deck (Kinshi's guesser's panel).
  children?: ReactNode;
  // How far down from the deck's top that reaches (its measured bottom), when it does.
  reach?: number;
}) {
  const { scheme } = useTheme();
  const shadowOff = useLabOff('golge');
  const d = useRisoDeck();
  const r = d.card.radius;
  const fan = shadowParts(shadowOff, R.fanShadow, R.fanEdge, r);
  const edge = shadowParts(shadowOff, R.edgeOuter, R.edgeShadow, r);
  const topShadow = shadowParts(shadowOff, R.cardOuter, R.cardEdge, r);
  const box: ViewStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: d.card.width,
    height: d.card.height,
  };
  return (
    <View
      style={{
        width: d.card.width,
        height: risoDeckHeight(d, reach),
        alignSelf: 'center',
      }}
    >
      <PeekPair
        peek={peek}
        height={d.peek.height}
        inset={d.peek.inset}
        rightDrop={d.peek.rightDrop}
      />
      <View
        style={{
          position: 'absolute',
          top: d.peek.above,
          left: 0,
          width: d.card.width,
          height: d.card.height,
          transformOrigin: `50% ${R.deck.originY * 100}%`,
          transform: [
            { perspective: R.deck.perspective },
            { rotateX: R.deck.rotateX },
            { rotateZ: R.deck.rotateZ },
          ],
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: `${R.deckShadow.inset * 100}%`,
            right: `${R.deckShadow.inset * 100}%`,
            bottom: -d.shadow.below,
            height: d.shadow.height,
            borderRadius: d.shadow.height,
            backgroundColor: R.deckShadow.color[scheme],
            filter: [{ blur: d.shadow.blur }],
          }}
        />
        {d.fans.map((f, i) => (
          <View
            key={i}
            style={[
              box,
              {
                borderRadius: r,
                boxShadow: fan.boxShadow,
                transform: [{ translateX: f.x }, { translateY: f.y }, { rotate: f.rotate }],
              },
            ]}
          >
            {fan.node}
            <CardBack source={back} radius={r} />
          </View>
        ))}
        {[...d.edges].reverse().map((y, i) => (
          <View
            key={i}
            style={[
              box,
              {
                borderRadius: r,
                backgroundColor: R.edgeColors[(R.edges.length - 1 - i) % 2],
                boxShadow: edge.boxShadow,
                transform: [{ translateY: y }],
              },
            ]}
          >
            {edge.node}
          </View>
        ))}
        <View style={[box, { borderRadius: r, boxShadow: topShadow.boxShadow }]}>
          {topShadow.node}
          {top ?? <CardBack source={back} radius={r} />}
        </View>
      </View>
      {children}
    </View>
  );
}
