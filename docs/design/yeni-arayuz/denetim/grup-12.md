# Pano–kod denetimi, grup 12 (pano 112–124)

Genel notlar (her panoda geçerli, bir kez yazıldı):
- Ortak sekme çubuğu (`.tb`/`.ti`, `.fade`): kod `src/components/TabBar.tsx`, `src/motion/TabBar.tsx`, `src/theme/aura.ts:93-114,23-80`. Boy 60, kenar 20, iç 5, sekme 50, ikon 20, etiket 10/13, açık/koyu renkler, 150 px alt gradyan pano ile UYUYOR. İki fark: (T1) etiket harf aralığı panoda `.1px`, kodda yok (`tokens.ts:359` tabLabel letterSpacing yok). (T2) alt boşluk panoda ekranın altından 30 (390×844 çerçeve, güvenli alan yok); kodda `insets.bottom + AURA.tabBar.bottom (12)` (`TabBar.tsx:329`): gerçek telefonda eşitliği DOĞRULANAMADI (gezinme çubuğu yüksekliğine bağlı).
- Panolardaki `ÖNERİ` rozeti (`.ob`) tasarım notudur; üretime girmemeli (120, 123, 124).
- Resim boyutları BLOBLAR.md ile kodun assets dosyalarında eşleşti: `peek-explore.webp` 600×340 = cbda3ee9; `empty-explore.webp` 640×520 = 00874320; `empty-search.webp` 900×600 = 4ba27f14; `empty-dm.webp` 360×294 (oran 640×520 ile aynı) = d4921959; `wall-dm-light/dark.webp` 1290×2796 = 564f379c / e7ec12cc; `semt/kesfet-semt.webp` 1050×600 = d265dd1c. Blob dosyalarının kendisi depoda olmadığından piksel eşitliği DOĞRULANAMADI; yalnız boyutlar.

---

## 112 Keşfet · mekan yok — project/KesfetBos.dc.html
Kod: `app/(app)/(tabs)/explore/index.tsx` (ExploreScreen, ListBody, Question, KindChips/KindChip, VenueList, ListEmpty), `src/features/district/DistrictCard.tsx` (Scene), `src/theme/explore.ts`, `src/theme/auraKit.ts`, `src/components/TabBar.tsx`
Öğe sayısı: 23 · uyuyor: 13 · fark: 8 · fazla: 1 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Başlık `.kh` satır yüksekliği | ölçü | 32/38 700, ls -1 (`.kh`, skall.css'i ezer) | 32/41 (`KIT_TYPE.kesfetTitle`, auraKit.ts:63; yorum: Android'de kuyruk kesilmesin diye bilerek) |
| 2 | Başlık satır kırılması | metin/düzen | "Bu akşam nerede" / yeşil "oturuyorsun?" (`<br>` "nerede"den sonra) | "Bu akşam" / "nerede " + yeşil "oturuyorsun?" (tr.ts:580 `'Bu akşam\nnerede '`; index.tsx:395-396) |
| 3 | Tür çipleri (Tümü, Kampüs, Kafe ve mekan) boyu | ölçü | 40 (`.ch .chip{height:40px}`); iç 14, 600 14/18, gap 8 | 36 (`KIT.size.chip`, auraKit.ts:865; index.tsx:464); iç 14 ve gap 8 uyuyor. Dar ekranda 46 |
| 4 | Semte Git kartı yüksekliği | ölçü | sabit 200 (`height:200`) | `minHeight: 200` (explore.ts:62; DistrictCard.tsx:130) |
| 5 | Semte Git düğmesi metni | metin | "Semte git" | "Semte Git" (tr.ts:1108) |
| 6 | Semte Git düğmesi ikonu | ikon | yok, yalnız yazı | sağda `forward` oku 16 (DistrictCard.tsx:324-330) |
| 7 | Semte Git düğmesi iç boşluğu | boşluk | `padding: 0 18` | `btnPadXSm` 16 (`kit.tsx:368`, auraKit.ts btnPadXSm) |
| 8 | Şehir düğmesinin yanındaki "N mekan" sayacı | davranış | boş durumda sayaç YOK (yalnız "Tüm şehirler ⌄" ve "Ada göre ⌄") | boşken de "0 mekan" yazılıyor (index.tsx:667-669) |
| 9 | Boş durumun üst boşluğu | boşluk | şehir satırından 10 (`.emp` padding-top 10; `.lst` yok) | 4 (`rowsTop`) + 10 (`empty.top`) = 14 (index.tsx:694, 784; explore.ts:30,48) |
| 10 | Şehir düğmesindeki ok | davranış | oklu ve basılabilir | liste boşken `choosable` false: ok çizilmiyor, düğme pasif (index.tsx:588,660) |
| 11 | Sekme etiketi harf aralığı | yazı | .1px | yok — bkz. genel not T1 |
| 12 | Sekme çubuğu alt boşluğu | ölçü | 30 | DOĞRULANAMADI — bkz. T2 |
| 13 | "Şu an buradasın" kartı (HereNow) | fazla | panoda yok (Semte Git ile şehir satırı arası) | giriş yapılmışsa çiziliyor (index.tsx:593-597, 514-547); explore.ts:34 "pano çizmiyor" diyor |

