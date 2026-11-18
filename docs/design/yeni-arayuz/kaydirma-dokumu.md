# Kaydırma davranışı dökümü (koddan; görüntü yok)

Kanıt sınıfı: aksi yazılmadıkça "koddan". Telefonda hiçbir şey görülmedi. Tuval bitiş hâlleri `docs/design/yeni-arayuz/project/*Kaydir.dc.html` ve `denetim/grup-NN.md`'den okundu. Yollar `apps/mobile/` köküne göredir (`app/…`, `src/…`).

## Ortak mekanizma (doğrulandı)

- Tek kaydırma değeri: `Screen` (`src/components/Screen.tsx:206`) → `ScrollScreen` (`src/motion/ScrollScreen.tsx:54`); gövde `ScrollBody` (`:135`) / `PullScroll` / `FixedBody` (`Screen.tsx:353`) `y`'yi UI iş parçacığında yazar. TopBar, StickyField, Cover, ProfileMotion, CollapsingCard `y`'yi aynı yerden okur.
- Üst çubuk iki türlüdür (`src/motion/TopBar.tsx:30-40`): `sayfa` (büyük başlık 5–50'de söner, bar başlığı 40–70'te belirir; `aura.ts:123-124`), `buyukBaslik` (büyük başlık 5–100'de söner ve 0.94'e küçülür, bar başlığı 70–100; `aura.ts:362`). `Screen`'in `bar` prop'u üretimde hiçbir ekranda verilmiyor (grep: `bar="` yok); `buyukBaslik` bar başlığı yalnız `VenueHead.tsx:153` tarafından (cüzdan ↔ mekan adı) kullanılıyor. Aktiviteler ve Keşfet `LargeTitle`'ı doğrudan çiziyor (`activities.tsx:58`, `explore/index.tsx:386`), barda küçük başlık yok.
- `Screen` hangi ekranda bar bindirir: `overlay = kind !== null && (!fixed || page !== null)` (`Screen.tsx:165`). `kind` yalnız `PageTop` (satır içi olmayan) ya da `bar` ile dolar (`:153-159`). Satır içi (`inline`) PageTop ve elle yazılmış `top` (Mesajlar, Arkadaşlar, Arşiv, Mekan, sohbetler) bar bindirmez: üst satır sabit akışta durur, içerik altından görünüm kenarında kesilir.
- Yapışan alan `StickyField` (`StickyField.tsx:73-79`): alan içerikle kayar, `stickyAt`'e (ölçülmüş) varınca `translateY = max(0, y - stickyAt)` (`scrollMath.ts:43-45`) ile sabit tutulur; bant son 80 px'te belirir (`stickyBandAt`). Konum `measureInWindow` ile bir kez, 700 ms sonra bir kez ve içerik boyu değişince yeniden ölçülür (`StickyField.tsx:61-72`). Yerel `stickyHeaderIndices` kullanılmıyor.
- Hareketi azalt: `TopBar.tsx`, `StickyField.tsx`, `ScrollScreen.tsx`, `Cover.tsx`, `CollapsingCard.tsx`, `ProfileMotion.tsx`, `scrollMath.ts`, `Screen.tsx`, `PageTop.tsx` içinde `useReduceMotion`/`reduce` geçmiyor (grep ile doğrulandı). Okuyanlar: `motion/TabBar.tsx:74-104` (sekme çubuğunun küçülmesi) ve `components/PullScroll.tsx:82` (yenileme çekişi). Tuvalin kuralı: "Kaydırmaya bağlı hareketler (şerit ölçeği, başlık solması) doğrusaldır ve azaltta durur" (`project/HareketDegerler.dc.html:44`). Kaydırma doğrusal: evet (`scrollMath.ts:6-8`, eğri yok). Azaltta durma: yok.
- İvme: tüm kaydırmalar yerel `ScrollView`; özel ivme kodu yok. Tek özel yol: Profilim `snapToOffsets` (`profile/index.tsx:139`). Hızlı kaydırmada "doğal" olması koddan doğrulanamaz.

Hüküm sözlüğü: UYUYOR · FARK (A/B/C/D) · PANOSU YOK (bu ekranın kaydırılmış hâli tuvalde çizili değil).

## Tablo

### Aile 1: Sekme kökü (büyük başlık içerikte, yapışan alan)

