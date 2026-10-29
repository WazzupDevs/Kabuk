import type { ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, PulseDot, Round, T, useKit, usePress } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { SPACING, TOUCH } from '@/theme/tokens';

import { AVATAR_SIZE } from './Avatar';

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
  // with the name and the actions each a glass pill of their own, the avatar (`lg`) filling its pill
  // but for a thin edge; bare icon buttons in the actions.
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

// The pills' height: the `lg` avatar and its edge.
const PILL = AVATAR_SIZE.lg + KIT.size.splitInset * 2;

function SplitBar({
  who,
  onBack,
  onPressTitle,
  titleAccessibilityLabel,
  actions,
}: {
  who: ReactNode;
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
      radius={PILL / 2}
      style={{
        ...pill,
        ...(onPressTitle ? null : { flex: 1 }),
        padding: KIT.size.splitInset,
        paddingRight: SPACING[4],
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
        paddingHorizontal: SPACING[2],
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
              radius={PILL / 2}
              style={{ width: PILL, height: PILL, alignItems: 'center', justifyContent: 'center' }}
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
          radius={PILL / 2}
          style={{
            ...pill,
            height: PILL,
            minWidth: PILL,
            justifyContent: 'center',
            paddingHorizontal: (PILL - TOUCH.min) / 2,
          }}
        >
          {actions}
        </Glass>
      ) : null}
    </View>
  );
}