Uyuyanlar (13): üst satır "CUMARTESİ AKŞAMI" (12/16, ls .24), arama alanı (48, 20 iç, 8 ikon aralığı, 20 ikon, "Mekan ara", koyuda #121614), harita yuvarlağı 48, gözcü kanki (178, sağdan 64, 22 üstte), Semte Git zemin resmi/yazıları (SEMT SOHBETİ, başlık 18/23, açıklama 13/18, %58 genişlik), şehir düğmesi (36, 10/8 iç, pin 18, ok 18, 15/20 700), "Ada göre" (32, 10/4, ok 18), boş resim 100×82, boş başlık "Henüz mekan yok" (15/20 600, 12 üst), cümle "Şu an listede mekan yok." (13/18, 240), alt solma 150, sekme çubuğu geneli, açık/koyu zemin.

## 113 DM · henüz mesaj yok — project/DmBos.dc.html
Kod: `app/(app)/(tabs)/messages/[threadId].tsx` (DmScreen, boş kart satır 509-533), `src/components/ChatTopBar.tsx`, `src/components/Composer.tsx` (CapsuleBar), `src/components/EmptyState.tsx`, `src/theme/dm.ts`
Öğe sayısı: 19 · uyuyor: 9 · fark: 9 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst kapsülde "Sohbette ara" düğmesi | özellik yok | `.ib` 40×44, arama ikonu, kapsülün sağında (Diğer'in solunda) | yok; yalnız Diğer (`ChatTopBar.tsx` actions, [threadId].tsx:558-570). Sohbet içi arama ucu/ekranı kodda yok |
| 2 | Mesaj alanı: emoji düğmesi | özellik yok | alanın solunda `.ib` 40, gülen yüz ikonu | yok; DM.ts:151 "the app has not" |
| 3 | Mesaj alanı: "Dosya ekle" (ataç) | özellik yok | sağda `.ib` 40 | yok |
| 4 | Mesaj alanı: "Kamera" | özellik yok | sağda `.ib` 40 | yok |
| 5 | Mesaj alanı: "Sesli mesaj" (mikrofon) | özellik yok | sağda `.ib` 40 | yok; dm_messages yalnız `body text` (migration 20261005090000_friends_dm.sql:107-113), ses/dosya yolu yok |
| 6 | Alan iç boşluğu / metin başı | boşluk | `padding:0 6`, yazı emoji düğmesinden sonra (≈52 soldan) | `padLeft` 20 (dm.ts:151 composer.padLeft; Composer.tsx:356,419) |
| 7 | İpucu metni | metin | "Mesaj yaz" | "Mesaj yaz…" (tr.ts:701) |
| 8 | Boş kart iç boşluğu | boşluk | kartta üst 22, yan 20 (`.demp .emp{padding:22 20 24}`), resim kartın 22'sinde | kart padTop 22 + yan 20 (dm.ts:45) AMA içindeki `EmptyState compact` ayrıca üst 18 (`emptyTopSm`) ve yan 24 (`emptyPad`) ekliyor: resim üstten 40, yan 44 (EmptyState.tsx:268-269, auraKit.ts:948,954) |
| 9 | Boş kart başlığının üst boşluğu | boşluk | 10 (`.demp .et{margin:10px 0 0}`) | 12 (`emptyTitleTop`, auraKit.ts:944; EmptyState.tsx:197) |
| 10 | Duvar kâğıdı + üst bant (132, #D9E8F7→şeffaf / koyu #000) | doğrulanamadı | bant 132 px, %40'a kadar düz | `WallBand` ChatWallpaper.tsx/ChatScreen.tsx:1315-1380; bant yüksekliği ve renk değerleri bu denetimde satır satır okunmadı |

Uyuyanlar (9): duvar resimleri, geri yuvarlağı 44 (soft), kapsül 52 (yüz 40, 6 iç, 10 ad aralığı), ad "Kadir" 16/20 600, "Profili gör" 12/16, Diğer 44 yuvarlak, boş kart 44 yandan/28 köşe/yüzey/gölge, resim 120×98, başlık+cümle metinleri ("Henüz mesaj yok." / "İlk mesajı sen yaz.", tr.ts:716-717), alan 52 yükseklik/12 yan/26 köşe/gönder yok iken gizli.

## 114 Mesajlar · arama, klavye açık — project/MesajlarAra.dc.html
Kod: `app/(app)/(tabs)/messages/index.tsx`, `src/aura/GlassSearch.tsx`, `src/features/friends/InboxRows.tsx`, `src/theme/messages.ts`
Öğe sayısı: 21 · uyuyor: 13 · fark: 7 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Arama alanı yan iç boşluğu | boşluk | 20 (`.field` padding 0 var(--s5)) | sol 18 (`capsulePadX`, auraKit.ts:900; GlassSearch.tsx:49) |
| 2 | Arama ikonu rengi | renk | `--ci-a/--ci-b: var(--muted)` (açık #4A6550, koyu #A3AEA8) | `colors.placeholder` (açık #56785E, koyu #8F9A94) (GlassSearch.tsx:59) |
| 3 | Temizle (×) düğmesi görünümü | ikon | 36 yuvarlak, 20 ikon: %22 saydam yumuşak disk + 2.2 çizgili çarpı | `Round icon="close"` düz kalın çarpı (capIcons `close`, 3.2 kalınlık), disk yok (messages/index.tsx:107-118) |
| 4 | Temizle düğmesinin konumu | boşluk | `margin-right:-10` (alanın sağ kenarından 10 içeride) | alanın sağ iç boşluğu 3 (`switchPad`, GlassSearch.tsx:50) → kenardan 3 |
| 5 | Satır önizlemesi taşması | davranış | sağ 44 px solma maskesi (`.pv` mask), "…" yok | `T lines={1}` → "…" ile kesiliyor (InboxRows.tsx:245-256) — Fevve satırı |
| 6 | Satır önizlemesi taşması (2. satır) | davranış | aynı | aynı — Furkan satırı |
| 7 | "Furkan" satırında sessiz ikonu (`.mu`, çan+çizgi 16, muted) ve "Sessizde" etiketi | özellik yok | ad yanında 16 ikon | yok; DM sessize alma özelliği yok (`dm_thread_prefs` yalnız pin/arşiv/silme: migration 20261217090000_dm_manage.sql; `muted` kolonu yok) |
| 8 | Sekme çubuğu | doğrulanamadı | bkz. T2 | |

Uyuyanlar (13): başlık "Mesajlar" 32/42 500, Yeni mesaj yuvarlağı (44, soft, kalem), zil yuvarlağı (+nokta 9, 9/10, 2 halka), alan 48/glass/yazı 15/22, sonuç etiketi "2 SOHBET" (12/16, ls .24, 4 üstte; tr.ts `found` + `upperTr`), satır ölçüleri (10/20 iç, 12 aralık, yüz 48 + 2 halka, min 72, çizgi yok), ad 16/22 600, zaman 13/18 (okunmamışta vurgu 700), önizleme 15/22 (okunmamış 600 mürekkep), rozet (min 20, 11/700, buzz), "Sohbetler/İstekler" kapsülünün ve sabit/arşiv satırlarının arama sırasında gizlenmesi, 12 aralık, alt solma.

## 115 Mesajlar · arama sonuçsuz — project/MesajlarAraBos.dc.html
Kod: `messages/index.tsx` (Chats: satır 280-292), `src/components/EmptyState.tsx`, GlassSearch
Öğe sayısı: 13 · uyuyor: 6 · fark: 5 · fazla: 0 · doğrulanamadı: 1 (sekme çubuğu T2) · (zemin 1 uyuyor)
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Alan iç boşluğu | boşluk | 20 | 18 — bkz. 114 #1 |
| 2 | Arama ikonu rengi | renk | muted | placeholder — bkz. 114 #2 |
| 3 | Temizle düğmesi | ikon/boşluk | yumuşak disk + çarpı, sağdan -10 | düz çarpı, sağdan 3 — bkz. 114 #3-4 |
| 4 | Boş durumun dikey yeri | düzen | alanın altında kalan boşlukta dikey ortada, altta 190 boşlukla yukarı kaymış (`.emp{flex:1; justify-content:center; padding:0 24 190}`) | `flex-1 justify-center`, 190 alt boşluk yok; üstte ayrıca `emptyTopSm` 18 (messages/index.tsx:283; EmptyState.tsx:268) → çıkarım: ≈90-100 dp aşağıda (telefonda bakılmalı) |
| 5 | Cümle azami genişliği | ölçü | 240 (`.ed{max-width:240}`) | 260 (`emptyNoteMax`, auraKit.ts:946) |

Uyuyanlar: başlık/butonlar/zil, resim 120×(98 kutu, contain; 900×600 → çizilen 120×80; kod `RISO_BOARD.search` 120×80, EmptyState.tsx:84), başlık "Sohbet bulunamadı" (15/20 600, 12 üst; tr.ts:318), cümle "Başka bir ad dene." (13/18 muted; tr.ts:319), alt solma, zemin.

## 116 Keşfet · arama, klavye açık — project/KesfetAra.dc.html
Kod: `explore/index.tsx` (SearchRow 1099-1172, VenueList, PlaceRow 837-883), `src/theme/explore.ts`
Öğe sayısı: 29 · uyuyor: 19 · fark: 9 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Aramada başlık bloğu | davranış | satır "CUMARTESİ AKŞAMI", büyük başlık ve gözcü kanki YOK; arama alanı üstten 116'da (`.sr{margin-top:56}`) | yazarken bile hepsi duruyor; alan sticky (index.tsx:328-370). Pano durumu: yazma başlayınca başlık+kanki kalkıyor (çıkarım: kodda böyle bir geçiş yok) |
| 2 | Semte Git kartı | davranış | arama durumunda gizli (`.semt{display:none}`) | her zaman çiziliyor (index.tsx:592; DistrictCard sorguyu bilmiyor) |
| 3 | Çip "Tümü" boyu | ölçü | 40 | 36 — bkz. 112 #3 |
| 4 | Çip "Kampüs" boyu | ölçü | 40 | 36 |
| 5 | Çip "Kafe ve mekan" boyu | ölçü | 40 | 36 |
| 6 | Satır alt yazısı "Kafe ve mekan · Kadıköy" | metin | "Kafe ve mekan · <semt>" (3 satırın üçü) | "Kafe · <semt>" (`typeLabel.kafe` = 'Kafe', tr.ts:524; index.tsx:894) — 3 satır |
| 7 | Durum "1 masa" | metin | masa sayısı yazıyor (Bahçe Kafe) | kova adı: "Birkaç açık masa" (tr.ts:518, K-41) — KURAL 6 / K-41: panodaki "1 masa" sayı gösteriyor; karar proje sahibinin |
| 8 | Sekme çubuğu alt boşluğu | doğrulanamadı | | bkz. T2 |

Uyuyanlar (19): arama alanı (48, beyaz/koyu #121614, "kaf" yazısı 15/22), arama ikonu, temizle (36, -10, %22 disk + çarpı; Keşfet'te doğru: index.tsx:1175-1197), harita yuvarlağı, şehir düğmesi + "3 mekan" (13/18, 10 boşluk), "Ada göre", satır ölçüleri (10/20, 12, 76 min, resim 56/16), ad 16/22 600, alt yazı 13/18, "Sessiz" 12/16 600, durum noktası 7, ok 18/-4, alt solma, sekme.

## 117 Keşfet · arama sonuçsuz — project/KesfetAraBos.dc.html
Kod: `explore/index.tsx` (ListEmpty 767-807, VenueList 694-705)
Öğe sayısı: 16 · uyuyor: 8 · fark: 7 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Başlık bloğu + kanki | davranış | yok (116 #1 gibi) | duruyor |
| 2 | Semte Git kartı | davranış | gizli | çiziliyor |
| 3-5 | Üç çip boyu | ölçü | 40 | 36 (bkz. 112 #3) |
| 6 | Şehir satırında sayaç | davranış | "0 mekan"/sayı YOK (yalnız şehir ve sıralama) | `0 mekan` yazılıyor (index.tsx:667-669) |
| 7 | Boş durumun yeri | düzen | kalan alanda dikey ortada (`.emp{flex:1 0 auto; justify-content:center; padding:0 24 150}`) | şehir satırının hemen altında, üstten 14 (`ListEmpty`, `align` merkez yok; index.tsx:694-705,784); KesfetBos'un üste yaslı düzeni arama sonuçsuzda da kullanılıyor |
| 8 | Sekme çubuğu | doğrulanamadı | | bkz. T2 |

Uyuyanlar (8): resim 120×98 contain (900×600), başlık "Mekan bulunamadı" (tr.ts:544), cümle "Başka bir ad dene." (240), alan/ikon/temizle/harita, şehir düğmesi, "Ada göre", alt solma, zemin.

## 118 DM · klavye açık, yazarken — project/DmKlavye.dc.html
Kod: `[threadId].tsx`, `src/components/ChatBubble.tsx`, `ChatScreen.tsx`, `Composer.tsx`, `src/theme/dm.ts`, `auraKit.ts`
Öğe sayısı: 24 · uyuyor: 18 · fark: 5 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Aynı yazarın ardışık balonları arası | boşluk | 2 (`.flow{gap:2}`); yazar değişince 2+8+2 = 12 | 3 (`KIT.size.runGap`, auraKit.ts:1061; ChatScreen.tsx:197,1339,1358); 12 (`runApart`) uyuyor |
| 2 | Okundu işareti | ikon | 16, çizgi 2.4, yol `M2.5 12.8l4.2 4.2L15 8.4M10.4 16.4l.6.6 8.4-8.6` | çizgi 2, yol `M2 12.5l4.2 4.2L14 8.4M10.6 16.7 18.6 8.4` (ChatBubble.tsx:1574,1585) |
| 3 | Üstte "Sohbette ara" düğmesi | özellik yok | var (`.ib`) | yok — bkz. 113 #1 |
| 4 | Alanın solunda emoji düğmesi | özellik yok | 40 `.ib`; yazı ondan sonra | yok — bkz. 113 #2, #6 |
| 5 | Duvar kâğıdı/bant | doğrulanamadı | | bkz. 113 #10 |

Uyuyanlar (18): geri/kapsül/yüz/ad/alt yazı, gün çipleri ("Dün", "Bugün"; 12/16, 4/12, 10 üst, 8 alt), balon (18/6 ayak, 7/12 iç, %78, yeşil #0E8745/koyu #0B783D, gölge, "me" beyaz/koyu #E6EEE9), zaman 11/14 renkleri, tepki hapları (30, 4/10 iç, 22 yüz, 12/16; tr.chat.reactions "Bayıldım"/"Kahkaha"), alan 52/26, yazılan metin 15/22, gönder 52 (mürekkep, 22 uçak, gölge; koyuda %94 beyaz), 12 yan/8 aralık, klavye üstü düzen.

## 119 DM · yanıt yazarken — project/DmYanit.dc.html
Kod: aynı + `Composer.tsx` DmStrip (satır 482-557)
Öğe sayısı: 26 · uyuyor: 20 · fark: 5 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Yanıtlanan mesajın halkası | eksik | `.msg.sel`: 2 px ink halka (box-shadow 0 0 0 2px; koyuda #EEF3F0) | yok; yalnız düzenlemede dış çizgi var (`editing` → ChatBubble.tsx:438-445); yanıt hedefi balonda işaretlenmiyor ([threadId].tsx:440-461 `editing` verir, `reply.target` vermez) |
| 2 | Ardışık balon aralığı | boşluk | 2 | 3 — bkz. 118 #1 |
| 3 | Okundu işareti | ikon | bkz. 118 #2 | |
| 4 | "Sohbette ara" düğmesi | özellik yok | var | yok |
| 5 | Emoji düğmesi | özellik yok | var | yok |
| 6 | Duvar/bant | doğrulanamadı | | bkz. 113 #10 |

Uyuyanlar (20): şerit `.eb` (20 köşe, 8/6/14 iç, 10 aralık, ikon 20, × 36/18, cam/koyu #121614 + .08 çizgi), şerit başlığı "Yanıtlanan: Fevve" (tr.ts:984) 13/700, alıntı satırı 13/500 muted tek satır, ×'in "Yanıtı kaldır" etiketi (tr.ts:985), şerit–alan arası 8, yanıt ikonu, alan/gönder (52, dolu), duvar, geri/kapsül/yüz/ad.

## 120 DM · fotoğraf gönder (ÖNERİ) — project/DmFotoOnizleme.dc.html
Kod: YOK. (`dm` fonksiyonu yalnız `body` taşır: migration 20261005090000_friends_dm.sql:107-113; `supabase/functions/dm/` yükleme/commit ucu yok; mobilde seçici/önizleme yok.)
Öğe sayısı: 8 · uyuyor: 0 · fark: 8 (EKRAN YOK) · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Tam ekran siyah zemin (açık ve koyu aynı) | özellik yok | #000 | EKRAN YOK |
| 2 | Kapat yuvarlağı | özellik yok | 44, rgba(255,255,255,.14), × ikon 18 beyaz, sol 16 üst 52 | yok |
| 3 | Başlık "Fevve'ye gönder" | özellik yok | 17/22 600 beyaz (ad `inflectTr` yönelme) | yok |
| 4 | "ÖNERİ" rozeti | özellik yok | 10/14 700 ls .4, #3DDC84 yazı, .14 beyaz zemin, 2/7 iç, 6 sol | yok (tasarım notu, üretime girmemeli) |
| 5 | Gönderilecek fotoğraf | özellik yok | tam genişlik, üst 120, yükseklik 520, cover (700×400 jpg) | yok |
| 6 | "Açıklama ekle" alanı | özellik yok | 52, 26 köşe, .12 beyaz, çizgi/gölge yok, sol 18, yazı .6 beyaz; alt 66, yan 12 | yok |
| 7 | Gönder düğmesi | özellik yok | beyaz yuvarlak, #0B0E0D uçak (bu panoda 44 — DM panolarındaki 52'den farklı) | yok |
| 8 | Not "Fotoğraf konum bilgisi silinerek gönderilir." | özellik yok | 12/16 500, .6 beyaz, ortalı, alt 28 | yok |
KURAL 1 ve 6: DM'e fotoğraf yeni bir yükleme yolu (süreli imzalı URL + commit) ve istemcide metadata silen yeniden kodlama ister; "tek yol" kuralına dokunur, karar proje sahibinin. Pano içinde iki tutarsızlık: gönder düğmesi 44 (öteki DM panolarında 52), açıklama alanı 52.

## 121 DM · fotoğraf mesajı (ÖNERİ) — project/DmFotoMesaj.dc.html
Kod: DM ekranı var ([threadId].tsx, ChatBubble.tsx) ama fotoğraf balonu yok.
Öğe sayısı: 24 · uyuyor: 13 · fark: 10 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Fotoğraf balonu `.phm.me` | özellik yok | 236×236, 18 köşe, sağa yaslı, altta 2, cover | yok (balon yalnız metin: ChatBubble.tsx `text`) |
| 2 | Fotoğraf üzerinde saat hapı `.pts` | özellik yok | sağ 8 alt 8, 22 yüksek, 0/8 iç, 11 köşe, rgba(0,0,0,.45), 11/14 600 beyaz, + 16 beyaz tik | yok |
| 3 | Fotoğrafa eşlik eden metin "Burası, bahçede" + tik | düzen | ayrı "me" balonu | metin balonu var; fotoğrafla birlikte akış yok |
| 4 | "Sohbette ara" | özellik yok | var | yok |
| 5 | Emoji | özellik yok | var | yok |
| 6 | Dosya ekle | özellik yok | var | yok |
| 7 | Kamera | özellik yok | var | yok |
| 8 | Sesli mesaj | özellik yok | var | yok |
| 9 | İpucu "Mesaj yaz" | metin | "Mesaj yaz" | "Mesaj yaz…" (tr.ts:701) |
| 10 | Ardışık balon aralığı | boşluk | 2 | 3 (bkz. 118 #1) |
| 11 | Okundu işareti çizgisi | ikon | 2.4 | 2 (bkz. 118 #2) |
Not: bu panonun metin akışında "Fevve" balonları vs. 118'dekiyle aynı ölçülere uyar (13 öğe uyuyor). KURAL 1 ve 6: bkz. 120.

## 122 DM · senin tepkin — project/DmTepkiSenin.dc.html
Kod: `ChatBubble.tsx` (DmReactionPills 1396-1464, TypingBubble 1591-1679, alıntı 1190-1236), `ChatScreen.tsx` (DayLine 1439-1480), `tr.ts`
Öğe sayısı: 28 · uyuyor: 17 · fark: 10 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Okunmamış çizgisinin metni | metin | "2 yeni mesaj" (sayı + "yeni mesaj") | "Okunmamış mesajlar" (tr.ts:1009 `chat.newLine`; [threadId].tsx:712) |
| 2 | Alıntı ile mesaj metni arası | boşluk | 8 (`.msg{gap:8}`, `.q` %100 genişlik) | 4 (`marginBottom: SPACING[1]`, ChatBubble.tsx:1217) |
| 3 | "yazıyor" balonu erişilebilir adı | metin | "Fevve yazıyor" (`aria-label`) | "yazıyor" (tr.ts:710; ChatBubble.tsx:1613) — yalnız ekran okuyucu |
| 4 | Ardışık balon aralığı | boşluk | 2 | 3 (bkz. 118 #1) |
| 5 | "Sohbette ara" | özellik yok | var | yok |
| 6 | Emoji | özellik yok | var | yok |
| 7 | Dosya ekle | özellik yok | var | yok |
| 8 | Kamera | özellik yok | var | yok |
| 9 | Sesli mesaj | özellik yok | var | yok |
| 10 | İpucu "Mesaj yaz" | metin | "Mesaj yaz" | "Mesaj yaz…" |
| 11 | Duvar/bant | doğrulanamadı | | bkz. 113 #10 |
Uyuyanlar (17): kendi tepkin halkası (`.rx.mine`: 2 ink iç halka, koyuda #EEF3F0; kod DmReactionPills `mine` → ChatBubble.tsx:1436-1448), "Bayıldım 2, senin tepkin" etiketi (tr.ts:992-993), "Kahkaha 2" hapı, hap ölçüleri, `.rxs` 4/6 boşluk, alıntı (10 köşe, 6/10, .18 beyaz zemin, ad 12/700, metin 13/500; "Sen"), "yazıyor" balonu (34, 14 iç, 18/6, üç nokta 8, 5 aralık, pembe/kehribar/mavi; nokta animasyonu panoda duran kare), gün çipleri, okunmamış çizgisinin biçimi (iki ince çizgi + cam hap, 8/8), balonlar, alan, gönder yokken yok.

## 123 Check-in · nokta seçimi — project/CheckInNokta.dc.html
Kod: `app/(app)/checkin/index.tsx` (LocationScreen), `src/features/checkin/SpotPicker.tsx`, `src/components/Choice.tsx`, `src/components/RouteSheet.tsx`, `src/components/SheetCard.tsx`, `app/(app)/(tabs)/explore/[venueId].tsx` (arka sayfa), `src/theme/venueDetail.ts`, `src/features/explore/Bucket.tsx`
Öğe sayısı: 32 · uyuyor: 18 · fark: 10 · fazla: 3 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Alt sayfa: akış | davranış | "Neredesin?" ayrı adım; altta "Devam" → sonraki adım ("Nasıl görünmek istersin?", bkz. 124) | tek sayfa "Konumunu doğrula": nokta seçimi konum izni/düğmesiyle aynı sayfada, düğme "Konumumu kullan" (checkin/index.tsx:136-168,236-248) |
| 2 | Sayfa başlığı | metin | "Neredesin?" 21/26 700 ls -.3; altında mekan adı 13/18 muted (`.sh-t`, `.sh-s`) | başlık "Konumunu doğrula" (tr.ts:878), mekan adı altında; "Neredesin?" ise gövdede `h3` (checkin/index.tsx:236-240) |
| 3 | Açıklama `.cx` | düzen | başlığın altında, 14 üstte, 15/22 muted: "Aynı noktadaki masalarla oynarsın. Noktanı sonra da değiştirebilirsin." | aynı metin (tr.ts:899) ama satır listesinin üstünde `fine` 13/18 ve "Neredesin?" `h3` ile (checkin/index.tsx:237-240) |
| 4 | Satır 1 "Kütüphane önü" (seçili) | düzen | düz satır, kart yok; min 52, gap 12; radyo SOLDA (24, 2 halka %28 ink; seçili 7 dolgu #031B0B / koyu %94 beyaz), yazı 16/20 600; satırlar arası 1 px çizgi (sol 36) | kart: `KIT.raised` zemin, 1 px kenar, 22 köşe, seçiliyken 2 px yeşil halka, min 60, satırlar arası 8; radyo SAĞDA; solda 44×44/14 köşe resim; yazı `h3` 16/22 (Choice.tsx:51-148; SpotPicker.tsx:25-56; auraKit.ts:1081-1085) |
| 5 | Satır 2 "Kantin" | düzen | aynı | aynı fark |
| 6 | Satır 3 "Çim alan" | düzen | aynı | aynı fark |
| 7 | Satır 4 "Noktasız" | özellik yok | var, dördüncü seçenek | yok; nokta olan mekanda sunucu nokta ister (`spot_required`, migration 20261009090000_campus.sql:89-100; istemci `needsSpot` düğmeyi kapatıyor, checkinButton.ts:21-26) |
| 8 | Düğme "Devam" + "ÖNERİ" rozeti | metin | "Devam" (btn primary, 48, tam genişlik, üst 20) | "Konumumu kullan" (konum alır ve girişi tamamlar) |
| 9 | Üst resim (`hero`) | resim | 1080×858 webp (b7b87921…), 330 yükseklik, `object-position: center 40%` | `assets/riso/venue-scene.webp` 800×600, ortalı cover (venueId.tsx:44,111-128). Aynı resim mi DOĞRULANAMADI (blob depoda yok); boyutu farklı |
| 10 | Sağ üstte "Paylaş" yuvarlağı | özellik yok | `.tp .round` (rgba(255,255,255,.82), yukarı ok + kutu ikonu) | yok; yalnız geri (venueId.tsx:285-293). Paylaşma özelliği kodda yok |
| 11 | Durum hapı "Sessiz" (açık) | renk | zemin `--success-soft` #CDEFD9, yazı #0F5C31, 28 yüksek, 0/12 iç, nokta 7 | zemin #E3F4E9, yazı #0B5E30 (explore.ts:170; Bucket.tsx:26). Koyu uyuyor (rgba(61,220,132,.14), #93EBB9) |
| 12 | Peek kankileri sayfa kenarında | fazla | `.peek` kuralı var ama öğe YOK (panoda çizilmiyor) | `peek="locate"` ile üstte kanki şeridi (checkin/index.tsx:132, Peek) |
| 13 | Konum açıklaması gövdede | fazla | yok (panoda bu adımda konum metni yok) | `locationBody` "Mekanda olduğunu doğrulamak için konumun yalnızca bir kez alınır ve saklanmaz." (checkin/index.tsx:166-168; tr.ts:876) |
| 14 | "Neredesin?" bloğundaki ek başlık+ipucu çifti, "elsewhere" uyarısı, konum sorun kartları | fazla | yok | checkin/index.tsx:169-234 |
| 15 | Alt sayfa kabuğu (28 köşe, 10/20/38 iç, #FFF / koyu #121614 + .08 halka, gölge 0 -8 40 .18, tutamaç 40×4, 8 yandan/alttan, kapat düğmesi yok) | doğrulanamadı | | `SheetCard.tsx`/`RouteSheet.tsx`: kapat düğmesi yok (`closeButton={false}`) uyuyor; iç boşluk ve gölge değerleri satır satır okunmadı |

Uyuyanlar (18): geri yuvarlağı (üst cam, 44), kart (üst 300, 28 köşe, 22/20 iç; kod cardOverlap 30, padTop 22), "Kampüs" hapı (28, 12, surface2), konum satırı "Avcılar, İstanbul" 14/18, başlık 26/32 700 -.6, "Buraya giriş yap" düğmesi (48, tam, ikon pin; tr.ts `checkInHere`), kilit ipucu (16 ikon, 6 aralık; "Konumun yalnızca bir kez doğrulanır, saklanmaz."), "Etkinlikler" 16/22 700 (26 üstte), "Bu hafta" (32, 10/4), boş resim 150 (900×540 = kodda 450×270 aynı oran), "Bu hafta etkinlik yok" 15/20 600, "Plan eklenince burada görünür.", karartı (açık .42, koyu .66), sekme çubuğu gizli, dar sayfa ölçüleri, tutamaç.

## 124 Check-in · profilinle ya da anonim (ÖNERİ) — project/CheckInKimlik.dc.html
Kod: check-in akışında kimlik seçimi YOK. Yakın karşılıklar: `src/features/checkin/IdentitySheet.tsx` (check-in SONRASI tek değişiklik hakkı: Mekan menüsü), `supabase/functions/checkin/index.ts:25-41` (check-in gövdesinde kimlik alanı yok; `set-identity` ayrı ve girişte bir kez).
Öğe sayısı: 30 · uyuyor: 14 · fark: 16 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Arka sayfa: hero | resim | bkz. 123 #9 | |
| 2 | Arka sayfa: "Paylaş" | özellik yok | bkz. 123 #10 | |
| 3 | Arka sayfa: durum hapı rengi | renk | bkz. 123 #11 | |
| 4 | Alt sayfa "Nasıl görünmek istersin?" | özellik yok | başlık 21/26 700 + "ÖNERİ" rozeti; altında "Kütüphane önü · İstanbul Gelişim Üniversitesi" (nokta · mekan) | yok; check-in ekranında kimlik adımı yok |
| 5 | "ÖNERİ" rozeti | özellik yok | tasarım notu | üretime girmemeli |
| 6 | Satır "Profilimle" | özellik yok | 64 min yükseklik, 44 yuvarlak yüz (harf avatarı "G"), "Profilimle" 16/20 600, altında "Adın ve fotoğrafın görünür." 13/17 muted, radyo SAĞDA | yok. Karşılık: IdentitySheet'te `identity.profileBody` farklı metin (tr.ts:2261); seçim check-in gövdesine gitmiyor |
| 7 | Satır "Anonim" | özellik yok | 44 kapsül kanki (5b08ad27), "Anonim" + "luna-a7k2 adıyla, kapsül karakterinle görünürsün.", radyo sağda | yok. KURAL 4: nick biçimi `kapsul-xx55` (CLAUDE.md kural 4, tr.ts:757); panodaki "luna-a7k2" bu biçime uymuyor |
| 8 | Satırlar arası çizgi (sol 56) ve seçili radyo | düzen | düz satır + 1 px çizgi; radyo `.rd` | yok (Choice kartı var ama bu akışta kullanılmıyor) |
| 9 | Not "Bu girişte bir kez değiştirebilirsin." | metin | 13/18 muted, 8 üstte | yok; yakın metin tr.ts:2265 `onceTitle` "Bu girişte tek değişiklik hakkın var." |
| 10 | Düğme "Giriş yap" | metin | btn primary 48 tam genişlik, üst 20 | yok (girişi "Konumumu kullan" tamamlıyor) |
| 11 | Satırların sunucu karşılığı | özellik yok | seçim girişte yapılır, sonra hâlâ bir değişiklik hakkı | check-in isteği kimlik taşımaz (`checkin/index.ts:25-37`); girişte seçmek için ya yeni alan ya da `set-identity` (tek hakkı harcar) gerekir |
KURAL 12 ve 4: "Anonim" seçeneği panoda herkese eşit sunuluyor; oysa oyun akışı/masada anonim yalnız kadın beyanıyla mümkün, erkek/belirtmeyende anonim yalnız mekan sohbetini etkiler (tr.ts:2256-2259 `chatAnonBody`); panodaki "kapsül karakterinle görünürsün" cümlesi erkek ve belirtmeyen için yanlış, cinsiyete göre ayrı metin gerekirdi (cinsiyet alan olarak gösterilemez, kural 12). "Profilimle" fotoğrafsız hesapta `photo_required` verir (`IdentitySheet` `needsPhoto`); panoda bu hâl yok. Karar proje sahibinin.

---

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 112 | 23 | 8 | evet |
| 113 | 19 | 9 | evet |
| 114 | 21 | 7 | evet |
| 115 | 13 | 5 | evet |
| 116 | 29 | 9 | evet |
| 117 | 16 | 7 | evet |
| 118 | 24 | 5 | evet |
| 119 | 26 | 5 | evet |
| 120 | 8 | 8 (EKRAN YOK) | evet |
| 121 | 24 | 10 | evet |
| 122 | 28 | 10 | evet |
| 123 | 32 | 10 (+3 fazla) | evet |
| 124 | 30 | 16 | evet |

Toplam fark: 108 (bir kısmı ortak parçanın tekrarı: sekme etiketi, çip 40/36, ardışık balon 2/3, tik çizgisi, ipucu "Mesaj yaz", DM'de dört özellik yok). Doğrulanamayanlar: sekme çubuğu alt boşluğu, DM duvar/bant değerleri, alt sayfa kabuğunun iç boşluk/gölgesi, hero ve blob resimlerinin piksel eşitliği.
