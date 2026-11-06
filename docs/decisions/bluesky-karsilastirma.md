# Bluesky social-app ile skall karşılaştırması (6 Kasım 2026)

Proje sahibinin isteği: Bluesky neden daha akıcı ve kararlı; düzen, işleyiş ve kod farkları. Kaynak `github.com/bluesky-social/social-app` (main, 6 Kasım), yalnızca okundu. Lisans kuralı gereği oradan hiçbir şey kopyalanmaz, yalnızca yöntem öğrenilir (`.claude/skills/telegram-referans`).

## Yığın

|                              | Bluesky                                  | skall                                      |
| ---------------------------- | ---------------------------------------- | ------------------------------------------ |
| Expo / RN                    | 58 / 0.88                                | 57 / 0.86                                  |
| Reanimated / Gesture Handler | 4.7 / 3.3                                | 4.5 / 2.32                                 |
| Gezinme                      | react-navigation native-stack (doğrudan) | expo-router (aynı native-stack'in üstünde) |
| React Compiler               | açık                                     | açık                                       |
| Klavye                       | react-native-keyboard-controller         | aynı                                       |

Yığın neredeyse aynı. Fark kütüphanede değil, ekranda ne kadar iş yapıldığında.

## Akıcılık farkı nereden geliyor

1. **Sekme değişimi.** Bluesky sekmeyi anında gösterir; hiçbir geliş hareketi yok. Bizde her sekme açılışında ekran 450 ms'de aşağıdan çıkar, solarak gelir ve native bulanıklıktan açılır (`TabScene` → `Dissolve`, `MOTION.dissolve`), üstüne ekranın parçaları sırayla gelir (`Screen` → `cascade`, `Rise`). Her geçişte 10–20 parça hareket ediyor; bunların bir kısmı açılışta JS'te başlıyor.
2. **Ekran açılışı.** Bluesky: native-stack'in kendi Android geçişi, içerik hemen yerinde. Bizde: `slide_from_right` ve içerikte yine sıralı geliş.
3. **Cam ve gölge.** Bluesky Android'de bulanıklık kullanmaz: düz yüzey ve ince (hairline) çizgi. Bizde kartlar, sekme çubuğu ve alt sayfalar buzlu cam (`LiquidGlassView`, `GlassTargetView`), bulutlu zemin, dokuz parçalı gölge. Her biri GPU'da ekstra çizim ve yeniden çizim tetikleyicisi.
4. **Basma geri bildirimi.** Bluesky'nin sekme ve kart basışı (`PressableScale`) UI iş parçacığında 100 ms'de %98'e iner; JS meşgulken de akar. Bizim `usePressScale` hareketsiz %97'ye atlar ve render'a bağlıdır: JS meşgulken basış geç görünür.
5. **Alt sayfalar.** Bluesky Android'de Material `BottomSheetDialog` kullanır (kendi native modülü): sürükleme, fırlatma ve geri tuşu native. Bizde sayfalar JS'te çizilen rota sayfaları (`RouteSheet`, `Sheet`).
6. **Yükleme.** Bluesky içeriğin şeklinde iskelet (skeleton) gösterir ve React Query önbelleğini telefona yazar; soğuk açılışta son veri hemen görünür. Bizde önbellek yalnız DM'de; `Loader` 300 ms sonra çıkar ve en az 600 ms kalır. Algılanan bekleme daha uzun.
7. **Sohbet ve klavye.** Bluesky klavyeyi parmakla aşağı çekerek kapatır (`KeyboardGestureArea`, `keyboardDismissMode="interactive"`). Liste ters çevrilmemiş: `maintainVisibleContentPosition` ve 32 satırlık ilk çizimle çalışır. Bizde liste ters (`inverted`), klavye sürüklemeye başlayınca bir kerede kapanır (`on-drag`).

## Düzen ve ölçüler

|                       | Bluesky                                                                                                                                     | skall                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Başlık                | `Layout.Header` tek bileşen: 48–52 yükseklik, 33'lük yuva, geri oku 24 ikon, dokunma alanı hitSlop ile büyür                                | `Screen` → `top`, `PageTop`, `ProfileTopBar`, `HidingHeadScreen`; yuvarlak düğme 44                                                                      |
| Düğme                 | Tek `Button`: `size` (tiny, small, medium, large), `variant`, `color`, `shape`. Yükseklik sabit değil, iç boşlukla belirlenir (large 12/24) | Tek `Button`, sabit yükseklik 48 ve 36 (`KIT.size`); kaplama `buttonFill.ts`                                                                             |
| İkon ölçeği           | Tek ölçek: 8, 12, 16, 20, 24, 28, 32, 48, 64; varsayılan 20                                                                                 | İki ölçek yan yana: `ICON` (12, 16, 20, 24, 28; varsayılan 20) ve `KIT.size` (icon 22, iconSm 18, iconSnug 20, lrIcon 24…), ayrıca ekran başına sabitler |
| Sekme çubuğu          | Tam genişlik, ince üst çizgi, ikon 28 (her ikon optik olarak ±1–3 px düzeltilmiş), sayaç rozeti                                             | Yüzen cam kapsül 64, sekme 48, ikon 24, kayan beyaz disk                                                                                                 |
| Sohbet listesi satırı | Avatar 52, basınca zemin hafif koyulaşır, uzun basış menüsü                                                                                 | Avatar 48, Telegram'ın ince satırı (9 üst ve alt)                                                                                                        |
| Token'lar             | Ayrı paket (`@bsky.app/alf`): boşluk, köşe, yazı ve renk atomları                                                                           | `theme/tokens.ts` + `theme/auraKit.ts` (766 satır, ekran başına çok sayıda tek seferlik ölçü)                                                            |

## İşleyiş farkları

- **Sekmeye yeniden basmak:** Bluesky'de sekmenin ilk ekranındaysan listeyi başa kaydırıp yeniler (soft reset); içerideysen ilk ekrana döner. Bizde yalnız ilk ekrana döner; ilk ekrandayken hiçbir şey olmaz.
- **Her sekmenin kendi yığını:** Bluesky'de beş sekmenin beşi de ayrı yığın. Bizde Keşfet, Mesajlar ve Profil'in yığını var; Aktiviteler ve Mekan'dan açılan ekranlar sekmelerin dışında, ortak yığına gider.
- **Dokunsal:** Bluesky yalnızca uzun basışta ve birkaç anda titreşir. Bizde her sekme değişimi titreşir (`tabChanged`).
- **Yenileme:** Bluesky native `RefreshControl`. Bizde kendi çekme göstergemiz (`PullScroll`, UI iş parçacığında, akıcı ama bakımı bizde).

## Neyi daha temiz yapıyorlar

1. Tek ikon ölçeği ve tek başlık bileşeni: ekran kendi ölçüsünü uydurmuyor.
2. Hareketi az ve UI iş parçacığında kullanıyorlar; içerik gelişini süslemiyorlar.
3. Platformun hazır parçasını kullanıyorlar: native alt sayfa, native yenileme, native-stack geçişi.
4. Önbelleği telefona yazıp iskelet gösteriyorlar: ekran hiç boş kalmıyor.
5. Token'ları ayrı bir pakette tutuyorlar; ekrana özel sayı neredeyse yok.

## Bizde daha iyi olan

- Sohbetin sona tutunması, okunmamış çizgisi ve "beklerken basılamaz" düğme kuralı Bluesky'den daha sıkı.
- Erişilebilirlik ve 320 dp kuralları yazılı ve testli.

## Öneriler (henüz yapılmadı, proje sahibinin seçimi)

Proje sahibi seçmeden hiçbiri yapılmaz. Hareketle ilgili olanlar tuvalin hareket filmini (`hareket.json`) değiştirir, bu yüzden tuvalde de değişmesi gerekir.

| No  | Öneri                                                                                 | Etki                                 | Gerekli                                                                                                       |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Ö-1 | Basma geri bildirimini UI iş parçacığına almak (`usePressScale` → Reanimated, 100 ms) | Her düğme ve kart akıcı basar        | Yalnız kod, hareket aynı                                                                                      |
| Ö-2 | Sekme değişiminde bulanıklığı ve sıralı gelişi kaldırmak ya da kısaltmak              | En büyük akıcılık kazancı            | Tuvalin hareket filmi değişir                                                                                 |
| Ö-3 | Sekmeye yeniden basınca başa kaydırma ve yenileme                                     | Bluesky'deki gibi alışılmış davranış | Ürün davranışı, SPEC'e yazılır                                                                                |
| Ö-4 | React Query önbelleğini telefona yazmak; ilk açılışta son veri                        | Soğuk açılışta boş ekran yok         | Yeni bağımlılık (`@tanstack/query-async-storage-persister`, MIT); anonimlik ve çıkışta silme kuralına bakılır |
| Ö-5 | Liste ekranlarında `Loader` yerine iskelet                                            | Algılanan hız                        | Tuvalde iskelet panosu gerekir                                                                                |
| Ö-6 | Sohbette klavyeyi parmakla kapatmak (`interactive` + `KeyboardGestureArea`)           | Telegram ve Bluesky gibi klavye      | Yalnız kod                                                                                                    |
| Ö-7 | İkon ölçeğini teke indirmek (`ICON`); `KIT.size.icon*`'ı ona bağlamak                 | Tutarlı ikonlar                      | 22 ve 18 ölçüleri 20 ve 16'ya yuvarlanır; tuvalle karşılaştırılır                                             |
| Ö-8 | Alt sayfaları native Material alt sayfaya almak                                       | Sürükleme ve geri tuşu native        | Yerel modül, native build; büyük iş                                                                           |
| Ö-9 | Expo 58, RN 0.88, Gesture Handler 3'e geçmek                                          | Bluesky'nin çalıştığı sürümler       | Native build, ayrı paket                                                                                      |
