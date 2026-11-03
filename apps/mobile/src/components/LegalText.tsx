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
          {/* Cut at the button's foot: only the part over it and behind it shows (ui 6.1). */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: LEGAL_PEEK.top,
              bottom: 0,
              overflow: 'hidden',
            }}
          >
            <RisoKanki place={{ ...LEGAL_PEEK, top: 0 }} scale={1} shadow={false} />
          </View>
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
