# Arayüz hataları — 2 Kasım 2026

Proje sahibinin telefondan attığı ekran görüntülerinden toplanan arayüz hataları. Yalnızca not; kod değişikliği yok.

Sınıflar: yerleşim/taşma, kesilen metin, renk/tema, ölçü/boşluk, ikon, hareket, davranış.
Önem: yüksek (kullanılamıyor, çakışan/kesilen içerik), orta (göze batan), düşük (ince ayar).
**[P1]**: Aura v71 P1 ortak bileşen dosyalarına düşen hata (Checkbox, Choice, Banner, Input, Li/RowList/SettingsRow, Sheet, `auraKit.ts`); başka oturum üzerinde çalışıyor.

## Görüntüler

### 1. Keşfet (liste görünümü, check-in varken)

Kod: `apps/mobile/app/(app)/(tabs)/explore/index.tsx`. Pano: `Kesfet.dc.html` ("Şu an buradasın" kartı için: pano yok).

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 1.1 | "Şu an buradasın" kartında mekan adı sol yarıya sıkışıp dört satıra bölünüyor, "Mekana dön" düğmesi kartın yarısını kaplıyor. Ad tam genişlikte en çok iki satır olmalı, düğme altta durmalı (ya da yalnızca ok ikonu kalmalı). | yerleşim/taşma | `index.tsx:280-303` `HereNow`: yan yana ya da alt alta kararı yalnızca ekran genişliğine ve yazı boyutuna bakıyor (`useNarrow`, `:266`), adın uzunluğuna bakmıyor. | orta |
| 1.2 | Aynı kartta düğme kartın üst kenarına yapışık, metin bloğuna göre dikeyde ortalanmamış. Düğmenin altında boş bir alan kalıyor. | ölçü/boşluk | `index.tsx:287` `alignItems: 'center'` verilmiş ama görüntüde uygulanmıyor. Sebep: ?. `Glass`'ın ilk çocuğu `shadow.node` (`src/aura/kit.tsx:184`) satır düzenine giriyor olabilir. | orta |
| 1.3 | Nokta seçilmemişse alt satır yalnızca "Giriş yaptın" diyor; giriş (oturum açma) gibi okunuyor. "Check-in yaptın" ya da nokta yoksa satırın hiç olmaması daha doğru. | metin | `src/i18n/tr.ts:450` `hereAt(null)`. | düşük |
| 1.4 | Mekan satırında "Sessiz" etiketi başlığın yanında yer kaplıyor, mekan adı gereksiz yere iki satıra bölünüyor. Etiket alt satıra, "Kampüs · Serdivan"ın yanına inmeli. | yerleşim/taşma | `index.tsx:431-436`: `Bucket` yalnızca dar ekranda alta iniyor. | düşük |
| 1.5 | Sayım satırındaki "1 mekan · ada göre" eksik bir cümle gibi okunuyor. "ada göre sıralı" olmalı. Tuval de aynı metni kullanıyor. | metin | `src/i18n/tr.ts:475` `countLine`. | düşük |
| 1.6 | Liste görünümünde harita yokken "© OpenStreetMap katkıda bulunanlar" satırı listenin altında duruyor. Bu atıf haritanın üstünde olmalı, listede gerek yok. Tuvalde listede var. | davranış | `index.tsx:444-446` | düşük |

### 2. Keşfet (koyu tema)

Kod: aynı ekran; düğme `apps/mobile/src/aura/kit.tsx` → `Btn`. Pano: `skall.css` koyu tema (`--primary-glow: 0 12px 26px rgba(0,0,0,.35)`).

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 2.1 | Koyu temada "Mekana dön" (ve her `primary` düğme, yuvarlak `primary` dahil) altına yeşil, parlayan bir hale düşürüyor; siyah zeminde neon gibi duruyor. Koyu temada gölge siyah ve yumuşak olmalı (tuval `rgba(0,0,0,.35)`) ya da hiç olmamalı. | renk/tema | **[P1]** `apps/mobile/src/theme/auraKit.ts:130` `SHADOW.primary` yeşil ve temadan bağımsız; `:270` `KIT.primaryShadow` tek değer. `kit.tsx:291` ve `:440` bunu açık ve koyu temada aynı kullanıyor. Dosyanın yorumu (`:123` "The dark scheme draws none") kodla çelişiyor. | orta |
| 2.2 | "Şu an buradasın" yeşil noktasının çevresinde koyu zeminde gri bir disk görünüyor; halka kirli duruyor. Koyu temada halka ya hiç olmamalı ya da yeşilin saydamı olmalı. | renk/tema | `kit.tsx:715-820` `Live`: halka ve parıltı rengi koyu temaya uyarlanmıyor (?). | düşük |

### 3. Keşfet → "Şehir ve semt" alt sayfası (koyu ve açık tema)

Kod: `apps/mobile/app/(app)/(tabs)/explore/index.tsx:463-536` `PlaceSheet`; alt sayfa `src/components/Sheet.tsx`, `SheetScrim.tsx`, `SheetCard.tsx`. Pano: `SablonSheet.dc.html` (örtü zemin + 8 bulanıklık, kenarlardan 8, açıklama `muted`, ikinci düğme `btn soft`).

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 3.1 | İki temada da arkadaki ekran yalnızca kararıyor (açıkta renkleniyor), bulanıklaşmıyor ("Bu akşam…" ve kartlar keskin). Panoya göre örtünün altı 8 bulanıklıkla buzlanmalı. | renk/tema | **[P1]** `src/components/SheetScrim.tsx:26`: yerel bulanıklık (`Native`) bu cihazda yok ya da çizmiyor (?); yalnızca renk katmanı (`:27`) kalıyor. | orta |
| 3.2 | "Göster" düğmesinin altında yine yeşil parlayan hale var (2.1 ile aynı kök). | renk/tema | **[P1]** `src/theme/auraKit.ts:130`; bkz. 2.1 | orta |
| 3.3 | "Vazgeç" koyu temada içi boş, kalın çerçeveli bir hayalet düğme gibi duruyor ve "Göster" kadar ağır görünüyor. Panoda dolgulu, yumuşak ikincil düğme (`btn soft`) var. | renk/tema | `index.tsx:496` `variant="glassy"`: koyu temada camın dolgusu kartla aynı, yalnızca kenar çizgisi görünüyor. | düşük |
| 3.4 | İki temada da açıklama paragrafı başlıkla aynı parlaklıkta (ink). Panoda açıklama `muted`. | renk/tema | `src/aura/kit.tsx:51` `MUTED` listesinde `note` yok; `index.tsx:500` `T v="note"` ink çiziliyor. | düşük |
| 3.5 | Açıklama "Bugün etkinliği olanlar önce, sonra ada göre" diyor. Sayım satırıyla (1.5) aynı yarım ifade; seçim sayfasında sıralama bilgisi de gereksiz. | metin | `src/i18n/tr.ts:468` `placeNote` | düşük |
| 3.6 | Açık temada örtü düz `rgba(3,27,11,.20)` yerine yeşilden pembeye renkli bir katman gibi görünüyor; arka ekran soluk ve lekeli duruyor. Panoda zemin %20 ve 8 bulanıklık var. | renk/tema | **[P1]** `src/components/SheetScrim.tsx:26-27`: renk katmanı aura zemininin (`AuraBackground`) üstüne biniyor ya da yerel katman bulanıklık yerine yalnızca doygunluk çiziyor (?). | düşük |
