# Pano–kod denetimi, grup 01 (profil, kapsül süsleme, ayarlar)

Not: kod satırları dosya:satır; token değerleri `src/theme/` dosyalarından çözüldü. Ekran görüntüsü yoktu: tüm hükümler "koddan". Pano ile uygulama ayrışınca pano geçerli kabul edildi. Ortak parça farkları (üst bar yuvarlak düğmesi, tab bar) ilk panoda tam yazıldı.

Ortak bulgular (birden çok panoda geçer):
- C1 Yuvarlak "soft" düğme (geri, ayar): pano açık `rgba(255,255,255,.78–.82)` + kenar `rgba(255,255,255,.9)`, koyu `rgba(18,22,20,.72–.78)` + `.12` (kapak üstünde); düz sayfalarda `.round.soft` koyu `#121614` + kenar `.08`, gölge yok. Kod: `BUTTON_GLASS.clear` açık `.74`, koyu `.62` + kenar `.10` (`src/theme/buttonGlass.ts:30,84`).
- C2 Anahtar (switch) koyu: pano kapalı `#262E2B`, düğme `#EEF3F0`, açık iz `#3DDC84`, düğme `#0B0E0D`. Kod: kapalı `#2A332F` (`auraKit.ts:559`), düğme `#151A18` (`auraKit.ts:575`), açık iz her temada `KIT.primary` `#0E8745` (`aura/kit.tsx:1635`).
- C3 Pano "mekân" yazar (aksanlı); kod "mekan" (ör. `tr.ts:2779` "Mekan verileri", `tr.ts:2788`). Panoda geçen yerlerde metin farkı sayıldı.
- C4 Pano başlığında 19/24 700 (-0.3) kullanan sayfalar (Düzenle, Süsle, Tüm aksesuarlar) ile 21/26 700 kullanan sayfalar (Ayarlar ailesi) ayrı; kodda `pageBarTitle` 21/26 (`auraKit.ts:197`) her ikisini karşılıyor.
- C5 Pano tab bar (ProfilBen, 03b/03c): yükseklik 60, kenar 20, iç 5, simge 20, etiket 10/13 600, seçili hap 50 yüksek; kod `AURA.tabBar` (`aura.ts:93-112`) aynı. Alt boşluk (pano 30, kod 12 + güvenli alan) cihaza bağlı: DOĞRULANAMADI.

