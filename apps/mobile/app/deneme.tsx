// TRIAL ONLY (claude/visual-trial, never merged): the RN 0.86 visual trial's screens, opened by
// deep link from scripts/trial/ (masa:///deneme?bolum=…). Outside the signed-in groups so the
// trial needs no account; test builds only.
//   bolum=kartlar           the three cards and the button (screenshots, 320 dp, font 1.3)
//   bolum=liste[&duz=1]     20 cards to scroll; duz=1 the same boxes without shadows/gradients
import { Redirect, useLocalSearchParams } from 'expo-router';
import { FlatList, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImpostorCard, MineCard, TabuCard, TrialRow } from '@/features/trial/V46Cards';
import { designPickerEnabled } from '@/theme/ThemeProvider';

const ROWS = Array.from({ length: 20 }, (_, i) => i);

export default function TrialScreen() {
  const p = useLocalSearchParams<{ bolum?: string; duz?: string }>();
  if (!designPickerEnabled) return <Redirect href="/" />;
  const flat = p.duz === '1';

  if (p.bolum === 'liste') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FC' }}>
        <FlatList
          testID={flat ? 'deneme-liste-duz' : 'deneme-liste'}
          data={ROWS}
          keyExtractor={(i) => String(i)}
          renderItem={({ item }) => <TrialRow index={item} flat={flat} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
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
