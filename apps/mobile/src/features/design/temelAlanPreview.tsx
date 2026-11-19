import { type ReactNode, useState } from 'react';
import { Text as RNText, View } from 'react-native';

import { GlassSearch } from '@/aura/GlassSearch';
import { useKit } from '@/aura/kit';
import { Input } from '@/components/Input';

// Temel (öneri, 19 Kasım) · the search field and every look of the text field as the app draws
// them today, one under another. Bileşen önizleme → Temel · alan
// (masa:///gorsel?durum=galeri/temelAlan).
const FACE = { 600: 'PlusJakartaSans_600SemiBold' } as const;

function Label({ children }: { children: ReactNode }) {
  const { c } = useKit();
  return (
    <RNText
      style={{ fontFamily: FACE[600], fontSize: 11, lineHeight: 14, color: c.muted, marginTop: 10 }}
    >
      {children}
    </RNText>
  );
}

export function TemelAlanSet() {
  const [q, setQ] = useState('');
  const [a, setA] = useState('Fırat');
  return (
    <View testID="preview-temel-alan" style={{ gap: 4 }}>
      <Label>Arama (cam kapsül: Mesajlar, Keşfet)</Label>
      <GlassSearch value={q} onChangeText={setQ} placeholder="Sohbet ara" />
      <Label>Arama (`Input search`)</Label>
      <Input search value={q} onChangeText={setQ} placeholder="Arkadaş ara" />
      <Label>Alan, sade</Label>
      <Input label="Görünen ad" hint="Masada bu adla görünürsün." value={a} onChangeText={setA} />
      <Label>Alan, hatalı</Label>
      <Input label="Görünen ad" error="Bu ad kullanılamaz." value="xx" onChangeText={setA} />
      <Label>Alan, kutu (`box`)</Label>
      <Input box value={a} onChangeText={setA} placeholder="Adın" />
      <Label>Alan, büyük (`large`)</Label>
      <Input large label="Biyografi" value={a} onChangeText={setA} />
      <Label>Alan, kartta (`boxed`)</Label>
      <Input boxed label="Görünen ad" counter="5/24" value={a} onChangeText={setA} />
      <Label>Alan, çok satır (`tall`)</Label>
      <Input tall multiline value="Kahve, kutu oyunu, uzun sohbet." onChangeText={setA} />
    </View>
  );
}
