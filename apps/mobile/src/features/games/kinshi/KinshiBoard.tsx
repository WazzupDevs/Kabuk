import type { TabuCard } from '@shared/tabu.ts';
import type { TabuMark, TabuTeam } from '@shared/tabuGame.ts';
import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, Round, T, Tag, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { tr } from '@/i18n/tr';
import { useNarrow } from '@/lib/useNarrow';
import { KIT } from '@/theme/auraKit';
import { KINSHI_FORBIDDEN, KINSHI_PLAY as P } from '@/theme/kinshiPlay';
import { useTheme } from '@/theme/ThemeProvider';

import { kinshiArt } from './kinshiArt';
import { useTeamTone } from './KinshiParts';

// The two screens the new interface boards draw for Kinshi (KinshiAnlatici, KinshiSonuc, 17 Kasım):
// the describer's turn and the end. Their parts are drawn here; the data, the mutations and the
// clock stay in KinshiGame.tsx.

const MAX_FONT = 1.3;
const MIN_FIT = 0.5;

// The bar (`.gt`): the close, the game's logo (not on a narrow screen), what is going on and the
// line under it, then the timer and the chat's round when there are any. The top buttons never
// scroll (CLAUDE.md → Ekran davranışı).
export function PlayBar({
  close,
  title,
  line,
  timer,
  onChat,
}: {
  close: { label: string; onPress: () => void; testID?: string };
  title: string;
  line: string;
  timer?: ReactNode;
  onChat: () => void;
}) {
  const { c } = useKit();
  const narrow = useNarrow();
  return (
    <View
      style={{
        marginTop: P.bar.top,
        // The page keeps the kit's side; the bar is a little wider.
        marginHorizontal: -(KIT.size.side - P.bar.side),
        flexDirection: 'row',
        alignItems: 'center',
        gap: P.bar.gap,
      }}
    >
      <Round icon="close" label={close.label} onPress={close.onPress} testID={close.testID} />
      {narrow ? null : (
        <Image
          source={kinshiArt.poster}
          style={{ width: P.bar.logoW, height: P.bar.logoH, borderRadius: P.bar.logoRadius }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={MIN_FIT}
          maxFontSizeMultiplier={MAX_FONT}
          style={[P.type.title, { color: c.ink }]}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={MIN_FIT}
          maxFontSizeMultiplier={MAX_FONT}
          style={[P.type.line, { color: c.muted }]}
        >
          {line}
        </Text>
      </View>
      {timer}
      <Round icon="chat" label={tr.kinshi.chat} onPress={onChat} />
    </View>
  );
}

// The timer (`.tmr`): the clock's icon and the time, the time in the danger ink when it runs low.
export function PlayTimer({ clock, label, late }: { clock: string; label: string; late: boolean }) {
  const { c } = useKit();
  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={label}
      style={{
        height: P.timer.height,
        paddingLeft: P.timer.padLeft,
        paddingRight: P.timer.padRight,
        borderRadius: P.timer.height / 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: P.timer.gap,
        backgroundColor: c.raisedChip,
        borderWidth: KIT.size.edge,
        borderColor: c.raisedEdge,
      }}
    >
      <CapIcon name="clock" color={late ? KIT.danger : c.ink} size={P.timer.icon} />
      <Text maxFontSizeMultiplier={1} style={[P.type.clock, { color: late ? KIT.danger : c.ink }]}>
        {clock}
      </Text>
    </View>
  );
}

// One team's score (`.sc span`): its colour's dot, its name and the number.
export function ScoreChip({ team, score }: { team: TabuTeam; score: number }) {
  const { c } = useKit();
  const tone = useTeamTone(team);
  return (
    <View
      accessible
      accessibilityLabel={tr.kinshi.teamScore(tr.kinshi.team[team], score)}
      style={{
        flex: 1,
        minHeight: P.score.height,
        borderRadius: P.score.height / 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: P.score.gap,
        backgroundColor: c.raisedChip,
        borderWidth: KIT.size.edge,
        borderColor: c.raisedEdge,
      }}
    >
      <View
        style={{
          width: P.score.dot,
          height: P.score.dot,
          borderRadius: P.score.dot / 2,
          backgroundColor: tone.color,
        }}
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={MIN_FIT}
        maxFontSizeMultiplier={MAX_FONT}
        style={[P.type.score, { color: c.ink, flexShrink: 1 }]}
      >
        {tr.kinshi.teamScore(tr.kinshi.teamShort[team], score)}
      </Text>
    </View>
  );
}

export function ScoreChips({ a, b }: { a: number; b: number }) {
  return (
    <View
      style={{ flexDirection: 'row', gap: P.score.between, marginTop: P.stage.top - P.bar.top }}
    >
      <ScoreChip team="a" score={a} />
      <ScoreChip team="b" score={b} />
    </View>
  );
}

// What the word's card shows: the card, or the card list still coming or failed.
export type WordFace =
  { kind: 'front'; card: TabuCard } | { kind: 'loading' } | { kind: 'error'; message: string };

// The word's card (`.wcard`): "Kelime", the word and the forbidden words under it. Only the
// describer's phone draws it (rule 3: the card list comes to the phones that may see it).
export function WordCard({ face }: { face: WordFace }) {
  const { c } = useKit();
  const { scheme } = useTheme();
  const tone = KINSHI_FORBIDDEN[scheme];
  return (
    <Glass
      style={{
        paddingTop: P.card.padTop,
        paddingBottom: P.card.padBottom,
        paddingHorizontal: P.card.padX,
        alignItems: 'center',
      }}
    >
      <Text maxFontSizeMultiplier={MAX_FONT} style={[P.type.kick, { color: c.muted }]}>
        {upperTr(tr.kinshi.wordKick)}
      </Text>
      {face.kind === 'front' ? (
        <>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={MIN_FIT}
            maxFontSizeMultiplier={1}
            style={[
              P.type.word,
              {
                color: c.ink,
                textAlign: 'center',
                marginTop: P.card.wordTop,
                marginBottom: P.card.wordBottom,
              },
            ]}
          >
            {upperTr(face.card.word)}
          </Text>
          <View style={{ alignSelf: 'stretch', gap: P.forbidden.gap }}>
            {face.card.forbidden.map((w, i) => (
              <View
                key={`${i}-${w}`}
                style={{
                  minHeight: P.forbidden.height,
                  borderRadius: P.forbidden.radius,
                  paddingHorizontal: P.card.padX / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: tone.bg,
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={MIN_FIT}
                  maxFontSizeMultiplier={1}
                  style={[P.type.forbidden, { color: tone.ink, textAlign: 'center' }]}
                >
                  {w}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={{ marginTop: P.card.wordBottom, alignItems: 'center' }}>
          {face.kind === 'loading' ? (
            <Loader />
          ) : (
            <T v="fine" color={c.ink} center>
              {face.message}
            </T>
          )}
        </View>
      )}
    </Glass>
  );
}

// The turn's counts (`.stat`): Doğru, Pas, Yasak as small tags.
export function CountTags({ counts }: { counts: Record<TabuMark, number> }) {
  const items: { mark: TabuMark; label: string }[] = [
    { mark: 'correct', label: tr.games.statCorrect },
    { mark: 'pass', label: tr.games.statPass },
    { mark: 'taboo', label: tr.games.statTaboo },
  ];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: P.stat.gap }}>
      {items.map((it) => (
        <Tag key={it.mark} label={tr.kinshi.statLabel(it.label, counts[it.mark])} />
      ))}
    </View>
  );
}

// The end's heading (`.rs-h`): who won and the score under it.
export function EndHeading({ title, line }: { title: string; line: string }) {
  const { c } = useKit();
  return (
    <View style={{ alignItems: 'center', gap: P.end.headGap }}>
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={MIN_FIT}
        maxFontSizeMultiplier={MAX_FONT}
        style={[P.type.heading, { color: c.ink, textAlign: 'center' }]}
      >
        {title}
      </Text>
      <Text maxFontSizeMultiplier={MAX_FONT} style={[P.type.headLine, { color: c.muted }]}>
        {line}
      </Text>
    </View>
  );
}

// "Öne çıkanlar" (`.sec`).
export function EndSection({ title }: { title: string }) {
  const { c } = useKit();
  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={MAX_FONT}
      style={[P.type.sec, { color: c.muted, marginTop: P.end.secTop }]}
    >
      {upperTr(title)}
    </Text>
  );
}

// A highlight's row (`.rr`): the face, the name and what earned it; a hairline over every row but
// the first.
export function EndRow({
  face,
  name,
  line,
  first,
}: {
  face: ReactNode;
  name: string;
  line: string;
  first: boolean;
}) {
  const { c } = useKit();
  return (
    <View
      style={{
        minHeight: P.end.row,
        flexDirection: 'row',
        alignItems: 'center',
        gap: P.end.rowGap,
      }}
    >
      {first ? null : (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: P.end.hairIn,
            right: 0,
            height: KIT.size.edge,
            backgroundColor: c.hair,
          }}
        />
      )}
      {face}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text maxFontSizeMultiplier={MAX_FONT} style={[P.type.rowName, { color: c.ink }]}>
          {name}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT} style={[P.type.rowLine, { color: c.muted }]}>
          {line}
        </Text>
      </View>
    </View>
  );
}
