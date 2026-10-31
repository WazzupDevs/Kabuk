import { emojiOnly } from '@shared/emojiOnly.ts';
import { isReaction, type Reaction, REACTIONS } from '@shared/reactions.ts';
import * as Clipboard from 'expo-clipboard';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  Text as RNText,
  type TextLayoutEventData,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useKit } from '@/aura/kit';
import { gradientStyle } from '@/theme/gradient';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';
import { shadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import { svgKey } from '@/lib/svgKey';

import { AVATAR_SIZE } from './Avatar';
import { type BubbleAction, MessagePop, type PopAnchor } from './MessagePop';
import { ReactionFace } from './ReactionFace';
import { Text } from './Text';
import { AppIcon } from './AppIcon';
import { useChatKind } from './chatKind';
import { useChatMetaRef } from './chatMeta';

// color: the quoted sender's name colour in the venue chat (v45: --qc); otherwise the second accent.
export type ChatQuote = { name: string; text: string; color?: string };
export type ChatReaction = { emoji: string; count: number; mine: boolean };

type Props = {
  text: string;
  // The viewer's own message: right, accent. Otherwise left, surface, with the sender.
  mine: boolean;
  // Left messages: the sender's avatar (32), name and an optional tag ("profilli"), on one line
  // over the sender's run.
  avatar?: ReactNode;
  name?: string;
  tag?: ReactNode;
  // Opens the sender's profile from the photo and the name (profiled senders only).
  onPressSender?: () => void;
  // The venue chat (v45: .vc .msg, .vname): the sender's name inside the run's first bubble in this
  // colour (theme/nameInk.ts), the photo beside the bubbles, every bubble's top-left corner tight.
  // No tag. Without it the photo and the name sit over the run.
  nameInk?: string;
  // Own messages still on the way, or refused by the network.
  state?: 'sending' | 'failed';
  // Why a failed message was refused, when the server said ("Çok hızlı yazıyorsun.").
  failedText?: string;
  onRetry?: () => void;
  onDiscard?: () => void;
  // A run of messages from one sender (Telegram Android's grouping): the name in or over the first,
  // the corners on the author's side tight inside the run, the last one's tail and (Mekan and Masa
  // sohbeti) the photo beside the last. A lone message is first and last.
  first?: boolean;
  last?: boolean;
  // In the bubble's bottom corner, after the text (v45: .bub time).
  time?: string;
  // Own DM messages (canvas: Aşama 5 · Geri bildirim → DM): one tick sent, two delivered, two in
  // the read colour read. Shown next to the time.
  delivery?: Delivery;
  // Aşama 8 · Saha (the data comes later): the message this one answers, shown inside the bubble;
  // the reactions under it; a swipe to the right to answer it; a long press for the six reactions.
  quote?: ChatQuote;
  // A tap on the quote goes to the answered message (docs/SPEC_V3.md §21.1); none for a gone one.
  onPressQuote?: () => void;
  reactions?: readonly ChatReaction[];
  onToggleReaction?: (emoji: string) => void;
  onReply?: () => void;
  onReact?: (emoji: Reaction) => void;
  // The held message's actions under it (skall tuvali: Yanıtla, Bildir; the viewer's own Sil).
  actions?: readonly BubbleAction[];
  testID?: string;
};

// 'sending': on its way, a clock in the ticks' place (Telegram Android: only the mark changes when
// the server takes it).
export type Delivery = 'sending' | 'sent' | 'delivered' | 'read';

// The others' messages sit under the photo's column.
const INDENT = AVATAR_SIZE.sm + SPACING[2];
// Swipe to reply: past TRIGGER the message is answered; it never moves further than MAX.
const SWIPE_SLOP = SPACING[3];
const SWIPE_TRIGGER = SPACING[14];
const SWIPE_MAX = SPACING[16] + SPACING[4];

// One chat message, WhatsApp-like (v45: .msg, .bub): the others' runs open with the sender's photo
// and name on one line and the bubbles under them, on the surface with a hairline; the viewer's own
// are right, in the accent colour. The time (and the ticks) sit in the bubble's corner after the
// text, or under it when the last line is full.
// The room the time takes at the end of the text: an em space before it, and an em and an en space
// for the read ticks.
const TIME_GAP = '\u2003';
const TICKS_ROOM = '\u2003\u2002';
// The room's copy of the time is drawn at alpha 1/255: Android takes a nested text's fully
// transparent colour (0) as "no colour" and draws it in the bubble's colour, so the copy showed
// under the time (04:24 over 04:24).
const HIDDEN_ALPHA = 0.004;

const NAME_GAP = 3;
// A bubble's share of the stream's width: the viewer's own (and a DM's other side), and a group
// chat's others beside their photos.
const MINE_SHARE = 0.84;
const THEIRS_SHARE = 0.9;
// Room for rounding when a one-line message keeps its time beside it.
const WIDEN_SLACK = 4;
// A reaction pill in the viewer's own (white) bubble and in another's (coloured) one.
const CHIP_ALPHA = 0.12;
const CHIP_ALPHA_ON = 0.22;
const DOUBLE_TAP_MS = 280;

export function ChatBubble({
  text,
  mine,
  avatar,
  name,
  tag,
  onPressSender,
  nameInk,
  state,
  failedText,
  onRetry,
  onDiscard,
  first = true,
  last = true,
  time,
  delivery,
  quote,
  onPressQuote,
  reactions,
  onToggleReaction,
  onReply,
  onReact,
  actions = [],
  testID,
}: Props) {
  const { shape } = useTheme();
  // A long press lifts the message over a scrim with the faces and its actions (MessagePop), from
  // where it sits on the screen.
  const faceRef = useRef<View>(null);
  const [pop, setPop] = useState<PopAnchor | null>(null);
  const holdable = !!onReact || actions.length > 0 || text.length > 0;
  const lift = () => {
    faceRef.current?.measureInWindow((x, y, width, height) => {
      haptic('grabbed');
      setPop({ x, y, width, height });
    });
  };
  // Telegram Android's bubble (the owner's call, 30 Ekim): 18 round; on the author's side (left
  // for others, right for the viewer's own) the corners inside a run are tight, and the run's last
  // bubble has a tail at its foot.
  const { scheme, c } = useKit();
  const kind = useChatKind();
  const metaRef = useChatMetaRef();
  // Grup 3, P4: the venue chat's own look (KIT.venueBubble): the own bubble in the primary, another's
  // in glass with the name in a chip over it. The DM and the table chat stay as they are.
  const venue = kind === 'mekan';
  const glassy = venue && !mine;
  const solid = KIT.bubble[scheme];
  const paint = venue
    ? {
        ...solid,
        mine: KIT.primary,
        mineInk: KIT.venueBubble.mineInk,
        mineMuted: KIT.venueBubble.mineMuted,
        mineEdge: 'transparent',
        mineShadow: KIT.venueBubble.mineShadow,
        themInk: c.ink,
        themMuted: c.muted,
      }
    : solid;
  // The words on a coloured bubble are white: the own in the venue chat, another's elsewhere.
  const onColour = venue ? mine : !mine;
  const shadowOff = useLabOff('golge');
  const fg = mine ? paint.mineInk : paint.themInk;
  const inside = !mine && nameInk !== undefined;
  const R = KIT.size.bubbleRadius;
  const near = KIT.size.bubbleInner;
  const sideTop = first ? R : near;
  // Glass has no tail (Aura v46: the corner towards the author 8 at the foot).
  const sideFoot = last && !glassy ? 0 : near;
  // [top left, top right, bottom right, bottom left]
  const radii = (mine ? [R, sideTop, sideFoot, R] : [sideTop, R, R, sideFoot]) as readonly [
    number,
    number,
    number,
    number,
  ];
  const big = quote ? 0 : emojiOnly(text);
  const fill = mine ? paint.mine : paint[kind];
  // Before `bubble` below: it draws the face (which reads the shadow) as it is built.
  const bubbleShadow = shadowParts(
    shadowOff,
    big ? undefined : mine ? paint.mineShadow : glassy ? c.glassShadow : KIT.chatShadow[kind],
    undefined,
    radii,
    true,
    mine && !big ? KIT.size.edge : 0,
  );
  // The widest a bubble's words may run (the stream's width less the screen's padding, at the
  // bubble's share of it), for keeping the time beside a one-line message (below).
  const { width: screenWidth } = useWindowDimensions();
  const maxText =
    (screenWidth - 2 * shape.screenPadding) *
      (mine ? MINE_SHARE : avatar ? THEIRS_SHARE : MINE_SHARE) -
    (avatar ? INDENT : 0) -
    2 * KIT.size.bubblePadX -
    2 * KIT.size.edge;
  // Android wraps a line that measured as fitting by a fraction of a point (React Native's
  // measuring and drawing round apart): a one-line message then dropped its time to a second line
  // and the bubble stayed narrow (the owner's report, 30 Ekim). When only the time went down and
  // the two fit side by side, the words get that much room.
  const [widen, setWiden] = useState(0);
  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (widen) return;
    const lines = e.nativeEvent.lines;
    const [a, b] = lines;
    if (lines.length !== 2 || !a || !b || !time) return;
    if (b.text.replace(/\s/g, '') !== time.replace(/\s/g, '')) return;
    const need = Math.ceil(a.width + b.width + WIDEN_SLACK);
    if (need <= maxText) setWiden(need);
  };
  // Telegram Android: the reactions inside the bubble, under the words, the time at the right of
  // their row (the owner's call, 30 Ekim); under a big emoji, outside.
  const hasChips = !!reactions && reactions.length > 0;
  const chipsInside = hasChips && !big;
  const chipPaint = !onColour
    ? { bg: withAlpha(KIT.primary, CHIP_ALPHA), bgOn: KIT.primary, ink: fg, inkOn: KIT.onPrimary }
    : { bg: withAlpha(fg, CHIP_ALPHA_ON), bgOn: fg, ink: fg, inkOn: fill };
  // Telegram Android: a double tap leaves the first reaction (the owner's call, 30 Ekim).
  const lastTap = useRef(0);
  const onTap = onReact
    ? () => {
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_TAP_MS) {
          lastTap.current = 0;
          haptic('selection');
          onReact(REACTIONS[0]);
        } else {
          lastTap.current = now;
        }
      }
    : undefined;
  const bubble = (
    <Pressable
      testID={testID}
      accessibilityLabel={
        quote
          ? `${quote.text ? tr.chat.quoteLabel(quote.name, quote.text) : quote.name}. ${text}`
          : text
      }
      accessibilityActions={[
        ...(onReply ? [{ name: 'reply', label: tr.chat.reply }] : []),
        ...(onReact ? [{ name: 'react', label: tr.chat.react }] : []),
        ...(onPressQuote ? [{ name: 'quote', label: tr.chat.goToQuote }] : []),
      ]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'reply') onReply?.();
        if (e.nativeEvent.actionName === 'react') lift();
        if (e.nativeEvent.actionName === 'quote') onPressQuote?.();
      }}
      onPress={onTap}
      onLongPress={holdable ? lift : undefined}
      style={{ maxWidth: '100%' }}
    >
      {face(false)}
    </Pressable>
  );
  function face(lifted: boolean) {
    return (
      <View
        ref={lifted ? undefined : faceRef}
        collapsable={false}
        // docs/design/aura → Dm (`.msg`): 22 round, the corner towards the author 8 at the
        // bottom. Never see-through (the owner's call, 29 Ekim): the own white, another's in the
        // chat's colour (DM blue, Mekan sohbeti green, Masa sohbeti purple).
        style={[
          big
            ? null
            : mine
              ? {
                  backgroundColor: fill,
                  borderWidth: KIT.size.edge,
                  borderColor: paint.mineEdge,
                  boxShadow: bubbleShadow.boxShadow,
                }
              : glassy
                ? {
                    ...gradientStyle(c.glass),
                    borderWidth: KIT.size.edge,
                    borderColor: c.glassEdge,
                    boxShadow: bubbleShadow.boxShadow,
                  }
                : { backgroundColor: fill, boxShadow: bubbleShadow.boxShadow },
          big
            ? {
                opacity: state === 'sending' ? 0.6 : 1,
                alignItems: mine ? 'flex-end' : 'flex-start',
              }
            : {
                paddingHorizontal: KIT.size.bubblePadX,
                paddingVertical: KIT.size.bubblePadY,
                borderTopLeftRadius: radii[0],
                borderTopRightRadius: radii[1],
                borderBottomRightRadius: radii[2],
                borderBottomLeftRadius: radii[3],
                opacity: state === 'sending' ? 0.6 : 1,
              },
          lifted && !big ? { boxShadow: shape.shadow.focus } : null,
        ]}
      >
        {lifted || big ? null : bubbleShadow.node}
        {last && !big && !glassy ? (
          <BubbleTail side={mine ? 'right' : 'left'} color={fill} />
        ) : null}
        {/* Masa sohbeti: the writer's name inside the bubble, on its first line, level with the
            face beside it (the owner's call, 28 Ekim). The venue chat's is over the bubble (P4). */}
        {inside && !venue && first && name ? (
          <Pressable
            testID={testID ? `${testID}-name` : undefined}
            accessibilityRole="button"
            accessibilityLabel={tr.chat.openProfile(name)}
            disabled={!onPressSender}
            onPress={onPressSender}
            hitSlop={SPACING[1.5]}
            style={{ alignSelf: 'flex-start', marginBottom: NAME_GAP }}
          >
            <RNText style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: big ? fill : paint.themInk }]}>
              {name}
            </RNText>
          </Pressable>
        ) : null}
        {quote ? <QuoteBlock quote={quote} onColor={onColour} onPress={onPressQuote} /> : null}
        {/* The time sits in the text's last line, bottom right (skall.css → `.bub .tm`, a float).
            React Native has no float, and a wrapping row measured the bubble wrong (bubbles ran
            into each other): the text ends with an invisible copy of the time, which makes the
            room, and the time is laid over that room. */}
        {big ? (
          <BigEmoji
            text={text}
            count={big}
            time={time && !state ? time : undefined}
            delivery={mine ? delivery : undefined}
            stamp={paint.stamp}
            stampInk={paint.stampInk}
          />
        ) : chipsInside ? (
          <>
            <RNText style={[KIT_TYPE.msg, { color: fg }]}>{text}</RNText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: SPACING[2],
                marginTop: SPACING[1.5],
              }}
            >
              <ReactionChips
                reactions={reactions ?? []}
                onToggle={onToggleReaction}
                paint={chipPaint}
              />
              {time && !state ? (
                <View
                  ref={metaRef}
                  style={{
                    marginLeft: 'auto',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING[1],
                  }}
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text variant="caption" color={mine ? paint.mineMuted : paint.themMuted}>
                    {time}
                  </Text>
                  {mine && delivery ? <DeliveryTicks delivery={delivery} inBubble /> : null}
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <View style={widen ? { minWidth: widen } : undefined}>
            <RNText style={[KIT_TYPE.msg, { color: fg }]} onTextLayout={onTextLayout}>
              {text}
              {time && !state ? (
                <Text variant="caption" color={withAlpha(fg, HIDDEN_ALPHA)} accessible={false}>
                  {`${TIME_GAP}${time}${mine && delivery ? TICKS_ROOM : ''}`}
                </Text>
              ) : null}
            </RNText>
            {time && !state ? (
              <View
                ref={metaRef}
                style={{
                  position: 'absolute',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING[1],
                  right: 0,
                  bottom: 0,
                }}
                importantForAccessibility="no-hide-descendants"
              >
                <Text variant="caption" color={mine ? paint.mineMuted : paint.themMuted}>
                  {time}
                </Text>
                {mine && delivery ? <DeliveryTicks delivery={delivery} inBubble /> : null}
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  }
  const chips =
    hasChips && big ? (
      <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start' }}>
        <ReactionChips
          reactions={reactions ?? []}
          onToggle={onToggleReaction}
          paint={{ bg: paint.stamp, bgOn: KIT.primary, ink: paint.stampInk, inkOn: KIT.onPrimary }}
        />
      </View>
    ) : null;
  const bar = pop ? (
    <MessagePop
      at={pop}
      mine={mine}
      current={reactions?.find((r) => r.mine)?.emoji ?? null}
      onClose={() => setPop(null)}
      onReact={onReact}
      actions={[
        ...(onReply
          ? [{ label: tr.chat.reply, icon: 'arrow-undo' as const, onPress: onReply }]
          : []),
        // The message's text to the clipboard (0.7.0; Android 13 and later says so itself).
        ...(text
          ? [
              {
                label: tr.chat.copy,
                icon: 'copy-outline' as const,
                testID: 'message-copy',
                onPress: () => void Clipboard.setStringAsync(text),
              },
            ]
          : []),
        ...actions,
      ]}
    >
      {face(true)}
    </MessagePop>
  ) : null;

  if (mine) {
    return (
      <View
        style={{
          alignItems: 'flex-end',
          gap: SPACING[1],
          alignSelf: 'flex-end',
          maxWidth: `${MINE_SHARE * 100}%`,
        }}
      >
        {bar}
        <SwipeToReply onReply={onReply}>{bubble}</SwipeToReply>
        {chips}
        {state ? (
          // Grup 3, P1b: at 320 dp / 1.3x the actions go to a second line, none cut.
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              alignItems: 'center',
              columnGap: SPACING[3],
            }}
          >
            <Text variant="fine" tone={state === 'failed' ? 'danger' : 'muted'}>
              {state === 'failed' ? (failedText ?? tr.chat.notSent) : tr.chat.sending}
            </Text>
            {state === 'failed' && onRetry ? (
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={{ minHeight: TOUCH.min, justifyContent: 'center' }}
              >
                <Text variant="label" tone="accent">
                  {tr.chat.retry}
                </Text>
              </Pressable>
            ) : null}
            {state === 'failed' && onDiscard ? (
              <Pressable
                accessibilityRole="button"
                onPress={onDiscard}
                style={{ minHeight: TOUCH.min, justifyContent: 'center' }}
              >
                <Text variant="label" tone="muted">
                  {tr.chat.discard}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  if (inside) {
    // The photo beside the run's last bubble, at its foot (Telegram Android's groups; the owner's
    // call, 30 Ekim); the name stays in the first.
    const photo =
      last && avatar ? (
        onPressSender ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr.chat.openProfile(name ?? '')}
            onPress={onPressSender}
            hitSlop={SPACING[1.5]}
          >
            {avatar}
          </Pressable>
        ) : (
          avatar
        )
      ) : null;
    return (
      <View
        style={{ gap: SPACING[1], alignSelf: 'flex-start', maxWidth: `${THEIRS_SHARE * 100}%` }}
      >
        {bar}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', columnGap: SPACING[2] }}>
          {/* Kept empty beside the run's later bubbles, so they stay in one column. */}
          <View style={{ width: AVATAR_SIZE.sm }}>{photo}</View>
          <View style={{ flexShrink: 1, alignItems: 'flex-start', gap: NAME_GAP }}>
            {venue && first && name ? (
              // Aura v46 → MekanSohbeti (`.nmc`): the name in the sender's colour over the bubble,
              // in a soft chip so it reads on any part of the wallpaper.
              <Pressable
                testID={testID ? `${testID}-name` : undefined}
                accessibilityRole="button"
                accessibilityLabel={tr.chat.openProfile(name)}
                disabled={!onPressSender}
                onPress={onPressSender}
                hitSlop={SPACING[1.5]}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: SPACING[1.5],
                  borderRadius: KIT.size.chip,
                  backgroundColor: KIT.venueBubble.nameChip[scheme],
                }}
              >
                <RNText style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: nameInk }]}>{name}</RNText>
              </Pressable>
            ) : null}
            <SwipeToReply onReply={onReply}>{bubble}</SwipeToReply>
            {chips}
          </View>
        </View>
      </View>
    );
  }

  // The run's head: the photo and the name on one line; both open the profile when there is one.
  const headRow =
    first && (avatar || name || tag) ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
        {avatar}
        {name ? (
          <Text variant="label" tone="muted" className="shrink">
            {name}
          </Text>
        ) : null}
        {tag}
      </View>
    ) : null;
  const head =
    headRow && onPressSender ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.chat.openProfile(name ?? '')}
        onPress={onPressSender}
        hitSlop={SPACING[1]}
        style={{ alignSelf: 'flex-start' }}
      >
        {headRow}
      </Pressable>
    ) : (
      headRow
    );
  return (
    <View
      style={{
        gap: SPACING[1],
        alignSelf: 'flex-start',
        maxWidth: `${(avatar ? THEIRS_SHARE : MINE_SHARE) * 100}%`,
      }}
    >
      {head}
      {/* Not under the photo's indent: the bar is wider than the column there. */}
      {bar}
      <View style={{ alignItems: 'flex-start', gap: SPACING[1], paddingLeft: avatar ? INDENT : 0 }}>
        <SwipeToReply onReply={onReply}>{bubble}</SwipeToReply>
        {chips}
      </View>
    </View>
  );
}