## 03 Başkasının profili — project/ProfilBaskasi.dc.html
Kod: `app/(app)/people/[publicId].tsx` (CoverPage), `src/theme/person.ts`, `src/theme/profileCover.ts`, `src/features/profile/ProfileCover.tsx`, `ProfileFace.tsx`
Öğe sayısı: 13 · uyuyor: 1 · fark: 12 · fazla: 3 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | kapak | ölçü | 250 yüksek, görsel `center 40%` cover | 230 + dy (`profileCover.ts:67`, `[publicId].tsx:150`); konum yüzdesi yok (expo-image varsayılanı) |
| 2 | kapak üstü/altı geçiş | renk | üst `rgba(0,0,0,.28)` → 0 (%34), alt %55'ten zemine; koyu üst `.35`; bulanık kopya yok | üst `rgba(3,27,11,.42)` 110 px (`profileCover.ts:68-69`), alt %50 + 14 px bulanık kopya, 3 basamak (`profileCover.ts:70-78`); kâğıt (kapaksız) için ayrı 90 px (`person.ts:41`) |
| 3 | geri ve ⋮ düğmeleri | renk/ikon | 44; dolgu açık `.78` koyu `.72`; geri oku 24 (`.ci`), ⋮ 20 (`.ci.md`) | `KIT.size.topBtn` 44 ✓; dolgu `.74`/`.62` (bkz. C1); ok 20 (`person.ts` bar.back), ⋮ 18 (bar.more) |
| 4 | foto | ölçü/renk | 112, halka 4 = `var(--canvas)` (`#EFF7F1` / `#000`), üst 178 | 132 (`person.ts:13`), halka 4 beyaz `#FFFFFF` (`profileCover.ts:81`, `ProfileFace.tsx:81`), üst 144 (`person.ts:15`) |
| 5 | foto harfi (fotosuz) | renk/yazı | düz `var(--violet)` `#C51F62` (koyu `#FF5C93`), harf 40/700 beyaz | `gradientStyle(avatarGround)` (`ProfileFace.tsx:34`), `KIT_TYPE.av.big` |
| 6 | ad ve yaş | yazı/boşluk | "Adem, 26" 28/34 600, ls -0.6, üstte 12 | `profileName` 31/39 800 ls -0.03em (`auraKit.ts:159`), üstte 18 (`person.ts:19`) |
| 7 | tanıtım | boşluk | "Kalk oturmaya mı geldin" 15/22 500 muted, adın 4 altı | 6 altı (`person.ts:21`) |
| 8 | eylem satırı | düzen/sıra | iki düğme yan yana, her biri `flex:1`, 48 yüksek, aralık 12, üst 20, iç 0 12 | "Arkadaşsınız" 28 yüksek etiket üstte (üst 12), altında tek "Mesaj" en çok 300 geniş (üst 22) (`person.ts:23-26`, `[publicId].tsx:207-244`) |
| 9 | Mesaj düğmesi | yazı | `.btn.primary` 600 16/20, sohbet simgesi 20, koyu zemin ink (koyuda beyaz `.94`) | `profileBtn` 800 17/22 (`auraKit.ts:162`), simge 20, aralık 9 |
| 10 | Arkadaşsınız | tür/renk | 48 yüksek düğme: `--success-soft` `#CDEFD9` zemin, `#0F5C31` yazı (koyu `rgba(61,220,132,.14)` / `#93EBB9`), daire içinde onay simgesi 20 | 28 yüksek etiket, zemin `rgba(14,135,69,.10)`, yazı `#0B5E30`, `friendTag` 13/700, simge `check` 14 (daire değil) (`person.ts:23,50`) |
| 11 | ortak arkadaş kartı | düzen | tek cam kart, yarıçap 22, iç 12/16, üst 24, tek satır; kart başlığı/eyebrow yok | "ORTAK ARKADAŞLAR · N" eyebrow + kart yarıçap 26, iç 14, satır başına bir kişi, üst 30 (`[publicId].tsx:253-290`, `person.ts:30-34`) |
| 12 | ortak arkadaş yüzleri | ölçü | 2 yüz yığılı, 36, çakışma -10, kenar 2 canvas, 13 px harf | satır başına `Av size="list"` (yığın yok) |
| 13 | ortak arkadaş metni | metin | "2 ortak arkadaş" 15/20 500 text + altında "Fevve ve Kadir" muted | `tr.profile.mutualTitle` = "Ortak arkadaşlar · N" (`tr.ts:807`); adlar ayrı satırlarda, "X ve Y" birleşimi yok |
| 14 | ok (›) | eksik | kartın sağında 18 px ok; kartın tamamı tek dokunuş hedefi (hedef pano 03'te çizilmemiş; OrtakArkadaslar panosu ayrı) | ok yok; her satır kendi profilini açıyor (`[publicId].tsx:263-268`) |
| 15 | ROZETLER bölümü | fazla | panoda yok | `[publicId].tsx:296-360` (`BADGE_LOOK`, `tr.profile.badges`) |
| 16 | kaydırınca bar bandı, küçük yüz ve ad, 0.5 hızlı kapak | fazla/davranış | panoda tek durum (kaydırma çizilmemiş) | `BarBand`, `BarArrive`, `Cover speed` (`[publicId].tsx:150,376-406`) DOĞRULANAMADI (pano kaydırmayı çizmiyor) |
| 17 | ⋮ menüsü içeriği | sıra | aria: "arkadaşlıktan çıkar, engelle, şikâyet et" | Şikâyet et, Arkadaşlıktan çıkar, Engelle sırası; arkadaş değilse yalnız Şikâyet (`[publicId].tsx:412-445`) |
Pano yalnız arkadaş durumunu çizer; arkadaş olmayan (Mesaj yok) görünüm panoda yok. KURAL: pano ortak arkadaş adlarını yalnız arkadaşın profilinde gösteriyor; kural 4 ile uyumlu (kural ihlali yok).

## 03b Profilim — project/ProfilBen.dc.html
Kod: `app/(app)/(tabs)/profile/index.tsx`, `src/theme/ownProfile.ts`, `src/theme/profileCover.ts` (own, TICKET), `src/features/profile/IdentityTicket.tsx`, `src/features/gifts/SetCard.tsx`, `src/motion/TabBar.tsx`
Öğe sayısı: 21 · uyuyor: 7 · fark: 14 · fazla: 4 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | sayfa yapısı | düzen/fazla | içerik kapağın altında düz akar; panel, tutamak, zemin ışığı, gölge yok | panel yarıçap 34, tutamak 40×5, pembe+yeşil ışık gradyanı, yukarı gölge (`index.tsx:196-244`, `ownProfile.ts:26-48`, `profileCover.ts:118`); kapak/içerik `RiseLayer` ile -0.35 hızla yükselir, soluklaşır, 0.92 küçülür (`index.tsx:150-160`) |
| 2 | kapak | düzen | 236 yüksek, alt köşeler 28 yarıçap, üstünde/altında geçiş yok, görsel `center 60%` | 236 (`profileCover.ts:104`) ✓ ama köşe yarıçapı 0, üst koyu geçiş + alt zemine geçiş + bulanık kopya (`ProfileCover.tsx` ProfileCoverArt; `profileCover.ts:68-78`) |
| 3 | ayar düğmesi | renk/ikon | 44, dolgu açık `.82` koyu `.78`, ikon 24 | `.74`/`.62` (bkz. C1), ikon 20 (`ownProfile.ts:33`) |
| 4 | foto | renk | halka 4 canvas rengi (koyu `#000`), düz `#0E8745` (koyu `#0B783D`), harf 40/700 | beyaz halka, gradyan (`ProfileFace.tsx`) ; boyut 112, üst 176 ✓ (`profileCover.ts:107`) |
| 5 | ad | yazı | 28/34 600 ls -0.6 | `profileName` 31/39 800 (`auraKit.ts:159`) |
| 6 | tanıtım | boşluk | adın 4 altı | `bioTop` 6 (`ownProfile.ts:14`) |
| 7 | düğme satırı | düzen | üst 20, aralık 10, iki düğme `flex:1 1 0`, 48 yüksek, iç 0 12, tam genişlik | düğmeler sözcük genişliğinde ve ortalı (`ButtonRow hug`, `index.tsx:179-215`), üst 18 (`ownProfile.ts:15`), aralık 10 ✓ |
| 8 | Profili düzenle | yazı/ikon | `.btn.soft` 600 15/20, kalem 18, iç 12 | `giftBtn` 800 14.5/18, kalem 17, iç 14/16, aralık 8 (`ownProfile.ts:17`) |
| 9 | "N arkadaş" hapı | tür | cam kart, 48, yüzler 32 (çakışma -10, kenar 2 canvas, en çok 2 yüz, "+N" yok), metin 14/18 600, ok 16, iç 0 12 0 6, aralık 6 | `Btn glassy` 48, yüzler 28 + 2.5 halka, adım 20, en çok 3 yüz + "+N" (`FaceStack`, `index.tsx:376-430`; `ownProfile.ts:18`, `profileCover.ts:120-123`), metin 800 14.5, ok 15, aralık 8 |
| 10 | bilet: üst yazı | yazı | "ANONİM KİMLİĞİN" 11/14 700 ls 1.4 px, `#2C5A3E` | `ticketKicker` 11.5/15 800 ls 0.1em (`auraKit.ts:166`) |
| 11 | bilet: ad | yazı | 20/24 800 -.4, üst 4 | 20/25 (`auraKit.ts:167`) |
| 12 | bilet: not | metin/yazı | "Yeni ad · 12 gün sonra" 13/18 500 `#4A6550`, addan boşluksuz | "Yenile · N gün sonra" (`tr.ts:849`), `ticketNote` 13/17 600 (`auraKit.ts:168`), aradaki boşluk 4 (`profileCover.ts:158`); yenilenebilirken "Yenile" bağlantısı (`IdentityTicket.tsx:230-262`) panoda yok |
| 13 | bilet: iç boşluk | boşluk | `.tkm` iç 12 14 12 16 | padLeft 18, padRight 16 (`profileCover.ts:155-156`) |
| 14 | bilet: düğme | ölçü | 34 yüksek, iç 0 14, 600 13/16, yıldız 16 `#3DDC84` (koyu `#0B783D`), zemin `#031B0B` gölgesiz, üst 10 | `Btn sm` 36, `giftBtn` 800 14.5/18, iç 16, yıldız 15, üst 8 + aralık 4 (`profileCover.ts:159-160`, `IdentityTicket.tsx:215-228`) |
| 15 | bilet: stub | ölçü | "No. uc44" 12/16 700 ls .2; kapsül kutusu 80, görsel yüksekliği 84; kutu-yazı aralığı 4 | `ticketNo` 13/17 700; kapsül 80; aralık 8 (`profileCover.ts:150`) |
| 16 | bilet: kenar, baskı, çentik, çizgi | ölçü | 128 yüksek, yarıçap 24, kenar 2, baskı (4,5), çentik 12, stub 97, kâğıt/yarım ton | ✓ (`profileCover.ts:139-160`, `IdentityTicket.tsx`) |
| 17 | SET BALONU başlığı + etiket | ölçü/boşluk | başlık 12/16 600 ls .24; etiket 24 yüksek, iç 4/10, 12/16 600, `--success-soft`; başlık üstte 28 | etiket 26 yüksek, `setCount` 12.5/800, zemin `skin.chipOn` veya `k.count`; üst 14 (`SetCard.tsx:55-90`, `ownProfile.ts:31`, `SET_CARD.count`) |
| 18 | set notu | yazı | 14/20 500 muted | `setNote` 13.5/19 (`auraKit.ts:171`) |
| 19 | 3 parça (Baş/Yüz/Gövde) | yazı/boşluk | ızgara 3 sütun, aralık 8, üst 14, görsel 84; ad 14/18 600 (üst 8); alt metin 12/16 500 | `setSlot` 13/17 700 (aralık 6), alt metin `fine` 13/18 (`SetCard.tsx:105-160`, `ownProfile.ts:SET_CARD`) |
| 20 | boş set yuvası ve RegionSheet | fazla | panoda yok (yalnız dolu durum) | `SetCard.tsx:130-150, 175-260` |
| 21 | fotoğraf gizlendi notu, yükleniyor/hata durumları | fazla | panoda yok | `index.tsx:246-300` |
| 22 | alt tab bar | uyuyor | bkz. C5 | `aura.ts:93-112` |

## 03c Profilim, kaydırılmış — project/ProfilBenKaydir.dc.html
Kod: `app/(app)/(tabs)/profile/index.tsx:300-374` (FlyingFace, FlyingName, BarBand), `src/motion/TopBar.tsx:52`, `src/theme/aura.ts:120`
Öğe sayısı: 6 · uyuyor: 1 · fark: 5 · fazla: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | bar bandı | renk/ölçü | yükseklik 122 (52+48+22), zemin `rgba(255,255,255,.32)` + blur 24, altta 22 px maske (koyu `rgba(0,0,0,.86)`) | 118 (`aura.ts:121`), opak zemin %84'e kadar, son %28 geçiş (`aura.ts:330-335`) |
| 2 | küçük foto | ölçü/konum | 36, halkasız, soldan 20 (x 20–56), harf 14 | 30, halka 1.5, merkez x 152 (`profileCover.ts:130-132`, `index.tsx:94-100`) |
| 3 | başlık | yazı/konum | "Fırat, 26" 17/22 700 ls -.2, fotoğrafın 12 yanında, sola yaslı, `flex:1` | merkezli x 214, `profileName` 31/800 × 0.516 ölçek ≈ 16 (`profileCover.ts:133-134`, `FlyingName`) |
| 4 | ayar düğmesi | renk | `.round.soft`: koyu `#121614`, kenar `.08`, gölgesiz; ikon `--text` | bkz. C1 |
| 5 | sayfa kayma miktarı | ölçü | -320 | varış 316 (`profileCover.ts:127`) ✓ (≈ fark 4, bandın boyuna bağlı) |
| 6 | altta devam eden içerik (bilet, set) | uyuyor | bkz. 03b | — |
| 7 | uçan yüz/ad hareketi | fazla/davranış | panoda tek kare (hareket çizilmemiş) | `FlyingFace`/`FlyingName` doğrusal uçuş (`index.tsx:340-374`) DOĞRULANAMADI |

## 03d Profili düzenle — project/ProfilDuzenle.dc.html
Kod: `app/(app)/(tabs)/profile/edit.tsx`, `src/theme/profileEdit.ts`, `src/components/Input.tsx`, `src/components/PageTop.tsx`
Öğe sayısı: 18 · uyuyor: 3 · fark: 15 · fazla: 4 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | sayfa kenarı | boşluk | 20 (`.pe` iç 52 20 0) | 16 (`profileEdit.ts:12`, `edit.tsx:330`) |
| 2 | başlık | yazı | "Profili düzenle" 19/24 700 ls -.3, geri düğmesinin 12 yanında | `PageTop` başlığı + `titleIn` 6 (`edit.tsx:343`, `profileEdit.ts:13`); ölçü DOĞRULANAMADI (PageTop varsayılan başlık stili farklı olabilir; pano 19/24, `pageBarTitle` 21/26) |
| 3 | Kaydet | ölçü/renk | `.btn.primary.off`: 40 yüksek, iç 0 18, 15/20 600; kapalıyken `#DCE9DE` zemin `#4A6550` yazı (koyu `#1B211F` / `rgba(238,243,240,.4)`) | `Btn glassy` 44 (`KIT.size.topBtn`), minWidth 96, boşta `KIT.saveIdle #9AAEA1` yazı, cam zemin (`edit.tsx:345-358`, `auraKit.ts:657,667`) |
| 4 | kapak | ölçü | 150 yüksek, yarıçap 22, üst 16, görsel `center 60%` | 172, yarıçap 28, gölgeli (`profileEdit.ts:20-25`, `edit.tsx:107-125`) |
| 5 | kapak çipi | metin/ölçü | "Kapağı değiştir", 34 yüksek, iç 0 12 0 10, `rgba(3,27,11,.62)` zemin beyaz yazı 13/16 600, bulanık 12, kamera 16, sağ/üst 10 | "Kapak" (`tr.ts:842`), `Btn sm glassy` 36, `coverBtn` 13.5/700, inset 12, beyaz cam zemin; dokununca menü (Değiştir/Kaldır) açılır (`edit.tsx:126-150, 215-247`); panoda doğrudan eylem |
| 6 | foto | ölçü | 104, halka 4 canvas, harf 38/700 düz `#0E8745`, kapağı 52 bindirir | 116, beyaz halka, gradyan, üst 112 (`profileEdit.ts:28-29`, `ProfileFace.tsx`) |
| 7 | kamera düğmesi | ölçü/renk | 38, `#031B0B` zemin (koyu `.94` beyaz), kenar 3 canvas, ikon 18 beyaz; sağ -2, alt 0 | 36 (`btnSm`), zemin beyaz `.90`/`#1B211F`, kenar `KIT.size.edge`, ikon 16; sağ -4, alt 2 (`edit.tsx:152-185`, `profileEdit.ts:30-31,37`) |
| 8 | alanların yapısı | düzen | kartsız; her alan tuvalde ayrı, üstünde etiket satırı (20 üst, 8 alt, 4 yan) | tek kart (yarıçap 26, iç 16, aralık 8) içinde ince çizgiyle ayrılmış (`edit.tsx:360-409`, `profileEdit.ts:34`) |
| 9 | etiket | yazı | "Görünen ad" 13/18 600 text | `boxLabel` 13/17 700 (`auraKit.ts:188`, `components/Field.tsx:136`) |
| 10 | sayaç | yazı | "5/24" 12/16 500 muted sağda | `boxLabel` 13/17 700 tabular (`components/Field.tsx:141`) |
| 11 | alan kutusu | ölçü/yazı | min 52, yarıçap 16, iç 0 16, kenar 1 px `rgba(3,27,11,.10)` (koyu `.08`), zemin `--surface` (`#FFF` / `#121614`), değer 16/22 500 | kenar 1.5 `#DCE6DF`, zemin `#FFF` / `#1B211F` (`profileEdit.ts:35-40,53-58`), `boxField` 16/21 600 (`auraKit.ts:189`), yükseklik `KIT.size.field` 48 |
| 12 | ad ipucu | metin | "Arkadaşların ve profilinle olduğun yerdekiler görür." 13/18 500 | "2–24 karakter. Bu adı arkadaşların görür; profilinle göründüğün masalarda ve mekan sohbetinde orada bulunanlar da görür." (`tr.ts:823`), `boxNote` 12.5/18 |
| 13 | Tanıtım alanı | ölçü | min 92, üst iç 14; sayaç "23/80" | 96 (`profileEdit.ts:36 tall`), `boxFieldMulti` 16/22 ✓; sayaç biçimi `n/80` ✓ (`BIO_MAX`) |
| 14 | Doğum tarihi satırı | düzen/metin | etiket "Doğum tarihi" + salt okunur alan: şeffaf zemin, 1 px kenar, değer "14 Mart 2000" 16/22 500 muted, kilit 20 sağda | ayrı cam kart: takvim kareli simge 32 `KIT.primary`, başlık "Doğum tarihi", not satırı, kilit 14 + "Değiştirilemez"; **tarih değeri gösterilmiyor** (`edit.tsx:411-463`, `profileEdit.ts:47`) |
| 15 | doğum tarihi ipucu | metin/özellik yok | "Doğum tarihin değiştirilemez, profilinde yalnızca yaşın görünür. Yanlışsa **bizimle iletişime geç**." (altı çizili, 600 bağlantı) | `tr.profile.birthDateNote` = "Doğum tarihin değiştirilemez; profilinde yalnızca yaşın görünür." (`tr.ts:815`); bağlantı yok: ÖZELLİK YOK bu ekranda (İletişim mailto'su yalnız Hesap'ta, `settings-account.tsx`) |
| 16 | foto/kapak ön koşul notları, kapak yok notu, hata satırları | fazla | panoda yok | `edit.tsx:187-210` (`photoNeedsName`, `coverDefault`, `photoErrorMessage`) |
| 17 | çıkış uyarı diyaloğu | fazla | bu panoda yok (ayrı pano) | `edit.tsx:290-320` |
| 18 | tab bar | uyuyor | panoda yok, kodda gizli | `useHideTabBar` ✓ |

## 03e Profili düzenle, değişiklik var — project/ProfilDuzenleYaz.dc.html
Kod: 03d ile aynı + `components/Field.tsx` (halo)
Öğe sayısı: 18 · uyuyor: 3 · fark: 17 · fazla: 4 · doğrulanamadı: 1
03d'nin bütün farkları geçerli (bkz. 03d #1–#17). Ek farklar:
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Kaydet (değişiklik var) | renk | `.btn.primary` ink zemin (`#031B0B`; koyu `.94` beyaz), 40 yüksek | yeşil `KIT.primary` yazı 800, cam zemin, 44 (`edit.tsx:349-352`) |
| 2 | odaklı alan | renk | kenar 2 px `var(--text)` (koyu `#EEF3F0`), iç 0 15; imleç 2×20 accent (`#0B783D`/`#3DDC84`) | yeşil halka (`halo`, `components/Field.tsx`; `edit.tsx:373`), kenar 1.5 |
| 3 | ad sayacı | metin | "9/24" (Fırat Can) ✓ biçim | `fieldCount(n,max)` ✓ (`tr.ts:862`) |

## 03f Kapsülünü süsle — project/KapsulSusle.dc.html
Kod: `app/(app)/(tabs)/profile/capsule.tsx`, `src/theme/capsuleEdit.ts`, `src/features/capsule/SusleTabs.tsx`, `SusleFilter.tsx`, `src/motion/SnapStrip.tsx`
Öğe sayısı: 22 · uyuyor: 6 · fark: 14 · fazla: 3 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | üst bar kenarı | boşluk | 20 (`.ptb` iç 0 20), aralık 12, 48 yüksek | 16 (`capsuleEdit.ts:21 barSide`), titleIn 6; aralık 12 ✓ (`capsuleEdit.ts:bar`) |
| 2 | başlık | yazı | "Kapsülünü süsle" 19/24 700 | `tr.capsule.title` = "Kapsülün" (`tr.ts:736`); metin farkı: pano "Kapsülünü süsle" (kodda bu metin `capsule.edit` olarak profildeki düğmede, `tr.ts:735`); `PageTop` başlığı (`capsule.tsx:478`) |
| 3 | Kaydet | ölçü | 40 yüksek, iç 0 18, 15/20 600, `.btn.primary` ink | `Btn` 44 (`KIT.size.round`), minWidth 96, kapalıyken disabled (`capsule.tsx:484-497`) |
| 4 | kapsül sahnesi | ölçü | 340×340 kutu (hale), görsel 290 yüksek, üst 10 | hale 258, kapsül 220, sahne 300 yüksek (`capsuleEdit.ts:25 scene`, `CAPSULE_HALE.ratio` 340/290) |
| 5 | hale | renk | disk `#8B6CFF` .22 + 2 halka (r 46.44/38.88) | ✓ (`capsuleEdit.ts:11-21`) |
| 6 | Hepsini çıkar / Rastgele | ölçü/yazı | `.btn.soft` 36, iç 0 14, 13/16 600, aralık 6 (simge 16), düğmeler arası 8, sahnenin 12 altında; koyu `#121614` + kenar `.08` | `Btn sm glassy`, `coverBtn` 13.5/700, iç 12/14, simge 16, "Rastgele" simgesi zar 20 (`capsule.tsx:575-600`, `capsuleEdit.ts:26-28`); sahnenin altına yapışık |
| 7 | tepsi | ölçü/renk | üst 528'de, yarıçap 28, zemin `var(--surface)` (`#FFF` / `#121614`), gölge `0 -6 24 .06`, koyu üst kenar `.06`, iç üst 8 | yarıçap 34, zemin `rgba(255,255,255,.72)` / `rgba(27,33,31,.92)`, gölge `0 -10 30 .08` (`capsuleEdit.ts:36,61-63,101-103`); üst ≈ sahne+18 (pano 528'e göre daha yukarıda) |
| 8 | sekmeler | eksik/fazla | 5 sekme: Renk, Göz, Baş, Yüz, Gövde (Ağız yok) | 6 sekme, Ağız beşinci (`capsule.tsx:90-93`, `capsuleCatalog.ts:43-50`, `SusleTabs.tsx`); not: pano içinde de çelişki: Tüm aksesuarlar panosunda "Ağız 11 parça" var, süsleme sekmelerinde Ağız yok |
| 9 | sekme yazısı | yazı | 12/15 600 (açıkta text rengi), simge 22, aralık 3, iç 8/9, alt çizgi 3 (%22–%78) | `T eyebrow` 12/16 ls .24, açıkta 700; diğer değerler ✓ (`SusleTabs.tsx:70-85`, `capsuleEdit.ts:tabs`) |
| 10 | filtre çipleri | ölçü | 28 yüksek, iç 0 11, 12/16 600, zemin `--surface2` (koyu `#1B211F`), seçili `#031B0B`/`.94` beyaz; sağda %80'den maske | `Chip` 36 yüksek (`KIT.size.chip`), 13 civarı, cam çip; solma 22/40 px (`SusleFilter.tsx:34-50`, `capsuleEdit.ts:36`) |
| 11 | "Tümüne bak" | yazı | 13/16 700, ok 16, aralık 2; satır iç 12 20, çipler-bağlantı aralığı 10 | `capsuleChip` 14/18 700; aralık `E.filter.gap*2` = 12 (`SusleFilter.tsx:23,55`) |
| 12 | seçenek şeridi | düzen/ölçü | sabit 3 seçenek ortalı, aralık 18; normal 76 daire, seçili 88 + 3+3 halka `#FF4F8B` (koyu `#FF6FA0`), görsel 150/174; zemin `--surface2` | kaydırmalı `SnapStrip`: 84 öğe, 96 adım, ölçek 0.9/1.14, halka `KIT.pink` (koyuda da `#FF4F8B`), zemin `rgba(3,27,11,.05)` / `rgba(255,255,255,.06)` (`KIT.size.stripItem` 84 `auraKit.ts:978`, `capsuleEdit.ts:74,89-90`) |
| 13 | seçenek adı | yazı | 12/15 600 (seçili 700), tek satır | seçilen adın büyük yazısı `capsuleName` 19/800 + ad boyutu 16 satır (`capsuleEdit.ts:45`, `capsule.tsx:600-640`); DOĞRULANAMADI (SnapStrip ad stilini ayrıca okumadım) |
| 14 | nadirlik elması | ölçü | 9, döndürülmüş, `#FFB547`, üst/sağ 6, 2 halka; yalnız Efsanevi | ✓ (`capsuleEdit.ts:50`, `capsule.tsx:709`); Destansı rengi `#7B5CFF` Tüm aksesuarlar panosunda (03g) |
| 15 | Aksesuarı çıkar | ölçü/konum | `.btn.primary` 44 yüksek, iç 0 18, 14/18 600, simge 18, tepsinin altından 26 yukarıda, ortalı (mutlak) | `Btn` 48 (`KIT.size.btn`), akışta şeridin altında (`capsuleEdit.ts:actions.top`), ad `capsule-remove-accessory` (`capsule.tsx:675-690`) |
| 16 | noktalı sayfa göstergesi | fazla | panoda yok | `capsuleEdit.ts:51 dots` (kullanım doğrulanamadı) |
| 17 | rarity göstergesi (.leg) | uyuyor | CSS'te tanımlı, HTML'de kullanılmıyor | — |
| 18 | kaydedilemedi toast ve çıkış diyaloğu | fazla | panoda yok (ayrı panolar) | `capsule.tsx:196-230,700` |

