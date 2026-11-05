import type { TabuCard } from '@shared/tabu.ts';
import type { TabuMark, TabuTeam } from '@shared/tabuGame.ts';
import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Chip, Glass, T, Tag, usePress, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { shadowParts } from '@/components/NativeShadow';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { TEAM_TONES, type Team } from '@/theme/gameColors';
import {
  KINSHI as K,
  KINSHI_MIN_TYPE,
  KINSHI_TYPE as KT,
  kinshiBand,
  kinshiDeck,
  kinshiScorePill,
  type KinshiDeck,
} from '@/theme/kinshi';
import { kinshiWordLayout } from '@/theme/kinshiWord';
import { useTheme } from '@/theme/ThemeProvider';

import { CardBack, ChatRound, GameTopBar, Pop, Deck as RisoDeck } from '../riso/RisoParts';
import { type KinshiBuddy, kinshiArt } from './kinshiArt';

// The card games' shared parts (riso/RisoParts.tsx), as Kinshi's screens use them.
export { Buddy, Face, type Faces, FaceStack, nameOf, Pop, TimeStrip } from '../riso/RisoParts';

const MAX_FONT = 1.3;

// Mor ('a') and Pembe ('b') in the theme's colours.
export function teamKey(team: TabuTeam): Team {
  return team === 'a' ? 'purple' : 'pink';
}

export function useTeamTone(team: TabuTeam) {
  const { scheme } = useTheme();
  return TEAM_TONES[scheme][teamKey(team)];
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
    <GameTopBar
      close={close}
      middle={pill}
      under={!inline}
      right={<ChatRound onPress={onChat} />}
    />
  );
}

// A space in the score pill: the canvas's, closing to `least` when the bar is short of room.
function PillSpace({ size, least }: { size: number; least: number }) {
  return <View style={{ width: size, minWidth: least, flexShrink: 1 }} />;
}

// What lies on the deck's top: the card's front with its words, its back, or the card list still
// coming (Loader) or failed (its words).
export type CardFace =
  | { kind: 'front'; card: TabuCard; key: string }
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

// The deck's geometry for this screen's width (`theme/kinshi.ts` → `kinshiDeck`).
export function useKinshiDeck(): KinshiDeck {
  return kinshiDeck(useWindowDimensions().width);
}

// Kinshi's deck (the card games' shared `Deck`, riso/RisoParts.tsx) with its face on top: the
// card's front with its words, its back, or the card list still coming or failed.
export function Deck({
  face,
  peek,
  children,
  reach,
}: {
  face: CardFace;
  peek: readonly [KinshiBuddy, KinshiBuddy];
  // Laid over the deck (the guesser's panel).
  children?: ReactNode;
  // How far down from the deck's top that reaches (its measured bottom), when it does.
  reach?: number;
}) {
  const { c } = useKit();
  const d = useKinshiDeck();
  const r = d.card.radius;
  const top =
    face.kind === 'front' ? (
      <Pop key={face.key}>
        <View style={{ width: d.card.width, height: d.card.height }}>
          <Front card={face.card} d={d} />
        </View>
      </Pop>
    ) : face.kind === 'back' ? null : (
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
        <CardBack source={kinshiArt.cardBack} radius={r} />
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
    );
  return (
    <RisoDeck back={kinshiArt.cardBack} top={top} peek={peek} reach={reach}>
      {children}
    </RisoDeck>
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
