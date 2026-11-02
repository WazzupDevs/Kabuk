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

### 13. DM sohbeti (açık)

Kod: `apps/mobile/src/components/ChatTopBar.tsx:136-250` (`SplitBar`), `src/components/Composer.tsx:62-235`, `src/components/ChatBubble.tsx:190-330, 625-655` (`BubbleTail`), `src/components/ChatScreen.tsx:1088-1094` (`useComposerGlass`). Pano: `Dm.dc.html`.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 13.1 | Üst barda ad kapsülü ("Fevve") yandaki geri ve "⋮" yuvarlaklarından daha yüksek (56'ya 44); üçü aynı satırda farklı boyda duruyor. **Proje sahibinin kararı (2 Kasım):** ad kapsülü yandaki yuvarlaklarla aynı yükseklikte olacak (avatar ona göre küçülür). | ölçü/boşluk | `ChatTopBar.tsx:139-142` `PILL = KIT.size.dmPill` (56), `ROUND = KIT.size.roundLg` (44); **[P1]** `src/theme/auraKit.ts:514,668`. | orta |
| 13.2 | ~~Mesaj alanı ile gönder düğmesi farklı boyda~~ **Düzeltme:** kodda ikisi de 56 (`auraKit.ts:656-657`), görüntüde de eşit. Mesaj barındaki hata 13.3 (cam kırılması). Bu madde geçersiz. | — | — | — |
| 13.3 | Mesaj yazma alanı canlı buzlu cam: altından geçen mavi balonun rengi alana kırılıp yayılıyor (alan mavimsi lekeli görünüyor). **Proje sahibinin kararı (2 Kasım):** alan buzlu cam olmayacak; benzer görünüşte (yarı saydam beyaz dolgu, ince açık kenar, yumuşak gölge) ama altından geçen mesajın ışığını kırmayan düz bir yüzey olacak. Gönder düğmesi de aynı. | renk/tema | `Composer.tsx:99-131`: `useComposerGlass()` + `TAB_BAR_GLASS` ile `GlassFill` (canlı `LiquidGlass`, `GlassTargetView`); `src/theme/glass.ts`. | orta |
| 13.4 | Benim gönderdiğim (yeşil) balonların sağ alt köşesinde iki uç var: balonun kendi köşesi ile kuyruk (`BubbleTail`) ayrı ayrı sivri duruyor, aralarında çentik var. Gelen (mavi) balonlarda tek uç var. Tek, kesintisiz bir kuyruk olmalı. | ikon / yerleşim | `ChatBubble.tsx:633-655` `BubbleTail` sağda `scaleX: -1` ile çevriliyor. Çevrilmiş SVG'nin paylaşılan resmi (`svgKey`, `patches/react-native-svg`) dönüşümle yanlış konumlanıyor ya da balonun gölgesi (`bubbleShadow`, `:325`) köşeyi yuvarlak çizip ikinci uç gibi görünüyor (?). | orta |
| 13.5 | **Proje sahibinin kararı (2 Kasım):** 13.1, 13.2, 13.3 ve 13.4 bütün sohbet ekranlarında geçerli: DM, mekan sohbeti, masa (oda) sohbeti. Üst barlar 13.1'deki ölçüde (ad kapsülü yuvarlaklarla aynı yükseklikte), alttaki mesaj alanı ve gönder düğmesi 13.2 ve 13.3'teki gibi (aynı yükseklik, buzlu değil, ışığı kırmayan düz yüzey) olacak. | kural | Ortak bileşenler: `ChatTopBar.tsx`, `Composer.tsx` (`DraftComposer`, `src/features/chat/ChatPanel.tsx:258` `RoomComposer`), `ChatBubble.tsx`; mekan sohbeti `app/(app)/venue-chat/index.tsx`, masa `app/(app)/room/[id].tsx`. | — |

### 14. Keşfet → mekan ayrıntısı (açık)

Kod: `apps/mobile/app/(app)/(tabs)/explore/[venueId].tsx:83-125`, resim `assets/riso/venue-scene.webp`. Pano: `KesfetMekan.dc.html` (üstte 300 yüksekliğinde riso sahne, alt köşeleri 28).

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 14.1 | Üstteki riso sahne hiç çizilmiyor: ekranın ilk 300 dp'si boş zemin, geri düğmesi ve etiketler boşlukta asılı duruyor. Panodaki mekan sahnesi görünmeli. **Proje sahibine göre aynısı "benzeri ekranlarda" da var.** **Kök adayı (6.1, 7.1 ile birlikte):** riso resimler üç yerde de `Image` + `resizeMode="cover"` + `StyleSheet.absoluteFill` ile çiziliyor ve ya hiç görünmüyor (burada) ya da yanlış ölçekte görünüyor (6.1, 7.1). Riso resim çizen her yer (`NoTable`, `TableCard`, `Lobby` boş durumu, `SpotPicker`, `PosterCard`, `TableEnd`, `ProfileCard`) birlikte kontrol edilmeli. | resim / yerleşim | `[venueId].tsx:112-120`: resim yerel `GlassTargetView` (`GlassTarget backdrop`) içinde; üstündeki `FrostResolve` (`:122`, yerel `DissolveView`) bitmeden ya da hedef resmi çizmeden kalıyor olabilir (?). Kontrol için `GlassTarget` dışında aynı `Image` denenmeli. | yüksek |
| 14.2 | "Mekana dön" ve "Bu hafta planlı etkinlik yok" kartı arasında yine yeşil hale var (2.1); etkinlik yok kartı riso değil (9.1 kararı). | renk / resim | **[P1]** bkz. 2.1; bkz. 9.1 | — |

### 15. Mekan → "Masanı lobiye aç" alt sayfası (açık)

Kod: `apps/mobile/src/features/rooms/OpenLobbySheet.tsx:72-127` (ve aynı seçimlerin olduğu `CreateTableSheet.tsx`). Pano: `MasaLobiyeAc` yerel kopyada yok (pano yok).

**Proje sahibinin gözlemi (2 Kasım): ekran çok karışık.** Karışıklığın kaynakları:

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 15.1 | Dokuz oyun çipi ve üç niyet çipi düzensiz satırlara dökülüyor ("İbre" tek başına bir satırda); iki grup alt alta tek kartta, başlıkları aynı tonda. Göz nereye bakacağını bilmiyor. **Proje sahibinin kararı (2 Kasım):** oyun çipleri yalnızca niyet "Oyun" seçilince açılır; açılınca yatay kayan tek satırdır. Aynısı `CreateTableSheet.tsx`'te. | yerleşim | `OpenLobbySheet.tsx:77-106`: iki `Chips wrap` her zaman görünür. | orta |
| 15.2 | "Etiket yok" ve "Fark etmez" ayrı çip olarak seçili duruyor; siyah dolgulu iki çip sayfanın en baskın öğesi oluyor, oysa "hiçbir şey seçme" anlamına geliyorlar. **Proje sahibinin kararı (2 Kasım):** bu iki çip kalkar; hiçbiri seçili değilse etiket yok sayılır, seçili çipe yeniden basınca seçim kalkar. Aynısı `CreateTableSheet.tsx`'te. Ürün belgesine (`docs/SPEC_V4.md`) aynı PR'da yazılmalı. | yerleşim / davranış | `:84-86`, `:98-100` `value: 'none'` seçenekleri. | orta |
| 15.3 | "(isteğe bağlı)" iki başlıkta tekrarlanıyor, üstte iki satırlık açıklama, en altta bir not daha var; dört ayrı yardım metni. Öneri: üst açıklama tek satıra insin, "(isteğe bağlı)" bir kez yazsın ya da hiç yazmasın, alt not oyun satırı açılınca görünsün. | metin | `:74`, `:78`, `:91`, `:106`; `src/i18n/tr.ts:860-872` | düşük |
| 15.4 | Seçimler kartı sayfa zemininden ayrışmıyor (8.1); "Lobiye aç" ve "Vazgeç" iki tam genişlikli 56 dp düğme, sayfanın üçte birini kaplıyor (10.3). Sayfa dışına basınca ve aşağı kaydırınca zaten kapanıyor; "Vazgeç" küçük bir metin düğmesi olabilir. | ölçü / renk | **[P1]** bkz. 8.1, 10.3; `:115-126` | orta |
| 15.5 | Sayfa eski tasarım bileşenleriyle çizilmiş (`Text`, `Card tone="note"`, `Chips`, `Button size="lg"`); aura kitinin `T`, `Chip`, `Btn` bileşenleri kullanılmıyor (5.4 ile aynı sorun). | renk/tema | `OpenLobbySheet.tsx:8` ve gövde | düşük |

### 16. Profil → Arkadaşlar (açık)

Kod: `apps/mobile/app/(app)/(tabs)/profile/friends.tsx:55-106`, `src/aura/kit.tsx:872-902` (`RowList`), `Li`. Pano: `Arkadaslar.dc.html` (satırlar `glass sm lst` kartın içinde).

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 16.1 | Arkadaş satırları kartsız, doğrudan zeminde duruyor. Panoda satırlar buzlu cam bir liste kartının (`glass sm lst`) içinde; kodun kendi yorumu da "glass list" diyor. Satırlar kartın içine alınmalı (Keşfet'teki mekan listesi gibi). | yerleşim / renk | **[P1]** `kit.tsx:872-902` `RowList` yalnızca satırları ve çizgileri diziyor, kart çizmiyor; `friends.tsx:67-71`. | orta |
| 16.2 | Satırlar arasındaki ince çizgi ekranın sağ kenarına kadar uzanıyor; sağda boşluk yok. Çizgi sağda da satırın iç boşluğunda bitmeli (Keşfet'teki gibi `marginRight: liPadX`). | ölçü/boşluk | **[P1]** `kit.tsx:889-895`: ayırıcıda `marginRight` yok, liste `marginHorizontal: -liPadX` ile ekrana taşıyor. | düşük |
| 16.3 | Sohbet düğmeleri (44 dp, belirgin gölgeli) satırdaki en ağır öğe; avatar ve addan baskın duruyor. Daha küçük (36) ve gölgesiz ya da hafif olmalı. | ölçü/boşluk | `friends.tsx:97-103` `Round` varsayılan boy ve gölge. | düşük |
| 16.4 | Bu ekran da eski bileşenlerle yazılmış hata ve yükleniyor hâllerini taşıyor (`Card`, `Text`, `Button`; 5.4). | renk/tema | `friends.tsx:56-63` | düşük |

### 17. Başkasının profili (arkadaş, açık)

Kod: `apps/mobile/src/features/profile/ProfileCard.tsx:63-120` (`OtherHead`, `PEEK_BUDDY`), `src/features/friends/FriendActions.tsx:20-60`. Pano: `ProfilBaskasi`, yerel kopyada yok (pano yok); kodun yorumu U31'i anıyor.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 17.1 | "Arkadaşsınız" bir durum bilgisi ama "Mesaj" ile aynı boyda bir düğme gibi duruyor; basılabilir sanılıyor ve basınca bir şey olmuyor. **Proje sahibinin kararı (2 Kasım):** düğme kalır; arkadaşsanız **"Arkadaşlıktan çıkar"** düğmesi olur (`tr.friends.removeFriend`), basınca bugünkü onaylı çıkarma akışı (kural 5) açılır. "Mesaj" yanında kalır. | davranış | `FriendActions.tsx:24-36`: bugün basılamayan bir hap çiziliyor; çıkarma şu an yalnızca "⋮" menüsünde. | orta |
| 17.2 | Fotoğrafın arkasından bakan riso kapsül her profilde aynı (`assets/riso/peek-1.webp`). **Proje sahibinin kararı (2 Kasım):** süs kalır, kapsül çeşidi artar: birden çok riso kanki (`peek-2.webp` ve yenileri, ya da `src/aura/RisoKanki.tsx`'teki kankiler) arasından her profilde biri görünür. Seçim kişinin anonim kapsülüne bağlanmaz, ondan türetilmez (kural 4); örneğin `public_id`'den değil, sayfa açılışında rastgele seçilir. | resim | `ProfileCard.tsx:63-73` `PEEK_BUDDY` tek resim. | düşük |
| 17.3 | "Mesaj" altında yeşil hale (2.1), boyu 56 (10.3). | renk / ölçü | **[P1]** bkz. 2.1, 10.3 | — |

### 18. Profil fotoğrafı büyütülmüş (kendi ve başkasının, açık)

Kod: `apps/mobile/src/components/PhotoPreview.tsx:14-80`; çağıranlar `src/features/profile/ProfileCard.tsx:102-106`, `app/(app)/(tabs)/profile/index.tsx`. Pano: `ProfilFoto.dc.html`.

| # | Hata | Sınıf | Olası sebep | Önem |
| --- | --- | --- | --- | --- |
| 18.1 | Fotoğrafın arkasındaki örtü koyu yeşil ve neredeyse opak (%86): arkadaki ekran bataklık yeşili bir lekeye dönüyor, fotoğrafın renkleri yeşile çalıyor. Fotoğraf görüntüleyicide zemin nötr koyu (siyah %70–80; Telegram Android'de siyah) olmalı. | renk/tema | **[P1]** `src/theme/auraKit.ts:331` `photoScrim: 'rgba(3, 27, 11, 0.86)'` | orta |
| 18.2 | Fotoğrafın köşelerinde (sağ alt, sağ kenar) beyaz ince bir şerit ve köşe görünüyor; resim beyaz kartın içinde, kenarı tam örtmüyor. Kenarlar temiz olmalı. | yerleşim | `PhotoPreview.tsx:59-78`: kart `backgroundColor: KIT.white` + `overflow: 'hidden'` + `borderRadius`; içteki `Image`'ın kendi köşesi yuvarlanmadığı için kenar yumuşatmasında beyaz zemin sızıyor. Kart zemini saydam olmalı ya da `Image`'a da `borderRadius` verilmeli. | düşük |
| 18.3 | Kapatma yolu görünmüyor: kapatma düğmesi ya da ipucu yok, yalnızca dokunma ve geri tuşu kapatıyor. Telegram'daki gibi aşağı kaydırınca da kapanmalı (Ekran davranışı: "kaydırınca kapanır"). | davranış | `PhotoPreview.tsx:49-57`: yalnızca `onPress` ve `onRequestClose`; kaydırma hareketi yok. | düşük |

## Çapraz tarama: aynı kökün başka ekranlardaki izleri

Proje sahibinin isteğiyle (2 Kasım): her kök kodda arandı; görüntüsü gelmeyen yerler buraya yazıldı. Maddeler yukarıdakilere bağlıdır.

| # | Kök ve bulunan yerler | Bağlı maddeler | Önem |
| --- | --- | --- | --- |
| X1 | **Riso resimler yanlış ölçekte ya da hiç çizilmiyor: kök büyük olasılıkla bulundu.** `react-native` `Image`'a `style={StyleSheet.absoluteFill}` verilen her yerde resim kutuya göre değil, kendi piksel boyunda çiziliyor; kodun kendisi bunu `src/aura/AuraBackground.tsx:30-31`'de not etmiş ("Its own size, or it draws at the picture's pixels"). Bozuk görünen her yer bu kalıpta: `src/features/rooms/TableCard.tsx:98` (masa resmi), `:236` (ad camının bulanık kopyası), `:347` (Henüz masan yok), `app/(app)/(tabs)/explore/[venueId].tsx:118` (mekan sahnesi). Düzgün görünenler açık `width`/`height` veriyor (`PosterCard.tsx:94`, `RisoPicture.tsx:37`, `ChatWallpaper.tsx`, `vampir/RoundTable.tsx:850`). Düzeltme: dört yerde `width: '100%', height: '100%'` (ya da piksel ölçü). `expo-image` kullananlar (`TableEnd.tsx:84`, `RisoKanki.tsx:197`) bu sorundan etkilenmez. | 6.1, 7.1, 7.2, 14.1 | yüksek |
| X2 | **Renk bulutlu zemin (aura) birçok ekranda yok.** Açık temada Keşfet (liste), Mesajlar, Arkadaşlar, Profili düzenle, Kapsül düzenle ve mekan ayrıntısı düz nane yeşili; Keşfet (harita), Mekan, Profil ve alt sayfaların arkasında bulutlar var. Her ekran `Screen` → `AuraBackground` çiziyor (`src/components/Screen.tsx:105`), yani bulut resmi bazı ekranlarda çizilmiyor. Aday: zemin yerel `GlassTargetView` içinde (`AuraBackground.tsx:21`, `GlassTarget backdrop`), 14.1'deki mekan sahnesi de öyle (?). Bu durumda alttaki `AuraBand` şeritleri (resmin dilimleri) düz zeminin üstünde ayrı bir bant gibi görünür; 12.3'teki sert çizgi ve 4.3 bundan olabilir. | 12.3, 14.1, 4.3, 11.4 | yüksek |
| X3 | **Alt sayfada kapat ya da onay düğmesi içerikte, `footer`'da değil** (5.1 kalıbı: içerik uzayınca düğme kayıp gider). `src/features/rooms/InviteSheet.tsx:177` ("Tamam", arkadaş listesinin altında; arkadaş çoksa görünmez), `src/features/rooms/TableIconSheet.tsx:70` (simge ızgarasının altında), `src/features/chat/ReportModal.tsx:46` ("Vazgeç", sebep listesinin altında), `src/features/rooms/OpenLobbySheet.tsx:115-126`, `app/(app)/(tabs)/activities.tsx:282`. `footer` kullananlar: `CreateTableSheet`, `RoomPeople`, `RouteSheet`, `settings-account`, `explore/index`. | 5.1, 15.4 | orta |
| X4 | **Geri düğmesi kayan içeriğin içinde** (12.1 kalıbı): `profile/edit.tsx:200`, `profile/capsule.tsx` (önizlemenin üstü), `explore/[venueId].tsx:127` (sahnenin üstünde, sahneyle birlikte kayıyor; sabit kalmalı), `people/[publicId].tsx:77` → `ProfileTopBar` (`ProfileCard.tsx:46`, `Screen refreshable` içinde kayıyor). `ChatTopBar` ve `room/[id].tsx` sabit. Ortak çözüm: `Screen`'e sabit `header` yuvası. | 12.1 | yüksek |
| X5 | **Sayfa içi kart ve beyaz düğme sayfa zeminiyle birleşiyor** (8.1): bütün 26 `Sheet` kullanımında geçerli; özellikle kart ya da liste içerenler: `VenueHead.tsx` (Seçenekler), `OpenLobbySheet`, `CreateTableSheet`, `InviteSheet`, `RoomPeople`, `IdentitySheet`, `explore/index.tsx` (Şehir ve semt, "Vazgeç"), `settings-account.tsx`. | 8.1, 3.3 | yüksek |
| X6 | **Liste kartı yok ve ayırıcı çizgi sağ kenara taşıyor** (`RowList`, 16.1–16.2): `settings.tsx:108`, `settings-privacy.tsx:25,49`, `settings-account.tsx:74`, `settings-muted.tsx:46`, `messages/index.tsx:139` (Sohbetler), `rooms/Lobby.tsx:196,245` (Açık ve süren masalar), `chat/BlockedList.tsx:54`, `explore/ExploreMap.tsx:537` (yığın listesi). Tek bileşende düzelir. | 16.1, 16.2 | orta |
| X7 | **Eski tasarım bileşenleri** (`@/components/Button`, `Text`, `Card`, `Chips`) aura ekranlarında hâlâ kullanılıyor (5.4, 15.5, 16.4). Kullanıcıya görünen ekranlar: `activities.tsx`, `messages/[threadId].tsx`, `profile/capsule.tsx`, `profile/capsules.tsx`, `profile/edit.tsx`, `profile/friends.tsx`, `people/[publicId].tsx`, `room/[id].tsx`, `spot.tsx`, `venue-chat/index.tsx`, `venue-chat/[messageId].tsx`, `(auth)/otp.tsx`, `(onboarding)/birth.tsx`, `(onboarding)/extras.tsx`, `friends/RequestList.tsx`, `friends/historyActions.tsx`, `friends/ConfirmWithReport.tsx`, `chat/ReportModal.tsx`, `checkin/IdentitySheet.tsx`, `profile/PhotoSheet.tsx`, `profile/ProfileCard.tsx`, `rooms/CreateTableSheet.tsx`, `InviteSheet.tsx`, `OpenLobbySheet.tsx`, `RoomPeople.tsx`, `TableIconSheet.tsx`, `SpotHeading.tsx`, oyunlar (`games/*`), `update/UpdateRequired.tsx`, `explore/ExploreMap.tsx`, `VenueTags.tsx`. Koyu temadaki içi boş düğme ve neon yeşil bağlantı (5.4) bu ekranların hepsinde beklenir. | 5.4, 15.5, 16.4 | orta |
| X8 | **Koyu temada canlı noktanın gri halkası** (2.2): `Live` kullanan her yer: `explore/index.tsx`, `VenueChatCard.tsx` ("şu an aktif"), `ProfileCard.tsx`, `TableCard.tsx`, `VenueHead.tsx` ("Mekandasın"), `VenueTags.tsx`, `ExploreMap.tsx`. | 2.2 | düşük |
| X9 | **Yeşil hale** (2.1) her `Btn` ve `Round` `primary`'de: Masa kur, Lobiye aç, Göster, Mekana dön, Mesaj, Kapsülünü süsle, oyun düğmeleri, gönder (dolu). Tek değişiklikle hepsi düzelir. | 2.1 | orta |
| X10 | **Düzenleme ekranında sekme çubuğu** (11.5 kararı): `profile/edit.tsx`, `profile/capsule.tsx`, `profile/capsules.tsx` (kapsül galerisi, aynı yığında). | 11.5, 12.2 | orta |
| X11 | **Sayım ve boş durum aynı bilgiyi veriyor** (6.3): `Lobby.tsx:231` "Süren masalar" başlığı da sayıyla geliyor; boşken "0 masa" yine görünür. | 6.3 | düşük |
| X12 | **Kaydırma hareketi ve dokunma ile kapanan yüzeyler** (18.3): `PhotoPreview` dışında `RouteSheet` ve yerleşik `Modal` kullanan yerler kaydırmayla kapanmayı taşıyor mu kontrol edilmeli (`chat/ReportModal.tsx`). | 18.3 | düşük |

## Bütünlük kuralları (proje sahibinin kararı, 2 Kasım)

Bunlar tek tek hata değil, düzeltme paketlerinin uyacağı kurallar. Yeni bir kural olduğu için CLAUDE.md → "Ekran davranışı"na da yazılmalı.

| # | Kural | Bugünkü sapma | İlgili maddeler |
| --- | --- | --- | --- |
| B1 | **Aynı tür düğme her ekranda aynı boydadır.** Ana (tam genişlik) düğme tek yükseklik, küçük düğme tek yükseklik, yuvarlak ikon düğmesi tek boy, üst bardaki her öğe (geri, ad kapsülü, menü) aynı yükseklik; alan (input) ana düğmeyle aynı yükseklik. Ölçü ekran ekran değişmez. | `src/theme/auraKit.ts` (**[P1]**): `btn` / `btnTall` / `btnRow` 56, `btnSm` / `btnMid` 40, `round` / `roundLg` 44, `bar` 44, `dmPill` 56, `field` / `fieldLg` / `composerField` / `composerSend` 56; çipler dört boyda (`chip` 32, `chipTall` 38, `chipLg` 40, `md`). Eski bileşenler (`@/components/Button` `size="lg"`/`"sm"`, X7) ayrı bir ölçek kullanıyor. Ekranlar boyu kendisi seçiyor (`bar={…}`, `tall`, `big`, `sm`): `IdentitySheet.tsx` (5), `room/[id].tsx` (4), `venue-chat` (6), `checkin/index.tsx` (3), `profile/edit.tsx`, `explore/index.tsx`, `profile/index.tsx`, `people/[publicId].tsx`… | 10.3, 11.2, 13.1, 15.4, 16.3, 17.1, X7 |
| B2 | **Üst düğmeler (geri, menü, ayar, bildirim) hiçbir ekranda içerikle kaymaz.** Bir ekranda sabitse her ekranda sabittir; başlık altından kayar. | Sabit: sohbetler (`ChatTopBar`), Masa (`room/[id].tsx`). Kayan: `profile/edit.tsx`, `profile/capsule.tsx`, `people/[publicId].tsx` (`ProfileTopBar`), `explore/[venueId].tsx`; sekme ekranlarının sağ üst düğmeleri (Mekan "…", Profil ayar, Mesajlar zil, Keşfet görünüm seçici) de `Screen` içeriğinde, kontrol edilmeli. Çözüm: `Screen`'e sabit `header` yuvası, bütün ekranlar onu kullanır. | 12.1, X4 |

