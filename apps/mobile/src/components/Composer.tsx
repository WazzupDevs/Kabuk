import { forwardRef, type ReactNode, useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { tr } from '@/i18n/tr';
import { haptic, noteTyping } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { CapIcon } from '@/aura/CapIcon';
import { useKit } from '@/aura/kit';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { typeStyle, useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { useLabOff } from '@/lib/drawLab';

import type { ChatQuote } from './ChatBubble';
import { useChatEnd } from './ChatScreen';
import { IconButton } from './IconButton';
import { usePressScale } from './motion';
import { Text } from './Text';
import { Loader } from './Loader';
import { shadowParts } from './NativeShadow';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength: number;
  onSend: () => void;
  // The send button's name for screen readers and tests ("Gönder").
  sendLabel: string;
  sendDisabled?: boolean;
  sending?: boolean;
  // A compact row over the field: the venue chat's "Profilimle yaz" switch.
  above?: ReactNode;
  // Aşama 8 · Saha: the message being answered, as a strip over the field, with a ×.
  replyTo?: ChatQuote;
  onCancelReply?: () => void;
  inputTestID?: string;
  sendTestID?: string;
  // iskelet.md → 5.5 (the DM): one capsule, the send button inside it at the right, shown only
  // once there is something to send.
  capsule?: boolean;
};

// The message bar of a chat screen (v45: .dbar): it floats at the bottom over the chat's wallpaper, a
// raised pill field and a round send button, both on a soft shadow; the button fills with the accent
// once there is something to send. Over a chat's stream the field and the button are the tab bar's
// liquid glass (the owner's call, 27 Ekim); a sent message flies off with the arrow.
// The field and the send button 44, as the bar's rounds (the owner's call, 2 Kasım, 13.2).
const SIZE = KIT.size.composerField;
const SEND = KIT.size.composerSend;
// The arrow's flight: out to the right, then back in from the left.
const FLY_OUT_MS = 150;
const FLY_IN_MS = 230;
export const Composer = forwardRef<TextInput, Props>(function Composer(
  {
    value,
    onChangeText,
    placeholder,
    maxLength,
    onSend,
    sendLabel,
    sendDisabled,
    sending,
    above,
    replyTo,
    onCancelReply,
    inputTestID,
    sendTestID,
    capsule,
  },
  ref,
) {
  if (capsule) {
    return (
      <CapsuleBar
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={maxLength}
        onSend={onSend}
        sendLabel={sendLabel}
        sendDisabled={sendDisabled}
        sending={sending}
        above={above}
        replyTo={replyTo}
        onCancelReply={onCancelReply}
        inputTestID={inputTestID}
        sendTestID={sendTestID}
      />
    );
  }
  return (
    <PillBar
      ref={ref}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      maxLength={maxLength}
      onSend={onSend}
      sendLabel={sendLabel}
      sendDisabled={sendDisabled}
      sending={sending}
      above={above}
      replyTo={replyTo}
      onCancelReply={onCancelReply}
      inputTestID={inputTestID}
      sendTestID={sendTestID}
    />
  );
});

type BarProps = Omit<Props, 'capsule'>;

// The field and the round send button beside it (the masa, venue and district chats).
const PillBar = forwardRef<TextInput, BarProps>(function PillBar(
  {
    value,
    onChangeText,
    placeholder,
    maxLength,
    onSend,
    sendLabel,
    sendDisabled,
    sending,
    above,
    replyTo,
    onCancelReply,
    inputTestID,
    sendTestID,
  },
  ref,
) {
  const theme = useTheme();
  const { colors, shape } = theme;
  const k = useKit();
  // The field's and the send button's soft shadows natively (NativeShadow.tsx).
  const shadowOff = useLabOff('golge');
  const fieldShadow = shadowParts(
    shadowOff,
    k.c.glassShadow,
    undefined,
    SIZE / 2,
    true,
    KIT.size.edge,
  );
  const sendShadow = shadowParts(shadowOff, KIT.sendShadow, undefined, SEND / 2);
  const pressScale = usePressScale();
  const inactive = sendDisabled || sending;
  // Nothing to send (U25 `.send.off`); while sending it keeps its colour and shows the loader.
  const off = !!sendDisabled && !sending;
  const followEnd = useChatEnd();
  const [flights, setFlights] = useState(0);
  return (
    <View
      style={{
        // skall tuvali (skall.css → `.composer`): 8 16 18.
        paddingHorizontal: shape.screenPadding,
        paddingTop: above ? SPACING[1] : SPACING[2],
        paddingBottom: SPACING[4] + SPACING[0.5],
        gap: SPACING[1.5],
      }}
    >
      {above}
      {replyTo ? <ReplyStrip quote={replyTo} onCancel={onCancelReply} /> : null}
      <View className="flex-row items-end gap-2">
        <View
          className="flex-1 justify-center"
          style={{
            // skall tuvali (skall.css → `.composer`): the field on the float shadow, the round
            // send button beside it.
            // docs/design/aura → Dm (`.glass.field`): 54 high, round, frosted.
            minHeight: SIZE,
            borderRadius: SIZE / 2,
            // A still surface, not live glass: the message passing under it bent its colour into
            // the field (the owner's call, 2 Kasım, 13.3; every chat, 13.5).
            // In the light theme a solid white: the half-clear glass let the wallpaper's picture
            // through under the words (audit M15-20).
            ...(k.scheme === 'light'
              ? { backgroundColor: KIT.bubble.light.mine }
              : gradientStyle(k.c.glass)),
            borderWidth: KIT.size.edge,
            borderColor: k.c.glassEdge,
            boxShadow: fieldShadow.boxShadow,
            paddingHorizontal: KIT.size.fieldPadX,
          }}
        >
          {fieldShadow.node}
          <TextInput
            ref={ref}
            testID={inputTestID}
            value={value}
            onChangeText={(text) => {
              // No touch while the person types (K-30).
              noteTyping();
              onChangeText(text);
            }}
            accessibilityLabel={placeholder}
            selectionColor={colors.accent}
            maxLength={maxLength}
            multiline
            // The canvas's field type (skall.css → `.field`: 14/20, 600). Android's extra font
            // padding would sit the line low in the pill.
            style={[
              typeStyle(theme, 'body'),
              {
                color: colors.text,
                paddingVertical: SPACING[2.5],
                // The hint drawn over it starts at the field's edge: so does the text.
                paddingHorizontal: 0,
                maxHeight: SPACING[16] * 2,
                includeFontPadding: false,
                textAlignVertical: 'center',
              },
            ]}
          />
          {/* The hint is drawn by the app, in the app's type: Android drew the field's own hint in
              another face (the owner's report, 27 Ekim). */}
          {value.length === 0 ? (
            <View
              pointerEvents="none"
              className="absolute inset-0 justify-center"
              style={{ paddingHorizontal: KIT.size.fieldPadX }}
            >
              <Text variant="body" color={colors.placeholder}>
                {placeholder}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          testID={sendTestID}
          accessibilityRole="button"
          accessibilityLabel={sendLabel}
          accessibilityState={{ disabled: !!inactive, busy: !!sending }}
          disabled={inactive}
          onPress={() => {
            haptic('sent');
            setFlights((n) => n + 1);
            onSend();
            // The stream goes to its end with the message (every chat).
            followEnd?.();
          }}
        >
          {({ pressed }) => (
            <View
              style={[
                {
                  width: SEND,
                  height: SEND,
                  borderRadius: SEND / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // docs/design/aura → Dm (`.send`): the ink's round button; with nothing to send
                  // passive (U25, `.send.off`; the owner's call, 2 Kasım, rapor §12.2).
                  backgroundColor: off ? k.c.disabled : k.c.chipOn,
                  boxShadow: off ? undefined : sendShadow.boxShadow,
                },
                pressScale(pressed),
              ]}
            >
              {off ? null : sendShadow.node}
              {sending ? (
                <Loader kind="meet" size={ICON.lg} delay={0} />
              ) : (
                <FlyingArrow flights={flights} off={off} />
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
});

// iskelet.md → 5.5: the DM's message bar is one glass capsule (52), the field filling it and the
// send button inside it at the right, a 38 green round with a white arrow up. With nothing to send
// it is not there; once there is, it grows from 0.4 to 1 on springs.pop (at once with reduce
// motion). A still surface as the pill field (the message passing under it would bend its colour).
const CAPSULE = KIT.size.composerCapsule;
const SEND_IN = KIT.size.composerSendIn;
const SEND_INSET = KIT.size.composerSendInset;

const CapsuleBar = forwardRef<TextInput, BarProps>(function CapsuleBar(
  {
    value,
    onChangeText,
    placeholder,
    maxLength,
    onSend,
    sendLabel,
    sendDisabled,
    sending,
    above,
    replyTo,
    onCancelReply,
    inputTestID,
    sendTestID,
  },
  ref,
) {
  const theme = useTheme();
  const { colors, shape } = theme;
  const k = useKit();
  const shadowOff = useLabOff('golge');
  const capsuleShadow = shadowParts(
    shadowOff,
    k.c.glassShadow,
    undefined,
    CAPSULE / 2,
    true,
    KIT.size.edge,
  );
  const followEnd = useChatEnd();
  const shown = !sendDisabled || !!sending;
  return (
    <View
      style={{
        paddingHorizontal: shape.screenPadding,
        paddingTop: above ? SPACING[1] : SPACING[2],
        paddingBottom: SPACING[4] + SPACING[0.5],
        gap: SPACING[1.5],
      }}
    >
      {above}
      {replyTo ? <ReplyStrip quote={replyTo} onCancel={onCancelReply} /> : null}
      <View
        style={{
          minHeight: CAPSULE,
          borderRadius: CAPSULE / 2,
          justifyContent: 'center',
          ...(k.scheme === 'light'
            ? { backgroundColor: KIT.bubble.light.mine }
            : gradientStyle(k.c.glass)),
          borderWidth: KIT.size.edge,
          borderColor: k.c.glassEdge,
          boxShadow: capsuleShadow.boxShadow,
          paddingLeft: KIT.size.fieldPadX,
          // The words stop short of the send button's place, shown or not.
          paddingRight: SEND_IN + 2 * SEND_INSET,
        }}
      >
        {capsuleShadow.node}
        <TextInput
          ref={ref}
          testID={inputTestID}
          value={value}
          onChangeText={(text) => {
            // No touch while the person types (K-30).
            noteTyping();
            onChangeText(text);
          }}
          accessibilityLabel={placeholder}
          selectionColor={colors.accent}
          maxLength={maxLength}
          multiline
          style={[
            typeStyle(theme, 'body'),
            {
              color: colors.text,
              paddingVertical: SPACING[3],
              paddingHorizontal: 0,
              maxHeight: SPACING[16] * 2,
              includeFontPadding: false,
              textAlignVertical: 'center',
            },
          ]}
        />
        {value.length === 0 ? (
          <View
            pointerEvents="none"
            className="absolute inset-0 justify-center"
            style={{ paddingLeft: KIT.size.fieldPadX }}
          >
            <Text variant="body" color={colors.placeholder}>
              {placeholder}
            </Text>
          </View>
        ) : null}
        <View style={{ position: 'absolute', right: SEND_INSET, bottom: SEND_INSET }}>
          <SendIn
            shown={shown}
            sending={!!sending}
            disabled={!!sendDisabled || !!sending}
            label={sendLabel}
            testID={sendTestID}
            onPress={() => {
              haptic('sent');
              onSend();
              // The stream goes to its end with the message (every chat).
              followEnd?.();
            }}
          />
        </View>
      </View>
    </View>
  );
});

// The capsule's send button: hidden while there is nothing to send, grown on springs.pop when
// there is.
function SendIn({
  shown,
  sending,
  disabled,
  label,
  testID,
  onPress,
}: {
  shown: boolean;
  sending: boolean;
  disabled: boolean;
  label: string;
  testID?: string;
  onPress: () => void;
}) {
  const reduce = useReduceMotion();
  const from = MOTION.messageIn.sendFromScale;
  const scale = useSharedValue(shown ? 1 : from);
  const seen = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    if (!shown) {
      seen.set(0);
      scale.set(from);
      return;
    }
    seen.set(1);
    scale.set(reduce ? 1 : withSpring(1, MOTION.springs.pop));
  }, [shown, reduce, from, scale, seen]);
  const style = useAnimatedStyle(() => ({
    opacity: seen.get(),
    transform: [{ scale: scale.get() }],
  }));
  const pressScale = usePressScale();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: sending }}
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      disabled={disabled || !shown}
      onPress={onPress}
    >
      {({ pressed }) => (
        <Animated.View style={style}>
          <View
            style={[
              {
                width: SEND_IN,
                height: SEND_IN,
                borderRadius: SEND_IN / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: KIT.primary,
              },
              pressScale(pressed),
            ]}
          >
            {sending ? (
              <Loader kind="meet" size={ICON.md} delay={0} label={null} />
            ) : (
              <Svg width={ICON.md} height={ICON.md} viewBox="0 0 24 24">
                <Path
                  d={ARROW_UP}
                  fill="none"
                  stroke={KIT.onPrimary}
                  strokeWidth={ARROW_STROKE}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}
// iskelet.md → 2.4: the line icons' stroke, round ends.
const ARROW_UP = 'M12 19V5M5.5 11.5 12 5l6.5 6.5';
const ARROW_STROKE = 2.2;

// The message being answered, over the message bar: a bar on the left, the name and one line.
type DraftProps = Omit<Props, 'value' | 'onChangeText' | 'onSend' | 'sendDisabled'> & {
  // What a draft would send (trimmed, within the limit), or null.
  prepare: (raw: string) => string | null;
  // Nothing can be sent now, whatever is typed (the venue chat before its identity is known).
  blocked?: boolean;
  // Each change of the draft, for what follows typing ("yazıyor").
  onDraftChange?: (text: string) => void;
  // Sends the prepared text; `clear` empties the bar: at once, or once the server took it. Typed
  // on meanwhile, the bar keeps the new text (audit CHAT-13).
  onSend: (body: string, clear: () => void) => void;
};

// The message bar holding what is typed itself (performance audit, 28 Ekim): with the draft on the
// chat screen, every key drew the whole screen again with its hundred messages; here a key draws
// the bar only.
export function DraftComposer({ prepare, blocked, onDraftChange, onSend, ...props }: DraftProps) {
  const [draft, setDraft] = useState('');
  const body = prepare(draft);
  return (
    <Composer
      {...props}
      value={draft}
      onChangeText={(text) => {
        setDraft(text);
        onDraftChange?.(text);
      }}
      sendDisabled={!body || !!blocked}
      onSend={() => {
        if (!body || blocked) return;
        const sent = draft;
        onSend(body, () => setDraft((now) => (now === sent ? '' : now)));
      }}
    />
  );
}

function ReplyStrip({ quote, onCancel }: { quote: ChatQuote; onCancel?: () => void }) {
  const { colors, shape } = useTheme();
  return (
    <View
      testID="reply-strip"
      className="flex-row items-center"
      style={{
        gap: SPACING[2],
        paddingLeft: SPACING[3],
        borderRadius: shape.radius.md,
        borderLeftWidth: SPACING[1],
        borderLeftColor: quote.color ?? colors.violet,
        backgroundColor: colors.raised,
      }}
    >
      <View className="flex-1" style={{ paddingVertical: SPACING[1.5] }}>
        <Text variant="label" color={quote.color ?? colors.violet}>
          {tr.chat.replyingTo(quote.name)}
        </Text>
        {/* An excerpt of the answered message: one line. */}
        <Text variant="fine" tone="text" numberOfLines={1}>
          {quote.text}
        </Text>
      </View>
      {onCancel ? (
        <IconButton
          icon="close"
          label={tr.chat.cancelReply}
          onPress={onCancel}
          testID="reply-cancel"
        />
      ) : null}
    </View>
  );
}

// The send arrow; each send (`flights`) it flies out to the right and comes back in from the left.
// Still with reduce motion.
function FlyingArrow({ flights, off }: { flights: number; off: boolean }) {
  const reduce = useReduceMotion();
  const x = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    if (flights === 0 || reduce) return;
    const out = { duration: FLY_OUT_MS, easing: Easing.in(Easing.quad) };
    const back = { duration: FLY_IN_MS, easing: Easing.out(Easing.back(1.6)) };
    x.set(
      withSequence(
        withTiming(SPACING[6], out),
        withTiming(-SPACING[6], { duration: 0 }),
        withTiming(0, back),
      ),
    );
    fade.set(withSequence(withTiming(0, out), withTiming(1, back)));
  }, [flights, reduce, x, fade]);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateX: x.value }],
  }));
  return (
    <Animated.View style={style}>
      <SendGlyph off={off} />
    </Animated.View>
  );
}

// Aura v65 `.send`: the capsule family's send icon in the ink button's own colour (on-feature);
// on the passive button its ink (`.send.off`).
function SendGlyph({ off }: { off: boolean }) {
  const { c } = useKit();
  return <CapIcon name="send" color={off ? c.onDisabled : c.onChipOn} size={ICON.lg} />;
}
