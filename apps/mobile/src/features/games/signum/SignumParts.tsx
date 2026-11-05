import type { SignumKind, SignumState, SignumTeam } from '@shared/signum.ts';
import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import {
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, Round, T, Tag, useKit } from '@/aura/kit';
import { shadowParts } from '@/components/NativeShadow';
import {
  Buddy,
  Face,
  type Faces,
  nameOf,
  TeamBar,
  useKinshiDeck,
  useTeamTone,
} from '@/features/games/kinshi/KinshiParts';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { haptic } from '@/lib/haptics';
import { closedByKind } from '@/lib/signumGame';
import { KIT } from '@/theme/auraKit';
import { KINSHI as K, KINSHI_TYPE as KT } from '@/theme/kinshi';
import {
  captainLine,
  selShadow,
  SIGNUM as S,
  SIGNUM_PEEK as PEEK,
  SIGNUM_TYPE as ST,
  signumBoard,
  tileLook,
} from '@/theme/signum';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

import { signumArt } from './signumArt';

const MAX_FONT = 1.3;

// The board's art for a kind (`.tl.r.m`, `.p`, `.n`, `.x`).
const OPEN_ART: Record<SignumKind, ImageSourcePropType> = {
  a: signumArt.tile.mor,
  b: signumArt.tile.pembe,
  n: signumArt.tile.neutral,
  x: signumArt.tile.black,
};

// The top bar (`.top`): the close at the left; in the middle the glass score pill (each team's bar
// and its tiles left) or, on the role cards, the phase pill; at the right the chat, or the
// captain's key held to look (`aria-label="Anahtar kartı, basılı tut"`), or nothing.
export function TopBar({
  close,
  middle,
  right,
}: {
  close: { label: string; onPress: () => void; loading?: boolean; testID?: string };
  middle: { score: { a: number; b: number } } | { phase: string } | null;
  right: { chat: () => void } | { key: (held: boolean) => void } | null;
}) {
  const { c } = useKit();
  return (
    <View
      style={{
        marginTop: K.barTop,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SIDE_GAP,
      }}
    >
      <Round
        icon="close"
        label={close.label}
        onPress={close.onPress}
        loading={close.loading}
        testID={close.testID}
      />
      {middle && 'score' in middle ? (
        <View
          accessible
          accessibilityLabel={tr.signum.scoreLabel(middle.score.a, middle.score.b)}
          style={{ flexShrink: 1 }}
        >
          <Glass
            radius={K.score.height / 2}
            style={{
              height: K.score.height,
              paddingLeft: K.score.padLeft,
              paddingRight: K.score.padRight,
              flexDirection: 'row',
              alignItems: 'center',
              gap: K.score.gap,
            }}
          >
            <TeamBar team="a" />
            <Text maxFontSizeMultiplier={1} style={[KT.score, { color: c.ink }]}>
              {middle.score.a}
            </Text>
            <View style={{ width: 1, height: K.score.rule, backgroundColor: c.hair }} />
            <TeamBar team="b" />
            <Text maxFontSizeMultiplier={1} style={[KT.score, { color: c.ink }]}>
              {middle.score.b}
            </Text>
          </Glass>
        </View>
      ) : middle && 'phase' in middle ? (
        <View style={{ flexShrink: 1 }}>
          <Glass
            radius={S.phase.height / 2}
            style={{
              height: S.phase.height,
              paddingHorizontal: S.phase.padX,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.phase, { color: c.ink }]}>
              {middle.phase}
            </Text>
          </Glass>
        </View>
      ) : (
        <View />
      )}
      {right && 'chat' in right ? (
        <Round icon="chat" label={tr.signum.chat} onPress={right.chat} />
      ) : right && 'key' in right ? (
        <KeyHold onHold={right.key} />
      ) : (
        <View style={{ width: KIT.size.round }} />
      )}
    </View>
  );
}
const SIDE_GAP = 4;

// The captain's key button: held, the key shows (the screen lays it over the board).
function KeyHold({ onHold }: { onHold: (held: boolean) => void }) {
  return (
    <Pressable
      testID="signum-key-hold"
      accessibilityRole="button"
      accessibilityLabel={tr.signum.keyHold}
      onPressIn={() => {
        onHold(true);
        haptic('selection');
      }}
      onPressOut={() => onHold(false)}
    >
      <View pointerEvents="none">
        <Round icon="grid2x2" label={tr.signum.keyHold} />
      </View>
    </Pressable>
  );
}

