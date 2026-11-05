import type { SahtekarView } from '@shared/sahtekarGame.ts';
import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Reanimated, {
  Easing as REasing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, T, Tag, useKit } from '@/aura/kit';
import { Loader } from '@/components/Loader';
import { shadowParts } from '@/components/NativeShadow';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { KROT as KR, KROT_TYPE as KT, krotLineup } from '@/theme/krot';
import { CURVES, ROLE_TURN, TILT } from '@/theme/playMotion';
import { risoDeck } from '@/theme/riso';
import { useTheme } from '@/theme/ThemeProvider';

import { CardBack, Face, type Faces, nameOf, PeekPair, Pop, useRisoDeck } from '../riso/RisoParts';
import type { RisoBuddy } from '../riso/risoArt';
import { krotArt } from './krotArt';

const MAX_FONT = 1.3;

// ------------------------------------------------------------------ the bar

// The phase in the middle of the bar (`.phase`): a 44 glass pill, 700/15.
export function PhasePill({ label }: { label: string }) {
  const { c } = useKit();
  return (
    <Glass
      radius={KR.phase.height / 2}
      style={{
        height: KR.phase.height,
        paddingHorizontal: KR.phase.padX,
        justifyContent: 'center',
        flexShrink: 1,
        marginHorizontal: SIDE_CLEAR,
      }}
    >
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={MAX_FONT}
        style={[KT.phase, { color: c.ink }]}
      >
        {label}
      </Text>
    </Glass>
  );
}
const SIDE_CLEAR = 4;

// An eyebrow over a glass row's words (`.eb`): upper case, muted.
export function Eyebrow({ children }: { children: string }) {
  const { c } = useKit();
  return (
    <Text maxFontSizeMultiplier={MAX_FONT} style={[KT.eyebrow, { color: c.muted }]}>
      {upperTr(children)}
    </Text>
  );
}

// "Hazır: 2/5" beside Hazırım (`.chip.hz`): 48 high, tabular.
export function ReadyChip({ label }: { label: string }) {
  const { c } = useKit();
  return (
    <View
      style={{
        height: KR.readyChip.height,
        paddingHorizontal: KR.readyChip.padX,
        borderRadius: KR.readyChip.height / 2,
        backgroundColor: c.raisedChip,
        borderWidth: KIT.size.edge,
        borderColor: c.raisedEdge,
        justifyContent: 'center',
      }}
    >
      <T v="chip" ink style={{ fontVariant: ['tabular-nums'] }}>
        {label}
      </T>
    </View>
  );
}

// ------------------------------------------------------------------ the role card

// The card on top of the deck: its back (`k-arka`, the "Basılı tut" pill over it while it waits to
// be held) and its face (KELİMEN, ROLÜN or GÖZLEMCİSİN on its picture). Held, it turns over in
// 550 ms; let go, it turns back (the old Krot's role card, ROLE_TURN). With reduce motion the face
// fades in and out instead. The face is drawn only while held.
export function RoleFace({
  open,
  view,
  failed,
  pill,
  faces,
}: {
  open: boolean;
  // Null while the phone's own role is on its way.
  view: SahtekarView | undefined;
  failed: string | null;
  // The "Basılı tut" pill on the back (the role screens; not over the line-up).
  pill: boolean;
  faces: Faces;
}) {
  const reduce = useReduceMotion();
  const d = useRisoDeck();
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.set(
      withTiming(open ? 1 : 0, {
        duration: reduce ? ROLE_TURN.reducedMs : ROLE_TURN.ms,
        easing: REasing.bezier(...CURVES.turn),
      }),
    );
  }, [open, reduce, turn]);
  const backStyle = useAnimatedStyle(() =>
    reduce
      ? { opacity: 1 - Math.min(1, turn.value) }
      : {
          transform: [
            { perspective: TILT.perspective },
            { rotateY: `${interpolate(turn.value, [0, 1], [0, ROLE_TURN.degrees])}deg` },
          ],
        },
  );
  const faceStyle = useAnimatedStyle(() =>
    reduce
      ? { opacity: Math.min(1, turn.value) }
      : {
          transform: [
            { perspective: TILT.perspective },
            {
              rotateY: `${interpolate(turn.value, [0, 1], [ROLE_TURN.degrees, ROLE_TURN.degrees * 2])}deg`,
            },
          ],
        },
  );
  const r = d.card.radius;
  const side = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: r,
    overflow: 'hidden' as const,
    backfaceVisibility: 'hidden' as const,
  };
  return (
    <View style={StyleSheet.absoluteFill}>
      <Reanimated.View style={[side, backStyle]}>
        <CardBack source={krotArt.back} radius={r} />
        {pill ? <HoldPill /> : null}
      </Reanimated.View>
      <Reanimated.View style={[side, faceStyle]}>
        {open ? <Front view={view} failed={failed} faces={faces} /> : null}
      </Reanimated.View>
    </View>
  );
}