// The tail at the foot of a run's last bubble (Telegram Android's), on the author's side: the
// bubble's corner there is square and this curve carries on from it. One picture per colour and
// side, shared by every tail (svgKey).
function BubbleTail({ side, color }: { side: 'left' | 'right'; color: string }) {
  const w = KIT.size.tailW;
  const h = KIT.size.tailH;
  // Overlapping the bubble by half a point: no hairline between them.
  const overlap = 0.5;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        width: w,
        height: h,
        ...(side === 'left' ? { left: -w + overlap } : { right: -w + overlap }),
      }}
    >
      <Svg
        width={w}
        height={h}
        viewBox="0 0 7 12"
        nativeID={svgKey('tail', side, color)}
        style={side === 'right' ? { transform: [{ scaleX: -1 }] } : undefined}
      >
        <Path d="M7 0C7 5.6 4.8 9.6 0.6 11.4C0.2 11.6 0.3 12 0.7 12H7Z" fill={color} />
      </Svg>
    </View>
  );
}

// A message of emoji only, large and without a bubble (Telegram Android): one 40, two or three 32
// (KIT_TYPE); its time in a small dark pill under it.
function BigEmoji({
  text,
  count,
  time,
  delivery,
  stamp,
  stampInk,
}: {
  text: string;
  count: number;
  time?: string;
  delivery?: Delivery;
  stamp: string;
  stampInk: string;
}) {
  const metaRef = useChatMetaRef();
  return (
    <>
      <RNText maxFontSizeMultiplier={1} style={count === 1 ? KIT_TYPE.emojiOne : KIT_TYPE.emojiFew}>
        {text.trim()}
      </RNText>
      {time ? (
        <View
          ref={metaRef}
          importantForAccessibility="no-hide-descendants"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING[1],
            marginTop: SPACING[0.5],
            paddingHorizontal: SPACING[1.5],
            paddingVertical: SPACING[0.5],
            borderRadius: KIT.size.chip,
            backgroundColor: stamp,
          }}
        >
          <Text variant="caption" color={stampInk}>
            {time}
          </Text>
          {delivery ? <DeliveryTicks delivery={delivery} onAccent /> : null}
        </View>
      ) : null}
    </>
  );
}

