// TRIAL ONLY (claude/visual-trial, never merged): the RN 0.86 visual trial's screens, opened by
// deep link from scripts/trial/ (masa:///deneme?bolum=…). Outside the signed-in groups so the
// trial needs no account; test builds only.
//   bolum=kartlar             the three cards and the button (320 dp, font 1.3)
//   bolum=tek&kart=…[&duz=1]  one card (tabu, sahtekar, masa) for the drawing check; duz=1 the
//                             same boxes without shadows and gradients
// The 20-card scroll page is in the gallery (Bileşen önizleme → Kaydırma), checked on a phone.
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImpostorCard, MineCard, TabuCard } from '@/features/trial/V46Cards';
import { designPickerEnabled } from '@/theme/ThemeProvider';

const CARDS = { tabu: TabuCard, sahtekar: ImpostorCard, masa: MineCard };

export default function TrialScreen() {
  const p = useLocalSearchParams<{ bolum?: string; kart?: string; duz?: string }>();
  if (!designPickerEnabled) return <Redirect href="/" />;
  const flat = p.duz === '1';

  if (p.bolum === 'tek') {
    const kart = p.kart === 'sahtekar' || p.kart === 'masa' ? p.kart : 'tabu';
    const Card = CARDS[kart];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FC' }}>
        <View testID={`deneme-tek-${kart}${flat ? '-duz' : ''}`}>
          <Card flat={flat} />
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FC' }}>
      <ScrollView testID="deneme-kartlar" contentContainerStyle={{ gap: 12 }}>
        <TabuCard flat={flat} />
        <ImpostorCard flat={flat} />
        <MineCard flat={flat} />
      </ScrollView>
    </SafeAreaView>
  );
}