// "Basılı tut" on the closed card (`.hold`): black 72 %, the eye and the words in white.
function HoldPill() {
  const d = useRisoDeck();
  const H = KR.face.hold;
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: H.top * d.scale,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          height: H.height,
          paddingHorizontal: H.padX,
          borderRadius: H.height / 2,
          backgroundColor: H.fill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: H.gap,
        }}
      >
        <CapIcon name="eye" color={KR.face.wordInk} size={KIT.size.iconSm} />
        <Text maxFontSizeMultiplier={MAX_FONT} style={[KT.hold, { color: KR.face.wordInk }]}>
          {tr.krot.hold}
        </Text>
      </View>
    </View>
  );
}

// The face's words over its picture: the label, the word (or SAHTEKARSIN), the category pill and
// the note; a watcher's note names the impostors.
function Front({
  view,
  failed,
  faces,
}: {
  view: SahtekarView | undefined;
  failed: string | null;
  faces: Faces;
}) {
  const d = useRisoDeck();
  const z = (n: number) => n * d.scale;
  const F = KR.face;
  if (!view || view.role === null) {
    return (
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <CardBack source={krotArt.back} radius={d.card.radius} />
        {failed ? (
          <Glass pad="pad">
            <T v="fine" ink center>
              {failed}
            </T>
          </Glass>
        ) : view ? null : (
          <Loader label={tr.krot.loading} />
        )}
      </View>
    );
  }
  const impostor = view.role === 'impostor';
  const kick =
    view.role === 'player'
      ? tr.krot.kickWord
      : view.role === 'impostor'
        ? tr.krot.kickImpostor
        : tr.krot.kickWatcher;
  const word = impostor ? tr.krot.youAreImpostor : view.word;
  const note =
    view.role === 'player'
      ? tr.krot.wordNote
      : view.role === 'impostor'
        ? tr.krot.impostorNote
        : tr.krot.watcherNote(view.impostorSeats.map((s) => nameOf(faces, s)));
  const wordType = impostor ? KT.wordImpostor : KT.word;
  return (
    <View style={StyleSheet.absoluteFill} testID={`krot-card-${view.role}`}>
      <Image
        source={impostor ? krotArt.impostor : krotArt.word}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: z(F.kick.top),
          height: z(F.kick.height),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
          style={[view.role === 'watcher' ? KT.kickLong : KT.kick, { color: F.ink }]}
        >
          {upperTr(kick)}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left: z(F.word.side),
          right: z(F.word.side),
          top: z(F.word.top),
          height: z(F.word.height),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={F.minWord / (wordType.fontSize ?? F.minWord)}
          maxFontSizeMultiplier={1}
          style={[
            wordType,
            {
              color: F.wordInk,
              textAlign: 'center',
              textShadowColor: F.wordShadow.color,
              textShadowOffset: { width: 0, height: F.wordShadow.y },
              textShadowRadius: 0,
            },
          ]}
        >
          {upperTr(word)}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: z(F.tag.top),
          alignItems: 'center',
        }}
      >
        <View
          style={{
            height: F.tag.height,
            paddingHorizontal: F.tag.padX,
            borderRadius: F.tag.height / 2,
            backgroundColor: F.tag.fill,
            justifyContent: 'center',
            maxWidth: d.card.width - 2 * z(F.word.side),
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1}
            style={[KT.tag, { color: F.wordInk }]}
          >
            {tr.krot.category(view.category)}
          </Text>
        </View>
      </View>
      <Text
        maxFontSizeMultiplier={1}
        style={[
          KT.note,
          {
            position: 'absolute',
            left: z(F.note.side),
            right: z(F.note.side),
            top: z(F.note.top),
            color: F.ink,
            textAlign: 'center',
          },
        ]}
      >
        {note}
      </Text>
    </View>
  );
}

