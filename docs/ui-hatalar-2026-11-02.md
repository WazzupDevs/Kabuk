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

### 4. Keşfet (harita görünümü, açık ve koyu)

Kod: `apps/mobile/src/features/explore/ExploreMap.tsx`, `mapStyle.ts`, `src/theme/mapStyle.ts` (`recolorStyle`). Pano: `KesfetHarita`, yerel kopyada yok (yalnızca `canvas.json`'da adı geçiyor), yani pano yok.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 4.1 | Açık: mekan etiketi "Sakarya Üniversitesi / Esentepe / Kampüsü Sessiz" diye üç satıra bölünüyor, "Sessiz" son satırın ucuna yapışıyor. Kodun niyeti tek satır (ad ve canlılık), olması gereken de bu. Olmuyorsa ad iki satır, durum altta ayrı satır olmalı. | kesilen metin / yerleşim | `ExploreMap.tsx:182-198`: `text-max-width` verilmemiş, MapLibre'nin 10 em varsayılanı adı kırıyor; durum `format` ile aynı satıra ekleniyor. | orta |
| 4.2 | Açık: haritanın kendi POI etiketleri ve ikonları ("Sakarya Üniversitesi", "…Kütüphanesi", "Konser Alanı", mavi P ve otobüs ikonları) mekan iğnesiyle ve etiketiyle çakışıyor; kütüphane yazısı iğnenin altında kalıyor. Bunlar gizlenmeli ya da iğnenin çevresinden çekilmeli. Mavi P ve otobüs ikonları da tema dışı. | yerleşim/taşma, renk | `src/theme/mapStyle.ts:121-131` `recolorStyle` POI katmanlarını yalnızca boyuyor, kaldırmıyor; mekan katmanı alttakilerle çarpışmayı denemiyor (`ExploreMap.tsx:410-427`). | orta |
| 4.3 | Açık: haritanın etiketleri arama alanı ile seçim çipleri arasından görünüyor ("Yemekhanesi", "…ya Kam…"); başlık bölgesinin altında harita kesik ve kirli duruyor. Başlık bölgesinin altında zemin rengine sönen bir geçiş olmalı (koyuda öyle görünüyor). | yerleşim/taşma | `ExploreMap.tsx` / `explore/index.tsx` başlık örtüsü açık temada saydam (?). | düşük |
| 4.4 | Koyu: harita hiç etiket göstermiyor (yol ve yer adı yok), açıkta çok fazla etiket var; iki tema tutarsız. | renk/tema | Koyu stil (`openfreemap/styles/dark`) ya da `recolorStyle` sonrası yazı tipleri yüklenmiyor (?), `src/theme/mapStyle.ts:129-131`. | düşük |

### 5. Aktiviteler → oyun geçmişi alt sayfası ("Sohbet", koyu)

Kod: `apps/mobile/app/(app)/(tabs)/activities.tsx:246-289` (sayfa), `src/features/friends/historyActions.tsx:149-246` (`HistoryActions`). Pano: `SablonSheet.dc.html` (düğmeler sabit, alttan güvenli alan; satırlar `glass sm` içinde `li`). Aktiviteler geçmiş detayı için pano yok.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 5.1 | Kişi çoğalınca sayfa ekranı dolduruyor, son kişinin açıklaması alt kenarda kesiliyor, "Kapat" düğmesi görünmüyor. Panoya göre düğmeler altta sabit durmalı, yalnızca kişi listesi kaymalı. | yerleşim/taşma, davranış | `activities.tsx:282-288`: "Kapat" `footer` yerine içeriğin içinde, listeyle birlikte kayıp gidiyor. | yüksek |
| 5.2 | "İkiniz de basarsanız arkadaş olursunuz. O basmazsa hiçbir şey olmaz." her kişinin altında aynen tekrarlanıyor (5 kez). Bu cümle bir kez, listenin üstünde ya da altında yazmalı. | yerleşim / metin | `historyActions.tsx:222-225`: ipucu `HistoryActions` içinde, kişi başına çiziliyor. | orta |
| 5.3 | Satırlar gruplanmıyor: bir kişinin düğmeleriyle sonraki kişinin adı arasındaki boşluk, ad ile kendi açıklaması arasındakinden küçük; "Diğer" bir sonraki kişiye aitmiş gibi duruyor. Her kişi panodaki gibi ayrı bir satır (`li`, ince çizgi ya da kart) olmalı; kapsül avatarı da yok. | ölçü/boşluk | `activities.tsx:253-261`: düz `View` içinde `gap: SPACING[3]` ve `SPACING[1]`; satır ya da ayırıcı yok. | orta |
| 5.4 | Sayfa eski tasarım bileşenleriyle çizilmiş (`Text`, `Button` neutral/ghost, yeşil "Diğer" bağlantısı). Aura kitinin `T`, `Btn`, `Li` bileşenleri kullanılmıyor; koyu temada "Arkadaş ekle" içi boş çerçeve, "Diğer" neon yeşil. | renk/tema | `historyActions.tsx:166-243`, `activities.tsx:255-288` `@/components` bileşenleri | orta |
| 5.5 | Tarih satırı yalnızca "23:00" diyor; hangi gün olduğu yazmıyor. "Dün 23:00" ya da "1 Kas 23:00" olmalı. | metin | `activities.tsx:255-258` `tr.activities.when(...)`: gün etiketi boş dönüyor (?). | düşük |

### 6. Mekan (masasız, lobi boş; açık ve koyu)

Kod: `apps/mobile/app/(app)/(tabs)/venue.tsx`, `src/features/venue/VenueHead.tsx`, `src/features/rooms/TableCard.tsx:328-378` (`NoTable`), `src/features/rooms/Lobby.tsx:176-190`. Pano: `Mekan.dc.html` (`.rscene`, "Açık masa yok").

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 6.1 | "Henüz masan yok" kartının resmi yanlış kırpılıyor: yalnızca resmin boş, dokulu sol üst köşesi görünüyor; sağ alttaki masa, sandalyeler, lamba ve iki kapsül (`assets/riso/venue-no-table.webp`) hiç görünmüyor. Kartın sağ yarısı ve alt üçte biri boş duruyor. Sahne panodaki gibi bütünüyle, figürler sağ altta görünmeli. | yerleşim / resim | `TableCard.tsx:343-349`: `Image` `resizeMode="cover"` + `absoluteFill`; resim kutudan çok büyük ölçekleniyor ya da sol üste hizalanıyor (?). Kart yüksekliği `KIT.size.hero` (`:339`). | yüksek |
| 6.2 | Koyu temada "Henüz masan yok" kartı açık bej bir blok olarak kalıyor, siyah ekranda parlıyor. Kod bunu bilerek iki temada aynı çiziyor (`:330` "in both schemes"); koyu temada resmin üstüne hafif bir karartma ya da koyu bir varyant daha iyi olur. | renk/tema | `TableCard.tsx:330-366` | düşük |
| 6.3 | "Açık masalar · 0 masa" ve hemen altındaki "Açık masa yok" aynı bilgiyi iki kez veriyor. Liste boşken sayı gizlenmeli. | metin | `Lobby.tsx:176` `count={read ? open.length : null}` | düşük |
| 6.4 | Boş lobi açıklaması ("Masa kurup lobiye açarsan…") ilk ekranda sekme çubuğunun altında yarım kalıyor; ilk bakışta kesik metin gibi görünüyor. Boş durum resmi küçültülürse ya da başlık kartı kısalırsa (6.1) metin sığar. | yerleşim/taşma | `Lobby.tsx:183-190` `EmptyState` ile resim yüksekliği; 6.1'deki boş kart yer kaplıyor. | düşük |
| 6.5 | "Masa kur" düğmesinin altında yine yeşil hale var; koyu temada belirgin (2.1). "Mekandasın" noktasının çevresinde gri halka var (2.2). | renk/tema | **[P1]** bkz. 2.1, 2.2 | — |
| 6.6 | Üstteki "skall" logosu sayfanın geri kalanına göre çok büyük (38 dp, ekranın en büyük öğesi) ve alttaki mekan adıyla bir blok oluşturmuyor; logo satırı ile mekan satırı arasında kopuk bir boşluk var. Logo küçülmeli (yaklaşık 26–28 dp, `WORDMARK_SMALL`) ve mekan adı ile "Mekandasın" logonun hemen altında tek bir başlık bloğu olarak durmalı. Proje sahibinin kararı: logonun yalnızca ölçeği değişir, çizimi ve renkleri değişmez. | ölçü/boşluk | `src/features/venue/VenueHead.tsx:133` `WORDMARK_HEIGHT = 38`; satırlar arası boşluk `VenueHead.tsx:48` civarındaki düzende. | orta |
| 6.8 | Sağ üstteki "…" (Diğer) yuvarlak düğmesinin altında, gölgenin içinden yatay ince bir çizgi geçiyor; gölge iki parçalı ve dikişli görünüyor. Gölge kesintisiz, yumuşak bir halka olmalı. | renk / gölge | `src/aura/kit.tsx:442` `Round` `glassy`: dış gölge `shadowParts` ile dokuz parçadan (`src/components/NativeShadow.tsx`, yerel `ShadowView`) çiziliyor; alt kenar parçası ile köşe parçaları arasında dikiş kalıyor (?). Aynı dikiş başka `Round big glassy` ve gölgeli yuvarlaklarda da olabilir. | orta |

### 7. Mekan (masa var: 12 kişi ve 1 kişi, açık)

Kod: `apps/mobile/src/features/rooms/TableCard.tsx:62-200` (kart), `:200-262` (`NameGlass`), `:266-320` (`PeopleFaces`); resimler `src/features/rooms/tableIconImages.ts` → `TABLE_CARD_WIDE`; `Lobby.tsx` (`bringsTable`). Pano: `Mekan.dc.html` (masa kartı).

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 7.1 | Masa kartının resmi yanlış kırpılıyor: "Gün Batımı Külahı"nda (`assets/table-cards/yatay/53-dondurma.webp`) dondurma hiç görünmüyor, yalnızca balinanın kuyruğu yaklaşık 3 kat büyütülmüş, bulanık bir parça olarak sol üstten görünüyor. Resim kutuyu `cover` ile ortalanmış olarak doldurmalı. **6.1 ile aynı kök**: iki yerde de `Image` + `resizeMode="cover"` + `absoluteFill` resmi fazla büyütüp sol üste yaslıyor. | yerleşim / resim | `TableCard.tsx:93-100` ve `:343-349`. Sebep: ? (yerel resim boyutu `width`/`height` verilmeden yoğunluğa göre büyütülüyor olabilir; `NameGlass` `:231-237`'deki bulanık kopya da aynı). | yüksek |
| 7.2 | "Masan / Gün Batımı Külahı" ad camı kirli duruyor: üst yarısında kahverengi ve sarı lekeler var, alta doğru siyaha dönüyor; cam gibi değil, lekeli bir çıkartma gibi. Bulanık arka plan resmin aynı bölgesini göstermeli, düz ve okunaklı olmalı. | renk/tema | `TableCard.tsx:212-262` `NameGlass`: camın altına konan bulanık resim kopyası (`blurRadius`) 7.1'deki yanlış ölçekle ve konumla çiziliyor, renk lekeleri oradan geliyor (?). | orta |
| 7.4 | 12 kişilik masada (dolu, `MAX_TABLE_PHONES`) "Davet et" hâlâ basılabilir görünüyor. Masa doluyken düğme kapalı olmalı ya da gizlenmeli; dolu olduğu yazmalı. | davranış | `TableCard.tsx:175-180` davet düğmesi kişi sayısına bakmıyor. | orta |
| 7.5 | Kişi çubukları (pips) yalnızca üç renkte dönüyor (yeşil, pembe, turuncu); 12 kişide aynı üç renk tekrar ediyor. **Proje sahibinin kararı (2 Kasım):** renk sayısı artırılacak, çubuklar rengarenk olacak. 12 farklı renk olmalı, sayı sınırlanmayacak. | renk | `src/theme/aura.ts:289` `AURA.pips.colors` üç renk; `src/aura/Pips.tsx:19` bunları sırayla döndürüyor. | düşük |
| 7.6 | "Açık masalar · 0 masa" altında "Katılırsan masandaki 11 kişi de seninle gelir." yazıyor; katılınacak masa yokken bu not anlamsız. Liste boşken not gizlenmeli. | davranış / metin | `Lobby.tsx` `bringsTable` notu `open.length`'e bakmıyor. | düşük |
| 7.7 | **Proje sahibinin kararı (2 Kasım):** masa adı camı ("Masan / …") resmin sol altından sol üstüne taşınacak. Yüzler sağ altta kalır ve **hepsi gösterilir** (29 Ekim kararı geçerli; 12 kişide üst üste binmeleri kabul). | yerleşim | `TableCard.tsx:102-115`: ad camı ile yüzler aynı satırda, `bottom: k.inset`'e yaslı. Ad camı `top: k.inset`'e ayrı konmalı, yüzler altta kendi satırında kalmalı; yüzler o zaman tüm genişliği kullanır ve daha az biner. | orta |
