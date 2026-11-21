# Grup 09 — pano–kod denetimi (73–85)

Genel not: 73–80 aynı iskeleti (Kapsülünü süsle) paylaşır; ortak farklar yalnız 73'te tam yazıldı, sonrakilerde "bkz 73 #n". Her panoda yine denetlendi. Tüm farklar koddan (kod okundu, telefon görüntüsü yok); "görüldü" sınıfı yoktur. Pano değerleri css'ten çözüldü (skall.css, ekran.css, koyu.css, pano `<style>`). Panoda `.tb` (sekme çubuğu) css'i var ama bu panolarda çizilmiyor; kod `useHideTabBar` ile gizliyor: uyuyor.

Kısaltmalar: CE = apps/mobile/src/theme/capsuleEdit.ts, AK = apps/mobile/src/theme/auraKit.ts, CAP = apps/mobile/app/(app)/(tabs)/profile/capsule.tsx, ACC = apps/mobile/app/(app)/(tabs)/profile/accessories.tsx, ST = src/features/capsule/SusleTabs.tsx, SF = src/features/capsule/SusleFilter.tsx, CT = src/features/capsule/CatalogTile.tsx, BG = src/theme/buttonGlass.ts.

## 73 Kapsülünü süsle · Göz sekmesi — project/SusleGoz.dc.html
Kod: CAP (Editor, OptionArt), ST, SF, src/motion/SnapStrip.tsx, src/motion/TopBar.tsx (PageTop inline), src/features/capsule/tileArt.ts, options.ts
Öğe sayısı: 33 · uyuyor: 4 · fark: 27 · fazla: 2 · doğrulanamadı: 1
Uyuyanlar: geri düğmesi 44 (KIT.size.round), sekme sayısı/sırası (Renk, Göz, Baş, Yüz, Ağız, Gövde; CAPSULE_CATALOG), sekme alt çizgisi (3 yüksek, %22–%78, ink), nadirlik noktası (9×9, 45°, r2, #FFB547/#7B5CFF; TIER_COLOR). Metinler Hepsini çıkar, Rastgele, Tümüne bak, Tümü, Göz sekme adları uyuyor. "Göz" sekmesinde "boş" seçeneği yok: uyuyor (options.ts:55 `slot !== 'e'`).
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | Sayfa başlığı metni | metin | "Kapsülünü süsle" | "Kapsülün" (tr.ts:736 `capsule.title`; CAP:478). `capsule.edit` = "Kapsülünü süsle" (tr.ts:735) kullanılmıyor |
| 2 | Başlık yazısı | yazı | 700 19/24, harf -.3px (`.ptb h1`) | pageBarTitle 700 21/26 (AK:197; TopBar.tsx:125) |
| 3 | Bar yan boşluğu | boşluk | 20 (`.ptb` padding 0 20) | 16 (CE:36 `barSide`; CAP:474) |
| 4 | Kaydet düğmesi boyu ve yazısı | ölçü | 40 yüksek, padding 18, 600 15/20 | 44 (`bar={KIT.size.round}`, CAP:485), yazı 16/20 (KIT_TYPE.btn, AK:281; `big` olunca btn tipi, kit.tsx:361-376). Boşta en az genişlik 96 (AK:667), panoda 92 yalnız bekleme hâlinde |
| 5 | Kapsül ve mor hale boyu | ölçü | hero kutusu 340×340, kapsül resmi 290 yüksek, hale diski 340 | kapsül 212 (capsuleStage 220 − 2×capsuleRing 4, AK:970,976; CAP:313), hale 258 (CE:30, 220×340/290) |
| 6 | Sahne yüksekliği, tepsi konumu | düzen | bar altından 428 aşağıda tepsi (hero margin 10, hero 340, hacts margin 12 + 36, tepsi top 528 mutlak) | padTop 16 + sahne 300 + panel.top 18 = 334 (CE:30,36,44; CAP:511,609); sahne 0.7–1 ölçeklenir (CAP:88,450). Tepsi panodan yaklaşık 94 dp yukarıdan başlar, kapsül 70 küçük |
| 7 | Kapsül altı gölge | fazla | yok (hero'da yalnız hale + resim) | FloatStage gölgesi 120×16 nefes alan (CE:34; CAP:530-538) |
| 8 | Kapsüle dokununca duygu (balon, hareket, 1850 ms) | fazla | yok | CAP:281-293, `label=tr.capsule.tapHead` |
| 9 | Hepsini çıkar / Rastgele yazısı | yazı | 600 13/16 | coverBtn 700 13.5/17 (AK:181; CAP:572-595) |
| 10 | Bu iki düğmenin iç boşluğu | boşluk | 0 14 (iki yanı 14), gap 6, ikon 16 | sol 12 sağ 14 (CE:31 `clear`) |
| 11 | Bu iki düğme, koyu | koyu | #121614 dolgu, kenar rgba(255,255,255,.08), yazı #EEF3F0 | clear koyu rgba(18,22,20,.62), kenar .10 (BG:72-80); geri düğmesi koyu da aynı (#121614/.10, AK:528-530; panoda kenar .08) |
| 12 | Tepsi köşe ve üst boşluk | ölçü | köşe 28 (üstte), padding-top 8 | 34 (CE:44 `panel.radius`), padTop 16 (CE:44) |
| 13 | Tepsi dolgu ve gölge, açık | renk | #FFFFFF düz, gölge 0 -6 24 rgba(3,27,11,.06) | rgba(255,255,255,.72) + iç ışık "inset 0 1 0 #FFF", gölge 0 -10 30 .08 (CE:97-101; CAP:613-614) |
| 14 | Tepsi dolgu, koyu | koyu | #121614, üstte 1px rgba(255,255,255,.06) çizgi, gölge yok | rgba(27,33,31,.92), kenar çizgisi yok (CE:118-121) |
| 15 | Seçili sekmenin ikon rengi | renk | açık: ön #0E8745, arka #FF4F8B; koyu: #3DDC84 / #FF6FA0 | ön c.ink, arka KIT.pink #FF4F8B her iki temada (ST:75-80) |
| 16 | Sekme etiketi | yazı | 600 12/15, seçili aynı ağırlık; seçili renk --text | eyebrow 600 12/16 +0.02em (AK:270), seçili `strong` (daha kalın) (ST:81) |
| 17 | Sekme ikonları: Ağız ve Gövde | ikon | Ağız: daire + ağız çizgisi; Gövde: kapsül gövdesi + omuz; Baş: kafa+gövde (r4.4) | Ağız = `chat` (konuşma balonu), Gövde = `gift` (CAP:100-101); Baş = `user` (kafa r3.9) |
| 18 | Diğer sekme/ikon geometrisi | ikon | Renk: daire r9.4 + 3 nokta r1.8, delik yok; Göz: yol "M2.4 12C5 7.4…", gözbebeği r3.4; Yüz: daire r9.4 + kafa r3.6 + yay; geri oku sw3; chevron sw2.6; Rastgele noktaları r1.7 @8.4/15.6; Hepsini çıkar oku "M9 5 4.6 9.4 9 13.8…" | palette daire r9 + 3 nokta r1.8 + delik; eye "M2.8 12s3.4-6…" r3; personCircle r9.2 kafa r3.2; chevron sw3.2; shuffle r1.9 @8.6/15.4; reply "M6.6 10h7.4…" (capIcons.generated.ts) |
| 19 | Ağız sekmesinde ÖNERİ rozeti | eksik | 7/10 700, accent, surface2 zemin, sağ üst (top -2, right 2) | yok (ST); sekme kendisi var |
| 20 | Çip satırı boşlukları | boşluk | üst 12, yan 20, çipler–link arası 10 | yan 22 (CE:44 `panel.side`), çipler–link 12 (SF:33 `filter.gap*2`) |
| 21 | Tema paketi çipi ölçüsü | ölçü | 28 yüksek, padding 0 11, 600 12/16 | Chip 36 yüksek (AK:865), padX 12 (AK:876), 600 13/17 (AK:285) |
| 22 | Çip rengi | renk | pasif: açık #E6F0E8 zemin + muted yazı; koyu #1B211F + rgba(238,243,240,.6); aktif koyu rgba(255,255,255,.94)/#0B0E0D | pasif: açık rgba(255,255,255,.85)+gölge+ink yazı (kit.tsx:826-830, AK:436-438); koyu #121614 + #EEF3F0; aktif koyu #EEF3F0/#0B0E0D (AK:535-536) |
| 23 | "Tümüne bak" yazısı ve ok | yazı | 700 13/16, chevron sw2.6 | capsuleChip 700 14/18 (AK:183), chevron sw3.2 (SF:61-64) |
| 24 | Çip satırı solması | davranış | yalnız sağda %80'den şeffafa | iki uçta: sol 22, sağ 40 (SF:41; CE:44 fadeStart/fadeEnd) |
| 25 | Deneme şeridi | düzen | 3 öğe sabit, ortalı, gap 18; yuvarlak 76, seçili 88 + 3 yüzey boşluğu + 3 pembe halka | kaydırmalı SnapStrip, 84 yuvarlak, adım 96, ölçek 0.9/1.14 (≈75.6 / 95.8), halka 3 bitişik, boşluk 0 (AK:978-986; SnapStrip.tsx:25-31) |
| 26 | Seçenek yuvarlağı dolgusu | renk | açık #E6F0E8, koyu #1B211F | rgba(3,27,11,.05) / rgba(255,255,255,.06) (CE:87,127) |
| 27 | Halka rengi, koyu | koyu | #FF6FA0 | KIT.pink #FF4F8B her iki temada (CAP:664; AK:668) |
| 28 | Seçenek resmi | resim | kapsül gövdesi üstünde parça; resim yuvarlağın ≈1.97 katı (150 px, 76 yuvarlakta), kırpılmış | parçanın kendisi, gövdesiz (tileArt.ts:8-12 kararı), 62 px / 84 yuvarlak = .74 (AK:982) |
| 29 | Seçenek adı | yazı | 600 12/15, seçili 700, tek satır | eyebrow 12/16 +0.02em, 1 satır kısalır (SnapStrip.tsx ad bloğu) |
| 30 | Tepsi mutlak konumu, durum çubuğu payı | doğrulanamadı | tepsi top 528 / ks padding-top 52 | gerçek cihaz insets'ine bağlı (CAP:436-450); telefonda bakılmalı |

## 74 Kapsülünü süsle · Yüz sekmesi — project/SusleYuz.dc.html
Kod: 73'tekiyle aynı + CAP:678-685 (Aksesuarı çıkar)
Öğe sayısı: 34 · uyuyor: 4 · fark: 29 · fazla: 2 · doğrulanamadı: 1
Panoda Yüz sekmesi seçili; 3 öğe: Altıgen gözlük, Ninja maskesi (seçili, efsanevi noktası), Çilek gözlük; altta "Aksesuarı çıkar" (primary).
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Ortak iskelet farkları | — | — | bkz 73 #1–#30 (hepsi bu panoda da geçerli) |
| 2 | Aksesuarı çıkar boyu | ölçü | 44 yüksek, padding 0 18, gap 8, 600 14/18, ikon 18 | Btn varsayılan 48, padX 24, 16/20, ikon 20 (CAP:679-684; AK:854,861) |
| 3 | Aksesuarı çıkar konumu | düzen | tepsiye mutlak, alttan 26, yatay ortalı, şeridin altında | akış içinde, şeridin altında marginTop 12 + minHeight 48 (CAP:670-686); tepsi alt boşluğu 24 + inset (CE:46) |
| 4 | Aksesuarı çıkar ikonu | ikon | halka r8 sw2.4 + çapraz çizgi (kontur) | `block`: dolu disk r8.8 %50 + çubuk (capIcons.generated.ts) |
| 5 | Çip satırı / resimler | resim | Altıgen gözlük, Ninja maskesi (blob 40ddebf8, 335×463, sınıf f) gövdeli | yalnız aksesuar şekli (accessoryFigure); BLOBLAR'da blob "yok" (depoda karşılığı yok, dosya adı bulunamadı) |

## 75 Kapsülünü süsle · Ağız sekmesi (ÖNERİ), ağız boş — project/SusleAgiz.dc.html
Kod: 73'tekiyle aynı + options.ts (boş seçenek)
Öğe sayısı: 33 · uyuyor: 6 · fark: 24 · fazla: 2 · doğrulanamadı: 1
ÖNERİ: pano başlığı ve sekme rozeti ÖNERİ; altıncı sekme kodda uygulanmış (uyuyor: sekme var, ilk seçenek "Ağız boş" tr.ts:739 `${slot} boş`, "boş" seçili başlar).
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Ortak iskelet farkları | — | — | bkz 73 #1–#30 |
| 2 | ÖNERİ rozeti Ağız sekmesinde | eksik | var (obt) | yok, bkz 73 #19 |
| 3 | "Ağız boş" seçeneği görünüşü | resim | kesik çizgili daire (2px, rgba(3,27,11,.22) / koyu .2), dolgu yok, içinde 26 "yasak" konturu ikon; seçili de halkalı | dolgulu yuvarlak (tile rengi) içinde `block` ikonu c.muted, kesik çizgi yok (CAP:782) |
| 4 | Boş seçenek ikon boyu | ölçü | 26 (`.it.none svg`) | CapIcon varsayılan KIT.size.icon (CAP:782, boyut verilmedi) |
| 5 | Boş seçeneğin hayalet komşusu | düzen | görünmez ilk öğe yer tutar (gh) | SnapStrip kenar dolgusu ile ortalar, hayalet yok; sonuç görsel olarak aynı: uyuyor |

## 76 Kapsülünü süsle · Gövde sekmesi — project/SusleGovde.dc.html
Kod: 73'tekiyle aynı
Öğe sayısı: 34 · uyuyor: 4 · fark: 28 · fazla: 2 · doğrulanamadı: 1
Panoda Gövde seçili; Anahtar kolye, Ninja kuşağı (seçili, efsanevi), İp kravat; "Aksesuarı çıkar" var. Sekme adı "Gövde" ✓ (tr.capsule.slotNames.n; katalogda "Boyun").
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Ortak iskelet farkları | — | — | bkz 73 #1–#30 |
| 2 | Aksesuarı çıkar | ölçü/düzen/ikon | — | bkz 74 #2–#4 |
| 3 | Gövde sekme ikonu | ikon | kapsül gövdesi + omuz | `gift` (kutu+kurdele), bkz 73 #17 |
| 4 | Seçenek kırpma çerçevesi | resim | gövde kırpımı viewBox 14 46 72 72 | FRAME.n '2 10.5 44 44' (tileArt.ts:25), gövde çıkarılmış |

## 77 Kapsülünü süsle · değişiklik yok, Kaydet pasif — project/SusleKaydetPasif.dc.html
Kod: CAP:484-497 (Btn disabled), src/aura/kit.tsx:334-352, BG
Öğe sayısı: 34 · uyuyor: 4 · fark: 29 · fazla: 2 · doğrulanamadı: 1
Panoda Baş seçili: Hilal bere, Shuriken tokası (seçili, efsanevi), Mavi bere (blob 240×240), Aksesuarı çıkar var.
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Ortak iskelet farkları | — | — | bkz 73 #1–#30; bkz 74 #2–#4 (Aksesuarı çıkar) |
| 2 | Pasif Kaydet rengi, açık | renk | zemin rgba(3,27,11,.08), yazı rgba(3,27,11,.38) (`.ptb .btn.off`), düz, ikon yok | zemin #DCE9DE, yazı #4A6550 (BG:19 OFF_LIGHT) |
| 3 | Pasif Kaydet rengi, koyu | koyu | zemin rgba(255,255,255,.10), yazı rgba(238,243,240,.4) | zemin #1B211F, yazı rgba(238,243,240,.4) (BG:73) |
| 4 | Pasif Kaydet ölçüsü | ölçü | 40 yüksek | 44, bkz 73 #4 |
| 5 | Resimler | resim | şapka blobları (d959326b, b2c88a4e, f9a8e905: 240×240, yuvarlakta 150 px kırpık) | figür 62 px, bkz 73 #28 |

## 78 Kapsülünü süsle · kaydediliyor — project/SusleKaydediliyor.dc.html
Kod: CAP:484-497, kit.tsx:447-449 (Loader kind meet), AK:667
Öğe sayısı: 34 · uyuyor: 3 · fark: 30 · fazla: 3 · doğrulanamadı: 1
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Ortak iskelet farkları | — | — | bkz 73 #1–#30; bkz 74 #2–#4 |
| 2 | Kaydet bekleme görünümü | düzen | yazı yok; yerinde dönen halka (20×20, r8.6, iz %30, yay sw2.6), düğme 92×40, genişlik sabit | "Buluş" iki kapsül yükleyicisi (iconSm 16/icon 20) yazının önünde, "Kaydet" yazısı yerinde kalır (kit.tsx:447-473); en az genişlik 96, yükseklik 44 |
| 3 | Kaydet bekleme boyu | ölçü | 92 genişlik, 40 yükseklik | ≥96 (AK:667), 44 |
| 4 | Başarı sonrası "Kaydedildi" | fazla | yok (pano bu hâli çizmiyor) | tr.ts:747 `savedShort`, CAP:487 |
| 5 | Basılamazlık | davranış | düğme basılamaz | `loading` ikinci basışı yok sayar (kit.tsx:396): uyuyor |

## 79 Kapsülünü süsle · kaydedilemedi — project/SusleKaydedilemedi.dc.html
Kod: CAP:192-206,691 (Toast), src/components/Toast.tsx, theme KIT.layer
Öğe sayısı: 38 · uyuyor: 8 · fark: 28 · fazla: 2 · doğrulanamadı: 1
Uyuyanlar: bildirim kutusu (yan 20, köşe 20, iç boşluk 12/12/12/14, aralık 12, #031B0B zemin / koyuda #FFF, gölge, başlık 14/19 600, alt satır 12/16 %70, buton 36 + padX 14, 13/16), başlık "Kaydedilemedi", düğme "Tekrar dene", Kaydet aktif kalır, bildirim düğmeye basılana kadar durur.
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Ortak iskelet farkları | — | — | bkz 73 #1–#30; bkz 74 #2–#4 |
| 2 | Bildirimin hata ikonu | eksik | solda 22×22: daire r9.4 + ünlem; açık #FF977E gövde %40, koyu #C8381F %35 | CAP:691 `Toast` `lead` almıyor (ikon yok). Aynı bildirim diyalog hatasında ikonlu (OverlayHost.tsx:56-62); token hazır (KIT.layer toastIcon, AK:1198-1200) |
| 3 | Alt satır metni | metin | "Bir şeyler ters gitti. Tekrar dener misin?" | `errorMessage(save.error)` (CAP:199): genel hatada aynı metin (tr.ts:168,2962); ağ/özel hatada başka metin çıkar: DOĞRULANAMADI (hata türüne bağlı) |
| 4 | Bildirim üst konumu | ölçü | top 108 (durum çubuğu 52 payıyla) | insets.top + 62 (Toast.tsx:37; CAP:691): cihaz insets'ine bağlı, telefonda bakılmalı |

## 80 Kapsülünü süsle · kaydetmeden çıkış onayı — project/SusleCikis.dc.html
Kod: CAP:209-236 (confirm), src/motion/Dialog.tsx, src/lib/overlayStore.ts, KIT.layer
Öğe sayısı: 40 · uyuyor: 12 · fark: 24 · fazla: 3 · doğrulanamadı: 1
Uyuyanlar: örtü (rgba(3,27,11,.42) / koyu .70, düz), diyalog yüzeyi (#FFF / #151A18, köşe 28, yanlar 28, iç boşluk 24/20/20, gölge, koyuda 1px halka), başlık "Değişiklikler kaydedilmedi" (21/26 700), açıklama "Kaydetmeden çıkarsan kapsülün eski hâline döner." (15/22 500 muted), "Kaydet ve çık" primary, düğme aralığı 8, düğme 48 tam genişlik. Tepsi/başlık iskeleti bkz 73.
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Ortak iskelet farkları | — | — | bkz 73 #1–#30; bkz 74 #2–#4 |
| 2 | Diyalog ikon diski | eksik | 56 disk (surface2 / #1B211F), içinde 26 kapsül ikonu (gövde + iki göz), ikon rengi ink | `confirm` çağrısında `icon` verilmemiş (CAP:210-235): disk yok. Dialog destekliyor (Dialog.tsx:152-168; disk ikonu 28, AK:1249-1250) |
| 3 | "Kaydetmeden çık" stili | renk | `btn danger` (yumuşak kırmızı #FBE1DB / koyu rgba(255,151,126,.12), yazı #A8301A / #FF977E) | `variant="glassy"` (CAP:225-226), overlayStore.ts:25 yorumu bunu danger istiyor; `other` alanı (tone 'danger') kullanılmamış |
| 4 | Düğme sırası | sıra | 1 Kaydet ve çık, 2 Kaydetmeden çık | `children` olarak eylemin ÜSTÜNDE: 1 Kaydetmeden çık, 2 Kaydet ve çık (Dialog.tsx:186-189 children önce) |
| 5 | Üçüncü "Vazgeç" düğmesi | fazla | yok | `cancelLabel: tr.common.cancel` "Vazgeç" (CAP:215, Dialog.tsx:210-218) |
| 6 | İkon–başlık boşluğu | boşluk | 16 (`.dt` margin-top) | 14 (AK:1247 dialogTitleGap) |
| 7 | Diyalog ikon boyu | ölçü | 26 (`.ei .ci`) | 28 (AK:1250) |
| 8 | Diyalog konumu | doğrulanamadı | top 250 mutlak (~316 yüksek, merkez ≈408) | ortalı (Dialog.tsx root justifyContent center): ekran merkezine göre ~14 dp fark olabilir, telefonda bakılmalı |

## 81 Tüm aksesuarlar · parça seçili (ÖNERİ: Kapsülüne tak) — project/TumSecili.dc.html
Kod: ACC (Catalog, WearBar), CT, src/features/capsule/catalog.ts, src/motion/GridWindow.tsx, tr.ts:765-786
Öğe sayısı: 55 · uyuyor: 17 · fark: 20 · fazla: 1 · doğrulanamadı: 1
Uyuyanlar: başlık metni "Tüm aksesuarlar", "53 parça" biçimi (`allCount`), kategori sırası ve sayıları (Tümü, Baş, Göz, Yüz, Ağız, Gövde, Renk, Takımlar; Tümü sayısız), bölüm başlığı "Baş / 14 parça", 4 sütun, satır aralığı 14, sütun aralığı 8, yan 20, karo 72, ad aralığı 6, ad yüksekliği 30 iki satır, halka 3+3 pembe, seçili ad 700, "Kapsülüne tak" metni, geri/arama düğmesi 44, grid yatay boşluğu.
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Bar yan boşluğu | boşluk | 20 | 16 (ACC:225; CE:36) |
| 2 | Başlık yazısı | yazı | 700 19/24, -.3px | pageBarTitle 21/26 (ACC:256; AK:197) |
| 3 | Alt satır "53 parça" | yazı | 500 12/16 muted | fine 500 13/18 (ACC:259; AK:263) |
| 4 | Arama düğmesi ikonu | ikon | daire r6.4 sw2.8 + çizgi | `search` r5.6 (capIcons.generated.ts) |
| 5 | Kategori çipi ölçüsü | ölçü | 32 yüksek, padding 0 13, gap 5 (ad–sayı), 600 13/16 | Chip 36, padX 12, 13/17 (ACC:287-308; AK:865,876,285) |
| 6 | Çipte sayı biçimi | yazı | ad + ayrı `em` sayı 500, opaklık .7 | tek metin "Baş 14" (tr.ts:774 `catLabel`), aynı ağırlık ve opaklık |
| 7 | Çip rengi | renk | pasif: açık #E6F0E8/muted, koyu #1B211F/rgba(238,243,240,.6); aktif koyu rgba(255,255,255,.94)/#0B0E0D | bkz 73 #22 |
| 8 | Çip satırının aktif çipe kayması | davranış | (TumTakim'de Tümü çipi -250 kayık: aktif çip görünür kalır) | yatay ScrollView aktif çipe kaydırmıyor (ACC:274-310): çip dışarıda kalabilir |
| 9 | Bölüm başlığı ağırlığı ve satırı | yazı | sağ metin 500 12/16, taban çizgisine hizalı | fine 13/18, flex-end (ACC:177-193) |
| 10 | Başlık–ilk satır boşluğu | boşluk | 12 (xs alt 6 + gg üst 6) | 6 (ACC:184 paddingBottom 6; GridWindow paddingTop 0, ACC:328) |
| 11 | Karo yuvarlağı zemini | renk | açık #E6F0E8, koyu #1B211F | rgba(3,27,11,.05) / rgba(255,255,255,.06) (CE:87,127; CT:61) |
| 12 | Karo nadirlik noktası | eksik | efsanevi/destansı: 9×9, 45°, r2, sağ 3 üst 3, 2px zemin halkası | CatalogTile'da yok (CT:54-83); yalnız deneme şeridinde var (CAP:706-736) |
| 13 | Karo resmi | resim | kapsül üstünde parça (blob 240×240 / SVG viewBox 14 -4 72 72, yuvarlakta ≈2× kırpık) | parçanın yalnız şekli (CT:38-43, tileArt.ts) |
| 14 | Halka rengi, koyu | koyu | #FF6FA0 (+ 3px #000 boşluk) | KIT.pink #FF4F8B (CT:80) |
| 15 | Karo adı | yazı | 600 12/15, 2 satır kıskaç | eyebrow 12/16 +0.02em, 2 satır küçülür (CT:85-87) |
| 16 | Alt düğme boyu | ölçü | 56 yüksek, tam genişlik, 600 16/20 | 48 (Btn varsayılan; `tall` yok) (ACC:372-377; AK:854,855) |
| 17 | Alt düğme konumu | boşluk | alttan 30 | insets.bottom + 20 (ACC:345; CE:catalog.action.bottom) |
| 18 | ÖNERİ rozeti düğmenin üstünde | eksik | 9/13 700, accent, surface2 zemin, padding 1 7 | yok (ACC:356-379) |
| 19 | Seçili parça sonrası otomatik kapanış | fazla | yok (pano "Kapsülüne tak"ın ne yaptığını göstermez) | `wear` taslağa yazar ve geri döner (ACC:199-205); ÖNERİ notuyla uyumlu, işlev var |
| 20 | Renk çipi satırındaki boş bölüm çipleri | doğrulanamadı | boş bölüm çipi yok | kodda boş bölümün çipi çizilir, basınca bir şey yapmaz (ACC:296-308) |

## 82 Tüm aksesuarlar · takım seçili — project/TumTakim.dc.html
Kod: ACC, CT, catalog.ts (setPieces, putOn), tr.ts:775-786
Öğe sayısı: 52 · uyuyor: 17 · fark: 19 · fazla: 1 · doğrulanamadı: 1
Panoda Takımlar çipi aktif ("Takımlar 10"), liste "Takımlar / 10 parça", 10 takım (ilki Kış takımı seçili), altta ÖNERİ + "Takımdaki bütün parçalar birlikte takılır." + "Takımı tak".
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Ortak farklar | — | — | bkz 81 #1–#18 (çip, başlık, karo, düğme farkları aynı) |
| 2 | Takım karosu resmi | resim | takımı giyen tam kapsül (viewBox 8 4 84 84) | takımın ilk parçasının şekli (CT:38-43) |
| 3 | Takım nadirlik noktası | renk/eksik | destansı #7B5CFF nokta | takım tier'ı 'efsanevi' (catalog.ts:80), nokta çizilmiyor (bkz 81 #12) |
| 4 | Açıklama satırı | uyuyor | 500 13/18 muted (koyu rgba(238,243,240,.6)) | T fine muted (ACC:367-371): metin harfi harfine aynı |
| 5 | ÖNERİ rozeti | eksik | üstte | yok, bkz 81 #18 |
| 6 | Takım sayısı | doğrulanamadı | 10 takım (Kış, Büyücü, Yıldız, Korsan, Dalgıç, Şef, Doktor, Rock, Astronot, Hawaii…) | depoda 2 takım var (Elf, Ninja: giftCatalog.ts:39-42); içerik farkı, arayüz değil |

## 83 Tüm aksesuarlar · arama açık — project/TumAra.dc.html
Kod: ACC:229-252 (GlassSearch), src/components/Field.tsx, kit.tsx Round
Öğe sayısı: 12 · uyuyor: 6 · fark: 8 · fazla: 1 · doğrulanamadı: 1
Uyuyanlar: kategori çipleri aramada gizli, "Sonuçlar / 1 parça" başlığı, alan yüksekliği 48 (KIT.size.field), geri düğmesi, sonuç kartı ad "Kedi bıyıkları" ve 4 sütun ızgara, temizle düğmesi 36 (KIT.size.btnSm), "Temizle" erişilebilirlik adı.
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Alan iç boşluğu | boşluk | sol 14, sağ 6 | sol 18 (X.capsulePadX), sağ 3 (X.switchPad) (components/Field.tsx:49-50; AK:898-906) |
| 2 | Alan içi aralık | boşluk | 6 | 8 (SPACING[2]) (components/Field.tsx:52) |
| 3 | Alan yazısı | yazı | 500 16/22 | body 500 15/22 (AK:258; components/Field.tsx:66) |
| 4 | Arama ikonu rengi ve geometri | renk | muted (#4A6550) daire r6.4 sw2.6 | placeholder (#56785E) (components/Field.tsx:56), r5.6 |
| 5 | Temizle ikonu | ikon | dolu %22 daire r9.4 + X | `close` yalnız X, daire yok (ACC:243) |
| 6 | Alan koyu | koyu | #121614, kenar rgba(255,255,255,.08), yazı #EEF3F0 | Glass koyu (kit): kenar .09/.10, bkz 73 #11 |
| 7 | Karo resmi | resim | "Kedi bıyıkları" kapsül üstünde, viewBox 20 28 60 60 | figür tek başına, bkz 81 #13 |
| 8 | Boş sorgu durumu | fazla | çizilmemiş | sorgu boşken liste gizli ve boş görünür (`hint` → null, ACC:320); durum panoda yok |
| 9 | İmleç ve ipucu metni | doğrulanamadı | accent 2×20 imleç; ipucu metni çizilmemiş | yerel imleç; ipucu "Parça adı ara" (tr.ts:778) boşken görünür, panoda boş hâl yok |

## 84 Tüm aksesuarlar · arama sonuçsuz — project/TumAraBos.dc.html
Kod: ACC:312-317, src/components/EmptyState.tsx (RISO_BOARD, StateWords), AK:940-952
Öğe sayısı: 6 · uyuyor: 2 · fark: 6 · fazla: 0 · doğrulanamadı: 0
Uyuyanlar: başlık "Sonuç yok", açıklama “pelerin” adında bir parça yok. Başka bir ad dene. (harfi harfine), alan (bkz 83).
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Alan farkları | — | — | bkz 83 #1–#6 |
| 2 | Resim boyu | ölçü | 180 genişlik, oran 3:2 (blob 4ba27f14, 900×600) → 180×120 | 120×80 (EmptyState.tsx:80-83 RISO_BOARD.search); dosya assets/riso/empty-search.webp 900×600 uyuyor |
| 3 | Başlık | yazı | 700 17/22 | stateTitle 600 15/20 (AK:92) |
| 4 | Resim–başlık aralığı | boşluk | 14 | 12 (AK:944 emptyTitleTop) |
| 5 | Açıklama | yazı | 500 14/20, koyu rgba(238,243,240,.6) | fine 500 13/18 muted (EmptyState.tsx:162-171) |
| 6 | Yerleşim | düzen | üstten 72, yan 32, üste yaslı | ortalı, üst 26, yan 24 (EmptyState.tsx:262-267; AK:951,947) |

## 85 Ortak kurallar — project/OrtakKurallar.dc.html
Kod: src/motion/Dialog.tsx, components/OverlayHost.tsx, SheetScrim.tsx, Toast.tsx, Loader.tsx, EmptyState.tsx, ButtonRow.tsx, motion/TabBar.tsx, CAP/ACC; ÖNERİ başlıklı: C1 ve B2
Öğe sayısı: 24 (C1: 3, C2: 4, C3: 2, C4: 2, C5: 4 kural satırı, B2: 2, + örnek bağlantıları) · uyuyor: 11 · fark: 9 · özellik yok: 1 · doğrulanamadı: 3
Uyuyanlar: C1 her onay ortada dialog (ConfirmSheet kodda yok, 15 yerde `confirm()`); C1 alttan sayfa onaylatmıyor (örneklenen sheet'ler menü/form); C2 dialog–sayfa örtüsü düz .42/.70 (KIT.layer scrim); C2 uzun basma örtüsü rengi .30/.62, SCRIM_GLASS.blur 6 (motionKit.test.ts:95); C3 Buluş yükleyici, 300 ms gecikme (LOADER_SHOW_AFTER_MS, markMotion.ts:317), iskelet çizgisi yok (skeleton.test.ts); C4 işlem hatası üst koyu bildirim (Toast); C5 alt menü etiketi 10 (tokens.ts:359); C5 düğme yazısı tek satır, küçülür (kit.tsx:455-466); B2 Ağız altıncı sekme, ilk seçenek "boş", Takımlar sekmesi yok, takım parçaları taslak üzerinden her sekmede seçili.
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | C2 uzun basma örtüsünün bulanıklığı | davranış | ekranın sabit kopyası, 6 px bulanık + .30/.62 karartma | varsayılan KAPALI; yalnız Çizim ölçümü anahtarı açar, üretimde hep kapalı, Android 12 altında ve saydamlık azaltmada yok (SheetScrim.tsx:31; drawLab.ts:59; docs/decisions/scrim-glass.md, proje sahibi kararı 17 Kasım) |
| 2 | C2 örnek çelişkisi | doğrulanamadı | "Sohbeti sil onayı" (01e) bulanık örtü sütununda da, dialog düz örtü kuralında da anılır | pano içinde çelişki; kodda dialog düz örtü kullanıyor |
| 3 | C2 ⋮ menüsü: örtü yok | doğrulanamadı | örtüsüz, dışarı dokununca kapanır | Menu.tsx SheetScrim'i yalnız `hold` için çağırıyor olabilir; ⋮ menü yolu okunmadı (motion/Menu.tsx:282) |
| 4 | C3 İçerik yüklenirken ekranın bar ve sabit parçaları hemen çizilir | davranış | başlık/arama/sekme hemen, ortada Buluş | Süsle ve Tüm aksesuarlar yüklenirken yalnız ortada yükleyici, bar yok (CAP:129-135, ACC:67-73) |
| 5 | C3 "görünürse en az 600 ms" | davranış | Liste, profil, sohbet için | `useLoaderHold` 10 yerde var, Mesajlar (messages/index.tsx:242, archive.tsx:68), DM (`[threadId].tsx:482,498`), Süsle ve Tüm aksesuarlar'da yok |
| 6 | C3 düğmede bekleme | davranış | düğme genişliğini korur, yazı yerinde dönen halka | yazı kalır, önünde Buluş; bkz 78 #2 |
| 7 | C4 tam ekran hata/bağlantı yok: riso resim | resim | küçük riso 210×172, başlık, cümle, "Tekrar dene" yumuşak | resim yok, 64'lük disk içinde cloudOff (EmptyState.tsx:117-157; assets/riso'da hata/bağlantı resmi yok) |
| 8 | C4 hata başlığı | metin | "Bir sorun oldu", cümle ekranın içeriğini söyler | başlık yok (title verilmiyor), yalnız errorMessage(); "Bir sorun oldu" tr.ts'te yok (CAP:139-143, ACC:77-83) |
| 9 | C4 bağlantı yok cümlesi | metin | "İnternete bağlanınca bu sayfa kendiliğinden yenilenir." | "Bağlanınca ekran kendiliğinden yenilenir." (tr.ts:2850); başlık "Bağlantı yok" ✓ (tr.ts:2849); ekran içeriği yerine bant (ConnectionBanner.tsx:63) |
| 10 | C4 "Bir işlem başarısız" ikonu | eksik | koyu bildirim: ikon yok (kuralda anılmaz), pano 79'da ikon var | bkz 79 #2 |
| 11 | C5 sabit boyda kalanlar: Süsle sekme etiketi | davranış | büyümez (kuralda "sekme 13") | T eyebrow 12, sistem yazı büyüklüğüyle 1.3'e kadar büyür, `fit` ile küçülür (ST:81; kit.tsx:119) |
| 12 | C5 uzun basınca büyük etiket | özellik yok | alt menü ve Süsle sekmesine uzun basınca büyük etiket | TabBar.tsx / SusleTabs.tsx'te onLongPress yok |
| 13 | C5 iki düğme alt alta, tam genişlik | davranış | 320 dp / en büyük yazıda Süsle'nin iki düğmesi alt alta, satırı doldurur | CAP:559-568 `flexWrap: 'wrap'` ile sarar, ButtonRow (narrow → column, block) kullanılmıyor; düğme satırı doldurmaz |
| 14 | C5 Süsle önizlemesi 340 → 240 | doğrulanamadı | dar ekranda küçülür | sahne 0.7 × 300'e kadar ölçeklenir (CAP:88,450); 340/240 değerleri kodda yok, telefonda bakılmalı |

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
|---|---|---|---|
| 73 | 33 | 27 | evet |
| 74 | 34 | 29 | evet |
| 75 | 33 | 24 | evet |
| 76 | 34 | 28 | evet |
| 77 | 34 | 29 | evet |
| 78 | 34 | 30 | evet |
| 79 | 38 | 28 | evet |
| 80 | 40 | 24 | evet |
| 81 | 55 | 20 | evet |
| 82 | 52 | 19 | evet |
| 83 | 12 | 8 | evet |
| 84 | 6 | 6 | evet |
| 85 | 24 | 9 | evet |

Kural işareti: bu 13 panoda değişmez kuralı (kural 4, 5, 6, 12) zorlayan bir öğe yok (kapsül yalnız kendi önizlemesi; kişi bilgisi, konum, cinsiyet yok).
