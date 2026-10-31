import type { ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, PulseDot, Round, T, useKit, usePress } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { SPACING, TOUCH } from '@/theme/tokens';

type Props = {
  title: string;
  // At most this many lines; a longer title shrinks to fit rather than ending in "…" (a room's
  // name at 320 dp). Unset: it wraps freely.
  titleLines?: number;
  subtitle?: string;
  // A live dot before the subtitle (skall tuvali: Mekan sohbeti, `.sub i.live`).
  live?: boolean;
  // An avatar (or two) before the name.
  leading?: ReactNode;
  onBack?: () => void;
  // Tapping the avatar and the name: the other side's profile, where there is one.
  onPressTitle?: () => void;
  titleAccessibilityLabel?: string;
  // Text or icon buttons on the right.
  actions?: ReactNode;
  // Telegram Android's chat top (the DM; the owner's call, 29 Ekim): the back button, the avatar
  // with the name and the actions each a frosted pill of their own over the stream (docs/design/
  // aura → Dm: the rounds 48, the name's pill 56 with a 44 avatar 6 in); bare icon buttons in the
  // actions.
  split?: boolean;
};

// The compact top of a chat screen (v45: .dpin): a round back button, the avatar, the name and a
// line under it, actions; a hairline under it.
export function ChatTopBar({
  title,
  titleLines,
  subtitle,
  live,
  leading,
  onBack,
  onPressTitle,
  titleAccessibilityLabel,
  actions,
  split = false,
}: Props) {
  const who = (
    <>
      {leading}
      <View className="flex-1">
        {/* Wraps rather than ending in "…" (CLAUDE.md → Ekran davranışı): "12 Ekim'den beri
            arkadaşsınız". */}
        <T
          v={split ? 'sec' : 'h3'}
          accessibilityRole="header"
          lines={titleLines}
          fit={titleLines !== undefined}
        >
          {title}
        </T>
        {subtitle ? (
          <View className="flex-row items-center" style={{ gap: SPACING[1.5] }}>
            {live ? <PulseDot /> : null}
            <T v="fine" style={{ flexShrink: 1 }}>
              {subtitle}
            </T>
          </View>
        ) : null}
      </View>
    </>
  );
  // The avatar and the name sit straight in the bar's row. Inside another wrapper, flex-1 would
  // size them by the screen's height and squeeze them to the touch height: a two-line name then
  // spilled out of the bar.
  const whoStyle = { minHeight: TOUCH.min };
  const whoClass = 'flex-1 flex-row items-center gap-2.5';
  if (split) {
    return (
      <SplitBar
        who={who}
        bare={!leading}
        onBack={onBack}
        onPressTitle={onPressTitle}
        titleAccessibilityLabel={titleAccessibilityLabel}
        actions={actions}
      />
    );
  }
  return (
    // docs/design/aura → Dm: the bar is a glass capsule (8 inside, 30 round), the back and the
    // actions bare round buttons in it.
    <View style={{ paddingHorizontal: SPACING[4], paddingVertical: SPACING[1.5] }}>
      <Glass
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: KIT.size.barPad,
          gap: KIT.size.barGap,
          borderRadius: KIT.size.barRadius,
        }}
      >
        {onBack ? (
          <Round
            glassy={false}
            icon="back"
            label={tr.common.back}
            onPress={onBack}
            testID="chat-back"
          />
        ) : null}
        {onPressTitle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={titleAccessibilityLabel}
            onPress={onPressTitle}
            className={whoClass}
            style={whoStyle}
          >
            {who}
          </Pressable>
        ) : (
          <View className={whoClass} style={whoStyle}>
            {who}
          </View>
        )}
        {actions}
      </Glass>
    </View>
  );
}

// The name's pill (56: the kit's 44 face 6 in) and the round pills beside it (48), docs/design/aura
// → Dm.
export const SPLIT_PILL = KIT.size.dmPill;
const PILL = SPLIT_PILL;
const ROUND = KIT.size.roundLg;
const PILL_INSET = (PILL - KIT.size.av.md) / 2;
const PILL_PAD_RIGHT = 14;

function SplitBar({
  who,
  bare,
  onBack,
  onPressTitle,
  titleAccessibilityLabel,
  actions,
}: {
  who: ReactNode;
  // No avatar: the name starts as far in as the pill's round.
  bare: boolean;
  onBack?: () => void;
  onPressTitle?: () => void;
  titleAccessibilityLabel?: string;
  actions?: ReactNode;
}) {
  const { c } = useKit();
  const press = usePress();
  const pill = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    minHeight: PILL,
  };
  // Wrapped in its button, the button takes the row's room and the pill only its content's height
  // (flex 1 in a column would size it by the button, a two-line name spilling out).
  const whoPill = (
    <Glass
      frost
      radius={PILL / 2}
      style={{
        ...pill,
        ...(onPressTitle ? null : { flex: 1 }),
        padding: PILL_INSET,
        paddingLeft: bare ? SPACING[4] : PILL_INSET,
        paddingRight: PILL_PAD_RIGHT,
        gap: SPACING[2.5],
      }}
    >
      {who}
    </Glass>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[2],
        paddingHorizontal: KIT.size.side,
        paddingVertical: SPACING[1.5],
      }}
    >
      {onBack ? (
        // The whole circle is the button and sinks as one.
        <Pressable
          testID="chat-back"
          accessibilityRole="button"
          accessibilityLabel={tr.common.back}
          onPress={onBack}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
        >
          <Animated.View style={{ transform: [{ scale: press.scale }] }}>
            <Glass
              frost
              radius={ROUND / 2}
              style={{
                width: ROUND,
                height: ROUND,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CapIcon name="back" color={c.ink} />
            </Glass>
          </Animated.View>
        </Pressable>
      ) : null}
      {onPressTitle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={titleAccessibilityLabel}
          onPress={onPressTitle}
          style={{ flex: 1 }}
        >
          {whoPill}
        </Pressable>
      ) : (
        whoPill
      )}
      {actions ? (
        <Glass
          frost
          radius={ROUND / 2}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: ROUND,
            minWidth: ROUND,
            justifyContent: 'center',
            paddingHorizontal: Math.max(0, (ROUND - TOUCH.min) / 2),
          }}
        >
          {actions}
        </Glass>
      ) : null}
    </View>
  );
}