// The answered message inside a bubble: a bar on the left, the sender's name and one line of text.
function QuoteBlock({
  quote,
  onColor,
  onPress,
}: {
  quote: ChatQuote;
  // In another's bubble (the chat's colour): the quote in white.
  onColor: boolean;
  onPress?: () => void;
}) {
  const mine = onColor;
  const { colors, shape } = useTheme();
  return (
    <Pressable
      testID="chat-quote"
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        marginBottom: SPACING[1.5],
        paddingHorizontal: SPACING[2.5],
        paddingVertical: SPACING[1.5],
        borderRadius: shape.radius.sm,
        borderLeftWidth: SPACING[1],
        borderLeftColor: mine ? colors.onPrimary : (quote.color ?? colors.violet),
        backgroundColor: mine ? withAlpha(colors.onPrimary, 0.16) : colors.surface2,
      }}
    >
      <Text variant="label" color={mine ? colors.onPrimary : (quote.color ?? colors.violet)}>
        {quote.name}
      </Text>
      {quote.text ? (
        // An excerpt of the answered message: one line, like the inbox's last-message line.
        <Text variant="fine" color={mine ? colors.onPrimary : colors.text} numberOfLines={1}>
          {quote.text}
        </Text>
      ) : null}
    </Pressable>
  );
}

