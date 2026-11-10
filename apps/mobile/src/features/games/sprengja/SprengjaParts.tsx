import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AuraBackground } from '@/aura/AuraBackground';
import { Btn, Glass, T, Tag, useKit } from '@/aura/kit';
import { CachedSvg } from '@/components/CachedSvg';
import { Sheet } from '@/components/Sheet';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { KROT } from '@/theme/krot';
import { RISO as R, RISO_PANEL_WIDTH } from '@/theme/riso';
import { SPRENGJA as S, SPRENGJA_TYPE as ST, type SprengjaRing } from '@/theme/sprengja';
import { useTheme } from '@/theme/ThemeProvider';
import { BRAND } from '@/theme/brand';
import { ScreenStatusBar } from '@/components/StatusScrim';

import { Buddy, Face, type Faces, nameOf, useRisoDeck } from '../riso/RisoParts';
import type { RisoBuddy } from '../riso/risoArt';
import { Eyebrow } from '../sahtekar/KrotParts';
import { sprengjaArt } from './sprengjaArt';
import { arcPath, onCircle, type RingSeat, type ScoreRow } from './sprengjaView';

// Sprengja's parts (Aura v99): the page, the table ring with its seats, the throw's arc and the
// bomb, the letter-group panel, the card's face, the score table, the rules sheet, the scenes and
// the connection error.

const MAX_FONT = 1.3;

// ------------------------------------------------------------------ the page

// The page of every running screen: the bar, the heading (`.hd`) and what follows it, which scrolls
// only when it does not fit; the foot over the navigation bar (34 from the panel's bottom). `cover`
// lies over all of it but the bar (the connection error).
export function PlayPage({
  testID,
  top,
  title,
  note,
  children,
  foot,
  cover,
  under,
}: {
  testID: string;
  top: ReactNode;
  title?: string;
  note?: string;
  children: ReactNode;
  foot?: ReactNode;
  cover?: ReactNode;
  // Under everything (Patladı's flash).
  under?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={{ flex: 1 }}>
      <AuraBackground />
      {under}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + R.footBottom,
          paddingHorizontal: KIT.size.side,
        }}
      >
        <BarSlot top={top} covered={!!cover} />
        <ScrollView
          style={{ flex: 1 }}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingTop: R.gap }}
        >
          {title ? (
            <View
              style={{ minHeight: S.head.minHeight, paddingBottom: S.head.below, gap: S.head.gap }}
            >
              <T v="title" accessibilityRole="header">
                {title}
              </T>
              {note ? <T v="fine">{note}</T> : null}
            </View>
          ) : null}
          {children}
        </ScrollView>
        {foot ? <View style={{ gap: R.gap, marginTop: R.gap }}>{foot}</View> : null}
      </View>
      <Cover cover={cover} top={top} />
    </View>
  );
}

// The bar in its place; while a cover lies over the screen it is drawn again over the cover (the
// close stays at hand, as in VampirHata) and its place keeps the room.
export function BarSlot({ top, covered }: { top: ReactNode; covered: boolean }) {
  return covered ? (
    <View
      style={{ opacity: 0 }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {top}
    </View>
  ) : (
    <>{top}</>
  );
}

export function Cover({ cover, top }: { cover: ReactNode; top: ReactNode }) {
  const insets = useSafeAreaInsets();
  if (!cover) return null;
  return (
    <>
      {cover}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: KIT.size.side,
          right: KIT.size.side,
          top: insets.top,
          zIndex: 31,
        }}
      >
        {top}
      </View>
    </>
  );
}

// A line under the ring's panel or the deck (`.mid .fine`).
export function MidNote({ children, gap }: { children: string; gap: number }) {
  return (
    <View style={{ marginTop: gap }}>
      <T v="fine" center>
        {children}
      </T>
    </View>
  );
}

// ------------------------------------------------------------------ the ring

export type SeatMark = 'hold' | 'next' | null;

