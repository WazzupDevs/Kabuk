# Pano–kod denetimi, grup 00 (Mesajlar, Arşiv, DM sohbeti)

Genel notlar (her panoya ortak): kaynak css = skall.css + ekran.css + koyu.css + panonun kendi `<style>`ı; `* {box-sizing:border-box}` (ekran.css:2) olduğundan pano ölçüleri kenarlık DAHİL. Kod yolları: `apps/mobile/app/(app)/(tabs)/messages/{index,archive,[threadId]}.tsx`, `src/features/friends/InboxRows.tsx`, `src/theme/{messages,dm,activities,aura,auraKit}.ts`, `src/aura/{kit,GlassSearch,CapIcon}.tsx`, `src/motion/{Menu,StickyField,TabBar}.tsx`, `src/components/{MessagePop,ChatBubble,Composer,ChatTopBar,ChatWallpaper,TabBar}.tsx`. İkon çizimlerinin kaynağı `src/theme/capIcons.generated.ts` (eski Ikonlar setinden üretilmiş); panolar bu sette olmayan satır içi SVG çiziyor, bu yüzden bell, back, edit, search, trash, copy, reply, flag, block, moreV, chevron ikonları panolardan farklı çiziliyor (ilkinde tam yazıldı, sonrakilerde "bkz."). Kanıt sınıfı hepsi "koddan"; telefonda görülmedi.

