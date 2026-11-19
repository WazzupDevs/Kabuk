import type { ReactNode } from 'react';
import { Text as RNText, View } from 'react-native';

import { Btn, useKit } from '@/aura/kit';

// Temel (öneri, 19 Kasım): the one page of values every screen is to be built from, drawn for the
// owner to approve on the emulator before anything is moved to it. Nothing reads these yet; once
// approved they replace the per-screen values in theme/. Bileşen önizleme → Temel
// (masa:///gorsel?durum=galeri/temel).
const FACE = {
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
} as const;

type Step = { ad: string; w: keyof typeof FACE; size: number; line: number; ornek: string };

// The proposed type scale: the canvas's most used styles, its near-twins folded into them.
export const TEMEL_YAZI: readonly Step[] = [
  { ad: 'Ekran başlığı', w: 700, size: 32, line: 41, ornek: 'Bu akşam nerede' },
  { ad: 'Başlık', w: 700, size: 24, line: 30, ornek: 'Masa bitti' },
  { ad: 'Sayfa başlığı', w: 700, size: 21, line: 26, ornek: 'Ayarlar' },
  { ad: 'Bölüm', w: 700, size: 16, line: 22, ornek: 'Bu hafta' },
  { ad: 'Satır adı', w: 600, size: 16, line: 22, ornek: 'Sakarya Üniversitesi' },
  { ad: 'Düğme', w: 600, size: 16, line: 20, ornek: 'Masaya katıl' },
  { ad: 'Gövde', w: 500, size: 15, line: 22, ornek: 'Masa kurduk, gelir misiniz?' },
  { ad: 'Gövde, vurgulu', w: 600, size: 15, line: 22, ornek: 'Engeli kaldır' },
  { ad: 'Küçük düğme, çip', w: 600, size: 14, line: 18, ornek: 'Kafe ve mekan' },
  { ad: 'İkincil', w: 500, size: 13, line: 18, ornek: 'Kampüs · Serdivan' },
  { ad: 'İkincil, vurgulu', w: 600, size: 13, line: 18, ornek: 'Ada göre' },
  { ad: 'Etiket', w: 600, size: 12, line: 16, ornek: 'CUMARTESİ AKŞAMI' },
  { ad: 'Küçük', w: 600, size: 11, line: 14, ornek: '14:32 · düzenlendi' },
  { ad: 'Sekme', w: 600, size: 10, line: 13, ornek: 'Keşfet' },
];

export const TEMEL_KOSE = [
  { ad: 'Küçük', r: 12 },
  { ad: 'Alan, resim', r: 16 },
  { ad: 'Balon, küçük kart', r: 20 },
  { ad: 'Kart', r: 24 },
  { ad: 'Pencere, sayfa, menü', r: 28 },
] as const;

export const TEMEL_BOY = [
  { ad: 'Büyük düğme', h: 56 },
  { ad: 'Yazma alanı', h: 52 },
  { ad: 'Düğme, form alanı', h: 48 },
  { ad: 'Yuvarlak ikon düğmesi', h: 44 },
  { ad: 'Üst satır düğmesi', h: 40 },
  { ad: 'Küçük düğme, çip', h: 36 },
  { ad: 'Süzgeç çipi', h: 28 },
] as const;

export const TEMEL_BOSLUK = [4, 8, 12, 16, 20, 24, 32] as const;
export const TEMEL_YAN = 20;

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
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      {children}
    </RNText>
  );
}

const nothing = () => undefined;

// Düğme: four kinds, three sizes, and the two states every kind has.
function DugmeBlock() {
  return (
    <View>
      <Head>Düğme · 4 tür</Head>
      <View style={{ gap: 10 }}>
        <Label>Ana · ekranın tek ana eylemi</Label>
        <Btn block label="Masaya katıl" onPress={nothing} />
        <Label>Yumuşak · ikincil eylem</Label>
        <Btn block variant="glassy" label="Profili düzenle" onPress={nothing} />
        <Label>Tehlikeli · silme, çıkma, engelleme</Label>
        <Btn block variant="danger" label="Hesabımı sil" onPress={nothing} />
        <Label>Dolgusuz · vazgeçme</Label>
        <Btn block variant="ghost" label="Vazgeç" onPress={nothing} />
      </View>

      <Head>Düğme · 2 boy</Head>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Btn label="Ana · 44" onPress={nothing} />
        <Btn sm label="Küçük · 32" onPress={nothing} />
        <Btn variant="glassy" label="Ana" onPress={nothing} />
        <Btn sm variant="glassy" label="Küçük" onPress={nothing} />
      </View>

      <Head>Düğme · hâller</Head>
      <View style={{ gap: 10 }}>
        <Label>Bekliyor · ikinci basış yok sayılır</Label>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Btn loading label="Devam et" onPress={nothing} />
          <Btn loading variant="glassy" label="Kaydet" onPress={nothing} />
          <Btn loading variant="danger" label="Sil" onPress={nothing} />
        </View>
        <Label>Kapalı · basılamaz</Label>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn disabled label="Devam et" onPress={nothing} />
          <Btn disabled variant="glassy" label="Kaydet" onPress={nothing} />
          <Btn disabled variant="danger" label="Sil" onPress={nothing} />
        </View>
        <Label>İkonlu</Label>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn icon="bell" label="Bildirimleri aç" onPress={nothing} />
          <Btn variant="glassy" icon="bell" label="Sessize al" onPress={nothing} />
        </View>
        <Label>Bekliyor · ikinci basış yok sayılır</Label>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn loading label="Devam et" onPress={nothing} />
          <Btn loading variant="glassy" label="Kaydet" onPress={nothing} />
        </View>
      </View>
    </View>
  );
}

export function TemelSet() {
  const { c } = useKit();
  return (
    <View testID="preview-temel">
      <DugmeBlock />
      <Head>Yazı · 14 stil</Head>
      <View style={{ gap: 14 }}>
        {TEMEL_YAZI.map((s) => (
          <View key={s.ad}>
            <Label>{`${s.ad} · ${s.w} ${s.size}/${s.line}`}</Label>
            <RNText
              style={{ fontFamily: FACE[s.w], fontSize: s.size, lineHeight: s.line, color: c.ink }}
            >
              {s.ornek}
            </RNText>
          </View>
        ))}
      </View>

      <Head>Köşe · 5 değer ve tam yuvarlak</Head>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {TEMEL_KOSE.map((k) => (
          <View key={k.r} style={{ width: 100, gap: 4 }}>
            <View style={{ height: 64, borderRadius: k.r, backgroundColor: c.ink }} />
            <Label>{`${k.r} · ${k.ad}`}</Label>
          </View>
        ))}
        <View style={{ width: 100, gap: 4 }}>
          <View style={{ height: 64, borderRadius: 32, backgroundColor: c.ink }} />
          <Label>Tam yuvarlak · düğme, çip</Label>
        </View>
      </View>

      <Head>Boy · 7 değer</Head>
      <View style={{ gap: 10 }}>
        {TEMEL_BOY.map((b) => (
          <View key={b.h} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: b.h === 44 ? 44 : 150,
                height: b.h,
                borderRadius: b.h / 2,
                backgroundColor: c.ink,
              }}
            />
            <Label>{`${b.h} · ${b.ad}`}</Label>
          </View>
        ))}
      </View>

      <Head>Boşluk · 4’ün katları, yan boşluk 20</Head>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        {TEMEL_BOSLUK.map((n) => (
          <View key={n} style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: n, height: n, backgroundColor: c.ink }} />
            <Label>{n}</Label>
          </View>
        ))}
      </View>
    </View>
  );
}
