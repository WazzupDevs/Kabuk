import { View } from 'react-native';

import { T } from '@/aura/kit';
import { SettingsPage } from '@/features/settings/SettingsParts';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

// Sohbet kuralları (the semt and the venue chat's ⋮ menu, SemtSecenek, MekanSohbetSecenek): the
// settings' page with its round back and title, the rules numbered as a legal text's list.
export default function ChatRulesScreen() {
  return (
    <SettingsPage title={tr.chatRules.title}>
      <View style={{ gap: SPACING[3], marginTop: SPACING[3] }} testID="chat-rules">
        {tr.chatRules.rules.map((rule, i) => (
          <View key={i} className="flex-row" style={{ gap: SPACING[2] }}>
            <T v="legal" ink>
              {`${i + 1}.`}
            </T>
            <View className="flex-1">
              <T v="legal" ink>
                {rule}
              </T>
            </View>
          </View>
        ))}
      </View>
    </SettingsPage>
  );
}