| # | Ekran (rota) | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu | Önerilen en küçük değişiklik |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Aktiviteler · Etkinlikler (`(tabs)/activities`) | Kayan: liste (`PullScroll`). Başlık `LargeTitle` içerikte 5–100'de söner + 0.94 küçülür; bara küçük başlık gelmez (`bar` yok). Hediye kartı son 80 px'te söner/küçülür (`StickyFade`); Etkinlikler/Geçmiş anahtarı `StickyField band` ile 6 px altta yapışır. Üst düğme yok. | A FARK: başlık bara inmiyor, sönüp yok oluyor (pano bar başlığı 17/700 gösteriyor). B: pin sert sınır (`max(0,y-pin)`), sıçrama koddan doğrulanamaz. C UYUYOR (tek başlık). D FARK: azaltta durmuyor. | `activities.tsx:55,58,68,73`; `StickyField.tsx:73-79`; `grup-03.md` 08b #4-#6 | Var: 08b `GecmisKaydir` (Geçmiş sekmesi): bar = küçük "Aktiviteler" + anahtar; kart bantta yok | Ekrana küçük bar başlığı: `Screen bar="buyukBaslik" title` (altyapı var); başlık 5–100, bar 70–100 çakışmasını önce ayır (bkz. ii-2) |
| 2 | Aktiviteler · Geçmiş (aynı rota, sekme) | Aynı. Gün başlıklı kayan satırlar; yenilenebilir. | Aynı (A, D). | Aynı; `grup-03.md` 08b | 08b | Aynı değişiklik tek yerde düzeltir |
| 3 | Keşfet liste (`(tabs)/explore/index`) | Kayan: liste (`PullScroll`, kendi `ScrollScreen` `:191`). "Soru" başlığı (`LargeTitle` çocuğu) 5–100'de söner. Arama kapsülü `StickyField band` ile yapışır (`shrink` verilmedi, kapsül incelmez). Tür çipleri ve Semte git kartı kayıp gider. | A UYUYOR (pano barda başlık göstermiyor). B FARK: pano çipleri ve "Semte git" şeridini de bantta yapıştırıyor (10c #1, #2); kodda yalnız arama. D FARK. | `explore/index.tsx:329-374,386`; `grup-03.md` 10c #1-#2, #6 | Var: 10c `KesfetKaydir`: bar = arama+harita düğmesi, çipler, 60 yüksek Semte git şeridi; içerik −318 | Çipleri `StickyField` içine al (şerit ayrı karar: kodda küçük şerit yok); `shrink` kullanılmıyor, yoruma rağmen |
| 4 | Mesajlar · Sohbetler (`(tabs)/messages/index`) | Kayan: liste. Başlık + iki yuvarlak (yeni mesaj, zil) `top` içinde SABİT; küçülmez, söner, bara inmez. Arama + Sohbetler/İstekler anahtarı ikisi birlikte yapışır. Bant 80 px'te belirir. | A FARK: pano başlığı içerikle kaydırıp barda küçük başlık gösteriyor. B FARK: pano yalnız anahtarı yapıştırıyor, arama gidiyor (01b #2). C UYUYOR (tek öğe, hiç çift yok). D: kaydırmaya bağlı başlık hareketi yok; bant/pin azaltta durmuyor. | `messages/index.tsx:67-97,98-146`; `Screen.tsx:150-186` (`kind=null`); `grup-00.md` 01b #1-#2 | Var: 01b `MesajlarKaydir`: bar = "Mesajlar" 17/700 + 2 yuvarlak, altında anahtar; arama içerikle gider | Başlık satırını `bar='buyukBaslik'`la (düğmeler `trailing`) sabitle ve `StickyField`'i yalnız anahtara indir (arama içerikte kalır) |
| 5 | Mesajlar · İstekler (aynı rota, sekme) | Aynı gövde (`RequestList`). | Aynı (A, B). | Aynı | 01b (aynı bar) | Aynı |

### Aile 2: Alt sayfa, sabit üst satır, liste altından kayar

| # | Ekran | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu | Önerilen en küçük değişiklik |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | Arkadaşlar (`profile/friends`) | Kayan: liste (yenilenebilir). Üst satır (geri + başlık 21/700 + "N arkadaş") `top`'ta sabit, küçülmez, `bar` yok. Arama `StickyField band` (yalnız arkadaş varken). | A FARK: pano `.tb2` başlığı içerikle kaydırıp barda 17/700 küçük başlık + sayı gösteriyor (06b #10-#11); kodda tek sabit satır, hiç hareket yok. C UYUYOR. D bant azaltta durmuyor. | `friends.tsx:49-69,72`; `grup-02.md` 06b #10-#11 | Var: 06b `ArkadaslarKaydir` | `Screen bar='sayfa'` ya da mevcut sabit satırı bırakıp yalnız bandın görünmesini kabul et (ürün kararı: pano başlık hareketini istiyor) |
| 7 | Arşiv (`messages/archive`) | Arkadaşlar'la aynı kalıp: sabit üst satır (geri, başlık, sayı); liste kayar, `StickyField` yok. | Başlık sabit (A pano yok). Liste üst satırın altında sert kenarda kesilir (çıkarım; bant yok). | `archive.tsx:40-62` | PANOSU YOK (01f/01g/01h kaydırılmamış) | Tuval çizmeden dokunma; bitiş hâli tanımsız |

