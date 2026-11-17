import { upperTr } from '@shared/trText.ts';
import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { PixelRatio, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AuraBackground } from '@/aura/AuraBackground';
import { Round, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { RISO as R } from '@/theme/riso';
import {
  SPRENGJA_BOARD as B,
  SPRENGJA_BOARD_RING,
  SPRENGJA_BOARD_TYPE as BT,
} from '@/theme/sprengja';
import { useTheme } from '@/theme/ThemeProvider';

import { StageFit } from '../GameStage';
import { Face, type Faces, nameOf } from '../riso/RisoParts';
import { sprengjaArt } from './sprengjaArt';
import { BarSlot, Cover } from './SprengjaParts';
import type { ScoreRow } from './sprengjaView';

// Sprengja's two yeni arayüz boards: SprengjaBomba (bomba sende) and SprengjaSonuc (oyun sonu).
// No time shows on either (K-85): the head's "Süre gizli" is a plain label; it steps under the head
// when the width or the text size is short.

export type BarClose = { label: string; onPress: () => void; testID: string };

// The head (`.gt`): the close, the game's poster, the title over its line, and the chat at the
// right. It sits 16 from the sides, so it steps 4 out of the page's 20.
export function SprengjaHead({
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
  const { width } = useWindowDimensions();
  const { colors, scheme } = useTheme();
  const { c } = useKit();
  const under = width < H.narrow || PixelRatio.getFontScale() > H.bigText;
  // "Süre gizli" (`.tmr.nt`): a plain label, no time, bar or motion (K-85).
  const pill = (
    <View
      style={{
        height: H.pillHeight,
        borderRadius: H.pillHeight / 2,
        paddingHorizontal: H.pillPadX,
        justifyContent: 'center',
        backgroundColor: colors.surface,
        boxShadow:
          scheme === 'dark' ? `inset 0px 0px 0px 1px ${SPRENGJA_BOARD_RING}` : c.raisedShadow,
      }}
    >
      <Text maxFontSizeMultiplier={1} style={[BT.hiddenTime, { color: c.muted }]}>
        {tr.sprengja.hiddenTime}
      </Text>
    </View>
  );
  const row = (
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
        source={sprengjaArt.poster}
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
      {under ? null : pill}
      {right}
    </View>
  );
  if (!under) return row;
  return (
    <View>
      {row}
      <View style={{ alignItems: 'flex-end', marginTop: H.gap }}>{pill}</View>
    </View>
  );
}

// The page of the two boards: the head on top, the stage in the middle (it scrolls only when it
// does not fit), the actions at the foot over the navigation bar. `cover` lies over all of it but
// the head (the connection error).
export function BoardPage({
  testID,
  head,
  children,
  actions,
  cover,
}: {
  testID: string;
  head: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  cover?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={{ flex: 1 }}>
      <AuraBackground />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + R.footBottom,
          paddingHorizontal: KIT.size.side,
        }}
      >
        <StageFit status={<BarSlot top={head} covered={!!cover} />} actions={actions}>
          <View style={{ flexGrow: 1, justifyContent: 'center', gap: B.gap }}>{children}</View>
        </StageFit>
      </View>
      <Cover cover={cover} top={head} />
    </View>
  );
}

// The bomb of the card (`svg.bi`, 96 grid); in the dark the body and the fuse are ringed in the ink.
function BombDrawing({ size }: { size: number }) {
  const { colors, scheme } = useTheme();
  const D = B.bomb;
  const ring = scheme === 'dark' ? { stroke: colors.text, strokeWidth: D.darkRing } : {};
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityElementsHidden>
      <Circle cx={44} cy={56} r={32} fill={D.body} {...ring} />
      <Circle cx={34} cy={46} r={8} fill={D.shine} opacity={D.shineOpacity} />
      <Rect
        x={58}
        y={16}
        width={16}
        height={16}
        rx={4}
        transform="rotate(35 66 24)"
        fill={D.body}
        {...ring}
      />
      <Path
        d="M72 18 q8 -10 16 -6"
        stroke={D.rope}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M88 6 l3 6 6 1 -5 4 1 6 -5-3 -5 3 1-6 -5-4 6-1z" fill={D.spark} />
    </Svg>
  );
}

