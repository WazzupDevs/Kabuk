// perf/trace branch only (not merged): a screen like Mekan's for the perf lab
// (scripts/e2e/perf-lab.sh): masa:///perf?kapali=golge,cam,zemin,gradyan turns parts off.
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useId } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { AuraTabBar } from '@/aura/AuraTabBar';
import { Av, Btn, Glass, GlassList, Li, Round, T } from '@/aura/kit';
import { Crew, SceneGround } from '@/aura/Scene';
import { PERF_OFF } from '@/lib/perfLab';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { designPickerEnabled, useTheme } from '@/theme/ThemeProvider';
import { GlassTarget } from '@/ui/LiquidGlass';

const ITEMS = [
  { key: 'explore', label: 'Keşfet' },
  { key: 'activities', label: 'Aktiviteler' },
  { key: 'venue', label: 'Mekan' },
  { key: 'messages', label: 'Mesajlar' },
  { key: 'profile', label: 'Profil' },
] as const;

export default function PerfScreen() {
  const p = useLocalSearchParams<{ kapali?: string; n?: string }>();
  PERF_OFF.clear();
  for (const k of (p.kapali ?? '').split(',').filter(Boolean)) PERF_OFF.add(k);
  if (!designPickerEnabled) return <Redirect href="/" />;
  return <Lab key={`${p.kapali ?? ''}-${p.n ?? ''}`} />;
}

function Lab() {
  const id = useId();
  const { scheme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <GlassTarget targetId={id} style={{ flex: 1 }}>
        <AuraBackground />
        <SafeAreaView edges={['top']} style={{ flex: 1, paddingHorizontal: KIT.size.side, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T v="display">Mekan</T>
            <Round icon="settings" label="Ayarlar" onPress={() => undefined} />
          </View>
          <Glass style={{ height: AURA.heroHeight, overflow: 'hidden', padding: 16, gap: 8 }}>
            <SceneGround />
            <Crew height={AURA.heroHeight} />
            <T v="title">Henüz masan yok</T>
            <T v="fine">Masa kur, arkadaşlarını çağır.</T>
            <Btn sm label="Masa kur" onPress={() => undefined} />
          </Glass>
          <GlassList>
            {['Ada', 'Bora', 'Cem', 'Deniz'].map((n) => (
              <Li key={n} onPress={() => undefined}>
                <Av size="sm" name={n} />
                <View style={{ flex: 1 }}>
                  <T v="h3">{n}</T>
                  <T v="fine">Son mesaj burada duruyor</T>
                </View>
              </Li>
            ))}
          </GlassList>
          <Glass pad="pad">
            <T v="body">Açık masalar burada görünür; şimdilik yok.</T>
          </Glass>
        </SafeAreaView>
      </GlassTarget>
      <View style={{ position: 'absolute', left: 18, bottom: 24 }}>
        <AuraTabBar items={ITEMS} selected="venue" onPress={() => undefined} glassTarget={id} />
      </View>
    </View>
  );
}