## 03g Tüm aksesuarlar — project/TumAksesuarlar.dc.html
Kod: `app/(app)/(tabs)/profile/accessories.tsx`, `src/features/capsule/CatalogTile.tsx`, `catalog.ts`, `capsuleEdit.ts` (catalog)
Öğe sayısı: 14 (başlık, alt satır, ara düğmesi, geri, 8 çip, 7 bölüm başlığı, 53 parça, halka, elmas, ad) · uyuyor: 8 · fark: 6 · fazla: 1 · doğrulanamadı: 0
Parça adları, bölüm sayıları ve sırası (Baş 14, Göz 4, Yüz 6, Ağız 11, Gövde 7, Renk 1, Takımlar 10 = 53) kodun `CATALOG_KINDS` sırasıyla (`catalog.ts:16`) aynı; takım adları `tr.capsule.setName` = "X takımı" ✓.
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | bar kenarı ve başlık | boşluk/yazı | iç 0 20; "Tüm aksesuarlar" 19/24 700 + "53 parça" 12/16 500 muted | `barSide` 16 (`capsuleEdit.ts:21`, `accessories.tsx:200`); `pageBarTitle` 21/26 + `fine` 13/18 (`accessories.tsx:222-233`) |
| 2 | kategori çipleri | ölçü/yazı | 32 yüksek, iç 0 13, 13/16 600, sayı ayrı `<em>` 500 %70, zemin `--surface2` / seçili `#031B0B` (koyu `.94` beyaz) | `Chip` 36 yüksek, etiket tek metin "Baş 14" (`tr.capsule.catLabel`, `tr.ts:774`), cam çip (`accessories.tsx:236-262`) |
| 3 | bölüm başlığı | yazı | 16/22 **700**, parça sayısı 12/16 500 muted | `T v="h3"` (16/22 600, `auraKit`/tokens h3), `fine` 13/18 (`accessories.tsx:171-185`) |
| 4 | parça dairesi zemini | renk | `--surface2` (`#E6F0E8` / `#1B211F`) | `rgba(3,27,11,.05)` / `rgba(255,255,255,.06)` (`capsuleEdit.ts:78,98 tile`; `CatalogTile.tsx:56`) |
| 5 | seçili halka | renk | 3 canvas + 3 `#FF4F8B` (koyu `#FF6FA0`) | `KIT.pink` `#FF4F8B` her temada (`CatalogTile.tsx:79`; `auraKit.ts:668`) |
| 6 | nadirlik elması | eksik | 33 parçada: 9×9, sağ/üst 3, döndürülmüş r 2, canvas 2 halka; Efsanevi `#FFB547`, Destansı `#7B5CFF` | `CatalogTile` elması çizmiyor; `tierDot` yalnız Süsle şeridinde (`capsule.tsx:709`) |
| 7 | parça adı | yazı | 12/15 600 (seçili 700), 2 satır 30 | `T eyebrow` 12/16 ls .24, `fit` (`CatalogTile.tsx:90`) |
| 8 | ızgara, bölüm başlığı boşlukları | uyuyor | 4 sütun, 14/8 aralık, iç 6 20 8, başlık 44, parça 72 | ✓ (`capsuleEdit.ts:catalog`) |
| 9 | ara ve geri düğmeleri | uyuyor | `.round.soft` 44 | `KIT.size.round` 44 ✓ (renk C1) |
| 10 | seçili parça için "Kapsülüne tak" çubuğu | fazla | bu panoda yok (TumSecili panosunda) | `accessories.tsx:330-380` |

