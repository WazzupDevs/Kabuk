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
| 7.8 | Mekan sohbeti kartında avatar ile mesaj satırı aynı hizada değil: yazı avatarın ortasından birkaç dp yukarıda duruyor. Yazı avatarın dikey ortasına hizalanmalı. | yerleşim / hizalama | `src/features/venueChat/VenueChatCard.tsx:293-305`: Android'de metin yatay `ScrollView`'un içinde. `ScrollView`'un içeriği satırın en üstüne yaslanıyor (`contentContainerStyle` yok); satırdaki `alignItems: 'center'` (`:283`) yalnızca dış `View`'u ortalıyor. İç içe `Text`'te `KIT_TYPE.strong`'un satır yüksekliği `fineLg`'den farklı olabilir (?). | orta |

### 8. Alt sayfalar genel: "Seçenekler" (Mekan → …), açık

Kod: `apps/mobile/src/features/venue/VenueHead.tsx:69-115` (sayfa), `:153-200` (`IdentityRow`), `src/components/Menu.tsx:28-68` (`Menu`, `MenuItem`), `src/aura/kit.tsx:127-190` (`Glass`, `FlatGlass`), `src/theme/auraKit.ts:155,189`. Pano: `SablonSheet.dc.html`; Mekan seçenekleri için `MekanSecenekler` yerel kopyada yok.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 8.1 | **Bütün alt sayfalarda:** sayfanın içindeki beyaz kartlar ve düğmeler ("Profilini aç / Mekandan ayrıl" menüsü, `glassy` düğmeler, `Glass` kartlar) sayfanın beyaz zeminiyle birleşiyor; kenarları seçilmiyor. Sayfa içindeki kart zeminden ayrışmalı: koyu temadaki gibi ayrı bir ton (ör. `#FFFFFF` kart, `#EFF7F1` sayfa) ya da ince bir kenar çizgisi olmalı. | renk/tema | **[P1]** `src/theme/auraKit.ts:155` açıkta `glassInSheet` ile `:189` `sheet` birebir aynı gradyan; `kit.tsx:157-160` sayfa içinde (`FlatGlass`) gölgeyi de kaldırıyor; `Menu.tsx:41` aynı `glassInSheet`'i kullanıyor. Koyu temada `glassInSheet` (`#1B211F`) sayfadan (`#121614`) ayrı, orada sorun yok. | yüksek |
| 8.2 | Kimlik satırı ("Profilinle görünüyorsun") ile menü satırları farklı iç boşlukla çizilmiş: ikonlar ve yazılar alt alta hizalı değil (ikon ve yazı kimlik satırında yaklaşık 4–5 dp daha solda). İki blok aynı sol hizayı kullanmalı. | ölçü/boşluk | `VenueHead.tsx:172-173` `paddingHorizontal: SPACING[4]`; `Menu.tsx` `MenuItem` farklı boşluk kullanıyor. | düşük |
| 8.3 | Kimlik satırındaki ikon düz bir kişi, "Profilini aç"ınki dolu daire içinde bir kişi; aynı kavram iki farklı ikonla çiziliyor. Tek bir ikon kullanılmalı. | ikon | `VenueHead.tsx:179` `CapIcon 'user'`, `:90` `cap="personCircle"` | düşük |
| 8.4 | Bu sayfada da arka ekran bulanıklaşmıyor (3.1). | renk/tema | **[P1]** bkz. 3.1 | — |

### 9. Mesajlar → İstekler (boş, açık)

Kod: `apps/mobile/src/features/friends/RequestList.tsx:108`, `src/components/EmptyState.tsx:72-74`, `src/aura/EmptyMark.tsx`. Pano: `MesajlarIstek.dc.html` (panoda da çizgi işaret var; proje sahibi riso istiyor).

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 9.1 | "Bekleyen istek yok" boş durumunda riso resim yerine küçük çizgi bir işaret (mor kapsül ve kesikli pembe kapsül) var; lobideki ve Masa bitti'deki riso sahnelerle aynı dilde değil. **Proje sahibinin kararı (2 Kasım):** boş durum riso resimle olmalı (`EmptyState` → `picture`, `Lobby.tsx:377`'deki gibi). Bu boş durum için riso resim yok (`assets/riso/`); yeni resim gerekir. | ikon / resim | `RequestList.tsx:108` `EmptyState kind="empty"` `picture` vermiyor, `EmptyMark` çiziliyor. **Proje sahibinin kararı (2 Kasım): bütün boş durumlar riso olacak.** `picture` verilmeyen 44 `EmptyState` çağrısının hepsi (Sohbetler, bildirimler, arkadaşlar, engellenenler…) riso resim alacak; her biri için resim üretilmeli ya da mevcut resimler (`assets/riso/`) paylaşılmalı. `EmptyMark` boş durumdan kalkar. | orta |

