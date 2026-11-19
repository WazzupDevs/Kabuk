import { type ReactNode, useState } from 'react';
import { Text as RNText, View } from 'react-native';

import { Badge, Chip, Seg, Switch, Tag, useKit } from '@/aura/kit';
import { Segmented } from '@/components/Segmented';

// Temel (öneri, 19 Kasım) · the chip, the segmented control, the switch, the tag and the count
// badge as the kit draws them today, every size side by side. Bileşen önizleme → Temel · çip
// (masa:///gorsel?durum=galeri/temelCip).
const FACE = {
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
} as const;

function Label({ children }: { children: ReactNode }) {
  const { c } = useKit();
  return (
    <RNText style={{ fontFamily: FACE[600], fontSize: 11, lineHeight: 14, color: c.muted }}>
      {children}
    </RNText>
  );
}

function Head({ children }: { children: ReactNode }) {
  const { c } = useKit();
  return (
    <RNText
      style={{
        fontFamily: FACE[700],
        fontSize: 16,
        lineHeight: 22,
        color: c.ink,
        marginTop: 22,
        marginBottom: 10,
      }}
    >
      {children}
    </RNText>
  );
}

const row = { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 } as const;

export function TemelCipSet() {
  const [kind, setKind] = useState('all');
  const [tab, setTab] = useState<'a' | 'b'>('a');
  const [tema, setTema] = useState<'s' | 'a' | 'k'>('a');
  return (
    <View testID="preview-temel-cip" style={{ gap: 6 }}>
      <Head>Çip · 2 boy</Head>
      <Label>Çip · 32</Label>
      <View style={row}>
        <Chip label="Tümü" on={kind === 'all'} onPress={() => setKind('all')} />
        <Chip label="Kampüs" on={kind === 'c'} onPress={() => setKind('c')} />
        <Chip label="Kafe ve mekan" on={kind === 'k'} onPress={() => setKind('k')} />
      </View>
      <Label>Süzgeç çipi · 28</Label>
      <View style={row}>
        <Chip filter label="Hepsi" on />
        <Chip filter label="Şapka" />
        <Chip filter label="Gözlük" />
      </View>
      <Label>İkonlu</Label>
      <View style={row}>
        <Chip icon="close" label="Külah" on />
        <Chip icon="pin" label="Bahçe" />
      </View>

      <Head>Bölmeli seçici</Head>
      <Label>İki bölme, sayılı</Label>
      <Seg
        value={tab}
        onChange={setTab}
        options={[
          { value: 'a', label: 'Sohbetler' },
          { value: 'b', label: 'İstekler', badge: 2 },
        ]}
      />
      <Label>Üç bölme</Label>
      <Segmented
        fill
        accessibilityLabel="Görünüm"
        value={tema}
        onChange={setTema}
        options={[
          { value: 's', label: 'Sistem' },
          { value: 'a', label: 'Açık' },
          { value: 'k', label: 'Koyu' },
        ]}
      />

      <Head>Anahtar, etiket, sayı</Head>
      <View style={{ ...row, gap: 14 }}>
        <Switch on />
        <Switch on={false} />
        <Switch on disabled />
        <Tag label="Sessiz" />
        <Badge count={3} />
        <Badge count={120} large />
      </View>
    </View>
  );
}