// Swipe a message to the right to answer it (no gesture library: the responder system). A reply
// arrow fades in behind it; past the trigger it answers, then springs back.
function SwipeToReply({ onReply, children }: { onReply?: () => void; children: ReactNode }) {
  const { colors, shape } = useTheme();
  const [dx] = useState(() => new Animated.Value(0));
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(0);
  // The reply sign behind the bubble is put on the screen only once a swipe starts: unseen at rest,
  // it was a view and an icon in every bubble, paid for when a chat opened (the owner's videos, 29
  // Ekim: a DM's 50 bubbles stalled its opening).
  const [armed, setArmed] = useState(false);
  if (!onReply) return children;
  const settle = () => {
    moved.current = 0;
    Animated.spring(dx, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
  };
  return (
    <View
      onTouchStart={(e) => {
        start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      }}
      onMoveShouldSetResponderCapture={(e) => {
        const s = start.current;
        if (!s) return false;
        const x = e.nativeEvent.pageX - s.x;
        const y = e.nativeEvent.pageY - s.y;
        return x > SWIPE_SLOP && x > Math.abs(y) * 1.5;
      }}
      onResponderTerminationRequest={() => false}
      onResponderGrant={() => {
        if (!armed) setArmed(true);
      }}
      onResponderMove={(e) => {
        const s = start.current;
        if (!s) return;
        const was = moved.current;
        moved.current = Math.max(0, Math.min(SWIPE_MAX, e.nativeEvent.pageX - s.x));
        // Past the trigger, letting go answers: one touch as it is crossed (v43).
        if (was < SWIPE_TRIGGER && moved.current >= SWIPE_TRIGGER) haptic('replyThreshold');
        dx.setValue(moved.current);
      }}
      onResponderRelease={() => {
        if (moved.current >= SWIPE_TRIGGER) onReply();
        settle();
      }}
      onResponderTerminate={settle}
      style={{ maxWidth: '100%' }}
    >
      {armed ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            left: -SPACING[10],
            top: 0,
            bottom: 0,
            opacity: dx.interpolate({ inputRange: [0, SWIPE_TRIGGER], outputRange: [0, 1] }),
          }}
        >
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: SPACING[8],
              height: SPACING[8],
              borderRadius: shape.radius.pill,
              backgroundColor: colors.surface2,
            }}
          >
            <AppIcon name="arrow-undo" size={ICON.sm} color={colors.text} />
          </View>
        </Animated.View>
      ) : null}
      <Animated.View style={{ transform: [{ translateX: dx }] }}>{children}</Animated.View>
    </View>
  );
}