## 03h Tüm aksesuarlar, kaydırınca — project/TumAksesuarlarKaydir.dc.html
Kod: 03g ile aynı (`GridWindow`, `onSection`)
Öğe sayısı: 14 · uyuyor: 9 · fark: 5 · fazla: 1 · doğrulanamadı: 0
Fark: 03g #1–#7 aynen geçerli. Panoda yalnız iki durum farkı var: kaydırma -986 px'te "Tümü" çipi seçili olmaktan çıkar, "Ağız" çipi seçili olur (liste Ağız bölümüne ulaşınca); kodda `onSection` aynı davranışı veriyor (`accessories.tsx:317-322`, ilk bölümde "Tümü"). Hüküm: davranış UYUYOR. Başlık altındaki sayı ("53 parça") ve çip sayıları kaydırmayla değişmiyor ✓.

## 03i Ayarlar — project/Ayarlar.dc.html
Kod: `app/(app)/settings.tsx`, `src/features/settings/SettingsParts.tsx`, `src/theme/settings.ts`, `src/features/profile/AppearanceSetting.tsx`
Öğe sayısı: 20 · uyuyor: 12 · fark: 8 · fazla: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | geri düğmesi | renk | `.round.soft` koyu `#121614`, kenar `.08` | bkz. C1 |
| 2 | satırlar (Bildirimler, Gizlilik, Hesap) | uyuyor | 56 min, simge 24, aralık 14, ok 18, çizgi 38'den, çizgi `rgba(3,27,11,.10)` | ✓ (`settings.ts:16-20`, `SettingsParts.tsx:56-110`) |
| 3 | "Oyunlara katılım" başlığı ve seg | uyuyor | 13/700 muted, üst 26 alt 8; seg 36, iz `--track`, aralık 4 | ✓ (`settings.ts`, `segBoard`) |
| 6 | Çıkış yap satırı | uyuyor | `.sr.dg`, üst 18, ok yok | ✓ (`settings.ts:signOut`, `settings.tsx:121-128`) |
| 7 | "Test sürümü" başlığı | uyuyor | `.sh3` karışık harf | ✓ (`tr.ts:2799`) |
| 9 | test satırı 2 | metin/ikon/özellik yok | "Hata kaydını gönder", böcek simgesi + ok | satır yok; yerine "Çizim ölçümünü aç" (göz simgesi) (`settings.tsx:155`, `tr.ts:2525`); ÖZELLİK YOK: "Hata kaydını gönder" (grep: kodda hiçbir yerde yok) |
Not (kural): "Oyunlara katılım" seç'i her hesapta görünür; kural 4/12 ("erkek ve belirtmeyende anonim seçim yalnızca mekan sohbetini etkiler") açısından pano nottaki "Her girişte anonim başlarsın" ifadesi cinsiyete dair bir ayrım göstermiyor, KURAL işareti yok. Karar proje sahibinin.

