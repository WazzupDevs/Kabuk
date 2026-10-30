import { forwardRef, type ReactNode, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { tr } from '@/i18n/tr';
import { haptic, noteTyping } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useKit } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { BRAND } from '@/theme/brand';
import { gradientStyle } from '@/theme/gradient';
import { GLASS_FACE, TAB_BAR_GLASS, TAB_GLASS, blursBehind } from '@/theme/glass';
import { typeStyle, useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { useLabOff } from '@/lib/drawLab';

import type { ChatQuote } from './ChatBubble';
import { useChatEnd, useComposerGlass } from './ChatScreen';
import { GradientFill } from './GradientFill';
import { IconButton } from './IconButton';
import { LiquidGlass } from './LiquidGlass';
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
};

// The message bar of a chat screen (v45: .dbar): it floats at the bottom over the chat's wallpaper, a
// raised pill field and a round send button, both on a soft shadow; the button fills with the accent
// once there is something to send. Over a chat's stream the field and the button are the tab bar's
// liquid glass (the owner's call, 27 Ekim); a sent message flies off with the arrow.
const SIZE = KIT.size.field;
const MUTED_SEND = 0.45;
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
  const sendShadow = shadowParts(shadowOff, KIT.sendShadow, undefined, SIZE / 2);
  const pressScale = usePressScale();
  const inactive = sendDisabled || sending;
  const followEnd = useChatEnd();
  const glassId = useComposerGlass();
  const glass = glassId !== null && TAB_BAR_GLASS && blursBehind(Platform.OS, Platform.Version);
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
            ...(glass ? null : gradientStyle(k.c.glass)),
            borderWidth: KIT.size.edge,
            borderColor: k.c.glassEdge,
            boxShadow: fieldShadow.boxShadow,
            paddingHorizontal: KIT.size.fieldPadX,
          }}
        >
          {fieldShadow.node}
          {glass && glassId ? <GlassFill targetId={glassId} radius={SIZE / 2} /> : null}
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
                  width: SIZE,
                  height: SIZE,
                  borderRadius: SIZE / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // docs/design/aura → Dm (`.send`): the ink's round button.
                  backgroundColor: k.c.chipOn,
                  boxShadow: sendShadow.boxShadow,
                },
                pressScale(pressed),
              ]}
            >
              {sendShadow.node}
              {sending ? (
                <Loader kind="meet" size={ICON.lg} delay={0} />
              ) : (
                <FlyingArrow flights={flights} muted={!!inactive} />
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
});

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

// The tab bar's glass (ui/TabBar.tsx) under the field or the button: the stream behind frosted,
// v46's light gradient at the glass's share, the white edge and its inner light.
function GlassFill({ targetId, radius }: { targetId: string; radius: number }) {
  const { scheme, colors } = useTheme();
  const t = GLASS_FACE[scheme];
  const glassOff = useLabOff('cam');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {glassOff ? null : (
        <LiquidGlass
          targetId={targetId}
          cornerRadius={radius}
          ground={colors.canvas}
          blur={TAB_GLASS.blur}
          saturation={TAB_GLASS.saturation}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[StyleSheet.absoluteFill, { opacity: TAB_GLASS.overlay }]}>
        <GradientFill css={t.gradient} radius={radius} />
      </View>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: t.border.width,
            borderColor: t.border.color,
            boxShadow: t.inset,
          },
        ]}
      />
    </View>
  );
}

// The send arrow; each send (`flights`) it flies out to the right and comes back in from the left.
// Still with reduce motion.
function FlyingArrow({ flights, muted }: { flights: number; muted: boolean }) {
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
      <SendGlyph muted={muted} />
    </Animated.View>
  );
}

// skall tuvali (skall.css → `.send .bi`): the arrow as two capsules in the brand's purple and pink;
// muted while there is nothing to send.
function SendGlyph({ muted }: { muted: boolean }) {
  const { scheme } = useKit();
  // On the ink's button: lavender and soft pink by day (Dm: send-capsule.svg), the brand's two by
  // night.
  const a = scheme === 'dark' ? BRAND.purple : KIT.sendA;
  const b = scheme === 'dark' ? BRAND.pink : KIT.sendB;
  return (
    <Svg width={ICON.lg} height={ICON.lg} viewBox="0 0 24 24" opacity={muted ? MUTED_SEND : 1}>
      <Rect
        x={5}
        y={9.8}
        width={14}
        height={4.4}
        rx={2.2}
        fill={a}
        transform="rotate(36 12 12) translate(-0.6 -3.6)"
      />
      <Rect
        x={5}
        y={9.8}
        width={14}
        height={4.4}
        rx={2.2}
        fill={b}
        transform="rotate(-36 12 12) translate(-0.6 3.6)"
      />
    </Svg>
  );
}