// A message's reactions (Telegram Android's): each face and its count in a small pill, the
// viewer's own filled; a tap takes the viewer's own back or leaves that one.
type ChipPaint = { bg: string; bgOn: string; ink: string; inkOn: string };

function ReactionChips({
  reactions,
  onToggle,
  paint,
}: {
  reactions: readonly ChatReaction[];
  onToggle?: (emoji: string) => void;
  paint: ChipPaint;
}) {
  const { shape } = useTheme();
  const chipHeight = SPACING[7];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[1], flexShrink: 1 }}>
      {reactions.map((r) => (
        <Pressable
          key={r.emoji}
          accessibilityRole="button"
          accessibilityState={{ selected: r.mine }}
          accessibilityLabel={tr.chat.reactionChip(
            isReaction(r.emoji) ? tr.chat.reactions[r.emoji] : r.emoji,
            r.count,
            r.mine,
          )}
          disabled={!onToggle}
          onPress={() => onToggle?.(r.emoji)}
          hitSlop={(TOUCH.min - chipHeight) / 2}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING[1],
              height: chipHeight,
              paddingLeft: SPACING[0.5] + 1,
              paddingRight: SPACING[2],
              borderRadius: shape.radius.pill,
              backgroundColor: r.mine ? paint.bgOn : paint.bg,
            }}
          >
            <ReactionFace emoji={r.emoji} size="chip" />
            <Text variant="tag" tabular color={r.mine ? paint.inkOn : paint.ink}>
              {String(r.count)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// Also on a Mesajlar row, before the preview of the viewer's own last message. In the viewer's own
// bubble (`onAccent`) the ticks are in its text colour and a read one in readOnAccent.
export function DeliveryTicks({
  delivery,
  onAccent,
  inBubble,
  size = TICK,
}: {
  delivery: Delivery;
  onAccent?: boolean;
  // In the viewer's own bubble (white, #ECE9F8 in the dark): the read tick #4A5CE6 in both themes
  // (Grup 3, P1a: #7DB2FF on #ECE9F8 was 1.82:1). Mesajlar's row keeps its own dark blue.
  inBubble?: boolean;
  // Mesajlar's row: 17 (docs/design/aura → Mesajlar).
  size?: number;
}) {
  const { colors, scheme } = useTheme();
  // docs/design/aura → Mesajlar, Dm: the read double tick in #4A5CE6 (the dark side's own blue).
  const read = onAccent
    ? colors.readOnAccent
    : scheme === 'light' || inBubble
      ? KIT.readTick
      : colors.read;
  const plain = onAccent ? colors.onPrimary : colors.muted;
  return (
    <View accessible accessibilityLabel={tr.dm.delivery[delivery]} testID={`tick-${delivery}`}>
      {delivery === 'sending' ? (
        <AppIcon name="time-outline" size={size} color={plain} />
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d={delivery === 'sent' ? SENT_TICK : READ_TICKS}
            fill="none"
            stroke={delivery === 'read' ? read : plain}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
}
// The board's ticks (Dm: 15; Mesajlar: 17), one for sent, two for delivered and read.
const TICK = 15;
const READ_TICKS = 'M2 12.5l4.2 4.2L14 8.4M10.6 16.7 18.6 8.4';
const SENT_TICK = 'M5 12.5l4.2 4.2L17 8.4';

const DOT = SPACING[2];
const TYPING_MS = 400;

// The other side is typing: three dots in a left bubble, rising in turn; still under reduce motion.
export function TypingBubble({ avatar, testID }: { avatar?: ReactNode; testID?: string }) {
  const { shape } = useTheme();
  const reduce = useReduceMotion();
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    if (reduce) {
      dots.forEach((d) => d.setValue(0));
      return undefined;
    }
    const loop = Animated.loop(
      Animated.stagger(
        TYPING_MS / 3,
        dots.map((d) =>
          Animated.sequence([
            Animated.timing(d, { toValue: 1, duration: TYPING_MS / 2, useNativeDriver: true }),
            Animated.timing(d, { toValue: 0, duration: TYPING_MS / 2, useNativeDriver: true }),
          ]),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, dots]);

  const { scheme } = useKit();
  const kind = useChatKind();
  const paint = KIT.bubble[scheme];
  const shadowOff = useLabOff('golge');
  const typingShadow = shadowParts(shadowOff, KIT.chatShadow[kind], undefined, [
    KIT.size.msgRadius,
    KIT.size.msgRadius,
    KIT.size.msgRadius,
    KIT.size.msgTail,
  ]);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING[2],
        alignSelf: 'flex-start',
      }}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={tr.dm.typing}
      testID={testID}
    >
      {avatar}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING[1],
          paddingHorizontal: SPACING[3] + SPACING[0.5],
          paddingVertical: SPACING[3],
          // Another's bubble in the chat's colour with three white dots (the owner's call, 29 Ekim).
          backgroundColor: paint[kind],
          boxShadow: typingShadow.boxShadow,
          borderTopLeftRadius: KIT.size.msgRadius,
          borderTopRightRadius: KIT.size.msgRadius,
          borderBottomRightRadius: KIT.size.msgRadius,
          borderBottomLeftRadius: KIT.size.msgTail,
        }}
      >
        {typingShadow.node}
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={{
              width: DOT,
              height: DOT,
              borderRadius: shape.radius.pill,
              backgroundColor: paint.themInk,
              opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
              transform: [
                {
                  translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -SPACING[1]] }),
                },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
}
