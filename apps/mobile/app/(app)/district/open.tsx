import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { useEnterDistrict } from '@/features/district/flow';
import { Foot, HeroPage, RISO, TicketShell, WarnRow } from '@/features/district/parts';
import { useDistrictState } from '@/features/district/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { SEMT } from '@/theme/semt';

// GecitAcik (yeni arayüz tuvali 13; docs/SPEC_V4.md §4.V): the open door over the top, the words and
// the ticket under them; [İçeri gir] starts the 2 hours.
export default function DistrictOpenScreen() {
  const { scheme } = useKit();
  const state = useDistrictState();
  const enter = useEnterDistrict();
  const name = state.data?.district?.name ?? '';
  const t = SEMT.entryTicket;
  const k = t[scheme];
  return (
    <HeroPage
      source={RISO.heroOpen}
      label={tr.district.open.sceneLabel}
      onClose={() => router.navigate('/explore')}
      testID="district-open"
      title={tr.district.open.title}
      body={tr.district.open.body(name)}
      footer={
        <Foot>
          {enter.isError ? <WarnRow tone="danger" text={errorMessage(enter.error)} /> : null}
          <Btn
            block
            label={tr.district.open.enter}
            testID="district-enter"
            loading={enter.isPending}
            onPress={() => enter.mutate()}
          />
        </Foot>
      }
    >
      <View accessible style={{ marginTop: t.top }}>
        <TicketShell
          stubWidth={t.stub}
          stubGround={k.stub}
          ground={k.ground}
          radius={t.radius}
          notch={t.notch}
          minHeight={t.minHeight}
          dash={t.dash}
          dashInset={t.dashInset}
          stub={
            <View style={{ alignItems: 'center', gap: t.stubGap }}>
              <CapIcon name="clock" color={k.ink} size={t.icon} />
              <T v="h3" color={k.ink}>
                {tr.district.open.ticket.hours}
              </T>
            </View>
          }
        >
          <View
            style={{
              paddingTop: t.padTop,
              paddingRight: t.padRight,
              paddingBottom: t.padBottom,
              paddingLeft: t.padLeft,
              gap: t.gap,
            }}
          >
            <T v="eyebrow" color={SEMT.eyebrow[scheme]}>
              {upperTr(tr.district.open.ticket.eyebrow)}
            </T>
            <T v="h3">{tr.district.open.ticket.title(name)}</T>
            <T v="fine">{tr.district.open.ticket.note}</T>
          </View>
        </TicketShell>
      </View>
    </HeroPage>
  );
}
