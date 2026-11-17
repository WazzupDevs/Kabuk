import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Round, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { Tap } from '@/motion/Tap';
import { KIT } from '@/theme/auraKit';
import { KIBRIT_BOARD as B, KIBRIT_BOARD_COLORS, KIBRIT_BOARD_TYPE as BT } from '@/theme/kibrit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { Face, type Faces, nameOf, type StageClock, useStageClock } from '../riso/RisoParts';
import { kibritArt } from './kibritArt';

// Kibrit's two yeni arayüz boards: KibritOy (gizli oy) and KibritSonuc (oyun sonu). Their head, the
// paper card, the chip grid and the night's rows. Only this game draws them (the shared riso parts
// stay as the other games have them).

export type BarClose = { label: string; onPress: () => void; testID: string };

// The head (`.gt`): the close, the game's poster, the title over its line, and at the right what
// the page puts there (the timer, the chat). It sits 16 from the sides, so it steps 4 out of the
// page's 20.
export function KibritHead({
  close,
  title,
  line,
  right,
}: {
  close: BarClose;
  title: string;
  line?: string;
  right?: ReactNode;
}) {
  const H = B.head;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: H.gap,
        marginTop: H.top,
        marginHorizontal: H.side - KIT.size.side,
      }}
    >
      <Round icon="close" label={close.label} onPress={close.onPress} testID={close.testID} />
      <Image
        source={kibritArt.poster}
        style={{ width: H.logoW, height: H.logoH, borderRadius: H.logoRadius }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="h3" ink fit lines={1} accessibilityRole="header" style={BT.headTitle}>
          {title}
        </T>
        {line ? (
          <T v="fine" fit lines={1} style={BT.headSub}>
            {line}
          </T>
        ) : null}
      </View>
      {right}
    </View>
  );
}

// The timer (`.tmr`): a raised pill with the clock and the time, in --buzz in the last seconds.
// The seconds are read here alone, so the page is not drawn again every second.
export function TimerPill({ clock }: { clock: StageClock }) {
  const { colors, scheme } = useTheme();
  const { c } = useKit();
  const live = useStageClock({ ...clock, bare: false });
  const H = B.head;
  const tone = live.late ? colors.buzz : c.ink;
  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={live.label}
      style={{
        height: H.pillHeight,
        borderRadius: H.pillHeight / 2,
        paddingLeft: H.pillPadLeft,
        paddingRight: H.pillPadRight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: H.pillGap,
        backgroundColor: colors.surface,
        boxShadow:
          scheme === 'dark'
            ? `inset 0px 0px 0px 1px ${KIBRIT_BOARD_COLORS.dark.paperRing}`
            : c.raisedShadow,
      }}
    >
      <CapIcon name="clock" size={H.pillIcon} color={tone} />
      <Text maxFontSizeMultiplier={1} style={[BT.timer, { color: tone }]}>
        {live.text}
      </Text>
    </View>
  );
}

// The drawn paper (`.card.paper`): the cream card, turned a little, with "Çekilen kâğıt · Yazan:
// gizli", the question and its note. The author shows nowhere (K-86).
export function PaperCard({ text, note }: { text: string; note: string }) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const P = KIBRIT_BOARD_COLORS[scheme];
  const K = B.card;
  return (
    <View
      style={{
        borderRadius: K.radius,
        padding: K.pad,
        backgroundColor: P.paper,
        transform: [{ rotate: K.turn }],
        boxShadow: scheme === 'dark' ? `inset 0px 0px 0px 1px ${P.paperRing}` : c.glassShadow,
      }}
    >
      <Text maxFontSizeMultiplier={1.3} style={[BT.kick, { color: P.soft }]}>
        {upperTr(`${tr.kibrit.drawn} · ${tr.kibrit.author}`)}
      </Text>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[BT.question, { color: P.ink, marginTop: K.questionTop }]}
      >
        {text}
      </Text>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[BT.questionNote, { color: P.soft, marginTop: K.noteTop }]}
      >
        {note}
      </Text>
    </View>
  );
}

// The chip grid (`.pg`): four columns of faces over their names; the chosen one on the surface
// with a 2 ring inside. `onChoose` unset: the grid only shows (a watcher, a vote in flight).
export function VoteChips({
  faces,
  seats,
  chosen,
  onChoose,
}: {
  faces: Faces;
  seats: string[];
  chosen: string | null;
  onChoose?: (sid: string) => void;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const G = B.grid;
  const chip = (width - 2 * KIT.size.side - (G.columns - 1) * G.gapX) / G.columns;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: G.gapX, rowGap: G.gapY }}>
      {seats.map((sid) => {
        const on = sid === chosen;
        const name = nameOf(faces, sid);
        return (
          <View key={sid} style={{ width: chip }}>
            <Tap
              testID={`kibrit-vote-${sid}`}
              accessibilityLabel={tr.kibrit.voteFor(name)}
              accessibilityState={{ selected: on }}
              disabled={!onChoose}
              feel="selection"
              onPress={() => onChoose?.(sid)}
              style={{
                alignItems: 'center',
                gap: G.gap,
                paddingVertical: G.padY,
                paddingHorizontal: G.padX,
                borderRadius: G.radius,
                backgroundColor: on ? colors.surface : undefined,
                boxShadow: on ? `inset 0px 0px 0px ${G.ring}px ${colors.text}` : undefined,
              }}
            >
              <Face faces={faces} sid={sid} size={G.face} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                maxFontSizeMultiplier={1.3}
                style={[BT.chipName, { color: colors.text, maxWidth: '100%' }]}
              >
                {name}
              </Text>
            </Tap>
          </View>
        );
      })}
    </View>
  );
}

// "4/8 kişi oy verdi" under the grid (`.hint`).
export function BoardHint({ children }: { children: string }) {
  return (
    <T v="fine" center style={BT.hint}>
      {children}
    </T>
  );
}

// The result page's heading (`.rs-h`): the night's title over its note.
export function EndHeading({ title, note }: { title: string; note: string }) {
  const { c } = useKit();
  return (
    <View style={{ alignItems: 'center', gap: B.end.headGap }}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={1.3}
        style={[BT.heading, { color: c.ink, textAlign: 'center' }]}
      >
        {title}
      </Text>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[BT.headingNote, { color: c.muted, textAlign: 'center' }]}
      >
        {note}
      </Text>
    </View>
  );
}

// A night's paper (`.rr`): its question over who got the most (and how many, from five players);
// the hairline between rows. No one's vote shows (K-86).
export function PastRow({
  first,
  question,
  who,
}: {
  first: boolean;
  question: string;
  who: string;
}) {
  const { c } = useKit();
  const E = B.end;
  return (
    <View style={{ minHeight: E.rowMin, justifyContent: 'center', paddingVertical: SPACING[2] }}>
      {first ? null : (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: E.hairIn,
            right: 0,
            height: KIT.size.hair,
            backgroundColor: c.hair,
          }}
        />
      )}
      <Text maxFontSizeMultiplier={1.3} style={[BT.rowQuestion, { color: c.ink }]}>
        {question}
      </Text>
      <Text maxFontSizeMultiplier={1.3} style={[BT.rowWho, { color: c.muted }]}>
        {who}
      </Text>
    </View>
  );
}
