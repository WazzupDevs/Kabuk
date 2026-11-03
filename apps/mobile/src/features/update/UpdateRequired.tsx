import { Linking, View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { RisoKanki } from '@/aura/RisoKanki';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { tr } from '@/i18n/tr';
import { appBuild, updateUrl } from '@/lib/appBuild';
import { UPDATE_KANKI } from '@/theme/kankiMotion';
import { SPACING } from '@/theme/tokens';

// Full screen, in place of everything else, once the server refuses this build. Aura v71
// GuncellemeGerekli: a riso buddy over the wordmark and the title, centred, then "Güncelle".
export function UpdateRequired() {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-3">
        <View className="items-center gap-3 py-8">
          <View style={{ width: UPDATE_KANKI.width, height: UPDATE_KANKI.height }}>
            <RisoKanki place={{ ...UPDATE_KANKI, left: 0, bottom: 0 }} scale={1} />
          </View>
          <View style={{ marginTop: SPACING[1], marginBottom: SPACING[3] }}>
            <Wordmark height={SPACING[8]} />
          </View>
          <T v="h3" ink center accessibilityRole="header">
            {tr.update.title}
          </T>
          <T center>{tr.update.body}</T>
        </View>
        <Btn block label={tr.update.action} onPress={() => void Linking.openURL(updateUrl())} />
        {appBuild ? (
          <T v="fine" center>
            {tr.update.build(appBuild)}
          </T>
        ) : null}
      </View>
    </Screen>
  );
}