### Aile 3: Satır içi bar (başlık barda sabit; Ayarlar ailesi)

Ortak: `PageTop inline` → `inlineTop` → `kind=null` (`Screen.tsx:154,159`): bar bindirilmez, büyük başlık yok, başlık geri düğmesinin yanında SABİT, bant yok, hareket yok. Taşarsa/liste ise içerik üst satırın altında sert kenarda kesilir (çıkarım). Pano de aynı iskeleti çiziyor (`.ptop`, kaydırılmış hâli yok).

| # | Ekran | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu | Önerilen en küçük değişiklik |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | Ayarlar (`settings`) | Sabit; yalnız taşarsa kayar. | A/B/C/D uygulanmaz; UYUYOR. | `settings.tsx:45-58`; `SettingsParts.tsx:152-175` | PANOSU YOK (03i tek durum; hükmü boş) | Yok |
| 9 | Bildirim ayarları | Aynı (`SettingsPage` liste değil). | UYUYOR. | `settings-notifications.tsx:68` | PANOSU YOK | Yok |
| 10 | Gizlilik | Aynı. | UYUYOR. | `settings-privacy.tsx:40` | PANOSU YOK | Yok |
| 11 | Engellenenler | `SettingsPage list`: satırlar kayar, başlık sabit. | Başlık hareketi yok; UYUYOR. Kenar kesimi: koddan doğrulanamaz. | `settings-blocked.tsx:12` | PANOSU YOK | Yok |
| 12 | Sessize alınanlar | Aynı (`list`). | Aynı. | `settings-muted.tsx:43` | PANOSU YOK | Yok |
| 13 | Sohbet kuralları | `SettingsPage`, liste değil. | UYUYOR. | `chat-rules.tsx:14` | PANOSU YOK | Yok |
| 14 | Masana davet et | `SettingsPage list`, başlık + alt satır barda. | UYUYOR. | `InvitePage.tsx:70` | PANOSU YOK | Yok |
| 15 | Gönderi yanıtları | `SettingsPage list`. | UYUYOR. | `venue-feed/[postId].tsx:42` | PANOSU YOK | Yok |
| 16 | Kapsülünü süsle | `Screen` sabit, üst satır satır içi (geri, başlık, Kaydet); alt çekmece kendi içinde. Yalnız taşarsa kayar. | UYUYOR. | `profile/capsule.tsx:469-486` | PANOSU YOK | Yok |

### Aile 4: `sayfa` büyük başlık + bar kopyası (iki öğe çapraz solma)

Ortak: satır içi olmayan `PageTop` → `overlay`: büyük başlık (34/800) içerikte, `fadeAt(y,5,50)`; bar başlığı (21/700, ortalı) `arriveAt(y,40,70)`; bant 5–50. İki başlık `y∈(40,50)` aralığında birlikte görünür (büyük .22→0, küçük 0→.33), büyük başlık içerikle yukarı kayarken bar satırının altına girdiği için konumları bar satırında çakışır (çıkarım). Ölçek 1: küçülme yok, yani "büyükten küçüğe geçiş" değil iki ayrı öğe (A FARK). Gövde taşmazsa (`FixedBody`) hiç kaymaz.

