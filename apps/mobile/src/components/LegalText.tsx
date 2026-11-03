import { router } from 'expo-router';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { RisoKanki } from '@/aura/RisoKanki';
import { tr } from '@/i18n/tr';
import { LEGAL_PEEK } from '@/theme/kankiMotion';

import { PageTop } from './PageTop';
import { Screen } from './Screen';

// YasalMetin (Aura v71): the round back, the title with the draft notice under it, the text, and
// "Devam" fixed at the foot with a riso buddy looking over it.
export function LegalText({ title, body }: { title: string; body: string }) {
  return (
    <Screen
      top={<PageTop title={title} sub={tr.legal.draftNotice} />}
      footer={
        <View>
          <RisoKanki place={LEGAL_PEEK} scale={1} shadow={false} />
          <Btn block variant="glassy" label={tr.common.continue} onPress={() => router.back()} />
        </View>
      }
    >
      <T v="legal" ink>
        {body}
      </T>
    </Screen>
  );
}
