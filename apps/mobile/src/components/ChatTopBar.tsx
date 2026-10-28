import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Glass, Round, T } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { LiveDot } from '@/ui/LiveDot';
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
}: Props) {
  const who = (
    <>
      {leading}
      <View className="flex-1">
        {/* Wraps rather than ending in "…" (CLAUDE.md → Ekran davranışı): "12 Ekim'den beri
            arkadaşsınız". */}
        <T v="h3" accessibilityRole="header" lines={titleLines} fit={titleLines !== undefined}>
          {title}
        </T>
        {subtitle ? (
          <View className="flex-row items-center" style={{ gap: SPACING[1.5] }}>
            {live ? <LiveDot size={SPACING[2]} /> : null}
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
