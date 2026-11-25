import { router } from 'expo-router';

import { Btn } from '@/aura/kit';
import { Foot, HeroPage, RISO } from '@/features/district/parts';
import { tr } from '@/i18n/tr';

// SemtDisarida (yeni arayüz tuvali 101; docs/SPEC_V4.md §4.V): outside Beylikdüzü, Esenyurt and
// Avcılar.
export default function DistrictOutsideScreen() {
  const back = () => router.navigate('/explore');
  return (
    <HeroPage
      kind="short"
      source={RISO.heroOutside}
      label={tr.district.outside.sceneLabel}
      onClose={back}
      testID="district-outside"
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