## 03k Ayarlar, çıkış onayı — project/AyarlarCikis.dc.html
Kod: `src/features/settings/signOutConfirm.ts`, `src/motion/Dialog.tsx`, `src/theme/auraKit.ts:1240-1255`
Öğe sayısı: 7 (örtü, kart, başlık, metin, Çıkış yap düğmesi, Vazgeç, arkadaki sayfa) · uyuyor: 2 · fark: 5 · fazla: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | örtü | renk | açık `rgba(3,27,11,.42)`, koyu `rgba(0,0,0,.7)` | `look.scrim` DOĞRULANAMADI (`Dialog.tsx:96`; değer ayrıca okunmadı) |
| 2 | kart konumu | düzen | üstten 280, yanlardan 28, zemin `--surface` (koyu `#151A18` + 1 px `.08` halka), gölge `0 18 48 .22` | dikey ortalı (`Dialog.tsx:styles.root justifyContent center`), yan 28 ✓ (`dialogInset`) |
| 6 | Çıkış yap düğmesi | uyuyor | `.btn.danger` + çıkış simgesi, genişlik %100, 48 | ✓ (`signOutConfirm.ts:22-24`) |
| 7 | ikon diski | uyuyor | panoda yok; kod `confirmIcon` düğmede, disk yok | ✓ (`options.icon` verilmiyor) |

