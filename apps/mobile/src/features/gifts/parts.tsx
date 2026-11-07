import type { GiftTier } from '@shared/gifts.ts';
import { useEffect } from 'react';
import { View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { T, Tag, useKit } from '@/aura/kit';
import { CapIcon } from '@/aura/CapIcon';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { GIFT_BADGE, TIER_COLOR, TIER_TAG_ALPHA } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

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
  const reduce = useReduceMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.set(0);
    t.set(withRepeat(withTiming(1, { duration: GIFT_MOTION.badge.ms, easing: Easing.linear }), -1));
  }, [reduce, t]);
  const beat = useAnimatedStyle(() => {
    const p = t.value;
    // Up in the first quarter, down in the second, still after.
    const s = p < 0.25 ? p / 0.25 : p < 0.5 ? (0.5 - p) / 0.25 : 0;
    return { transform: [{ scale: 1 + (GIFT_MOTION.badge.scale - 1) * s }] };
  });
  const ring = useAnimatedStyle(() => ({
    opacity: GIFT_MOTION.badge.ringFrom * (1 - t.value),
    transform: [{ scale: 1 + (GIFT_MOTION.badge.ringTo - 1) * t.value }],
  }));
  return (
    <View
      accessible
      accessibilityLabel={tr.gifts.canOpen(count)}
      style={{ width: BADGE, height: BADGE }}
    >
      {reduce ? null : (
        <Reanimated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              inset: 0,
              borderRadius: BADGE / 2,
              borderWidth: 2,
              borderColor: GIFT_BADGE.fill,
            },
            ring,
          ]}
        />
      )}
      <Reanimated.View
        style={[
          {
            width: BADGE,
            height: BADGE,
            borderRadius: BADGE / 2,
            backgroundColor: GIFT_BADGE.fill,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 0 2.5px ${GIFT_BADGE.ring}, 0 0 0 8px ${GIFT_BADGE.halo}, 0 0 18px 4px ${GIFT_BADGE.glow}`,
          },
          beat,
        ]}
      >
        <T v="stamp" color={GIFT_BADGE.ink} strong>
          {tr.gifts.count(count)}
        </T>
      </Reanimated.View>
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
