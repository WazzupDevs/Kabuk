import { router } from 'expo-router';

import { Btn } from '@/aura/kit';
import { Foot, RISO, ScenePage, StillScene } from '@/features/district/parts';
import { tr } from '@/i18n/tr';
import { SEMT } from '@/theme/semt';

// SemtDisari (docs/SPEC_V4.md §4.V): outside Beylikdüzü, Esenyurt and Avcılar.
export default function DistrictOutsideScreen() {
  const back = () => router.navigate('/explore');
  return (
    <ScenePage
      onClose={back}
      testID="district-outside"
      centered
      scene={
        <StillScene
          source={RISO.sign}
          height={SEMT.scene.tall}
          label={tr.district.outside.sceneLabel}
        />
      }
      title={tr.district.outside.title}
      body={tr.district.outside.body}
      footer={
        <Foot>
          <Btn
            block
            label={tr.district.backToExplore}
            testID="district-back-explore"
            onPress={back}
          />
        </Foot>
      }
    />
  );
}
