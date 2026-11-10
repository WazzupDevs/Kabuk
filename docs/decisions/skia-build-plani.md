# Skia build'i: plan (10 Kasım 2026)

Proje sahibinin onayı (10 Kasım): denetim belgesinin M3 kararı (hibrit grafik, seçenek B; `docs/denetim/uctan-uca-2026-11.md` → M3) bu planla uygulanır. Yalnız klip ya da maske içi hareketli aksesuarlar Skia ile çizilir, gerisi bugünkü SVG yolunda kalır; Skia'dan önce taban ölçüm alınır. Paketlerin güncel durumu `docs/PROGRESS.md`'nin başındaki tablodadır.

Kanıt sınıfları: **koddan** (ana dal `52f8378`, grep ve okuma), **paketten** (npm kaydı ve paketin kendi dosyaları), **belgeye göre** (denetim belgesi), **çıkarım** (doğrulanmadı).

## Kapsam

Skia'ya geçecek aksesuar 15 (koddan: `theme/capsuleAccessories.ts`'te kare yöntemli `data-fx` işaretleri; belgeyle aynı):

| Hareket      | Aksesuar                                                                                                                                                        | Klip                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `glint` (13) | Destansı takımların onu (`kis`, `buyucu`, `yildiz`, `korsan`, `dalgic`, `sef`, `doktor`, `rock`, `astronot`, `hawaii`), `ormanteni`, `geceteni`, `kunaikolyesi` | Takımlar `mask`; `kunaikolyesi`, `ormanteni` ve `geceteni` `clipPath` (P3'te doğrulandı: iki tende gövde yuvarlak dikdörtgeni) |
| `scan` (1)   | `neongozluk`                                                                                                                                                    | `clipPath`                                                                                                                     |
| `shift` (1)  | `gokkusagiatki` (üç grup)                                                                                                                                       | `clipPath` (üç ayrı)                                                                                                           |

- Üç hareket de yalnız ötelemedir (`theme/capsuleFx.ts` → `FX.glint`, `scan`, `shift`: `tx` ya da `ty`).
- Aksesuar çizimlerinde filtre, karışım modu, metin ve resim yok; `mask` tanımı 12. Takım maskesinin içi iç içe `clipPath`, `transform` ve çizgi taşır.
- Set balonları (`theme/setBalloons.ts`) kare yöntemi kullanmaz; kapsam dışı.
- Skia yalnız büyük boyda çizer: Süsle'nin büyük kapsülü (~208 dp), sonra açılan paket kartı (~232 dp) ve profil bileti. Masa, oyun ve sohbet avatarları kırpılmış kare yolunda kalır; küçük avatarlarda Skia, ölçüme göre ayrı karardır (P9).

## Riskler

| Risk                    | Kanıt                                                                                                                                                                                              | Azaltma                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Çizim aynılığı          | Skia 2.6.2 paketinde `SkSVGMask.h` ve `SkSVGClipPath.h` var (paketten); davranışın aynı olduğu doğrulanmadı                                                                                        | Maske ve içerik ayrı çizilir; maskenin yalnız beyaz olduğu testle denetlenir; telefonda 15 aksesuar yan yana |
| Paket boyutu            | AAB'de ~4 MB, arm64 (belgeye göre). arm64 statik kitaplıklar: `libskia` 24,5 MB, `libskottie` 9,8, `libsvg` 9,1, `libskshaper` 8,7, `libsksg` 8,5 (paketten); bağlanınca kalan ölçülmedi           | `apk.yml` çıktısında önce ve sonra boyut                                                                     |
| Yamalı react-native-svg | Yama yalnız `SvgView.java`'ya dokunur (koddan); ortak dosya yok. Canvas'ın SVG katmanları arasındaki sırası ve saydamlığı denenmedi                                                                | Eski kare yolu yerinde kalır; telefonda bakılır                                                              |
| React sürümü            | Skia `react-reconciler` 0.31.0 getirir (paketten); uygulama React 19.2.3; uyum doğrulanmadı                                                                                                        | Build'de tek Canvas'lı duman testi; shared value render'da okunmaz (React Compiler)                          |
| Reanimated              | Expo 57.0.26 Skia 2.6.2'yi sabitler (`bundledNativeModules.json`); peer `reanimated >=3.19.1`, bizde 4.5.1. Bugünkü saat RN Animated'dır; Skia shared value ister: ikinci saat                     | 2.6.2 kullanılır; saat, şerit (`lane`) ve duraklatma kuralları testli                                        |
| Düşük donanım           | Her Canvas ayrı yüzey (belgeye göre)                                                                                                                                                               | Skia yalnız büyük boyda (ekranda 1–2 Canvas); ölçüm şart                                                     |
| Lisans                  | Skia paketi MIT (`LICENSE.md`), Android ve Apple ön derlemeleri MIT, `react-reconciler` MIT, `canvaskit-wasm` BSD-3 (paketten). `libskia.a`'ya gömülü üçüncü tarafların lisans dosyası pakette yok | Okundu (11 Kasım): "Skia'nın üçüncü taraf lisansları"; zorunlu copyleft yok                                  |
| pnpm 10                 | `onlyBuiltDependencies` yalnız `supabase` (koddan); Skia'nın `postinstall`'ı (`install-libs.js`, Apple çerçeveleri) çalışmaz                                                                       | Listeye eklenir; Android'i `apk.yml` gösterir                                                                |
| R8                      | Pakette proguard dosyası yok (paketten); `apk.yml` release'i derler, çalıştırmaz                                                                                                                   | Açılış telefonda denenir; gerekirse keep kuralı aynı build'e                                                 |
| OTA kesintisi           | `version` artınca OTA yalnız yeni build'e gider (`.claude/skills/yayin`)                                                                                                                           | Native PR, proje sahibi build almaya hazırken birleşir                                                       |

## Build

Tek native PR (P5), `version` 0.10.0 → 0.11.0:

1. `@shopify/react-native-skia` 2.6.2. Gerekçe: M3 kararı; Expo 57'nin sabitlediği sürüm; MIT.
2. Kök `package.json` → `pnpm.onlyBuiltDependencies`'e Skia.
3. `ShadowPictures`'a `onTrimMemory` (M13-15; Kotlin).
4. Ölçüm panelinde tek Canvas'lı Skia duman testi (yalnız preview).
5. R8 keep kuralı, yalnız gerekirse.

Build bir kez istenir: P5 ve P6 birleşince. Android ve iOS aynı `version`'la alınır (Play ve Apple geliştirici ücretleri ödendi; proje sahibi, 10 Kasım).

**Anahtar.** `src/theme/` altında `CAPSULE_SKIA` sabiti (`TAB_BAR_GLASS` gibi; başta `false`), OTA ile açılır ve kapanır. Preview'da ölçüm panelinde `skia` anahtarı: aynı telefonda SVG ve Skia, OTA beklemeden karşılaştırılır. Skia modülü yüklenemezse çizim kare yoluna düşer.

**Geri alma.** Önce anahtar kapatılır (OTA). Eski kare yolu geçiş bitene kadar silinmez (M3 kararı: eski çizim desteği geçiş tamamlanmadan kaldırılmaz). Native geri alma: bağımlılığı kaldıran revert, `version` 0.12.0 ve yeni build.

## Paketler

Her paket main'den ayrı dal ve tek PR. Kodu `mobil` ajanı yazar (bu işte kapsamı yerel modül ve paylaşılan kod dahil); orkestra oturumu paketi tanımlar, farkı okur, `pnpm check`'i koşar, birleştirir. Zor paket Opus, kolay paket Sonnet; paket başına tek ajan çağrısı hedeflenir.

| #   | Paket                                                                                                                                | Yayın        | Model                                               | Kabul ölçütü                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------ | --------------------------------------------------- | --------------------------------------------------------------------------- |
| P0  | Bu belge, `PROGRESS` tablosu, kapsül ölçüm protokolü                                                                                 | Belge        | Orkestra                                            | `ci` yeşil                                                                  |
| P1  | Ölçüm sahnesi (panelde seçilen aksesuarla büyük kapsül, 12 avatarlı ızgara, sayılar ekranda) ve M15-26                               | OTA          | Sonnet; kök nedeni orkestra verir, bulunamazsa Opus | Büyük önizlemede göz ve baş aksesuarı çizilir; sahne üretimde görünmez      |
| T0  | Proje sahibi: taban ölçüm (`docs/denetim/olcum-protokolu.md` → Kapsül ölçümü)                                                        | Telefon      | —                                                   | Sayılar belgede                                                             |
| P2  | Skia'dan bağımsız düzeltmeler: M3-02 ve M15-46'nın ilk maddesi (gizli sıcak kart), M3-12 ve M1-11, M3-05, M3-07, M3-08, M3-09, M3-10 | OTA          | Sonnet (bilinen yerler, küçük değişiklikler)        | Her madde için test ya da koddan gösterim                                   |
| P3  | "Klip içi hareket" katman türü: saf TypeScript, testli; kare yolu bu türden beslenir ve klibin kutusuna kırpılır                     | OTA          | Opus (katman türü; 15 çizimin kesimi)               | 15 aksesuarın hepsi türü üretir; maske yalnız beyaz; telefonda eskiyle aynı |
| P4  | Yalnız görünen avatar hareket eder (M1-10), Süsle karoları (M3-06), M3-13; Süsle'nin küçükleri: M15-27, M15-28, M15-30               | OTA          | Sonnet                                              | Ekran dışındaki avatarın saati durur; karo sayısı pencereyle sınırlı        |
| T1  | Proje sahibi: ölçüm tekrarı                                                                                                          | Telefon      | —                                                   | T0 ile karşılaştırma                                                        |
| P5  | Native: "Build" başlığındaki liste                                                                                                   | Build        | Opus (native yapılandırma, Kotlin)                  | `apk.yml` ve `ci` yeşil; lisans listesi bu belgede                          |
| P6  | Skia çizicisi, anahtarın arkasında (kapalı); yalnız Süsle'nin büyük kapsülü; yan yana galeri                                         | 0.11.0'a OTA | Opus (Skia çizicisi, saat)                          | Anahtar kapalıyken davranış değişmez                                        |
| T2  | Proje sahibi: 0.11.0 build'i (Android ve iOS), yan yana karşılaştırma, ölçüm                                                         | Telefon      | —                                                   | 15 aksesuar aynı; ölçüm iyileşmiş                                           |
| P7  | Karşılaştırmanın düzeltmeleri; anahtar Süsle'de açılır                                                                               | OTA          | Sonnet; çizim farkı çıkarsa Opus                    | Proje sahibinin onayı                                                       |
| P8  | Açılan kart ve profil bileti (M3-04 burada ölçülür)                                                                                  | OTA          | Sonnet; `LayeredLook`'un iki yarısı zorlarsa Opus   | Telefonda doğrulama                                                         |
| P9  | Küçük avatarlarda Skia                                                                                                               | —            | —                                                   | T1 ve T2'ye göre karar; şimdilik paket değil                                |

- T0 gelmeden P2 birleşmez (taban kaybolmasın).
- Hiçbir paket `supabase/`'e, Realtime'a ya da değişmez kurallara dokunmaz; dokunan çıkarsa birleşmeden önce `guvenlik`'ten geçer.
- iPhone'da SVG ve Skia karşılaştırması 0.11.0 iOS build'inde, paneldeki `skia` anahtarıyla yapılır; iOS'ta SVG yaması yoktur (M3-14), taban orada ilk kez ölçülür.

## P3'ün sonuçları (10 Kasım)

- Tür: `theme/capsuleFx.ts` → `FxInside` (`kind: 'inside'`): hareket, klip (`clipPath` ya da `mask`, tanımıyla), ötelenmemiş içerik, içeriğin biriminden kök kutuya matris, klibin kutusu. Kare yolu (`insideCuts`) ve P6'nın Skia çizicisi aynı türden beslenir. Kutu hesabı `theme/svgBox.ts` (elle, bağımlılıksız; tutucu).
- Klip dağılımı (koddan, testli): 10 `mask` (takımlar), 7 `clipPath` (`kunaikolyesi`, `ormanteni`, `geceteni`, `neongozluk`, `gokkusagiatki` üç grup).
- Kırpma kare başınadır: her kare, klibin kutusuyla içeriğin o karedeki kutusunun kesişimine kırpılır, hiçbir şey göstermeyen kare görünüm kurmaz. 208 dp avatarda, 3x'te (koddan hesap): `kistakimi` 18 tam boy görünümden 10 görünüme, çizilen alan kare başına ortalama avatarın %15'i; öteki takımlar %3–14; `gokkusagiatki` üç grupta %4, %5, %22 (görünüm sayısı 72, değişmedi).
- Aynılık (tarayıcıda, Chromium; telefonda değil): 15 aksesuar, üç çizim biçimi, 2,625x ve 3x, 2.640 kare; eski tam boy kareyle kırpılmış kare arasında 33,4 milyon boyalı pikselde 608 piksel belirgin farklı (kenar yumuşatması). Telefondaki çizim T1'de bakılır.
- Maske yalnız beyazdır (dolgu ve çizgi beyaz ya da yok, gradyan yok; testli). Dört takımın maskesinde `opacity` vardır (`kistakimi` .16 ve .35, `yildiztakimi` .8, `dalgictakimi` .7, `astronottakimi` .88 ve .9): maske takımın kendisinin beyaza boyanmış hâlidir, yarı saydam parçada parıltı o kadar soluktur. P6 maskeyi alfa maskesi olarak çizer (opaklık dahil); değerler testte sabit.
- P6 için: `kistakimi`, `buyucutakimi` ve `korsantakimi` maskelerinin içinde iç içe `clipPath` var.

## P5'in sonuçları (10 Kasım)

- Eklendi: `@shopify/react-native-skia` 2.6.2 (Expo 57.0.26 `bundledNativeModules.json`'daki sürüm, paketten); geçişliler `react-reconciler` 0.31.0 ve `scheduler` 0.25.0 (MIT), `canvaskit-wasm` 0.41.0 ve `@webgpu/types` 0.1.21 (BSD-3), `react-native-skia-android`, `-apple-ios`, `-apple-macos`, `-apple-tvos` 147.1.0 (MIT). `version` 0.11.0.
- `postinstall` (`install-libs.js`, koddan ve kurulum çıktısından): ağdan indirmez; ön derleme paketlerindeki Apple `xcframework`'lerini ve Android statik kitaplıklarını (dört ABI) paketin `libs/` klasörüne kopyalar (yerelde 713 MB); Android Gradle `libs/android`'i okur. Ön derleme paketlerinin kendi betiği yok.
- R8: keep kuralı eklenmedi. JNI'nin adla bulduğu sınıflar (`SkiaManager`, `PlatformContext`, `SkiaPictureView`) ve çağırdığı yöntemler, alanlar (`mHybridData`) `@DoNotStrip`'li ya da `native` yöntemlidir (paketten); React Native'in consumer kuralları iki `DoNotStrip`'i de tutar, `proguard-android.txt` `native` yöntemli sınıfların adını tutar (paketten ve Expo şablonundan). Release'te açılış yine telefonda denenir (doğrulanmadı).
- `ShadowPictures` bellek baskısında (`TRIM_MEMORY_RUNNING_LOW` ve üstü, `onLowMemory`) önbelleği boşaltır; resimler `recycle` edilmez. Kayıt `SkallGlassModule` → `OnCreate`/`OnDestroy`. Derlenmedi (bu ortamda Android yok; `apk.yml` derler).
- Ölçüm panelinde duman testi (tembel `import()`, hata sınırı); `apk.yml` APK boyutunu yazar. Telefonda çizim, boyut farkı ve React 19.2.3 ile `react-reconciler` uyumu ölçülmedi.

## Skia'nın üçüncü taraf lisansları (11 Kasım)

P5'ten önce okundu. Kaynak: `Shopify/react-native-skia` `v2.6.2` etiketi → `packages/skia/scripts/skia-configuration.ts` (derleme bayrakları), Skia'nın o etiketteki commit'i `4502f88` → `DEPS`, `gn/skia.gni` ve `BUILD.gn` (varsayılanlar, hangi kitaplığın bağlandığı). Lisans metinleri her kitaplığın GitHub'daki kendi deposundan, ana daldan okundu (`DEPS`'teki commit'ten değil; `googlesource.com` bu ortamdan açılmıyor). `dng_sdk` AOSP'nin bir GitHub aynasından (`GrapheneOS/platform_external_dng_sdk`, 1.4.0) okundu. `libskia.a`'nın içine gerçekten neyin girdiği ikiliden doğrulanmadı; liste derleme bayraklarından çıkarımdır.

| Kitaplık      | Android | Apple | Lisans (okunan metin)                                                    | Copyleft                          |
| ------------- | ------- | ----- | ------------------------------------------------------------------------ | --------------------------------- |
| Skia          | var     | var   | BSD-3-Clause                                                             | Hayır                             |
| FreeType      | var     | yok   | FTL ya da GPLv2, kullanan birini seçer                                   | Seçmeli; FTL (BSD benzeri) alınır |
| HarfBuzz      | var     | var   | "Old MIT"                                                                | Hayır                             |
| ICU           | var     | yok   | Unicode-3.0 ve ICU lisansı                                               | Hayır (aşağıdaki not)             |
| libgrapheme   | yok     | var   | ISC                                                                      | Hayır                             |
| libjpeg-turbo | var     | var   | IJG ve BSD-3-Clause                                                      | Hayır                             |
| libpng        | var     | var   | PNG Reference Library License v2                                         | Hayır                             |
| libwebp       | var     | var   | BSD-3-Clause                                                             | Hayır                             |
| zlib          | var     | var   | zlib                                                                     | Hayır                             |
| expat         | var     | var   | MIT                                                                      | Hayır                             |
| piex          | var     | var   | Apache-2.0                                                               | Hayır                             |
| wuffs         | var     | var   | MIT ya da Apache-2.0                                                     | Hayır                             |
| dng_sdk       | var     | var   | Adobe DNG SDK License Agreement (özel lisans; ayrıca DNG patent lisansı) | Hayır                             |

- **Sonuç:** okunan hiçbir metinde zorunlu copyleft (GPL, AGPL, LGPL, MPL) yok; paket durmadı. FreeType çift lisanslıdır ve FTL seçilir; GPLv2 yalnız seçenektir.
- ICU'nun lisans dosyası GPL'li üç derleme betiğini (`aclocal.m4`, `config.guess`; Autoconf istisnasıyla) sayar; bunlar derlenen kaynak değildir (lisans metnine göre; ICU'nun derlemesi okunmadı).
- Kapalı olduğu okunanlar: Vulkan, Dawn ve Graphite, libavif, libjxl, ffmpeg, Lua, PDF, araçlar. `perfetto` (Apache-2.0) Android'de bayrak olarak açık, `BUILD.gn`'de yalnız test kitaplığına bağlı görünüyor (dosyanın ilk üçte biri okundu, gerisi özetten: çıkarım).
- Copyleft olmayan ama yükümlülük getirenler (proje sahibine bildirildi, 11 Kasım): `dng_sdk`'nin 5. maddesi ticari üründe dağıtana Adobe'yi tazmin yükümlülüğü yazar ve AOSP bu paketi "özel lisans koşulları" diye işaretler; FreeType (FTL), libjpeg (IJG), ICU ve Adobe bildirim metni ister. Uygulamada açık kaynak bildirimleri ekranı yok; mağaza yayınından önce ayrı iş.

## M15'in kapsül bulguları

- Skia'dan bağımsız, önce: M15-26 (P1), M15-46'nın ilk maddesi (P2), M15-27, M15-28, M15-30 (P4). M15-26'da kaybolan iki aksesuar (`ayisigigozleri`, `elfkulaklari`) kare değil taşıma hareketi kullanır (koddan); hata bugünkü hareketli SVG yolundadır.
- Bu planın dışında: M15-43 (süs figürlerinin yerleşimi), M15-45 (simge ve avatar), M15-46'nın kalan maddeleri, M15-08 ve M15-09 (sunucu değeri), M3-11 (Y20).
