import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, type TextStyle, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, Round, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { Tap } from '@/motion/Tap';
import { KIT } from '@/theme/auraKit';
import { KROT_BOARD as B, KROT_BOARD_TYPE as TY } from '@/theme/krot';
import { useTheme } from '@/theme/ThemeProvider';

import { type Faces, Face, nameOf, type StageClock, useStageClock } from '../riso/RisoParts';
import { krotArt } from './krotArt';

// Krot's İpucu turu and Oyun sonu in the new interface's look (yeni arayüz tuvali, KrotIpucu,
// KrotSonuc). Only these two moments are drawn this way; the other phases keep the riso look.

const MAX_FONT = 1.3;

// A line of the board's own type, in the kit's ink or muted.
function Txt({
  type,
  muted,
  center,
  fit,
  children,
  accessibilityRole,
}: {
  type: TextStyle;
  muted?: boolean;
  center?: boolean;
  // One line, shrinking to fit rather than ending in "…".
  fit?: boolean;
  children: ReactNode;
  accessibilityRole?: 'header';
}) {
  const { c } = useKit();
  return (
    <Text
      accessibilityRole={accessibilityRole}
      maxFontSizeMultiplier={MAX_FONT}
      numberOfLines={fit ? 1 : undefined}
      adjustsFontSizeToFit={fit}
      minimumFontScale={fit ? 0.5 : undefined}
      style={[type, { color: muted ? c.muted : c.ink, textAlign: center ? 'center' : undefined }]}
    >
      {children}
    </Text>
  );
}

// The phase's time (`.tmr`): the clock's icon and the seconds, in --buzz in the last 10.
function TimerPill({ clock }: { clock: StageClock }) {
  const { c } = useKit();
  const { colors } = useTheme();
  const now = useStageClock(clock);
  const T = B.timer;
  return (
    <Glass
      radius={T.height / 2}
      style={{
        height: T.height,
        paddingLeft: T.padLeft,
        paddingRight: T.padRight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: T.gap,
      }}
    >
      <View accessible accessibilityRole="timer" accessibilityLabel={now.label}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: T.gap }}>
          <CapIcon
            name="clock"
            color={now.late ? colors.buzz : c.ink}
            second={c.muted}
            size={T.icon}
          />
          <Text
            maxFontSizeMultiplier={1}
            style={[TY.timer, { color: now.late ? colors.buzz : c.ink }]}
          >
            {now.text}
          </Text>
        </View>
      </View>
    </Glass>
  );
}

// The bar (`.gt`): the close, the game's picture, the title and the game's name under it, then
// the timer or the chat. It sits 16 from the sides (the body 20): `side` is the page's.
export function KrotBar({
  close,
  title,
  clock,
  onChat,
}: {
  close: { label: string; onPress: () => void; testID: string };
  title: string;
  clock?: StageClock;
  onChat?: () => void;
}) {
  const H = B.bar;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: H.gap,
        marginHorizontal: -(KIT.size.side - H.side),
      }}
    >
      <Round icon="close" label={close.label} onPress={close.onPress} testID={close.testID} />
      <Image
        source={krotArt.poster}
        style={{ width: H.posterW, height: H.posterH, borderRadius: H.posterRadius }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt type={TY.barTitle} fit accessibilityRole="header">
          {title}
        </Txt>
        <Txt type={TY.barLine} muted>
          {tr.krot.name}
        </Txt>
      </View>
      {clock ? <TimerPill clock={clock} /> : null}
      {onChat ? <Round icon="chat" label={tr.games.chat} onPress={onChat} /> : null}
    </View>
  );
}

// A card (`.card`): an eyebrow, a title and a line.
export function KrotCard({
  kick,
  title,
  note,
  titleType = TY.title,
  tight,
}: {
  kick?: string;
  title: string;
  note?: string;
  titleType?: TextStyle;
  tight?: boolean;
}) {
  const C = B.card;
  return (
    <Glass
      style={{
        paddingVertical: tight ? B.end.cardPadY : C.pad,
        paddingHorizontal: tight ? B.end.cardPadX : C.pad,
      }}
    >
      {kick ? (
        <Txt type={TY.kick} muted>
          {kick}
        </Txt>
      ) : null}
      <View style={{ marginTop: kick ? C.titleTop : 0 }}>
        <Txt type={titleType}>{title}</Txt>
      </View>
      {note ? (
        <View style={{ marginTop: C.noteTop }}>
          <Txt type={TY.note} muted>
            {note}
          </Txt>
        </View>
      ) : null}
    </Glass>
  );
}

export type KrotRowKind = 'plain' | 'speaker' | 'gone';

// A person's row (`.rr`): the face, the name with a line under it, the tag at the end. The speaker's
// (`.cur`) is ringed in the ink on the surface; a row after the first has its hairline from the
// name; someone out of the game is faded.
export function KrotRow({
  faces,
  sid,
  line,
  tag,
  kind = 'plain',
  first,
}: {
  faces: Faces;
  sid: string;
  line?: string;
  tag?: ReactNode;
  kind?: KrotRowKind;
  first?: boolean;
}) {
  const { c } = useKit();
  const { colors } = useTheme();
  const R = B.row;
  const speaker = kind === 'speaker';
  return (
    <View
      style={[
        {
          minHeight: R.min,
          flexDirection: 'row',
          alignItems: 'center',
          gap: R.gap,
          paddingHorizontal: speaker ? R.curPadX : R.padX,
          opacity: kind === 'gone' ? B.gone : 1,
        },
        speaker
          ? {
              marginHorizontal: -(R.curPadX - R.padX),
              borderRadius: R.radius,
              borderWidth: R.ring,
              borderColor: c.ink,
              backgroundColor: colors.surface,
            }
          : null,
      ]}
    >
      {first || speaker ? null : (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: R.padX + R.hairIn,
            right: 0,
            height: KIT.size.hair,
            backgroundColor: c.hair,
          }}
        />
      )}
      <Face faces={faces} sid={sid} size={R.face} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt type={TY.rowName}>{nameOf(faces, sid)}</Txt>
        {line ? (
          <Txt type={TY.rowLine} muted>
            {line}
          </Txt>
        ) : null}
      </View>
      {tag}
    </View>
  );
}

// "Rolüm, basılı tut" (`.hold`): the card held to see one's role.
export function KrotHold({ onHold }: { onHold: (on: boolean) => void }) {
  const { c } = useKit();
  const H = B.hold;
  return (
    <Tap testID="krot-my-role" accessibilityLabel={tr.krot.holdLabel} onHold={onHold} sink={false}>
      <Glass
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: H.gap,
          paddingVertical: H.padY,
          paddingHorizontal: H.padX,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt type={TY.holdTitle}>{tr.krot.myRole}</Txt>
          <Txt type={TY.rowLine} muted>
            {tr.krot.holdNote}
          </Txt>
        </View>
        <CapIcon name="eye" color={c.ink} second={c.muted} size={H.icon} />
      </Glass>
    </Tap>
  );
}

// A heading over a list (`.sec`).
export function KrotSection({ children }: { children: string }) {
  return (
    <Txt type={TY.section} muted>
      {children}
    </Txt>
  );
}