// The board's geometry on this screen.
export function useSignumBoard() {
  return signumBoard(useWindowDimensions().width, KIT.size.side);
}

// The word board (`.board`): the cloth, 5 × 5 tiles. `keyMap` is the captain's own map (their view)
// or the over state's open key; nobody else has one (rule 3). `pointers` are the caller's team's
// marks (tile → who), `mine` the caller's own; `onTile` makes the closed tiles pressable.
export function Board({
  state,
  keyMap,
  pointers,
  mine,
  faces,
  onTile,
  busy,
  testID,
}: {
  state: SignumState;
  keyMap: readonly SignumKind[] | null;
  pointers: ReadonlyMap<number, readonly string[]>;
  mine: number | null;
  faces: Faces;
  onTile?: (tile: number) => void;
  busy?: boolean;
  testID?: string;
}) {
  const b = useSignumBoard();
  const shadow = shadowParts(useLabOff('golge'), S.boardShadow, undefined, S.board.radius);
  const rows = [0, 1, 2, 3, 4].map((r) => state.board.slice(r * 5, r * 5 + 5));
  return (
    <View
      testID={testID}
      style={{
        width: b.width,
        height: b.height,
        alignSelf: 'center',
        borderRadius: S.board.radius,
        boxShadow: shadow.boxShadow,
      }}
    >
      {shadow.node}
      <Image
        source={signumArt.board}
        style={[StyleSheet.absoluteFill, { borderRadius: S.board.radius }]}
        contentFit="fill"
        accessibilityIgnoresInvertColors
      />
      <View style={{ padding: S.board.pad, gap: S.board.gap }}>
        {rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: S.board.gap, height: S.board.row }}>
            {row.map((tile, c) => {
              const i = r * 5 + c;
              return (
                <Tile
                  key={i}
                  index={i}
                  word={tile.word}
                  open={tile.open}
                  keyMap={keyMap}
                  pointers={pointers.get(i) ?? []}
                  mine={mine === i}
                  faces={faces}
                  onPress={tile.open === null && onTile && !busy ? () => onTile(i) : undefined}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function Tile({
  index,
  word,
  open,
  keyMap,
  pointers,
  mine,
  faces,
  onPress,
}: {
  index: number;
  word: string;
  open: SignumKind | null;
  keyMap: readonly SignumKind[] | null;
  pointers: readonly string[];
  mine: boolean;
  faces: Faces;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const look = tileLook(open, keyMap, index);
  const upper = upperTr(word);
  const black = look.kind === 'captain' && look.key === 'x';
  const kindName = look.kind === 'closed' ? null : tr.signum.tileKinds[look.key];
  const box: ViewStyle = {
    flex: 1,
    borderRadius: S.tile.radius,
    alignItems: 'center',
    justifyContent: look.kind === 'open' ? 'flex-end' : 'center',
    paddingBottom: look.kind === 'open' ? S.tile.labelBottom : 0,
    boxShadow: mine ? selShadow(colors.buzz) : S.tileShadow,
    zIndex: mine || pointers.length > 0 ? 2 : 0,
    backgroundColor: black ? S.captain.x.ground : undefined,
  };
  const body = (
    <>
      {black ? null : (
        <Image
          source={look.kind === 'open' ? OPEN_ART[look.key] : signumArt.tile.closed}
          style={[StyleSheet.absoluteFill, { borderRadius: S.tile.radius }]}
          contentFit="fill"
          accessibilityIgnoresInvertColors
        />
      )}
      {look.kind === 'captain' ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: S.tile.radius,
              backgroundColor: look.key === 'x' ? undefined : S.captain[look.key].fill,
              boxShadow: captainLine(look.key),
            },
          ]}
        />
      ) : null}
      {look.kind === 'open' ? (
        <View
          style={{
            backgroundColor: S.label.ground,
            paddingVertical: S.label.padY,
            paddingHorizontal: S.label.padX,
            borderRadius: S.label.radius,
          }}
        >
          <Text maxFontSizeMultiplier={1} style={[ST.label, { color: S.label.ink }]}>
            {upper}
          </Text>
        </View>
      ) : (
        <Text
          maxFontSizeMultiplier={1}
          style={[ST.tile, { color: black ? S.captain.x.ink : S.tileInk }]}
        >
          {upper}
        </Text>
      )}
      {pointers.length > 0 ? <Pointers faces={faces} sids={pointers} /> : null}
    </>
  );
  const label = kindName
    ? tr.signum.tileLabel(upper, kindName)
    : mine
      ? tr.signum.tilePointed(upper)
      : upper;
  return onPress ? (
    <Pressable
      testID={`signum-tile-${index}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: mine }}
      onPress={onPress}
      style={box}
    >
      {body}
    </Pressable>
  ) : (
    <View testID={`signum-tile-${index}`} accessible accessibilityLabel={label} style={box}>
      {body}
    </View>
  );
}

// Who points at a tile (`.tl .pt`): their faces of 18 at its top right, ringed in the ink.
function Pointers({ faces, sids }: { faces: Faces; sids: readonly string[] }) {
  const P = S.pointers;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', right: P.right, top: P.top, flexDirection: 'row' }}
    >
      {sids.map((s, i) => (
        <View
          key={s}
          style={{
            marginLeft: i === 0 ? 0 : -P.overlap,
            borderRadius: P.face,
            borderWidth: P.ring,
            borderColor: P.ringColor,
            margin: -P.ring,
          }}
        >
          <Face faces={faces} sid={s} size={P.face} />
        </View>
      ))}
    </View>
  );
}

// The board with the two buddies peeking over its top edge (`.peek` 78 above it), or without them
// (the captain's İpucu ver).
export function PeekBoard({
  peek,
  children,
}: {
  peek: readonly [
    '1a80a9' | '9c96bd' | 'd2fbb5' | 'f280a5',
    '1a80a9' | '9c96bd' | 'd2fbb5' | 'f280a5',
  ];
  children: ReactNode;
}) {
  const b = useSignumBoard();
  const inset = PEEK.fromScreen - KIT.size.side;
  return (
    <View style={{ width: b.width, alignSelf: 'center', paddingTop: PEEK.above }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Buddy
          buddy={peek[0]}
          height={PEEK.height}
          style={{ left: inset, transform: [{ rotate: PEEK.leftTurn }] }}
        />
        <Buddy
          buddy={peek[1]}
          height={PEEK.height}
          style={{ right: inset, top: PEEK.rightDrop, transform: [{ rotate: PEEK.rightTurn }] }}
        />
      </View>
      {children}
    </View>
  );
}

// An uppercase eyebrow (`.eb`).
export function Eyebrow({ children }: { children: string }) {
  const { c } = useKit();
  return (
    <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.eyebrow, { color: c.muted }]}>
      {upperTr(children)}
    </Text>
  );
}

// A team's number label (`.cn.tag.m`, `.cn.tag.p`): 30 round in the team's tag colours.
function ClueNumber({ team, n }: { team: SignumTeam; n: number }) {
  const tone = useTeamTone(team);
  return (
    <View
      style={{
        minWidth: S.clue.number,
        height: S.clue.number,
        borderRadius: S.clue.number / 2,
        paddingHorizontal: CLUE_NUMBER_PAD,
        backgroundColor: tone.tagBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text maxFontSizeMultiplier={1} style={[ST.clueNumber, { color: tone.tagInk }]}>
        {n}
      </Text>
    </View>
  );
}
const CLUE_NUMBER_PAD = 8;

// The clue panel (`.clue`): the captain's face, "Ad · ipucu", the word and its number, "Kalan
// tahmin" at the right.
export function CluePanel({
  faces,
  captain,
  team,
  clue,
  guessesLeft,
}: {
  faces: Faces;
  captain: string | null;
  team: SignumTeam;
  clue: { word: string; n: number };
  guessesLeft: number | null;
}) {
  const { c } = useKit();
  return (
    <Glass
      radius={S.clue.radius}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.clue.gap,
        paddingVertical: S.clue.padY,
        paddingHorizontal: S.clue.padX,
      }}
    >
      {captain ? <Face faces={faces} sid={captain} size={S.clue.face} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Eyebrow>{tr.signum.clueBy(captain ? nameOf(faces, captain) : tr.kinshi.left)}</Eyebrow>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: CLUE_WORD_GAP }}>
          <View style={{ flexShrink: 1 }}>
            <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.clue, { color: c.ink }]}>
              {upperTr(clue.word)}
            </Text>
          </View>
          <ClueNumber team={team} n={clue.n} />
        </View>
      </View>
      {guessesLeft !== null ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Eyebrow>{tr.signum.guessesLeft}</Eyebrow>
          <T v="h3">{String(guessesLeft)}</T>
        </View>
      ) : null}
    </Glass>
  );
}
const CLUE_WORD_GAP = 8;

// İpucu ver's panel (`.gp`): the field, the four numbers, the colour legend from the captain's key.
export function ClueInput({
  word,
  onWord,
  n,
  onN,
  state,
  keyMap,
  disabled,
}: {
  word: string;
  onWord: (w: string) => void;
  n: number | null;
  onN: (n: number) => void;
  state: SignumState;
  keyMap: readonly SignumKind[];
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  const counts = closedByKind(state, keyMap);
  const kinds: SignumKind[] = ['a', 'b', 'n', 'x'];
  return (
    <Glass radius={S.input.radius} style={{ padding: S.input.pad, gap: S.input.gap }}>
      <TextInput
        testID="signum-clue-word"
        accessibilityLabel={tr.signum.clueField}
        value={word}
        onChangeText={onWord}
        editable={!disabled}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        maxLength={CLUE_MAX}
        returnKeyType="done"
        maxFontSizeMultiplier={MAX_FONT}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        style={[
          ST.field,
          {
            minHeight: S.field.height,
            borderRadius: S.field.radius,
            borderWidth: S.field.line,
            borderColor: colors.accent,
            backgroundColor: colors.surface2,
            paddingHorizontal: S.field.padX,
            paddingVertical: 0,
            color: c.ink,
          },
        ]}
      />
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={tr.signum.countLabel}
        style={{ flexDirection: 'row', gap: S.seg.gap }}
      >
        {[1, 2, 3, 4].map((v) => {
          const on = n === v;
          return (
            <Pressable
              key={v}
              testID={`signum-clue-n-${v}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled }}
              disabled={disabled}
              onPress={() => {
                haptic('selection');
                onN(v);
              }}
              style={{
                flex: 1,
                height: S.seg.height,
                borderRadius: S.seg.radius,
                borderWidth: S.seg.line,
                borderColor: on ? colors.primary : c.raisedEdge,
                backgroundColor: on ? colors.primary : c.raised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                maxFontSizeMultiplier={1}
                style={[ST.seg, { color: on ? colors.onPrimary : c.ink }]}
              >
                {v}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: S.legend.gap,
        }}
      >
        {kinds.map((k) => (
          <View
            key={k}
            style={{ flexDirection: 'row', alignItems: 'center', gap: S.legend.itemGap }}
          >
            <View
              style={{
                width: S.legend.square,
                height: S.legend.square,
                borderRadius: S.legend.radius,
                backgroundColor: S.key[k],
                ...(k === 'x'
                  ? { borderWidth: S.legend.blackRing, borderColor: S.legend.blackRingColor }
                  : null),
              }}
            />
            <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.legend, { color: c.muted }]}>
              {tr.signum.legend(tr.signum.kinds[k], counts[k])}
            </Text>
          </View>
        ))}
      </View>
    </Glass>
  );
}
const CLUE_MAX = 24;