Ortak parça kimlikleri (sonraki panolarda "bkz." ile anılır):
- OP-IKON: yuvarlak düğme ikonları. Pano `.ci` = 24 (`--icon-lg`); kod varsayılanı `KIT.size.icon` = 22 (auraKit.ts:1009; CapIcon.tsx varsayılan `size`). Çizimler: bell, back, edit, search, trash, copy, reply, report/flag, block, moreV, chevron panodan farklı (bkz. 01 #1, #2 ve 02, 02b #…).
- OP-AV: yüz halkası. Pano: 2 halka yüzün İÇİNDE (border-box, 48 dış). Kod `board` kipi: halka yüzün DIŞINDA, yüz 48 + 2×2 = 52 dış (kit.tsx:1292-1324; InboxRows.tsx:288-293; DM üst çubuğunda [threadId].tsx:546-560, dm.ts:152).
- OP-TAB: sekme çubuğu (aşağıda 01 #16-#18).
- OP-HOLD: uzun basma menüsü kabuğu (01c).
- OP-TICK: okundu tiki.

---

## 01 Mesajlar — project/Main.dc.html
Kod: app/(app)/(tabs)/messages/index.tsx; features/friends/InboxRows.tsx; aura/kit.tsx (Seg, Round, Av, Badge); aura/GlassSearch.tsx; features/notifications/Bell.tsx; theme/messages.ts; components/TabBar.tsx + motion/TabBar.tsx
Öğe sayısı: 47 · uyuyor: 26 · fark: 20 (biri özellik yok) · fazla: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | "Yeni mesaj" yuvarlağı ikonu | ikon/ölçü | 24 px; çizim: a=rect(3,9.4,16.4×5.2,rx2.6,rot-45), b=rect(12.4,18.4,8.6×2.8) | `edit` 22 (iconSize verilmedi, messages/index.tsx:86-92; KIT.size.icon=22 auraKit.ts:1009); çizim b=rect(3.4,9.6,16.8×5), a=rect(12.2,18.4,8.8×2.6)+a daire(5.2,18.8,r1.6) (capIcons.generated.ts:99): katman rolleri ters, ek daire |
| 2 | Zil ikonu | ikon/ölçü | 24 px; dış hat yolu `M12 3.6c-3.4 0-5.6 2.6-5.6 5.9…` stroke 2.6 + b dil `M9.5 19.2a2.6 2.6 0 0 0 5 0z` | `bell` 22 (Bell.tsx:19-31); çizim b=`M6.2 16.4V11a5.8…` + a=rect 18×3.2 (capIcons.generated.ts:13) |
| 3 | Zil noktası | ölçü | 9×9 DIŞ (kenarlık 2 içeride → pembe 5), top 9 right 10, halka `--canvas` | pembe 9 + halka 2 dışarıda = 13 dış, top 7 right 8 (kit.tsx:645-656; messages.ts:22 `dot:9, ring:2`) |
| 4 | Arama kapsülü: yan boşluk | boşluk | `padding:0 20px` (`.field`) | 18 (`X.capsulePadX` auraKit.ts:899; GlassSearch.tsx:44-45) |
| 5 | Arama ikonu | renk/ikon | `--ci-a: var(--muted)` #4A6550; çizim o daire r6.4 + a rect 7.6×3.4 rot45 | `colors.placeholder` #56785E (GlassSearch.tsx:51); çizim b daire r5.6 + o r5.6 + rect 9.14×3.2 (capIcons.generated.ts:258) |
| 6 | Bölmeli seçici dış yüksekliği | ölçü | `height:44` border-box (kenarlık 1 + iç boşluk 4 dahil) | Glass kenarlığı 1 + `segPad` 4 + 36 + 4 + 1 = 46 (kit.tsx:1469-1475, auraKit.ts:1143) |
| 7 | Seçici: etiket–rozet aralığı | boşluk | `.sg span{gap:6}` | `KIT.size.tagGap` 4 (auraKit.ts:884; kit.tsx:1546) |
| 8 | Seçici: seçili parçanın gölgesi (açık) | renk | `0 2px 6px rgba(3,27,11,.18)` (`.seg span.on`) | `0px 3px 10px rgba(3,27,11,.10)` (activities.ts:37 → messages.ts:36) |
| 9 | Seçici camı (açık) | renk | dolgu gradyan(180deg, rgba(255,255,255,.80), .54), kenar rgba(255,255,255,.86), gölge `0 18px 44px rgba(4,73,35,.10), 0 2px 6px rgba(4,73,35,.05), inset 0 1px 0 #FFF` | düz rgba(255,255,255,.60), kenar .90, inset .95, gölge `0 10px 30px rgba(3,27,11,.08)` (activities.ts:31-36) |
| 10 | "Sabitlenenler" ikonunun gövdesi | ikon | `.b` opaklığı .5 (`--ci-bo` yok) | `soft={1}` → tam opak (InboxRows.tsx:193) |
| 11 | Yüz: halka konumu ve harf | ölçü | 48 dış, halka içeride (iç 44); harf 17/700 | yüz 48 + dışta 2 halka = 52 dış (OP-AV, kit.tsx:1303-1324); harf 18/700 (auraKit.ts:356 `av.row`) |
| 12 | Ad harf aralığı | yazı | `.nm` 16/600/22, harf aralığı 0 | `h3` -0.005em ≈ -0.08px (auraKit.ts:249) |
| 13 | Okundu tiki | ikon | yol `M2.5 12.8l4.2 4.2L15 8.4M10.4 16.4l.6.6 8.4-8.6`, stroke 2.4, 18 px | yol `M2 12.5l4.2 4.2L14 8.4M10.6 16.7 18.6 8.4`, stroke 2 (ChatBubble.tsx:1585-1586, 1573), 18 px ✓ (OP-TICK) |
| 14 | Önizleme satırının sonu | yazı | kesilmez; son 44 px'te `mask` gradyanı ile sönüyor | `lines={1}` → "…" ile kesilir (InboxRows.tsx:346-351; kit.tsx:102) |
| 15 | Sessizde simgesi (Furkan) | özellik yok | adın yanında 16 px zil-çizgili ikon, ayrıca menüde "Sessize al" | DM sessize alma yok: sunucu sözleşmesi yok (davranis-eksikleri.md F); satırda simge yok (InboxRows.tsx:296-298) |
| 16 | Mesajı olmayan satırda saat | metin | "S2c!56": "Henüz mesaj yok" yanında "Per" | `lastMessageAt` yoksa saat çizilmez (InboxRows.tsx:299) |
| 17 | "Arşivlenenler" satırı | yazı/ikon | metin 15/600/**22**; sayı 13/600/**18**; ikon gövdesi .5; chevron yolu `M9 5.5l6.5 6.5L9 18.5` stroke 2.6 | `holdRow` 15/600/**20**; `exploreCount` 13/600/**17** (auraKit.ts:210, 52); ikon `soft={1}` (InboxRows.tsx:227); chevron `M9 5.5 15.5 12 9 18.5` stroke 3.2 (capIcons.generated.ts:60) |
| 18 | Sekme çubuğu: sekmeler arası boşluk | boşluk | `gap:2`; sekme genişliği (350-10-8)/5 = 66.4 | boşluk yok, genişlik 68 (motion/TabBar.tsx:70 `tabWidth`) |
| 19 | Sekme çubuğu camı (açık) | renk | `.glass` gradyan .80→.54, kenar .86, gölge `0 6px 18px rgba(3,27,11,.08), 0 0 0 1px rgba(3,27,11,.04)` (TB2) | düz .60, kenar .90, inset .95, gölge `0 6px 18px .08` (aura.ts:23-28); 1 px .04 halka yok |
| 20 | Sekme çubuğunun alttan uzaklığı | ölçü | `bottom:30` (ekranın dibinden) | `insets.bottom + 12` (components/TabBar.tsx:130; aura.ts:101): 34 dp inset'te 46 (formülden; pano 30) → FARK 16 |
| 21 | Sekme çubuğu: ekran içeriği | fazla | — | `TabBarEdge`/`.fade` ✓ 150 (aura.ts:113); yalnız bilgi |
| 22 | Üst başlık alanı (60 px) | ölçü | `.content padding-top:60` | `M.top 13` + güvenli alan (47 inset'te 60) → UYUYOR |
Not (fazla): kodda aramada çıkan "×" (messages/index.tsx:106-119) ve sohbetsiz boş hâl panoda yok; ilgisi 01-grup dışı panolarda (MesajlarAra, MesajlarBos).

## 01b Mesajlar, kaydırılmış — project/MesajlarKaydir.dc.html
Kod: messages/index.tsx; motion/StickyField.tsx; components/Screen.tsx; motion/TopBar.tsx
Öğe sayısı: 83 · uyuyor: 62 · fark: 8 (Main'in #1-#22'si ayrıca geçerli) · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | Büyük başlık "Mesajlar" kayarken | davranış | içerikle kayıp söner; yerine bar bandında küçük başlık "Mesajlar" 17/700, harf -0.2, 22 satır; yanında iki yuvarlak (zil noktalı) | başlık satırı `Screen top` içinde sabit, büyük başlık hiç sönmüyor; `bar`/`title` verilmedi (messages/index.tsx:67-97; Screen.tsx:139-145 `kind=null`) |
| 2 | Bar bandında sabitlenen | düzen | yalnız bölmeli seçici (İstekler rozeti 3 ile); arama kapsülü içerikle gidiyor | `StickyField band` hem aramayı hem seçiciyi birlikte sabitliyor (index.tsx:98-146) |
| 3 | Bar bandı görünümü (açık) | renk | `padding:52 20 22`, gap 10, dolgu rgba(255,255,255,.32), blur 24 saturate 1.1, alt 22 px `mask` ile sönme | düz zemin rgba(239,247,241,.84), 118 yüksek, son %28'i sönüyor, bulanıklık yok (aura.ts:46-48, 120-128, 330-335) |
| 4 | Bar bandı (koyu) | koyu | rgba(0,0,0,.86) | rgba(0,0,0,.84) (aura.ts:83) |
| 5 | Kayan listede ek satırlar (Elif…Irmak) | metin | "Çar, Sal, 12 Kas, 10 Kas, 8 Kas, 5 Kas, 2 Kas" damgaları | `WEEKDAYS_SHORT` (tr.ts:102) ve `dayMonth` "12 Kas" biçimi ✓ (uyuyor) |
| 6 | Sabit bar içi başlık/aksiyon boşluğu | ölçü | `.sbr` min-height 48, gap 12, `.acts` gap 8 | küçük bar başlığı olmadığı için karşılığı yok (#1) |
Not: hareket (başlığın küçülerek bara girmesi) panoda yok, iskelet.md 3.1 ile `TOP_BAR.buyukBaslik` var ama Mesajlar bunu kullanmıyor.

## 01c Mesajlar, sohbete uzun basma — project/MesajlarUzunBas.dc.html
Kod: InboxRows.tsx:49-143 (`useThreadMenu`); motion/Menu.tsx (MenuPop `hold`, MenuCard); components/SheetScrim.tsx; theme/auraKit.ts:1272-1281
Öğe sayısı: 63 · uyuyor: 43 · fark: 11 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | Basılı tutulan satır | eksik | `.rw.ub`: örtünün ÜSTÜNDE, yüzey rengi kart, köşe 22, `margin 0 12`, iç boşluk 10/8, gölge `0 12px 32px rgba(3,27,11,.16)`; koyuda #151A18 + 1 px halka | satır yeniden çizilmiyor; Menu yalnız örtü + menü çiziyor, satır örtünün altında kararıyor (motion/Menu.tsx:211-328; InboxRows.tsx:100) |
| 2 | Örtü bulanıklığı | davranış | blur 6 px (`.ubs`) | `SCRIM_GLASS` lab kapalı, bulanıklık yok (SheetScrim.tsx:27-30; davranis-eksikleri.md C'de bilinen) |
| 3 | Menünün soldan uzaklığı | ölçü | `left:20` | `menuPlace` satırın x'inden (0) `KIT.size.menuGap`=8'e sıkıştırır (menuPlace.ts:27-30; auraKit.ts:1040) |
| 4 | Menü: "Sessize al" satırı | özellik yok | slash'li zil + "Sessize al" (2. sıra) | satır yok; DM sessize alma sözleşmesi yok (davranis-eksikleri.md F) |
| 5 | Menü: "Profilini gör" (ÖNERİ rozetli) | özellik yok | kişi ikonu + "Profilini gör" + ÖNERİ | satır yok; `/people/[publicId]` ve `openProfile` var (uygulanabilir) |
| 6 | Menü: "Engelle" (kırmızı) | eksik | band altı ilk kırmızı satır: daire+çizgi ikonu "Engelle" | satır yok; `safetyApi.blockFriend` ve `ConfirmWithReport` DM ekranında var, gelen kutusu menüsünde yok (InboxRows.tsx:98-141) |
| 7 | "Sabitle" ikonu | uyuyor | — | — |
| 8 | "Sohbeti sil" çöp ikonu | ikon | b rect(5,8,14×13,rx3.6), a rect(3,4.6,18×2.8), a rect(9.4,2.4,5.2×2.6) | b rect(6,8,12×12.6,rx3.4), a rect(3,4,18×3.2), a rect(8.9,2.1,6.2×2.6) (capIcons.generated.ts:294) |
| 9 | "Sohbeti sil" yanında ÖNERİ | metin | rozet (pano notu; ürün öğesi değil) | yok (doğru: işaret yalnız panoda) |
| 10 | Menü sıra/bant | sıra | Sabitle, Sessize al, Arşivle, Profilini gör, [6 px bant], Engelle, Sohbeti sil | Sabitle, Arşivle, [bant], Sohbeti sil (MenuCard banded: Menu.tsx:126-166) |
| 11 | Menünün erişilebilir adı | davranış | `aria-label="Fevve sohbeti"` | `tr.messages.menu(name)` tanımlı (tr.ts:360) ama MenuPop'a verilmiyor (Menu.tsx:293-295 yalnız role; `tr.messages.menu` hiçbir yerde kullanılmıyor) → FARK |
Kalan menü ölçüleri UYUYOR: genişlik 268, köşe 24, iç 6, satır 44, 12 yan, 16 köşe, ikon 20, boşluk 14, ayırıcı 46'dan, band 6, yazı 15/600/20, kırmızı #A8301A/#FF977E, ikon gövdesi .35 (auraKit.ts:1272-1281; Menu.tsx:368-435), örtü .30/.62 ✓.

## 01d Mesajlar, sabitli sohbete uzun basma — project/MesajlarUzunBasSabit.dc.html
Kod: aynı (01c) + `t.pinned` dalı InboxRows.tsx:108-114
Öğe sayısı: 63 · uyuyor: 43 · fark: 11 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | "Sabitlemeyi kaldır" ikonu | ikon | pushpin, gövde .b, başlık da .b, üzerinde `rect(1.6,10.6,20.8×2.8,rot45)` çizgisi (çizgili iğne) | `cap="pushpin"` ile "Sabitle"yle aynı ikon, çizgisiz (InboxRows.tsx:109-114) |
| 2 | Basılı tutulan satır (Adem, sabit liste) | eksik | bkz. 01c #1 | bkz. 01c #1 |
| 3 | Örtü blur 6 | davranış | bkz. 01c #2 | bkz. 01c #2 |
| 4 | Menü soldan 20, `top:340` | ölçü | bkz. 01c #3 | bkz. 01c #3 |
| 5 | "Sessize al", "Profilini gör", "Engelle" | özellik yok/eksik | bkz. 01c #4-#6 | bkz. 01c #4-#6 |
| 6 | Çöp ikonu | ikon | bkz. 01c #8 | bkz. 01c #8 |
| 7 | Menü sıra | sıra | Sabitlemeyi kaldır, Sessize al, Arşivle, Profilini gör, band, Engelle, Sohbeti sil | Sabitlemeyi kaldır, Arşivle, band, Sohbeti sil |
| 8 | Metin "Sabitlemeyi kaldır" | metin | ✓ | tr.ts:362 uyuyor |
| 9 | Pano kalıbı: sabit liste tek satır, "Sabitlenenler" başlığı | düzen | ✓ | uyuyor |
| 10 | Sabit satırın ListMove hareketi | hareket | panoda hareket yok | var (bilgi) |
| 11 | Menü erişilebilir adı | davranış | "Adem sohbeti" | bkz. 01c #11 |

## 01e Sohbeti sil onayı — project/MesajlarSohbetSil.dc.html
Kod: InboxRows.tsx:69-95 (`confirm({...})`); motion/Dialog.tsx; lib/overlayStore.ts; theme/auraKit.ts:1155-1262
Öğe sayısı: 55 · uyuyor: 43 · fark: 6 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | Dialog örtüsü | renk/davranış | `.ubs` rgba(3,27,11,.30) + blur 6 px; koyu .62 | `KIT.layer.scrim` .42 / koyu .70, bulanıklık yok (Dialog.tsx:122-126; auraKit.ts:1163) |
| 2 | Başlığın ikon diskinden uzaklığı | boşluk | `.dt{margin:16px 0 0}` | 14 (`dialogTitleGap` auraKit.ts:1251, Dialog.tsx:160) |
| 3 | "Vazgeç" düğmesi | renk/düzen | `.btn.ghost`: arka plan yok, kenar yok, gölge yok, yazı `--text` | `variant="glassy"` (soft dolgulu, kenarlı, gölgeli kapsül) (Dialog.tsx:203-211) |
| 4 | Çöp ikonu disk içinde | ikon | `--ci-b` rgba(200,56,31,.35) gövde; çizim b(5,8,14×13)… | `soft={1}` gövde tam opak (Dialog.tsx:163-168); çizim 01c #8 |
| 5 | Sil düğmesi ikonu | ikon | ikon 24 (`.ci`), gövde .35'siz `--ci-b: on-danger-soft` .5 | `Btn icon` 22 (`KIT.size.icon`), gövde .5 ✓ (kit.tsx:457, 486) → boy FARK 22 vs 24 |
| 6 | Kart konumu | ölçü | `top:250` sabit | ortalı (`root justifyContent:center`, Dialog.tsx:227) → kart ~312 yüksek, üst ≈266; fark ~16 FARK |
UYUYOR: yan 28, köşe 28, iç 24/20/20, disk 56, disk ikonu 28, başlık 21/700/26 -0.3, metin 6 altta/20, düğme aralığı 8, metinler "Sohbet silinsin mi?", "{ad} ile tüm mesajlar senin listenden silinir. Bu geri alınamaz.", "Sohbeti sil", "Vazgeç" (tr.ts:365-369, 165).

## 01f Arşivlenenler — project/Arsiv.dc.html
Kod: messages/archive.tsx; InboxRows.tsx (InboxList/InboxRow); motion/TopBar.tsx (BarBack); theme/flatLists.ts
Öğe sayısı: 37 · uyuyor: 29 · fark: 6 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | Üst satır yüksekliği | ölçü | `.ptop` doğal 44 (yuvarlak 44, başlık bloğu 26+18) + `margin:-8px 0 4px` | `minHeight: B.row` = 56 (archive.tsx:52; flatLists.ts:20): yuvarlak 6 px aşağı kayar, FARK |
| 2 | Geri ikonu | ikon/ölçü | yol `M14.5 5.5 8 12l6.5 6.5` stroke 3, 24 | `back` iki rect (a+b) 22 (TopBar.tsx:79-88; capIcons.generated.ts:9) (OP-IKON) |
| 3 | Satırlar: yüz/harf/ad/tik/önizleme | ölçü/yazı/ikon | bkz. 01 #11-#14 | bkz. 01 #11-#14 |
| 4 | Okunmamış satır (Barış "2 Eki", rozet 2) | uyuyor | — | — |
| 5 | Altta sekme çubuğu ve `.fade` | düzen | bkz. 01 #18-#20 | bkz. 01 #18-#20 |
| 6 | Sohbet damga biçimi "12 Eki", "28 Eyl", "27 Ağu" | metin | ✓ | `dayMonth` ✓ |
UYUYOR: başlık "Arşivlenenler" 21/700/26 (-0.3), alt satır "12 sohbet" 13/500/18, ipucu "Bir sohbeti geri almak için üstüne uzun bas." 13/500/18, 4 yan, 12 aralık (archive.tsx:49-93, tr.ts:380-385).

## 01g Arşiv, uzun basma — project/ArsivUzunBas.dc.html
Kod: archive.tsx + InboxRows.tsx:101-141 (`t.archived` dalı)
Öğe sayısı: 52 · uyuyor: 38 · fark: 9 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Basılı satır (Barış) | eksik | bkz. 01c #1 | bkz. 01c #1 |
| 2 | Örtü blur | davranış | bkz. 01c #2 | bkz. 01c #2 |
| 3 | Menü soldan 20, `top:370` | ölçü | bkz. 01c #3 | bkz. 01c #3 |
| 4 | "Sessize al" | özellik yok | bkz. 01c #4 | — |
| 5 | "Profilini gör" (ÖNERİ) | özellik yok | bkz. 01c #5 | — |
| 6 | "Engelle" | eksik | bkz. 01c #6 | — |
| 7 | Çöp ikonu | ikon | bkz. 01c #8 | — |
| 8 | Menü sıra | sıra | Arşivden çıkar, Sessize al, Profilini gör, band, Engelle, Sohbeti sil | Arşivden çıkar, band, Sohbeti sil |
| 9 | Üst satır, geri ikonu, satırlar | — | bkz. 01f #1-#3 | — |
"Arşivden çıkar" ikonu UYUYOR (unarchive: b+b+sa yol, capIcons.generated.ts:299); metin ✓.

## 01h Arşiv, boş — project/ArsivBos.dc.html
Kod: archive.tsx:80-88; components/EmptyState.tsx
Öğe sayısı: 13 · uyuyor: 8 · fark: 3 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Resim "Arşiv kutusundan bakan kapsül kanki" | resim | `/_blob/6f5a9f71…` 120×98 (png 360×294), BLOBLAR.md:77 "yok" | `riso` verilmedi: resim yok, EmptyState'in işareti çiziliyor (archive.tsx:82-87; EmptyState.tsx:47-60, 91-97 `RISO_BOARD`'da `archive` yok); varlık depoda yok |
| 2 | Dikey konum | düzen | `.emp` alt iç boşluk 190: içerik ortadan ~95 yukarıda | `flex:1 justify-center`, alt iç boşluk 0 (archive.tsx:81) → FARK 190 vs 0 |
| 3 | Geri ikonu/üst satır | ikon/ölçü | bkz. 01f #1, #2 | — |
UYUYOR: başlık "Arşivlenenler" (alt satır yok ✓ `archived.length>0` koşulu), "Arşivde sohbet yok", "Bir sohbete uzun basıp Arşivle dediğinde burada durur." (tr.ts:384-385); başlık 15/600 ve metin 13/500, 4 aralık.

## 02 DM sohbeti — project/DmSohbet.dc.html
Kod: messages/[threadId].tsx; components/{ChatScreen,ChatTopBar,ChatBubble,Composer,ChatWallpaper}.tsx; theme/{dm,chatLook,auraKit}.ts
Öğe sayısı: 48 · uyuyor: 31 · fark: 13 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | Üst bant (`.band`) | renk/düzen | 132 yüksek, düz #D9E8F7 (koyu #000), ilk %40 dolu, sonra şeffaf | duvar resminin şeritleri yeniden çiziliyor (`WallBand`, 8 kademeli sönme; ChatWallpaper.tsx:77-130; ChatScreen.tsx:1317-1380), düz tint yok |
| 2 | Duvar resmi | uyuyor | wall.L/D (png 1290×2796) | `wall-dm-light/dark.webp` aynı resim (BLOBLAR.md:188) |
| 3 | Geri yuvarlağı | ikon | `back` stroke 3 yol, 24 | `back` iki rect, 22 (bkz. 01f #2) |
| 4 | Yüz (kapsül içinde) | ölçü | 40 dış, halka içeride | yüz 40 + halka 2 dışta = 44 dış (ChatTopBar OP-AV: `[threadId].tsx:546-560`, kit.tsx:1292-1324; dm.ts:152) |
| 5 | Kapsülde "Sohbette ara" düğmesi | özellik yok | `.ib` 40×44, arama ikonu md (20) | yok; sohbet içi arama işlevi yok (ChatTopBar actions yalnız ⋮) |
| 6 | "Diğer" (⋮) düğmesi | ölçü/ikon | `.ib` 40×44, 3 daire r2.2 hepsi a | `Round side=DM.bar.more` 44, `moreV` (kare 4.8, ortası b) (ChatTopBar.tsx:117-… ; [threadId].tsx:598-606; capIcons.generated.ts:181) |
| 7 | Gün çipi "Dün/Bugün", gün aralığı 10/8, dolgu 4/12 | uyuyor | — | dm.ts:55-57 ✓ |
| 8 | Baloncuk ölçüleri (7/12, 18, ayak 6, %78, renk #0E8745/#0B783D, gölge) | uyuyor | — | dm.ts:19-23, 128-142 ✓ |
| 9 | Okundu tiki | ikon | yol 2.4 stroke, 16 px | stroke 2 (bkz. 01 #13; ChatBubble.tsx:1573) |
| 10 | Tepki hapları (30, 4/10, yüz 22, 12/600) | uyuyor | — | dm.ts:29-39 ✓ |
| 11 | "2 yeni mesaj" okunmamış çizgisi | metin | "2 yeni mesaj" (sayı ile) | "Okunmamış mesajlar" (tr.chat.newLine tr.ts:1009; sayı yok). Not: CLAUDE.md "Ekran davranışı"nın (30 Ekim) metni de bu; pano ile çelişiyor, karar proje sahibinde |
| 12 | Alıntı kutusu (`.q`) | uyuyor | 10 köşe, 6/10, beyaz %18 | dm.ts:42-47 ✓, yazı 12/700/16 ve 13/500/17 ✓ (ChatBubble.tsx:1223-1226) |
| 13 | "yazıyor" baloncuğu | hareket | 34 yük, 14 yan, 3 nokta 8, aralık 5, ortadaki nokta duruşta -3, renkler pembe/amber/mavi, **durağan** | ölçüler ✓ (dm.ts:50, ChatBubble.tsx:1630-1665); noktalar animasyonlu zıplıyor (-4) ve opaklık .45→1 (ChatBubble.tsx:1598-1660) |
| 14 | Yazı alanı: placeholder | metin | "Mesaj yaz" | "Mesaj yaz…" (tr.ts:701) |
| 15 | Alan içi sol boşluk | boşluk | iç 6 + emoji 40 + `.ph` 4 | 20 (`DM.composer.padLeft`, dm.ts:105, Composer.tsx:356) |
| 16 | Alandaki Emoji düğmesi | özellik yok | `.ib` 40, yüz ikonu | yok; emoji seçici ve ikon kodda yok (Composer.tsx tamamı; capIcons'ta yüz/emoji ikonu da yok) |
| 17 | "Dosya ekle" (ataş) | özellik yok | `.ib` 40 | yok |
| 18 | "Kamera" | özellik yok | `.ib` 40 | yok (DM'de fotoğraf gönderme yok; CapIcon `camera` var ama bağlı değil) |
| 19 | "Sesli mesaj" (mikrofon) | özellik yok | `.ib` 40 | yok (sunucu ucu ve ikon yok) |
| 20 | Gönder düğmesi | davranış | boş alanda çizilmiyor (`.snd` tanımlı, markup'ta yok) | boşken gizli, dolunca 52 mürekkep yuvarlak ✓ (Composer.tsx:404-408, dm.ts:107) uyuyor |
| 21 | Metin alanı yazısı | uyuyor | 15/500/22 | `msgDm` 15/500/22 ✓ |
| 22 | Alan camı/52/26 köşe/gölge | uyuyor | — | dm.ts:105-109,129-133 ✓ |

## 02b DM, gelen mesaja uzun basma — project/DmMesajMenu.dc.html
Kod: components/MessagePop.tsx; ChatBubble.tsx:610-640 (`popLayer`); [threadId].tsx:763-788 (`actions`); motion/Menu.tsx
Öğe sayısı: 64 · uyuyor: 44 · fark: 9 · fazla: 0 · doğrulanamadı: 0 (02'nin #1-#19'u ayrıca geçerli)
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | Menü genişliği | ölçü | `.hold .pop{width:220}` | 268 (`Menu float` holdWidth, MessagePop.tsx:200; Menu.tsx:94; auraKit.ts:1273) |
| 2 | Menüde "Bildir" (kırmızı, bant altında) | eksik | Yanıtla, Kopyala, [bant], **Bildir** (bayrak ikonu) | gelen mesajda `actions` yok: yalnız Yanıtla, Kopyala (ChatBubble.tsx:625-640; [threadId].tsx:754-756 `gone || !m.from_me ? undefined`). `tr.chat.report`='Bildir' var (tr.ts:1007); sohbet düzeyinde `safetyApi.reportDm(threadId)` var, mesaj düzeyinde yok |
| 3 | Tepki çubuğu: yüz kutusu | ölçü | 40×40 | genişlik 42 (`SPACING[10]+SPACING[0.5]`, MessagePop.tsx:169), yükseklik 40 |
| 4 | Tepki çubuğu gölgesi | renk | `0 12px 32px rgba(3,27,11,.18)`; koyuda `0 0 0 1px rgba(255,255,255,.08)` | `shape.shadow.sheet` = `0 8px 22px rgba(3,27,11,.13)`, koyuda gölge yok (MessagePop.tsx:91; theme.ts:150,158) |
| 5 | Seçili tepki (`.f.sel`) | renk | `--surface2` dolgu + 2 px iç halka `--text` (koyu #262E2B + #EEF3F0) | yalnız `colors.surface2` dolgusu, halka yok (MessagePop.tsx:172-173) |
| 6 | Basılı tutulan balon gölgesi | renk | `.hold .msg{box-shadow:0 12px 32px rgba(3,27,11,.18)}` | kendi gölgesini koruyor (`bubbleShadow`, ChatBubble.tsx:410-415, 460) |
| 7 | Menü ikonları | ikon | Yanıtla: stroke yol `M10 5.4 4 11l6 5.6` + `M5 11h8.4c4 0 6.6 2.6 6.6 6.6v1` (2.8); Kopyala: a rect(8.4,8.4,12×12.6,rx3.4), b rect(3.6,3,…); Bildir: bayrak a rect(4,3,2.8×18.4)+b path | `reply`: ob yol + 2 rect (rot ±45); `copy`: b rect(3.2,3.2,12×14,rx3.6), a rect(8.8,6.8,…); `report`: a rect(-3.2,10.6…rot90)+b yol (capIcons.generated.ts:249, 85) |
| 8 | Örtü blur 6 | davranış | blur(6px) | bkz. 01c #2 |
| 9 | Menünün sol/üst konumu | ölçü | `.hold>.pop top:calc(100% + 8px); left:0` | `gap` 8 ✓ (MessagePop.tsx:95); sol: balonun kenarı ✓ uyuyor |
UYUYOR: tepki çubuğu iç 4, aralık 2, yüz 36, 6 yüz sırası (Beğendim, Bayıldım, Kahkaha, Şaşırdım, Üzüldüm, Kızdım), menü 24 köşe/6 iç/44 satır/46 ayırıcı/band 6, "Yanıtla", "Kopyala" metinleri, 8 boşluk.

## 02c DM, kendi mesajına uzun basma — project/DmMesajMenuBen.dc.html
Kod: 02b ile aynı + [threadId].tsx:757-776 (`canEdit` ve `delete` eylemleri)
Öğe sayısı: 66 · uyuyor: 47 · fark: 8 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | Menü genişliği 220 | ölçü | bkz. 02b #1 | 268 |
| 2 | Tepki çubuğu yüz 40, gölge, seçili halka | ölçü/renk | bkz. 02b #3-#5 | — |
| 3 | Basılı balon gölgesi | renk | bkz. 02b #6 | — |
| 4 | İkonlar: Yanıtla, Kopyala, Düzenle, Sil | ikon | Düzenle: a rect(2.8,9.6,16.4×5,rot-45)+b rect(3,19,18×2.6); Sil: b(5,8,14×13)+a(3,4.6,18×2.8)+a(9.4,2.4,5.2×2.6) | `edit`: b rect(3.4,9.6…)+a rect(12.2,18.4…)+daire; `trash` 01c #8; reply/copy 02b #7 |
| 5 | Sağa hizalı tepki çubuğu ve menü | uyuyor | `.hold.me` sağ hizalı | `alignItems: mine ? 'flex-end'` ✓ (MessagePop.tsx:127,145) |
| 6 | Okundu tiki | ikon | bkz. 02 #9 | — |
| 7 | Menü sırası | sıra | Yanıtla, Kopyala, Düzenle, [bant], Sil | ✓ aynı (ChatBubble.tsx:625-646; Menu.tsx:131-134) uyuyor |
| 8 | Alttaki tepki hapları "Bayıldım 1/Kahkaha 2" | uyuyor | — | dm.ts:29-39 ✓ |
UYUYOR: metinler "Yanıtla", "Kopyala", "Düzenle", "Sil" (tr.ts:981-982, 719, 726). Not: kod 15 dk sonrası "Düzenle" yerine not gösteriyor (DmMenuSureDoldu, başka panoda).

## 02d DM, mesajı düzenleme — project/DmDuzenle.dc.html
Kod: Composer.tsx:300-560 (CapsuleBar, DmStrip), 800-830 (EditStrip); [threadId].tsx; theme/dm.ts
Öğe sayısı: 52 · uyuyor: 37 · fark: 11 · fazla: 0 · doğrulanamadı: 0 (02 #1-#6 ve #9, #11 ayrıca geçerli)
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | Düzenleme şeridi: kalem ikonu | ikon | a rect(2.8,9.6,16.4×5)+b rect(3,19,18×2.6), 20 px | `edit` b/a roller ters + ek daire, 20 (Composer.tsx:530; capIcons.generated.ts:99) |
| 2 | Şeridin × düğmesi ikonu | ikon | yol `M6.5 6.5l11 11m0-11-11 11` stroke 2.6, 18 | `close` iki rect, 18 (Composer.tsx:553; capIcons.generated.ts:68) |
| 3 | Alan sol boşluğu / emoji | boşluk/özellik yok | emoji 40 + `.val` 4 | 20, emoji yok (bkz. 02 #15, #16) |
| 4 | Gönder (✓) | uyuyor | 52 yuvarlak #031B0B, ✓ stroke 3, ikon 22; koyuda %94 beyaz | dm.ts:107, Composer.tsx:620-668 (TICK 22, stroke 3) ✓ |
| 5 | Şerit ölçüleri | uyuyor | radius 20, 8, 14/6, gap 10, ikon 20, × 36 (ikon 18); başlık 13/700/17, metin 13/500/17 | dm.ts:93-96, auraKit.ts:141-142 ✓ |
| 6 | Düzenlenen balon çerçevesi | uyuyor | 2 px `--text` halka, offset 2 | dm.ts:75-76; ChatBubble.tsx:438-446 ✓ |
| 7 | Metinler "Mesajı düzenle", "Düzenlemeyi iptal et", "Düzenlemeyi kaydet" | uyuyor | — | tr.ts:720-722 ✓ |
| 8 | Şerit konumu (alanın 106 üstü) | düzen | `.eb bottom:106` ve `.flow bottom:178` | şerit alanın üstünde akışta (Composer.tsx:361-403; alanla 8 boşluk = pano 106-(46+52) ✓) → UYUYOR |
| 9 | Alan yazısı imleci | renk | `--accent` 2×20 (koyu #3DDC84) | sistem imleci `selectionColor={colors.accent}` (Composer.tsx:431): RN imleci 2×20 çizemez; FARK (sistem imleci) |
| 10 | "yazıyor" baloncuğu bu panoda yok | uyuyor | — | düzenlerken `typing` yine çizilebilir ([threadId].tsx:488) (pano çizmemiş: bilgi) |
| 11 | Üst çubuk, balonlar, duvar | farklar | bkz. 02 #1, #3-#6, #9, #13 | — |

## 02e DM, düzenlenmiş mesajlar — project/DmDuzenlendi.dc.html
Kod: ChatBubble.tsx (`EditedMark`, `stampRoom`); [threadId].tsx:742-745; theme/dm.ts:66-67
Öğe sayısı: 50 · uyuyor: 39 · fark: 9 · fazla: 0 · doğrulanamadı: 0 (02 #1-#6, #9, #11, #13-#19 ayrıca geçerli)
| # | öğe | tür | pano | kod |
|---|---|---|---|---|
| 1 | "düzenlendi" damgası | uyuyor | `.s .edt` 500 italik, %90, 4 sağında, saatin önünde | dm.ts:66-67; ChatBubble.tsx:575 (`EditedMark`) ✓; metin "düzenlendi" tr.ts:723 ✓ |
| 2 | Alıntıdaki düzenlenmiş metin | davranış | alıntı da yeni metni gösteriyor ("…9'da kuruluyor") | `toChatQuote(quote)`: alıntı gövdesi sunucudan `reply_to` (parseQuote) taşıyor; `dm_messages_page` alıntıyı canlı mesajdan birleştiriyor (dm_delete.sql:278) → UYUYOR |
| 3 | Gelen mesajda "düzenlendi" ("Geliyorum, 15 dk") | uyuyor | — | `editedAt(m)` yalnız `!gone`; gelen için de çiziliyor ✓ ([threadId].tsx:743-745) |
| 4 | Okundu tiki, üst çubuk, alan, duvar, bant | fark | bkz. 02 #1-#6, #9, #14-#19 | — |

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
|---|---|---|---|
| 01 Main | 47 | 20 | evet |
| 01b MesajlarKaydir | 83 | 8 (+Main'inkiler) | evet |
| 01c MesajlarUzunBas | 63 | 11 | evet |
| 01d MesajlarUzunBasSabit | 63 | 11 | evet |
| 01e MesajlarSohbetSil | 55 | 6 | evet |
| 01f Arsiv | 37 | 6 | evet |
| 01g ArsivUzunBas | 52 | 9 | evet |
| 01h ArsivBos | 13 | 3 | evet |
| 02 DmSohbet | 48 | 13 | evet |
| 02b DmMesajMenu | 64 | 9 | evet |
| 02c DmMesajMenuBen | 66 | 8 | evet |
| 02d DmDuzenle | 52 | 11 | evet |
| 02e DmDuzenlendi | 50 | 9 | evet |

Doğrulanamadı kalmadı (18'i koddan çözüldü).
Sınırlar: hepsi koddan okundu, telefon/görüntü yok. Telefonda bakılacaklar: tab çubuğu alt uzaklığı (01 #20), dialog dikey konumu (01e #6), arşiv boş hâl dikey konumu (01h #2), Btn ikon boyu (01e #5), alıntı yazı boyları (02 #12), basılı satır kartının yokluğu (01c #1).
Değişmez kural işareti: bu gruptaki panolarda "KURAL" gerektiren öğe çıkmadı.