### 10. Profil (açık)

Kod: `apps/mobile/app/(app)/(tabs)/profile/index.tsx`. Pano: `Profil.dc.html`.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 10.1 | Kapalı "Yenile" düğmesi (24 gün var) yeşilimsi dolgulu ve ikonlu olduğu için basılabilir görünüyor. Panoda kapalı düğme ikonsuz ve soluk yazılı (`#8F89A8`); kapalıyken ikon da soluk olmalı ya da hiç olmamalı. | renk/tema | `profile/index.tsx:304-312` `Btn glassy icon="refresh" disabled`; kapalı `Btn`'in görünüşü `src/aura/kit.tsx` → `Btn` (`disabled` dolgusu `#DCE9DE`). | düşük |
| 10.2 | "Kapsülünü süsle" altında yine yeşil hale var (2.1). | renk/tema | **[P1]** bkz. 2.1 | — |
| 10.3 | "Profili düzenle" ve "Kapsülünü süsle" çok büyük: 56 dp yükseklik, ekranı ikiye bölen iki tam genişlikli düğme; sayfanın asıl içeriğinden (fotoğraflar, ad) daha baskın. Panoda 50 dp. **Proje sahibinin gözlemi (2 Kasım).** Öneri: 40–44 dp (`sm`), yazı 14–15; yan yana kalabilir. | ölçü/boşluk | `profile/index.tsx:142-156` `bar={KIT.size.btnRow}` (56); **[P1]** `src/theme/auraKit.ts:536` `btnRow: 56` (panonun 50'sinden büyük). | orta |

### 11. Profil → Kapsülünü süsle (Baş sekmesi, kaydırılmış, açık)

Kod: `apps/mobile/app/(app)/(tabs)/profile/capsule.tsx:118-420` (`Editor`), sekme çubuğu `app/(app)/(tabs)/_layout.tsx:47`. Pano: `Kapsul.dc.html`.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 11.1 | Kaydırınca kapsül önizlemesi durum çubuğunun altında sert bir çizgiyle kesiliyor (ekranın üstünde yarım daire kalıyor); başlık ya da sönme yok. Yukarıda zemine sönen bir geçiş olmalı ya da önizleme küçülüp üstte sabit kalmalı. Seçim yaparken sonucun görünmesi gerekir. | yerleşim/taşma | `capsule.tsx:201` `Screen`: önizleme içerikle birlikte kayıyor; üst kenarda sönme yok. | orta |
| 11.2 | Altta iki bar üst üste duruyor: "Hepsini çıkar / Kaydet" (56 dp) ve sekme çubuğu. Ekranın yaklaşık %20'sini kaplıyorlar, paket kartları arkalarında kalıyor. Düzenleme ekranında sekme çubuğu gizlenmeli ya da düğmeler küçülmeli (10.3 ile aynı ölçü sorunu). | yerleşim / ölçü | `capsule.tsx:202-245` `footer`; düzenleme ekranı `(tabs)/profile` yığınında, sekme çubuğu görünür kalıyor (`(tabs)/_layout.tsx:47`); **[P1]** `auraKit.ts:536` `btnRow: 56`. | orta |
| 11.3 | Paket kartı "5 yuvaya parça" diyor ama altında yalnızca bu yuvanın 2 parçası var; sayı ile gösterilen uyuşmuyor, kartın sağı boş. Ya "Bu pakette 5 parça · burada 2" denmeli ya da sayı kaldırılmalı. | metin | `capsule.tsx:359` `packSlots(packItems(...).length)` bütün paketi sayıyor, `group.items` yalnızca seçili yuvayı gösteriyor. | düşük |
| 11.4 | Yuva sekmelerinin (Renk, Göz, Baş…) arkasında, sağdaki sönme şeridinin alt kenarı zeminden farklı tonda bir bant olarak görünüyor. | renk/tema | `capsule.tsx:320-332`: sönme gradyanı `ground` rengiyle, ama ekranın gerçek zemini aura bulutu (`AuraBackground`), düz renk değil. | düşük |
| 11.5 | **Proje sahibinin kararı (2 Kasım), 11.1 ve 11.2'nin çözümü:** (a) Düzenleme ekranında sekme çubuğu hiç görünmez. (b) Liste yukarı kaydırılınca (içerik yukarı akarken) kapsül önizlemesi **gizlenmez**, yalnızca biraz daha yukarı çıkar ve üstte görünür kalır (seçimin sonucu hep görünür); giyilenlerin çipleri, yuva sekmeleri (Renk, Göz, Baş…) ve alttaki "Hepsini çıkar / Kaydet" de gizlenir. (c) Ters yöne kaydırınca hepsi geri gelir; sekme çubuğu gelmez. Hareket Telegram Android'in kaydırınca gizlenen başlığı gibi, `MOTION` eğrileriyle. | davranış / hareket | `capsule.tsx:201-245` (`Screen`, `footer`), önizleme ve çipler içerikte; sekme çubuğu `(tabs)/_layout.tsx:47` (ekran `(tabs)/profile` yığınında). Kaydırma yönüne bağlı gizleme için Reanimated `useAnimatedScrollHandler` gerekir. | orta |

### 12. Profil → Profili düzenle (kaydırılmış, açık)

Kod: `apps/mobile/app/(app)/(tabs)/profile/edit.tsx:176-273`, `src/components/Screen.tsx` (header yuvası yok; `footer` `:151-175`). Pano: `ProfilDuzenle.dc.html`.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 12.1 | Geri düğmesi sabit değil: ekran kayınca içerikle birlikte yukarı gidiyor, kaydırılmışken geri dönmek için önce en üste çıkmak gerekiyor. Durum çubuğunun altında da gölgesinden kalan gri bir leke görünüyor (sol üst). Geri düğmesi üstte sabit durmalı, başlık altından kaymalı. **Aynı kalıp:** `Round icon="back"`'i içeriğin içine koyan bütün alt ekranlarda (Arkadaşlar, Kapsül, Ayarlar alt sayfaları…) var; ortak bir `Screen` → `header` yuvası gerekir. | davranış / yerleşim | `edit.tsx:198-201`: geri düğmesi `Screen`'in kayan gövdesinde; `Screen.tsx` sabit üst yuva sunmuyor. Leke: `Round`'ın yerel gölgesi (`ShadowView`) içerik kesilirken durum çubuğu kenarında kalıyor (?). | yüksek |
| 12.2 | Düzenleme ekranında sekme çubuğu görünüyor; "Kaydet" ile birlikte altta iki bar var (11.5 kararıyla aynı: düzenleme ekranlarında sekme çubuğu gizlenmeli). | yerleşim | `(tabs)/_layout.tsx:47`; ekran `(tabs)/profile` yığınında. | orta |
| 12.3 | "Kaydet" alt barının üst kenarı, arkadaki "Doğum tarihin…" kartını yatay sert bir çizgiyle kesiyor; sönme bandının sınırı görünüyor. Geçiş yumuşak olmalı. | yerleşim/taşma | `Screen.tsx:168-175` taşma sönmesi: bandın üst kenarı ile zemin rengi (`AURA.ground` düz) aura bulutlu zeminle uyuşmuyor (?). | orta |
| 12.4 | "Tanıtım" alanında yazı kutunun dikey ortasında; çok satırlı alanda yazı sol üstten başlamalı. | yerleşim | **[P1]** `src/components/Input.tsx` (veya kitteki `Input`) `multiline tall`: Android'de `textAlignVertical: 'top'` yok (?). | düşük |
| 12.5 | "Fotoğrafı değiştir" düğmesi ile avatarın üzerindeki kamera rozeti aynı işi yapıyor. **Proje sahibinin kararı (2 Kasım):** yazılı "Fotoğrafı değiştir" düğmesi kalkacak; kamera rozeti avatarın üzerinde aynı yerde kalacak; avatar (profil fotoğrafı) yatayda ortalanacak. | yerleşim | `edit.tsx:60-120` `PhotoEditor`: avatar ile düğme yan yana bir satırda. | düşük |
