import type { ReactNode } from 'react';
import { Animated, Pressable, useWindowDimensions, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, PulseDot, T, useKit, usePress } from '@/aura/kit';
import { FxMoves } from '@/components/FxSvg';
import { tr } from '@/i18n/tr';
import { isNarrow } from '@/lib/narrow';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

type Props = {
  title: string;
  // At most this many lines; a longer title shrinks to fit rather than ending in "…" (a room's
  // name at 320 dp). Unset: it wraps freely.
  titleLines?: number;
  subtitle?: string;
  // A live dot before the subtitle (skall tuvali: Mekan sohbeti, `.sub i.live`); without a
  // subtitle, after the title on its line.
  live?: boolean;
  // An avatar (or two) before the name.
  leading?: ReactNode;
  onBack?: () => void;
  // Tapping the avatar and the name: the other side's profile, where there is one.
  onPressTitle?: () => void;
  titleAccessibilityLabel?: string;
  // The last writers' faces: the first thing to go when the bar is narrow (320 dp, the largest text).
  stack?: ReactNode;
  // Small faces on a second line under the title, after the live dot (the venue chat's last
  // writers, the owner's call, 8 Kasım): the title keeps its full size. Gone when narrow, as `stack`.
  under?: ReactNode;
  // Who the viewer writes as (IdentityToggle), just left of the actions.
  toggle?: ReactNode;
  // Bare icon buttons at the capsule's right end (⋯).
  actions?: ReactNode;
  // U25 (MasaSohbeti `.hpill`): the capsule without a face 20 in.
  compact?: boolean;
};

// The top of every chat (the owner's call, 8 Kasım; Telegram Android's chat top): the back button a
// frosted round of its own, then one frosted capsule: the avatar and the name (with its live dot) on
// the left, the writers' faces, the identity toggle and the menu on the right. Narrow, the faces go
// first and then the name shrinks; the back, the toggle and the menu never move. No capsule in the
// bar moves (its accessories drawn still, the owner's call, 8 Kasım).
export function ChatTopBar({
  title,
  titleLines,
  subtitle,
  live,
  leading,
  onBack,
  onPressTitle,
  titleAccessibilityLabel,
  stack,
  under,
  toggle,
  actions,
  compact = false,
}: Props) {
  const { c } = useKit();
  const press = usePress();
  const { width, fontScale } = useWindowDimensions();
  const narrow = isNarrow(width, fontScale);
  const faces = narrow ? null : (stack ?? null);
  const below = narrow ? null : (under ?? null);
  const who = (
    <>
      {leading}
      <View style={{ flex: 1 }}>
        {/* Wraps rather than ending in "…" (CLAUDE.md → Ekran davranışı): "12 Ekim'den beri
            arkadaşsınız". */}
        <View className="flex-row items-center" style={{ gap: SPACING[1.5] }}>
          <T
            // U25, U26, U28: the name h3 in every bar.
            v="h3"
            accessibilityRole="header"
            lines={titleLines}
            fit={titleLines !== undefined}
            style={{ flexShrink: 1 }}
          >
            {title}
          </T>
          {live && !subtitle && !below ? <PulseDot /> : null}
        </View>
        {below && !subtitle ? (
          <View className="flex-row items-center" style={{ gap: SPACING[1.5] }}>
            {live ? <PulseDot /> : null}
            {below}
          </View>
        ) : null}
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
  // The avatar and the name sit straight in the capsule's row: a two-line name grows the capsule,
  // never spills out of it.
  const whoStyle = {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    minHeight: PILL,
    paddingVertical: PILL_INSET,
    gap: SPACING[2.5],
  };
  const right = faces !== null || !!toggle || !!actions;
  return (
    <FxMoves on={false}>
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
        <Glass
          frost
          radius={PILL / 2}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: PILL,
            paddingLeft: compact ? KIT.chatPillPadX : leading ? PILL_INSET : SPACING[4],
            paddingRight: right ? 0 : PILL_PAD_RIGHT,
            gap: SPACING[1],
          }}
        >
          {onPressTitle ? (
            <Pressable
              testID="chat-title"
              accessibilityRole="button"
              accessibilityLabel={titleAccessibilityLabel}
              onPress={onPressTitle}
              style={whoStyle}
            >
              {who}
            </Pressable>
          ) : (
            <View style={whoStyle}>{who}</View>
          )}
          {faces}
          {toggle}
          {actions}
        </Glass>
      </View>
    </FxMoves>
  );
}

// The capsule (44: the kit's 36 face 4 in) and the round back button beside it (44), docs/design/
// aura → Dm.
export const SPLIT_PILL = KIT.size.dmPill;
const PILL = SPLIT_PILL;
const ROUND = KIT.size.roundLg;
// The avatar in it 36 (`member`), 4 in.
const PILL_INSET = (PILL - KIT.size.av.member) / 2;
const PILL_PAD_RIGHT = 14;
