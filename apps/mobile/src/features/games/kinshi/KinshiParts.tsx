import type { TabuCard } from '@shared/tabu.ts';
import type { TabuMark, TabuTeam } from '@shared/tabuGame.ts';
import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { springConfig } from '@/aura/motion';
import { Av, Chip, Glass, Round, T, Tag, usePress, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import { shadowParts } from '@/components/NativeShadow';
import { useProfile } from '@/features/account/useProfile';
import { useProfileView } from '@/features/profile/queries';
import type { TablePerson } from '@/features/rooms/queries';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { TEAM_TONES, type Team } from '@/theme/gameColors';
import {
  KINSHI as K,
  KINSHI_MIN_TYPE,
  KINSHI_TYPE as KT,
  kinshiBand,
  kinshiDeck,
  kinshiScorePill,
  kinshiDeckHeight,
  type KinshiDeck,
} from '@/theme/kinshi';
import { kinshiWordLayout } from '@/theme/kinshiWord';
import { useTheme } from '@/theme/ThemeProvider';

import { type KinshiBuddy, kinshiArt, type KinshiTimer } from './kinshiArt';

const MAX_FONT = 1.3;

// Who sits where: the table's people by their table session id (rule 4), the profiles of the
// profiled ones, and the caller.
export type Faces = {
  me: string;
  people: ReadonlyMap<string, TablePerson>;
  profiles: ReadonlyMap<string, string> | undefined;
};

export function nameOf(faces: Faces, sid: string): string {
  if (sid === faces.me) return tr.kinshi.you;
  return faces.people.get(sid)?.alias ?? tr.kinshi.left;
}

// Mor ('a') and Pembe ('b') in the theme's colours.
export function teamKey(team: TabuTeam): Team {
  return team === 'a' ? 'purple' : 'pink';
}

export function useTeamTone(team: TabuTeam) {
  const { scheme } = useTheme();
  return TEAM_TONES[scheme][teamKey(team)];
}

// A person's face at the canvas's 26 (the strip, the person chip, the rows): a profiled person's
// photo, an anonymous one's capsule (rule 4: as at the table).
export function Face({ faces, sid, size = K.face }: { faces: Faces; sid: string; size?: number }) {
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

// The guessers' faces, overlapping, each in the screen's colour (`.stk`).
export function FaceStack({ faces, sids }: { faces: Faces; sids: readonly string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {sids.map((s, i) => (
        <View
          key={s}
          style={{
            marginLeft: i === 0 ? 0 : -K.faceOverlap,
            borderRadius: K.face,
            borderWidth: K.faceRing,
            borderColor: colors.canvas,
            margin: -K.faceRing,
          }}
        >
          <Face faces={faces} sid={s} />
        </View>
      ))}
    </View>
  );
}

// A team's label (`.tag.m`, `.tag.p`).
export function TeamTag({ team, short }: { team: TabuTeam; short?: boolean }) {
  const tone = useTeamTone(team);
  return (
    <Tag
      label={short ? tr.kinshi.teamShort[team] : tr.kinshi.team[team]}
      colors={{ bg: tone.tagBg, fg: tone.tagInk }}
    />
  );
}

// A played card's mark (`.tag.dg`, `.tag.ps`, `.tag.yk`): Doğru on --signal, Pas soft, Yasak! on
// --buzz. `label` for another word on the same ground (+2, a count).
export function MarkTag({ mark, label }: { mark: TabuMark; label?: string }) {
  const { colors } = useTheme();
  const { c } = useKit();
  const tone =
    mark === 'correct'
      ? { bg: colors.signal, fg: colors.onSignal }
      : mark === 'taboo'
        ? { bg: colors.buzz, fg: colors.onBuzz }
        : { bg: c.raised, fg: c.ink, edge: c.raisedEdge };
  return <Tag label={label ?? tr.kinshi.marks[mark]} colors={tone} />;
}

// The team's bar (`.tb`): 8 × 16 in the team's colour.
export function TeamBar({ team }: { team: TabuTeam }) {
  const tone = useTeamTone(team);
  return (
    <View
      style={{
        width: K.score.bar.w,
        height: K.score.bar.h,
        borderRadius: K.score.bar.r,
        backgroundColor: tone.color,
      }}
    />
  );
}

// The top bar (`.top`): the close at the left, the glass score pill in the middle (Mor's bar and
// number, a line, Pembe's, the turn chip), the chat at the right.
export function TopBar({
  close,
  score,
  onChat,
}: {
  close: { label: string; onPress: () => void; loading?: boolean; testID?: string };
  score: { a: number; b: number; turn: string } | null;
  onChat: () => void;
}) {
  const { c } = useKit();
  const { width } = useWindowDimensions();
  // Between the rounds when it fits at its tightest (its spaces then close only as far as the bar
  // needs: Yoga shrinks them, never the numbers or the chip); under them on its own line when not.
  const inline = score
    ? kinshiScorePill(score.a, score.b, width, {
        side: KIT.size.side,
        round: KIT.size.round,
        edge: KIT.size.edge,
      }).fits
    : true;
  const pill = score ? (
    <View
      accessible
      accessibilityLabel={tr.kinshi.scoreLabel(score.a, score.b)}
      style={{ flexShrink: 1, marginHorizontal: K.scoreTight.clear }}
    >
      <Glass
        radius={K.score.height / 2}
        style={{
          height: K.score.height,
          paddingRight: K.score.padRight,
          flexDirection: 'row',
          alignItems: 'center',
          flexShrink: 1,
        }}
      >
        <PillSpace size={K.score.padLeft} least={K.scoreTight.padLeft} />
        <TeamBar team="a" />
        <PillSpace size={K.score.gap} least={K.scoreTight.gap} />
        <Text maxFontSizeMultiplier={1} style={[KT.score, { color: c.ink }]}>
          {score.a}
        </Text>
        <PillSpace size={K.score.gap} least={K.scoreTight.gap} />
        <View style={{ width: 1, height: K.score.rule, backgroundColor: c.hair }} />
        <PillSpace size={K.score.gap} least={K.scoreTight.gap} />
        <TeamBar team="b" />
        <PillSpace size={K.score.gap} least={K.scoreTight.gap} />
        <Text maxFontSizeMultiplier={1} style={[KT.score, { color: c.ink }]}>
          {score.b}
        </Text>
        <PillSpace size={K.score.gap} least={K.scoreTight.gap} />
        <View style={{ height: K.scoreChip, justifyContent: 'center' }}>
          <Chip label={score.turn} fixed />
        </View>
      </Glass>
    </View>
  ) : null;
  return (
    <View style={{ marginTop: K.barTop, alignItems: 'center', gap: K.scoreLineGap }}>
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
        {inline ? pill : null}
        <Round icon="chat" label={tr.kinshi.chat} onPress={onChat} />
      </View>
      {inline ? null : pill}
    </View>
  );
}

// A space in the score pill: the canvas's, closing to `least` when the bar is short of room.
function PillSpace({ size, least }: { size: number; least: number }) {
  return <View style={{ width: size, minWidth: least, flexShrink: 1 }} />;
}

// The time capsule (Aura v85): full in Tur öncesi and the 3-2-1, half while the turn runs, low in
// its last 10 seconds (the report: three stages).
export function TimeCapsule({ stage }: { stage: KinshiTimer }) {
  return (
    <View
      style={{
        width: K.capsule.width,
        height: K.capsule.height,
        filter: [
          {
            dropShadow: {
              offsetX: 0,
              offsetY: K.capsuleShadow.y,
              standardDeviation: K.capsuleShadow.blur / 2,
              color: K.capsuleShadow.color,
            },
          },
        ],
      }}
    >
      <Image
        source={kinshiArt.timer[stage]}
        style={{ width: K.capsule.width, height: K.capsule.height }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

// The time strip (`.strip`): the capsule, the time (in --buzz in the last 10 seconds), the role,
// and under them a line of who (a team label, faces, a note).
export function TimeStrip({
  stage,
  clock,
  clockLabel,
  late,
  title,
  line,
}: {
  // Null: no capsule and no time (Signum's Kara kart açıldı: `.strip.nokap`).
  stage: KinshiTimer | null;
  clock: string;
  clockLabel: string;
  late: boolean;
  title: string;
  line: ReactNode;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.stripGap, zIndex: 2 }}>
      {stage ? <TimeCapsule stage={stage} /> : null}
      <View style={{ flex: 1, gap: K.stripLineGap }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: K.stripWordGap,
            flexWrap: 'wrap',
          }}
        >
          {stage ? (
            <Text
              accessibilityRole="timer"
              accessibilityLabel={clockLabel}
              maxFontSizeMultiplier={1}
              style={[KT.clock, { color: late ? colors.buzz : c.ink }]}
            >
              {clock}
            </Text>
          ) : null}
          <View style={{ flexShrink: 1 }}>
            <T v="h3">{title}</T>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: K.stripLineGap,
            flexWrap: 'wrap',
          }}
        >
          {line}
        </View>
      </View>
    </View>
  );
}

