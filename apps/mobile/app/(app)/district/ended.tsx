import { router } from 'expo-router';

import { Btn } from '@/aura/kit';
import { useEnterDistrict } from '@/features/district/flow';
import { Foot, RISO, ScenePage, StillScene, WarnRow } from '@/features/district/parts';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { SEMT } from '@/theme/semt';

// SemtBitti (docs/SPEC_V4.md §4.V; the owner's call, 8 Kasım, §8.4): [Yeniden gir] goes in without
// the question and starts a new 2 hours; [Keşfet'e dön] under it.
export default function DistrictEndedScreen() {
  const enter = useEnterDistrict();
  const back = () => router.navigate('/explore');
  return (
    <ScenePage
      close
      onClose={back}
      testID="district-ended"
      centered
      scene={
        <StillScene
          source={RISO.closed}
          height={SEMT.scene.gecit}
          label={tr.district.ended.sceneLabel}
        />
      }
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
            onPress={() => enter.mutate()}
          />
          <Btn block variant="glassy" label={tr.district.backToExplore} onPress={back} />
        </Foot>
      }
    />
  );
}
