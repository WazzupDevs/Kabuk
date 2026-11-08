import { emojiOnly } from '@shared/emojiOnly.ts';
import { isReaction, type Reaction, REACTIONS } from '@shared/reactions.ts';
import * as Clipboard from 'expo-clipboard';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  Text as RNText,
  type TextLayoutEventData,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useKit } from '@/aura/kit';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';
import { shadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import { bubblePath } from '@/lib/bubblePath';
import { svgKey } from '@/lib/svgKey';

import { AVATAR_SIZE } from './Avatar';
import { type BubbleAction, MessagePop, type PopAnchor } from './MessagePop';
import { ReactionFace } from './ReactionFace';
import { Text } from './Text';
import { AppIcon } from './AppIcon';
import { useChatKind } from './chatKind';
import { useChatMetaRef } from './chatMeta';
import { useChatScrolling } from './chatScrolling';
import { usePopHost } from './popHost';
import { CachedSvg } from './CachedSvg';
import { FxSvg } from './FxSvg';
import { gradientStyle } from '@/theme/gradient';
import type { BalloonCorner, SetBalloon } from '@/theme/setBalloons';

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
  // A full set's balloon (the venue chat, anonymous, the set worn whole: theme/setBalloons.ts).
  skin?: SetBalloon | null;
  // The balloon's ornaments move (one of the newest few, skinMovers); otherwise they are still.
  skinMoves?: boolean;
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
// The longest wait for the keyboard to go before a held message is measured anyway.
const KEYBOARD_AWAY_MS = 450;

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
  skin = null,
  skinMoves = true,
}: Props) {
  const { shape } = useTheme();
  // A long press lifts the message over a scrim with the faces and its actions (MessagePop), from
  // where it sits on the screen.
  const faceRef = useRef<View>(null);
  const [pop, setPop] = useState<PopAnchor | null>(null);
  // The bubble's measured size: a run's last bubble draws itself and its tail as one outline
  // (BubbleShape); until it is measured, its box and the tail laid beside it.
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const holdable = !!onReact || actions.length > 0 || text.length > 0;
  const host = usePopHost();
  const lift = () => {
    // Measured where the bubble stands once the keyboard is away (the layer puts it away, and the
    // stream moves as it goes: measured before, the faces opened far from the message, at the
    // screen's top; the owner's report, 6 Kasım). An unmeasured cell is tried again a frame later.
    const measure = (retry: boolean) =>
      faceRef.current?.measureInWindow((x, y, width, height) => {
        if (height <= 0 || width <= 0) {
          if (retry) requestAnimationFrame(() => measure(false));
          return;
        }
        open({ x, y, width, height });
      });
    haptic('grabbed');
    if (!Keyboard.isVisible()) {
      measure(true);
      return;
    }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      sub.remove();
      clearTimeout(timer);
      requestAnimationFrame(() => requestAnimationFrame(() => measure(true)));
    };
    const sub = Keyboard.addListener('keyboardDidHide', go);
    const timer = setTimeout(go, KEYBOARD_AWAY_MS);
    Keyboard.dismiss();
  };
  const open = (at: PopAnchor) => {
    // On the chat screen's root (popHost.tsx): the stream's cells stay as they are.
    if (host) host.show((close) => popLayer(at, close));
    else setPop(at);
  };
  // Telegram Android's bubble (the owner's call, 30 Ekim): 18 round; on the author's side (left
  // for others, right for the viewer's own) the corners inside a run are tight, and the run's last
  // bubble has a tail at its foot.
  const { scheme } = useKit();
  const kind = useChatKind();
  const metaRef = useChatMetaRef();
  // The owner's call (29 Ekim, again on 4 Kasım): the viewer's own bubble white (a soft off-white
  // in the dark) with ink words, in every chat; another's solid in the chat's colour with white
  // words, the same shape and tail as the own (never glass): the DM blue, the venue chat green, the
  // table chat pink. Aura v65's primary own bubble and glass others are left.
  const venue = kind === 'mekan';
  const paint = KIT.bubble[scheme];
  // The words on a coloured bubble are white: another's, and a set's balloon.
  const onColour = !mine || skin !== null;
  const shadowOff = useLabOff('golge');
  const fg = skin ? skin.ink : mine ? paint.mineInk : paint.themInk;
  const muted = skin ? skin.muted : mine ? paint.mineMuted : paint.themMuted;
  const inside = !mine && nameInk !== undefined;
  const R = KIT.size.bubbleRadius;
  const near = KIT.size.bubbleInner;
  const sideTop = first ? R : near;
  // The run's last bubble has its tail at the foot (Telegram Android), the others' too.
  const sideFoot = last ? 0 : near;
  // [top left, top right, bottom right, bottom left]
  const radii = (mine ? [R, sideTop, sideFoot, R] : [sideTop, R, R, sideFoot]) as readonly [
    number,
    number,
    number,
    number,
  ];
  const big = quote ? 0 : emojiOnly(text);
  const fill = skin ? skin.chipOn : mine ? paint.mine : paint[kind];
  // Before `bubble` below: it draws the face (which reads the shadow) as it is built.
  const bubbleShadow = shadowParts(
    shadowOff,
    big ? undefined : mine ? paint.mineShadow : KIT.chatShadow[kind],
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
    const skinned = skin !== null && !big;
    const shaped = last && !big && box !== null && !skinned;
    return (
      <View
        ref={lifted ? undefined : faceRef}
        collapsable={false}
        onLayout={
          lifted || !last || big
            ? undefined
            : (e) => {
                const w = Math.round(e.nativeEvent.layout.width);
                const h = Math.round(e.nativeEvent.layout.height);
                if (box?.w !== w || box?.h !== h) setBox({ w, h });
              }
        }
        // docs/design/aura → Dm (`.msg`): 22 round, the corner towards the author 8 at the
        // bottom. Never see-through (the owner's call, 29 Ekim): the own white, another's in the
        // chat's colour (DM blue, Mekan sohbeti green, Masa sohbeti purple).
        style={[
          big || skinned
            ? null
            : mine
              ? {
                  backgroundColor: shaped ? undefined : fill,
                  borderWidth: KIT.size.edge,
                  borderColor: shaped ? 'transparent' : paint.mineEdge,
                  boxShadow: bubbleShadow.boxShadow,
                }
              : { backgroundColor: shaped ? undefined : fill, boxShadow: bubbleShadow.boxShadow },
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
          skin && skinned ? skinFace(skin, mine, scheme, first, last) : null,
        ]}
      >
        {skin && skinned ? (
          <SkinFrame skin={skin} mine={mine} first={first} last={last} moves={skinMoves} />
        ) : null}
        {/* Held, the bubble keeps its own shadow and tail: no ring (ui 1.1). */}
        {big || skinned ? null : bubbleShadow.node}
        {skinned ? null : shaped ? (
          <BubbleShape
            mine={mine}
            w={box.w}
            h={box.h}
            radii={radii}
            fill={fill}
            line={mine ? paint.mineEdge : undefined}
          />
        ) : last && !big ? (
          <BubbleTail side={mine ? 'right' : 'left'} color={fill} edge={mine ? KIT.size.edge : 0} />
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
                  <Text variant="caption" color={muted}>
                    {time}
                  </Text>
                  {mine && delivery ? (
                    <DeliveryTicks delivery={delivery} inBubble plainInk={muted} />
                  ) : null}
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
                <Text variant="caption" color={muted}>
                  {time}
                </Text>
                {mine && delivery ? (
                  <DeliveryTicks delivery={delivery} inBubble plainInk={muted} />
                ) : null}
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
  function popLayer(at: PopAnchor, close: () => void) {
    return (
      <MessagePop
        at={at}
        mine={mine}
        current={reactions?.find((r) => r.mine)?.emoji ?? null}
        onClose={close}
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
    );
  }
  const bar = pop ? popLayer(pop, () => setPop(null)) : null;

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
                style={
                  skin
                    ? skinName(skin)
                    : {
                        alignSelf: 'flex-start',
                        paddingHorizontal: SPACING[1.5],
                        borderRadius: KIT.size.chip,
                        backgroundColor: KIT.venueBubble.nameChip[scheme],
                      }
                }
              >
                {skin ? (
                  <View style={{ width: SKIN_MARK, height: SKIN_MARK }}>
                    <CachedSvg xml={skin.name.mark} width={SKIN_MARK} height={SKIN_MARK} />
                  </View>
                ) : null}
                <RNText
                  style={[
                    KIT_TYPE.fine,
                    KIT_TYPE.strong,
                    { color: skin ? skin.name.ink : nameInk },
                  ]}
                >
                  {name}
                </RNText>
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

// A full set's balloon (BalonElf `.e2`, BalonNinja `.n2`): no tail; 22 round with the corner
// towards the author 6; its padding and the room round it for the ornaments.
const SKIN_MARK = 10;

// A run of set balloons from one sender reads as one (every set's rule, docs/SPEC_V4.md §4.U): the
// top ornaments and the top strip only on the run's first, the foot's only on its last, the room
// round them outside the run only, the corners on the author's side tight inside it and the wide
// glow on the first and the last (the middle ones keep the ring). A lone balloon is first and last.
function skinRadii(
  skin: SetBalloon,
  mine: boolean,
  first: boolean,
): readonly [number, number, number, number] {
  const { round, tight } = skin.radius;
  const top = first ? round : tight;
  return mine ? [round, top, tight, round] : [top, round, round, tight];
}

function skinFace(
  skin: SetBalloon,
  mine: boolean,
  scheme: 'light' | 'dark',
  first: boolean,
  last: boolean,
): ViewStyle {
  const [tl, tr, br, bl] = skinRadii(skin, mine, first);
  const shadow = skin.shadow[scheme];
  return {
    paddingTop: skin.pad.top,
    paddingRight: skin.pad.right,
    paddingBottom: skin.pad.bottom,
    paddingLeft: skin.pad.left,
    marginTop: first ? skin.margin.top : 0,
    marginRight: skin.margin.right,
    marginBottom: last ? skin.margin.bottom : 0,
    marginLeft: skin.margin.left,
    borderTopLeftRadius: tl,
    borderTopRightRadius: tr,
    borderBottomRightRadius: br,
    borderBottomLeftRadius: bl,
    boxShadow: first || last ? `${shadow.ring}, ${shadow.glow}` : shadow.ring,
  };
}

// At most this many set balloons' ornaments move at a time: the newest (older ones are still).
export const SKIN_MOVERS = 6;

// The keys of the rows whose balloon moves: the newest SKIN_MOVERS balloons with ornaments (a run's
// first or last). `rows` newest first, as the chat lists hold them.
export function skinMovers<R extends { key: string; first: boolean; last: boolean }>(
  rows: readonly R[],
  skinned: (row: R) => boolean,
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const row of rows) {
    if (keys.size >= SKIN_MOVERS) break;
    if ((row.first || row.last) && skinned(row)) keys.add(row.key);
  }
  return keys;
}

// A strip's tiles as one SVG (one picture, shared by every strip of its set and length: svgKey):
// the tile's drawing repeated side by side.
const strips = new Map<string, string>();
function stripSvg(strip: SetBalloon['strip'], tiles: number): string {
  const id = `${tiles}:${strip.svg}`;
  const hit = strips.get(id);
  if (hit !== undefined) return hit;
  const inner = strip.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const w = strip.w * tiles;
  let body = '';
  for (let i = 0; i < tiles; i++) body += `<g transform="translate(${i * strip.w} 0)">${inner}</g>`;
  const xml = `<svg viewBox="0 0 ${w} ${strip.h}" width="100%" height="100%" aria-hidden="true">${body}</svg>`;
  if (strips.size >= STRIP_KEEP) strips.clear();
  strips.set(id, xml);
  return xml;
}
const STRIP_KEEP = 64;

// The name's chip over a set's balloon (`.e2nm`, `.n2nm`): the set's mark, its colours.
function skinName(skin: SetBalloon): ViewStyle {
  return {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingVertical: 1,
    paddingLeft: SKIN_MARK / 2,
    paddingRight: SPACING[2],
    borderRadius: KIT.size.chip,
    ...gradientStyle(skin.name.fill),
    boxShadow: `inset 0 0 0 1px ${skin.name.ring}, 0 0 10px ${skin.name.glow}`,
  };
}

// The balloon's ground under its words: the border's colours, the fill 2 in with its glows, the
// vine or rope along the top (a run's first) and the foot (its last), the ornaments at those
// corners (mirrored for the own). The ornaments stand still while the stream scrolls.
function SkinFrame({
  skin,
  mine,
  first,
  last,
  moves,
}: {
  skin: SetBalloon;
  mine: boolean;
  first: boolean;
  last: boolean;
  moves: boolean;
}) {
  const radii = skinRadii(skin, mine, first);
  const scrolling = useChatScrolling();
  const [w, setW] = useState(0);
  const round = (r: readonly [number, number, number, number], less: number): ViewStyle => ({
    borderTopLeftRadius: Math.max(r[0] - less, 0),
    borderTopRightRadius: Math.max(r[1] - less, 0),
    borderBottomRightRadius: Math.max(r[2] - less, 0),
    borderBottomLeftRadius: Math.max(r[3] - less, 0),
  });
  const s = skin.strip;
  const tiles = w > 0 ? Math.ceil(Math.max(w - s.left - s.right, 0) / s.w) : 0;
  const xml = tiles > 0 ? stripSvg(s, tiles) : null;
  const strip = (top: boolean) =>
    xml ? (
      <View
        style={{
          position: 'absolute',
          left: mine ? s.right : s.left,
          right: mine ? s.left : s.right,
          height: s.h,
          overflow: 'hidden',
          ...(top ? { top: s.out } : { bottom: s.out, transform: [{ scaleY: -1 }] }),
        }}
      >
        <View style={{ width: s.w * tiles, height: s.h }}>
          <CachedSvg xml={xml} width={s.w * tiles} height={s.h} />
        </View>
      </View>
    ) : null;
  const corner = (k: BalloonCorner) => {
    const c = skin.corners[k];
    const left = k === 'tl' || k === 'bl';
    const side = left !== mine ? { left: c.x } : { right: c.x };
    const edge = k === 'tl' || k === 'tr' ? { top: c.y } : { bottom: c.y };
    const flip = mine ? [{ scaleX: -1 }] : [];
    const turn = c.turn ? [{ rotate: `${mine ? -c.turn : c.turn}deg` }] : [];
    return (
      <View
        key={k}
        style={{
          position: 'absolute',
          width: c.w,
          height: c.h,
          ...side,
          ...edge,
          transform: [...turn, ...flip],
        }}
      >
        <FxSvg
          xml={c.svg}
          width={c.w}
          height={c.h}
          still={!moves}
          paused={scrolling}
          lane={SKIN_LANE}
        />
      </View>
    );
  };
  const corners: BalloonCorner[] = [
    ...(first ? (['tl', 'tr'] as const) : []),
    ...(last ? (['bl', 'br'] as const) : []),
  ];
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={first || last ? (e) => setW(Math.round(e.nativeEvent.layout.width)) : undefined}
    >
      <View style={[StyleSheet.absoluteFill, round(radii, 0), gradientStyle(skin.border)]} />
      <View
        style={[
          { position: 'absolute', inset: skin.edge, overflow: 'hidden' },
          round(radii, skin.edge),
          gradientStyle(skin.fill),
        ]}
      >
        <View style={[StyleSheet.absoluteFill, gradientStyle(skin.aurora)]} />
      </View>
      {first ? strip(true) : null}
      {last ? strip(false) : null}
      {corners.map(corner)}
    </View>
  );
}
// The balloons' ornaments keep their own clocks: paused while the stream scrolls, apart from the
// faces that move elsewhere on the screen.
const SKIN_LANE = 'balloon';

// A run's last bubble and its tail as one outline, filled and lined once (Telegram Android's
// bubble; the owner's report, 6 Kasım: the tail laid beside the box did not look part of it). The
// viewer's own is the mirror of another's. One picture per outline and colours (svgKey).
function BubbleShape({
  mine,
  w,
  h,
  radii,
  fill,
  line,
}: {
  mine: boolean;
  w: number;
  h: number;
  radii: readonly [number, number, number, number];
  fill: string;
  line?: string;
}) {
  const tailW = KIT.size.tailW;
  // The tailed (left) form's corners: the own bubble's mirrored.
  const left = (mine ? [radii[1], radii[0], radii[3], radii[2]] : radii) as readonly [
    number,
    number,
    number,
    number,
  ];
  const edge = line ? KIT.size.edge : 0;
  const d = bubblePath(w, h, left, tailW, KIT.size.tailH, edge / 2);
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -edge,
        width: w + tailW,
        height: h,
        ...(mine ? { left: -edge } : { left: -tailW - edge }),
      }}
    >
      <Svg
        width={w + tailW}
        height={h}
        nativeID={svgKey('bubble', d, fill, line ?? '')}
        style={mine ? { transform: [{ scaleX: -1 }] } : undefined}
      >
        <Path d={d} fill={fill} {...(line ? { stroke: line, strokeWidth: edge } : null)} />
      </Svg>
    </View>
  );
}

