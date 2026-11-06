import { formatTrNumber, type KauphollChip, type KauphollSlice } from '@shared/kaupholl.ts';
import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, T, Tag, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { KAUPHOLL as K, KAUPHOLL_TYPE as KT } from '@/theme/kaupholl';
import { RISO as R, RISO_TYPE } from '@/theme/riso';
import { useTheme } from '@/theme/ThemeProvider';

import { Face, type Faces, nameOf, useRisoDeck } from '../riso/RisoParts';
import type { RisoTimer } from '../riso/risoArt';
import { kauphollArt } from './kauphollArt';
import {
  authorsOf,
  type BoardRow,
  coinsDrawn,
  type CoinsDrawn,
  type SliceMark,
  type Stake,
} from './kauphollView';

// Kaupholl's parts (Aura v89 and the §6 panels of docs/decisions/kaupholl.md): the question strip
// and the card's face, the guess panel and the chips, the board with its slices and coins, the
// wallet, the answer, the score table, the winners, the connection error and the table's notice.

const MAX_FONT = 1.3;

// The text size the screen draws at, up to the canvas's 1.3×.
export function useFontScale(): number {
  return Math.min(MAX_FONT, Math.max(1, useWindowDimensions().fontScale));
}

// ------------------------------------------------------------------ the question

