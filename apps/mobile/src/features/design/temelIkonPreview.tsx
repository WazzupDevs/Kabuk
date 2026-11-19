import type { ReactNode } from 'react';
import { Text as RNText, View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Round, useKit } from '@/aura/kit';
import { CAP_ICONS } from '@/theme/capIcons.generated';

// Temel (öneri, 19 Kasım) · the round icon button and the icon family, as the kit draws them today:
// every look and state side by side, then every icon at one size. Bileşen önizleme → Temel · ikon
// (masa:///gorsel?durum=galeri/temelIkon).
const FACE = {
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
} as const;

const nothing = () => undefined;
const NAMES = Object.keys(CAP_ICONS) as CapIconName[];

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
        marginTop: 24,
        marginBottom: 12,
      }}
    >
      {children}
    </RNText>
  );
}

function Cell({ ad, children }: { ad: string; children: ReactNode }) {
  return (
    <View style={{ width: 76, alignItems: 'center', gap: 6 }}>
      {children}
      <Label>{ad}</Label>
    </View>
  );
}

export function TemelIkonSet() {
  const { c } = useKit();
  return (
    <View testID="preview-temel-ikon">
      <Head>Yuvarlak düğme · görünüşler</Head>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
        <Cell ad="Kalkık">
          <Round icon="bell" label="Kalkık" onPress={nothing} />
        </Cell>
        <Cell ad="Ana">
          <Round primary icon="check" label="Ana" onPress={nothing} />
        </Cell>
        <Cell ad="Halkasız">
          <Round glassy={false} icon="moreV" label="Halkasız" onPress={nothing} />
        </Cell>
      </View>

      <Head>Oklar · tek aile</Head>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
        <Cell ad="Geri">
          <Round icon="back" label="Geri" onPress={nothing} />
        </Cell>
        <Cell ad="İleri">
          <Round icon="forward" label="İleri" onPress={nothing} />
        </Cell>
        <Cell ad="Aşağı">
          <Round icon="down" label="Aşağı" onPress={nothing} />
        </Cell>
        <Cell ad="Kapat">
          <Round icon="close" label="Kapat" onPress={nothing} />
        </Cell>
        <Cell ad="Düzenle">
          <Round icon="edit" label="Düzenle" onPress={nothing} />
        </Cell>
      </View>

      <Head>Yuvarlak düğme · hâller</Head>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
        <Cell ad="Sayılı">
          <Round icon="bell" badge={3} label="Sayılı" onPress={nothing} />
        </Cell>
        <Cell ad="Noktalı">
          <Round icon="bell" dot label="Noktalı" onPress={nothing} />
        </Cell>
        <Cell ad="Kapalı">
          <Round icon="send" disabled label="Kapalı" onPress={nothing} />
        </Cell>
        <Cell ad="Bekliyor">
          <Round icon="send" loading label="Bekliyor" onPress={nothing} />
        </Cell>
        <Cell ad="Bekliyor, ana">
          <Round primary icon="check" loading label="Bekliyor ana" onPress={nothing} />
        </Cell>
      </View>

      <Head>{`İkon ailesi · ${NAMES.length} ikon, 24`}</Head>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
        {NAMES.map((n) => (
          <View key={n} style={{ width: 58, alignItems: 'center', gap: 3 }}>
            <CapIcon name={n} color={c.ink} size={24} />
            <RNText
              numberOfLines={1}
              style={{ fontFamily: FACE[600], fontSize: 8, lineHeight: 11, color: c.muted }}
            >
              {n}
            </RNText>
          </View>
        ))}
      </View>
    </View>
  );
}