## 03l Ayarlar · Bildirim ayarları — project/AyarBildirim.dc.html
Kod: `app/(app)/settings-notifications.tsx`, `src/features/settings/SettingsParts.tsx` (SwitchRow), `Switch` (`src/aura/kit.tsx:1607`)
Öğe sayısı: 14 · uyuyor: 8 · fark: 5 · fazla: 1 · özellik yok: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 4 | Mesajlar bölümü | düzen/özellik yok | iki satır: "Birebir mesajlar" + "Mesajı bildirimde göster" (**ÖNERİ**, kapalı, ipucu "Kapalıyken yalnızca "Yeni mesaj" yazar") aynı listede, çizgi 0'dan | yalnız "Birebir mesajlar" (liste dışı `SwitchRow`); ÖNERİ satırı yok, kod bilerek almamış (`settings-notifications.tsx:14-17,159-166`); ÖZELLİK YOK (sunucu ucu ve profil alanı yok) |
| 6 | Arkadaşlar listesi | uyuyor | iki `SwitchRow`, min 56, iç 10, çizgi 0'dan | ✓ (`SwitchRow`, `Group hairIn=0`) |
| 7 | bölüm başlıkları, notlar | uyuyor | `.sh3`, `.nt` | ✓ |
| 8 | telefon bildirimi kapalı kartı, soluk 0.45 | fazla | bu panoda yok (AyarBildirimKapali panosunda) | `settings-notifications.tsx:78-103` |

