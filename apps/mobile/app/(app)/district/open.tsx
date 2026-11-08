import { router } from 'expo-router';

import { Btn } from '@/aura/kit';
import { useEnterDistrict } from '@/features/district/flow';
import { Foot, GecitOpenScene, ScenePage, WarnRow } from '@/features/district/parts';
import { useDistrictState } from '@/features/district/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

// GecitAcik (docs/SPEC_V4.md §4.V): the door opens (hareket.json → semteGit.gecitOpen; still with
// reduce motion); [İçeri gir] starts the 2 hours.
export default function DistrictOpenScreen() {
  const state = useDistrictState();
  const enter = useEnterDistrict();
  const name = state.data?.district?.name ?? '';
  return (
    <ScenePage
      close
      onClose={() => router.navigate('/explore')}
      testID="district-open"
      centered
      scene={<GecitOpenScene label={tr.district.open.sceneLabel} />}
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
    />
  );
}
