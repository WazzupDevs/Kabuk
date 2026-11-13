# Akıcılık denetimi (13 Kasım 2026, yalnız teşhis)

Hedef: Nothing Phone (1) ve iPhone'larda her ekranın, kaydırmanın ve geçişin 120 karede (en kötü 60) çalışması. Bu belge kod değiştirmez; bulguları, kanıtı ve düzeltme sırasını verir. Kural: hiçbir öneri efekt kaldırmaz ya da azaltmaz; her çözüm aynı görüntüyü daha ucuz çizer.

Kanıt türleri:

- **Kod:** dosya ve satır, bu taramada okundu (`apps/mobile/` altında).
- **Kayıt:** proje sahibinin 12–13 Kasım ekran kayıtlarında kare zamanlarından ölçüldü (`docs/denetim/pano-fark-2026-11.md`, PF numaraları). Kayıtların hangi telefonda ve hangi derlemede alındığı bilinmiyor; kesin sayı için bölüm 4'teki ölçüm gerekir.
- **Ölçülecek:** kodda işaret var, etkisi telefonda ölçülmeden bilinmez.

İkinci tarama (aynı gün): ilk taramanın açık bıraktığı alanlar okundu (oyun ekranları, Realtime, React Compiler, görsellerin kalanı, SVG, döngüler, depolar ve sorgular). Yeni bulgular A-21–A-38; A-01, A-03 ve A-17'de düzeltme var.

Önceki denetim `docs/denetim/performans-2026-11.md` (B1–B36, 9 Kasım) hâlâ geçerli olan maddeleriyle birlikte okunmalı; burada yinelenen yerde B numarası verildi.

## Düzeltme durumu

Düzeltmelerin etkisi bölüm 4.2'de ölçüldü (yalnız 2, 5 ve 6. adımlar); her biri koddaki nedeni giderir. Hiçbir efekt kaldırılmadı ya da azaltılmadı.