// The 5 × 5 key map (`.mini`): each tile's kind; an opened tile's cell striped.
export function KeyMini({
  keyMap,
  opened,
  sm,
  scale = 1,
}: {
  keyMap: readonly SignumKind[];
  opened: readonly boolean[];
  sm?: boolean;
  scale?: number;
}) {
  const M = sm ? S.miniSm : S.mini;
  const cell = M.cell * scale;
  const gap = M.gap * scale;
  return (
    <View
      accessible
      accessibilityLabel={tr.signum.keyCard}
      style={{ width: 5 * cell + 4 * gap, flexDirection: 'row', flexWrap: 'wrap', gap }}
    >
      {keyMap.map((k, i) => (
        <View
          key={i}
          style={{
            width: cell,
            height: cell,
            borderRadius: M.radius * scale,
            backgroundColor: S.key[k],
            boxShadow: S.miniLine,
            overflow: 'hidden',
          }}
        >
          {opened[i] ? (
            <View style={[StyleSheet.absoluteFill, gradientStyle(S.miniOpened)]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

// The role card's back with "Basılı tut" over it (`.card.arka .hold`), or without it (a watcher's).
export function RoleBack({ hold }: { hold: boolean }) {
  const d = useKinshiDeck();
  const C = S.card;
  const z = d.scale;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={signumArt.back}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      {hold ? (
        <View
          style={{
            position: 'absolute',
            top: C.holdTop * z,
            alignSelf: 'center',
            height: C.holdHeight,
            paddingHorizontal: C.holdPadX,
            borderRadius: C.holdHeight / 2,
            backgroundColor: C.holdGround,
            flexDirection: 'row',
            alignItems: 'center',
            gap: C.holdGap,
          }}
        >
          <HoldEye />
          <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.hold, { color: C.holdInk }]}>
            {tr.signum.hold}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function HoldEye() {
  return <CapIcon name="eye" color={S.card.holdInk} size={KIT.size.iconSm} />;
}

// The role card's front (`.card.kaptan`, `.card.tahminci`): the kick, the word, and the captain's
// key map or the guesser's team and captain with the note.
export function RoleFront({
  role,
  team,
  captainName,
  keyMap,
}: {
  role: 'captain' | 'guesser';
  team: SignumTeam;
  captainName: string;
  keyMap: readonly SignumKind[] | null;
}) {
  const d = useKinshiDeck();
  const C = S.card;
  const z = d.scale;
  const wordStyle = {
    color: C.wordInk,
    textAlign: 'center',
    textShadowColor: C.wordShadow.color,
    textShadowOffset: { width: 0, height: C.wordShadow.y },
    textShadowRadius: 0,
  } as const;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={role === 'captain' ? signumArt.captain : signumArt.guesser}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: C.kickTop * z,
          height: C.kickHeight * z,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text maxFontSizeMultiplier={1} style={[ST.kick, { color: C.ink }]}>
          {upperTr(role === 'captain' ? tr.signum.team[team] : tr.signum.guesserKick)}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left: C.wordSide * z,
          right: C.wordSide * z,
          top: C.wordTop * z,
          height: C.wordHeight * z,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
          style={[role === 'captain' ? ST.roleWord : ST.roleWordGuesser, wordStyle]}
        >
          {upperTr(role === 'captain' ? tr.signum.captainWord : tr.signum.guesserWord)}
        </Text>
      </View>
      {role === 'captain' && keyMap ? (
        <View style={{ position: 'absolute', left: S.mini.left * z, top: S.mini.top * z }}>
          <KeyMini keyMap={keyMap} opened={[]} scale={z} />
        </View>
      ) : null}
      {role === 'guesser' ? (
        <>
          <View
            style={{
              position: 'absolute',
              top: C.tagTop * z,
              alignSelf: 'center',
              height: C.tagHeight,
              paddingHorizontal: C.tagPadX,
              borderRadius: C.tagHeight / 2,
              backgroundColor: C.tagGround,
              justifyContent: 'center',
              maxWidth: d.card.width - 2 * C.tagPadX,
            }}
          >
            <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.roleTag, { color: C.wordInk }]}>
              {tr.signum.guesserTag(tr.signum.team[team], captainName)}
            </Text>
          </View>
          <View
            style={{
              position: 'absolute',
              left: C.noteSide * z,
              right: C.noteSide * z,
              top: C.noteTop * z,
            }}
          >
            <Text
              maxFontSizeMultiplier={MAX_FONT}
              style={[ST.roleNote, { color: C.ink, textAlign: 'center' }]}
            >
              {tr.signum.guesserNote}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

// "Hazır: n/m" (`.chip.hz`): 48 high beside Hazırım.
export function ReadyChip({ n, of }: { n: number; of: number }) {
  const { c } = useKit();
  return (
    <View
      style={{
        height: S.readyChip.height,
        paddingHorizontal: S.readyChip.padX,
        borderRadius: S.readyChip.height / 2,
        backgroundColor: c.raisedChip,
        borderWidth: KIT.size.edge,
        borderColor: c.raisedEdge,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <T v="chip" ink>
        {tr.signum.readyCount(n, of)}
      </T>
    </View>
  );
}

// The captain mark beside a name on Takımlar (`.cap`), and the page's other two states.
export function SeatMark({ label, strong }: { label: string; strong?: boolean }) {
  const { colors } = useTheme();
  const { c } = useKit();
  return (
    <View
      style={{
        marginLeft: S.cap.gap,
        paddingVertical: S.cap.padY,
        paddingHorizontal: S.cap.padX,
        borderRadius: S.cap.radius,
        backgroundColor: strong ? colors.signal : c.raisedChip,
      }}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT}
        style={[ST.cap, { color: strong ? colors.onSignal : c.ink }]}
      >
        {label}
      </Text>
    </View>
  );
}

// The black card's tag (`.tag.x`).
export function BlackTag({ label }: { label: string }) {
  return (
    <Tag
      label={label}
      colors={{ bg: S.blackTag.ground, fg: S.blackTag.ink, edge: S.blackTag.line }}
    />
  );
}
