import { isReaction, type Reaction } from '@shared/reactions.ts';
import * as Clipboard from 'expo-clipboard';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text as RNText, View } from 'react-native';

import { useKit } from '@/aura/kit';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';
import { boxShadowParts, shadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';

import { AVATAR_SIZE } from './Avatar';
import { type BubbleAction, MessagePop, type PopAnchor } from './MessagePop';
import { ReactionFace } from './ReactionFace';
import { Text } from './Text';
import { AppIcon } from './AppIcon';
import { useChatKind } from './chatKind';

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
  // A run of messages from one sender: the photo and the name over the first, tight corners inside
  // the run. A lone message is the first.
  first?: boolean;
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
  // skall tuvali (skall.css → `.bub`): 18 all round; a run's first bubble points at its author with
  // a 6 corner at the top (left for others, right for the viewer's own).
  const { scheme } = useKit();
  const kind = useChatKind();
  const paint = KIT.bubble[scheme];
  const shadowOff = useLabOff('golge');
  const fg = mine ? paint.mineInk : paint.themInk;
  const inside = !mine && nameInk !== undefined;
  // Before `bubble` below: it draws the face (which reads the shadow) as it is built.
  const radii = [
    KIT.size.msgRadius,
    KIT.size.msgRadius,
    mine ? KIT.size.msgTail : KIT.size.msgRadius,
    mine ? KIT.size.msgRadius : KIT.size.msgTail,
  ] as const;
  const bubbleShadow = shadowParts(
    shadowOff,
    mine ? paint.mineShadow : KIT.chatShadow[kind],
    undefined,
    radii,
    true,
    mine ? KIT.size.edge : 0,
  );
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
          mine
            ? {
                backgroundColor: paint.mine,
                borderWidth: KIT.size.edge,
                borderColor: paint.mineEdge,
                boxShadow: bubbleShadow.boxShadow,
              }
            : { backgroundColor: paint[kind], boxShadow: bubbleShadow.boxShadow },
          {
            paddingHorizontal: KIT.size.msgPadX,
            paddingVertical: KIT.size.msgPadY,
            borderTopLeftRadius: KIT.size.msgRadius,
            borderTopRightRadius: KIT.size.msgRadius,
            borderBottomLeftRadius: mine ? KIT.size.msgRadius : KIT.size.msgTail,
            borderBottomRightRadius: mine ? KIT.size.msgTail : KIT.size.msgRadius,
            opacity: state === 'sending' ? 0.6 : 1,
          },
          lifted ? { boxShadow: shape.shadow.focus } : null,
        ]}
      >
        {lifted ? null : bubbleShadow.node}
        {/* Mekan and masa sohbeti: the writer's name inside the bubble, on its first line, level
            with the face beside it (the owner's call, 28 Ekim). */}
        {inside && first && name ? (
          <Pressable
            testID={testID ? `${testID}-name` : undefined}
            accessibilityRole="button"
            accessibilityLabel={tr.chat.openProfile(name)}
            disabled={!onPressSender}
            onPress={onPressSender}
            hitSlop={SPACING[1.5]}
            style={{ alignSelf: 'flex-start', marginBottom: NAME_GAP }}
          >
            <RNText style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: paint.themInk }]}>
              {name}
            </RNText>
          </Pressable>
        ) : null}
        {quote ? <QuoteBlock quote={quote} onColor={!mine} onPress={onPressQuote} /> : null}
        {/* The time sits in the text's last line, bottom right (skall.css → `.bub .tm`, a float).
            React Native has no float, and a wrapping row measured the bubble wrong (bubbles ran
            into each other): the text ends with an invisible copy of the time, which makes the
            room, and the time is laid over that room. */}
        <View>
          <RNText style={[KIT_TYPE.msg, { color: fg }]}>
            {text}
            {time && !state ? (
              <Text variant="caption" color={withAlpha(fg, HIDDEN_ALPHA)} accessible={false}>
                {`${TIME_GAP}${time}${mine && delivery ? TICKS_ROOM : ''}`}
              </Text>
            ) : null}
          </RNText>
          {time && !state ? (
            <View
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
              {mine && delivery ? <DeliveryTicks delivery={delivery} /> : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  }
  const chips =
    reactions && reactions.length > 0 ? (
      <ReactionChips reactions={reactions} onToggle={onToggleReaction} mine={mine} />
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
        style={{ alignItems: 'flex-end', gap: SPACING[1], alignSelf: 'flex-end', maxWidth: '76%' }}
      >
        {bar}
        <SwipeToReply onReply={onReply}>{bubble}</SwipeToReply>
        {chips}
        {state ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[3] }}>
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
    const photo =
      first && avatar ? (
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
      <View style={{ gap: SPACING[1], alignSelf: 'flex-start', maxWidth: '88%' }}>
        {bar}
        {/* The face at the bubble's top, level with the name inside it (the owner's call, 28
            Ekim). */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: SPACING[2] }}>
          {/* Kept empty beside the run's later bubbles, so they stay in one column. */}
          <View style={{ width: AVATAR_SIZE.sm }}>{photo}</View>
          <View style={{ flexShrink: 1, alignItems: 'flex-start', gap: NAME_GAP }}>
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
    <View style={{ gap: SPACING[1], alignSelf: 'flex-start', maxWidth: '88%' }}>
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

// Under a bubble: each reaction with its count; the viewer's own is marked and can be taken back.
function ReactionChips({
  reactions,
  onToggle,
  mine,
}: {
  reactions: readonly ChatReaction[];
  onToggle?: (emoji: string) => void;
  mine: boolean;
}) {
  const { colors, shape } = useTheme();
  const chipHeight = SPACING[7];
  // Each chip's soft shadow natively (NativeShadow.tsx): chips scroll with the chat.
  const shadowOff = useLabOff('golge');
  const chipShadow = boxShadowParts(
    shadowOff,
    shape.shadow.raised,
    chipHeight / 2,
    true,
    shape.stroke.hairline,
  );
  return (
    <View
      // skall.css → `.reacts`: tucked 8 under the bubble, 10 in from its side.
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING[1],
        marginTop: -SPACING[2],
        paddingHorizontal: SPACING[2.5],
        justifyContent: mine ? 'flex-end' : 'flex-start',
      }}
    >
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
          {/* skall.css → `.react`: the face and the count on the surface, on the chip shadow; the
              viewer's own in the violet. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING[1],
              height: chipHeight,
              paddingLeft: SPACING[1],
              paddingRight: SPACING[2],
              borderRadius: shape.radius.pill,
              borderWidth: shape.stroke.hairline,
              borderColor: r.mine ? colors.violet : colors.divider,
              backgroundColor: r.mine ? withAlpha(colors.violet, 0.16) : colors.surface,
              boxShadow: chipShadow.boxShadow,
            }}
          >
            {chipShadow.node}
            <ReactionFace emoji={r.emoji} size="chip" />
            <Text variant="tag" tabular>
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
export function DeliveryTicks({ delivery, onAccent }: { delivery: Delivery; onAccent?: boolean }) {
  const { colors } = useTheme();
  const read = onAccent ? colors.readOnAccent : colors.read;
  const plain = onAccent ? colors.onPrimary : colors.muted;
  return (
    <View accessible accessibilityLabel={tr.dm.delivery[delivery]} testID={`tick-${delivery}`}>
      <AppIcon
        name={
          delivery === 'sending'
            ? 'time-outline'
            : delivery === 'sent'
              ? 'checkmark'
              : 'checkmark-done'
        }
        size={ICON.sm}
        color={delivery === 'read' ? read : plain}
      />
    </View>
  );
}

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