// ------------------------------------------------------------------ the line-up

// A seat in the line-up: its face, ring and plate, its name, and what it can do.
export type LineupSeat = {
  sid: string;
  // The ring: white; the speaker's --signal; the chosen or caught one's --buzz.
  mark: 'normal' | 'speak' | 'sel' | 'caught';
  // The others while someone speaks, the not caught at Sonuç.
  dim: boolean;
  // The caller, at the vote: a dashed ring, cannot be pressed.
  self: boolean;
  voted: boolean;
  // The plate: the seat's number, or the votes it got at Sonuç.
  plate: string;
  stamp?: string;
  onPress?: () => void;
  // What screen readers hear.
  label: string;
};

// The suspect line-up (`.sira`): the wall, the players in their clue order, each in a 64 column;
// the two buddies peek over its top from behind. On a narrower screen it scales as a whole; with
// more than five players the columns share the same span.
export function Lineup({
  faces,
  seats,
  peek,
}: {
  faces: Faces;
  seats: readonly LineupSeat[];
  peek: readonly [RisoBuddy, RisoBuddy];
}) {
  const shadowOff = useLabOff('golge');
  const { width: screen } = useWindowDimensions();
  const L = KR.lineup;
  const g = krotLineup(screen, seats.length);
  const d = risoDeck(screen);
  const shadow = shadowParts(shadowOff, L.shadow, undefined, L.radius * g.scale);
  return (
    <View style={{ width: g.width, height: d.peek.above + g.height, alignSelf: 'center' }}>
      <PeekPair
        peek={peek}
        height={d.peek.height}
        inset={L.peekInset * g.scale}
        rightDrop={d.peek.rightDrop}
      />
      <View
        style={{
          position: 'absolute',
          top: d.peek.above,
          left: 0,
          width: g.width,
          height: g.height,
          borderRadius: L.radius * g.scale,
          boxShadow: shadow.boxShadow,
        }}
      >
        {shadow.node}
        <View
          style={{
            width: L.width,
            height: L.height,
            borderRadius: L.radius,
            overflow: 'hidden',
            transformOrigin: 'left top',
            transform: [{ scale: g.scale }],
          }}
        >
          <Image
            source={krotArt.lineup}
            style={StyleSheet.absoluteFill}
            contentFit="fill"
            accessibilityIgnoresInvertColors
          />
          {seats.map((s, i) => (
            <Column
              key={s.sid}
              seat={s}
              faces={faces}
              left={g.colLeft + i * g.colWidth}
              width={g.colWidth}
              fit={g.fit}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function Column({
  seat,
  faces,
  left,
  width,
  fit,
}: {
  seat: LineupSeat;
  faces: Faces;
  left: number;
  width: number;
  fit: number;
}) {
  const { colors } = useTheme();
  const L = KR.lineup;
  const big = seat.mark !== 'normal';
  const size = (big ? L.big : L.avatar) * fit;
  const top = big ? L.bigTop : L.avatarTop;
  const grow = useGrow(size, top);
  const ring = seat.mark === 'speak' ? colors.signal : big ? colors.buzz : L.ringInk;
  const halo = seat.mark === 'speak' ? L.haloSignal : L.haloBuzz;
  const [plateBg, plateInk] =
    seat.mark === 'speak'
      ? [colors.signal, colors.onSignal]
      : big
        ? [colors.buzz, colors.onBuzz]
        : [L.plate.fill, L.ringInk];
  const dim = seat.dim ? [{ saturate: L.dim.saturate }, { brightness: L.dim.brightness }] : [];
  const body = (
    <View style={{ width, height: L.height }}>
      {seat.stamp ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: L.stamp.top,
            alignItems: 'center',
            transform: [{ rotate: L.stamp.turn }],
          }}
        >
          <Tag label={seat.stamp} colors={{ bg: colors.buzz, fg: colors.onBuzz }} />
        </View>
      ) : null}
      <Animated.View
        style={{
          position: 'absolute',
          left: (width - size) / 2,
          top,
          width: size,
          height: size,
          transform: [{ translateY: grow.y }, { scale: grow.scale }],
        }}
      >
        {seat.self ? (
          <View
            style={{
              position: 'absolute',
              left: -(L.dashOut + L.ring),
              top: -(L.dashOut + L.ring),
              width: size + 2 * (L.dashOut + L.ring),
              height: size + 2 * (L.dashOut + L.ring),
              borderRadius: size,
              borderWidth: L.ring,
              borderStyle: 'dashed',
              borderColor: L.ringInk,
            }}
          />
        ) : (
          <>
            {big ? (
              <View
                style={{
                  position: 'absolute',
                  left: -(L.ring + L.halo),
                  top: -(L.ring + L.halo),
                  width: size + 2 * (L.ring + L.halo),
                  height: size + 2 * (L.ring + L.halo),
                  borderRadius: size,
                  backgroundColor: halo,
                }}
              />
            ) : null}
            <View
              style={{
                position: 'absolute',
                left: -L.ring,
                top: -L.ring,
                width: size + 2 * L.ring,
                height: size + 2 * L.ring,
                borderRadius: size,
                backgroundColor: ring,
                boxShadow: big ? L.bigShadow : L.avatarShadow,
              }}
            />
          </>
        )}
        <View style={{ filter: dim }}>
          <Face faces={faces} sid={seat.sid} size={size} />
        </View>
        {seat.voted ? (
          <View style={{ position: 'absolute', right: -L.tick.out, top: -L.tick.out }}>
            <Pop>
              <View
                accessible
                accessibilityLabel={tr.krot.votedMark}
                style={{
                  width: L.tick.size,
                  height: L.tick.size,
                  borderRadius: L.tick.size / 2,
                  backgroundColor: colors.signal,
                  borderWidth: L.tick.ring,
                  borderColor: L.tick.ringInk,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CapIcon name="check" color={colors.onSignal} size={L.tick.icon} />
              </View>
            </Pop>
          </View>
        ) : null}
      </Animated.View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: L.plate.top - L.plate.edge,
          alignItems: 'center',
          filter: seat.dim ? [{ brightness: L.dim.plate }] : [],
        }}
      >
        <View
          style={{
            minWidth: L.plate.width + 2 * L.plate.edge,
            height: L.plate.height + 2 * L.plate.edge,
            borderRadius: L.plate.radius + L.plate.edge,
            backgroundColor: L.plateEdge,
            padding: L.plate.edge,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: L.plate.radius,
              backgroundColor: plateBg,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: PLATE_PAD,
            }}
          >
            <Text maxFontSizeMultiplier={1} style={[KT.plate, { color: plateInk }]}>
              {seat.plate}
            </Text>
          </View>
        </View>
      </View>
      <Text
        maxFontSizeMultiplier={MAX_FONT}
        style={[
          KT.name,
          {
            position: 'absolute',
            left: L.name.side,
            right: L.name.side,
            top: L.name.top,
            minHeight: L.name.minHeight,
            color: L.ringInk,
            textAlign: 'center',
            textShadowColor: L.nameShadow.color,
            textShadowOffset: { width: 0, height: L.nameShadow.y },
            textShadowRadius: L.nameShadow.blur,
          },
        ]}
      >
        {nameOf(faces, seat.sid)}
      </Text>
    </View>
  );
  return (
    <View style={{ position: 'absolute', left, top: 0 }}>
      {seat.onPress ? (
        <Pressable
          testID={`krot-seat-${seat.sid}`}
          accessibilityRole="button"
          accessibilityLabel={seat.label}
          accessibilityState={{ selected: seat.mark === 'sel' }}
          onPress={seat.onPress}
        >
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={seat.label}>
          {body}
        </View>
      )}
    </View>
  );
}
const PLATE_PAD = 6;

// A face growing to the speaker's or the chosen size (or back): drawn at its new size, it starts
// at the old one and settles on the swap curve (hareket.json → curves.swap). At once with reduce
// motion.
function useGrow(size: number, top: number) {
  const reduce = useReduceMotion();
  const was = useRef({ size, top });
  const [scale] = useState(() => new Animated.Value(1));
  const [y] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const from = was.current;
    was.current = { size, top };
    if (reduce || (from.size === size && from.top === top)) return undefined;
    scale.setValue(from.size / size);
    y.setValue(from.top + from.size / 2 - (top + size / 2));
    const curve = Easing.bezier(...MOTION.curves.swap);
    const anim = Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: KR.swapMs,
        easing: curve,
        useNativeDriver: true,
      }),
      Animated.timing(y, { toValue: 0, duration: KR.swapMs, easing: curve, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [size, top, reduce, scale, y]);
  return { scale, y };
}

// ------------------------------------------------------------------ the rows under it

// A glass row under the line-up (`.nx`): Sıradaki's face and words.
export function NextRow({ faces, sid }: { faces: Faces; sid: string }) {
  const { c } = useKit();
  return (
    <Glass
      radius={KR.row.radius}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: KR.row.gap,
        paddingVertical: KR.row.padY,
        paddingHorizontal: KR.row.padX,
      }}
    >
      <Face faces={faces} sid={sid} size={KR.row.face} />
      <Text style={{ flex: 1 }} maxFontSizeMultiplier={MAX_FONT}>
        <T v="fine" color={c.ink}>
          {tr.krot.next}
        </T>
        <T v="fine" strong color={c.ink}>
          {nameOf(faces, sid)}
        </T>
      </Text>
    </Glass>
  );
}