| Bulgu | Durum               | Not                                                                                                                                                                                                                        |
| ----- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-02  | Düzeltildi (#610)   | On iki oyun görseli 1184 x 1579'a indi (kartın en büyük boyu 296 dp, dört katı).                                                                                                                                           |
| A-12  | Düzeltildi (#611)   | Klavyeyi yalnız altlığı olan ekran dinliyor. Ölçüm (4.2): DM'de klavye takılması %13,1 → %8,9.                                                                                                                             |
| A-29  | Düzeltildi (#611)   | Davet sayfasının saati yalnız sayfa açıkken ve gönderilmiş davet sürerken çalışıyor.                                                                                                                                       |
| A-36  | Düzeltildi (#611)   | Semt sahnesinin iki döngüsü ve "yazıyor" balonu ortak durdurma koşuluna bağlandı.                                                                                                                                          |
| A-21  | Düzeltildi (#612)   | On bir üretim işlevinden onu derleniyor. Kalan: `LaunchCurtain` (açılışta bir kez çizilir; açılış bekçisine dokunulmadı). Ölçüm (4.2): düzenleyicide etkisi görünmedi; parça değişimi ve zar aynı aralıkta (A-01 kalıyor). |
| A-25  | Kısmen (#613, #615) | Kibrit, Krot, Kaupholl ve Signum'da saniyeyi yalnız süre şeridi okuyor. Kalan: Kinshi (sayaç düğme yazısına ve geri sayıma da giriyor).                                                                                    |
| A-24  | Düzeltildi (#613)   | Oy sayıları oyun ekrandayken okunmuyor.                                                                                                                                                                                    |
| A-32  | Düzeltildi (#614)   | Afiş ve masa simgesi çözülürken gösterildiği boya iniyor. Çözülen boy telefonda doğrulanacak.                                                                                                                              |
| A-33  | Kısmen (#614)       | Sahne resimleri bellek önbelleğinde. Kalan: sonraki evrenin önceden yüklenmesi.                                                                                                                                            |
| A-28  | Kısmen (#614)       | Keşfet ve Mesajlar'da liste gecikmeli değeri izliyor. Kalan: profil düzenleme, kartların ezberi. Ölçüm (4.2): Mesajlar aramasında takılma %16,2 → %13,2; Keşfet'te yöntem farkı yüzünden karşılaştırılamadı.               |
| A-16  | Geri çekildi        | Kalemin zamanlayıcıyla dönmesi bilerek: `loopGuard.test.ts` kendi kendine dönen döngüde `withRepeat`'i yasaklıyor.                                                                                                         |
| A-22  | Ölçüm bekliyor      | Kanalı sekme odağına bağlamak her sekme gelişinde 30 katılım demek; hangisinin ucuz olduğu ölçülmeden değiştirilmedi.                                                                                                      |

İlk ölçüm (bölüm 4.1, Galaxy S23) bu düzeltmelerden önce alındı; sıradaki iş bölüm 5'te: önce 2, 5 ve 6. adımın yeniden ölçümü, sonra büyük kapsülün çizimi (A-01, A-40).

## 1. Özet: en çok etki eden bulgular

Ölçüme göre sıralı (bölüm 4.1; Galaxy S23, 120 Hz). Ölçülmeyenler sonda.

1. Kapsül düzenleyici: zara basınca en uzun kare 1,4–5 sn, parça değişiminde 300–550 ms; ağır görünüş dururken bile kareler 20 ms (bütçe 8,3); bellek 1,0–1,1 GB. Düzenleyicinin derlenmesi (A-21) #612 ile geldi, yeniden ölçülecek (A-01, A-40).
2. DM: hızlı kaydırmada karelerin %63'ü 1,5 bütçeden uzun (p50 14 ms); sohbete girince bellek yaklaşık 400'den 640–710 MB'a çıkıyor ve koşudan koşuya büyüyor (A-06, A-31, A-03, A-41).
3. Aramada yazma: Mesajlar'da takılma %16, Keşfet'te %3 (yalnız 2 mekan ve 3 sohbetle); aynı ekranlarda kaydırma %1 (A-28; #614 ile düzeltildi, yeniden ölçülecek).
4. Klavye açılıp kapanırken DM'de takılma %13 (A-12; #611 ile düzeltildi, yeniden ölçülecek).
5. Alt sayfa: Ayarlar açılıp kapanırken yavaş çizim komutu koşu başına 72–93, takılma %4 (A-04); dört ekranın zemini 4 kat ve üstü çiziliyor (A-42).
6. Kendi profilin ilk açılışında tek kare 93–109 ms; öbür sekmelerde en uzun kare 27 ms'nin altında (A-05, A-14).
7. Keşfet dururken saniyede yaklaşık 69 kare çiziliyor: pil ve ısı (A-39).
8. Açılış: Keşfet 2,6–3,1 sn'de geliyor; açılış perdesi boyunca takılma %3 (A-09, A-38).
9. Ölçülmeyenler: oyun görselleri ve oyun ekranları (A-02, A-23–A-25, A-32, A-33; hesapta check-in yok), iPhone'da 120 Hz (A-10), gölgelerin payı (A-11). Harita geçişinde kare düşmüyor (p95 7 ms); parça parça beliriş görüntüyle bakılmalı (A-08).

## 2. Bulgu tablosu

"İş": küçük (bir gün), orta (birkaç gün), büyük (bir hafta ve üstü). "Yayın": OTA ya da native build.

| No   | Alan                        | Bulgu                                                                                                                                                                                                                                                                                                                                       | Kanıt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Etkilenen ekranlar                                                            | Etki                                                                                 | Önerilen çözüm (efekt aynı kalır)                                                                                                                                                                                                                     | İş                  | Yayın               |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------- |
| A-01 | 3.4 Skia, 3.7 SVG           | Büyük kapsülde ağır görünüş ilk çizimde ana iş parçacığını durduruyor: parça değişiminde 150–540 ms, rastgele görünüşte 0,8 sn boyunca saniyede 10–15 kare.                                                                                                                                                                                 | Kayıt: PF-88, PF-89. Kod: `src/components/FxSkia.tsx:142`, `:207` (iki `Canvas`), çizim metni `src/theme/capsuleSkia.ts`, `capsuleCanvas.ts`. Düzeltme: şerit kare başına JS'e dönmüyor (`src/motion/SnapStrip.tsx:103-114` yalnız pencere değişince ve sürükleme başı ile sonunda); maliyet çizimin kendisi ve A-21. Ölçüm (13 Kasım, S23): Doğrulandı. Parça değişiminde en uzun kare 300–550 ms, p99 150–200 ms, yavaş bitmap yüklemesi koşu başına 12–13. Zarda en uzun kare 1,4–5 sn, p99 0,6–1,35 sn; basıştan sonraki ilk karede UI iş parçacığı 0,5–1,2 sn, sonraki her kare RenderThread'de 100–260 ms. Bellek 1,0–1,1 GB (Native Heap 435–490 MB). Bölüm 4.1, adım 6. | Kapsül düzenleyici; aynı çizimi kullanan profil bileti                        | Kare düşmesi (en ağır), ısı                                                          | Görünüşün çizimini bir kez `Picture` olarak kaydet ve görünüş anahtarıyla önbellekte tut; komşu parçaların resmini kaydırma durunca arka planda hazırla; düzenleyiciyi derleyicinin derleyebileceği hâle getir (A-21). Hareket katmanları ayrı kalır. | Büyük               | OTA                 |
| A-02 | 3.6 Görseller               | Oyun görselleri 1776 x 2368: bellekte her biri 16,8 MB. Bir oyunun beş altı görseli 40–57 MB. Telefonun ekranı 1080 piksel geniş: tam ekran çizilse bile 2,7 kat fazla piksel çözülüyor.                                                                                                                                                    | Kod: `assets/games/krot/*` (5 dosya, 57 MB), `signum` (10 dosya, 55 MB), `kaupholl` (40 MB), `sprengja` (40 MB), `kibrit` (34 MB); `src/features/games/*/…Art.ts` `require` ile yüklüyor. Ölçü Pillow ile okundu.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Bütün yeni oyun ekranları, masa ekranındaki oyun kartları                     | Bellek, ilk açılışta çözme süresi (kare boşluğu), bundle boyutu                      | Kaynakları ekranda en büyük gösterildiği boyun 3 katına indir (çoğu için 1080 geniş yeter); küçük gösterilen yerlere ayrı küçük kopya üret (`pnpm icons` benzeri betik). Görüntü aynı kalır: fazla pikseller zaten ekrana sığmıyor.                   | Orta                | OTA                 |
| A-03 | 3.6 Görseller               | Sohbet duvar kâğıtları 1290 x 2796 (14,4 MB bellek, dosya 2,3–2,5 MB); açılış perdesinin dokuz dokusu 1170 x 2532 (her biri 11,8 MB).                                                                                                                                                                                                       | Kod: `src/components/ChatWallpaper.tsx:17-26`; düzeltme: duvar kâğıdı çözülürken ekran boyuna indiriliyor (`:63`, `:133` `resizeMethod`), bellekteki boy ekran kadar; kalan maliyet dosya boyu ve çözme süresi; `assets/launch/*-doku-*.webp` (9 dosya), `src/features/launch/LaunchCurtain.tsx:47`. Önceki denetim B22. Ölçüm (13 Kasım, S23): Destekliyor: DM'ye girince toplam bellek yaklaşık 400 MB'tan 640–710 MB'a çıkıyor (Graphics 141 MB); duvar kâğıdının payı ayrıca ölçülmedi. Adım 5.                                                                                                                                                                             | DM, mekan ve masa sohbeti; açılış                                             | Bellek, sohbet açılışında çözme, açılış süresi                                       | Duvar kâğıdını ekran boyuna (1080 x 2400) indir ve tekrar eden deseni karo olarak çiz; açılış dokularını perde bitince bellekten bırak ve ekran boyunda sakla.                                                                                        | Küçük               | OTA                 |
| A-04 | 3.8 Navigasyon              | Alt sayfa `Modal` ile yeni pencere açıyor ve içeriğini açılış anında kuruyor: ilk kare 50–75 ms (Şehir ve semt, oyun sayfası), 177 ms (Ayarlar) gecikiyor.                                                                                                                                                                                  | Kayıt: PF-19, PF-70. Kod: `src/motion/Sheet.tsx` (`<Modal transparent …>`, içerik `mounted` olunca kuruluyor); rota sayfaları `transparentModal` (`app/(app)/_layout.tsx:17-21`). Ölçüm (13 Kasım, S23): Doğrulandı (iki sayfada). Ayarlar açılıp kapanırken takılma %4,3, gfxinfo jank %10,4, yavaş çizim komutu koşu başına 72–93; Bildirimler'de takılma %1,3, en uzun kare 22 ms. Adım 7.                                                                                                                                                                                                                                                                                   | Bütün alt sayfalar (15'ten fazla)                                             | Açılışta takılma hissi                                                               | Sık açılan sayfaların içeriğini ekran boşken önceden kur (görünmez, dokunulmaz), açılışta yalnız hareketi başlat; pencere yerine aynı ağaçta üst katman kullan. Hareket ve bulanıklık aynı kalır.                                                     | Orta                | OTA                 |
| A-05 | 3.2 JS ve UI                | İlk kaydırmada ve ilk geçişte kare boşluğu: Keşfet 90 ms, kendi profil 116 ve 248 ms, Hediye paketleri 63 ms, alt sayfalara geçiş 45–80 ms. Sonraki kaydırmalar akıcı.                                                                                                                                                                      | Kayıt: PF-22, PF-65, PF-32, PF-76. Kod: her ekran parçası ayrı `Reveal` içinde (`src/components/Screen.tsx` → `cascade`), kaydırmaya bağlı stiller ilk karede kuruluyor (`src/motion/TopBar.tsx`, `StickyField.tsx`, `ProfileMotion.tsx`). Ölçüm (13 Kasım, S23): Kısmen doğrulandı: kendi profilin ilk açılışında tek kare 93–109 ms (iki koşu); Keşfet'in ilk kaydırmasında boşluk yok (en uzun 18 ms, hesapta 2 mekan). Adım 2 ve 4.                                                                                                                                                                                                                                         | Bütün sekme ekranları, kapaklı ekranlar                                       | İlk dokunuşta takılma                                                                | Hareketli stilleri ekran oturduktan hemen sonra, kullanıcı dokunmadan bir kez çalıştır (ısıtma karesi); geçişle gelen ekranın ağır içeriğini geçiş bitince kur, yerini aynı boyda tut.                                                                | Orta                | OTA                 |
| A-06 | 3.3 Listeler                | Sohbet akışı ters çevrilmiş `FlatList`: satırlar geri dönüştürülmüyor, her yeni satır baştan kuruluyor. Pencere ayarları var (`initialNumToRender`, `maxToRenderPerBatch`, `windowSize`), `getItemLayout` yok (satır boyu değişken).                                                                                                        | Kod: `src/components/ChatScreen.tsx:1051-1068`; satırlar `memo` (`:162`, `src/features/chat/ChatPanel.tsx:366`). Önceki denetim B16–B19. Kayıtta hızlı kaydırma akıcıydı (DM, 188 karede boşluk yok): bugün küçük sohbetlerde sorun görünmüyor. Ölçüm (13 Kasım, S23): Destekliyor: DM'de hızlı kaydırmada kare p50 14 ms, p95 20 ms; karelerin %63'ü 1,5 bütçeden uzun. A-31'den ayrılamadı. Adım 5.                                                                                                                                                                                                                                                                           | DM, masa, mekan ve semt sohbeti                                               | Uzun sohbette kare düşmesi, bellek                                                   | Geri dönüşümlü listeye geç (FlashList v2 ya da LegendList; ikisi de MIT). Sona tutunma ve ilk okunmamıştan açılış mantığı korunur. Önce 500 mesajlı sohbette ölç (bölüm 4): fark yoksa öncelik düşer.                                                 | Büyük               | Native (bağımlılık) |
| A-07 | 3.3 Listeler                | Mesajlar gelen kutusu, Arkadaşlar, İstekler, bildirimler ve oyun sayfasının kişi listesi `ScrollView` içinde `map` ile çiziliyor: bütün satırlar aynı anda kuruluyor.                                                                                                                                                                       | Kod: `app/(app)/(tabs)/messages/index.tsx:180`, `:293`; `src/features/friends/RequestList.tsx:124`; oyun sayfası `app/(app)/(tabs)/activities.tsx` (kişi satırları). Önceki denetim B28.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Mesajlar, Arkadaşlar, bildirimler, Aktiviteler → oyun sayfası                 | Açılış gecikmesi ve bellek, liste uzadıkça                                           | 30 satırı geçebilen listeleri sanallaştır (aynı geri dönüşümlü liste). Kısa kalan listelere dokunma.                                                                                                                                                  | Orta                | OTA                 |
| A-08 | 3.8 Navigasyon              | Keşfet'te harita her geçişte kaldırılıp yeniden kuruluyor: zemin, pinler, pin resimleri ve karolar 0,4–0,5 sn içinde dört adımda geliyor; geçişin başında 80–90 ms donma var.                                                                                                                                                               | Kayıt: PF-08, PF-16, PF-17. Kod: `app/(app)/(tabs)/explore/index.tsx` → `showMap ? <ExploreMap/> : <ListBody/>` (biri varken öbürü ağaçta yok). Ölçüm (13 Kasım, S23): Kare düşüşü yok: beş gidiş dönüşte takılma %0,9, p95 7 ms, en uzun 20 ms. Parça parça beliriş kare sayısıyla ölçülmez; görüntüyle bakılmalı. Adım 3.                                                                                                                                                                                                                                                                                                                                                     | Keşfet                                                                        | Geçişte donma ve boş kare                                                            | Haritayı ilk açılıştan sonra ağaçta tut (görünmez, dokunulmaz, çizimi duraklatılmış); geçişte yalnız görünürlüğü değiştir. Liste de aynı şekilde yerinde kalır.                                                                                       | Orta                | OTA                 |
| A-09 | 3.9 Açılış                  | Paketleyicide ertelenmiş `require` (inline requires) ve ertelenmiş rota ayarı yok: açılışta bütün ekran modülleri değerlendiriliyor. Stil katmanı (NativeWind) her JSX öğesinde çalışma anında araya giriyor.                                                                                                                               | Kod: `metro.config.js` (yalnız `withNativeWind`, `inlineRequires` yok); `babel.config.js` (`jsxImportSource: 'nativewind'`); `app.json` içinde `asyncRoutes` yok. Önceki denetim B29, B30. Etkisi ölçülecek. Ölçüm (13 Kasım, S23): Kısmen: soğuk açılışta sistem ilk kareyi 587 ms'de çiziyor, Keşfet 2,6–3,1 sn'de geliyor (ekran görüntüsüyle, ±0,5 sn). Modül değerlendirmesinin payı ölçülemedi: Perfetto izi alınmadı. Adım 1.                                                                                                                                                                                                                                            | Soğuk açılış, her ekranın ilk çizimi                                          | Açılış süresi, her render'da küçük ek maliyet                                        | `inlineRequires` aç; oyun ekranlarını, haritayı ve kapsül düzenleyiciyi ilk kullanımda yükle. NativeWind için önce ölç: sıcak yollarda (liste satırı, sohbet balonu) sınıf adı yerine hazır stil nesnesi kullan.                                      | Orta                | OTA                 |
| A-10 | 3.12 Yenileme hızı          | iOS'ta `CADisableMinimumFrameDurationOnPhone` yok: iPhone Pro'larda uygulama 60 karede çalışır. Android tarafı tamam: en yüksek yenileme hızı seçiliyor.                                                                                                                                                                                    | Kod: `app.config.ts:52-78` (`withHighRefreshRate`, `preferredDisplayModeId`); `app.json` ve `app.config.ts` içinde iOS anahtarı yok. `docs/PROGRESS.md` bunu "bir sonraki native build" diye not etmiş.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | iPhone'da her şey                                                             | 120 yerine 60 kare                                                                   | `ios.infoPlist`'e anahtarı ekle.                                                                                                                                                                                                                      | Küçük               | Native              |
| A-11 | 3.4 Gölgeler                | 95 yerde gölge doğrudan `boxShadow` ile veriliyor; önbelleğe alınan yol (`shadowParts`, dokuz parça resim) 42 yerde. Ham `boxShadow`'un bulanık dış gölgesi görünüm her yeniden çizildiğinde yeniden hesaplanır.                                                                                                                            | Kod: `grep boxShadow:` 95 satır (ör. `app/(app)/gifts.tsx:371`, `app/(app)/(tabs)/profile/index.tsx:250`, `:387`, `src/components/game/*`, `src/components/Segmented.tsx:106`); önbellekli yol `src/components/NativeShadow.tsx:62`. Hangi ekranda kaç kare tuttuğu ölçülecek. Ölçüm (13 Kasım, S23): Ayrılamadı: aşırı çizim görüntüsünde dört ekranın (Keşfet, Profil, Mesajlar, DM) bütün zemini 4 kat ve üstü (A-42); gölgelerin payı bu görüntüden okunamıyor. Adım 9.                                                                                                                                                                                                     | Profil, oyun ekranları, Hediye paketleri, kapsül galerisi                     | Kare düşmesi (kaydırma ve hareket sırasında), aşırı çizim                            | Bulanık dış gölgelerin hepsini `shadowParts` yoluna taşı (aynı gölge, bir kez üretilmiş resimden); hareket eden kutularda gölgeyi kutuyla aynı katmanda tut.                                                                                          | Orta                | OTA                 |
| A-12 | 3.1 Yeniden çizim           | Her `Screen` klavye durumuna abone ve kendi `KeyboardAvoidingView`'ını taşıyor; sekmeler dondurulmuyor (bilerek), yani arka plandaki dört sekme klavye açılıp kapanırken yeniden çizilebiliyor.                                                                                                                                             | Kod: `src/components/Screen.tsx` (`useKeyboardState((s) => s.isVisible)`, `<KeyboardAvoidingView …>`); sekmeler canlı `app/(app)/(tabs)/_layout.tsx:39-45`. Önceki denetim B21. Kaç render ettiği ölçülecek. Ölçüm (13 Kasım, S23): Kısmen: DM'de klavye açılıp kapanırken takılma %13,1, p95 15 ms; payın abonelikten mi klavye hareketinden mi geldiği ayrılamadı. Adım 5.                                                                                                                                                                                                                                                                                                    | Klavyeli her ekran, arka plandaki sekmeler                                    | Klavye açılışında kare düşmesi                                                       | Klavye aboneliğini yalnız altlığı (`footer`) olan ekrana indir; odakta olmayan ekranın aboneliğini beklet (var olan `tabActivity` ile).                                                                                                               | Küçük               | OTA                 |
| A-13 | 3.1 Sorgular                | Üç yerde bütün sorgular birden yenileniyor: aşağı çekme, bağlantının geri gelmesi ve mekandan ayrılma.                                                                                                                                                                                                                                      | Kod: `src/components/Screen.tsx:128` (`refetchQueries({ type: 'active' })`), `src/components/ConnectionBanner.tsx:35`, `app/(app)/(tabs)/venue.tsx:71` (`invalidateQueries()`). Önceki denetim B11. Varsayılan `staleTime` artık ayarlı (`src/lib/queryClient.ts`).                                                                                                                                                                                                                                                                                                                                                                                                             | Yenilenebilen bütün ekranlar                                                  | İstek seli, ardından toplu yeniden çizim                                             | Her ekran yalnız kendi sorgu anahtarlarını yenilesin; canlı sekmelerin sorguları odaklanınca yenilensin.                                                                                                                                              | Küçük               | OTA                 |
| A-14 | 3.8 Navigasyon              | Sekme değişiminin ilk karesinde ekran boş (zemin de yok); içerik yaklaşık 200 ms'de sırayla geliyor. Geliş bütün ekranın opaklığını oynatıyor.                                                                                                                                                                                              | Kayıt: PF-31. Kod: `src/components/TabBar.tsx:128-160` (ekranın tamamında `opacity` ve `translateY`, 240 ms); önceki denetim B13, B26. Ölçüm (13 Kasım, S23): Doğrulandı yalnız Profil'de (ilk açılış 93–109 ms; ikinci açılış 21–24 ms). Öbür sekmelerde en uzun kare 9–27 ms. Adım 4.                                                                                                                                                                                                                                                                                                                                                                                         | Bütün sekme geçişleri                                                         | Boş kare, tam ekran ek katman                                                        | Zemini sekmelerin dışında, tek ve sabit çiz; gelişte yalnız içerik katmanını oynat (aynı hareket, daha küçük katman).                                                                                                                                 | Orta                | OTA                 |
| A-15 | 3.1 Sayaçlar                | Saniyelik sayaç dört yerde bileşenin tamamını saniyede bir çiziyor. Paylaşılan saat (`useNow`) sekme arka plandayken duruyor; bu iyi. Sorun, saniyelik okuyan bileşenin büyüklüğü.                                                                                                                                                          | Kod: `app/(app)/district/room.tsx:730`, `app/(app)/district/closed.tsx:20`, `src/features/rooms/InviteSheet.tsx:40`, `app/(app)/notifications.tsx:180` (davet satırı); saat `src/lib/useNow.ts:24`. Öbür `setInterval`'lar: bağlantı bandı, Sprengja, keşfet yoklaması, kalem döngüsü, araç.                                                                                                                                                                                                                                                                                                                                                                                    | Semt odası, davet sayfası, bildirimlerdeki davet                              | Saniyede bir gereksiz çizim                                                          | Saniyelik değeri yalnız sayacı gösteren küçük bileşen okusun; ebeveyn dakikalık saatle yetinsin.                                                                                                                                                      | Küçük               | OTA                 |
| A-16 | 3.5 Döngüler                | Bir döngü JS zamanlayıcısıyla tetikleniyor (kalem). Öbür döngüler odak, alt sayfa ve arka plan koşuluyla duruyor; bu tamam.                                                                                                                                                                                                                 | Kod: `src/features/profile/LivingLook.tsx:189` (`setInterval` içinden `withSequence`); koşul `src/components/Loader.tsx:34-46` (`useLoopActive`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Kendi profil (bilet)                                                          | Küçük: JS iş parçacığını periyodik uyandırma                                         | Döngüyü `withRepeat` ve `withDelay` ile UI iş parçacığına taşı.                                                                                                                                                                                       | Küçük               | OTA                 |
| A-17 | 3.1 React Compiler          | Derleyicinin atladıkları derlemede raporlanmıyor. Bu taramada derleyici elle çalıştırıldı: liste A-21'de.                                                                                                                                                                                                                                   | Kod: `app.json:111` (`reactCompiler: true`); atlama günlüğü yok. Önceki denetim B34.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Bilinmiyor                                                                    | Atlanan bileşen her render'da yeniden çizer                                          | Derleme sırasında derleyicinin günlüğünü dosyaya yazdır (`logger` seçeneği) ve atlanan bileşenleri listele; liste CI'da artmasın.                                                                                                                     | Küçük               | OTA                 |
| A-18 | 3.10 Realtime               | Masa sohbetinde her mesaj ve tepki son 100 mesajı yeniden okutuyor (önceki denetim B16); DM'de tepki bütün satırların eşitliğini bozuyor (B17). Bu taramada yeniden doğrulanmadı.                                                                                                                                                           | Önceki denetim B16, B17, B18. Kanal kurulumu tek yerde: `src/lib/realtime.ts:39`; dört çağıran (`useMessages`, `useBroadcast`, `rooms/queries`, `useDmTyping`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Masa sohbeti, DM                                                              | Mesaj başına istek ve toplu çizim                                                    | Gelen olayı önbelleğe tek satır olarak işle (ekle ya da değiştir); satır özelliklerini sabit tut.                                                                                                                                                     | Orta                | OTA                 |
| A-19 | 3.2 JS ve UI                | Sohbet listesinin kaydırma dinleyicisi JS'te çalışıyor (her kaydırma olayında). Yalnız durum değişince `setState` çağırıyor; maliyeti olay başına bir JS çağrısı.                                                                                                                                                                           | Kod: `src/components/ChatScreen.tsx:985-993`, `:429-437`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Sohbetler                                                                     | Küçük; JS meşgulken aşağı inme oku geç gelir                                         | Dinleyiciyi UI iş parçacığına al, JS'e yalnız "sonda mı" değişince haber ver.                                                                                                                                                                         | Küçük               | OTA                 |
| A-20 | 3.6 Görseller               | Masa kartı görselleri 110 dosya, hepsi çözülürse 331 MB; Masa kur'daki şerit ve lobi aynı anda birkaçını gösteriyor. Genişlikleri (720, 800) ekrana uygun; sorun kaç tanesinin aynı anda bellekte kaldığı.                                                                                                                                  | Kod: `assets/table-cards/uzun` (55 dosya, 247 MB), `yatay` (55 dosya, 84 MB). Ölçülecek: Masa kur açıkken bellek. Ölçüm (13 Kasım, S23): Ölçülemedi: hesapta check-in yok, Masa kur açılmadı.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Mekan, Masa kur, lobi                                                         | Bellek                                                                               | Küçük gösterilen yerlerde (şeritteki 44'lük simge) küçük kopya kullan; büyük görsel yalnız seçili kartta çözülsün.                                                                                                                                    | Küçük               | OTA                 |
| A-21 | 3.1 React Compiler          | Derleyici 1003 işlevi derliyor, 15 işlevi atlıyor (11'i üretimde; liste tablonun altında). En ağırı kapsül düzenleyicinin ana bileşeni `Editor`: her seçimde bütün düzenleyici ezbersiz yeniden çiziliyor. `RowList`, `PullScroll`, check-in konum ekranı ve Masa bitti de atlananlarda.                                                    | Ölçüm: `babel-plugin-react-compiler` 1.0.0, Babel 7.29.7, `logger` ile `app/` ve `src/` (494 dosya) üzerinde çalıştırıldı. `app/(app)/(tabs)/profile/capsule.tsx:103` (sebep satırı `:243`), `src/aura/kit.tsx:1091`, `src/components/PullScroll.tsx:61`.                                                                                                                                                                                                                                                                                                                                                                                                                       | Kapsül düzenleyici; `RowList` kullanan bütün listeler; yenilenebilen ekranlar | Kare düşmesi (A-01'i büyütür), gereksiz çizim                                        | Her atlamanın sebebini kaldır (tablodaki "sebep" sütunu: çoğu tek satırlık yeniden yazım); derleyici günlüğünü CI'da tut, sayı artmasın (A-17).                                                                                                       | Küçük               | OTA                 |
| A-22 | 3.10 Realtime               | Mesajlar'da ilk 30 satırın her biri kendi `dm_typing:` kanalını açıyor; kanal sekme odağına bağlı değil, sekme bir kez açılınca masa ve oyun ekranları üstteyken de açık kalıyor.                                                                                                                                                           | Kod: `app/(app)/(tabs)/messages/index.tsx:295`, `:306`, `:376`, `:430`; `src/features/friends/useDmTyping.ts:19`. Kanal kotasına etkisi ölçülecek. Ölçüm (13 Kasım, S23): Ölçülemedi: kanal sayısı adb'den okunmuyor; hesapta 3 sohbet var.                                                                                                                                                                                                                                                                                                                                                                                                                                     | Mesajlar; arkasından bütün uygulama                                           | Açılışta 30 kanal katılımı ve 30 yetki sorgusu; bağlantı yükü                        | Kanalı sekme odaktayken ve yalnız ekranda görünen satırlar için aç; "yazıyor" görüntüsü aynı kalır.                                                                                                                                                   | Küçük               | OTA                 |
| A-23 | 3.10 Realtime, 3.14 Oyun    | Masa ekranı yalnız okunmamış sayısı için sohbeti oyun boyunca dinliyor; her mesaj ve tepki son 100 mesajı baştan okutuyor. Gönderen kendi mesajını iki kez okuyor.                                                                                                                                                                          | Kod: `app/(app)/room/[id].tsx:91`, `src/features/chat/useMessages.ts:25-48` (`invalidateQueries`), `src/features/chat/ChatPanel.tsx:119`. Önceki denetim B16'nın açık kalan yarısı.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Masa ekranı, bütün oyunlar                                                    | 12 kişilik masada mesaj başına 12 kez 100 satır okuma; oyun sırasında JS meşguliyeti | Yeni mesajda yalnız son mesajdan sonrasını oku ve ekle (mekan sohbetindeki `readVenueChatNewer` kalıbı, `src/features/venueChat/queries.ts:71`); tam okuma tepki ve silmede kalsın.                                                                   | Orta                | OTA                 |
| A-24 | 3.14 Oyun                   | Her oyun adımında masa ekranı iki sorguyu yeniden okuyor: güncel masa ve oy sayıları. Oy sayıları yalnız lobi görünümünde kullanılıyor ama oyun açıkken de etkin.                                                                                                                                                                           | Kod: `src/features/rooms/queries.ts:105-135`, `app/(app)/room/[id].tsx:121` (`useTableVotes(id, open)`), kullanım `:486`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Oyun içi masa ekranı                                                          | Adım başına telefon başına 2 gereksiz istek ve ardından çizim                        | Oy sorgusunu yalnız oyun yokken etkin tut; masa satırı zaten olayla geliyor, yeniden okuma yalnız ilgili alan değişince.                                                                                                                              | Küçük               | OTA                 |
| A-25 | 3.14 Oyun, 3.1 Sayaçlar     | Beş oyunda saniyelik sayaç aşama ekranının en üstünde okunuyor: süreli aşamanın bütün ekranı (yazma, oylama, kavanoz…) saniyede bir yeniden çiziliyor. Vampir doğru: sayacı yalnız kadranın yaprağı okuyor.                                                                                                                                 | Kod: `src/features/games/kibrit/KibritGame.tsx:396`, `signum/SignumGame.tsx:423`, `kaupholl/KauphollGame.tsx:492`, `sahtekar/KrotGame.tsx:399`, `kinshi/KinshiGame.tsx:388`, `:727`; sayacı gösteren yaprak `riso/RisoParts.tsx:179`; doğru örnek `vampir/Dial.tsx:20`. Derleyicinin ne kadarını önbellekten verdiği ölçülecek. Ölçüm (13 Kasım, S23): Ölçülemedi: masa ve oyun açılmadı (adım 8).                                                                                                                                                                                                                                                                              | Kibrit, Signum, Kaupholl, Krot, Kinshi                                        | Aşama boyunca saniyede bir tam ekran çizim; yazarken takılma                         | Sayacı yalnız süre şeridinin yaprağı okusun; üst bileşen yalnız bitiş anını (`endsAt`) aşağı versin.                                                                                                                                                  | Orta                | OTA                 |
| A-26 | 3.3 Listeler, 3.10 Realtime | Semt sohbetinde satırlar ezberli değil ve her yayın bütün sayfayı yeniden okutuyor; her tepki yüklü eski sayfaların hepsini de okutuyor. Mekan ve masa sohbetinde bu çözülmüş.                                                                                                                                                              | Kod: `app/(app)/district/room.tsx:318-345`, `:373-375`, `:115-119`; `src/features/district/queries.ts:64-72`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Semt odası                                                                    | Mesaj başına bütün hücrelerin yeniden çizimi ve tam sayfa okuma                      | Mekan sohbetinin satırını ve artımlı okumasını kullan (`VenueMessageRow`, `sameRowProps`, `readVenueChatNewer`).                                                                                                                                      | Orta                | OTA                 |
| A-27 | 3.1 Yeniden çizim           | DM'de bir tepki bütün görünür satırları iki kez yeniden çiziyor (önceki denetim B17'nin DM yarısı); karşı taraf yazarken DM ekranı 3 saniyede bir yeniden çiziliyor.                                                                                                                                                                        | Kod: `src/features/chat/messageExtras.ts:64-67`, `app/(app)/(tabs)/messages/[threadId].tsx:380`, `:553`, `:110`; `src/features/friends/useDmTyping.ts:32`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | DM                                                                            | Tepkide ve "yazıyor" sırasında gereksiz çizim                                        | Satıra yalnız kendi mesajının bekleyen tepkisini ver (masa sohbetindeki `pend` gibi); "yazıyor" durumu yalnız başlarken ve biterken değişsin.                                                                                                         | Küçük               | OTA                 |
| A-28 | 3.13 Metin ve giriş         | Keşfet ve Mesajlar aramasında yazılan metin ekranın en üstünde tutuluyor: her harf bütün listeyi (Keşfet'te yaklaşık 50 kart) yeniden çiziyor; kartlar ezberli değil, gruplama her çizimde yeniden yapılıyor. Profil düzenlemede ad ve biyografi de böyle (küçük ekran). Sohbet giriş alanı doğru (`DraftComposer` kendi durumunu tutuyor). | Kod: `app/(app)/(tabs)/explore/index.tsx:94`, `:672-680`, `:784`; `app/(app)/(tabs)/messages/index.tsx:46`, `:113`, `:293`, `:315`; `app/(app)/(tabs)/profile/edit.tsx:253-254`. Harf başına süre ölçülecek. Ölçüm (13 Kasım, S23): Doğrulandı: Keşfet aramasında yazarken takılma %3,1, gfxinfo jank %7, en uzun 29 ms (yalnız 2 mekanla); Mesajlar aramasında takılma %16,2, p95 15 ms (3 satırla). Aynı listede kaydırma takılması %1,3. Adım 2 ve 5.                                                                                                                                                                                                                        | Keşfet, Mesajlar, profil düzenleme                                            | Yazarken harf gecikmesi                                                              | Arama metnini arama alanında tut, listeye gecikmeli değer ver (`useDeferredValue`); kartı ezberle, gruplamayı bir kez hesapla.                                                                                                                        | Küçük               | OTA                 |
| A-29 | 3.1 Sayaçlar                | Davet sayfası kapalıyken de saniyede bir çalışıyor: bileşen masa sahibinde hep bağlı ve arkadaş satırlarını her saniye yeniden kuruyor (A-15'e ek).                                                                                                                                                                                         | Kod: `src/features/rooms/InviteSheet.tsx:40`, `:134`; bağlandığı yerler `src/features/rooms/TableCard.tsx:258`, `app/(app)/room/[id].tsx:579`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Mekan (masa kartı), masa ekranı; yalnız masa sahibi                           | Masa sürdükçe saniyede bir gereksiz çizim                                            | Saniyelik saati yalnız sayfa açıkken ve gönderilmiş davet varken çalıştır; geri sayımı satırdaki halka okusun.                                                                                                                                        | Küçük               | OTA                 |
| A-30 | 3.2 JS ve UI                | Keşfet'te her kart ayrı bir geliş hareketi taşıyor ve sekme her açıldığında ekran dışındaki kartlar dahil hepsi (yaklaşık 50) hareketini yeniden kuruyor. A-05'teki ilk kaydırma boşluğunun kod tarafı.                                                                                                                                     | Kod: `src/aura/Reveal.tsx:56-62`; `app/(app)/(tabs)/explore/index.tsx:672`. Süresi ölçülecek. Ölçüm (13 Kasım, S23): Hâlâ ölçülemedi: hesapta 2 mekan var, 50 kartlık liste kurulamadı.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Keşfet                                                                        | Sekme açılışında JS işi                                                              | Hareketi yalnız ilk ekrana sığan kartlarda oynat; görünmeyen kart zaten görünmüyor, görüntü aynı kalır.                                                                                                                                               | Küçük               | OTA                 |
| A-31 | 3.2 JS ve UI                | Sohbette her kaydırma olayında bütün gün başlıkları dolaşılıyor ve görünen satır değiştikçe liste bileşeni yeniden çiziliyor (A-19'a ek).                                                                                                                                                                                                   | Kod: `src/components/ChatScreen.tsx:997`, `:903-922`. Uzun sohbette etkisi ölçülecek. Ölçüm (13 Kasım, S23): Kısmen: DM kaydırmasındaki kare süresi (p50 14 ms) A-06'dan ayrılamadı. Adım 5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | DM, masa, mekan ve semt sohbeti                                               | Hızlı kaydırmada JS işi                                                              | Gün başlığı hesabını yalnız gün çizgisi değişince çalıştır; yüzen tarih yalnız gün değişince güncellensin.                                                                                                                                            | Küçük               | OTA                 |
| A-32 | 3.6 Görseller               | Oyun afişleri 1232 x 896, yaklaşık 173 x 112 dp'lik kartta gösteriliyor (gerekenin yaklaşık 5 katı piksel): yedi afiş 31 MB, gereken yaklaşık 5 MB. Masa simgeleri 256 x 256; Masa kur'daki ızgara 55 simgeyi birden çözüyor (14 MB, gereken 6 MB).                                                                                         | Kod: `src/features/rooms/PosterCard.tsx:19-34`, `:117` (`resizeMethod` yok); `src/features/rooms/TableIcon.tsx:45`, `tableIconImages.ts:8`. Ölçü Pillow ile okundu; çözülen boy telefonda ölçülecek. Ölçüm (13 Kasım, S23): Ölçülemedi: Masa kur açılmadı (adım 8).                                                                                                                                                                                                                                                                                                                                                                                                             | Masa kur, oyun seçimi, lobi                                                   | Bellek (yaklaşık 34 MB fazla)                                                        | Çözerken gösterildiği boya indir (`resizeMethod="resize"`, duvar kâğıdındaki gibi) ya da küçük kopya üret.                                                                                                                                            | Küçük               | OTA                 |
| A-33 | 3.6 Görseller               | Vampir sahnesinin oda ve masa resimleri 1080 x 2283 (her biri yaklaşık 10 MB); evre geçişinde dört tam ekran resim aynı anda bağlı, sonraki evrenin resmi önceden hazırlanmıyor ve bellekte paylaşılmıyor (`cachePolicy` varsayılanı).                                                                                                      | Kod: `src/features/games/vampir/RoundTable.tsx:111`, `:187-205`, `:219`, `:229`. Geçişteki boşluk ölçülecek. Ölçüm (13 Kasım, S23): Ölçülemedi: Vampir açılmadı (adım 8).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Vampir Köylü                                                                  | Geçişte 40–50 MB tepe, evre değişiminde çözme gecikmesi                              | `cachePolicy="memory-disk"`; evre başlarken sonraki evrenin resimlerini önceden yükle.                                                                                                                                                                | Küçük               | OTA                 |
| A-34 | 3.6 Görseller               | Profil fotoğrafının tek boyu var (512 x 512, en çok 300 KB): 36–48 dp'lik avatar da aynı dosyayı indiriyor. Bellekte görünüm boyuna iniyor; maliyet ağ ve disk.                                                                                                                                                                             | Kod: `src/components/PhotoImage.tsx:19-26`, `supabase/functions/_shared/photos.ts:67` (dönüşümsüz imzalı adres). İlk açılıştaki indirme ölçülecek. Ölçüm (13 Kasım, S23): Ölçülemedi ayrıca: avatarların payı bellekten ayrılmıyor.                                                                                                                                                                                                                                                                                                                                                                                                                                             | Lobi, sohbetler, masa listeleri                                               | İlk açılışta kişi başına 40–300 KB indirme; avatarların geç gelmesi                  | Yüklemede küçük bir kopya (128 px) daha kaydet, listeler onu çeksin. Sunucu değişikliği ve depolama maliyeti var: ayrı karar.                                                                                                                         | Büyük               | OTA + sunucu        |
| A-35 | 3.7 SVG                     | Üç SVG önbellek adı (`nativeID` "svgc:") taşımıyor: sohbetteki gönderildi ve okundu tiki (her kendi mesajında), profil kapağı ile biletteki yarı ton desen. Kaplı sohbet balonu mesaj başına üç gradyan katmanı ve köşe SVG'leri çiziyor.                                                                                                   | Kod: `src/components/ChatBubble.tsx:1354`, `:943-951`; `src/features/profile/ProfileCover.tsx:138-158`, `:172-190`; `src/features/profile/IdentityTicket.tsx:84-120`. Kare etkisi ölçülecek. Ölçüm (13 Kasım, S23): Ölçülemedi ayrıca.                                                                                                                                                                                                                                                                                                                                                                                                                                          | Sohbetler, profil                                                             | Satır başına ek çizim; kaydırmada kare düşmesi (kaplı balon çoksa)                   | Tike ve desene `svgKey` ile ad ver (tek resim paylaşılır); kaplı balonu tek yol olarak çiz ya da bir kez resme çevir.                                                                                                                                 | Küçük (balon: orta) | OTA                 |
| A-36 | 3.5 Döngüler                | Semt sahnesindeki döngüler (kilit, damlalar, üç nokta) ve sohbet balonundaki bir döngü ortak durdurma koşuluna (`useLoopActive`) bağlı değil: üstüne başka ekran ya da alt sayfa gelince de dönüyor. UI iş parçacığında çalışıyorlar.                                                                                                       | Kod: `src/features/district/parts.tsx:322`, `:339`, `:438`; `src/components/ChatBubble.tsx:1387`; koşulun doğru örneği `src/motion/Float.tsx:39-50`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Semt Geçit ve oda                                                             | Görünmeyen ekranda boşuna kare üretimi, pil                                          | Döngüyü `useLoopActive` ile başlat ve durdur.                                                                                                                                                                                                         | Küçük               | OTA                 |
| A-37 | 3.14 Oyun, 3.10 Realtime    | Signum'da takım arkadaşının her işareti görünümü yeniden okutuyor; ilk abonelik sürmekte olan ilk okumayı iptal edip yeniden başlatıyor. Sprengja'da fitil yanarken her telefon yokluyor (tutan 1 sn, sıradaki 3 sn, öbürleri 10 sn), uygulama arka plandayken de.                                                                          | Kod: `src/features/games/signum/SignumGame.tsx:293`, `src/features/rooms/useBroadcast.ts:21`; `src/features/games/sprengja/SprengjaGame.tsx:271-282`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Signum, Sprengja                                                              | İstek sayısı, ardından çizim                                                         | Signum'da art arda gelen yayınları kısa aralıkta birleştir; Sprengja'da yoklamayı arka planda durdur.                                                                                                                                                 | Küçük               | OTA                 |
| A-38 | 3.9 Açılış                  | Yazı tipleri çalışma anında yükleniyor; derlemeye gömülmüyor.                                                                                                                                                                                                                                                                               | Kod: `src/theme/ThemeProvider.tsx:126-136` (`loadAsync`); `app.json`'da `expo-font` eklentisi yok. İlk ekrana etkisi ölçülecek. Ölçüm (13 Kasım, S23): Ölçülemedi ayrıca: açılışın payı Perfetto'suz ayrılmıyor (A-09).                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Soğuk açılış                                                                  | Açılış süresi                                                                        | Yazı tiplerini `expo-font` eklentisiyle derlemeye göm.                                                                                                                                                                                                | Küçük               | Native              |
| A-39 | 3.5 Döngüler                | Keşfet dururken ekran hiç dinlenmiyor: dokunulmadan 10 saniyede 688 kare (saniyede yaklaşık 69) çiziliyor.                                                                                                                                                                                                                                  | Ölçüm (13 Kasım, S23): `bosta-kesfet`, takılma %0,7, p95 7 ms. Hangi döngünün çizdiği ayrılmadı; başlıktaki kanki en olası (çıkarım).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Keşfet                                                                        | Pil ve ısı (kare düşmüyor)                                                           | Döngü aynı kalır; yalnız döngünün kendi küçük alanı yeniden çizilsin (ayrı katman, sabit boy), ekranın geri kalanı geçersizlenmesin. Önce Perfetto ile hangi görünümün çizildiği bulunur.                                                             | Küçük               | OTA                 |
| A-40 | 3.4 Skia, 3.7 SVG           | Kapsül düzenleyicide ağır görünüş (zarla gelen efsanevi set) dururken de her kare bütçenin üstünde: kare p50 20 ms, karelerin hepsi 1,5 bütçeden uzun; 10 saniyede 119 yavaş çizim komutu.                                                                                                                                                  | Ölçüm (13 Kasım, S23): `bosta-susle`, 1074 kare / 10 sn, gfxinfo jank %13, p95 25 ms, en uzun 40 ms. Maliyet RenderThread'de (A-01'in tek zar ölçümünde her kare 100–260 ms).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Kapsül düzenleyici; aynı çizimi kullanan profil bileti                        | Kare düşmesi, ısı                                                                    | A-01'in önerisi: görünüşün durağan katmanlarını bir kez resim olarak kaydedip her karede yalnız hareketli katmanları çizmek; hareket aynı kalır.                                                                                                      | Büyük (A-01 ile)    | OTA                 |
| A-41 | 3.8 Bellek                  | DM'de bellek koşudan koşuya büyüyor: aynı sohbette üç kaydırma koşusunda toplam PSS 642 → 690 → 712 MB, Native Heap 267 → 290 → 306 MB.                                                                                                                                                                                                     | Ölçüm (13 Kasım, S23): adım 5, `adim-5b-1..3`. Sohbetten çıkınca geri inip inmediği ölçülmedi.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | DM                                                                            | Bellek; ucuz telefonda arka planda kapanma                                           | Önce sızıntı mı önbellek mi ayrılır: sohbetten çıkıp 30 sn sonra `meminfo`, sonra Android Studio bellek profili. Önbellekse sınırı cihaz belleğine göre konur.                                                                                        | Küçük (teşhis)      | OTA                 |
| A-42 | 3.3 Çizim                   | Aşırı çizim: Keşfet, Profil, Mesajlar ve DM'de ekranın bütün zemini 4 kat ve üstü çiziliyor (kırmızı); kartlar ve balonlar bunun da üstünde.                                                                                                                                                                                                | Ölçüm (13 Kasım, S23): `debug.hwui.overdraw show` görüntüleri (adım 9). Önceki denetimin B26'sı (sekme zemini dört kez tam ekran).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Bütün sekmeler, DM                                                            | GPU doluluk oranı, ısı; ucuz telefonda kare düşmesi                                  | Görünen zemin tek katmanda çizilsin: üst üste binen tam ekran zeminlerden (pencere, gezgin, ekran, sahne) alttakiler saydam yapılır, aura bulutu tek resim olarak bir kez çizilir. Görünüş aynı kalır.                                                | Orta                | OTA                 |

**A-21'in listesi (derleyicinin atladığı işlevler):**

| Dosya ve satır                                | İşlev                         | Sebep                                              |
| --------------------------------------------- | ----------------------------- | -------------------------------------------------- |
| `app/(app)/(tabs)/profile/capsule.tsx:103`    | `Editor` (kapsül düzenleyici) | İç işlevde yakalanan değişkene `++` (`:243`)       |
| `src/aura/kit.tsx:1091`                       | `RowList`                     | Varsayılan parametre değeri bir işlem (`:1094`)    |
| `src/components/game/GameToast.tsx:25`        | `GameToast`                   | Varsayılan parametre değeri bir işlem              |
| `src/features/district/DistrictCard.tsx:318`  | `CardSkeleton`                | Aynı tür ifade (`:326`)                            |
| `src/components/PullScroll.tsx:61`            | `PullScroll`                  | Çizim sırasında `ref` okunuyor (`:130`)            |
| `app/(app)/checkin/index.tsx:41`              | `LocationScreen`              | Hook değer olarak aktarılıyor (`:149`)             |
| `src/features/chat/fresh.ts:12`               | `useFreshLine`                | Hook değer olarak aktarılıyor (`:15`)              |
| `src/features/rooms/TableEnd.tsx:54`          | `TableEnd` (Masa bitti)       | Nesnede koşullu hesaplanan anahtar (`:126`)        |
| `src/features/launch/LaunchCurtain.tsx:124`   | `LaunchCurtain`               | `try` içinde `throw` (`:172`)                      |
| `src/features/games/vampir/VampirPlay.tsx:74` | `useView`                     | Bir ESLint hook kuralı satırda kapatılmış (`:87`)  |
| `app/(app)/district/locate.tsx:32`            | `DistrictLocateScreen`        | Bir ESLint hook kuralı satırda kapatılmış (`:108`) |

Kalan dördü Atölye ve ölçüm aracında (`src/features/design/`). Derleyici burada NativeWind dönüşümü olmadan çalıştırıldı; gerçek derlemede liste bir iki işlev oynayabilir.

### Taranıp sorun bulunmayanlar

Brifteki bazı şüpheler bugünkü kodda yok; yeniden bakılmasın diye yazıldı.

| Konu                                       | Durum                                                                                                                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useNativeDriver: false`                   | Uygulama kodunda yok; `src/theme/loopGuard.test.ts:68` bunu yasaklıyor.                                                                                                          |
| `console.log`                              | `app/` ve `src/` altında sıfır çağrı.                                                                                                                                            |
| Sentry örnekleme                           | `tracesSampleRate: 0`, profil ve replay yok, ekran görüntüsü ve görünüm ağacı kapalı (`src/lib/errorReporting.ts:11-20`).                                                        |
| Canlı bulanıklık                           | Ekran içinde kapalı (`src/theme/glass.ts:19` `TAB_BAR_GLASS = false`). Alt sayfa ve menü, ekranın bir kez alınmış kopyasını bulanıklaştırıyor (`SCRIM_GLASS`, `SHEET_GLASS`).    |
| Profil fotoğraflarının yeniden indirilmesi | Önbellek anahtarı imzalı adres değil dosya yolu (`src/components/PhotoImage.tsx:20`, `photoCacheKey`); `memory-disk`.                                                            |
| Sayfa geçişleri                            | Native: `animation: 'ios_from_right'` (`src/lib/stackOptions.ts:18`).                                                                                                            |
| Klavye                                     | `react-native-keyboard-controller` kullanılıyor (native, kare kare).                                                                                                             |
| Yazıyor bildirimi                          | Tek kanal, yük boş (`src/features/friends/useDmTyping.ts`).                                                                                                                      |
| Sekmelerin kurulumu                        | Tembel (ilk basışta kurulur), sonra canlı kalır; arka plandaki sekme çizilmez ve döngüleri durur (`app/(app)/(tabs)/_layout.tsx:39-45`).                                         |
| Android 120 Hz                             | Seçiliyor (`app.config.ts:52-78`).                                                                                                                                               |
| Zemin (aura)                               | Tek, opak, önceden çizilmiş resim (`src/aura/AuraBackground.tsx`).                                                                                                               |
| Kök sağlayıcılarda her çizimde yeni nesne  | `Provider value={{…}}` kalıbı yok.                                                                                                                                               |
| Zustand                                    | 18 depo, 52 kullanım: seçicisiz çağrı ve nesne döndüren seçici yok.                                                                                                              |
| TanStack Query                             | Varsayılan `staleTime` 20 sn; `refetchInterval` yalnız oda yoklaması (kanal kapalıyken 4 sn, açıkken 30 sn) ve görünür Keşfet (60 sn); toplu yenileme yalnız A-13'teki üç yerde. |
| `runOnJS`                                  | 13 dosyanın hiçbiri kare başına JS'e dönmüyor.                                                                                                                                   |
| Satırlarda yerleşim animasyonu             | `entering` yalnız en yeni mesajda (`src/components/ChatScreen.tsx:193`).                                                                                                         |
| Skia                                       | `Canvas` yalnız kapsül düzenleyicide; liste satırında yok.                                                                                                                       |
| Oyun hareketleri                           | Native sürücüyle ya da worklet'te; oyun durumu masa satırıyla geliyor ve önbelleğe yapısal paylaşımla yazılıyor.                                                                 |
| Varlık (presence)                          | İstemcide kullanılmıyor. "Yazıyor" gönderimi 3 sn'de bir.                                                                                                                        |
| Kanal temizliği                            | Kanallar tüketici sayımıyla kapanıyor (`src/lib/realtimeChannels.ts`); açık kalan abonelik bulunmadı (A-22 dışında).                                                             |
| Önceki denetim B18                         | Kapanmış: satır yalnız kendi vurgusunu dinliyor (`src/components/ChatScreen.tsx:122-150`). B16 ve B17'nin kalanı A-23 ve A-27.                                                   |
| Öbür görseller                             | Semt, mekan, etkinlik, hediye, kanki ve simge görselleri gösterildikleri boyun en çok 1,3 katı.                                                                                  |
| Sıkıştırma ve küçültme                     | Release'te R8 ve kaynak küçültme açık (`app.json:103-104`).                                                                                                                      |

## 3. Modern uygulamalardan farklar

| Onlar ne yapıyor                                                                             | Biz ne yapıyoruz                                                           | Bulgu      |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- |
| Telegram: sohbet satırları geri dönüştürülür; satır görünümü yeniden kullanılır.             | Her satır baştan kurulur.                                                  | A-06       |
| Telegram: görsel, gösterileceği boyda çözülür ve o boyla önbelleğe girer.                    | Oyun görselleri ve duvar kâğıtları ekrandan büyük çözülür.                 | A-02, A-03 |
| Telegram: alt sayfa aynı pencerede bir katmandır; içeriği açılmadan hazırdır.                | Her açılışta yeni pencere ve o an kurulan içerik.                          | A-04       |
| Telegram: açılış animasyonu sürerken sohbetin güncellemeleri bekletilir.                     | DM'de uygulanmış (`messages/[threadId].tsx:162`); öbür ekranlarda yok.     | A-05       |
| iOS sistem uygulamaları: sekmeler ve harita bellekte kalır, görünürlük değişir.              | Keşfet'in haritası her geçişte yeniden kurulur.                            | A-08       |
| iOS sistem uygulamaları: ağır çizim (avatar, sembol) bir kez üretilip resim olarak saklanır. | Küçük kapsüller için var (SVG yaması); büyük kapsülde her görünüş yeniden. | A-01       |
| Instagram: ilk kare için gerekmeyen kod sonradan yüklenir.                                   | Bütün ekran modülleri açılışta değerlendirilir.                            | A-09       |
| Hepsi: iPhone'da 120 Hz açıktır.                                                             | Anahtar yok.                                                               | A-10       |
| Telegram: gölge ve yuvarlak köşe bir kez üretilmiş resimden çizilir.                         | 42 yerde böyle, 95 yerde ham gölge.                                        | A-11       |
| Telegram: yeni mesaj listeye tek satır olarak eklenir.                                       | Masa ve semt sohbeti her mesajda sayfayı yeniden okur.                     | A-23, A-26 |
| Telegram: sayaç yalnız kendi görünümünü yeniden çizer.                                       | Beş oyunda sayaç bütün aşama ekranını çizer.                               | A-25       |
| Telegram: profil fotoğrafının küçük ve büyük kopyası ayrı tutulur; liste küçüğü çeker.       | Tek boy (512).                                                             | A-34       |
| Telegram: "yazıyor" yalnız açık sohbette ve görünen satırda dinlenir.                        | 30 satırın kanalı sürekli açık.                                            | A-22       |

## 4. Ölçüm planı (telefonda, proje sahibi)

Ölçüm development build'de yapılmaz: dev modu ve JS hata ayıklayıcı sonucu bozar. Test APK'sı (EAS `preview`, release ayarları) kullanılır. Emülatörde ölçüm yapılmaz.

Hazırlık bir kez:

1. Telefonda Ayarlar → Geliştirici seçenekleri → "HWUI oluşturma profili" → "Ekranda çubuk olarak" seç.
2. Aynı yerde "GPU aşırı çizimini göster" seçeneğini yalnız 9. adımda aç, sonra kapat.
3. Test APK'sını aç; Profil → Ayarlar → "Çizim ölçümünü aç" ile aracı aç ve "Başlat"a bas.

Her adımda ekran kaydı al (çubuklar görünsün), kaydı sohbete at. Yeşil çizgi 16 ms'dir; çubuk çizgiyi aşıyorsa o kare düşmüştür.

| Adım | Ekran ve yapılacak                                                                                                                                | Hangi bulgu            | Neye bakılacak                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------- |
| 1    | Uygulamayı tamamen kapat, aç. İlk ekran gelene kadar kaydet.                                                                                      | A-09, A-03             | Açılıştan ilk ekrana süre                                           |
| 2    | Keşfet: ilk kez yavaşça aşağı kaydır, sonra üç kez hızlı kaydır. Aramaya hızlıca on harf yaz.                                                     | A-05, A-28, A-30       | İlk kaydırmadaki ve yazarkenki yüksek çubuklar                      |
| 3    | Keşfet: liste ve harita arasında beş kez geç.                                                                                                     | A-08                   | Geçişteki donma ve boş kare                                         |
| 4    | Sekmeler arasında sırayla iki tur dolaş.                                                                                                          | A-14, A-12             | Geçişin ilk kareleri                                                |
| 5    | Mesajlar: arama alanına hızlıca on harf yaz. Sonra en uzun sohbeti aç, en başa kadar hızla kaydır, geri in. Klavyeyi aç ve kapat.                 | A-06, A-12, A-28, A-31 | Yazarken, kaydırırken ve klavye sırasında çubuklar                  |
| 6    | Profil → "Kapsülünü süsle": Baş şeridinde on parçayı sırayla seç, sonra zara beş kez bas.                                                         | A-01                   | Parça değişimindeki donma                                           |
| 7    | Beş farklı alt sayfayı aç ve kapat (Ayarlar, Bildirimler, Şehir ve semt, oyun sayfası, Masa kur).                                                 | A-04                   | Açılışın ilk karesi                                                 |
| 8    | Bir masa kur (Masa kur'da simge ızgarasını ve oyun afişlerini kaydır), Kibrit başlat (bot ekle), yazma aşamasında süre akarken yaz, oylamaya geç. | A-02, A-25, A-32       | Oyun açılırken donma; süre akarken çubuklar; araçtaki bellek değeri |
| 9    | "GPU aşırı çizimini göster" açıkken şu ekranların görüntüsünü al: Keşfet, Profil, Mekan, DM, masa ekranı. Sonra kapat.                            | A-11, A-14             | Kırmızı alanlar (dört kat ve üstü çizim)                            |
| 10   | iPhone varsa: aynı 2, 4 ve 6. adımların ekran kaydı.                                                                                              | A-10                   | Hareketin 60 karede kalıp kalmadığı                                 |

## 4.1 Ölçüm sonuçları (13 Kasım 2026, Galaxy S23 SM-S911B, Android 16, 0.11.0 build 21)

- **Telefon:** 120 Hz (kare bütçesi 8,3 ms), güç tasarrufu kapalı, animatör ölçeği 1x, Rahatsız Etmeyin açık. Pil %22'den %38'e, USB'den şarj olurken ölçüldü (protokol %50 üstü ve şarjsız ister); pil sıcaklığı 34–39 °C. Kurulu derleme release (hata ayıklanabilir değil); hangi OTA'da olduğu okunmadı. Ölçüm 18.15–18.41'de (UTC+3) alındı: #611–#615 (A-12, A-21, A-24, A-25, A-28, A-32, A-33) ondan sonra birleşti, bu sayılar o düzeltmelerin öncesidir; #610 (A-02) ölçülen ekranlara girmiyor. Ana test telefonu Nothing Phone (1) bu turda ölçülmedi.
- **Hesap:** test hesabı; Keşfet'te 2 mekan, Mesajlar'da 3 sohbet, check-in yok. Liste uzunluğuna bağlı bulgular (A-28, A-30, A-07) bu yüzden alttan ölçüldü.
- **Yöntem:** her adım 3 koşu, ortanca (adım 1: 5 koşu). Dokunuş ve kaydırmalar `adb shell input` ile aynı koordinat ve süreyle; her komuttan önce öndeki pencere denetlendi. Sayılar `dumpsys gfxinfo` (koşu başında `reset`) ve `dumpsys meminfo`'dan. "Takılma": 1,5 bütçeden (12,5 ms) uzun karelerin oranı, gfxinfo histogramından. "gfxinfo jank": Android'in kendi `Janky frames` oranı. Bellek adım sonundadır: toplam PSS / Graphics / Native Heap (MB). Ham çıktılar commit edilmedi.
- **Perfetto:** alınmadı. Zarın donmasında UI ve RenderThread payı `gfxinfo framestats`'ın kare satırlarından ayrıldı.

| Adım             | Ekran ve hareket                                                                                | Kare | Takılma % | gfxinfo jank %     | p95 (ms) | En uzun kare (ms)             | Bellek (MB)      | Bulgu                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------- | ---- | --------- | ------------------ | -------- | ----------------------------- | ---------------- | ------------------------------------------------------------ |
| 1                | Soğuk açılış, ilk 8 sn (5 koşu); sistem ilk kare 587 ms, Keşfet 2,6–3,1 sn                      | 670  | 3,1       | 3,4                | 10       | 31                            | okunmadı         | A-09 kısmen                                                  |
| 2a               | Keşfet: soğuk açılıştan sonra ilk yavaş kaydırma, sonra 3 hızlı gidiş dönüş                     | 1269 | 1,3       | 1,5                | 11       | 18                            | 321 / 61 / 100   | A-05 Keşfet'te görülmedi (2 mekan), A-30 ölçülemedi          |
| 2b               | Keşfet aramasına 10 harf (proje sahibi yazdı)                                                   | 387  | 3,1       | 7,0                | 11       | 29                            | 312 / 60 / 99    | A-28 doğrulandı                                              |
| 3                | Liste ve harita arası 5 gidiş dönüş                                                             | 1542 | 0,9       | 1,8                | 7        | 20                            | 466 / 54 / 164   | A-08: kare düşüşü yok                                        |
| 4                | Soğuk açılıştan sonra sekmelerde iki tur                                                        | 1566 | 1,2       | 3,6                | 9        | 105                           | 409 / 90 / 148   | A-14 yalnız Profil'de                                        |
| 4 (sekme başına) | Profil ilk açılış / ikinci açılış; öbür sekmeler                                                | —    | 4,1 / —   | 8,9–12,2 / 8,0–8,4 | 8–11     | 93–109 / 21–24; öbürleri 9–27 | —                | A-05 doğrulandı (Profil)                                     |
| 5a               | Mesajlar aramasına 10 harf, silme, klavyeyi kapatma                                             | 136  | 16,2      | 10,3               | 15       | 19                            | 403 / 79 / 145   | A-28 doğrulandı                                              |
| 5b               | DM'de 8 hızlı yukarı, 10 hızlı aşağı kaydırma (kare p50 14 ms)                                  | 1495 | 62,9      | 0,6                | 20       | 24                            | 690 / 142 / 290  | A-06, A-31 destekliyor; A-41 yeni                            |
| 5c               | DM'de klavyeyi 3 kez açıp kapatma                                                               | 279  | 13,1      | 7,5                | 15       | 22                            | 611 / 127 / 240  | A-12 kısmen                                                  |
| 6a               | Kapsül düzenleyici: Baş şeridinde 10 parça (destansı dahil); p99 150 ms                         | 1461 | 15,2      | 2,2                | 15       | 300                           | 867 / 216 / 361  | A-01 doğrulandı                                              |
| 6b               | Zara 5 kez basma; p99 600–1350 ms. Bir koşuda `gfxinfo` yanıt vermedi, dördüncü koşu alındı     | 359  | 51,1      | 10,5               | 150      | 3750                          | 1001 / 219 / 470 | A-01 doğrulandı                                              |
| 6 (boşta)        | Zarla gelen efsanevi görünüş dururken 10 sn                                                     | 1074 | 100       | 13,0               | 25       | 40                            | —                | A-40 yeni                                                    |
| 6 (tek zar)      | Tek basış, kare satırları: ilk karede UI 470–1200 ms, sonra her kare RenderThread'de 100–260 ms | —    | —         | —                  | —        | 688–2037                      | —                | A-01                                                         |
| 7                | Ayarlar alt sayfasını 3 kez açıp kapatma; yavaş çizim komutu 72–93                              | 778  | 4,3       | 10,4               | 12       | 27                            | 714 / 126 / 338  | A-04 doğrulandı                                              |
| 7                | Bildirimler alt sayfasını 3 kez açıp kapatma                                                    | 472  | 1,3       | 5,9                | 10       | 22                            | 714 / 128 / 341  | A-04 hafif                                                   |
| Ek               | Keşfet dururken 10 sn                                                                           | 688  | 0,7       | 1,2                | 7        | 17                            | —                | A-39 yeni                                                    |
| 8                | Masa kur, Kibrit                                                                                | —    | —         | —                  | —        | —                             | —                | Ölçülemedi: hesapta check-in yok; check-in konum ister       |
| 9                | Aşırı çizim: Keşfet, Profil, Mesajlar, DM                                                       | —    | —         | —                  | —        | —                             | —                | Dört ekranda zemin 4 kat ve üstü: A-42 yeni, A-11 ayrılamadı |
| 10               | iPhone                                                                                          | —    | —         | —                  | —        | —                             | —                | Bu oturumda yapılmadı                                        |

Ölçüm sırasında görülen, performans dışı iki şey: Keşfet'te "Ada göre" düğmesi dokunuşa yanıt vermedi; kapsül düzenleyicide geri düğmesi "Kapsülün" başlığının üstüne biniyor.

## 4.2 Yeniden ölçüm (13 Kasım 2026, akşam; #610–#615 sonrası)

- **Derleme:** aynı telefon ve kurulum (Galaxy S23, 0.11.0 build 21, release). Uygulama iki kez kapatılıp açıldı; çalışan güncelleme `preview` kanalında 16.08 UTC'de yayımlanmış (`01a1d5ab…`, expo-updates günlüğünden), yani #615'ten sonra.
- **Koşullar:** 120 Hz, güç tasarrufu kapalı, animatör ölçeği 1x, Rahatsız Etmeyin açık. **Sağlanamayan:** pil %40'tan %48'e USB'den şarj olurken ölçüldü (kablosuz adb için kablonun telefonda çıkarılması gerekiyordu, proje sahibi yoktu); pil sıcaklığı 37 °C'den 40 °C'ye çıktı. Hesap aynı (2 mekan, 3 sohbet, check-in yok).
- **Yöntem:** 4.1 ile aynı adım adları, koordinatlar, koşu sayısı (3, ortanca) ve takılma tanımı (12,5 ms'den uzun kare). Bir fark: 2b'de 10 harfi 4.1'de proje sahibi yazdı, burada `adb shell input text` harf harf yazdı; 2b'nin önce/sonra karşılaştırması bu yüzden kesin değil.
- **Geri alınan ayarlar:** Çizim ölçümü paneli açıldı, Skia anahtarı denendi, panel kapatıldı (anahtar eski hâline döndü). `debug.hwui.overdraw` kapalı kaldı. Düzenleyiciden her seferinde kaydetmeden çıkıldı. İz dosyaları silindi, repoya girmedi.

### Önce ve sonra

Hücrelerde önce (4.1) → sonra. Bellek: adım sonunda toplam PSS / Graphics / Native Heap (MB).

| Adım                                        | Kare        | Takılma %   | gfxinfo jank % | p95 (ms)  | En uzun kare (ms)             | Bellek (MB)                 |
| ------------------------------------------- | ----------- | ----------- | -------------- | --------- | ----------------------------- | --------------------------- |
| 2a Keşfet kaydırma                          | 1269 → 1267 | 1,3 → 0,6   | 1,5 → 1,3      | 11 → 11   | 18 → 15                       | 321/61/100 → 314/61/99      |
| 2b Keşfet aramasına 10 harf (yöntem farklı) | 387 → 327   | 3,1 → 5,8   | 7,0 → 4,6      | 11 → 13   | 29 → 22                       | 312/60/99 → 316/61/100      |
| 5a Mesajlar aramasına 10 harf               | 136 → 137   | 16,2 → 13,2 | 10,3 → 9,5     | 15 → 14   | 19 → 19                       | 403/79/145 → 331/60/103     |
| 5b DM kaydırma (kare p50 14 → 14 ms)        | 1495 → 1525 | 62,9 → 65,2 | 0,6 → 0,6      | 20 → 20   | 24 → 24                       | 690/142/290 → 544/121/190   |
| 5c DM'de klavye                             | 279 → 279   | 13,1 → 8,9  | 7,5 → 7,9      | 15 → 15   | 22 → 22                       | 611/127/240 → 510/107/163   |
| 6a Düzenleyici, 10 parça (p99 150 → 150 ms) | 1461 → 1483 | 15,2 → 15,3 | 2,2 → 2,1      | 15 → 15   | 300 → 350                     | 867/216/361 → 797/217/248   |
| 6b Zara 5 kez (p99 0,6–1,35 → 0,55–3,85 sn) | 359 → 333   | 51,1 → 53,4 | 10,5 → 9,6     | 150 → 150 | 3750 → 3000                   | 1001/219/470 → 1093/256/388 |
| 6 (boşta), 10 sn                            | 1074 → 1213 | 100 → 58    | 13,0 → 0,2     | 25 → 15   | 40 → 22                       | —                           |
| 6 (tek zar), ilk karelerde UI iş parçacığı  | —           | —           | —              | —         | 470–1200 → 313–1075 (UI payı) | —                           |
| Ek: Keşfet dururken 10 sn                   | 688 → 693   | 0,7 → 0,3   | 1,2 → 1,3      | 7 → 7     | 17 → 19                       | —                           |

"6 (boşta)" iki ölçümde aynı görünüş değil: görünüşü zar seçiyor (4.1'de efsanevi set, burada başka bir zar sonucu). Bu satırın farkı düzeltmeye bağlanamaz.

### B. Kapsül: yük nerede (A-01, A-40)

Kare satırlarından aşama dağılımı (`gfxinfo framestats`, son 120 kare, üç koşu birlikte; ms, ortanca / p95):

| Aşama                         | 6 (boşta)     | 6 (tek zar)   | Skia açık, boşta (Astronot) | Skia kapalı, boşta (Astronot) |
| ----------------------------- | ------------- | ------------- | --------------------------- | ----------------------------- |
| Gecikme (vsync → giriş)       | 0,64 / 1,02   | 0,64 / 6,99   | 0,66 / 0,84                 | 0,65 / 0,85                   |
| UI: giriş ve animasyon        | 5,26 / 6,22   | 5,74 / 8,03   | 2,47 / 3,89                 | 1,41 / 1,90                   |
| UI: ölçü ve yerleşim          | 0,12 / 0,16   | 0,11 / 0,15   | 0,10 / 0,14                 | 0,10 / 0,14                   |
| UI: Draw (kayıt)              | 0,05 / 0,07   | 0,05 / 0,09   | 0,04 / 0,06                 | 0,03 / 0,04                   |
| Sync                          | 0,92 / 1,35   | 1,13 / 1,63   | 1,07 / 1,47                 | 1,15 / 1,52                   |
| Komut gönderme (RenderThread) | 2,92 / 4,12   | 3,22 / 4,10   | 3,82 / 4,54                 | 3,88 / 4,34                   |
| SwapBuffers ve GPU bitişi     | 3,16 / 3,53   | 3,62 / 4,11   | 3,20 / 3,79                 | 3,38 / 3,99                   |
| Toplam                        | 13,76 / 16,24 | 15,44 / 21,29 | 11,82 / 13,41               | 10,65 / 12,03                 |

Son 120 kare penceresi zarın ilk uzun karelerini çoğu zaman dışarıda bırakıyor; uzun kareler ayrıca okundu:

- **Kare satırları (tek zar):** basıştan sonraki ilk karelerde UI payı 313 ve 1075 ms, aynı karelerde RenderThread 157–206 ms.
- **Sistem izi:** Perfetto yerine aynı kategorilerle `atrace` (gfx, view, sched, am, wm, input) iki zar basışı için alındı. UI iş parçacığında en uzun dilimler `Record View#draw()` 3412 ms (birinci basış) ve 308 ms (ikinci basış); altında iz işareti yok. Ayrıca React Native'in görünüm takma işi (`mountViews`) 73–102 ms, tek seferde 2186 yerleşim güncellemesi. RenderThread'de `prepareTree` 133–141 ms, 795 x 753'lük bir doku yüklemesi 13 ms.
- **Skia açık ve kapalı (panel açık, Astronot takımı, 10 parça değişimi; iki koşu):** açıkken en uzun kare 400 ms, p99 200 ms, takılma %25–29; kapalıyken (SVG yolu) en uzun kare 1800 ms, p99 250–350 ms, takılma %13–19. Boşta açıkken takılma %0,9–10,9, kapalıyken %0,4–0,6. Panel düzenleyicinin üst yarısını örttüğü için zar bu karşılaştırmaya girmedi.

**Yanıt:**

- **Ölçüldü:** donma UI iş parçacığında, `View#draw` kaydında (0,3–3,4 sn). RenderThread payı (130–200 ms) bunun onda biri kadar.
- **Ölçüldü:** Skia kapatılınca parça değişimindeki en uzun kare 0,4 sn'den 1,8 sn'ye çıkıyor. Yük Skia'ya özgü değil; SVG yolunda daha ağır.
- **Çıkarım:** kaydı uzatan, iz işareti olmayan uygulama çizim kodu: SVG'nin resim üretimi ya da Skia resminin kaydı.
- **Ölçüldü:** boşta her kare yaklaşık 12–14 ms sürüyor: UI'da animasyon 1,4–5,3 ms, RenderThread'de komut gönderme ve swap yaklaşık 7 ms. Skia açıkken UI'daki animasyon payı 1 ms kadar daha büyük.
- **Ölçüldü:** A-21'in (#612) düzenleyicideki etkisi görünmüyor; 6a ve 6b önceki ölçümle aynı aralıkta.

### C. DM kaydırması: yük nerede (A-06, A-31, A-42)

Kare satırları (5b, üç kısa kaydırma koşusu, 358 kare; ms, ortanca / p95):

| Aşama                         | DM kaydırma   |
| ----------------------------- | ------------- |
| Gecikme (vsync → giriş)       | 0,45 / 0,81   |
| UI: giriş ve animasyon        | 0,62 / 1,74   |
| UI: ölçü ve yerleşim          | 0,08 / 0,12   |
| UI: Draw (kayıt)              | 0,36 / 1,41   |
| Sync                          | 0,26 / 0,41   |
| Komut gönderme (RenderThread) | 7,51 / 8,85   |
| SwapBuffers ve GPU bitişi     | 3,93 / 5,56   |
| Toplam                        | 16,43 / 16,97 |

- **Gölge kapalı ölçüm:** ölçülemedi. Panelde gölgenin elle anahtarı yok, gölge yalnız "Başlat"ın zamanlı adımında 5 sn kapanıyor. Panel açıkken Mesajlar listesinin üst yarısını örttüğü için sohbete de girilemedi.
- **A-41 (bellek):**
  - Mesajlar'da, sohbete girmeden önce: 331 MB.
  - Sohbetin içinde: 544–575 MB.
  - Çıktıktan 30 sn sonra: 513 MB; 60 sn sonra: 504 MB.
  - Bu turda koşudan koşuya büyüme yok (544, 542, 553 MB).

**Yanıt:**

- **Ölçüldü:** DM kaydırmasındaki sabit maliyet RenderThread'de: çizim komutlarının gönderilmesi her karede yaklaşık 7,5 ms, swap ve GPU yaklaşık 4 ms; ikisi birlikte 8,3 ms'lik bütçeyi aşıyor ve ekran 60 karede kalıyor. UI iş parçacığının payı 1,5 ms'nin altında.
- **Ölçülmedi:** JS iş parçacığı `framestats`'ta görünmüyor. Kaydırma native olduğu için kareyi bekletmiyor (çıkarım).
- **Ayrılamadı:** GPU'nun kendi payı swap süresinin içinde.
- **Çıkarım:** komut sayısını büyüten adaylar ekranın tamamını kaplayan katmanlar (A-42: duvar kâğıdı ve zeminler 4 kat) ve balon gölgeleri. Gölge payı panelle ölçülemedi.
- **A-41:** büyüme bu turda tekrarlanmadı (ölçüldü); sohbetten çıkınca 170–180 MB geri verilmiyor (ölçüldü). Önbellek mi sızıntı mı, ayrılmadı.

## 4.3 DM kaydırması: parça parça (13 Kasım 2026, akşam)

- **Derleme ve yöntem:** 4.2 ile aynı telefon ve güncelleme (Galaxy S23, 0.11.0 build 21, `preview` 16.08 UTC). Her hâl için iki ölçüm alındı:
  - "Tam koşu": 5b'nin kaydırması (8 hızlı yukarı, 10 hızlı aşağı; 3 koşu, ortanca). Kare p50 ve takılma bundan.
  - "Kısa koşu": bir yukarı bir aşağı kaydırmadan hemen sonra `framestats` (3 koşu, son 120'şer kare birlikte). Aşama sayıları bundan.
- **Koşullar:**
  - Pil %60'tan %65'e, USB'den şarj olurken; sıcaklık 37–38,5 °C.
  - Rahatsız Etmeyin kapalıydı (değiştirilmedi); ölçüm sırasında bildirim düştü.
  - Güç tasarrufu kapalı, 120 Hz.
- **Hesabın sohbetleri:** üç sohbetin hiçbirinde fotoğraf yok. Hâl 2 için mesaj yazılmadı: hesabın kısa metinli bir sohbeti vardı.
- **Geri alınan ayarlar:**
  - Uygulama teması Açık'a alınıp Koyu'ya geri döndürüldü.
  - Animasyon ölçekleri 0'a alınıp 1'e geri döndürüldü.
  - `debug.hwui.overdraw` ve `debug.hwui.profile` açılıp kapatıldı.
  - Hepsinin son durumu okundu.
- **Repoya girmeyenler:** ekran görüntüleri ve iz dosyaları.

| Hâl                                                    | Ekrandaki parçalar                                                                                                                                         | Kare p50 (ms)                                             | Takılma %    | Komut gönderme (ms, ortanca / p95) | Swap ve GPU (ms, ortanca / p95) | Kare toplamı (ms, ortanca / p95)                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------ | ---------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| 1. DM, 5b'deki sohbet (koyu tema)                      | Görünen 11 metin balonu, 1 tarih hapı. Kaydırılan bölümde 4 yalnız emoji balonu, 2 tepkili, 2 alıntılı balon; fotoğraf yok. 368 görünüm, 682 kB RenderNode | 13                                                        | 53,0 (26–69) | 6,26 / 8,66                        | 4,83 / 13,90                    | 16,46 / 24,85                                                           |
| 2. DM, yalnız kısa metin (fotoğraf, tepki, alıntı yok) | Görünen 11 metin balonu, 1 tarih hapı. 377 görünüm, 699 kB                                                                                                 | 5 (sohbet kısa, tam koşuda kaydırmanın çoğu uçta kalıyor) | 10,3         | 5,82 / 8,56                        | 4,03 / 13,65                    | 17,09 / 25,51                                                           |
| 3. DM, tepki ve alıntı bölümü                          | Görünen 9 balon, 2 tepki, 2 alıntı, 1 tarih hapı; fotoğraf yok                                                                                             | 13                                                        | 69,9 (44–72) | 7,28 / 8,80                        | 4,17 / 5,15                     | 16,58 / 17,14                                                           |
| 4. Mekan ya da masa sohbeti                            | —                                                                                                                                                          | —                                                         | —            | —                                  | —                               | Ölçülemedi: hesapta check-in yok; check-in konum ister                  |
| 5. Mesajlar listesi (duvar kâğıdı ve balon yok)        | 3 satır; liste ekrana sığıyor, kaydırma yalnız kenarda esniyor. 200 görünüm, 395 kB                                                                        | 5                                                         | 0,5          | 1,98 / 2,88                        | 1,27 / 1,42                     | 4,73 / 6,23                                                             |
| 6. DM'de klavye açıkken                                | —                                                                                                                                                          | —                                                         | —            | —                                  | —                               | Ölçülemedi: sürükleme klavyeyi kapatıyor (ilk kaydırmada klavye iniyor) |
| 7. Hâl 1, açık tema                                    | Hâl 1'in balonları, açık duvar kâğıdı, camlı üst çubuk ve yazma alanı                                                                                      | 13                                                        | 54,9 (52–66) | 3,57 / 8,19                        | 12,00 / 14,39                   | 25,23 / 25,62                                                           |
| 8. Hâl 1, animasyonlar kaldırılmış (üç ölçek 0)        | Hâl 1 ile aynı                                                                                                                                             | 13                                                        | 59,2 (57–61) | 4,17 / 8,53                        | 4,25 / 13,82                    | 16,53 / 24,88                                                           |

Hâl 7 için not: uygulama zaten koyu temadaydı, hâl 1 koyu temada ölçüldü. Karşılaştırma için açık tema ölçüldü.

### Ek okumalar (hâl 1)

- **Görünüm sayısı:** DM 368 görünüm ve 682 kB RenderNode belleği; Mesajlar 200 görünüm ve 395 kB.
- **`atrace` (gfx, view; 5 sn hızlı kaydırma, 484 kare):** RenderThread'in kare başına payı ortalama 8,05 ms. En uzun üç kalem:
  - `Drawing` (çizim komutlarının hazırlanması): 3,77 ms.
  - `dequeueBuffer` (boş tampon beklemek): 3,67 ms.
  - `flush commands`: 1,65 ms.
  - Ardından `eglSwapBuffersWithDamageKHR` 1,17 ms.
  - Kare başına yaklaşık 43 doku çizimi (`TextureOp`) ve 19 yazı atlası çizimi.
  - Doku yüklemesi her karede değil: 5 sn'de 64 kez, çoğu 48 x 48 (avatar boyu), en büyüğü 480 x 114.
- **Aşırı çizim (`debug.hwui.overdraw show`):** zeminin tamamı ve balonların hepsi en üst kademede (4 kat ve üstü). Android bu kademeden sonrasını ayırmadığı için daha fazlası sayılamıyor.
- **Profil çubukları (`debug.hwui.profile`):** kırmızı (komut gönderme) baskın, ikinci turuncu (swap). Çubukların çoğu 16 ms çizgisinin üstünde.

### Yanıt

**Ölçüldü:**

- Kare maliyeti balonun içeriğiyle değişmiyor. Yalnız kısa metin, tepki ve alıntı bölümü, karışık sohbet ve animasyonların kaldırıldığı hâl: dördünde de kare yaklaşık 16,5 ms, komut gönderme 5,8–7,3 ms, swap 4–5 ms.
- Maliyet duvar kâğıdı ve balon olmayan Mesajlar listesinde dörtte birine iniyor (4,7 ms).
- Açık temada GPU tarafı üç kat artıyor (swap 4 → 12 ms), kare 25 ms'ye çıkıyor.
- RenderThread'in yaklaşık yarısı GPU'nun tampon bırakmasını beklemek (`dequeueBuffer` 3,7 ms): GPU önde gitmiyor, geride kalıyor.

**Çıkarım:** maliyet her karede tekrarlanan sabit bir yük: ekranın tamamını kaplayan üst üste katmanlar (duvar kâğıdının katmanları ve altındaki zeminler, aşırı çizimde 4 kat ve üstü) ve kare başına yaklaşık 43 doku çizimi. Balonlar, tepkiler, alıntılar ve hareket bu yükü değiştirmiyor.

**Aynı görüntüyü daha ucuz çizmenin yolları (efekt aynı kalır):**

1. Duvar kâğıdının katmanlarını ekran boyunda tek bir resme bir kez birleştirmek ve kaydırma sırasında o resmi tek doku olarak çizmek.
2. Duvar kâğıdının altında kalan, görünmeyen tam ekran zeminleri çizmemek.
3. Balonun gölgesini ve dolgusunu balon başına tek dokuda toplamak.

Telegram Android'in sohbet zeminini nasıl çizdiğine bu oturumda bakılmadı; yöntem seçilmeden önce `telegram-referans` ile bakılır. Açık temanın 12 ms'lik GPU payının hangi katmandan geldiği (açık duvar kâğıdı, camlı çubuklar) ayrıca ölçülmedi.

## 4.4 Bütün kapsül Skia ve DM parçaları (13 Kasım 2026, gece)

- **Derleme:** Galaxy S23, 0.11.0 build 21, release. Uygulama iki kez kapatılıp açıldı. Çalışan güncelleme `preview` kanalında 18.19 UTC'de yayımlanmış (`01a1d622…`): #618 içinde. #620 (18.20 UTC'de birleşti) içinde değil; panelde "Sohbette kapat" yok. A bölümünden sonra uygulama yeniden iki kez kapatılıp açıldı (18.40 UTC), güncelleme değişmedi.
- **Koşullar:**
  - Pil %88'den %96'ya USB'den şarj olurken (şarjsız sağlanamadı); sıcaklık 35–39 °C.
  - Güç tasarrufu kapalı, 120 Hz, animatör ölçeği 1x.
  - Rahatsız Etmeyin ölçüm için açıldı, sonra eski hâline (kapalı) alındı.
- **Yöntem:** 4.2 ile aynı koordinatlar ve süreler; her adım 3 koşu, ortanca; takılma 12,5 ms'den uzun kare.
  - "6 (boşta)" iki hâlde aynı görünüşle ölçüldü: 6a'nın koşuları (sağa 10, sola 10, sağa 10) aynı parçada bitiyor, zar basılmadan önce.
  - Bu sırada panelin "Skia çizimi" anahtarı açıktı; Süsle'nin Android'deki varsayılanı da bu.
- **Geri alınanlar:**
  - "Bütün kapsül Skia" kapatıldı ve panelde kapalı göründüğü okundu.
  - Düzenleyiciden her seferinde kaydetmeden çıkıldı.
  - `debug.hwui.overdraw` ve `debug.hwui.profile` kapalı, animatör ölçeği 1.
  - Ekran görüntüleri ve iz dosyaları repoya girmedi.

### A1. Yan yana görüntü (sol bugünkü çizim, sağ bütün tuval)

Galerideki 17 aksesuar. Her biri için iki ayrı anda ekran görüntüsü alındı.

| Aksesuar                                                                                  | Sonuç                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astronot, Büyücü, Dalgıç, Doktor, Hawaii, Kış, Korsan, Rock, Şef, Yıldız takımları        | Aynı: şekil, renk ve yer aynı. Kayan parlama iki tarafta da var, yalnız iki taraf aynı anda parlamıyor (saatleri ayrı).                                                                                                                            |
| Gece teni, Gökkuşağı atkı, Kunai kolyesi, Neon gözlük, Orman teni (zemin halkalı olanlar) | Şekil ve renk aynı. Halka ve kapsül iki tarafta farklı boyda görünüyor, ama iki görüntüde büyük olan taraf yer değiştiriyor: halkanın büyüyüp küçülen hareketi iki tarafta farklı anda. Eksik parça, kırpma, boş kare ya da yanıp sönme görülmedi. |

Hareketin yönü ve ekseni iki kareyle karşılaştırılamaz; video alınamadı (bilgisayarda kare ayırma aracı yok). Uygulama çökmedi, sağ taraf her aksesuarda çizildi.

### A2. Kapsülünü süsle: anahtar kapalı → açık

| Ölçüm                                                         | Kapalı                                               | Açık                                   |
| ------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| 6a, 10 parça: takılma %                                       | 13,8                                                 | 15,4                                   |
| 6a: p99 / en uzun kare (ms)                                   | 200 / 450                                            | 32 / 65 (ilk koşu 400)                 |
| 6a: yavaş bitmap yüklemesi / yavaş çizim komutu (koşu başına) | 15 / 14                                              | 1 / 0                                  |
| 6a: bellek, toplam PSS / Graphics / Native Heap (MB)          | 798 / 240 / 214                                      | 726 / 247 / 163                        |
| 6 (boşta, 10 sn, aynı görünüş): takılma %, kare p50           | 17,5; 11 ms                                          | 2,0; 11 ms                             |
| 6 (boşta): UI animasyon / komut gönderme / swap (ms, ortanca) | 3,4 / 3,1 / 2,8                                      | 6,0 / 2,0 / 1,8                        |
| 6b, zara 5 kez: takılma %, kare p50                           | 41,2; 11 ms                                          | 78,6; 17 ms                            |
| 6b: p99 / en uzun kare (ms)                                   | 1100 / 2100–4950                                     | 85 / 150–2100 (ilk koşu 2100)          |
| 6b: bellek (MB)                                               | 967 / 242 / 301                                      | 821 / 364 / 163                        |
| 6 (tek zar): en uzun kareler                                  | 498–1726 ms; UI 269–1500 ms, RenderThread 105–277 ms | Son 120 karede 30 ms'yi geçen kare yok |
| 6 (tek zar): kare ortancası / p95, UI animasyon payı          | 15,1 / 29,2 ms; 4,2 ms                               | 21,3 / 31,3 ms; 8,6 ms                 |
| atrace, tek zar: en uzun `Record View#draw()`                 | 291 ms                                               | 438 ms (iz başına tek kare)            |
| atrace: `mountViews` / tek seferde yerleşim güncellemesi      | 101 ms / 2483                                        | 55 ms / 460                            |
| Düzenleyicide görünüm sayısı / RenderNode belleği             | 1619 / 2843 kB                                       | 794 / 1442 kB                          |

### A3. Anahtar açıkken gözle

- **Parça değişimi:** yeni parça eskisinin üstünde beliriyor; geçişte eski ve yeni bir an birlikte görünüyor.
- **Kapsül:** yakalanan karelerde boş kalmadı.
- **Başa dokunma:** yüz ("Mutlu") ve yıldız hareketi geldi.
- **Profil sekmesi:** kapsül kaydedilmiş hâliyle doğru göründü.

### B. DM kaydırması

İlk denemede ölçülemedi: telefondaki güncelleme #620'den önceydi (18.19 UTC). #620 telefona gelince ölçüldü (19.27–19.39 UTC, uygulama iki kez yeniden başlatıldıktan sonra; panelde "Sohbette kapat" var).

- **Yöntem:** 4.3'ün 1. hâlindeki sohbet; tam koşu (kare p50, takılma) ve kısa koşu (aşama dağılımı) 4.3 ile aynı. "Kapanınca koru" açık, her hâlde anahtar ayarlandı ve panel kapatıldı.
- **Koşullar:** pil %88'den %93'e USB'den şarj olurken; sıcaklık 37–41 °C; Rahatsız Etmeyin açık.

| Hâl                                              | Kare p50 (ms) | Takılma % | Komut gönderme (ms, ortanca / p95) | Swap ve GPU (ms, ortanca / p95) | Kare toplamı (ms, ortanca / p95) | Aşırı çizim                                         |
| ------------------------------------------------ | ------------- | --------- | ---------------------------------- | ------------------------------- | -------------------------------- | --------------------------------------------------- |
| 1. Hepsi açık (yeni taban; 4.3'te 16,46 / 24,85) | 13            | 66,8      | 7,38 / 8,37                        | 4,46 / 5,04                     | 16,32 / 16,49                    | Zemin ve balonlar 4 kat ve üstü                     |
| 2. Yalnız duvar kâğıdı kapalı                    | 13            | 60,1      | 7,38 / 8,61                        | 3,99 / 5,03                     | 15,72 / 16,09                    | Değişmedi: zemin düz renk ama yine 4 kat ve üstü    |
| 3. Yalnız duvar bandı kapalı                     | 14            | 70,5      | 7,38 / 8,55                        | 4,46 / 5,50                     | 16,30 / 16,56                    | Değişmedi                                           |
| 4. Yalnız gölge kapalı                           | 13            | 61,2      | 7,31 / 8,99                        | 4,48 / 5,52                     | 16,25 / 16,43                    | Değişmedi                                           |
| 5. Üçü birden kapalı                             | 13            | 50,6      | 7,34 / 9,00                        | 3,86 / 5,08                     | 15,62 / 15,84                    | Değişmedi: 4 kat ve üstü                            |
| 6a. Hepsi açık, açık tema                        | 14            | 71,5      | 7,16 / 8,89                        | 5,08 / 6,11                     | 16,87 / 17,87                    | Açık zeminde kademe kesin okunamadı (kırmızı tonlu) |
| 6b. Üçü kapalı, açık tema (temaya geçer geçmez)  | 14            | 66,0      | 3,60 / 8,14                        | 12,19 / 13,76                   | 24,16 / 24,41                    | Kırmızı tonlu                                       |
| 6b, tekrar (6a'dan sonra)                        | 13            | 63,5      | 7,46 / 8,68                        | 4,00 / 4,93                     | 15,84 / 16,00                    | —                                                   |

- **Sıra etkisi:** 6b temaya geçildikten hemen sonra ölçüldüğünde swap 12 ms çıktı; aynı hâl 6a'dan sonra tekrarlanınca 4 ms. 4.3'ün 7. hâli de temaya geçer geçmez ölçülmüştü (swap 12 ms). **Çıkarım:** 4.3'teki "açık temada GPU üç kat" bulgusu temanın kendisinden değil, geçişten hemen sonraki geçici bir durumdan geliyor; açık tema kendi başına kareyi değiştirmiyor (6a ile 1 arasında fark 0,5 ms).
- **Geri alınanlar:** üç anahtar açıldı, "Kapanınca koru" kapatıldı (panelde okundu); tema Koyu'ya döndü; `debug.hwui.overdraw` ve `debug.hwui.profile` kapalı; animatör ölçeği 1; Rahatsız Etmeyin eski hâline (kapalı) alındı.

### Yanıtlar

- **Ölçüldü:** bütün Skia parça değişimindeki donmayı kaldırıyor: en uzun kare 450–550 ms'den 65 ms'ye, yavaş bitmap yüklemesi koşu başına 15'ten 0–1'e iniyor.
- **Ölçüldü:** zarda saniyelerce süren tek tek donmaları (p99 1,1 sn → 85 ms) büyük ölçüde kaldırıyor; yine de ilk zarda bir kez 2,1 sn'lik kare kalıyor.
- **Ölçüldü:** zar hareketi sırasında kareler daha ağır: ortanca 11 → 17 ms, takılma %41 → %79. UI iş parçacığındaki animasyon payı iki katına çıkıyor (4,2 → 8,6 ms).
- **Ölçüldü:** düzenleyicideki görünüm sayısı 1619'dan 794'e, tek seferdeki yerleşim güncellemesi 2483'ten 460'a iniyor. Kalan 794 görünüm şerit, karolar ve ekranın geri kalanı. **Çıkarım:** karoların payı ayrıca sayılmadı.
- **Ölçüldü:** Graphics belleği zar sonrası 242'den 364 MB'a çıkıyor; Native Heap 301'den 163 MB'a iniyor.
- **Çizim farkı:** şekil, renk ve yerde fark görülmedi. Zemin halkalı beş aksesuarda (Gece teni, Gökkuşağı atkı, Kunai kolyesi, Neon gözlük, Orman teni) halkanın büyüyüp küçülme anı iki tarafta farklı. Bu, saatlerin ayrı olmasından mı yoksa hareketin farklı çizilmesinden mi geliyor, iki kareyle ayrılamadı (çıkarım: saat farkı).
- **DM, ölçüldü:** duvar kâğıdı, duvar bandı ve gölge kareyi belirgin değiştirmiyor: üçü birden kapalıyken kare 16,3'ten 15,6 ms'ye iniyor (en çok 0,7 ms, swap'ta); komut gönderme her hâlde 7,3–7,5 ms'de aynı kalıyor. Zemin düzeltmesinden (#620) sonra yeni taban 16,3 ms, 4.3'ün 16,5 ms'siyle aynı.
- **DM, ölçüldü:** üç parça kapalıyken de aşırı çizim zemin ve balonlarda 4 kat ve üstü. **Çıkarım:** her karedeki sabit yük bu üç parçada değil; duvar kâğıdının altında kalan başka tam ekran katmanlarda ya da balon başına çizilen öğelerin sayısında (kare başına yaklaşık 43 doku çizimi, 4.3). Sonraki ölçüm: bir karenin hangi görünümleri çizdiğini Perfetto'da görünüm adıyla okumak.

## 4.5 Bütün kapsül Skia, #623 sonrası (13 Kasım 2026, gece)

- **Derleme:** Galaxy S23, 0.11.0 build 21, release. Uygulama iki kez kapatılıp açıldı. #623 (katmanlar bir kez resme çiziliyor) proje sahibine göre telefonda; çalışan güncellemenin kimliği bu kez günlükten okunamadı (expo-updates günlüğünde güncelleme satırı yoktu).
- **Koşullar:** pil %98–100, USB'den şarjda (şarjsız sağlanamadı); sıcaklık 40–41 °C, önceki ölçümlerden sıcak. Rahatsız Etmeyin ölçüm için açıldı, sonra eski hâline (kapalı) alındı.
- **Yöntem:** 4.4'ün A2 ve A3'ü, yalnız "Bütün kapsül Skia" açık. Aynı koordinatlar, 3 koşu, ortanca, takılma 12,5 ms'den uzun kare. Önceki sütunlar 4.4'ün aynı anahtarlı ölçümünden.
- **Geri alınanlar:** "Bütün kapsül Skia" kapatıldı (panelde okundu); düzenleyiciden kaydetmeden çıkıldı; `debug.hwui.*` kapalı, animatör ölçeği 1. Ekran görüntüleri repoya girmedi.

### A2. Kapsülünü süsle, anahtar açık: 4.4 → 4.5

| Ölçüm                                                                    | 4.4 (açık, #623 öncesi) | 4.5 (açık, #623 sonrası)                      |
| ------------------------------------------------------------------------ | ----------------------- | --------------------------------------------- |
| 6a, 10 parça: takılma %, kare p50                                        | 15,4; 11 ms             | 4,5; 8 ms                                     |
| 6a: p99 / en uzun kare (ms)                                              | 32 / 65 (ilk koşu 400)  | 40 / 89 (ilk koşu 300)                        |
| 6a: yavaş bitmap yüklemesi / yavaş çizim komutu (koşu başına)            | 1 / 0                   | 2 / 4 (bir koşuda 23 / 24)                    |
| 6 (boşta, 10 sn, aynı görünüş): takılma %, kare p50                      | 2,0; 11 ms              | 0,2; 8 ms (bir koşu %38, ilk koşu)            |
| 6 (boşta): UI animasyon / komut gönderme / swap (ms, ortanca)            | 6,0 / 2,0 / 1,8         | 2,0 / 2,6 / 2,6                               |
| 6b, zara 5 kez: takılma %, kare p50                                      | 78,6; 17 ms             | 4,6; 8 ms                                     |
| 6b: p99 / en uzun kare (ms)                                              | 85 / 150–2100           | 101 / 150–800                                 |
| 6 (tek zar): kare ortancası / p95, UI animasyon payı                     | 21,3 / 31,3 ms; 8,6 ms  | 9,3 / 11,3 ms; 3,1 ms                         |
| 6 (tek zar): son 120 karede 20 ms'yi geçen kare                          | yok (30 ms eşiğinde)    | yok                                           |
| atrace, tek zar: en uzun `Record View#draw()`                            | 438 ms                  | iz başına 10 ms'yi geçmedi (`traversal` 8 ms) |
| atrace: `mountViews` / tek seferde yerleşim güncellemesi                 | 55 ms / 460             | 66 ms / 420                                   |
| Düzenleyicide görünüm sayısı                                             | 794                     | 1169                                          |
| Bellek, düzenleyiciye girerken (toplam PSS / Graphics / Native Heap, MB) | ölçülmedi               | 579 / 194 / 184                               |
| Bellek, 6a sonu                                                          | 726 / 247 / 163         | 1136 / 420 / 500                              |
| Bellek, 6b sonu                                                          | 821 / 364 / 163         | 1470 / 426 / 583                              |
| Bellek, düzenleyiciden çıktıktan 30 sn sonra                             | ölçülmedi               | 1343 / 361 / 386                              |

### A3. Gözle (anahtar açık)

- **Parça değişimi:** yeni parça hemen yerinde; yakalanan karelerde eski ve yeni üst üste görünmedi (4.4'te görünmüştü), kapsül boş kalmadı.
- **Başa dokunma:** yüz ("Mutlu") ve yıldızlar geldi.
- **Profil sekmesi:** kapsül kaydedilmiş hâliyle doğru.
- **Keskinlik:**
  - Düzenleyicideki büyük kapsül 3 kat büyütmede keskin; kenarlar yumuşatılmış, merdiven görünmüyor.
  - Galeride sol (bugünkü çizim) ve sağ (bütün tuval) yan yana 3 kat büyütüldü: Büyücü şapkası ve Gece teni halkası. İki taraf eşit keskin; bulanıklık ya da pikselleşme yok.

### Yanıtlar

- **Ölçüldü:** #623 zarı düzeltiyor: hareket sırasında kare ortancası 17'den 8 ms'ye, takılma %79'dan %5'e iniyor; tek zarda kare 21 ms'den 9 ms'ye, UI'daki animasyon payı 8,6'dan 3,1 ms'ye iniyor.
- **Ölçüldü:** parça değişiminde takılma %15'ten %4,5'e iniyor; en uzun kare 65–300 ms aralığında, 4.4 ile aynı düzeyde.
- **Ölçüldü:** zarda tek seferlik en uzun kare 2,1 sn'den 0,8 sn'ye iniyor ama kalıyor (ilk zar basışında).
- **Ölçüldü, yeni sorun:** bellek belirgin büyüdü. 6b sonunda toplam PSS 1,47 GB (4.4'te 821 MB), Graphics 426 MB (364), Native Heap 583 MB (163). Düzenleyiciden çıktıktan 30 sn sonra bile 1,34 GB'ta kalıyor. **Çıkarım:** katmanların bir kez çizilen resimleri bellekte tutuluyor ve düzenleyici kapanınca bırakılmıyor; ucuz telefonda arka planda kapanma riski.
- **Ölçüldü:** görünüm sayısı 794'ten 1169'a çıktı. Bunun nedeni bu ölçümde ayrılmadı (çıkarım: şerit bu turda daha çok karo bağladı).
- **Keskinlik:** galeride ve büyük kapsülde bulanıklık ya da pikselleşme görülmedi.

## 4.6 Ne çiziliyor: DM, Keşfet tabanı ve kapsülün iki sorusu (13 Kasım 2026, gece)

- **Derleme ve koşullar:** Galaxy S23, 0.11.0 build 21, release, #623 düzeyinde; "Ters liste", "Balon şekli" ve bellek düzeltmesi ölçülmedi. Pil %100, USB'den şarjda (şarjsız sağlanamadı), sıcaklık 39,5–40 °C. Rahatsız Etmeyin ölçüm için açıldı, sonra eski hâline (kapalı) alındı.
- **Araçlar:**
  - Görünüm sınıfları `uiautomator dump` ile sayıldı. Bu araç erişilebilirlik ağacını döker; `gfxinfo`'nun görünüm sayısından azdır (DM'de 285 düğüm, 368 görünüm).
  - `dumpsys activity top` React görünümlerini dökmedi (kökün altında iki görünüm).
- **Geri alınanlar:**
  - `debug.hwui.skia_atrace_enabled` açıldı, sonra kapatıldı (okundu: false).
  - "Bütün kapsül Skia" kapatıldı (panelde okundu).
  - Düzenleyiciden kaydetmeden çıkıldı.
  - Dökümler, iz dosyaları ve ekran görüntüleri repoya girmedi.

### A. DM'de ne çiziliyor

**Görünüm sınıfları** (4.3'ün 1. hâlindeki sohbet, en altta; `uiautomator`, 285 düğüm):

| Sınıf                      | Sayı      |
| -------------------------- | --------- |
| ViewGroup (React görünümü) | 165       |
| TextView                   | 30        |
| ImageView                  | 20        |
| SVG (kök 16, alt düğüm 27) | 43        |
| LinearLayout / FrameLayout | 11 / 6    |
| ScrollView                 | 4         |
| Button / EditText / View   | 4 / 1 / 1 |

- **Balon başına düğüm:** kısa metin balonu 11–14, tepkili balon 17. Alıntılı balon ekranda yoktu, sayılmadı. Her balonda aynı sınırlarda üst üste 4 sarmalayıcı ViewGroup var.
- **Tam ekran düğüm:** 38 tanesi ekran boyunda. 4'ü ScrollView; açık tutulan öbür sekmelerin ağaçları da bunlara dahil.
- **Opaklık, katman türü, ters ölçek ve kırpma:** ölçülemedi. `uiautomator` bu özellikleri vermiyor, release derlemesinde görünüm hata ayıklayıcısı yok.

**Katman ve önbellek** (`dumpsys gfxinfo`):

|                                                | DM                               | Keşfet              |
| ---------------------------------------------- | -------------------------------- | ------------------- |
| Görünüm / RenderNode belleği                   | 368 / 682 kB                     | 221 / 437 kB        |
| GPU doku önbelleği                             | 35,95 MB (117 kayıt)             | 22,72 MB (81 kayıt) |
| Ekran dışı çizim hedefi (Scratch RenderTarget) | 9,83 MB, 1 adet (tam ekran boyu) | yok                 |
| Yazı atlası (Glyph Cache)                      | 6,5 MB                           | —                   |

**Kaydırırken RenderThread** (`atrace` gfx, view ve Skia izi; 5 sn, DM 449 kare, Keşfet 550 kare; kare başına):

| İşlem                                               | DM      | Keşfet  |
| --------------------------------------------------- | ------- | ------- |
| Doku çizimi (TextureOp)                             | 42,9    | 18,1    |
| Yuvarlak dikdörtgen (CircularRRectOp + FillRRectOp) | 26,9    | 28,2    |
| Yazı (AtlasTextOp)                                  | 18,7    | 11,3    |
| Daire (CircleOp)                                    | 9,7     | 3,1     |
| Dokuz parça resim (NonAALatticeOp)                  | 2,0     | 2,0     |
| Çizim işi (OpsTask hazırlık + yürütme + flush)      | 2,75 ms | 2,95 ms |
| Tampon bekleme (dequeueBuffer + queueBuffer)        | 6,09 ms | 1,19 ms |
| eglSwapBuffers                                      | 1,84 ms | —       |
| RenderThread toplamı (DrawFrames)                   | 7,75 ms | —       |

- **Ara katman ve kırpma:** kare başına ek bir OpsTask (ara katman, saveLayer'ın izi) DM'de ortalama 0,1 (1,1 OpsTask/kare), Keşfet'te 0 (1,0). `clipPath` ve gölge ayrı dilim olarak izde görünmüyor.

### B. Keşfet tabanı (2a kaydırması)

| Aşama (ms, ortanca / p95) | DM (4.4 B, hâl 1) | Keşfet      |
| ------------------------- | ----------------- | ----------- |
| UI giriş ve animasyon     | 0,68 / 4,69       | 1,40 / 3,42 |
| Draw (kayıt)              | 0,35 / 0,99       | 0,23 / 0,31 |
| Sync                      | 0,26 / 0,39       | 0,19 / 0,27 |
| Komut gönderme            | 7,38 / 8,37       | 1,82 / 2,32 |
| Swap ve GPU               | 4,46 / 5,04       | 1,61 / 4,23 |
| Kare toplamı              | 16,32 / 16,49     | 6,38 / 8,24 |
| Takılma % / kare p50      | 66,8 / 13 ms      | 1,9 / 5 ms  |
| Görünüm sayısı            | 368               | 221         |
| Doku çizimi / kare        | 42,9              | 18,1        |

### C. Kapsül

**1. Görünüm sayısı** (`gfxinfo`; aynı giriş, Baş şeridi, aynı parçalar; `uiautomator` düzenleyicide çalışmadı, sınıf dökümü alınamadı):

| An                          | Anahtar kapalı | Anahtar açık |
| --------------------------- | -------------- | ------------ |
| Girişte                     | 1062           | 627          |
| Sağa 10 parça sonra         | 1889           | 1428         |
| Sola 10 parça, başa dönünce | 839            | 627          |
| Bir zar sonra               | 1921           | 892          |

**2. İlk zar** (uygulama yeniden başlatıldı, anahtar açıldı, düzenleyiciye girildi; `atrace` gfx, view, sched):

| Basış | En uzun UI karesi | UI'da en uzun dilimler                                        | UI CPU'da | JS (`mqt_v_js`) CPU'da |
| ----- | ----------------- | ------------------------------------------------------------- | --------- | ---------------------- |
| 1.    | 127 ms            | `traversal` 88, `Record View#draw()` 81, `mountViews` 36 ms   | 114 ms    | 122 ms                 |
| 2.    | 1912 ms           | `Record View#draw()` 1848, `animation` 57, `mountViews` 51 ms | 1854 ms   | 533 ms                 |
| 3.    | 17 ms             | `animation` 15 ms                                             | 16 ms     | 14 ms                  |

Anahtar kapalıyken aynı adımlarda en uzun kareler 1851, 445 ve 581 ms çıktı. Üçünde de `Record View#draw()` 233–1725 ms; UI CPU'da 298–1720 ms, JS 98–388 ms.

**3. Bellek tabanı** (toplam PSS / Native Heap / Graphics / GL mtrack / EGL mtrack, MB):

| An                     | Anahtar açık                | Anahtar kapalı (aynı adımlar) |
| ---------------------- | --------------------------- | ----------------------------- |
| Düzenleyiciye girmeden | 428 / 145 / 94 / 54 / 39    | 399 / 126 / 94 / 55 / 39      |
| 5 zardan sonra         | 1066 / 359 / 424 / 376 / 47 | 646 / 240 / 172 / 132 / 39    |
| Çıktıktan 30 sn sonra  | 1066 / 362 / 369 / 321 / 47 | 614 / 217 / 165 / 125 / 39    |
| Çıktıktan 2 dk sonra   | 1050 / 333 / 365 / 318 / 47 | 549 / 177 / 153 / 113 / 39    |

**Not, anahtar:** "Bütün kapsül Skia" uygulama yeniden başlayınca kapanıyor (anahtar bellekte tutuluyor). C2 ve C3'ün ilk koşusu bu yüzden anahtar kapalıyken alındı; sağ sütun odur. Açık hâl, yeniden başlatmadan sonra anahtar açılarak yeniden alındı.

### Yanıtlar

**DM'de Keşfet'e göre fazla olan ne?**

- **Ölçüldü:** komut gönderme 4 kat (7,4'e karşı 1,8 ms); doku çizimi kare başına 43'e karşı 18; yazı 19'a karşı 11; görünüm 368'e karşı 221.
- **Ölçüldü:** DM'de tam ekran boyunda bir ekran dışı çizim hedefi (9,8 MB) var, Keşfet'te yok.
- **Ölçüldü:** RenderThread'in DM'deki 7,8 ms'sinin 6,1 ms'si tampon beklemesi (Keşfet'te 1,2 ms); asıl çizim işi iki ekranda aynı (yaklaşık 2,8 ms).
- **Çıkarım:** yük GPU'nun kare başına doldurduğu piksel ve doku miktarında: tam ekran duvar kâğıdı, ekran dışı hedef ve 43 doku çizimi. GPU geride kaldığı için tampon bekleniyor. Kırpma ve yuvarlak köşe sayısı iki ekranda aynı.

**Görünüm sayısı farkı nereden?**

- **Ölçüldü:** şeridin konumu sayıyı iki hâlde de yaklaşık 800 oynatıyor (sağa 10 parça: kapalı 1062 → 1889, açık 627 → 1428).
- **Ölçüldü:** aynı konumda bütün Skia görünümü 400–1000 azaltıyor.
- **Ölçüldü:** 4.4'teki 794 ve 4.5'teki 1169 aynı konumda alınmadı (koşuların sonundaki şerit konumu farklıydı). Fark büyük ölçüde şerit karolarından geliyor.

**İlk zarın saniyesi hangi iş parçacığında?**

- **Ölçüldü:** UI iş parçacığında, `Record View#draw()` içinde (1,85 sn'nin 1,85'i CPU'da). JS aynı karede 0,5 sn çalışıyor ama kareyi tutan o değil.
- **Ölçüldü:** bu kez uzun kare ilk değil ikinci basışta geldi; üçüncüde yok.
- **Çıkarım:** her yeni görünüşün ilk çizimi, resmi hazırlanırken UI iş parçacığını bir kez kilitliyor.

**Bellek:**

- **Ölçüldü:** anahtar açıkken 5 zar belleği 428'den 1066 MB'a çıkarıyor; çıktıktan 2 dk sonra 1050 MB'ta kalıyor.
- **Ölçüldü:** artışın 322 MB'ı GL mtrack'te (GPU dokuları).
- **Ölçüldü:** anahtar kapalıyken aynı adımlarda 646 MB'a çıkıp 2 dakikada 549 MB'a iniyor.

## 4.7 Yenileme hızı: DM ve Keşfet; ters liste ve balon şekli (13 Kasım 2026, gece)

- **Derleme ve koşullar:**
  - Galaxy S23, 0.11.0 build 21, release.
  - İlk okumalar #625'ten önceki güncellemede alındı. Uygulama iki kez yeniden başlatılınca panelde "Ters liste" ve "Balon şekli" geldi; anahtarlı ölçümler ve tabanın tekrarı bu güncellemede.
  - Pil %100, USB'den şarjda (şarjsız sağlanamadı), sıcaklık 39–40 °C. Rahatsız Etmeyin açıldı, sonra eski hâline (kapalı) alındı.
- **Yöntem:**
  - **Hızda geçen süre:** SurfaceFlinger'ın her hızda geçen süre sayacı ("120.00 Hz: …"), eylemden önce ve sonra okundu; fark, o pencerede ekranın hangi hızda ne kadar kaldığını verir.
  - **Kaydırma ortası:** `renderRate`, etkin modun `vsyncRate`'i ve katmanların oy verdiği kare hızı (`frameRate:` satırları).
  - **Kaydırma:** 4.3'ün 1. hâlindeki DM'de 6 kez yukarı aşağı, `adb shell input swipe`. Keşfet'te 2a'nın kaydırması.
- **`dumpsys display` güvenilmez:** `mActiveRenderFrameRate` her durumda 120 gösterdi, ekran 24 Hz'deyken de. Bu yüzden kullanılmadı.

### Ekranın hızı

| An                                       | Hızda geçen süre (pencere yaklaşık 6 sn) | Kaydırma ortasında |
| ---------------------------------------- | ---------------------------------------- | ------------------ |
| Keşfet, dururken                         | 24 Hz %96, 120 Hz %4                     | 24 Hz              |
| Keşfet, kaydırırken                      | 120 Hz %96, 24 Hz %4                     | 120 Hz             |
| Mesajlar, dururken                       | 24 Hz %95, 120 Hz %5                     | 24 Hz              |
| DM'ye girerken (dokunuş ve açılış, 4 sn) | 120 Hz %29 (1,25 sn), sonra 24 Hz        | —                  |
| DM, dururken                             | 24 Hz %100                               | 24 Hz              |
| DM, kaydırırken (iki koşu)               | 120 Hz %97–99                            | 120 Hz             |

- **Katman oyları:** kaydırma sırasında hiçbir katman sıfırdan büyük kare hızı istemiyor (bütün `frameRate:` satırları 0 Hz, NoPreference ya da Default).
- **Ekrandaki pencereler:** gezinme çubuğu, durum çubuğu, Samsung kenar paneli, uygulamanın tek penceresi ve giriş katmanları. Klavye penceresi yok. Uygulamanın ikinci bir penceresi ya da yüzeyi yok.

### DM kaydırması: ters liste ve balon şekli (#625 sonrası; tam koşu 3 kez, kısa koşu aşamaları)

"Kapanınca koru" açık. Anahtar panelde işaretliyken o parça kapalı.

| Hâl                       | Hızda geçen süre | Kare p50 (ms) | Takılma % | Komut gönderme (ms, ortanca / p95) | Swap ve GPU (ms, ortanca / p95) | Kare toplamı (ms, ortanca / p95) | Görünüm |
| ------------------------- | ---------------- | ------------- | --------- | ---------------------------------- | ------------------------------- | -------------------------------- | ------- |
| Taban (hepsi açık)        | 120 Hz %97       | 13            | 89,0      | 7,40 / 9,12                        | 4,28 / 5,51                     | 16,50 / 16,96                    | 379     |
| Taban, tekrar             | 120 Hz %97       | 13            | 82,6      | 7,36 / 8,88                        | 4,49 / 5,45                     | 16,38 / 16,58                    | 368     |
| Ters liste kapalı         | 120 Hz %97       | 18            | 100       | 2,61 / 3,85                        | 13,27 / 14,28                   | 25,22 / 25,65                    | 412     |
| Ters liste kapalı, tekrar | 120 Hz %97       | 18            | 100       | 2,60 / 4,03                        | 13,09 / 14,19                   | 25,25 / 25,67                    | 409     |
| Balon şekli kapalı        | 120 Hz %98       | 13            | 81,7      | 7,40 / 9,10                        | 4,57 / 5,65                     | 16,36 / 16,54                    | 368     |
| İkisi kapalı              | 120 Hz %97       | 13            | 72,2      | 7,24 / 8,78                        | 4,46 / 5,48                     | 16,57 / 17,02                    | 431     |

### Parmakla kaydırma ve kaydırma hızı

**Parmakla (proje sahibi, aynı DM, bütün anahtarlar açık, iki koşu, yaklaşık 10 sn hızlı yukarı aşağı):**

| Koşu | Kare | Kare p50 (ms) | Takılma % | Komut gönderme / swap ve GPU / kare toplamı (ms, ortanca, son 120 kare) | Ekranın hızı (kaydırma süresi boyunca)                 |
| ---- | ---- | ------------- | --------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| 1    | 1173 | 12            | 31,4      | 7,23 / 3,32 / 16,78                                                     | Hareket sırasında 120 Hz; pencerede durulan süre 24 Hz |
| 2    | 1603 | 12            | 40,7      | 7,31 / 3,31 / 16,58                                                     | 120 Hz %54, 60 Hz %1 (0,3 sn), 24 Hz %45               |

- **Ölçüldü:** parmakla kaydırmada da her kare 16,6–16,8 ms, komut gönderme 7,2–7,3 ms; adb'nin hızlı kaydırmasıyla aynı. Takılma oranı daha düşük (%31–41), çünkü parmak kaydırmaları arasında duraklar ve kısa yavaş anlar var.
- **Ölçüldü:** ekran parmakla da 120 Hz'de; 60 Hz'e yalnız 0,3 sn indi (geçiş anı).

**Kaydırma hızı (adb):** aynı DM'de kaydırma hızı da değiştirildi. Aşağıdakilerin hepsi adb'den gönderilen yapay dokunuştur.

| Kaydırma                                                                         | Kare sayısı | Kare p50 (ms) | Takılma % | Not                                       |
| -------------------------------------------------------------------------------- | ----------- | ------------- | --------- | ----------------------------------------- |
| Hızlı (`swipe` 100 ms, 4.3 ve yukarıdaki tablo)                                  | 695–700     | 13–18         | 74–98     | Bırakınca liste savruluyor                |
| Orta (`swipe` 300 ms, 1,1 bin piksel)                                            | 1488–1496   | 13–18         | 65–98     |                                           |
| Yavaş (`swipe` 1500 ms, 1,1 bin piksel)                                          | 2747–2758   | 8             | 11–15     |                                           |
| Adım adım dokunuş (`motionevent`, kaydırma başına 16 ara nokta, yaklaşık 1,5 sn) | 400–482     | 5–6           | 2,5–4,8   | Parmağa en yakın, ama yine yapay ve yavaş |

Yavaş kaydırmada aşamalar (tek kaydırma): komut gönderme 2,11 ms, swap ve GPU 1,93 ms, kare toplamı 6,87 ms. Hızlı kaydırmada aynı sohbette 7,40, 4,28 ve 16,50 ms.

- **Ölçüldü:** DM'de karenin maliyeti kaydırmanın hızıyla büyüyor. Aynı sohbet ve aynı çizimlerle yavaş kaydırmada kare 6,9 ms (120 Hz bütçesinin içinde), hızlıda 16,5 ms.
- **Çıkarım:** her karede değişmeyen parçalar (duvar kâğıdı, bant, gölge, balon şekli) yükün kaynağı değil (4.4 B ve yukarıdaki tablo da bunu gösteriyor). Yük, hızlı kaydırmada kare başına ekrana yeni giren satırlarla geliyor: yeni balonların ilk çizimi, resimlerinin hazırlanması ve yüklenmesi. Sonraki ölçüm: savrulma sırasında kare başına kaç satırın bağlandığı ve kaç dokunun yüklendiği (`atrace`, "Texture upload" ve `mountViews` sayısı, hızlıya karşı yavaş).

### Yanıtlar

- **Ölçüldü:** DM kaydırırken ekran 120 Hz'de, 60 Hz'e inmiyor; hiçbir katman 60 istemiyor, klavye ya da başka pencere yok.
- **Ölçüldü:** DM'de ve Keşfet'te dururken ekran 24 Hz'e iniyor (Samsung'un hareketsiz içerik modu). Dokunuşla 120'ye çıkıyor; dokunuş bitince yaklaşık 1 sn içinde iniyor.
- **Çıkarım:** DM'deki 16 ms'lik kare, ekranın hızından değil, karelerin 120 Hz bütçesine (8,3 ms) sığmamasından: her kare iki tazelemeye yayılıyor (4.6: GPU geride, tampon bekleniyor).
- **Ölçüldü:** yavaş kaydırmada aynı DM'de kare 6,9 ms; 16 ms yalnız hızlı kaydırmada ve savrulmada çıkıyor.
- **Ölçüldü:** "Ters liste" kapatılınca (liste düz) kare 16,5'ten 25,2 ms'ye çıkıyor, yükü GPU'ya kayıyor (swap 4,4 → 13,2 ms, komut gönderme 7,4 → 2,6 ms). İki koşuda da aynı.
- **Ölçüldü:** "Balon şekli" tek başına kapatılınca kare değişmiyor (16,4 ms). İkisi birden kapalıyken kare yine 16,6 ms.
- **Çıkarım:** düz listede balon şekilleri GPU'da daha pahalı çiziliyor; balon şekli de kapalıyken bu pahalılık kalkıyor. Ters listenin kendisi kareyi ucuzlatmıyor, tersine çevirmenin kaldırılması tek başına daha kötü.

## 4.8 DM'de hızlı kaydırmanın 16,5 ms'si nereden (14 Kasım 2026)

- **Derleme ve koşullar:** Galaxy S23, 0.11.0 build 21, release, son OTA. Pil %89, USB'den şarjda (şarjsız sağlanamadı), sıcaklık 36 °C. Rahatsız Etmeyin açıldı, sonra eski hâline (kapalı) alındı. Bütün kaydırmalar adb ile; sohbet 4.3'ün 1. hâlindeki DM.
- **Yöntem:** `atrace` (gfx, view, sched) ve `debug.hwui.skia_atrace_enabled`; ayar sonra kapatıldı (okundu: false). Her RenderThread karesi (`DrawFrames`) için süre, ek ekran dışı geçiş (birden çok OpsTask), doku yüklemesi ve tampon bekleme okundu. Aynı pencerede UI iş parçacığının `mountViews` süresi, JS (`mqt_v_js`) ve UI'nın CPU süresi sched olaylarından toplandı. Kare zamanı kaydırma konumuyla şöyle eşlendi: liste ucunda Android'in esneme efekti her kareye bir ek ekran dışı geçiş ekliyor; ek geçişli kareler uçtadır (madde 3 bunu doğruluyor).
- **Uzun sohbet:** ölçülemedi. Hesabın en uzun sohbeti en alttan en üste yaklaşık 9 sürükleme × 1000 piksel, ekranın 3,4 katı. Uzatmak için mesaj yazmak, gerçek bir kişiye mesaj göndermek demek olduğu için yapılmadı. "Ortada" ölçümü bu sohbetin ortasında, uçlara değmeyen kısa savrulmalarla alındı.

### Önce bir düzeltme: 4.2–4.7'deki DM "takılma" oranları kare kaybı değil

- **Önceki tanımın eksiği:** 4.1'den beri "takılma", `gfxinfo` histogramında 12,5 ms'den uzun kareydi. Bu süre karenin dikey eşitlemeden bitişine kadar geçen süredir: içinde uygulamanın boş tampon beklemesi de var.
- **Android'in ölçtüğü:** Android'in kendi sayacı (`Janky frames`, FrameTimeline: kare ekrana zamanında çıktı mı) DM'nin hızlı kaydırmasında bütün koşularda %0,14. Parmakla %0,5–0,6, ters liste kapalıyken %0. Kaçan son tarih (`Frame deadline missed`) koşu başına 0–8.
- **Bu ölçümün zaman çizgisi:** RenderThread hızlı kaydırma boyunca saniyede 120 kare çiziyor (her 500 ms'de 60 kare).
- **Sonuç (ölçüldü):** DM hızlı kaydırmada 120 karede akıyor. 16,5 ms karenin gecikmesi (dokunuştan ekrana iki tazeleme); kaybolan kare değil.
- **Neden:** 4.6'daki "tampon bekleme" (`dequeueBuffer`, 3,7–4,4 ms) uygulamanın ekrandan önde gidip boş tampon beklemesidir. GPU'nun geride kalması değildir; 4.6'daki o çıkarım yanlış.
- **Takılma oranının bundan sonraki anlamı:** gecikmenin göstergesi. Kare kaybı için `Janky frames` (FrameTimeline) okunur. Kapsül düzenleyicide (4.2, 4.4, 4.5) bu sayaç da yüksek (%8–43), oradaki takılmalar gerçek kare kaybıdır.

### 1. Uç mu, orta mı

| Kaydırma                                | RT karesi | Saniyede kare | RT kare süresi (ortanca / p95, ms) | Ek geçişli (uç) kare | Uçtaki kare / öbürleri (ortanca, ms) | `Janky frames`        |
| --------------------------------------- | --------- | ------------- | ---------------------------------- | -------------------- | ------------------------------------ | --------------------- |
| Hızlı, uçlara değen (4.3'ün kaydırması) | 691       | 120           | 8,23 / 9,87                        | 89                   | 7,98 / 8,26                          | —                     |
| Hızlı, yalnız ortada (kısa savrulmalar) | 977       | 120           | 7,90 / 10,79                       | 0                    | — / 7,90                             | %0,26 (3 kare / 1164) |

- **Ölçüldü:** uçtaki kareler öbürlerinden pahalı değil; ortadaki hızlı kaydırma da saniyede 120 kare.
- **Konumla eşleme:** ek geçişli kareler zaman çizgisinde kaydırmanın başına ve sonuna toplanıyor (0,5–1 sn'de 41, 5,5–6 sn'de 29).

### 2. İkinci geçiş, hızlı ve yavaş

"Yalnız ortada" koşusu aynı bölgenin üstünden on iki kez geçer; satırlar ilk geçişten sonra bağlıdır.

| Kare başına              | Hızlı, uçlara değen (ilk geçişler)                          | Hızlı, ortada (aynı bölge tekrar)                              | Yavaş (1,5 sn'lik sürükleme)                                   |
| ------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| RT kare süresi (ortanca) | 8,23 ms                                                     | 7,90 ms                                                        | 6,21 ms                                                        |
| `mountViews` (UI)        | 0,44 ms (1996 çağrı / 691 kare)                             | 0,09 ms                                                        | 0,15 ms                                                        |
| JS CPU                   | 3,14 ms                                                     | 1,55 ms                                                        | 2,03 ms                                                        |
| UI CPU                   | 2,13 ms                                                     | 1,25 ms                                                        | 2,04 ms                                                        |
| RenderThread CPU         | 3,93 ms                                                     | 3,18 ms                                                        | 4,53 ms                                                        |
| Doku yüklemesi           | 0,10 (67 / 691)                                             | 0,03                                                           | 0,00                                                           |
| Tampon bekleme (ortanca) | 3,69 ms                                                     | 4,38 ms                                                        | 1,55 ms                                                        |
| RT'de en uzun üç dilim   | `Drawing` 4,01; `dequeueBuffer` 3,33; `queueBuffer` 2,29 ms | `dequeueBuffer` 4,34; `Drawing` 2,62; `flush commands` 1,34 ms | `Drawing` 3,91; `flush commands` 1,96; `dequeueBuffer` 1,70 ms |

- **Ölçüldü:** ikinci geçiş ucuz. `mountViews` 0,44'ten 0,09 ms'ye, JS 3,1'den 1,6 ms'ye, doku yüklemesi 0,10'dan 0,03'e iniyor; RT karesi aynı (7,9–8,2 ms).
- **Ölçüldü:** hızlı ile yavaş arasındaki fark çizimde değil. RenderThread'in kendi işi yavaşta bile aynı (`Drawing` 3,9–4,0 ms). Hızlıda fazla olan, tampon beklemesi (`dequeueBuffer`) ve ilk geçişte JS ile UI'daki satır bağlama işi.

### 3. Esneme (uçta basılı tutup germek, 5 sn)

| Ölçüm                          | Değer                                |
| ------------------------------ | ------------------------------------ |
| Kare sayısı / saniyede         | 703 / 120 (liste hareketsizken de)   |
| Ek ekran dışı geçişli kare     | 700 / 703 (kare başına 1 ek OpsTask) |
| RT kare süresi (ortanca / p95) | 5,02 / 8,92 ms                       |
| `mountViews`, JS CPU           | 0, 0,01 ms/kare                      |
| `Janky frames`                 | %0,14                                |

- **Ölçüldü:** liste gerili dururken bile her tazelemede yeniden çiziliyor (saniyede 120 kare) ve her kare bir ek ekran dışı geçiş kullanıyor. 4.6'daki ekran boyu ekran dışı hedef (9,8 MB) budur: Android'in esneme efekti.
- **Çıkarım:** kare kaybı yok; yalnız basılı tutulduğu sürece pil ve GPU kullanımı var.

### Yanıtlar

- **Ölçüldü:** yavaş kareler ne uçta ne ortada: DM hızlı kaydırmada her yerde saniyede 120 kare. 16,5 ms karenin gecikmesi, kaybı değil (`Janky frames` %0,14–0,26).
- **Ölçüldü:** ikinci geçiş ucuz: satır bağlama (`mountViews` 0,44 → 0,09 ms/kare) ve JS (3,1 → 1,6 ms/kare) iniyor.
- **Ölçüldü:** hızlıda fazla olan iş RenderThread'de değil (çizim yavaştakiyle aynı). İlk geçişte JS ile UI'da satır bağlama, her geçişte uygulamanın boş tampon beklemesi (`dequeueBuffer`).
- **Ölçüldü:** esneme her kareye ek ekran dışı geçiş ekliyor ve gerili listede çizimi sürdürüyor.

## 5. Düzeltme sırası

Ölçüme göre: önce en çok kare düşüren ve en ucuz olanlar. Her satır ayrı paket (dal ve PR); her paketten sonra aynı adım bölüm 4.1'deki gibi yeniden ölçülür. Bölüm 4.1 #611–#615'ten öncedir; o düzeltmelerin etkisi 0. satırda ölçülür.

| Sıra | Bulgu                                                    | Neden bu sırada                                                                      | Yayın                                |
| ---- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| 0    | Yeniden ölçüm: adım 2, 5 ve 6 (yapıldı, 4.2)             | A-12 ve A-28 kısmen düzeldi; A-21 düzenleyicide etki göstermedi, A-01 sıradaki iş    | Telefon                              |
| 1    | A-01, A-40 (büyük kapsülün çizimi)                       | En kötü ölçüm: saniyelere varan donma ve 1 GB bellek; büyük iş                       | OTA                                  |
| 2    | A-41 teşhisi, A-03 (duvar kâğıdı boyu)                   | DM'de bellek büyüyor; duvar kâğıdı yalnız dosya değişikliği                          | OTA                                  |
| 3    | A-06, A-31 (sohbet kaydırması)                           | DM'de karelerin %63'ü bütçe üstü                                                     | OTA (A-06'nın native kısmı build'de) |
| 4    | A-42, A-04, A-11 (zemin katmanları, alt sayfa, gölgeler) | Bütün ekranlarda GPU yükü; Ayarlar'da yavaş çizim komutu                             | OTA                                  |
| 5    | A-05, A-14 (Profil'in ilk açılışı)                       | Tek kare 93–109 ms, her soğuk açılışta                                               | OTA                                  |
| 6    | A-39 (Keşfet boşta çizim)                                | Kare düşürmüyor; pil ve ısı                                                          | OTA                                  |
| 7    | A-13, A-15                                               | Küçük ve bağımsız; ölçülmedi                                                         | OTA                                  |
| 8    | A-23, A-22, A-27, A-20 (masa ekranı); A-24, A-25 ölçümü  | Önce adım 8 bir mekanda ölçülür; A-24, A-25 (#613, #615), A-32, A-33 (#614) birleşti | OTA                                  |
| 9    | A-09 (açılış)                                            | Perfetto izi gerekir                                                                 | OTA                                  |
| 10   | A-08 (harita), A-07, A-18, A-19, A-26, A-30, A-35, A-37  | Kare düşüşü ölçülmedi ya da yok; liste uzadıkça önem kazanır                         | OTA                                  |
| 11   | A-10, A-06'nın native kısmı, A-38                        | Native build ister; bir sonraki build'de birlikte                                    | Native                               |
| 12   | A-34 (küçük fotoğraf kopyası)                            | Sunucu ve depolama kararı ister                                                      | OTA + sunucu                         |

## 6. Bu taramanın sınırları

- Bölüm 4.1'deki ölçümden önce "Kayıt" kanıtları proje sahibinin ekran kayıtlarındaki kare zamanlarıdır ve hangi derlemede alındıkları bilinmiyor.
- İkinci taramada oyun ekranları, Realtime ve derleyici okundu; önceki denetimin B16–B18'i yeniden doğrulandı. B1–B36'nın geri kalanından yalnız bu belgede anılanlar doğrulandı.
- A-21'in listesi derleyicinin depo dışında, NativeWind dönüşümü olmadan çalıştırılmasından gelir; kesin liste için günlük derlemeye bağlanmalı (A-17).
- A-21–A-38'deki süre ve bellek sayıları koddan ve dosya boylarından tahmindir; "ölçülecek" yazanların etkisi telefonda görülmeden bilinmez.
- Bundle boyutu ölçülmedi (derleme bu taramada yapılmadı); Atölye önizlemelerinin üretim paketine girip girmediği bilinmiyor.
