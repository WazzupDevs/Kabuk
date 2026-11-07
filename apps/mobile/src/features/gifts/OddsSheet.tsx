import type { GiftState } from '@shared/api/gifts.ts';
import { GIFT_TIERS, ODDS_TOTAL } from '@shared/gifts.ts';
import { Fragment } from 'react';
import { Image, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, T, useKit } from '@/aura/kit';
import { Sheet } from '@/components/Sheet';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { PACK_ART, PACK_RATIO, type ShownPack } from './art';
import { packName, packView } from './model';
import { TierTag } from './parts';

// Oranlar (Aura v134 PaketOranlar; GaleriHediye's loading and error): the pack's tier odds as the
// server answers them for this person now (the app computes nothing), one accessory a pack, and
// that an owned accessory never comes again.
const THUMB = 48;
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
  const { colors } = useTheme();
  const { c } = useKit();
  const view = state ? packView(state, pack) : null;
  const name = packName(pack);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ gap: SPACING[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[3] }}>
          <Image
            source={PACK_ART[pack]}
            accessibilityIgnoresInvertColors
            style={{ width: THUMB, height: THUMB / PACK_RATIO }}
            resizeMode="contain"
          />
          <View style={{ flex: 1, gap: SPACING[1] }}>
            <T v="title" accessibilityRole="header">
              {tr.gifts.oddsTitle(name)}
            </T>
            <T v="fine">{tr.gifts.oddsLead}</T>
          </View>
        </View>
        {view ? (
          <Glass sm>
            {GIFT_TIERS.map((tier, i) => (
              <Fragment key={tier}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: c.hair }} /> : null}
                <View
                  accessible
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: SPACING[3],
                    paddingVertical: ROW_PAD_Y,
                    paddingHorizontal: SPACING[4],
                  }}
                >
                  <TierTag tier={tier} />
                  <T v="h3">{tr.gifts.percent(view.odds[tier], ODDS_TOTAL)}</T>
                </View>
              </Fragment>
            ))}
          </Glass>
        ) : loading ? (
          <Glass sm>
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
          </Glass>
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
        <T v="fine">{tr.gifts.oddsNoRepeat}</T>
        <Btn variant="glassy" block label={tr.gifts.ok} onPress={onClose} />
      </View>
    </Sheet>
  );
}