// The tail at the foot of a run's last bubble (Telegram Android's), on the author's side: the
// bubble's corner there is square and this curve carries on from it. One picture per colour and
// side, shared by every tail (svgKey).
// `edge`: the bubble's own line (mine has one); the tail is placed inside it, so it reaches down
// over the line's foot and the square corner does not show as a second tip (the owner's report,
// 2 Kasım, 13.4).
function BubbleTail({
  side,
  color,
  edge,
}: {
  side: 'left' | 'right';
  color: string;
  edge: number;
}) {
  const w = KIT.size.tailW;
  const h = KIT.size.tailH;
  // Overlapping the bubble by half a point: no hairline between them.
  const overlap = 0.5;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: -edge,
        width: w,
        height: h,
        ...(side === 'left' ? { left: -w + overlap - edge } : { right: -w + overlap - edge }),
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
      <RNText
        maxFontSizeMultiplier={1}
        style={[
          count === 1 ? KIT_TYPE.emojiOne : KIT_TYPE.emojiFew,
          // Room on both sides: the last emoji's right edge reaches past the measured width.
          { paddingHorizontal: SPACING[0.5], includeFontPadding: true },
        ]}
      >
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
  plainInk,
  size = TICK,
}: {
  delivery: Delivery;
  onAccent?: boolean;
  // In the viewer's own bubble (the primary): the read tick `--read-on-accent` (readTick.test.ts).
  inBubble?: boolean;
  // The clock and the single tick in the bubble's time colour (Telegram Android: the mark beside the
  // time in its ink).
  plainInk?: string;
  // Mesajlar's row: 17 (docs/design/aura → Mesajlar).
  size?: number;
}) {
  const { colors } = useTheme();
  // U28: the read double tick `--read` (#2C63D6, the dark side's #7DB2FF); in the viewer's own
  // primary bubble `--read-on-accent`.
  const read = onAccent ? colors.readOnAccent : inBubble ? KIT.readTick : colors.read;
  const plain = onAccent ? colors.onPrimary : (plainInk ?? colors.muted);
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

  const { scheme, c } = useKit();
  const kind = useChatKind();
  const paint = KIT.bubble[scheme];
  // The dots in the bubble's words' colour: white on the DM blue, the ink elsewhere.
  const dotInk = kind === 'dm' ? paint.themInk : c.ink;
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
              backgroundColor: dotInk,
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
