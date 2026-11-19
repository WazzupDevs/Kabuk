import { Linking, View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { RisoPicture } from '@/aura/RisoPicture';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { tr } from '@/i18n/tr';
import { appBuild, updateUrl } from '@/lib/appBuild';
import { KIT } from '@/theme/auraKit';

// Full screen, in place of everything else, once the server refuses this build. Yeni arayüz tuvali
// GuncellemeGerekli `.up`: the wordmark on top, the 260 × 212 riso picture, the title and the
// sentence, centred; "Güncelle" (56) at the bottom with the installed version under it.
export function UpdateRequired() {
  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ marginBottom: KIT.size.updateWordmarkGap }}>
            <Wordmark height={KIT.size.updateWordmark} />
          </View>
          <RisoPicture
            source={require('../../../assets/riso/update-required.webp')}
            width={KIT.size.updateRisoW}
            height={KIT.size.updateRisoH}
            radius={0}
            shadow="none"
          />
          <T
            v="updateTitle"
            ink
            center
            accessibilityRole="header"
            style={{ marginTop: KIT.size.updateTitleTop }}
          >
            {tr.update.title}
          </T>
          <T center style={{ marginTop: KIT.size.updateNoteTop, maxWidth: KIT.size.updateNoteMax }}>
            {tr.update.body}
          </T>
        </View>
        <View style={{ alignItems: 'center', gap: KIT.size.updateFootGap }}>
          <Btn
            block

            label={tr.update.action}
            onPress={() => void Linking.openURL(updateUrl())}
          />
          {appBuild ? (
            <T v="updateBuild" center>
              {tr.update.build(appBuild)}
            </T>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
