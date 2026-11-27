import { router } from 'expo-router';

import { Btn } from '@/aura/kit';
import { useEnterDistrict } from '@/features/district/flow';
import { Foot, HeroPage, RISO, WarnRow } from '@/features/district/parts';
import { lastSessionOpenRef } from '@/features/district/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { SEMT } from '@/theme/semt';

// SemtKapandi (yeni arayüz tuvali 100; docs/SPEC_V4.md §4.V; the owner's call, 8 Kasım, §8.4):
// [Yeniden gir] goes in without the question and starts a new 2 hours; [Keşfet'e dön] under it.
export default function DistrictEndedScreen() {
  const enter = useEnterDistrict();
  const back = () => router.navigate('/explore');
  return (
    <HeroPage
      source={RISO.heroEnded}
      focus={SEMT.hero.focusClosed}
      label={tr.district.ended.sceneLabel}
      onClose={back}
      testID="district-ended"
      title={tr.district.ended.title}
      body={tr.district.ended.body}
      footer={
        <Foot>
          {enter.isError ? <WarnRow tone="danger" text={errorMessage(enter.error)} /> : null}
          <Btn
            block
            label={tr.district.ended.again}
            testID="district-again"
            loading={enter.isPending}
            onPress={() => enter.mutate(lastSessionOpenRef())}
          />
          <Btn block variant="ghost" label={tr.district.backToExplore} onPress={back} />
        </Foot>
      }
    />
  );
}