// The bomb card (`.card.bomb`): the bomb, "HARF GRUBU", the group and the line to say.
export function BombCard({ letters, note }: { letters: string; note: string }) {
  const { colors, scheme } = useTheme();
  const { c } = useKit();
  const K = B.card;
  return (
    <View
      style={{
        alignItems: 'center',
        borderRadius: K.radius,
        paddingVertical: K.padY,
        paddingHorizontal: K.padX,
        backgroundColor: colors.surface,
        boxShadow:
          scheme === 'dark' ? `inset 0px 0px 0px 1px ${SPRENGJA_BOARD_RING}` : c.glassShadow,
      }}
    >
      <View style={{ marginTop: K.bombTop }}>
        <BombDrawing size={K.bomb} />
      </View>
      <Text maxFontSizeMultiplier={1.3} style={[BT.kick, { color: c.muted, marginTop: 0 }]}>
        {upperTr(tr.sprengja.group)}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        maxFontSizeMultiplier={1}
        style={[
          BT.group,
          { color: c.ink, marginTop: K.groupY, marginBottom: K.groupBottom, maxWidth: '100%' },
        ]}
      >
        {upperTr(letters)}
      </Text>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[BT.note, { color: c.muted, textAlign: 'center', marginTop: K.noteTop }]}
      >
        {note}
      </Text>
    </View>
  );
}

// "ATIŞ SIRASI · SAAT YÖNÜNDE" over the throwing order (`.order`): faces over their names, the
// holder (this person) first on the surface with a ring; those who left dimmed.
export function ThrowOrder({
  faces,
  order,
  gone,
  first,
}: {
  faces: Faces;
  order: readonly string[];
  gone: readonly string[];
  first: string | null;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  const O = B.order;
  return (
    <View style={{ gap: B.gap }}>
      <Text maxFontSizeMultiplier={1.3} style={[BT.section, { color: c.muted }]}>
        {upperTr(`${tr.sprengja.order} · ${tr.sprengja.clockwise}`)}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: O.gap }}
      >
        {order.map((sid) => {
          const on = sid === first;
          return (
            <View
              key={sid}
              accessible
              accessibilityLabel={
                gone.includes(sid) ? tr.sprengja.seatOut(nameOf(faces, sid)) : nameOf(faces, sid)
              }
              style={{
                width: O.chip,
                alignItems: 'center',
                gap: O.nameGap,
                paddingVertical: O.padY,
                paddingHorizontal: O.padX,
                borderRadius: O.radius,
                backgroundColor: on ? colors.surface : undefined,
                boxShadow: on ? `inset 0px 0px 0px ${O.ring}px ${colors.text}` : undefined,
                opacity: gone.includes(sid) ? O.offOpacity : 1,
              }}
            >
              <Face faces={faces} sid={sid} size={O.face} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                maxFontSizeMultiplier={1.3}
                style={[BT.chipName, { color: colors.text, maxWidth: '100%' }]}
              >
                {nameOf(faces, sid)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// "Atışlar · 7" over the foot's button (`.hint`).
export function BoardHint({ children }: { children: string }) {
  return (
    <T v="fine" center style={BT.hint}>
      {children}
    </T>
  );
}

// The result's heading (`.rs-h`): who won over the note.
export function ResultHeading({ title, note }: { title: string; note: string }) {
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

// A score row (`.rr`): the face, the name over how often the bomb went off, the points (a winner's
// in the accent); the hairline between rows from the name; one who left dimmed.
export function ResultRow({
  faces,
  row,
  first,
  winner,
}: {
  faces: Faces;
  row: ScoreRow;
  first: boolean;
  winner: boolean;
}) {
  const { colors } = useTheme();
  const { c } = useKit();
  const E = B.end;
  const blasts = row.hits === 0 ? tr.sprengja.none : tr.sprengja.blasts(row.hits);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: E.rowGap,
        minHeight: E.rowMin,
        opacity: row.out ? B.outOpacity : 1,
      }}
    >
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
      <Face faces={faces} sid={row.sid} size={E.face} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text maxFontSizeMultiplier={1.3} style={[BT.rowName, { color: c.ink }]}>
          {nameOf(faces, row.sid)}
        </Text>
        <Text maxFontSizeMultiplier={1.3} style={[BT.rowSub, { color: c.muted }]}>
          {row.out ? tr.sprengja.outHits(row.hits) : blasts}
        </Text>
      </View>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[BT.rowPoints, { color: winner ? colors.accent : c.ink }]}
      >
        {tr.sprengja.points(row.hits)}
      </Text>
    </View>
  );
}