// Something arriving on the pop spring, from 0.3 of its size (hareket.json → springs.pop: "cards
// arriving"). Its parent's key plays it again. At once when motion is reduced.
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
  buddy: KinshiBuddy;
  height: number;
  style?: object;
}) {
  return (
    <Image
      source={kinshiArt.buddies[buddy]}
      style={[{ position: 'absolute', height, width: height * K.buddyRatio }, style]}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

// What lies on the deck's top: the card's front with its words, its back, or the card list still
// coming (Loader) or failed (its words).
export type CardFace =
  | { kind: 'front'; card: TabuCard; key: string }
  // Another game's front on the same deck (Signum's role card), its words drawn over it.
  | { kind: 'node'; node: ReactNode; key: string }
  | { kind: 'back' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string };

// The card's front (`.card`): the riso ground, the word white in the pink band, the five forbidden
// words under it with a 14 % line between them.
function Front({ card, d }: { card: TabuCard; d: KinshiDeck }) {
  const word = upperTr(card.word);
  const layout = kinshiWordLayout(word, kinshiBand(d));
  const wordStyle = {
    color: K.wordInk,
    textAlign: 'center',
    textShadowColor: K.wordShadow.color,
    textShadowOffset: { width: 0, height: K.wordShadow.y },
    textShadowRadius: 0,
  } as const;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={kinshiArt.cardFront}
        style={[StyleSheet.absoluteFill, { borderRadius: d.card.radius }]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View
        style={{
          position: 'absolute',
          left: d.wordBand.side,
          right: d.wordBand.side,
          top: d.wordBand.top,
          height: d.wordBand.height,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {layout.lines === 1 ? (
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={MIN_WORD}
            maxFontSizeMultiplier={1}
            style={[KT.word, wordStyle]}
          >
            {word}
          </Text>
        ) : (
          // Two lines (a phrase that does not fit one at 22): its own size and pitch, the ink in
          // the band's middle (`theme/kinshiWord.ts`).
          <Text
            accessibilityRole="header"
            accessibilityLabel={word}
            numberOfLines={2}
            maxFontSizeMultiplier={1}
            style={[
              KT.word,
              wordStyle,
              {
                position: 'absolute',
                left: 0,
                right: 0,
                top: layout.top,
                includeFontPadding: false,
              },
              layout.type,
            ]}
          >
            {`${layout.text[0]}\n${layout.text[1]}`}
          </Text>
        )}
      </View>
      <View
        style={{
          position: 'absolute',
          left: d.list.side,
          right: d.list.side,
          top: d.list.top,
          height: d.list.height,
        }}
      >
        {card.forbidden.map((w, i) => (
          <View
            key={`${i}-${w}`}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: K.listRule,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={MIN_FORBIDDEN}
              maxFontSizeMultiplier={1}
              style={[KT.forbidden, { color: K.listInk, textAlign: 'center' }]}
            >
              {upperTr(w)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
// One line, shrinking no further than 22 (the word) and 16 (the forbidden words).
const MIN_WORD = KINSHI_MIN_TYPE.word / (KT.word.fontSize ?? KINSHI_MIN_TYPE.word);
const MIN_FORBIDDEN =
  KINSHI_MIN_TYPE.forbidden / (KT.forbidden.fontSize ?? KINSHI_MIN_TYPE.forbidden);

function Back({ radius, art }: { radius: number; art?: ImageSourcePropType }) {
  return (
    <Image
      source={art ?? kinshiArt.cardBack}
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      contentFit="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

// The deck's geometry for this screen's width (`theme/kinshi.ts` → `kinshiDeck`).
export function useKinshiDeck(): KinshiDeck {
  return kinshiDeck(useWindowDimensions().width);
}

// The 3D deck (`.d3`): the card tipped back (perspective 1100, rotateX 13°, rotateZ −1.2° from
// 50 % 60 %), six paper edges under it, two backs fanned behind, a blurred shadow beneath; the two
// buddies peek over its top edge from behind (`.peek`).
export function Deck({
  face,
  peek,
  children,
  reach,
  back,
}: {
  face: CardFace;
  peek: readonly [KinshiBuddy, KinshiBuddy];
  // Laid over the deck (the guesser's panel).
  children?: ReactNode;
  // How far down from the deck's top that reaches (its measured bottom), when it does.
  reach?: number;
  // Another game's card back (Signum's), for the fanned backs and the top card.
  back?: ImageSourcePropType;
}) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const shadowOff = useLabOff('golge');
  const d = useKinshiDeck();
  const r = d.card.radius;
  const fan = shadowParts(shadowOff, K.fanShadow, K.fanEdge, r);
  const edge = shadowParts(shadowOff, K.edgeOuter, K.edgeShadow, r);
  const top = shadowParts(shadowOff, K.cardOuter, K.cardEdge, r);
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
        height: kinshiDeckHeight(d, reach),
        alignSelf: 'center',
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Buddy
          buddy={peek[0]}
          height={d.peek.height}
          style={{ left: d.peek.inset, transform: [{ rotate: K.peek.leftTurn }] }}
        />
        <Buddy
          buddy={peek[1]}
          height={d.peek.height}
          style={{
            right: d.peek.inset,
            top: d.peek.rightDrop,
            transform: [{ rotate: K.peek.rightTurn }],
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          top: d.peek.above,
          left: 0,
          width: d.card.width,
          height: d.card.height,
          transformOrigin: `50% ${K.deck.originY * 100}%`,
          transform: [
            { perspective: K.deck.perspective },
            { rotateX: K.deck.rotateX },
            { rotateZ: K.deck.rotateZ },
          ],
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: `${K.deckShadow.inset * 100}%`,
            right: `${K.deckShadow.inset * 100}%`,
            bottom: -d.shadow.below,
            height: d.shadow.height,
            borderRadius: d.shadow.height,
            backgroundColor: K.deckShadow.color[scheme],
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
            <Back radius={r} art={back} />
          </View>
        ))}
        {[...d.edges].reverse().map((y, i) => (
          <View
            key={i}
            style={[
              box,
              {
                borderRadius: r,
                backgroundColor: K.edgeColors[(K.edges.length - 1 - i) % 2],
                boxShadow: edge.boxShadow,
                transform: [{ translateY: y }],
              },
            ]}
          >
            {edge.node}
          </View>
        ))}
        <View style={[box, { borderRadius: r, boxShadow: top.boxShadow }]}>
          {top.node}
          {face.kind === 'front' ? (
            <Pop key={face.key}>
              <View style={{ width: d.card.width, height: d.card.height }}>
                <Front card={face.card} d={d} />
              </View>
            </Pop>
          ) : face.kind === 'node' ? (
            <Pop key={face.key}>
              <View
                style={{
                  width: d.card.width,
                  height: d.card.height,
                  borderRadius: r,
                  overflow: 'hidden',
                }}
              >
                {face.node}
              </View>
            </Pop>
          ) : face.kind === 'back' ? (
            <Back radius={r} art={back} />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: r,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: d.list.side,
                },
              ]}
            >
              <Back radius={r} art={back} />
              {face.kind === 'loading' ? (
                <Loader />
              ) : (
                <Glass pad="pad">
                  <T v="fine" color={c.ink} center>
                    {face.message}
                  </T>
                </Glass>
              )}
            </View>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}

// The counters under the deck (`.stats`): Doğru (its icon in --signal), Pas, Yasak (--buzz).
export function Stats({ counts }: { counts: Record<TabuMark, number> }) {
  const { colors } = useTheme();
  const { c } = useKit();
  const items: { mark: TabuMark; icon: CapIconName; color: string; label: string }[] = [
    { mark: 'correct', icon: 'check', color: colors.signal, label: tr.games.statCorrect },
    { mark: 'pass', icon: 'forward', color: c.ink, label: tr.games.statPass },
    { mark: 'taboo', icon: 'block', color: colors.buzz, label: tr.games.statTaboo },
  ];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: K.statsGap }}>
      {items.map((it) => (
        <View
          key={it.mark}
          accessible
          accessibilityLabel={tr.kinshi.statLabel(it.label, counts[it.mark])}
          style={{
            height: KIT.size.chip,
            paddingHorizontal: KIT.size.chipPadX,
            borderRadius: KIT.size.chip / 2,
            backgroundColor: c.raisedChip,
            borderWidth: KIT.size.edge,
            borderColor: c.raisedEdge,
            flexDirection: 'row',
            alignItems: 'center',
            gap: STAT_GAP,
          }}
        >
          <CapIcon name={it.icon} color={it.color} size={KIT.size.iconSm} />
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[KIT_TYPE.chip, { color: c.ink, fontVariant: ['tabular-nums'] }]}
          >
            {counts[it.mark]}
          </Text>
        </View>
      ))}
    </View>
  );
}
const STAT_GAP = 6;

// The rival's one action (`.buzzer`): a 96 round bell in --buzz, a 6 ring of it at 18 %, its icon
// and "Yasak!".
export function Buzzer({
  onPress,
  loading,
  disabled,
}: {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const press = usePress();
  const shadowOff = useLabOff('golge');
  const shadow = shadowParts(shadowOff, K.buzzerShadow, undefined, K.buzzer.size / 2);
  const side = K.buzzer.size;
  return (
    <Pressable
      testID="kinshi-buzz"
      accessibilityRole="button"
      accessibilityLabel={tr.kinshi.buzz}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={{ alignSelf: 'center' }}
    >
      <Animated.View
        style={{
          width: side,
          height: side,
          borderRadius: side / 2,
          backgroundColor: colors.buzz,
          borderWidth: 0,
          outlineColor: K.buzzer.ringColor,
          outlineWidth: K.buzzer.ring,
          outlineStyle: 'solid',
          boxShadow: shadow.boxShadow,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          transform: [{ scale: press.scale }],
        }}
      >
        {shadow.node}
        {loading ? (
          <Loader kind="meet" size={KIT.size.icon} delay={0} label={null} />
        ) : (
          <CapIcon name="block" color={colors.onBuzz} size={KIT.size.icon} />
        )}
        <Text maxFontSizeMultiplier={1} style={[KT.buzz, { color: colors.onBuzz }]}>
          {tr.kinshi.buzz}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// A played card's row (`.res`): its word and its mark, a hairline between rows.
export function PlayedRow({ word, mark, first }: { word: string; mark: TabuMark; first: boolean }) {
  const { c } = useKit();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: K.row.gap,
        paddingVertical: K.row.padY,
        paddingHorizontal: K.row.padX,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.hair,
      }}
    >
      <Text maxFontSizeMultiplier={MAX_FONT} style={[KT.row, { color: c.ink, flexShrink: 1 }]}>
        {upperTr(word)}
      </Text>
      <MarkTag mark={mark} />
    </View>
  );
}