## 03m Ayarlar · Gizlilik — project/AyarGizlilik.dc.html
Kod: `app/(app)/settings-privacy.tsx`, `src/features/settings/SettingsParts.tsx`
Öğe sayısı: 17 · uyuyor: 10 · fark: 6 · fazla: 0 · özellik yok: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Engellenenler sayacı | davranış | satırda sağda "3" (`.rv2` 13/16 600 muted) | sayaç yok; karar 3 ("no counts", `settings-privacy.tsx:21`) pano ile çelişir |
| 4 | "Kullanım istatistiği" satırı | boşluk | liste üstü 14, `.sl` içinde | `marginTop` 3+0.5 = 14 ✓; ipucu metni ✓ |
| 5 | "Verilerin" bölümü (ÖNERİ) | özellik yok | başlık "Verilerin" + ÖNERİ rozeti; satır "Verilerimin kopyasını iste" (indirme simgesi); not "Hazır olunca indirme bağlantısı uygulamada bildirim olarak gelir." | yok; kod bilerek almamış (`settings-privacy.tsx:20-22`); ÖZELLİK YOK (sunucu ucu yok) |
| 6 | Engellenenler/Sessize/Kapsül/Yasal satırları ve simgeleri (yasak, hoparlör-x, kişi, belge) | uyuyor | ✓ | ✓ (`block`, `mute`, `user`, `doc`) |