// The table ring (`.ring`): the b-masa picture, the seats round it, the throw's arc from the holder
// to the next one, and the bomb: in its middle when it is the caller's, in front of the holder
// otherwise.
export function Ring({
  faces,
  seats,
  ring,
  holder,
  next,
  mine,
}: {
  faces: Faces;
  seats: readonly RingSeat[];
  ring: SprengjaRing;
  holder: string | null;
  next: string | null;
  // The bomb is the caller's.
  mine: boolean;
}) {
  const { colors } = useTheme();
  const side = ring.side;
  const centre = side / 2;
  const k = side / S.wide.side;
  const angle = (sid: string | null) => seats.find((s) => s.sid === sid)?.angle;
  const from = angle(holder);
  const to = angle(next);
  const B = S.bombSmall;
  const at = from === undefined ? null : onCircle(from, ring.radius * B.at, centre);
  return (
    <View
      style={{
        width: side,
        height: side,
        alignSelf: 'center',
        borderRadius: S.ring.radius,
        boxShadow: S.ring.shadow,
      }}
    >
      <Image
        source={sprengjaArt.table}
        style={[StyleSheet.absoluteFill, { borderRadius: S.ring.radius }]}
        contentFit="fill"
        accessibilityIgnoresInvertColors
      />
      {from !== undefined && to !== undefined ? (
        <Svg
          width={side}
          height={side}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Path
            d={arcPath(from, to, ring.radius * S.arc.at, centre)}
            fill="none"
            stroke={colors.signal}
            strokeWidth={S.arc.width}
            strokeLinecap="round"
            strokeDasharray={S.arc.dash}
          />
          <Circle
            {...circleAt(onCircle(to, ring.radius * S.arc.at, centre))}
            r={S.arc.dot}
            fill={colors.signal}
            stroke={S.arc.dotEdgeInk}
            strokeWidth={S.arc.dotEdge}
          />
        </Svg>
      ) : null}
      {holder && mine ? (
        <BombPicture
          label={tr.sprengja.withYou}
          shadow={S.bombShadow}
          style={{
            left: centre - ring.bomb.width / 2,
            top: ring.bomb.top,
            width: ring.bomb.width,
            height: ring.bomb.height,
          }}
        />
      ) : holder && at ? (
        <BombPicture
          label={tr.sprengja.withOther(nameOf(faces, holder))}
          shadow={S.bombSmallShadow}
          style={{
            left: at.x - (B.width * k) / 2,
            top: at.y - B.lift * k,
            width: B.width * k,
            height: B.height * k,
            zIndex: 3,
          }}
        />
      ) : null}
      {seats.map((s) => (
        <Seat
          key={s.sid}
          faces={faces}
          seat={s}
          ring={ring}
          mark={s.out ? null : s.sid === holder ? 'hold' : s.sid === next ? 'next' : null}
        />
      ))}
    </View>
  );
}
const circleAt = (p: { x: number; y: number }) => ({ cx: p.x, cy: p.y });

function BombPicture({
  label,
  shadow,
  style,
}: {
  label: string;
  shadow: { y: number; blur: number; color: string };
  style: ViewStyle;
}) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[
        {
          position: 'absolute',
          filter: [
            {
              dropShadow: {
                offsetX: 0,
                offsetY: shadow.y,
                standardDeviation: shadow.blur / 2,
                color: shadow.color,
              },
            },
          ],
        },
        style,
      ]}
    >
      <Image
        source={sprengjaArt.bomb}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

