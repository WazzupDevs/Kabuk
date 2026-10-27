import { forwardRef, type ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { tr } from '@/i18n/tr';
import { haptic, noteTyping } from '@/lib/haptics';
import { BRAND } from '@/theme/brand';
import { typeStyle, useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import type { ChatQuote } from './ChatBubble';
import { useChatEnd } from './ChatScreen';
import { IconButton } from './IconButton';
import { usePressScale } from './motion';
import { Text } from './Text';
import { Loader } from './Loader';

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
// once there is something to send.
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
  const pressScale = usePressScale();
  const inactive = sendDisabled || sending;
  const followEnd = useChatEnd();
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
            minHeight: SPACING[12] + SPACING[1],
            borderRadius: shape.radius.xl,
            backgroundColor: colors.surface,
            borderWidth: shape.stroke.hairline,
            borderColor: colors.control,
            boxShadow: shape.shadow.sheet,
            paddingHorizontal: SPACING[4] + SPACING[0.5],
          }}
        >
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
              style={{ paddingHorizontal: SPACING[4] + SPACING[0.5] }}
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
            onSend();
            // The stream goes to its end with the message (every chat).
            followEnd?.();
          }}
        >
          {({ pressed }) => (
            <View
              style={[
                {
                  width: SPACING[12] + SPACING[1],
                  height: SPACING[12] + SPACING[1],
                  borderRadius: shape.radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                  boxShadow: shape.shadow.sheet,
                },
                pressScale(pressed),
              ]}
            >
              {sending ? (
                <Loader kind="meet" size={ICON.lg} delay={0} />
              ) : (
                <SendGlyph muted={!!inactive} />
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
});

// The message being answered, over the message bar: a bar on the left, the name and one line.
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

// skall tuvali (skall.css → `.send .bi`): the arrow as two capsules in the brand's purple and pink;
// muted while there is nothing to send.
function SendGlyph({ muted }: { muted: boolean }) {
  const { colors } = useTheme();
  const a = muted ? colors.control : BRAND.purple;
  const b = muted ? colors.control : BRAND.pink;
  return (
    <Svg width={ICON.lg} height={ICON.lg} viewBox="0 0 24 24">
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