## 03n Ayarlar · Hesap — project/AyarHesap.dc.html
Kod: `app/(app)/settings-account.tsx`
Öğe sayısı: 16 · uyuyor: 4 · fark: 12 · fazla: 2 · özellik yok: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 3 | doğum tarihi değeri | metin | "05.03.2000" | `birthDateValue` "dd.mm.yyyy" ✓ (`tr.ts:2752`) |
| 4 | etiketler | metin | "Telefon numaran", "Doğum tarihin" | ✓ (`tr.ts:2828,2750`) |
| 10 | hesap silme onay diyaloğu | fazla | bu panoda yok (AyarHesapSil'de) | `settings-account.tsx:55-70` |

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 03 | 13 | 12 (+3 fazla) | evet |
| 03b | 21 | 14 (+4 fazla) | evet |
| 03c | 6 | 5 (+1 fazla) | evet |
| 03d | 18 | 15 (+4 fazla) | evet |
| 03e | 18 | 17 (+4 fazla) | evet |
| 03f | 22 | 14 (+3 fazla) | evet |
| 03g | 14 | 6 (+1 fazla) | evet |
| 03h | 14 | 5 (+1 fazla) | evet |
| 03i | 20 | 8 (+1 fazla) | evet |
| 03k | 7 | 5 | evet |
| 03l | 14 | 5 (+1 fazla, 1 özellik yok) | evet |
| 03m | 17 | 6 (2 özellik yok) | evet |
| 03n | 16 | 12 (+1 fazla) | evet |

Sınırlar: görüntü yok, hükümler koddan. Doğrulanamayanlar: Dialog örtü rengi, PageTop başlık stili (Düzenle), SnapStrip seçenek adı stili, tab bar alt boşluğu, kaydırma hareketleri.