// The k-soru paper as a texture (`background: url(k-soru) 50% 24% / 130% auto`).
function PaperTexture() {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const width = (box?.width ?? 0) * K.qc.textureScale;
  const height = width * K.paperRatio;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: K.qc.radius, overflow: 'hidden' }]}
      onLayout={(e) =>
        setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
    >
      {box ? (
        <Image
          source={kauphollArt.question}
          style={{
            position: 'absolute',
            width,
            height,
            left: (box.width - width) / 2,
            top: (box.height - height) * K.qc.textureY,
          }}
          contentFit="fill"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

// The question over the guess (`.qc`): "SORU 3/5" and the question on the paper. `tight` (the
// guess under the keyboard at 320 or above 1× text, `.qc.q13`): no eyebrow, 10/14 in.
export function QuestionStrip({
  eyebrow,
  question,
  tight,
}: {
  eyebrow: string;
  question: string;
  tight?: boolean;
}) {
  const pad = tight ? K.qc.tight : K.qc;
  return (
    <View style={{ borderRadius: K.qc.radius, boxShadow: K.qc.shadow }}>
      <View
        style={{
          paddingVertical: pad.padY,
          paddingHorizontal: pad.padX,
          gap: K.qc.gap,
          borderRadius: K.qc.radius,
        }}
      >
        <PaperTexture />
        {tight ? null : (
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[KT.eyebrow, { color: K.ink, opacity: K.qc.eyebrowFade }]}
          >
            {upperTr(eyebrow)}
          </Text>
        )}
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={MAX_FONT}
          style={[KT.question, { color: K.ink }]}
        >
          {question}
        </Text>
      </View>
    </View>
  );
}

// The open card's face (`.card.soru`): the k-soru picture (its yellow band empty), the question on
// its paper and "Cevap: <birim>" in its chip, scaled with the deck. A long question shrinks.
export function CardFace({ question, unit }: { question: string; unit: string }) {
  const d = useRisoDeck();
  const z = (n: number) => n * d.scale;
  const F = K.cardFace;
  return (
    <View
      style={StyleSheet.absoluteFill}
      accessible
      accessibilityRole="image"
      accessibilityLabel={tr.kaupholl.cardOpen(question, unit)}
    >
      <Image
        source={kauphollArt.question}
        style={[StyleSheet.absoluteFill, { borderRadius: d.card.radius }]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View
        style={{
          position: 'absolute',
          left: z(F.question.side),
          right: z(F.question.side),
          top: z(F.question.top),
          height: z(F.question.height),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={6}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
          style={[KT.cardQuestion, { color: K.ink, textAlign: 'center' }]}
        >
          {question}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: z(F.unit.top),
          alignItems: 'center',
        }}
      >
        <View
          style={{
            height: z(F.unit.height),
            paddingHorizontal: z(F.unit.padX),
            borderRadius: z(F.unit.height) / 2,
            backgroundColor: F.unit.fill,
            justifyContent: 'center',
          }}
        >
          <Text maxFontSizeMultiplier={1} style={[KT.cardUnit, { color: K.white }]}>
            {tr.kaupholl.cardUnit(unit)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// The compact strip (`.strip.one`): a smaller capsule, the time and the title on one line.
export function OneLineStrip({
  stage,
  clock,
  clockLabel,
  late,
  title,
}: {
  stage: RisoTimer;
  clock: string;
  clockLabel: string;
  late: boolean;
  title: string;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.oneLine.gap }}>
      <Image
        source={kauphollArt.timer[stage]}
        style={{ width: K.oneLine.capsule.width, height: K.oneLine.capsule.height }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
      <Text
        accessibilityRole="timer"
        accessibilityLabel={clockLabel}
        maxFontSizeMultiplier={1}
        style={[RISO_TYPE.clock, { color: late ? colors.buzz : c.ink }]}
      >
        {clock}
      </Text>
      <View style={{ flexShrink: 1 }}>
        <T v="h3">{title}</T>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ the guess

// The guess row (`.ans`): the field (what the screen passes) and the question's unit.
export function GuessRow({
  field,
  unit,
  narrow,
}: {
  field: ReactNode;
  unit: string;
  narrow?: boolean;
}) {
  const { c } = useKit();
  const A = narrow ? K.ansNarrow : K.ans;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.ans.gap }}>
      <View style={{ flex: 1 }}>{field}</View>
      <View
        style={{
          height: A.height,
          paddingHorizontal: A.padX,
          borderRadius: K.ans.radius,
          backgroundColor: c.raised,
          borderWidth: KIT.size.edge,
          borderColor: c.raisedEdge,
          justifyContent: 'center',
        }}
      >
        <Text maxFontSizeMultiplier={MAX_FONT} style={[KT.unit, { color: c.ink }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

// The field's box: 64 high (56 at 320), 16 round, its edge in --accent while it takes a number.
// `onWidth` tells the text's room, for fitting it.
export function FieldBox({
  off,
  narrow,
  onWidth,
  children,
}: {
  off: boolean;
  narrow?: boolean;
  onWidth?: (width: number) => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  const A = narrow ? K.ansNarrow : K.ans;
  return (
    <View
      onLayout={(e) => onWidth?.(e.nativeEvent.layout.width - 2 * (K.ans.edge + A.padX))}
      style={{
        height: A.height,
        borderRadius: K.ans.radius,
        borderWidth: K.ans.edge,
        borderColor: off ? c.hair : colors.accent,
        backgroundColor: c.field,
        paddingHorizontal: A.padX,
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

// Senin tahminin (`.gpanel`): the eyebrow, the number (shrinking when it does not fit, never "…"),
// the unit; "Kesinleşti" at its top right once locked.
export function GuessPanel({
  value,
  unit,
  locked,
}: {
  value: string;
  unit: string;
  locked: boolean;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  return (
    <Glass
      radius={K.panel.radius}
      style={{
        paddingTop: K.panel.padTop,
        paddingHorizontal: K.panel.padX,
        paddingBottom: K.panel.padBottom,
        alignItems: 'center',
      }}
    >
      {locked ? (
        <View style={{ position: 'absolute', top: K.panel.tag, right: K.panel.tag }}>
          <Tag label={tr.kaupholl.lockedTag} colors={{ bg: colors.signal, fg: colors.onSignal }} />
        </View>
      ) : null}
      <T v="eyebrow">{upperTr(tr.kaupholl.yourGuess)}</T>
      <Text
        testID="kaupholl-my-guess"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        maxFontSizeMultiplier={MAX_FONT}
        style={[KT.hero, { color: c.ink, alignSelf: 'stretch', textAlign: 'center' }]}
      >
        {value}
      </Text>
      <T v="fine">{unit}</T>
    </Glass>
  );
}

// A chip's mark: written a --signal ring with a tick, locked a --signal disc with one.
function ChipMark({ chip, side, tick }: { chip: KauphollChip; side: number; tick: number }) {
  const { colors } = useTheme();
  const { c } = useKit();
  if (chip === 'none') {
    return (
      <View
        style={{
          width: side,
          height: side,
          borderRadius: side / 2,
          borderWidth: K.legend.noneRing,
          borderColor: c.muted,
          opacity: K.legend.noneFade,
        }}
      />
    );
  }
  const locked = chip === 'locked';
  return (
    <View
      style={{
        width: side,
        height: side,
        borderRadius: side / 2,
        borderWidth: locked ? 0 : K.chips.ring,
        borderColor: colors.signal,
        backgroundColor: locked ? colors.signal : undefined,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CapIcon name="check" color={locked ? colors.onSignal : colors.signal} size={tick} />
    </View>
  );
}

const chipWord = (chip: KauphollChip) =>
  chip === 'locked'
    ? tr.kaupholl.chipLocked
    : chip === 'written'
      ? tr.kaupholl.chipWritten
      : tr.kaupholl.chipNone;

// Who has written (`.done-l`): each player's chip, never the number; and the legend (`.leg`).
export function ChipsRow({
  faces,
  sids,
  chips,
}: {
  faces: Faces;
  sids: readonly string[];
  chips: Readonly<Record<string, KauphollChip>>;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  return (
    <View style={{ alignItems: 'center', gap: R.gap }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: K.chips.gap,
        }}
      >
        {sids.map((sid) => {
          const chip = chips[sid] ?? 'none';
          return (
            <View
              key={sid}
              accessible
              accessibilityLabel={tr.kaupholl.chipLabel(nameOf(faces, sid), chipWord(chip))}
              style={{
                height: R.person.height,
                paddingLeft: R.person.padLeft,
                paddingRight: R.person.padRight,
                borderRadius: R.person.height / 2,
                backgroundColor: c.raised,
                borderWidth: KIT.size.edge,
                borderColor: sid === faces.me ? colors.accent : c.raisedEdge,
                flexDirection: 'row',
                alignItems: 'center',
                gap: R.person.gap,
                opacity: chip === 'none' ? K.chips.none : 1,
              }}
            >
              <Face faces={faces} sid={sid} size={R.person.face} />
              <T v="fine" strong ink>
                {nameOf(faces, sid)}
              </T>
              {chip === 'none' ? null : (
                <ChipMark
                  chip={chip}
                  side={K.chips.mark}
                  tick={chip === 'locked' ? K.chips.tickLocked : K.chips.tick}
                />
              )}
            </View>
          );
        })}
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: K.legend.gap,
        }}
      >
        {(['none', 'written', 'locked'] as const).map((chip) => (
          <View
            key={chip}
            style={{ flexDirection: 'row', alignItems: 'center', gap: K.legend.dotGap }}
          >
            <ChipMark chip={chip} side={K.legend.dot} tick={K.legend.tick} />
            <Text maxFontSizeMultiplier={MAX_FONT} style={[KT.legend, { color: c.muted }]}>
              {chipWord(chip)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// "Herkes bekleniyor" (`.wait`): a glass pill with the spinner.
export function WaitPill() {
  const { c } = useKit();
  return (
    <Glass
      radius={K.wait.height / 2}
      style={{
        minHeight: K.wait.height,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: K.wait.gap,
      }}
    >
      <Loader size={K.wait.spinner} delay={0} label={tr.kaupholl.waiting} />
      <Text maxFontSizeMultiplier={MAX_FONT} style={[KT.wait, { color: c.ink }]}>
        {tr.kaupholl.waiting}
      </Text>
    </Glass>
  );
}

// ------------------------------------------------------------------ the board

export type BoardLook = {
  // Tahta sıkı (seven slices or larger text) and the 320 panel's measures.
  compact: boolean;
  narrow: boolean;
  // Yatırdım, or the time is up: the coins stay.
  locked: boolean;
};

// The board (`.tahta`): the baize, the slices in a column; it scrolls inside when it does not fit
// (KaupholTahta320), its foot fading then. `dim` under the connection error.
export function Board({
  look,
  dim,
  loading,
  children,
  testID,
}: {
  look: BoardLook;
  dim?: boolean;
  loading?: boolean;
  children: ReactNode;
  testID?: string;
}) {
  const B = K.board;
  const pad = look.narrow ? B.narrow : look.compact ? B.compact : B;
  const [box, setBox] = useState(0);
  const [content, setContent] = useState(0);
  const scrolls = content > box + 1;
  return (
    <View
      testID={testID}
      style={{
        flexShrink: 1,
        borderRadius: B.radius,
        boxShadow: scrolls ? undefined : B.shadow,
        opacity: dim ? B.dim : loading ? B.loading : 1,
      }}
    >
      <View style={{ borderRadius: B.radius, overflow: 'hidden', flexShrink: 1 }}>
        <Image
          source={kauphollArt.board}
          style={StyleSheet.absoluteFill}
          contentFit="fill"
          accessibilityIgnoresInvertColors
        />
        <ScrollView
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => setBox(e.nativeEvent.layout.height)}
          onContentSizeChange={(_, h) => setContent(h)}
          contentContainerStyle={{
            paddingVertical: pad.padY,
            paddingHorizontal: pad.padX,
            gap: B.gap,
          }}
        >
          {children}
        </ScrollView>
        {scrolls ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: B.fade.height,
              ...gradientStyle(`linear-gradient(180deg, transparent, ${B.fade.color})`),
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

// Faces overlapping on the board (`.ostk`), ringed in the ink.
function BoardFaces({
  faces,
  sids,
  size,
}: {
  faces: Faces;
  sids: readonly string[];
  size: number;
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {sids.map((sid, i) => (
        <View
          key={sid}
          style={{
            marginLeft: i === 0 ? 0 : -K.faceOverlap,
            borderRadius: size,
            borderWidth: K.faceRing,
            borderColor: K.ink,
            margin: -K.faceRing,
          }}
        >
          <Face faces={faces} sid={sid} size={size} />
        </View>
      ))}
    </View>
  );
}

// A "×n" badge in the ink (`.bet b`, `.bstack b`).
function CountBadge({ n, stack }: { n: number; stack?: boolean }) {
  const b = stack ? K.stack.badge : K.bet.badge;
  return (
    <View
      style={{
        backgroundColor: K.ink,
        borderRadius: b.radius,
        paddingVertical: b.padY,
        paddingHorizontal: b.padX,
      }}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT}
        style={[stack ? KT.stackCount : KT.count, { color: K.white }]}
      >
        {tr.kaupholl.times(n)}
      </Text>
    </View>
  );
}

// The coins on a slice: each person's coin with their face (and "×2"), or the stack.
function Coins({
  faces,
  drawn,
  compact,
  ghost,
}: {
  faces: Faces;
  drawn: CoinsDrawn;
  compact: boolean;
  // The first coin is the one about to land (KaupholJetonKoy): half drawn.
  ghost: boolean;
}) {
  const bet = compact ? K.bet.compact : K.bet;
  if (drawn.kind === 'stack') {
    return (
      <View
        accessible
        accessibilityLabel={tr.kaupholl.stack(drawn.total, drawn.sids.length)}
        style={{
          height: K.stack.height,
          flexDirection: 'row',
          alignItems: 'center',
          gap: K.stack.gap,
        }}
      >
        <Image
          source={kauphollArt.coin}
          style={{ width: K.stack.coin, height: K.stack.coin }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <CountBadge n={drawn.total} stack />
        <BoardFaces faces={faces} sids={drawn.sids} size={K.face} />
      </View>
    );
  }
  return (
    <>
      {drawn.stakes.map((s: Stake, i) => (
        <View
          key={ghost && i === 0 ? `${s.sid}-ghost` : s.sid}
          accessible={!(ghost && i === 0)}
          importantForAccessibility={ghost && i === 0 ? 'no-hide-descendants' : 'auto'}
          accessibilityLabel={tr.kaupholl.stake(nameOf(faces, s.sid), s.n)}
          style={{
            width: bet.width,
            height: bet.height,
            opacity: ghost && i === 0 ? K.bet.ghost : 1,
          }}
        >
          <Image
            source={kauphollArt.coin}
            style={{
              position: 'absolute',
              left: 0,
              top: bet.coinTop,
              width: bet.coin,
              height: bet.coin,
            }}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <View
            style={{
              position: 'absolute',
              right: -K.bet.faceOut,
              top: -K.bet.faceOut,
              borderRadius: K.face,
              borderWidth: K.faceRing,
              borderColor: K.ink,
            }}
          >
            <Face faces={faces} sid={s.sid} size={K.face} />
          </View>
          {s.n > 1 ? (
            <View
              style={{ position: 'absolute', left: -K.bet.badge.out, bottom: -K.bet.badge.below }}
            >
              <CountBadge n={s.n} />
            </View>
          ) : null}
        </View>
      ))}
    </>
  );
}

// Who wrote a slice (`.who`): one name, two names, or "n kişi", after their faces.
function Who({ faces, slice }: { faces: Faces; slice: KauphollSlice }) {
  const a = authorsOf(slice);
  if (a.kind === 'none') {
    return (
      <Text maxFontSizeMultiplier={MAX_FONT} style={[KT.who, { color: K.slot.whoInk }]}>
        {tr.kaupholl.smallerNote}
      </Text>
    );
  }
  const sids = a.kind === 'one' ? [a.sid] : a.sids;
  const words =
    a.kind === 'one'
      ? nameOf(faces, a.sid)
      : a.kind === 'two'
        ? tr.kaupholl.twoNames(nameOf(faces, a.sids[0]), nameOf(faces, a.sids[1]))
        : tr.kaupholl.people(a.sids.length);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: K.slot.whoGap }}>
      <BoardFaces faces={faces} sids={sids} size={K.face} />
      <Text
        maxFontSizeMultiplier={MAX_FONT}
        style={[KT.who, { color: K.slot.whoInk, flexShrink: 1 }]}
      >
        {words}
      </Text>
    </View>
  );
}

// A slice (`.slot`): its odds' disc, the guess and who wrote it, the coins. The person's coins
// make its edge white and dashed (`mine`), their own guess 70 % white (`mineGuess`); the winner
// --signal with "Kazandı", those over the answer at 45 %. Under the finger (`.slot.press`, from
// `onPressState`) it is 98 % with a solid --accent edge and a touch disc; `ghost` is the person
// whose coin is about to land, drawn at half before the others.
export function Slice({
  faces,
  slice,
  mark,
  stakes,
  look,
  mine,
  mineGuess,
  tag,
  onPress,
  onPressState,
  pressed,
  ghost,
  disabled,
}: {
  faces: Faces;
  slice: KauphollSlice;
  mark: SliceMark;
  stakes: Stake[];
  look: BoardLook;
  mine: boolean;
  mineGuess: boolean;
  // A tag over its top right ("Kesinleşti", "Kazandı").
  tag?: string;
  onPress?: () => void;
  onPressState?: (down: boolean) => void;
  pressed?: boolean;
  ghost?: string;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const fs = useFontScale();
  const S = K.slot;
  const box = look.compact ? S.compact : S;
  const odds = Math.round((look.compact ? S.oddsCompact : S.odds) * fs);
  const bet = look.compact ? K.bet.compact : K.bet;
  const room = look.narrow
    ? K.bets.maxWidthNarrow
    : look.compact
      ? K.bets.maxWidthCompact
      : K.bets.maxWidth;
  // The coin about to land only when it still sits beside the others; otherwise the stack shows.
  const withGhost = ghost
    ? coinsDrawn([{ sid: ghost, n: 1 }, ...stakes], room, bet.width, K.bets.gap)
    : null;
  const ghosted = withGhost?.kind === 'each';
  const drawn = ghosted ? withGhost : coinsDrawn(stakes, room, bet.width, K.bets.gap);
  const win = mark === 'win';
  const smaller = slice.value === null;
  const authors = authorsOf(slice);
  const who =
    authors.kind === 'none'
      ? tr.kaupholl.smallerNote
      : (authors.kind === 'one' ? [authors.sid] : authors.sids)
          .map((s) => nameOf(faces, s))
          .join(', ');
  const guess = smaller ? tr.kaupholl.smaller : formatTrNumber(slice.value ?? 0);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => onPressState?.(true)}
      onPressOut={() => onPressState?.(false)}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { disabled: !!disabled } : undefined}
      accessibilityLabel={tr.kaupholl.sliceLabel(guess, smaller ? '' : who, slice.odds)}
      testID={`kaupholl-slot-${slice.pos}`}
      style={{
        minHeight: box.minHeight,
        borderRadius: S.radius,
        paddingVertical: box.padY,
        paddingLeft: box.padLeft,
        paddingRight: box.padRight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: box.gap,
        backgroundColor: win ? S.winFill : look.locked ? S.lockedFill : S.fill,
        borderWidth: S.edge,
        borderStyle: win || pressed || (!mine && !mineGuess) ? 'solid' : 'dashed',
        borderColor: win
          ? colors.signal
          : pressed
            ? colors.accent
            : mine
              ? S.mine
              : mineGuess
                ? S.mineGuess
                : 'transparent',
        boxShadow: win ? S.winHalo : undefined,
        opacity: mark === 'over' ? S.over : 1,
        transform: pressed ? [{ scale: S.pressScale }] : undefined,
      }}
    >
      {pressed ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${S.touch.at * 100}%`,
            top: '50%',
            width: S.touch.side,
            height: S.touch.side,
            marginLeft: -S.touch.side / 2,
            marginTop: -S.touch.side / 2,
            borderRadius: S.touch.side / 2,
            backgroundColor: S.touch.fill,
            boxShadow: `0px 0px 0px ${S.touch.ring}px ${S.touch.ringFill}`,
            zIndex: 3,
          }}
        />
      ) : null}
      <View
        style={{
          width: odds,
          height: odds,
          borderRadius: odds / 2,
          backgroundColor: win ? colors.signal : K.yellow,
          borderWidth: S.oddsRing,
          borderColor: K.ink,
          alignItems: 'center',
          justifyContent: 'center',
          filter: look.locked && !mine && !win ? [...S.oddsLocked] : undefined,
        }}
      >
        <Text
          maxFontSizeMultiplier={MAX_FONT}
          style={[look.compact ? KT.oddsCompact : KT.odds, { color: K.ink }]}
        >
          {tr.kaupholl.times(slice.odds)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: S.lineGap }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          maxFontSizeMultiplier={MAX_FONT}
          style={[
            smaller ? KT.smaller : look.compact || look.narrow ? KT.guessCompact : KT.guess,
            { color: K.white },
          ]}
        >
          {guess}
        </Text>
        <Who faces={faces} slice={slice} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          gap: K.bets.gap,
          maxWidth: room,
        }}
      >
        <Coins faces={faces} drawn={drawn} compact={look.compact} ghost={ghosted} />
      </View>
      {tag ? (
        <View style={{ position: 'absolute', right: S.tagRight, top: -S.tagLift }}>
          <Tag label={tag} colors={{ bg: colors.signal, fg: colors.onSignal }} />
        </View>
      ) : null}
    </Pressable>
  );
}

// The answer's line across the board after the winning slice (`.aline`): "CEVAP 4.380" between
// dashed yellow lines.
export function AnswerLine({ value }: { value: string }) {
  const L = K.line;
  const dash = (
    <View style={{ flex: 1, height: L.height }}>
      <Svg width="100%" height={L.height}>
        <Line
          x1="0"
          y1={L.height / 2}
          x2="100%"
          y2={L.height / 2}
          stroke={K.yellow}
          strokeWidth={L.height}
          strokeDasharray={L.dash}
        />
      </Svg>
    </View>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: L.gap,
        marginVertical: L.marginY,
        marginHorizontal: L.marginX,
      }}
    >
      {dash}
      <Text maxFontSizeMultiplier={MAX_FONT} style={[KT.line, { color: K.yellow }]}>
        {`${upperTr(tr.kaupholl.answer)} ${value}`}
      </Text>
      {dash}
    </View>
  );
}

// The board's rows as drawn: the slices with their coins, the answer's line.
export function BoardRows({
  faces,
  rows,
  stakesOf,
  look,
  mineOf,
  myGuessPos,
  tagOf,
  onTap,
  press,
  disabled,
  answerText,
}: {
  faces: Faces;
  rows: BoardRow[];
  stakesOf: (pos: number) => Stake[];
  look: BoardLook;
  mineOf: (pos: number) => boolean;
  myGuessPos: number | null;
  tagOf: (pos: number, mark: SliceMark) => string | undefined;
  onTap?: (pos: number) => void;
  // The slice under the finger and the coin about to land on it (KaupholJetonKoy).
  press?: { pos: number | null; ghost: string | undefined; onChange: (pos: number | null) => void };
  disabled?: boolean;
  answerText: string;
}) {
  return (
    <>
      {rows.map((row, i) =>
        row.kind === 'line' ? (
          <AnswerLine key={`line-${i}`} value={answerText} />
        ) : (
          <Slice
            key={row.slice.pos}
            faces={faces}
            slice={row.slice}
            mark={row.mark}
            stakes={stakesOf(row.slice.pos)}
            look={look}
            mine={mineOf(row.slice.pos)}
            mineGuess={row.slice.pos === myGuessPos && !mineOf(row.slice.pos)}
            tag={tagOf(row.slice.pos, row.mark)}
            onPress={onTap ? () => onTap(row.slice.pos) : undefined}
            onPressState={press ? (down) => press.onChange(down ? row.slice.pos : null) : undefined}
            pressed={press?.pos === row.slice.pos}
            ghost={press?.pos === row.slice.pos ? press.ghost : undefined}
            disabled={disabled}
          />
        ),
      )}
    </>
  );
}

// The board while it loads (KaupholYukleniyor): six slices of placeholders.
export function BoardSkeleton({ look }: { look: BoardLook }) {
  const S = K.slot;
  const box = look.compact ? S.compact : S;
  const bar = (w: number, h: number) => (
    <View
      style={{
        width: w,
        height: h,
        borderRadius: S.skeleton.radius,
        backgroundColor: S.oddsSkeleton,
      }}
    />
  );
  return (
    <Board look={look} loading testID="kaupholl-board-loading">
      {Array.from({ length: 6 }, (_, i) => (
        <View
          key={i}
          style={{
            minHeight: box.minHeight,
            borderRadius: S.radius,
            paddingVertical: box.padY,
            paddingLeft: box.padLeft,
            paddingRight: box.padRight,
            flexDirection: 'row',
            alignItems: 'center',
            gap: box.gap,
            backgroundColor: S.fill,
          }}
        >
          <View
            style={{
              width: S.odds,
              height: S.odds,
              borderRadius: S.odds / 2,
              backgroundColor: S.oddsSkeleton,
            }}
          />
          <View style={{ gap: S.skeleton.radius }}>
            {bar(S.skeleton.guess.width, S.skeleton.guess.height)}
            {bar(S.skeleton.who.width, S.skeleton.who.height)}
          </View>
        </View>
      ))}
    </Board>
  );
}

// The wallet (`.wallet`): the two coins, a placed one faded and grey; locked, the lock over them.
// `leaving`: the first free coin is going to the slice under the finger, at half.
export function Wallet({
  left,
  locked,
  leaving,
}: {
  left: number;
  locked: boolean;
  leaving?: boolean;
}) {
  const W = K.wallet;
  return (
    <View
      accessible
      accessibilityLabel={tr.kaupholl.coinsLeft(left, locked)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: W.gap }}
    >
      {[0, 1].map((i) => {
        const used = i >= left;
        const going = !!leaving && !used && i === 0;
        return (
          <View
            key={i}
            style={{
              width: W.coin,
              height: W.coin,
              opacity: locked
                ? used
                  ? W.lockedUsed
                  : W.lockedCoin
                : used
                  ? W.used
                  : going
                    ? W.leaving
                    : 1,
              filter: used
                ? [{ grayscale: 1 }]
                : [
                    {
                      dropShadow: {
                        offsetX: 0,
                        offsetY: W.shadow.y,
                        standardDeviation: W.shadow.blur / 2,
                        color: W.shadow.color,
                      },
                    },
                  ],
            }}
          >
            <Image
              source={kauphollArt.coin}
              style={{ width: W.coin, height: W.coin }}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
        );
      })}
      {locked ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <View
            style={{
              width: W.lock.side,
              height: W.lock.side,
              borderRadius: W.lock.side / 2,
              backgroundColor: K.ink,
              borderWidth: W.lock.ring,
              borderColor: W.lock.ringInk,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CapIcon name="lock" color={K.white} size={W.lock.icon} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ the answer

// The answer (`.big-a`): "CEVAP" and the number (shrinking, never "…"), the unit at the right.
export function AnswerBox({ value, unit }: { value: string; unit: string }) {
  const { c } = useKit();
  const A = K.answer;
  return (
    <Glass
      radius={A.radius}
      style={{
        paddingVertical: A.padY,
        paddingHorizontal: A.padX,
        flexDirection: 'row',
        alignItems: 'center',
        gap: A.gap,
      }}
    >
      <View style={{ flex: 1 }}>
        <T v="eyebrow">{upperTr(tr.kaupholl.answer)}</T>
        <Text
          testID="kaupholl-answer"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          maxFontSizeMultiplier={MAX_FONT}
          style={[KT.answer, { color: c.ink }]}
        >
          {value}
        </Text>
      </View>
      <T v="fine">{unit}</T>
    </Glass>
  );
}

// ------------------------------------------------------------------ the scores

export type ScoreLine = {
  sid: string;
  gain?: number;
  total: number;
  bonus?: boolean;
  lead: boolean;
};

// The score table (`.tbl`): face, name (with "+3 tahmin"), this question's gain, the points; the
// leaders' points in --signal.
export function ScoreTable({ faces, rows }: { faces: Faces; rows: readonly ScoreLine[] }) {
  const { colors } = useTheme();
  const { c } = useKit();
  const TB = K.table;
  return (
    <Glass radius={TB.radius} style={{ paddingVertical: TB.padY, paddingHorizontal: TB.padX }}>
      {rows.map((row, i) => (
        <View
          key={row.sid}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: TB.gap,
            paddingVertical: TB.rowPadY,
            borderTopWidth: i === 0 ? 0 : KIT.size.hair,
            borderTopColor: c.hair,
          }}
        >
          <Face faces={faces} sid={row.sid} size={TB.face} />
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: TB.tagGap,
            }}
          >
            <Text
              maxFontSizeMultiplier={MAX_FONT}
              style={[KT.row, { color: c.ink, flexShrink: 1 }]}
            >
              {nameOf(faces, row.sid)}
            </Text>
            {row.bonus ? (
              <Tag label={tr.kaupholl.bonus} colors={{ bg: colors.signal, fg: colors.onSignal }} />
            ) : null}
          </View>
          {row.gain !== undefined ? (
            <Text
              maxFontSizeMultiplier={MAX_FONT}
              style={[KT.gain, { color: row.gain > 0 ? colors.signal : c.muted }]}
            >
              {tr.kaupholl.gain(row.gain)}
            </Text>
          ) : null}
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[
              KT.points,
              {
                minWidth: TB.points,
                textAlign: 'right',
                color: row.lead ? colors.signal : c.ink,
              },
            ]}
          >
            {String(row.total)}
          </Text>
        </View>
      ))}
    </Glass>
  );
}

// The end's winners (`.hero-s`): "Kazanan" or "Kazananlar" stamped over them; one 72 in a
// --signal ring with its halo, two or three 72 overlapping, ringed in the ink and --signal.
export function HeroWinners({ faces, sids }: { faces: Faces; sids: readonly string[] }) {
  const { colors } = useTheme();
  const H = K.hero;
  if (sids.length === 0) return null;
  const one = sids.length === 1;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: H.top, alignItems: 'center' }}>
      <View style={{ transform: [{ rotate: H.stampTurn }], marginBottom: H.stampGap }}>
        <Tag
          label={one ? tr.kaupholl.winner : tr.kaupholl.winners}
          colors={{ bg: colors.signal, fg: colors.onSignal }}
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {sids.map((sid, i) => (
          <View
            key={sid}
            style={{
              marginLeft: i === 0 ? 0 : -H.overlap,
              borderRadius: H.face / 2,
              boxShadow: one
                ? `0px 0px 0px ${H.one.ring}px ${colors.signal}, 0px 0px 0px ${H.one.halo}px ${H.one.haloInk}, ${H.shadow}`
                : `0px 0px 0px ${H.many.ring}px ${K.ink}, 0px 0px 0px ${H.many.signal}px ${colors.signal}`,
            }}
          >
            <Face faces={faces} sid={sid} size={H.face} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ errors and notices

// The connection error (`.errbox`, KaupholHata): the glass card over the dimmed card or board, the
// mark, "Bağlantı kurulamadı" and Tekrar dene.
export function ErrorBox({ retrying, onRetry }: { retrying: boolean; onRetry: () => void }) {
  const { c } = useKit();
  const E = K.error;
  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { justifyContent: 'center', zIndex: 30 }]}
    >
      <Glass
        radius={E.radius}
        style={{
          marginHorizontal: E.side,
          paddingVertical: E.padY,
          paddingHorizontal: E.padX,
          alignItems: 'center',
          gap: E.gap,
        }}
      >
        <View accessibilityRole="alert" style={{ alignItems: 'center', gap: E.gap }}>
          <CapIcon name="cloudOff" color={c.ink} />
          <T v="h3" center>
            {tr.kaupholl.connection}
          </T>
        </View>
        <Btn
          sm
          variant="glassy"
          testID="kaupholl-retry"
          label={tr.common.retry}
          loading={retrying}
          onPress={onRetry}
        />
      </Glass>
    </View>
  );
}

// "Oyun yarıda kaldı" over the table (KaupholYarida): the game left half way returns everyone to
// the table without an end. It goes after a while or at a touch.
export function AbandonedNotice({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const N = K.notice;
  // The table draws again often: the time runs from the notice's first showing.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const timer = setTimeout(() => done.current(), N.ms);
    return () => clearTimeout(timer);
  }, [N.ms]);
  return (
    <Pressable
      testID="kaupholl-abandoned"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      onPress={onDone}
      style={{
        position: 'absolute',
        left: N.side,
        right: N.side,
        top: insets.top + N.top,
        zIndex: 50,
      }}
    >
      <Glass
        radius={N.radius}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: N.gap,
          paddingVertical: N.padY,
          paddingHorizontal: N.padX,
        }}
      >
        <View
          style={{
            width: N.disc,
            height: N.disc,
            borderRadius: N.disc / 2,
            backgroundColor: colors.warnSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CapIcon name="warn" color={colors.onWarnSoft} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="h3">{tr.kaupholl.abandoned}</T>
        </View>
      </Glass>
    </Pressable>
  );
}
