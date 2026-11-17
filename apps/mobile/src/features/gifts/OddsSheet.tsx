import type { GiftState } from '@shared/api/gifts.ts';
import { GIFT_TIERS, ODDS_TOTAL } from '@shared/gifts.ts';
import { Fragment } from 'react';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { Sheet } from '@/components/Sheet';
import { tr } from '@/i18n/tr';
import { TIER_COLOR } from '@/theme/gifts';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import type { ShownPack } from './art';
import { packName, packView, tierName } from './model';
import { Marks } from './parts';

// Oranlar (yeni tuval HediyeOranlar; Aura v134 PaketOranlar; GaleriHediye's loading and error): the pack's tier odds as the
// server answers them for this person now (the app computes nothing), one accessory a pack, and
// that an owned accessory never comes again.
// A row 56 high: the diamonds 52 wide, the bar 96 × 6, the share 44 wide (HediyeOranlar `.rr`).
const ROW_H = 56;
const MARKS_W = 52;
const BAR_W = 96;
const BAR_H = 6;
const PERCENT_W = 44;
const ROW_PAD_Y = 12;
const SKELETON = { name: 90, value: 40, h: 20 };

export function OddsSheet({
  pack,
  visible,
  onClose,
  state,
  loading,
  onRetry,
  retrying,
}: {
  pack: ShownPack;
  visible: boolean;
  onClose: () => void;
  state: GiftState | undefined;
  loading: boolean;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { colors, scheme } = useTheme();
  const { c } = useKit();
  const view = state ? packView(state, pack) : null;
  const name = packName(pack);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ gap: SPACING[2] }}>
        <View style={{ gap: SPACING[1] }}>
          <T v="title" accessibilityRole="header">
            {tr.gifts.oddsTitle(name)}
          </T>
          <T v="fine">{tr.gifts.oddsLead}</T>
        </View>
        {view ? (
          <View>
            {GIFT_TIERS.map((tier, i) => (
              <Fragment key={tier}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: c.hair }} /> : null}
                <View
                  accessible
                  accessibilityLabel={`${tierName(tier)}, ${tr.gifts.percent(view.odds[tier], ODDS_TOTAL)}`}
                  style={{
                    height: ROW_H,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING[3],
                  }}
                >
                  <View style={{ width: MARKS_W }}>
                    <Marks tier={tier} color={TIER_COLOR[scheme][tier]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="h3">{tierName(tier)}</T>
                  </View>
                  <View
                    style={{
                      width: BAR_W,
                      height: BAR_H,
                      borderRadius: BAR_H / 2,
                      backgroundColor: c.emptyMark,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${(view.odds[tier] / ODDS_TOTAL) * 100}%`,
                        height: BAR_H,
                        borderRadius: BAR_H / 2,
                        backgroundColor: TIER_COLOR[scheme][tier],
                      }}
                    />
                  </View>
                  <View style={{ width: PERCENT_W, alignItems: 'flex-end' }}>
                    <T v="h3">{tr.gifts.percent(view.odds[tier], ODDS_TOTAL)}</T>
                  </View>
                </View>
              </Fragment>
            ))}
          </View>
        ) : loading ? (
          <View>
            <View accessibilityState={{ busy: true }}>
              {GIFT_TIERS.map((tier) => (
                <View
                  key={tier}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: ROW_PAD_Y,
                    paddingHorizontal: SPACING[4],
                  }}
                >
                  <View
                    style={{
                      width: SKELETON.name,
                      height: SKELETON.h,
                      borderRadius: SKELETON.h / 2,
                      backgroundColor: colors.track,
                    }}
                  />
                  <View
                    style={{
                      width: SKELETON.value,
                      height: SKELETON.h,
                      borderRadius: SKELETON.h / 2,
                      backgroundColor: colors.track,
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: SPACING[3], paddingVertical: SPACING[3] }}>
            <CapIcon name="warn" color={colors.danger} size={ICON.lg} />
            <T v="h3" center>
              {tr.gifts.oddsError}
            </T>
            <Btn
              variant="glassy"
              sm
              icon="refresh"
              label={tr.common.retry}
              onPress={onRetry}
              loading={retrying}
            />
          </View>
        )}
        <T v="fine">{tr.gifts.oddsMarks}</T>
        <T v="fine">{tr.gifts.oddsNoRepeat}</T>
      </View>
    </Sheet>
  );
}