| # | Ekran | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu | Önerilen en küçük değişiklik |
| --- | --- | --- | --- | --- | --- | --- |
| 17 | Hesap | Sabit gövde, taşarsa kayar; yukarıdaki geçiş. | A FARK, C FARK (40–50 px). D FARK. Pano iskeleti de farklı: başlık satır içi `.ptop`. | `settings-account.tsx:71`; `TopBar.tsx:97-177,223-273`; `grup-01.md` 03n #1 | PANOSU YOK (03n kaydırılmamış; iskelet satır içi) | `PageTop`'a `inline` ver (Ayarlar ailesi gibi); büyük başlık hiç olmaz, çift sorunu biter |
| 18 | Profili düzenle | Uzun form, kayar; Kaydet barda (`trailing`), geri sabit tek. Geçiş yukarıdaki. | A, C FARK (40–50 px), D FARK. Pano `.ptb` başlığı satır içi 19/24 (03d #2). | `profile/edit.tsx:348-373`; `grup-01.md` 03d #2 | PANOSU YOK (03d/03e kaydırılmamış) | Aynı: `inline` |
| 19 | Yasal metin (`legal/[doc]`, `kvkk`, `privacy`, `rules`, `terms`: 5 rota, 1 ekran) | `Screen list`, uzun metin kayar, altta "Devam" sabit. Geçiş yukarıdaki. | A, C FARK, D FARK. Pano başlık satır içi `.ptop b` 21/700; kaydırılan `.pl` içerik. | `LegalText.tsx:154-161`; `YasalMetin.dc.html:64,164` | Kısmen: 03t tek durum (başlık barda, metin altında); büyük başlık yok | `inline` |
| 20 | Kapsül galerisi (`profile/capsules`; Gizlilik'ten açılır) | `Screen list`, `PageTop` + alt başlık; yukarıdaki geçiş. | A, C, D FARK. | `profile/capsules.tsx:40-43`; `settings-privacy.tsx:57` | PANOSU YOK | `inline` ya da çakışmayı ayır |

### Aile 5: Kapak ve uçuş (kaydırma mesafesine bağlı tek/çift öğe)

| # | Ekran | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu | Önerilen en küçük değişiklik |
| --- | --- | --- | --- | --- | --- | --- |
| 21 | Profilim (`profile/index`) | Kayan: tek `ScrollBody`; üst bölüm 0.35 hızla çıkar, 120–300'de söner, 0.92'ye küçülür (`RiseLayer`); fotoğraf ve ad çizgisel uçuşla bara uçar (`FlyingFace/FlyingName`, `flightAt(y,0,arrive)`), bant `[276,316]`; ayar düğmesi sabit tek. Bırakınca `snapToOffsets [0, arrival]`: yakın uca oturur. | A UYUYOR (tek öğe, doğrusal, kaydırmaya bağlı) ama FARK: yarıda durmuyor, ara konum yok (snap). Bitiş hâli farkı: pano küçük foto 36 solda + ad solda sola yaslı; kod 30'luk merkezde, ad ortalı (03c #2-#3). C UYUYOR (bir foto, bir ad, bir düğme; `profile/index.tsx:360-378`). D FARK: uçuş azaltta durmuyor. | `profile/index.tsx:137-148,332-378`; `ProfileMotion.tsx:99-226`; `grup-01.md` 03c #1-#3, #7 | Var: 03c `ProfilBenKaydir` (bitiş tek kare; uçuş çizilmemiş) | Snap'i kaldır ya da proje sahibine sor (iskelet 5.7 bilerek koymuş); bitiş x/boyutu `profileCover.ts:130-134` tuvale çekilsin |
| 22 | Başkasının profili (`people/[publicId]`) | Kayan: kapak 0.5 hızla (`Cover`); büyük foto 60–180'de küçülür, 120–190'da söner; büyük ad 200–240'ta söner (içerikle yukarı kayarak); bant 190–230; bara küçük yüz+ad 230–260 belirir (`BarArrive`); geri ve ⋮ sabit tek. Snap yok (ara konumda kalır). | A FARK: büyük→küçük geçiş iki öğe. C FARK, dar: ad çifti 230–240 px'te birlikte (büyük .25→0, küçük 0→.33). Foto çifti çakışmaz (190 → 230 boşluk). D FARK. | `people/[publicId].tsx:209-238,389-437`; `person.ts:20`; `profileCover.ts:86-94`; `grup-01.md` 03 #16 | PANOSU YOK (03 tek durum; denetim "DOĞRULANAMADI") | `nameFade`'i `[200,230]` yap (`person.ts:20`): çakışma biter, tek sayı |
| 23 | Mekan detayı (`explore/[venueId]`) | Kayan: sahne 0.45 hızla; kart içeriğiyle; kart adı 290–330'da söner; bant 240–280; bara küçük resim+ad 300–330; geri sabit tek. | A FARK, C FARK: 300–330 px'te iki ad birlikte (örn. 315'te .38 / .5); büyük ad içerikle yukarı kayıp bar satırına girer (çıkarım). D FARK. | `explore/[venueId].tsx:215,335,357`; `theme/venueDetail.ts:33`; `auraKit.ts:862-872` | PANOSU YOK (17 tek durum; grup-04 #7 "fazla, pano yok") | `titleFade` bitişini 300'e çek (`venueDetail.ts:33` → `[290,300]`) |

### Aile 6: Mekan sekmesi (katlanan kartlar)

| # | Ekran | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu | Önerilen en küçük değişiklik |
| --- | --- | --- | --- | --- | --- | --- |
| 24 | Mekan · Masalar (`(tabs)/venue`) | Kayan: `ScrollBody` (`scrollRef`). `VenueHead` `top`'ta SABİT (cüzdan, kimlik anahtarı, ⋮). Cüzdan `ScrollFade` ile 70–100'de söner, aynı yerde `BarName` ("ad" + "Mekandasın") 70–100'de belirir. Masa kartı 104'te yapışıp 72'ye katlanır (`CollapsingCard`: `height` UI iş parçacığında), içerik 170→100 yükseklikte şeride çapraz solar; sohbet kartı altında 54'e katlanır; bant katlanınca gelir. "Masalar/Akış" `Seg` içerikte kayar. Sert/ayrı hâl: `shut` JS durumu (`runOnJS`) yarıçapı 28→22 çevirir. | B FARK: pano 23 #1: `Seg` bantta yapışık; kodda gidiyor. C FARK: cüzdan ↔ ad aynı aralıkta tam çapraz (70–100; 85'te .5/.5); iki satırlı adda içerikteki "Mekandasın" hapı bar kopyasıyla birlikte görünebilir (çıkarım: hap içerikte ≈78–106, bar kopyası 70'te belirir). Kart içeriği/şerit çapraz solması 170→100 (C). Bitiş: `shut` + yarıçap çevirmesi JS'ten geldiği için son piksellerde sıçrama OLASI (koddan doğrulanamaz). D FARK (`CollapsingCard`, `ScrollFade`, `BarArrive` azaltta durmuyor). | `venue.tsx:195-224,235,250-275`; `VenueHead.tsx:83-95,153`; `CollapsingCard.tsx:91-101,129,139-184`; `aura.ts:132-139`; `grup-04.md` 23 #1,#3-#5 | Var: 23 `MekanKaydir` (şerit üst 170, yükseklik 76; kod 104/72) | `BAR_NAME`'i iki ayrık aralığa böl (`VenueHead.tsx:153`: cüzdan 70–85, ad 85–100) ve `Seg`'i `StickyField` ile bara al; `shut`'ı paylaşılan değerden türet |
| 25 | Mekan · Akış (aynı rota, görünüm) | Aynı üst; `Seg` içerikte, kimlik anahtarı gizli (`feed`); `FeedView` kayar. | B FARK (28 #1: anahtar bantta). C: aynı 70–100 çapraz. D FARK. | `venue.tsx:235,250`; `VenueHead.tsx:98`; `grup-05.md` 28 #1-#2 | Var: 28 `MekanAkisKaydir` | Aynı |

### Aile 7: Üst sabit, gövde kendi içinde kayar (özel)

| # | Ekran | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu | Önerilen en küçük değişiklik |
| --- | --- | --- | --- | --- | --- | --- |
| 26 | Tüm aksesuarlar (`profile/accessories`) | Üst satır (geri, başlık + sayı, arama düğmesi) ve çip şeridi sabit; `GridWindow` altta kayar. Çip bölüme göre değişir (`onSection`). Ortak `ScrollScreen` yok: bar/bant/yapışma hareketi yok. | UYUYOR (pano de başlık sabit; yalnız çip seçimi değişiyor). D: kaydırmaya bağlı hareket yok. | `accessories.tsx:215-345`; `grup-01.md` 03h | Var: 03h `TumAksesuarlarKaydir` (davranış UYUYOR) | Yok |
| 27 | Masa · oyun seç / oyla (`room/[id]`) | Baş (bar + masa kartı) sabit; yalnız istek/not/oyunlar altında kayar (`ScrollView`). Kart katlanmaz, çıkmaz. | FARK (pano): 137/138 kartı kaydırınca tamamen çıkarıp yalnız bar bırakıyor; kod kartı hep gösteriyor (29 Ekim sahip kararı). A/C: hareket yok, çift yok. | `room/[id].tsx:594,435-470`; `TableScene.tsx:28-33`; `grup-13.md` 137 #1; `grup-14.md` 138 #2 | Var: 137 `MasaOyunSec`, 138 `MasaOyunOyla` | Proje sahibine tek soru: 29 Ekim kararı mı, pano mu geçerli |

### Aile 8: Sohbet akışları (`ChatList`)

Ortak: üst çubuk (`ChatTopBar`) sabit, bant ve küçülen başlık yok; liste en yeniden yukarı çizilir (`FlatList` ters, `ChatScreen.tsx:1051`), kendi `scrollY` ref'i (`:750`), ortak `ScrollScreen` değeri yok (sekme çubuğu küçülmesi yok). Başlık hareketi yok.

| # | Ekran | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu | Önerilen en küçük değişiklik |
| --- | --- | --- | --- | --- | --- | --- |
| 28 | DM sohbeti (`messages/[threadId]`) | Yukarıdaki. | A–C uygulanmaz, UYUYOR. D: yalnız mesaj girişi hareketi (`useReduceMotion` `ChatBubble`'da var). | `messages/[threadId].tsx:468,538` | PANOSU YOK (02, 88 kaydırılmamış; hükmü boş) | Yok |
| 29 | Masa sohbeti (`room-chat/[id]`) | Aynı. | UYUYOR. | `room-chat/[id].tsx:77,85` | PANOSU YOK | Yok |
| 30 | Mekan sohbeti (`venue-chat/index`) | Aynı. | UYUYOR. | `venue-chat/index.tsx:363,435` | PANOSU YOK | Yok |
| 31 | Semt sohbeti (`district/room`) | Aynı. | UYUYOR. | `district/room.tsx:471,513` | PANOSU YOK | Yok |

### Aile 9: Alt sayfalar (`Sheet`, `RouteSheet`, `SheetCard`)

Ortak: tutamak ve başlık sabit, gövde `Animated.ScrollView` (`SheetCard.tsx:124-142`): yerel kaydırma çubuğu yok, uçlarda Android solan kenar (`fadingEdgeLength`), aşağı çekince kapanır; başlık hareketi yok. Açılış/kapanış `useSheetMotion` azaltmayı okur, gövde kaydırması hareketi içermez. Hüküm hepsi için aynı: A/B/C uygulanmaz, UYUYOR; pano de başlığı sabit çiziyor (95: başlık barı + uzun liste kaydırılmış).

| # | Ekran | Kayan ne | Kanıt | Kaydırılmış panosu |
| --- | --- | --- | --- | --- |
| 32 | Bildirimler (`notifications`, `RouteSheet`) | liste | `notifications.tsx:106-181` | PANOSU YOK (04, 110) |
| 33 | Odadakiler (`district/People`, `Sheet`) | liste | `People.tsx:47-50` | Var: 95 `OdaUzun`; "Sen" satırı da kayar; UYUYOR (grup-10 95 #1 "doğrulanamadı: Sen satırının da kaydığı") |
| 34 | Masadakiler (`RoomPeople`) | liste | `RoomPeople.tsx` | PANOSU YOK (35 tek durum) |
| 35 | Geçmiş masa sayfası (Aktiviteler, `Sheet`) | içerik | `activities.tsx` Sheet | PANOSU YOK (09) |
| 36 | Check-in (`checkin/index`, `RouteSheet`) | içerik, altbilgi sabit | `checkin/index.tsx:136-207` | PANOSU YOK |
| 37 | Nokta seç (`checkin/spot`) | liste | `checkin/spot.tsx:22-43` | PANOSU YOK (123) |
| 38 | Nokta değiştir (`spot`) | liste | `spot.tsx:46-76` | PANOSU YOK |
| 39 | Masa kur, Lobiye aç, Masa görseli (`CreateTableSheet`, `OpenLobbySheet`, `TableIconSheet`) | içerik, altbilgi sabit | `src/features/rooms/` | PANOSU YOK (21, 32a-c) |
| 40 | Hediye: Oranlar, Set kartı | içerik | `OddsSheet.tsx`, `SetCard.tsx` | PANOSU YOK (62c) |
| 41 | Öteki sayfalar: FriendPicker (Mesajlar), Keşfet iki sayfa, Rapor, Fotoğraf, Signum/Sprengja yardımcıları, geçmiş "Diğer", profil ⋮ menüleri (`SenderProfileScreen`), mekan/semt sohbeti kişi sayfaları | içerik | `grep "<Sheet"` (19 dosya) | PANOSU YOK |

### Aile 10: Sabit sayfalar (taşarsa kayar; ortak `ScrollScreen` değeri yok)

Ortak: `Screen` varsayılanı `FixedBody` (`Screen.tsx:353-392`): kaydırma yalnız içerik sığmayınca, sekme/bant/başlık hareketi yok, üst satır sabit tek. A/B/C uygulanmaz: UYUYOR.

| # | Ekran | Kanıt | Kaydırılmış panosu |
| --- | --- | --- | --- |
| 42 | Hediye paketleri (`gifts`) | `gifts.tsx:66,217` | PANOSU YOK (62-62e) |
| 43 | Masa bitti (`TableEnd`) | `TableEnd.tsx:76` | PANOSU YOK (64, 64a) |
| 44 | Semt sayfaları: gate, locate, open, closed, ended, outside (6 rota) | `district/parts.tsx:702,894` | PANOSU YOK (12, 13, 100-102) |
| 45 | Gönderen profili: `venue-chat/[messageId]`, `district/[messageId]`, `district/person/[ref]`, `venue-feed/profile/[postId]` (4 rota, 1 ekran) | `SenderProfileScreen.tsx:116-125` | PANOSU YOK (57); yüz küçülmesi ve bar yüzü YOK (kapak sayfası değil) |
| 46 | Akışa yaz (`venue-feed/compose`) | `compose.tsx:91` | PANOSU YOK (29, 30) |
| 47 | Kayıt adımları: phone, otp, agree, birth, consents, extras, gender, name (8 rota) | `SignupStep.tsx:142-149` | PANOSU YOK (47-56) |
| 48 | Açılış (`welcome`) | `welcome.tsx:144-160` (düz `ScrollView`) | PANOSU YOK (47) |
| 49 | Güncelleme gerekli, rota hatası | `UpdateRequired.tsx:16`, `RouteError.tsx:24` | PANOSU YOK (65) |
| 50 | Geliştirici: `design-preview`, `gorsel` (üretimde yok / test) | `design-preview.tsx:19` | Kapsam dışı |

### Aile 11: Oyun ekranları

| # | Ekran | Şu an ne oluyor | Ölçütle farkı | Kanıt | Kaydırılmış panosu |
| --- | --- | --- | --- | --- | --- |
| 51 | Oyun lobisi (`GameLobby`) | Üst satır sabit; gövde `ScrollView` (taşarsa). | UYUYOR. | `GameLobby.tsx:89-100` | PANOSU YOK (39-46) |
| 52 | Oyun sahneleri (`StageFit`, 7 oyun) | Süre/skor üstte, eylemler altta sabit; yalnız orta kayar. | UYUYOR (CLAUDE.md kuralı). | `GameStage.tsx:25-40` | PANOSU YOK (139-152) |

## Özet sayımları

- 52 tablo satırı; `app/` altında düzen dosyaları hariç 61 rota dosyası var (kayıt, semt, gönderen profili ve yasal rotaları satırlarda birleşiyor; sekme hâlleri ve sayfa içi sheet'ler ayrı satır).
- Aile başına satır: 1 sekme kökü 5 · 2 alt sayfa 2 · 3 satır içi bar 9 · 4 `sayfa` çift başlık 4 · 5 kapak/uçuş 3 · 6 Mekan 2 · 7 özel 2 · 8 sohbet 4 · 9 alt sayfalar 10 · 10 sabit sayfalar 9 · 11 oyun 2.
- Panosu olan kaydırılmış hâl (11 pano): Aktiviteler Geçmiş (08b), Keşfet (10c), Mesajlar (01b), Arkadaşlar (06b), Profilim (03c), Tüm aksesuarlar (03h), Mekan Masalar (23), Mekan Akış (28), Odadakiler (95), Masa oyun seç (137), oyla (138).

## Sonuç

### (i) Ortak parçada bir kez düzeltilince kaç ekran düzelir

- Kaydırmaya bağlı hareketlerde "hareketi azalt" (D): `TopBar.tsx` (`LargeTitle`, `BarBand`, `BarArrive`), `StickyField.tsx` (`StickyFade`, `shrink`), `Cover.tsx`, `ProfileMotion.tsx`, `CollapsingCard.tsx`: tek `useReduceMotion` okuması ve değerleri son hâle sabitlemekle 16 satır düzelir: 1, 2, 3, 4, 5, 6, 7 (bant/yapışma), 17–20 (`sayfa`), 21–23 (kapak/uçuş), 24, 25 (Mekan). Yapışmanın kendisi (pin) işlevdir; azaltta durması yalnız solma/ölçek/belirme içindir.
- `sayfa` çapraz solma (C/A): `AURA.topBar.pageTitleFade` `[5,50]` → bar `[40,70]` çakışmasını sıfırlamak (`aura.ts:123`; `skeleton.test.ts:70` eşitliği güncellenir) 4 ekranı (17–20) düzeltir. Daha kalıcı yol: `inline` (mevcut parça) vermek; panonun 3 ekranı (Hesap, Düzenle, Yasal) satır içi çizdiği için kod panoya da yaklaşır.
- `VenueHead.tsx:153` cüzdan ↔ `BarName` aralığını ayırmak: 2 ekran (24, 25).
- `venueDetail.ts:33` ve `person.ts:20` birer sabit: 1 + 1 ekran (23, 22).
- Tek bir `Screen` değişikliği: `bar='buyukBaslik'`ı Aktiviteler ve Mesajlar'a bağlamak (altyapı var, üretimde kullanılmıyor) bar başlığını 4 satıra (1, 2, 4, 5) getirir; ancak bar başlığı 70–100 ile büyük başlık 5–100 çakışır (C), aralıkları ayırmadan getirilirse yeni bir çift başlık yaratır.
- `StickyField` içine yapışan parça ekleme (çip, `Seg`): Keşfet (3), Mekan (24, 25), Mesajlar'da aramayı çıkarma (4, 5): her biri ekrana özgü ama aynı parça.
- `CollapsingCard` `shut`/yarıçap çevirmesi (son piksel sıçraması): 1 ekran (24) ve sohbet şeridi.

### (ii) Ekrana özgü kalanlar

1. Profilim: `snapToOffsets` ara konumu yasaklıyor (A) ve bitiş geometrisi (36 sol / 30 merkez) farkı (`profile/index.tsx:139`, `profileCover.ts:130-134`): ürün kararı + sabitler.
2. Mesajlar/Arkadaşlar/Arşiv/Aktiviteler: bar başlığı ve düğmelerin barda tek kez durması ekrana göre `top` yapısını yeniden kurmayı ister (Mesajlar düğmeleri bar `trailing`'ine).
3. Keşfet: çipler + Semte git şeridi (şerit kodda yok, yeni parça) (10c #1-#2).
4. Mekan: `Seg`'in bara alınması ve kart şerit yüksekliği/üst konum sayıları (104/72 → pano 170/76; 23 #3-#6).
5. Masa (27): kart katlanması proje sahibinin kararıyla çelişiyor (29 Ekim ↔ pano 17 Kasım).
6. Odadakiler (33): "Sen" satırının listeyle kaydığı doğrulanmadı.

### (iii) Koddan doğrulanamayanlar (telefonda bakılacak)

- B: yapışan alanın pin anındaki sıçrama. Şüpheli: `translateY` değeri `y`'den UI iş parçacığında bir kare sonra uygulanıyorsa hızlı kaydırmada pin çizgisinde kayma (`StickyField.tsx:73-79`); `stickyAt` ölçümü 700 ms sonra yeniden yapılıyor ve sekme/içerik boyu değişince yeniden ölçülüyor (`:61-72`): kaydırılmışken sekme değişince pin kayabilir (Aktiviteler Etkinlikler ↔ Geçmiş, Mesajlar Sohbetler ↔ İstekler).
- Mekan: `CollapsingCard`'ın `height` animasyonu (düzen) ve `shut` çevirmesinin görünürlüğü; kart içeriği ↔ şerit çapraz solmasının hızlı kaydırmada görünmesi.
- D: hızlı kaydırmada "doğal ivme": yerel kaydırma olduğu için kodda sorun görünmüyor; `snapToOffsets` (Profilim) bırakma hızıyla nasıl oturuyor, görülmedi.
- Satır içi ve sabit üstlü liste sayfalarında (Arkadaşlar, Arşiv, Engellenenler, Sessize alınanlar, Masana davet et, Yanıtlar, Yasal) satırların üst satırın altında sert kenarda kesilmesi: bant yok; `docs/denetim/pano-fark-2026-11.md` PF-63/73 aynı şeyi `sayfa` için kaydetmişti. Bu ekranlar için görülmedi.
- C'de "içerikteki büyük başlığın bar satırına girmesi": konum hesabı koddan çıkarım, çift görünümün gerçek yoğunluğu ve okunurluğu görülmedi.
- 61 rota dosyasının yapısı `Screen/ScrollBody/ChatList/Sheet` aramasıyla ve ortak sarmalayıcıların (`SignupStep`, `HeroPage`, `SettingsPage`, `SenderProfileScreen`, `RouteSheet`) okunmasıyla belirlendi; her rota dosyası satır satır okunmadı (kayıt adımları, semt sayfaları, oyun sahneleri ve sheet içerikleri sarmalayıcıdan çıkarıldı).