// A seat (`.seat`): the face on the circle, the name's pill 4 under it. The holder in --buzz, the
// next one in --signal, the caller dashed; one who left grey with the name struck through. The name
// is one line, cut at the panel's width (Android fades its end); screen readers hear it whole.
function Seat({
  faces,
  seat,
  ring,
  mark,
}: {
  faces: Faces;
  seat: RingSeat;
  ring: SprengjaRing;
  mark: SeatMark;
}) {
  const { colors } = useTheme();
  const p = onCircle(seat.angle, ring.radius, ring.side / 2);
  const name = nameOf(faces, seat.sid);
  const me = seat.sid === faces.me;
  const L = S.label;
  const ringShadow = seat.out
    ? `0px 0px 0px ${S.seatRing}px ${S.out.ring}`
    : mark === 'hold'
      ? `0px 0px 0px ${S.seatRing}px ${colors.buzz}, 0px 0px 0px ${S.holdHalo}px ${S.holdHaloColor}, ${S.holdShadow}`
      : mark === 'next'
        ? `0px 0px 0px ${S.seatRing}px ${colors.signal}, ${S.seatShadow}`
        : `0px 0px 0px ${S.seatRing}px ${S.seatInk}, ${S.seatShadow}`;
  const fill = seat.out
    ? L.outFill
    : mark === 'hold'
      ? colors.buzz
      : mark === 'next'
        ? colors.signal
        : L.fill;
  const ink = seat.out
    ? L.outInk
    : mark === 'hold'
      ? colors.onBuzz
      : mark === 'next'
        ? colors.onSignal
        : S.seatInk;
  const text = (
    <Text
      maxFontSizeMultiplier={MAX_FONT}
      numberOfLines={Platform.OS === 'ios' ? 1 : undefined}
      style={[ST.seat, { color: ink, textDecorationLine: seat.out ? 'line-through' : 'none' }]}
    >
      {name}
    </Text>
  );
  return (
    <View
      accessible
      accessibilityLabel={seat.out ? tr.sprengja.seatOut(name) : name}
      style={{
        position: 'absolute',
        left: p.x - S.seat.width / 2,
        top: p.y - ring.face / 2,
        width: S.seat.width,
        alignItems: 'center',
        gap: S.seat.gap,
        zIndex: mark === 'hold' ? 2 : 1,
      }}
    >
      <View
        style={{
          width: ring.face,
          height: ring.face,
          borderRadius: ring.face / 2,
          boxShadow: ringShadow,
          ...(me
            ? {
                outlineColor: S.seatInk,
                outlineWidth: S.seatRing,
                outlineStyle: 'dashed' as const,
                outlineOffset: S.dashOut,
              }
            : null),
        }}
      >
        <View
          style={seat.out ? { filter: [{ grayscale: 1 }, { brightness: S.out.brightness }] } : null}
        >
          <Face faces={faces} sid={seat.sid} size={ring.face} />
        </View>
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          maxWidth: ring.label,
          borderRadius: L.radius,
          paddingVertical: L.padY,
          paddingHorizontal: L.padX,
          backgroundColor: fill,
        }}
      >
        {Platform.OS === 'android' ? (
          <ScrollView
            horizontal
            pointerEvents="none"
            scrollEnabled={false}
            style={{ flexGrow: 0 }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            fadingEdgeLength={{ start: 0, end: L.fade }}
          >
            {text}
          </ScrollView>
        ) : (
          text
        )}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ the panel

// The letter-group panel (`.hp`): "HARF GRUBU" over the group │ "Atışlar · n" on one line; under
// them "Kelime kuralları".
export function LetterPanel({
  letters,
  passes,
  onRules,
}: {
  letters: string;
  passes: number;
  onRules: () => void;
}) {
  const { c } = useKit();
  const P = S.panel;
  return (
    <Glass
      radius={P.radius}
      style={{ paddingVertical: P.padY, paddingHorizontal: P.padX, gap: P.gap }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: P.lineGap }}>
        <View>
          <Eyebrow>{tr.sprengja.group}</Eyebrow>
          <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.group, { color: c.ink }]}>
            {upperTr(letters)}
          </Text>
        </View>
        <View style={{ width: KIT.size.hair, alignSelf: 'stretch', backgroundColor: c.hair }} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
          style={[ST.throws, { color: c.ink, flex: 1 }]}
        >
          {tr.sprengja.throws(passes)}
        </Text>
      </View>
      <Btn
        sm
        block
        variant="glassy"
        icon="info"
        testID="sprengja-rules"
        label={tr.sprengja.rules}
        onPress={onRules}
      />
    </Glass>
  );
}

// ------------------------------------------------------------------ the card

// The open card's face (`.card.hece`): the b-hece picture, "HARF GRUBU" in its yellow band and the
// group in its pink medallion, scaled with the deck.
export function CardFace({ letters }: { letters: string }) {
  const d = useRisoDeck();
  const z = (n: number) => n * d.scale;
  const F = S.face;
  return (
    <View
      style={StyleSheet.absoluteFill}
      accessible
      accessibilityRole="image"
      accessibilityLabel={tr.sprengja.cardOpen(upperTr(letters))}
    >
      <Image
        source={sprengjaArt.syllable}
        style={[StyleSheet.absoluteFill, { borderRadius: d.card.radius }]}
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
          style={[ST.kick, { color: F.ink }]}
        >
          {upperTr(tr.sprengja.kick)}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: z(F.syllable.top),
          height: z(F.syllable.height),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
          style={[ST.syllable, { color: F.ink, transform: [{ scale: d.scale }] }]}
        >
          {upperTr(letters)}
        </Text>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ the bomb mark

// The `bomb` capsule icon (Aura v99: the score rows' bombs), in --buzz.
export function BombMark({ size, color }: { size: number; color: string }) {
  const M = S.bombMark;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...M.body} fill={color} opacity={M.soft} />
      <Rect
        x={M.fuse.x}
        y={M.fuse.y}
        width={M.fuse.width}
        height={M.fuse.height}
        rx={M.fuse.rx}
        transform={M.fuse.turn}
        fill={color}
      />
      <Circle {...M.spark} fill={color} />
    </Svg>
  );
}

