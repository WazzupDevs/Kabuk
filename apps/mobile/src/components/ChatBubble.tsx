import { Ionicons } from '@expo/vector-icons';
import { isReaction, type Reaction } from '@shared/reactions.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import { AVATAR_SIZE } from './Avatar';
import { type BubbleAction, MessagePop, type PopAnchor } from './MessagePop';
import { ReactionFace } from './ReactionFace';
import { Text } from './Text';

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

export type Delivery = 'sent' | 'delivered' | 'read';

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
const INVISIBLE = 'transparent';
// skall.css → `.typing i`: the brand's purple, pink and orange.
const TYPING_DOTS = [BRAND.purple, BRAND.pink, BRAND.orange] as const;

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
  const { colors, shape } = useTheme();
  // A long press lifts the message over a scrim with the faces and its actions (MessagePop), from
  // where it sits on the screen.
  const faceRef = useRef<View>(null);
  const [pop, setPop] = useState<PopAnchor | null>(null);
  const holdable = !!onReact || actions.length > 0;
  const lift = () => {
    faceRef.current?.measureInWindow((x, y, width, height) => {
      haptic('grabbed');
      setPop({ x, y, width, height });
    });
  };
  // skall tuvali (skall.css → `.bub`): 18 all round; a run's first bubble points at its author with
  // a 6 corner at the top (left for others, right for the viewer's own).
  const big = shape.radius.lg - SPACING[1];
  const small = SPACING[1.5];
  const top = first ? small : big;
  const fg = mine ? colors.onPrimary : colors.text;
  const inside = !mine && nameInk !== undefined;
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
        style={{
          paddingHorizontal: SPACING[3],
          paddingVertical: SPACING[2],
          borderTopLeftRadius: mine ? big : top,
          borderTopRightRadius: mine ? top : big,
          borderBottomLeftRadius: big,
          borderBottomRightRadius: big,
          backgroundColor: mine ? colors.primary : colors.surface,
          borderWidth: mine ? 0 : shape.stroke.hairline,
          borderColor: colors.divider,
          opacity: state === 'sending' ? 0.6 : 1,
          boxShadow: lifted ? shape.shadow.focus : undefined,
        }}
      >
        {inside && first && name ? (
          <Pressable
            testID={testID ? `${testID}-name` : undefined}
            accessibilityRole="button"
            accessibilityLabel={tr.chat.openProfile(name)}
            disabled={!onPressSender}
            onPress={onPressSender}
            hitSlop={SPACING[1.5]}
            className="self-start"
            style={{ marginBottom: SPACING[0.5] }}
          >
            <Text variant="label" color={nameInk}>
              {name}
            </Text>
          </Pressable>
        ) : null}
        {quote ? <QuoteBlock quote={quote} mine={mine} onPress={onPressQuote} /> : null}
        {/* The time sits in the text's last line, bottom right (skall.css → `.bub .tm`, a float).
            React Native has no float, and a wrapping row measured the bubble wrong (bubbles ran
            into each other): the text ends with an invisible copy of the time, which makes the
            room, and the time is laid over that room. */}
        <View>
          <Text color={fg}>
            {text}
            {time && !state ? (
              <Text variant="caption" color={INVISIBLE} accessible={false}>
                {`${TIME_GAP}${time}${mine && delivery ? TICKS_ROOM : ''}`}
              </Text>
            ) : null}
          </Text>
          {time && !state ? (
            <View
              className="absolute flex-row items-center gap-1"
              style={{ right: 0, bottom: 0 }}
              importantForAccessibility="no-hide-descendants"
            >
              <Text variant="caption" color={mine ? colors.onPrimary : colors.muted}>
                {time}
              </Text>
              {mine && delivery ? <DeliveryTicks delivery={delivery} onAccent /> : null}
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
        ...actions,
      ]}
    >
      {face(true)}
    </MessagePop>
  ) : null;

  if (mine) {
    return (
      <View className="items-end gap-1 self-end" style={{ maxWidth: '76%' }}>
        {bar}
        <SwipeToReply onReply={onReply}>{bubble}</SwipeToReply>
        {chips}
        {state ? (
          <View className="flex-row items-center gap-3">
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
      <View className="gap-1 self-start" style={{ maxWidth: '88%' }}>
        {bar}
        <View className="flex-row items-start" style={{ columnGap: SPACING[2] }}>
          {/* Kept empty under the run's first photo, so the bubbles stay in one column. */}
          <View style={{ width: AVATAR_SIZE.sm }}>{photo}</View>
          <View className="shrink items-start gap-1">
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
      <View className="flex-row items-center gap-2">
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
        className="self-start"
      >
        {headRow}
      </Pressable>
    ) : (
      headRow
    );
  return (
    <View className="gap-1 self-start" style={{ maxWidth: '88%' }}>
      {head}
      {/* Not under the photo's indent: the bar is wider than the column there. */}
      {bar}
      <View className="items-start gap-1" style={{ paddingLeft: avatar ? INDENT : 0 }}>
        <SwipeToReply onReply={onReply}>{bubble}</SwipeToReply>
        {chips}
      </View>
    </View>
  );
}

// The answered message inside a bubble: a bar on the left, the sender's name and one line of text.
function QuoteBlock({
  quote,
  mine,
  onPress,
}: {
  quote: ChatQuote;
  mine: boolean;
  onPress?: () => void;
}) {
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
      <Animated.View
        pointerEvents="none"
        className="absolute items-center justify-center"
        style={{
          left: -SPACING[10],
          top: 0,
          bottom: 0,
          opacity: dx.interpolate({ inputRange: [0, SWIPE_TRIGGER], outputRange: [0, 1] }),
        }}
      >
        <View
          className="items-center justify-center"
          style={{
            width: SPACING[8],
            height: SPACING[8],
            borderRadius: shape.radius.pill,
            backgroundColor: colors.surface2,
          }}
        >
          <Ionicons name="arrow-undo" size={ICON.sm} color={colors.text} />
        </View>
      </Animated.View>
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
  return (
    <View
      className="flex-row flex-wrap"
      // skall.css → `.reacts`: tucked 8 under the bubble, 10 in from its side.
      style={{
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
            className="flex-row items-center"
            style={{
              gap: SPACING[1],
              height: chipHeight,
              paddingLeft: SPACING[1],
              paddingRight: SPACING[2],
              borderRadius: shape.radius.pill,
              borderWidth: shape.stroke.hairline,
              borderColor: r.mine ? colors.violet : colors.divider,
              backgroundColor: r.mine ? withAlpha(colors.violet, 0.16) : colors.surface,
              boxShadow: shape.shadow.raised,
            }}
          >
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
      <Ionicons
        name={delivery === 'sent' ? 'checkmark' : 'checkmark-done'}
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
  const { colors, shape } = useTheme();
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

  const big = shape.radius.lg - SPACING[1];
  return (
    <View
      className="flex-row items-end gap-2 self-start"
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={tr.dm.typing}
      testID={testID}
    >
      {avatar}
      <View
        className="flex-row items-center"
        style={{
          gap: SPACING[1],
          paddingHorizontal: SPACING[3] + SPACING[0.5],
          paddingVertical: SPACING[3],
          // skall tuvali (Dm): a plain bubble with the brand's three dots.
          borderRadius: big,
          borderWidth: shape.stroke.hairline,
          borderColor: colors.divider,
          backgroundColor: colors.surface,
        }}
      >
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={{
              width: DOT,
              height: DOT,
              borderRadius: shape.radius.pill,
              backgroundColor: TYPING_DOTS[i],
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
