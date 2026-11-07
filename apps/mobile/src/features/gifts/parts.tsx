import type { GiftTier } from '@shared/gifts.ts';
import { Animated, View } from 'react-native';

import { Round, T, Tag, useKit } from '@/aura/kit';
import { CapIcon } from '@/aura/CapIcon';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { GIFT_BADGE, TIER_COLOR, TIER_TAG_ALPHA } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { useBeat } from './loops';
import { tierName } from './model';

const TIER_MARKS: Record<GiftTier, number> = { siradan: 1, nadir: 2, destansi: 3, efsanevi: 4 };
const MARK = 6;

// The tier tag (hediye.css `.nd`): its colour's marks, one to four (the colour never stands alone),
// and its name, on the colour at 16 %.
export function TierTag({ tier, large }: { tier: GiftTier; large?: boolean }) {
  const { c, scheme } = useKit();
  const color = TIER_COLOR[scheme][tier];
  return (
    <Tag
      label={tierName(tier)}
      large={large}
      colors={{ bg: `${color}${TIER_TAG_ALPHA}`, fg: c.ink }}
      lead={
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {Array.from({ length: TIER_MARKS[tier] }, (_, i) => (
            <View
              key={i}
              style={{
                width: MARK,
                height: MARK,
                borderRadius: 1,
                backgroundColor: color,
                transform: [{ rotate: '45deg' }],
              }}
            />
          ))}
        </View>
      }
    />
  );
}

// "Yakında" over a locked pack (hediye.css `.lk`): the lock and the word, on the surface.
export function SoonTag({ large }: { large?: boolean }) {
  const { c } = useKit();
  return (
    <Tag
      label={tr.gifts.soon}
      large={large}
      colors={{ bg: c.raisedRound, fg: c.ink }}
      lead={<CapIcon name="lock" color={c.ink} size={ICON.sm} />}
    />
  );
}

// The "can open" badge (GaleriHediye: 24, pink, a white ring, a halo): it beats every 1.6 s
// (1 → 1.12 → 1) and its ring spreads (1 → 2.1, fading); still with reduce motion.
export const BADGE = 24;
export function CanOpenBadge({ count }: { count: number }) {
  const t = useBeat(GIFT_MOTION.badge.ms);
  const { scale, ringTo, ringFrom } = GIFT_MOTION.badge;
  return (
    <View
      accessible
      accessibilityLabel={tr.gifts.canOpen(count)}
      style={{ width: BADGE, height: BADGE }}
    >
      {t ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: BADGE / 2,
            borderWidth: 2,
            borderColor: GIFT_BADGE.fill,
            opacity: t.interpolate({ inputRange: [0, 1], outputRange: [ringFrom, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, ringTo] }) }],
          }}
        />
      ) : null}
      <Animated.View
        style={{
          width: BADGE,
          height: BADGE,
          borderRadius: BADGE / 2,
          backgroundColor: GIFT_BADGE.fill,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 0 2.5px ${GIFT_BADGE.ring}, 0 0 0 8px ${GIFT_BADGE.halo}, 0 0 18px 4px ${GIFT_BADGE.glow}`,
          // Up in the first quarter, down in the second, still after.
          transform: t
            ? [
                {
                  scale: t.interpolate({
                    inputRange: [0, 0.25, 0.5, 1],
                    outputRange: [1, scale, 1, 1],
                  }),
                },
              ]
            : undefined,
        }}
      >
        <T v="stamp" color={GIFT_BADGE.ink} strong>
          {tr.gifts.count(count)}
        </T>
      </Animated.View>
    </View>
  );
}

// The login progress (hediye.css `.prog`): three parts, 72 wide, 6 high.
export function LoginBar({
  logins,
  per,
  width = 72,
  on,
  off,
}: {
  logins: number;
  per: number;
  width?: number;
  on?: string;
  off?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: SPACING[1], width }}>
      {Array.from({ length: per }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: i < logins ? (on ?? colors.primary) : (off ?? colors.track),
          }}
        />
      ))}
    </View>
  );
}

// The gift screens' top bar (Paketler, Aksesuarlarım: `.topbar.between`, 56 high): back at the
// left, the title in the middle, as much room at the right.
export function GiftTopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View
      style={{
        height: TOP_BAR,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING[2],
      }}
    >
      <Round glassy icon="back" label={tr.common.back} onPress={onBack} />
      <View style={{ flex: 1 }}>
        <T v="title" center accessibilityRole="header">
          {title}
        </T>
      </View>
      <View style={{ width: KIT.size.round }} />
    </View>
  );
}
const TOP_BAR = 56;