// ------------------------------------------------------------------ the scores

// The score table (`.tbl`): face, name (with "Bu tur" or "çıktı"), the bombs or "Hiç", the points;
// `lose` in --buzz.
export function ScoreTable({
  faces,
  rows,
  lose,
  thisRound,
}: {
  faces: Faces;
  rows: readonly ScoreRow[];
  lose: ReadonlySet<string>;
  // The one the round's bomb went off with ("Bu tur").
  thisRound?: string | null;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  const T_ = S.table;
  return (
    <Glass radius={T_.radius} style={{ paddingVertical: T_.padY, paddingHorizontal: T_.padX }}>
      {rows.map((row, i) => (
        <View
          key={row.sid}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: T_.gap,
            paddingVertical: T_.rowPadY,
            borderTopWidth: i === 0 ? 0 : KIT.size.hair,
            borderTopColor: c.hair,
            opacity: row.out ? T_.outOpacity : 1,
          }}
        >
          <Face faces={faces} sid={row.sid} size={T_.face} />
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: T_.tagGap,
            }}
          >
            <Text
              maxFontSizeMultiplier={MAX_FONT}
              style={[ST.row, { color: c.ink, flexShrink: 1 }]}
            >
              {nameOf(faces, row.sid)}
            </Text>
            {row.out ? (
              <Tag
                label={tr.sprengja.out}
                colors={{ bg: c.raised, fg: c.muted, edge: c.raisedEdge }}
              />
            ) : row.sid === thisRound ? (
              <Tag label={tr.sprengja.thisRound} colors={{ bg: colors.buzz, fg: colors.onBuzz }} />
            ) : null}
          </View>
          <View
            accessible
            accessibilityLabel={tr.sprengja.blasts(row.hits)}
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: T_.bombGap }}
          >
            {row.hits === 0 ? (
              <T v="fine">{tr.sprengja.none}</T>
            ) : (
              Array.from({ length: row.hits }, (_, j) => (
                <BombMark key={j} size={T_.bomb} color={colors.buzz} />
              ))
            )}
          </View>
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[
              ST.points,
              {
                minWidth: T_.points,
                textAlign: 'right',
                color: lose.has(row.sid) ? colors.buzz : c.ink,
              },
            ]}
          >
            {tr.sprengja.points(row.hits)}
          </Text>
        </View>
      ))}
    </Glass>
  );
}

// ------------------------------------------------------------------ the rules

// Kelime kuralları (SprengjaKurallar): SPEC 4.6.8's six rules, the examples bold; Tamam.
export function RulesSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useKit();
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={tr.sprengja.rules}
      subtitle={tr.sprengja.rulesNote}
      footer={<Btn block testID="sprengja-rules-ok" label={tr.sprengja.ok} onPress={onClose} />}
    >
      <View style={{ gap: S.rules.gap }}>
        {tr.sprengja.ruleList.map((parts, i) => (
          <View
            key={i}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: S.rules.gap }}
          >
            <View
              style={{
                width: S.rules.no,
                height: S.rules.no,
                borderRadius: S.rules.no / 2,
                backgroundColor: c.raised,
                borderWidth: KIT.size.edge,
                borderColor: c.raisedEdge,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.ruleNo, { color: c.ink }]}>
                {i + 1}
              </Text>
            </View>
            <Text maxFontSizeMultiplier={MAX_FONT} style={[ST.rule, { color: c.ink, flex: 1 }]}>
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <Text key={j} style={ST.ruleBold}>
                    {part}
                  </Text>
                ) : (
                  part
                ),
              )}
            </Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

// ------------------------------------------------------------------ the scenes

// The picture over Tur sonu and the end (`.scene.bp`, `.scene.bm`): 36 round at the foot, its top
// shaded; what it holds placed from the panel's top.
export function Scene({
  source,
  height,
  children,
}: {
  source: number;
  height: number;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const sceneTop = insets.top - R.statusBar;
  const SC = S.scene;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: height + sceneTop,
        overflow: 'hidden',
        borderBottomLeftRadius: SC.radius,
        borderBottomRightRadius: SC.radius,
      }}
    >
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: SC.shade + sceneTop,
          ...gradientStyle(`linear-gradient(180deg, ${SC.shadeFrom}, transparent)`),
        }}
      />
      {/* Light icons on the scene's shade (audit M15-12). */}
      <ScreenStatusBar style="light" />
      {children ? (
        <View style={[StyleSheet.absoluteFill, { top: sceneTop }]}>{children}</View>
      ) : null}
    </View>
  );
}

