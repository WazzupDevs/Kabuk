# Pano–kod denetimi, grup 03 (13 pano)

Genel notlar (her panoda geçerli, burada bir kez):
- Sekme çubuğu (pano `.tb`, `.ti`): yükseklik 60, yan 20, iç 5, sekme 50, ikon 20, yazı 10/13 ls .1, seçili hap #031B0B / koyuda rgba(255,255,255,.94), ikon renkleri #3DDC84+#FF6FA0 / koyu #0B783D+#FF4F8B, pasif koyu rgba(238,243,240,.55), `.fade` 150 → kodda AURA.tabBar (aura.ts:93-114) ve AURA[scheme].tab (aura.ts:20-80) ile ÖLÇÜLDÜ, UYUYOR. Tek fark T0 (aşağıda), her panoda aynı.
- Alt sayfa (pano `.sheet`/`.cs`/`.msh`/`.ss`): kodda SheetCard (components/SheetCard.tsx) + KIT.layer.size (auraKit.ts:1286-1294). Ortak farklar S1-S4 aşağıda; panolarda "bkz. S#".

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| T0 | sekme çubuğunun alt boşluğu | ölçü | alt 30 (844 yüksek tuvalde; sistem çubuğu payı bilinmiyor) | AURA.tabBar.bottom 12 + safe area (aura.ts:101) — DOĞRULANAMADI: tuvalin 30'unun içinde ne kadar sistem payı var belli değil |
| T0b | sekme çubuğu camı | renk | `--glass-bg` gradyan rgba(255,255,255,.80)→.54, kenar .86, gölge 0 18 44 rgba(4,73,35,.10)+0 2 6 .05 (skall.css:159-161); pano `.tb` kendi gölgesi 0 6 18 .08 + 0 0 0 1px .04 | fill rgba(255,255,255,.60) düz, gölge 0 6 18 .08 (aura.ts:22-26,TAB). Gölge UYUYOR; dolgu .60 düz ≠ .80→.54 gradyan |
| S1 | alt sayfa kapağı (açık) | renk | `.glass` gradyan beyaz .80→.54 + glass-line + glass-shadow (09, 15 `.msh`); 11b/11c/15 `.cs`/`.ss` düz `--surface` #FFF, gölge 0 -8 40 .18 | KIT.layer.light.sheet '#FFFFFF' düz, gölge 0 -8 40 .18, tutamaç rgba(3,27,11,.18) (auraKit.ts:1183-1185). 09'un cam sayfası ≠ düz beyaz; 11b/11c/15 UYUYOR |
| S2 | alt sayfa tutamacı | ölçü | 40×4, renk --control #C6E0CC (skall.css:244) | 40×5 (KIT.layer.size.grabH 5, auraKit.ts:1294), açık renk rgba(3,27,11,.18) |
| S3 | alt sayfa üst boşluğu ve alt | ölçü | 11b/11c/15: üst 10, alt 38; 09: üst 12, alt 34 | sheetPadTop 10, sheetPadBottom 34 (auraKit.ts:1290,1292) |
| S4 | alt sayfa başlığında kapatma düğmesi | fazla | yok (tutamaç+başlık; 09, 15'te yok) | SheetCard `closeButton=true` varsayılan: 38'lik yuvarlak kapat (SheetCard.tsx:48-60, KIT.size.sheetClose 38). 09 Aktiviteler sayfası ve 15 menüsü bunu taşır; konum sayfası kapatır `closeButton={false}` (checkin/index.tsx:146) UYUYOR |
| S5 | perde | renk | açık rgba(3,27,11,.20) + blur 8 (skall.css:167) ya da 11b/11c/15'te rgba(3,27,11,.42); koyu .66 | KIT.layer.scrim .42 / koyu .70 düz, blur yok (auraKit.ts:1164,1210). 11b/11c/15 açık UYUYOR, koyu .66 ≠ .70 |

## 08 Aktiviteler · geçmiş — project/Gecmis.dc.html
Kod: apps/mobile/app/(app)/(tabs)/activities.tsx (History, HistoryRow, Thumb), src/features/gifts/GiftCard.tsx, src/theme/activities.ts, flatLists.ts, gifts.ts, i18n tr.ts:455-
Öğe sayısı: 52 · uyuyor: 40 · fark: 5 · fazla: 3 · doğrulanamadı: 4
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | hediye paketi kartı (bütün) | düzen | yatay cam kart: yükseklik 76, köşe 22, iç 0 14 0 10, öğe arası 8, solda 88×76 üç paket (k1 42 w sol -2 üst 6 -12°; k3 42 w sol 47 üst 6 12°; k2 50 w sol 19 üst -6 ortada, gölge 0 4 8 .28), ortada metin, sağda chevron 18 muted; ana arada 8 üst boşluk | koyu katman: yükseklik 170, köşe 30, iç 20, paketler sağ üstte taşar (GIFT_CARD gifts.ts:84-122), altta "Paketlere bak" düğmesi, 44 taşma (GiftCard.tsx:97-183) |
| 2 | kart metni | metin | "HEDİYE PAKETİ" 12/16 ls .24 600 accent + "Bütün aksesuarlar sende" 16/22 600 text (tek satır) | eyebrow 11/14 800 ls .12em #3DDC84 (auraKit.ts:119), başlık 21/26 800 beyaz, "Bütün aksesuarlar\nsende" iki satır (tr.ts:394-397) |
| 3 | kartın durumları | fazla | yalnız "hepsi sende" hâli çizili | ready/progress hâlleri, LoginBar, açılabilir rozeti, halka (GiftCard.tsx:117-148,247) — pano çizmiyor |
| 4 | kartın dokunuşu | davranış | tüm kart bağlantı, ok ile | `router.push('/gifts')` tüm kart + ayrı düğme (GiftCard.tsx:38,157) UYUYOR; ok yerine düğme içinde chevron 15 |
| 5 | sayfa başlığı üstü | fazla | yalnız "Aktiviteler" (.display 32/42) | başlığın üstünde şehir eyebrow'u "… mekanlardan" (activities.tsx:57-60, tr.ts:460) |
| 6 | geçmiş satırı: sonuç etiketi | fazla | satırda yok (ad+saat, altında "N kişiyle") | pv satırının sonunda Tag Kazandın/Kaybettin/Bitti (activities.tsx:392,tr.ts:479) |
| 7 | "N kişiyle" satırı | davranış | `.pv` tek satır, sağ 44 px solarak biten maske, taşmaz | T body, sarılabilir, maske yok (activities.tsx:394-397) |
| 8 | sekme anahtarı camı | renk | `.sg`: glass-bg gradyan .80→.54, kenar .86, gölge 0 18 44 .10 | tabsGlass fill rgba(255,255,255,.60) düz, edge .90, gölge 0 10 30 .08 (activities.ts:32-37) |
| 9 | seçili sekme gölgesi | renk | `.seg span.on` gölge 0 2 6 rgba(3,27,11,.18) | tabOnShadow 0 3 10 .10 (activities.ts:38) |
| 10 | sekme çubuğu alt boşluğu | ölçü | bkz. T0 | DOĞRULANAMADI (T0) |
| 11 | görüntüler (paket 3, oyun küçükleri 2) | resim | blob f67fc3d1/eb02ec75/814e9d8a (180×276 paket), 6dfe938d/b2dada85 (168×168) | paketler assets/gifts/pack-*.webp (art.ts:9-13; bronz/gümüş/altın, hangi görsel olduğu aynı mı DOĞRULANAMADI), küçükler history-vampir.webp 156px / history-sohbet.webp 288px (activities.tsx:430-431) — BLOBLAR.md depoda karşılık "yok" diyor, birebirlik DOĞRULANAMADI |
| 12 | satır ve gün başlığı ölçüleri | ölçü | hs mt 8, b 16/22 600, span 13/18 500, gap 8; lst mt -6; rw pad 10/20, gap 12, min 72; th 52 r14 ×1.04; nm 16/22 600; tm 13/18 500 muted; pv 15/22 500 muted | FLAT.day/row/thumb (flatLists.ts:17-23) ve activities.tsx:243-262 UYUYOR; nm 'h3' ls -0.1 (pano ls yok) ihmal |
| 13 | gün başlığı sıfır olmayan 'Daha önce' | fazla | pano yok (bkz. 08b) | tr.ts:469 |

## 08b Aktiviteler geçmiş · kaydırılmış — project/GecmisKaydir.dc.html
Kod: aynı (activities.tsx, StickyField/StickyStatusBand motion/StickyField.tsx, TopBar.tsx)
Öğe sayısı: 58 · uyuyor: 46 · fark: 6 · fazla: 0 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | gün grubu "Geçen hafta" (4 oyun) | eksik | "Bu hafta"dan sonra "Geçen hafta" başlığı, satır tarihleri "9 Kas", "8 Kas" | HistoryDay yalnız today/yesterday/week/earlier (activities.ts:6, 15-21): 7 günden eskisi tek "Daha önce" (tr.ts:469) |
| 2 | gün grubu "Ekim" (9 oyun) | eksik | ay adı başlık, satırlar "31 Eki", "29 Eki" | ay başlığı hiç yok, "Daha önce" altında hepsi |
| 3 | eski satırların saati | metin | "9 Kas", "31 Eki" (kısa ay) | dayMonth tam ay adı "9 Kasım", "31 Ekim" (tr.ts:27-60,57) |
| 4 | kaydırınca üst bant | renk | `.sbar2` açık rgba(255,255,255,.32)+blur 24, koyu rgba(0,0,0,.86), alt 22'de maske; üst 52 alt 22 iç 20; başlık 17/22 700 ls -.2 + 48 satır; arada 10 | band rgba(239,247,241,.84) / koyu rgba(0,0,0,.84), blur yok (aura.ts:26-30,61-65; barBandCss aura.ts:330); bant yüksekliği 118 (AURA.topBar.bandHeight). Başlık ölçüsü DOĞRULANAMADI (cihazda bakılmalı) |
| 5 | bantta sekme anahtarı | davranış | anahtar bantta başlığın altında yapışır | StickyField band (activities.tsx:70-92) UYUYOR; kaydırma konumu telefonda DOĞRULANAMADI |
| 6 | kart yok olma | davranış | hediye kartı bantta görünmez (üstte kaydı) | StickyFade 80 px'te söner ve küçülür (StickyField.tsx:238) — pano davranışı çizmiyor, DOĞRULANAMADI |
| 7 | liste | öğe | bkz. 08 #1, #5, #6 | bkz. 08 |

## 09 Geçmiş masa sayfası — project/GecmisMasa.dc.html
Kod: activities.tsx:196-300 (Sheet, Kanki, Thumb), src/features/friends/historyActions.tsx:153-378 (HistoryActions, HistoryAddHint, More), motion/Sheet.tsx
Öğe sayısı: 70 · uyuyor: 49 · fark: 11 · fazla: 4 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | altta hediye kartı | düzen | bu panoda tek görselli kart: 76 yük., iç 0 16 0 12, gap 12, gp 52×76 tek paket (blob 3a2b9847, -8°, 50×76, köşe 4) — 08'deki üç paketli karttan da farklı | bkz. 08 #1; iki pano da birbirinden ayrışıyor, geçerli olan karar proje sahibinin |
| 2 | sayfa kapağı, tutamaç, alt | renk/ölçü | bkz. S1, S2, S3 | bkz. S1-S3 |
| 3 | kapat düğmesi başlıkta | fazla | yok | SheetCard sağ üst 38'lik kapat (S4) |
| 4 | "Kapat" düğmesi altta | fazla | yok (liste son satırla biter, alt 34) | footer Btn glassy "Kapat" (activities.tsx:~300 `history-sheet-close`; E2E için tutulmuş) |
| 5 | başlık altı satırı | yazı | `.sub` 13/18 **500** muted, başlığa 2 | titleType 'exploreCount' = 13/17 **600** (auraKit.ts:52, Sheet.tsx:206-213), araları titleGap 3 (activities.ts:20) |
| 6 | kişi adı | yazı | `.kn` 15/20 600 | T body strong = 15/22 (activities.tsx:~282) |
| 7 | kişi avatarı | resim | `.kav` 44 yuvarlak, doğrudan 192×192 kapsül kankisi resmi (object-fit cover; 4 ayrı blob: 89846870, 118e4ea2, beb8bad0, c30062bb, 5b08ad27) | 44'lük renkli yuvarlak zemin + 31×41 kanki (sol 6, üst 4) 6 sabit zemin rengi, sıraya göre (activities.tsx:344-375, activities.ts:46-52) |
| 8 | satır alt notu | fazla | yok (satırda yalnız ad+Ekle/İstek gitti+⋯) | arkadaşsa "Arkadaşsınız" ipucu satırı, sessiz basışta "Eklendi" notu (historyActions.tsx:~256-274) ve Mesaj hâli |
| 9 | "Ekle" düğmesi | renk | soft küçük, yazı ve ikon `--accent` (#0B783D açık), ikon 16 artı | tint c.link (rengin değeri DOĞRULANAMADI: auraKit c.link), ikon 'plus' 16 UYUYOR, boşluk 14/14, gap 4 UYUYOR |
| 10 | "İstek gitti" çipi | ölçü | 36 yük., iç 12, 13/17 600 muted, zemin --track | btnSm 36, padX 12, T chip, colors.track (historyActions.tsx:~215-228) UYUYOR |
| 11 | ⋯ düğmesi | ölçü | 36 daire, 3 nokta md 20 muted | KIT.size.btnSm 36, 'more' 20 soft (historyActions.tsx:340-365) UYUYOR |
| 12 | metinler | metin | "Bugün 05:23 · 6 kişi", "İkiniz de basarsanız arkadaş olursunuz. O basmazsa hiçbir şey olmaz.", "MASADAKİLER", "Ekle", "İstek gitti", aria "X için seçenekler" | tr.ts:469-474,633,650,652 UYUYOR (aria "Diğer": tr.friends.more, "X için seçenekler" değil) |
| 13 | not ile başlık arası | ölçü | `.note` mt 14 | FLAT.game.noteTop 14 tanımlı ama HistoryAddHint öncesi bu değer kullanılmıyor (activities.tsx:~289, Sheet çocuk gap KIT.size.rowGap 12) — DOĞRULANAMADI (ölçülmedi, cihazda) |
| 14 | ⋯ davranışı | davranış | "X için seçenekler" | onMore sayfayı kapatıp openMenu (activities.tsx:~295) UYUYOR |

## 10 Keşfet — project/Kesfet.dc.html
Kod: apps/mobile/app/(app)/(tabs)/explore/index.tsx, src/features/district/DistrictCard.tsx, src/theme/explore.ts, semt.ts, i18n tr.ts:556-600,1102-1124
Öğe sayısı: 54 · uyuyor: 44 · fark: 5 · fazla: 2 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | tür çipi boyu | ölçü | `.ch .chip` yükseklik **40**, gap 8, iç 14, 14/18 600 | KIT.size.chip **36** (explore/index.tsx:~330 `h = narrow ? chipNarrow : chip`; auraKit.ts chip 36; CLAUDE.md "çip 36") |
| 2 | satırdaki canlılık | metin | `.stt`: "Sessiz" ya da **"2 masa"** (sayı) | tr.explore.buckets: "Sessiz", "Birkaç açık masa", "Kalabalık" (tr.ts:~570); KURAL 4 / K-41: mekan başına masa sayısı gösterilmez, pano sayı çiziyor; karar proje sahibinin |
| 3 | Semte Git düğmesi | metin | "Semte git" (küçük g), ok yok | "Semte Git" (tr.ts:1110) + sağında ok 16 (DistrictCard.tsx:~318, EXPLORE.district.chevron) |
| 4 | Semte kartı yüksekliği | ölçü | sabit 200 | minHeight 200 (EXPLORE.scene.minHeight, explore.ts) — en büyük yazı için bilinçli, UYUYOR sayıldı |
| 5 | Semte kartı yazı | yazı | eyebrow 12/16 600 ls .24 #7CF0B0; başlık 18/23 700 ls -.3; açıklama 13/18 500 .8 beyaz | kesfetEyebrow 12/16 ls .24, semtTitle 18/23 -.3, semtNote 13/18 UYUYOR |
| 6 | "Şu an buradasın" kartı | fazla | yok | HereNow Glass kartı (explore/index.tsx:~500-540; kodda "pano çizmiyor" notu) |
| 7 | arama alanı, harita düğmesi, buddy | ölçü | field 48 beyaz, mp 48 soft, kk 178 w sağ 64 alt 22 | EXPLORE.field/peek UYUYOR |
| 8 | soru/eyebrow | yazı | eyebrow 12/16; kh 32/38 700 ls -1 (satır 38) | kesfetTitle 32/41 700 ls -1 (satır 41: yazı kesilmesin diye bilinçli, explore.ts notu) — pano satır yüksekliği 38 ≠ 41 |
| 9 | satır görselleri | resim | blob 85e04cef, d8891436 (th 56 r16) | VenueThumb 'kampus' assets/riso/venue-kampus.webp; birebirlik DOĞRULANAMADI |
| 10 | şehir düğmesi, sayı, sıralama | ölçü | cty 36, 15/20 700, count 13/18 500 ml 10; srt 32 | EXPLORE.place/sort UYUYOR |
| 11 | "2 mekan" sayısı | kural | sayı çizili | tr.explore.count (tr.ts:594) — mekan sayısı, kural değil |

## 10b Keşfet · semt sohbetindesin — project/KesfetSemtIcerde.dc.html
Kod: DistrictCard.tsx Scene room (satır 129-215), explore.ts scene.*
Öğe sayısı: 54 · uyuyor: 46 · fark: 3 · fazla: 1 · doğrulanamadı: 1
Not: 10'daki #1, #2, #5-#11 aynen geçerli (bkz. 10).
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | kalan süre | yazı | `<b>1 sa 24 dk</b> kaldı`: sayı 700 beyaz, "kaldı" 500 .86, 14/18, saat ikonu 18 | tek T semtMeta 14/18 500 rgba(255,255,255,.86), sayı kalın değil, tek parça "1 sa 24 dk kaldı" (DistrictCard.tsx:~192-205, tr.ts:1130-1132) |
| 2 | düğme oku | fazla | "Odaya dön" okusuz | trail 'forward' 16 (DistrictCard.tsx:~318) |
| 3 | eyebrow/başlık metni | metin | "SOHBETTESİN", "Beylikdüzü sohbetindesin" | tr.ts:1117,1113 UYUYOR; pembe #FF8FB8, nokta #FF4F8B ring 4 .28 UYUYOR (explore.ts:~75) |
| 4 | sahne resmi (blob 8bc2eb74) | resim | bank sahnesi | kesfet-semt-oda.webp; birebirlik DOĞRULANAMADI |

## 10c Keşfet · kaydırılmış (örnek 8 mekan) — project/KesfetKaydir.dc.html
Kod: explore/index.tsx ListBody (satır 330-410), motion/StickyField.tsx
Öğe sayısı: 78 · uyuyor: 62 · fark: 6 · fazla: 1 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | yapışan üst bant: tür çipleri | davranış | `.sbar2` içinde arama+harita düğmesi, **çipler** (`.ch`) de yapışır | yalnız arama yapışır (`StickyField` yalnız `search`, explore/index.tsx:365-372); çipler kayıp gider |
| 2 | yapışan bantta Semte Git şeridi | eksik | `.ssm` 60 yük., köşe 18, iç 0 10 0 16, gap 10, resim object-position 0% 12%; eyebrow 11/14 600 ls .24 #7CF0B0 + nokta 7; başlık 15/20 700 "Beylikdüzü sohbeti"; sağda 36'lık "Semte git" (iç 14, gölge 0 4 10 .28) | hiç yok: Semte kartı kayıp gider, küçük şerit kodda yok (DistrictCard yalnız tam kart) |
| 3 | bant zemini | renk | açık rgba(255,255,255,.32)+blur 24, koyu rgba(0,0,0,.86), üst 52 alt 22 iç 20, aralar 10 | rgba(239,247,241,.84) / koyu rgba(0,0,0,.84) blur yok (aura.ts:26-30,61-65) |
| 4 | satırlardaki canlılık | kural | "1 masa", "3 masa", "2 masa", "Sessiz" | bkz. 10 #2 — KURAL 4 / K-41 |
| 5 | liste altı sıra | davranış | "Ada göre" + 8 mekan | UYUYOR |
| 6 | bantta şerit yokken kart | davranış | kart kaydıkça şeride dönüşür | DOĞRULANAMADI (hareket panosu çizmiyor) |

## 11 Keşfet · harita — project/KesfetHarita.dc.html
Kod: apps/mobile/src/features/explore/ExploreMap.tsx (MapControls 560-640, VenueCard 600-667, StackCard), explore.ts:map, mapStyle.ts, tokens.ts MAP_PIN
Öğe sayısı: 46 · uyuyor: 28 · fark: 11 · fazla: 2 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "ben" noktası `.me` | kural | mavi/yeşil konum noktası (44 halka + 16 nokta) (178,322) | yok; kod kullanıcının konumunu hiç çizmez (ExploreMap.tsx:~100 not; CLAUDE.md değişmez kural 6). KURAL 6 |
| 2 | "Konumuma git" düğmesi `.loc` | kural | 48 beyaz yuvarlak, ok ikonu (konum oku), aria "Konumuma git" | 48 yuvarlak, 'compass' ikonu, aria "Bütün mekanları göster" (ExploreMap.tsx:~637, tr.ts:598) — işlevi kamerayı mekanlara geri getirmek. KURAL 6 |
| 3 | iğne şekli | resim | damla iğne: 56 daire (seçili 68, halka 5), içinde mekan resmi (blob 6f9ae067), altında köşe 12, **altında 24'lük ad hapı** (12/24 700, gölge 0 4 12 .16, seçilide ink zemin) | GL daire katmanı: yarıçap 24+4 (seçili 29+5), ikon küçük görseli, ad **yalnızca yakınlaştırınca** düz yazı + halo (ExploreMap.tsx:270-440, MAP_PIN tokens.ts:298-328): damla yok, ad hapı yok, mekan resmi yok |
| 4 | iğnede masa sayısı rozeti | kural | Sakarya iğnesinde `.cn` "2" rozeti (22, 800 12/22) | rozet yok (yalnız küme/yığın sayısı "N mekan" için daire, ExploreMap.tsx:310-345); pano masa sayısı çiziyor, KURAL 4 / K-41 |
| 5 | mekan kartı biçimi | düzen | bilet: solda 94 genişlikte `.bl` resim bloğu (blob 1fdde90c), 104'te delikli kesik + kesikli çizgi `.pf`, sonra th 56 r16 + metin + 44'lük yuvarlak "Yol tarifi"; iç 14 14 14 0; gap 18; min 96; köşe 22; zemin beyaz/koyu #121614 | düz Glass kart: thumb 56 r16 üstünde buddy 26×34 (sağ -8 alt -6), metin, 44'lük "Mekana git" ok (ExploreMap.tsx:600-667); bilet kesiği/resim bloğu/kesikli çizgi yok |
| 6 | karttaki 44'lük düğme | özellik yok | "Yol tarifi" (yön tarifi: eşkenar dörtgen + ok ikonu) | "Mekana git" (mekan sayfasını açar, tr.ts:569); yön tarifi işlevi yok |
| 7 | kart alt metni | metin | "Kampüs · Avcılar · Sessiz" | tr.explore.mapSub (tr.ts:~599) UYUYOR; etkinlik varsa Tag eklenir (FAZLA, pano çizmiyor) |
| 8 | harita üst: arama + liste düğmesi + çipler | ölçü | field 48, mp 48 liste ikonu, çip 40 beyaz | EXPLORE.map, çip 36 (bkz. 10 #1) |
| 9 | gösterge `.lg` | ölçü | sol 20, alt 244, iç 6 12, gap 10, nokta 9, 11/14 600 | EXPLORE.map.legend UYUYOR; yazılar Sessiz/Masa var/Kalabalık (tr.ts:~565) UYUYOR |
| 10 | "© OpenStreetMap" | ölçü | sol 22, 10/14 500 | UYUYOR (explore.ts attrSide 22) |
| 11 | harita zemini ve etiketler | resim | SVG çizim, İSTANBUL, Karadeniz, ŞİLE… etiket | gerçek OpenFreeMap (mapStyle.ts); tuval bir çizim, DOĞRULANAMADI |
| 12 | küme/yığın dairesi | fazla | yok | küme ve yığın dairesi, "Burada N mekan" yığın kartı (ExploreMap.tsx:310-345, StackCard, tr.ts:567) |

## 11b Mekan · konum izni kapalı — project/MekanKonumIzin.dc.html
Kod: app/(app)/(tabs)/explore/[venueId].tsx (CoverPage), app/(app)/checkin/index.tsx, src/features/checkin/LocateNotice.tsx, theme/venueDetail.ts (LOCATE_SHEET), RouteSheet.tsx
Öğe sayısı: 48 · uyuyor: 36 · fark: 7 · fazla: 1 · doğrulanamadı: 4
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | üst bar sağ düğme | özellik yok | "Paylaş" 44'lük yuvarlak (yukarı ok + kutu ikonu), sağ 16 | yalnız geri düğmesi (explore/[venueId].tsx:~255-265); paylaş uç/işlevi yok |
| 2 | "Bu hafta" satırı | ikon | `.wk` "Bu hafta" + aşağı chevron 18 (düğme gibi) | düz yazı, ok yok ("bir not, basılan şey değil", explore/[venueId].tsx:~230, venueDetail.ts week) |
| 3 | adım satırı `.stps` | özellik yok | "Ayarlar › **skall** › **Konum** › **Uygulamayı kullanırken**" + "ÖNERİ" rozeti; 13/18 600, b'ler 700 hap (iç 3/9, --surface2), üst 14 | yok (kodda izin yolu tarif edilmiyor); pano ÖNERİ etiketli |
| 4 | bildirim köşesi | ölçü | `.nb2` köşe 20, iç 14 16, ikon 22 | glassRadiusSm 22 (LocateNotice.tsx:~38, auraKit.ts:~846) — 22 ≠ 20 |
| 5 | bildirim ikonu | ikon | kilit gövdeli (kilit+nokta, "Konum izni kapalı") | CapIcon 'lock' (LocateNotice.tsx:44); biçim DOĞRULANAMADI |
| 6 | "Ayarları aç" ikon+renk | ikon | ana düğme, ışın+daire "ayar" ikonu | Btn icon="settings" UYUYOR (checkin/index.tsx:150); düğme varsayılan primary UYUYOR |
| 7 | "Konumumu kullan" | ikon | soft, pin ikonu md | glassy, pin UYUYOR |
| 8 | başlık/alt başlık | yazı | `.sh-t` 21/26 700 ls -.3; `.sh-s` 13/18 500 | locateTitle 21/26 700 ls -.29; alt satır Sheet subtitle: 'fine' (13/18 500) UYUYOR |
| 9 | düğmelerin üst boşlukları | ölçü | go mt 20; soft mt 10 | buttonTop 20, buttonsGap 10 UYUYOR (venueDetail.ts:15-17) |
| 10 | peek resmi | resim | 330 genişlik, altta peek b0a29601 | Peek 'locateDenied' 330 (venueDetail.ts:11); birebirlik DOĞRULANAMADI |
| 11 | sayfa metinleri | metin | "Konum izni kapalı" / "İzin olmadan mekanda olduğunu doğrulayamıyoruz. Konum iznini Ayarlar'dan açabilirsin." / "Ayarları aç" / "Konumumu kullan" | tr.ts:878-887 harfi harfine UYUYOR |
| 12 | alt boşluk | ölçü | 38 | 34 (S3) |
| 13 | mekan sayfası bilgi satırı/ad/düğme/ipucu | ölçü | meta kmp 28, loc 14/18, stt 28; vt 26/32 700 ls -.6; go mt 18; hint mt 10 13/18; sh2 mt 26 | VENUE_DETAIL (venueDetail.ts:27-60) UYUYOR; kaydırmalı üst bant ayrı |
| 14 | kod fazlası | fazla | yok | (varsa) "Mekana dön" hâli ve `replaces` uyarısı (checkin/index.tsx:174) |

## 11c Mekan · mekanın dışındasın — project/MekanKonumDisari.dc.html
Kod: checkin/index.tsx, LocateNotice.tsx
Öğe sayısı: 46 · uyuyor: 33 · fark: 7 · fazla: 0 · doğrulanamadı: 3
Not: 11b'deki #1, #2, #4, #8-#10, #12, #13 aynen (bkz. 11b).
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | uzaklık satırı | kural | "Yaklaşık 350 m uzaktasın · 5 dk yürüme" + ÖNERİ, `.dst` 14/20 600, ikon 20 (kullanıcı noktası → pin kesikli yol) | yok: kod uzaklık göstermez (ölçüm yalnız `withinBoundary` içinde, checkin/index.tsx:106-112); KURAL 6 (konum/uzaklık hiçbir kullanıcıya), ÖNERİ etiketli |
| 2 | "Yol tarifi" düğmesi | özellik yok | soft düğme, yol ikonu + "ÖNERİ" rozeti | yok |
| 3 | ana düğme ikonu | ikon | "Konumumu kullan" **yenile (dönen ok)** ikonu md | Btn icon="pin" (checkin/index.tsx:157) — pin ≠ yenile |
| 4 | bildirim rengi/ikon | renk | `.nb2.wn` zemin #FFF1D6 yazı #6B4400 ikon #8A5A00 (koyu rgba(255,181,71,.14) #FFC86B) | colors.warnSoft / onWarnSoft (skall.css --warn-soft #FFF1D6, --on-warn-soft #5C3A00): yazı #5C3A00 ≠ pano #6B4400; ikon 'warn' (ünlem dairesi) DOĞRULANAMADI |
| 5 | bildirim metni | metin | "Kampüsün içinde görünmüyorsun" / "Kampüse girince tekrar dene." | tr.ts:892-895 UYUYOR (campus türü); kafe için "Mekanın…" kodda var, pano çizmiyor |
| 6 | "mekan çok uzak" hâli | fazla | yok | tooFarTitle/tooFarNote (tr.ts:896-898) sınırı olmayan mekan için |
| 7 | peek | resim | 3a0a335a | Peek 'locateAway'; birebirlik DOĞRULANAMADI |

## 12 Geçit · günün sorusu — project/GecitSoru.dc.html
Kod: apps/mobile/app/(app)/district/gate.tsx, src/features/district/parts.tsx (HeroScreen, HeroBar, HeroRound, Foot, TicketShell), src/theme/semt.ts
Öğe sayısı: 34 · uyuyor: 21 · fark: 9 · fazla: 0 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | üst başlık | yazı | `.title` 21/26 700 beyaz "Günün sorusu"; `.ey2` 13/18 600 .78 "Beylikdüzü" | T h3 16/22 600 (gate.tsx:~94), T fine strong 13/18 (gate.tsx:~89) |
| 2 | sağ üst bilgi düğmesi | özellik yok | `.round.gl.inf` 44, "i" ikonu, aria "Geçit nasıl çalışır" | yok (HeroBar'da yalnız geri, gate.tsx:~82-98) |
| 3 | soru kâğıdı yazıları | yazı | eyebrow `.ne` 700 12/16 ls .3 #C2185B; soru `.nq` 700 22/29 ls -.3 #16141C | eyebrow T 'eyebrow' 600 12/16 ls .24; soru T 'title' 600 21/27 ls -.3 (gate.tsx:~148-156) |
| 4 | seçenek metni | yazı | `.vl` 700 19/24 | T 'title' 600 21/27 (gate.tsx:~226) |
| 5 | seçenek harfi | yazı | `.lt` 800 17/1 muted | T h3 16/22 600 (gate.tsx:~215) |
| 6 | seçili seçenek işareti | ikon | check 22×22 (svg 22) kalınlık 3 | CapIcon check KIT.size.icon (24) (gate.tsx:~211) |
| 7 | ana düğme | ölçü | `.btn.big` yükseklik **56**, yazı 700 **17/22** | Btn block 48, 16/600 (gate.tsx:~112, Btn tall verilmedi) |
| 8 | ipucu | yazı | `.hint` 13/18 500 muted, alt 12 | T fine center (gate.tsx:~100) UYUYOR; alt boşluk Foot gap 8 (SPACING[2]) ≠ 12 (parts.tsx:740) |
| 9 | alt boşluk | ölçü | foot bottom 46, yan 20, gap 12 | Foot gap 8; altı HeroScreen'de DOĞRULANAMADI |
| 10 | kâğıt, pin, eğim, gölge, bilet kesikleri | ölçü | pano değerleri | SEMT.note/ticket (semt.ts:48-95) birebir UYUYOR |
| 11 | hero | ölçü/resim | 360 yük., 20'lik tarak yarıçap 8; blob 6daee66f | SEMT.hero (gate 300+60) UYUYOR; resim birebirlik DOĞRULANAMADI |
| 12 | metinler | metin | "GEÇİDİN SORUSU · TEK HAK", "Tek hakkın var, gönderince değiştiremezsin.", "Geçide söyle" | tr.ts:1161-1167 UYUYOR |

## 13 Geçit açıldı — project/GecitAcik.dc.html
Kod: apps/mobile/app/(app)/district/open.tsx, parts.tsx HeroPage/TicketShell
Öğe sayısı: 22 · uyuyor: 12 · fark: 7 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | başlık "Geçit açıldı!" | yazı | 700 32/38 ls -.8 | T 'display' 500 32/42 ls -.8 (parts.tsx:950) — kalınlık 700 ≠ 500, satır 38 ≠ 42 |
| 2 | gövde | yazı | 500 15/22 muted | T body UYUYOR |
| 3 | bilet taban yazısı | yazı | `.stub b` "2 sa" 800 17/20 | T h3 16/22 600 (open.tsx:~52) |
| 4 | bilet eyebrow | yazı | `.te` 700 11/14 ls .4 accent | T 'eyebrow' 600 12/16 ls .24 (open.tsx:~63) |
| 5 | bilet ad | yazı | `.tn` 700 17/22 | T h3 16/22 600 (open.tsx:~66) |
| 6 | ana düğme | ölçü | 56 yük., 700 17/22 | 48 (open.tsx:~29, bkz. 12 #7) |
| 7 | hero | ölçü | 400 yük., object-position 50% 100%, kapat sağ üst | SEMT.hero.tall 340+60 UYUYOR; kapatma HeroPage onClose UYUYOR |
| 8 | bilet ölçüleri/metinleri | ölçü/metin | 88, 18, taban 84, kesik 9, iç 14 16 14 20, "SOHBET BİLETİ", "Beylikdüzü sohbeti", "Süre, içeri girdiğin an başlar.", "Doğru bildin. Beylikdüzü sohbeti seni bekliyor." | SEMT.entryTicket, tr.ts:1170-1180 UYUYOR |

## 14 Semt sohbeti · ilk gelen — project/SemtSohbet.dc.html
Kod: apps/mobile/app/(app)/district/room.tsx (FirstHere 593-615, TimeChip), src/components/ChatTopBar.tsx, IdentityToggle.tsx, ChatEmptyCard.tsx, Composer.tsx, theme/chatLook.ts, dm.ts
Öğe sayısı: 38 · uyuyor: 24 · fark: 8 · fazla: 2 · doğrulanamadı: 4
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | üst kapsül alt satırı | kural | "Sadece sen buradasın" 12/16 500 (oda kişi sayısı) | yok: üst çubukta alt satır verilmiyor, "kişi sayısı hiçbir yerde yok" (room.tsx:~75 notu, `ChatTopBar` subtitle verilmez). Sayı yalnız Odadakiler sayfasında (tr.people.sub). KURAL 4 (oda kişi sayısı yalnız Odadakiler yanıtıyla; üst çubuk ayrı yanıt çağırmalı) — karar proje sahibinin |
| 2 | önerilen ilk mesaj çipleri | özellik yok | `.sug`: "Selam Beylikdüzü! 👋", "Bu akşam ne yapıyorsunuz?", "Önerin var mı?" (36 yük., iç 14, beyaz, alt 110, yatay) | çizilmiyor ("no behaviour is given them", room.tsx:~590) |
| 3 | ilk mesaj kartı başlığı | yazı | `.et` 700 16/22 | T h3 600 16/22 ls -.1 (ChatEmptyCard.tsx:60) — chatLook.ts:~50 yorumu 700 diyor, uygulanmamış |
| 4 | ilk mesaj kartı metni | metin | "Odaya henüz kimse yazmadı. İlk mesajı sen yaz, gelenler görür." | "…sen yaz; gelenler görür." noktalı virgül (tr.ts:1205) |
| 5 | alan metni | metin | "Beylikdüzü'ye yaz…" | `inflectTr(name,'dative')+' yaz…'` (tr.ts:1199): ek biçimi inflectTr'ye bağlı, "Beylikdüzü'ne/'ye" DOĞRULANAMADI |
| 6 | kimlik anahtarı | ölçü | `.tog` iç 3, slot 36, yüz 32, seçili halka 2.5 --primary kutu gölgesi, seçili olmayan opaklık .55 | slot 36 pad 3 (chatLook.ts:13) UYUYOR; seçili slot beyaz zemin + 2.5 kenarlık (yüz 36-5=31) ve kilit rozeti (IdentityToggle.tsx:~84-108): yüz 31 ≠ 32, beyaz zemin ve kilit rozeti FAZLA |
| 7 | başlık yazısı | yazı | `.who .nm b` 16/20 600 | dmName 16/20 600 UYUYOR |
| 8 | kalan süre çipi | yazı | `.tmr` 700 13/18; "kaldı" 500 muted | T fine strong + T fine (parts.tsx:597-600): kalınlık 600/'strong' değeri DOĞRULANAMADI |
| 9 | düğmeler | ölçü | geri/menü round soft 44; capsule 52; alan 52, gönder 52 | DM.bar (dm.ts) pill 52 UYUYOR; gönder düğmesi ölçüsü DOĞRULANAMADI (Composer.tsx) |
| 10 | arkaplan duvar kağıdı + üst bant | resim | blob e07afded / 32631775, bant 132 #F5E9D8 → saydam | wall="semt" (ChatScreen), assets/riso/wall-*; birebirlik DOĞRULANAMADI |
| 11 | yazım alanı emoji düğmesi | ikon | `.ib` 40, emoji ikonu soldaki | Composer.tsx (emoji düğmesi) UYUYOR varsayıldı, DOĞRULANAMADI |
| 12 | şablon dışı | fazla | yok | yükleme/hata hâlleri, yanıt/alıntı çubuğu (room.tsx:~480-520) — pano çizmiyor |

## 15 Semt sohbeti · seçenekler menüsü — project/SemtSecenek.dc.html
Kod: room.tsx:468-474, src/features/district/RoomSheets.tsx (OptionsSheet), People.tsx, components/Menu.tsx
Öğe sayısı: 44 · uyuyor: 22 · fark: 9 · fazla: 3 · doğrulanamadı: 2
Not: arka plan 14'ün aynısı (bkz. 14 #1-#12; boş durum hâlinde sohbet).
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | menünün biçimi | düzen | sağ üstten (sağ 12, üst 112) 292 genişlikte açılır menü: köşe 28, iç 8, gölge 0 18 48 .22 + 0 0 0 1px .06; perde yok görünüyor (`.scrim` stilli ama kullanılmıyor) | alt sayfa (Sheet) başlık "Semt sohbeti seçenekleri" + kapat + "Bitti" düğmesi + perde (RoomSheets.tsx:60-107; room.tsx:468) |
| 2 | satır 1 "Odadakiler" | metin | "Odadakiler" + sağda "1 kişi" (14/18 500 muted), ikon iki kişi, 22 | MenuItem "Odadakiler", sağ değer yok (RoomSheets.tsx:88-93, tr.ts:1215); KURAL 4 (sayı; yalnız Odadakiler yanıtıyla, bkz. 14 #1) |
| 3 | satır 2 "Sessize aldıkların" | düzen | tek satır, sağ "Kimse yok" (devre dışı, ikon .5, yazı muted); sessiz ikon + çarpı | menü içinde ayrı bölüm: başlık "Sessize aldıkların", liste ya da "kimse yok" metni, her biri MenuItem "Sessizden çıkar" (RoomSheets.tsx:67-86) |
| 4 | satır 3 "Sohbet kuralları" | özellik yok | bilgi (i) ikonlu satır, 16/20 600 | yok (tr.ts'te "Sohbet kuralları" metni yok); satırın ne açtığı da belli değil |
| 5 | satır 4 "Sohbetten çık" | metin | "Sohbetten çık", danger, çıkış ikonu | "Oturumu kapat" (tr.ts:1244) + 'log-out-outline' ikonu (RoomSheets.tsx:94-100); tr.district.room.leave "Sohbetten çık" tanımlı ama kullanılmıyor (tr.ts:1208). Basınca onay iletişim kutusu (endSessionOptions) — pano açmıyor, DOĞRULANAMADI |
| 6 | satır ölçüleri | ölçü | `.pi` min 48, iç 6 12, gap 14, ikon 22, ayırıcı sol 48 sağ 12 rgba(3,27,11,.10), danger grubu ayırıcı 6 12 | Menu/MenuItem değerleri DOĞRULANAMADI (components/Menu.tsx okunmadı) |
| 7 | "Bitti" düğmesi | fazla | yok | glassy "Bitti" (tr.venueChat.done, RoomSheets.tsx:102) |
| 8 | başlık "Semt sohbeti seçenekleri" | fazla | yok (menüde başlık yok) | Sheet başlığı (RoomSheets.tsx:60) |
| 9 | açılış yeri | davranış | üst sağdaki ⋮ düğmesinden açılır | alttan kayar (Sheet) |
| 10 | ⋮ düğmesi | ikon | dikey üç nokta md 24 | Round icon 'moreV' md (room.tsx:~466) UYUYOR |

## Koyu hâl eklemesi (koyu.css pA + panoların `.dark` kuralları ↔ theme.ts palettes.dark, auraKit.ts dark, aura.ts AURA.dark, semt.ts, explore.ts, mapStyle.ts)
Ölçüldü ve UYUYOR (dark palet): canvas #000, surface #151A18, surface2 #1B211F, text #EEF3F0, muted #A3AEA8, placeholder #8F9A94, accent #3DDC84, control/grab #2A332F, track #1B211F, disabled #1F2623, calm/onCalm, feature/onFeature, cam #121614 + kenar .09 (theme.ts:66-125, auraKit.ts:520-560); sekme çubuğu koyu (aura.ts:61-80); seg koyu (.94 beyaz / #0B0E0D); Geçit bilet/seçenek ve açık bilet koyu değerleri (semt.ts:ticket, entryTicket) birebir; Keşfet koyu arama/çip/Semte kartı; alt sayfa koyu #121614 + halka .08 (auraKit.ts:1225-1227).
| # | pano | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- | --- |
| K1 | 08 | hediye kartı koyuda | koyu | `.glass.gift` koyu düz #121614, kenar .09, gölge yok | koyu şemada da yeşil-koyu degrade zemin GIFT_CARD.ground, gölge 0 18 40 .28 (gifts.ts:88-91; GiftCard.tsx:108) |
| K2 | 08b, 10c | kaydırma bandı koyu | koyu | rgba(0,0,0,.86) + blur | rgba(0,0,0,.84) (aura.ts:~64) |
| K3 | 09 | alt sayfa koyu kenar | koyu | `.glass` koyu: glass-line rgba(255,255,255,.09), yan sayfa içi `.btn.soft` #1B211F | sheetShadow halkası .08 (auraKit.ts:1227) — .09 ≠ .08 |
| K4 | 11 | harita koyu renkleri | koyu | land #101513, sea #08201A, kenar #0B0F0D, yol #2A3330, etiket #7D8C85, deniz etiketi #3E7A63 | land #101513 UYUYOR; water #14231B, yol #202825, casing #2A332F, label #8F9A94 (mapStyle.ts:47-59); explore.ts dark.mapLabel #7D8C85 yalnız "© OpenStreetMap" |
| K5 | 11 | iğne ad hapı ve rozet koyu | koyu | ad hapı #121614 yazı #EEF3F0 halka .08, seçili #EEF3F0/#031B0B; resim halkası #000; rozet kenarı #000 | hap yok (bkz. 11 #3); etiket düz yazı colors.text + halo colors.surface (ExploreMap.tsx:~270) |
| K6 | 11b, 11c | uyarı şeritleri koyu | koyu | `.nb2.dg` koyu zemin rgba(255,151,126,.12) yazı #FF977E; `.nb2.wn` rgba(255,181,71,.14) yazı #FFC86B ikon #FFC86B | dangerSoft koyu #3A1E22 (theme.ts), warnSoft #3A2A10 yazı #FFE2B3 (LocateNotice.tsx:~28-30): dolgu ve wn yazı rengi ayrışıyor |
| K7 | 11b, 11c, 15 | perde koyu | koyu | rgba(0,0,0,.66) | .70 (auraKit.ts:1210) |
| K8 | 11b, 11c | üst yuvarlak düğmeler koyu | koyu | `.tp .round` koyu rgba(18,22,20,.78) kenar .12 | Round light varyantı koyu değeri DOĞRULANAMADI |
| K9 | 10, 10b | Semte kartı düğmesi koyu | koyu | `.dark .btn.primary` beyaz .94, gölge yok (3 sınıf özgüllüğü `.semt .btn` gölgesini bastırır) | Btn primary koyu değeri okunmadı; koyuda 0 4 10 .28 gölge çiziliyor mu DOĞRULANAMADI |
| K10 | 13 | bilet eyebrow rengi (açık) | renk | `.te` accent #0B783D (açık) | SEMT.eyebrow.light #0A7139 (semt.ts) |
| K11 | 14 | semt balonu rengi (iki hâl) | koyu | `--bubble-dm` açık #0E8745, koyu #0B783D, gölge koyuda yok | kind 'mekan' ise paint.mekan #17834D / koyu #146B42 (auraKit.ts:~600, ChatBubble.tsx:300); semt odası renk türünü ayrı vermiyor, DOĞRULANAMADI hangisi |
| K12 | 14 | kimlik anahtarı koyu | koyu | `.dark .tog` zemin #1B211F; seçili halka 2.5 #3DDC84; seçilmeyen opaklık .55 | halka 2 (identityToggle ring), renk KIT.primary #0E8745 her iki şemada, seçili zemin KIT.white, seçilmeyen dim .45 (auraKit.ts:803-812, IdentityToggle.tsx:96-103). Not: 14 #6'da yüz 31 yazmıştım; ring 2 ile yüz 32 UYUYOR, doğrusu halka 2 ≠ 2.5 |
| K13 | 14 | zaman çipi, kart, alan, öneri koyu | koyu | #121614 + halka rgba(255,255,255,.08) | chatLook dark emptyCard #121614 + .08, composer koyu #121614 UYUYOR |
| K14 | 15 | menü koyu | koyu | `.dark .pop` #151A18 + halka .08; ayırıcı rgba(255,255,255,.10); danger #FF977E | layer.dark.menu #151A18, menuHair/menuDanger (auraKit.ts:1212-1230) UYUYOR; menü biçimi 15 #1 |

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 08 | 52 | 6 (+3 fazla) (koyu dahil) | evet |
| 08b | 58 | 7 (koyu dahil) | evet |
| 09 | 70 | 12 (+4 fazla) (koyu dahil) | evet |
| 10 | 54 | 6 (+2 fazla) (koyu dahil) | evet |
| 10b | 54 | 4 (+1 fazla) (koyu dahil) | evet |
| 10c | 78 | 7 (+1 fazla) (koyu dahil) | evet |
| 11 | 46 | 14 (+2 fazla) (koyu dahil) | evet |
| 11b | 48 | 9 (+1 fazla) (koyu dahil) | evet |
| 11c | 46 | 9 (koyu dahil) | evet |
| 12 | 34 | 9 (koyu dahil) | evet |
| 13 | 22 | 8 (koyu dahil) | evet |
| 14 | 38 | 11 (+2 fazla) (koyu dahil) | evet |
| 15 | 44 | 10 (+3 fazla) (koyu dahil) | evet |

Sınırlar: ölçüleri uyuyor saydığım öğelerde token değerleri (explore.ts, activities.ts, flatLists.ts, venueDetail.ts, semt.ts, chatLook.ts, aura.ts) okunarak karşılaştırıldı; cihazda çizilmiş görüntü yok, resimlerin (blob) piksel birebirliği doğrulanamadı (BLOBLAR.md: depoda sha256 karşılığı yok).