// The vote's row (`.kw`): the category at the left, the word at the right for whoever knows it.
export function WordRow({ category, word }: { category: string; word: ReactNode }) {
  return (
    <Glass
      radius={KR.row.radius}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: KR.row.gap,
        paddingVertical: KR.row.kwPadY,
        paddingHorizontal: KR.row.padX,
      }}
    >
      <View style={{ flexShrink: 1 }}>
        <Eyebrow>{tr.krot.categoryLabel}</Eyebrow>
        <T v="h3">{category}</T>
      </View>
      {word}
    </Glass>
  );
}

// Sonuç's impostor card: "Sahtekar", each impostor's face and name, "Yakalandı" or "Kaçtı".
export function ImpostorCard({
  faces,
  caught,
  escaped,
}: {
  faces: Faces;
  caught: readonly string[];
  escaped: readonly string[];
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  const rows = [
    ...caught.map((sid) => ({ sid, caught: true })),
    ...escaped.map((sid) => ({ sid, caught: false })),
  ];
  return (
    <Glass
      radius={KR.row.radius}
      style={{ padding: KR.result.pad, gap: KR.result.gap, alignItems: 'center' }}
    >
      <Eyebrow>{tr.krot.impostor}</Eyebrow>
      {rows.map((r) => (
        <View key={r.sid} style={{ alignItems: 'center', gap: KR.result.gap }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: KR.result.nameGap }}>
            <Face faces={faces} sid={r.sid} size={KR.result.face} />
            <T v="title">{nameOf(faces, r.sid)}</T>
          </View>
          <Tag
            label={r.caught ? tr.krot.caught : tr.krot.escaped}
            colors={
              r.caught
                ? { bg: colors.buzz, fg: colors.onBuzz }
                : { bg: c.raised, fg: c.ink, edge: c.raisedEdge }
            }
          />
        </View>
      ))}
    </Glass>
  );
}

// Said once a face is held: what the card says, for screen readers (the face is never on screen
// otherwise).
export function announceRole(view: SahtekarView | undefined) {
  if (!view || view.role === null) return;
  AccessibilityInfo.announceForAccessibility(
    view.role === 'impostor'
      ? `${tr.krot.youAreImpostor}. ${tr.krot.category(view.category)}`
      : `${view.word}. ${tr.krot.category(view.category)}`,
  );
}