// The page under a scene: the bar, the words from `content` down the panel, the foot at the end.
export function ScenePage({
  testID,
  scene,
  content,
  top,
  children,
  foot,
  cover,
}: {
  testID: string;
  scene: ReactNode;
  content: number;
  top: ReactNode;
  children: ReactNode;
  foot: ReactNode;
  cover?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={{ flex: 1 }}>
      <AuraBackground />
      {scene}
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top,
          paddingHorizontal: KIT.size.side,
          paddingBottom: insets.bottom + R.footBottom,
          gap: R.gap,
        }}
      >
        <BarSlot top={top} covered={!!cover} />
        <View style={{ height: content - R.barBottom - 2 * R.gap }} />
        {children}
        <View style={{ flexGrow: 1 }} />
        {foot}
      </ScrollView>
      <Cover cover={cover} top={top} />
    </View>
  );
}

// The confetti and the two buddies of the end's scene, scaled across with the screen.
export function EndDecor({ confetti }: { confetti: boolean }) {
  const { width } = useWindowDimensions();
  const k = Math.min(1, width / RISO_PANEL_WIDTH);
  const E = KROT.end;
  return (
    <>
      {confetti
        ? E.confetti.map((b, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: b.left * k,
                top: b.top,
                width: E.bar.width,
                height: E.bar.height,
                borderRadius: E.bar.radius,
                backgroundColor: b.color,
                transform: [{ rotate: b.turn }],
              }}
            />
          ))
        : null}
      {S.endBuddies.map((p) => (
        <Buddy
          key={p.buddy}
          buddy={p.buddy as RisoBuddy}
          height={p.height * k}
          style={{
            bottom: -p.below * k,
            ...('left' in p ? { left: p.left * k } : { right: p.right * k }),
          }}
        />
      ))}
    </>
  );
}

// The winners (or those left) over the end's scene: one 72 in --signal; two 64, more 56, everyone
// 48, overlapping and ringed in #141016.
export function HeroFaces({
  faces,
  sids,
  size,
  overlap,
  lead,
}: {
  faces: Faces;
  sids: readonly string[];
  size: number;
  overlap: number;
  // The one winner, in --signal.
  lead?: boolean;
}) {
  const { colors } = useTheme();
  const H = S.hero;
  if (lead && sids.length === 1) {
    return (
      <View
        style={{
          borderRadius: H.one / 2,
          boxShadow: `0px 0px 0px ${H.oneRing}px ${colors.signal}, ${H.oneShadow}`,
        }}
      >
        <Face faces={faces} sid={sids[0] as string} size={H.one} />
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row' }}>
      {sids.map((sid, i) => (
        <View
          key={sid}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            borderRadius: size / 2,
            boxShadow: `0px 0px 0px ${H.ring}px ${H.ringInk}`,
          }}
        >
          <Face faces={faces} sid={sid} size={size} />
        </View>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ the connection error

// The connection error over the last screen (Aura VampirHata `.err` in the game's colours): the
// screen dimmed, the glass card with the mark, "Bir şeyler ters gitti" and Tekrar dene.
export function ErrorCover({ retrying, onRetry }: { retrying: boolean; onRetry: () => void }) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const E = S.error;
  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', zIndex: 30 }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: S.dim[scheme] }]} />
      <Glass
        radius={E.radius}
        style={{
          marginHorizontal: E.side,
          paddingTop: E.padTop,
          paddingHorizontal: E.padX,
          paddingBottom: E.padBottom,
          alignItems: 'center',
          gap: E.gap,
        }}
      >
        <View accessibilityRole="alert" style={{ alignItems: 'center', gap: E.gap }}>
          <CachedSvg xml={ERROR_MARK} width={E.mark} height={E.mark} />
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[ST.error, { color: c.ink, textAlign: 'center' }]}
          >
            {tr.common.genericError}
          </Text>
        </View>
        <Btn
          sm
          variant="glassy"
          testID="sprengja-retry"
          label={tr.common.retry}
          loading={retrying}
          onPress={onRetry}
        />
      </Glass>
    </View>
  );
}
const ERROR_MARK = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="7" width="11" height="26" rx="5.5" fill="${BRAND.purple}"/><rect x="20" y="9" width="11" height="26" rx="5.5" fill="${BRAND.pink}"/></svg>`;
