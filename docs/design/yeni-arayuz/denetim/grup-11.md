# Pano–kod denetimi, grup 11 (99–111)

Not: Yol ve sınıf değerleri `skall.css`, `ekran.css`, `koyu.css` ve panonun kendi `<style>` bloğundan çözüldü. Kod değerleri `src/theme/auraKit.ts`, `dm.ts`, `chatLook.ts`, `semt.ts`, `messages.ts`, `flatLists.ts` ile bileşenlerden okundu. Blob resimleri depoda olmadığından (BLOBLAR.md "yok") boyut karşılaştırılabildi, içerik karşılaştırılamadı. "Bilinen" etiketi `davranis-eksikleri.md` / `pano-kod-denetimi.md`'de zaten yazılı olanı belirtir; yine de pano geçerli olduğundan fark olarak yazıldı.

Ortak parça kısaltmaları (ilkinde tam yazıldı, sonrakilerde "bkz."):
- ORTAK-H1: Semt hero sayfalarının başlığı ve büyük düğmesi (100 #h1, #btn).
- ORTAK-TOG: kimlik anahtarı (99 #tog).
- ORTAK-DLG: merkez dialog (99 #dlg).
- ORTAK-SEARCH, ORTAK-SEG, ORTAK-ROW: Mesajlar arama alanı, sekme kapsülü, sohbet satırı (104 #s1–#s3).
- ORTAK-EMPTY: boş durum işareti (109 #e1–#e3).
- ORTAK-TAB: alt sekme çubuğu. Panoda `.tb` 60 yüksek, kenarlardan 20, iç 5, sekme 50, ikon 20, yazı 600 10/13 ve .1 harf aralığı, seçili hap #031B0B (koyuda %94 beyaz). Kodda `AURA.tabBar` (aura.ts:93–112: height 60, inset 20, padding 5, pillHeight 50, iconLabelled 20, labelGap 3), `tokens.ts:359 tabLabel` 10/13, `AURA[scheme].tab.pill` aynı renkler. Hepsi UYUYOR; panonun alttan 30'u kodda `insets.bottom + 12` (aura.ts:101), cihaza göre değişir: DOĞRULANAMADI (ekran çerçevesi yok).

---

## 99 Semt sohbeti · süre bitti, devam sorusu — project/SemtSureBitti.dc.html
Kod: `app/(app)/district/room.tsx` (üst bar 497–540, `useContinueDialog` 676–716, `ClosesIn` 720–741), `src/components/ChatTopBar.tsx`, `IdentityToggle.tsx`, `src/features/district/parts.tsx:576 TimeChip`, `src/motion/Dialog.tsx`, `ChatScreen.tsx → DayLine`, `Composer.tsx`.
Öğe sayısı: 31 · uyuyor: 17 · fark: 11 · fazla: 1 · doğrulanamadı: 2

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst kapsül altyazısı | eksik, KURAL 4 | `.who .nm span` "6 kişi burada" 500 12/16 | `room.tsx:502–506` `subtitle` verilmiyor (ChatTopBar destekliyor, `ChatTopBar.tsx:105`). Odadakiler sayısı yalnız Odadakiler listesinde gider (CLAUDE.md kural 4); başlıkta sayı göstermek bu kuralı değiştirir. Bilinen. |
| 2 | "sol-p9x2 yazıyor" satırı ve üç noktalı balon | eksik, KURAL 4 | `.nk.o4` "sol-p9x2 yazıyor" + `.typing` 34 yüksek, 14 iç, nokta 8, aralık 5 | Semt sohbetinde "yazıyor" yok (kural 4: "presence ve son yazanlar yok"); `room.tsx`'te typing kullanımı yok. Anonim nick ile "yazıyor" ayrıca nick–hesap bağını sızdırır: karar proje sahibinin. |
| 3 | "1 yeni mesaj" çizgisi | metin | "1 yeni mesaj" | "Okunmamış mesajlar" (`tr.ts:1009 chat.newLine`, `room.tsx:~381`); CLAUDE.md "Ekran davranışı" (30 Ekim kararı) bu metni sabitliyor. Sayı da yok. |
| 4 | Kimlik anahtarı: zemin (ORTAK-TOG) | renk | `.tog` zemin `--surface2` (#E6F0E8; koyu #1B211F) | `IdentityToggle.tsx:149` `c.hair` (açık rgba(3,27,11,.07), koyu rgba(255,255,255,.07)) |
| 5 | Kimlik anahtarı: seçili halka | ölçü, koyu | halka 2.5, açık `--primary` #0E8745, koyu #3DDC84 | `auraKit.ts:KIT.identityToggle.ring` 2; `IdentityToggle.tsx:92` her iki temada `KIT.primary` #0E8745 (koyuda #3DDC84 değil) |
| 6 | Kimlik anahtarı: seçili olmayan yuva | ölçü | opaklık .55; seçili yuvanın arkası yok (resmin kendisi 32) | `KIT.identityToggle.dim` .45 (auraKit.ts); seçili yuvaya beyaz zemin (`IdentityToggle.tsx:90`) |
| 7 | Kimlik anahtarı: erişilebilirlik adı | metin | `aria-label` "Anonim" / "Profilinle" | `tr.district.room.anonymous` 'Anonim', `profiled` 'Profilim' (`tr.ts:1170` civarı) |
| 8 | Kimlik anahtarında kilit rozeti | fazla | yok | `IdentityToggle.tsx:101–118` kilitli yuvada 14'lük kilit rozeti (değişiklik hakkı bitince) |
| 9 | Süre çipi "Devam?" | koyu, ikon, ölçü | `.tmr.dv`: zemin #031B0B, yazı beyaz (koyu: %94 beyaz, #0B0E0D), ikon yok, iç boşluk 0 14, 700 13/18 | `parts.tsx:576–644` `chat` çipi: yüzey beyaz (#121614 koyu), saat ikonu 18, `T fine strong` 600; sol iç 8, sağ 12 (`chatLook.ts:35`). "Devam?" hâline özel koyu çip yok. |
| 10 | Süre çipinin yeri | boşluk | üst bar altından 12 (capsule alt = 104, çip üst = 116) | `room.tsx:497` bar `paddingVertical 6` + `SEMT.timeChip.top` 8 = 14 (`ChatTopBar.tsx` alt dolgu 6) |
| 11 | Mesaj alanındaki emoji düğmesi | özellik yok | `.fld .ib` emoji, 40×40, solda | `Composer.tsx` alan emoji içermiyor (dm.ts:78 "the app has not"). Bilinen. |
| 12 | Gönder düğmesi (boş alan) | düzen | `.snd` 52×52, hep görünür, pasif: `--disabled` zemin, `--on-disabled` ok | `Composer.tsx:350` `shown = !sendDisabled`; boşken düğme hiç yok (yalnız metin varken büyüyerek gelir) |
| 13 | Üstteki bant | renk | `.band` 132 yüksek, #F5E9D8'den (koyu #000) saydama, tek renk | `ChatWallpaper.tsx:85 WallBand`: duvar resminin şeridi solarak; düz renk değil |
| 14 | Merkez dialog: ikon boyu ve rengi (ORTAK-DLG) | ölçü, renk | 56'lık disk, ikon 26, renk `--primary` #0E8745 (koyu #3DDC84) | `auraKit.ts:1250 dialogDiscIcon` 28; `Dialog.tsx:151` `colors.accent` (açık #0B783D) |
| 15 | Dialog: ikon–başlık aralığı | boşluk | `.dt` margin-top 16 | `dialogTitleGap` 14 (auraKit.ts:1251, Dialog.tsx:145) |
| 16 | Dialog: "Cevap vermezsen…" hapı | boşluk, yazı | `.dw` margin 12 0 20, yazı 600 13/18 | `Dialog.tsx:177` hap üstü `dialogTextBottom` 20; `room.tsx:735` `T fine` (500). Üstte 8 fazla, yazı 600 değil 500. |
| 17 | Dialog: "Hayır, çık" düğmesi | düğme biçimi | `.btn.ghost`: zemin ve kenar yok, gölge yok, yazı `--text` | `Dialog.tsx:213` `variant="glassy"` (yumuşak beyaz, kenarlı); `ghost` değil |
| 18 | Dialog dikey yeri | düzen | `top:230` sabit | `Dialog.tsx` `styles.root` `justifyContent:'center'`; kart yüksekliği ~358'de yaklaşık 243: DOĞRULANAMADI (telefon yüksekliğine göre) |
| 19 | Duvar kâğıdı blob'ları (L `e07afd…`, D `326317…`) | resim | 1290×2796 PNG | `assets/riso/semt/wall-semt-light/dark.webp` 1290×2796: boyut eşit, içerik DOĞRULANAMADI (blob depoda yok) |
| 20 | Mesaj balonlarındaki örnek yüzler (`118e…`, `5b08…`, `517d…`) | resim | 192×192 örnek veri | Uygulamada gerçek kapsül/foto: DOĞRULANAMADI |

Uyuyan öğeler: geri yuvarlağı (44, `.round.soft`), kapsül 52 yüksek, başlık 16/20 600, `.who` iç 14/4, daha fazla yuvarlağı 44, gün hapı (12/16 600, iç 4/12), nick hapları 12/700, balon 18/6, saat damgası, tepki hapları (30), okunmamış çizgisi yapısı, alan placeholder'ı "Beylikdüzü'ye yaz…", dialog başlığı/gövdesi/metinleri/birincil düğme, scrim .42/.70, dialog gölgesi.

---

## 100 Semte git · oturum kapandı — project/SemtKapandi.dc.html
Kod: `app/(app)/district/ended.tsx`, `src/features/district/parts.tsx` (`HeroPage` 905, `HeroScreen` 872, `HeroBackdrop` 780, `HeroRound` 820, `Foot` 740), `src/theme/semt.ts`.
Öğe sayısı: 10 (alt sekme çubuğu ve `.fade` `display:none`, sayılmadı) · uyuyor: 7 · fark: 3 · fazla: 0 · doğrulanamadı: 0

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Başlık "Oturumun kapandı" (ORTAK-H1) | yazı | `.txt h1` 700 32/38, -0.8px | `parts.tsx:950` `T v="display"` = `KIT_TYPE.display` 500 32/42 (auraKit.ts:KIT_TYPE.display). Kalınlık 500 (pano 700), satır 42 (pano 38) |
| 2 | Birincil düğme "Yeniden gir" | ölçü, yazı | `.btn.big` yükseklik 56, 700 17/22 | `ended.tsx:30` `<Btn block>`: `KIT.size.btn` 48, `KIT_TYPE.btn` 600 16/20 (Btn tall=56 var ama kullanılmıyor, `kit.tsx:265`) |
| 3 | İkinci düğme "Keşfet’e dön" | ölçü, yazı, metin | `.btn.ghost.big` 56, 700 17/22, metin "Keşfet’e dön" (U+2019) | `ended.tsx:36` ghost 48, 600 16/20; `tr.district.backToExplore` "Keşfet'e dön" (düz '). |

Uyuyan: hero resmi (1050×600 webp ✓, `object-position 78% 100%` = `SEMT.hero.focusClosed`), tarak kenarı (hücre 20, çentik 8 + 1), kapatma yuvarlağı (44, rgba(5,30,24,.55), kenar .18, beyaz ikon: `SEMT.hero.round`), `.hdr` 56, gövde cümlesi (500 15/22 muted, üst 8), düğmeler arası 8, "Bugün tekrar girersen soru sorulmaz." metni, "Oturumun kapandı" metni, "Yeniden gir" metni.

---

## 101 Semte git · semtin dışındasın — project/SemtDisarida.dc.html
Kod: `app/(app)/district/outside.tsx`, `parts.tsx` (HeroPage kind="short").
Öğe sayısı: 8 · uyuyor: 5 · fark: 3 · fazla: 0 · doğrulanamadı: 0

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Başlık "Geçit henüz senin semtinde yok" | yazı | 700 32/38 | bkz. 100 #1 (`parts.tsx:950`, 500 32/42) |
| 2 | Gövde cümlesi | metin | "Şimdilik Beylikdüzü, Esenyurt ve Avcılar’da açık." (U+2019) | `tr.district.outside.body` "…Avcılar'da açık." (düz '), `tr.ts:1190` civarı |
| 3 | "Keşfet’e dön" düğmesi | ölçü, yazı, metin | 56, 700 17/22; "Keşfet’e dön" | `outside.tsx:25` `<Btn block>` 48, 600 16/20; "Keşfet'e dön" (bkz. 100 #2) |

Uyuyan: hero (disarida.webp 1080×480 ✓, `.hero` 250 yüksek, #EDE7D7 zemin, `object-fit:contain`, alta hizalı: `semt.ts:hero.short/paper`, `HeroBackdrop` 802–815), tarak, kapatma yuvarlağı, bar 56, `.txt margin-top:168` (`semt.ts:hero.textTopShort`), gövde 500 15/22, h1 metni.

---

## 102 Semte git · semtin bulunuyor — project/SemtKonum.dc.html
Kod: `app/(app)/district/locate.tsx`, `parts.tsx` (`FindRow` 1050, `Spin` 496, `WarnRow`).
Öğe sayısı: 10 · uyuyor: 5 · fark: 4 · fazla: 4 · doğrulanamadı: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Başlık "Semtini öğrenelim" | yazı | 700 32/38 | bkz. 100 #1 |
| 2 | Bekleme dönüşü | görünüm | `.spn` 20, SVG halka r 8.6 / 24, çizgi 2.6 (≈2.2 dp), tam halka %30 iz + çeyrek yay | `parts.tsx:496–529` `Spin`: `borderWidth 2`, üstü saydam tam halka (270° yay), iz yok |
| 3 | "Semtin bulunuyor" yazısı | yazı | `.fnd` 600 15/20 | `parts.tsx:1067` `T body strong` 15/22 (satır 22) |
| 4 | "Devam" düğmesi (pasif) | ölçü, yazı | `.btn.off.big` 56, 700 17/22 | `locate.tsx:176` `<Btn block disabled>` 48, 600 16/20 |
| 5 | Bulundu çipi "Semtin: X" | fazla | panoda yok (yalnız arama hâli çizili) | `locate.tsx:187–193` `Chip` ("found"); diğer hâllerin panosu yok |
| 6 | "Semtini seç" + aday çipleri | fazla | yok | `locate.tsx:196–226` |
| 7 | İzin kapalı / alınamadı uyarısı + "Ayarlara git", "Tekrar dene" düğmeleri | fazla | yok | `locate.tsx:228–232`, 140–158 |
| 8 | "Test: semti elle seç" bloğu (yalnız dev) | fazla | yok | `locate.tsx:233–265` |
| 9 | Hero resmi `0c0dc8…` | resim | 1080×480 PNG | `assets/riso/semt/konum.webp` 1080×480: boyut eşit, içerik DOĞRULANAMADI |

Uyuyan: hero kutusu (250, #EDE7D7, contain), tarak, kapatma, bar, gövde metni ("Konumun yalnızca hangi semtte olduğunu bulmak için alınır. Konumun saklanmaz, yalnızca semtin kaydedilir." ✓), halka rengi (#0E8745 / #3DDC84), satır aralığı 8 ve alt 8.

---

## 103 Ortak arkadaşlar listesi — project/OrtakArkadaslar.dc.html
Kod: EKRAN YOK. Bugünkü karşılık: `app/(app)/people/[publicId].tsx:284–330` (profil içinde tek kart, `tr.profile.mutualTitle(count)` "Ortak arkadaşlar · N"); `friends/mutual` yalnız `{ count, friends: [{publicId, displayName, photoUrl}] }` döner (`supabase/functions/_shared/pure/api/friends.ts:59`). Rota yok (`app/` altında).
Öğe sayısı: 18 · uyuyor: 0 · fark: 0 · fazla: 0 · doğrulanamadı: 0 · EKRAN YOK

Panonun öğe listesi (yukarıdan aşağı): 1 zemin; 2 geri yuvarlağı (`.round.soft` 44, `.tb2` 56 yüksek, margin-top -8); 3 başlık "Ortak arkadaşlar" (`.title` 600 21/27, -0.3px); 4 altyazı "Adem ile 2 ortak arkadaşınız var" (13/18 500 muted); 5–8 satır 1: yüz 48 (c2, "F"), ad "Fevve" 600 16/22, "21 Ekim'den beri" 13/18, düğme "Mesaj gönder" (`.btn.soft.mbt` 32 yüksek, min 112, iç 0 14, 600 13/16); 9–12 satır 2: "K" yüzü, "Kadir", "30 Ekim'den beri", "Mesaj gönder"; 13 `.fade` 150; 14–18 alt sekme çubuğu (Profil seçili).

| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Ortak arkadaşlar listesi ekranı | ekran yok | 5 sekmeli, geri + başlık + liste | rota yok; profildeki kart satır başına `Tap` ile o kişinin profilini açar (`[publicId].tsx:301`) |
| 2 | Satırdaki "21 Ekim'den beri" | özellik yok, KURAL 4 | arkadaşlık tarihi | `MutualFriend` tarih taşımıyor. Eklenirse kural 4'ün "friends/mutual: sayı, ad ve fotoğraf" cümlesi değişir: karar proje sahibinin |
| 3 | Satırdaki "Mesaj gönder" düğmesi | özellik yok, KURAL 4 | satır başına DM açma | `MutualFriend` `threadId` taşımıyor (`friends/mutual` yalnız publicId); DM açmak için görenin arkadaşı olan kişinin `threadId`si gerekir |
| 4 | "Adem ile 2 ortak arkadaşınız var" altyazısı | özellik yok | ad + sayı | `tr.profile` karşılığı yok (yalnız `mutualTitle(count)`); ek `inflectTr` ('with') gerekir |
| 5 | Başlık ağırlığı (ileride yazılacak ekran için) | yazı | `.title` 600 21/27 | kodun `pageBarTitle` 700 21/26 (auraKit.ts:197); bkz. 111 #3 |
| 6 | "Mesaj gönder" düğmesi boyu (Arkadaşlar satırında da aynı) | ölçü | `.mbt` 32 yüksek, min 112, iç 14, 600 13/16 | `friends.tsx:171` `Btn sm` 36 (KIT.size.btnSm), 600 14/18, iç 16 (Btn.padX) |

---

## 104 Mesajlar · 5 sabit dolu, Sabitle kapalı — project/MesajlarSabitDolu.dc.html
Kod: `app/(app)/(tabs)/messages/index.tsx`, `src/features/friends/InboxRows.tsx` (`useThreadMenu` 51, `InboxList`, `PinnedHead` 178, `ArchivedRow` 205, `InboxRow` 255), `src/theme/messages.ts`, `src/motion/Menu.tsx` (`MenuPop`, `MenuItem`), `src/components/SheetScrim.tsx`.
Öğe sayısı: 32 · uyuyor: 21 · fark: 6 · fazla: 1 · doğrulanamadı: 0 · özellik yok: 3 (üç menü satırı) + 1 (menüde Engelle)

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| s1 | Arama alanı (ORTAK-SEARCH) | boşluk | `.field.srch` 48, iç 0 20, zemin cam gradyanı | `components/Field.tsx:49` `paddingLeft: capsulePadX` 18 (auraKit.ts:900); yükseklik 48 ✓, zemin `Glass frost` ✓ |
| s2 | Sekme kapsülü (ORTAK-SEG) | renk | `.sg` zemin `--glass-bg` (beyaz .80→.54 gradyan) + `--glass-shadow` 0 18 44 | `activities.ts:tabsGlass` düz rgba(255,255,255,.60), gölge 0 10 30 .08, `messages.ts:34`; ölçüler 44/4/36 ✓ |
| s3 | Sohbet satırı: yüz harfi | yazı | `.rw .av` 48, yazı 17 | `KIT_TYPE.av.row` 18/22 (auraKit.ts, `Av size="row"`) |
| s4 | Sohbet satırı: son mesaj ucu | davranış | `.pv` uç 44 dp maske ile solar, "…" yok | `InboxRows.tsx:372` `T lines={1}` sonuna "…" koyar (CLAUDE.md önizlemede izin veriyor ama pano maskeli) |
| s5 | Basılı tutulan satırın kaldırılması | düzen | `.rw.ub`: z 30, zemin `--surface`, köşe 22, kenarlardan 12, iç 10/8, gölge 0 12 32 .16 (koyu #151A18 + 1px halka .08), scrim üstünde | `InboxRows.tsx:96–137`, `motion/Menu.tsx:273 MenuPop`: yalnız scrim + menü; satır scrim'in altında kalır (kaldırılmış kopya yok) |
| s6 | Scrim bulanıklığı | görünüm | `.ubs` blur(6px) + rgba(3,27,11,.30) / koyu .62 | `SheetScrim.tsx:25` düz renk ✓; bulanıklık `useLabScrimGlass` (varsayılan kapalı, `glass.ts SCRIM_GLASS`) |
| s7 | Menü satırı "Sabitle" (kapalı, notlu) | uyuyor? | `.pi.off` ikon %40, yazı muted, not 500 12/16 "En fazla 5 sohbet sabitlenir. Önce birini kaldır." | `InboxRows.tsx:120–127` `disabled` + `note=tr.messages.pinFull(5)` ✓ metin birebir (`tr.ts:363`) |
| s8 | Menü satırı "Sessize al" | özellik yok | var (ikon + yazı) | yok: DM sessize alma sunucuda yok (`davranis-eksikleri.md` F: karar verilmedi) |
| s9 | Menü satırı "Profilini gör" (ÖNERİ) | özellik yok | var, `ÖNERİ` rozeti | yok (`davranis-eksikleri.md`: "uygulanabilir", alınmadı) |
| s10 | Menü satırı "Engelle" (kırmızı, ayırıcı altında) | eksik | var | `useThreadMenu` menüsünde yok (Engelle yalnız DM açık menüsünde `[threadId].tsx:~600`) |
| s11 | Menü satırı "Sohbeti sil" (ÖNERİ) | uyuyor | kırmızı, ayırıcı altında | `InboxRows.tsx:130–136` ✓ (rozet elbette yok) |
| s12 | Menü satırı sırası | sıra | Sabitle, Sessize al, Arşivle, Profilini gör | `InboxRows.tsx:115–130` Sabitle, Arşivle (öteki ikisi yok) |
| s13 | Satırda "yazıyor" | fazla | yok | `InboxRows.tsx:343–366` `TypingOr` (bilinen, 5.4) |

Uyuyan: başlık "Mesajlar" (500 32/42), yeni mesaj yuvarlağı (44), zil (44, nokta 9, üst 9 sağ 10, halka 2), "Sohbet ara", "Sohbetler" / "İstekler" + rozet 3, "Sabitlenenler · 5/5" (ikon 16, 12/600, .24 harf), 5 sabit satır (adlar, saatler, önizlemeler, okundu tiki 18), liste negatif kenar -20, satır dolgusu 10/20, yüz halkası 2, gap 12, min 72, ad 600 16/22, saat 13/18, okunmamış satır (saat accent 700, önizleme 600 ink, rozet), "Arşivlenenler" satırı (48, 16 iç, 12 aralık, sayı 13/600, ok 18), menü genişliği 268, köşe 24, iç 6, satır 44, ikon 20, gap 14, ayırıcı 6 bant, scrim rengi, alt sekme çubuğu (ORTAK-TAB).

---

## 105 Mesajlar · arşivde okunmamış — project/MesajlarArsivRozet.dc.html
Kod: `InboxRows.tsx:205–250 ArchivedRow`, `messages/index.tsx`, `src/lib/dmManage.ts → splitInbox`.
Öğe sayısı: 24 · uyuyor: 18 · fark: 4 · fazla: 1 · doğrulanamadı: 0 · özellik yok: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Arşivlenenler" yazısı (okunmamışken) | yazı | `.arl` 700 15/22 | `InboxRows.tsx:228` `KIT_TYPE.bold` 800 (hold row 15/20); 800 ≠ 700, satır 20 ≠ 22 |
| 2 | "Furkan" satırı sessiz ikonu (`.mu` 16) | özellik yok | ad yanında kilit/zil-çizgili ikon, `aria-label="Sessizde"` | DM sessize alma yok (bkz. 104 s8); `InboxRow` böyle ikon çizmiyor |
| 3 | Satır önizleme ucu | davranış | maske | bkz. 104 s4 |
| 4 | Yüz harfi | yazı | 17 | bkz. 104 s3 |
| 5 | Arama alanı ve sekme kapsülü | ölçü, renk | | bkz. 104 s1, s2 |
| 6 | "yazıyor" | fazla | yok | bkz. 104 s13 |

Uyuyan: rozet `.cnt` (min 20, 700 11/20, buzz + on-buzz; `kit.tsx:701 Badge` 700 11/14), sıra (etiket, sayı rozeti, sayı, ok), "Henüz mesaj yok" italik, "Per"/"Pzt" saat metinleri (`tr.messages.stamp`), "Sabitlenenler" başlığı (sayısız), tek sabit satır, Fevve satırı (okunmamış, rozet 2), alt sekme çubuğu.

---

## 106 Mesajlar · sohbet silindikten sonra — project/MesajlarSilindi.dc.html
Kod: `messages/index.tsx:59–60, 154` (`Toast`), `src/components/Toast.tsx`, `InboxRows.tsx:79–95 askClear`.
Öğe sayısı: 22 · uyuyor: 17 · fark: 4 · fazla: 1 · doğrulanamadı: 0 · özellik yok: 1 (Furkan sessiz ikonu)

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Sohbet silindi" bildirimi: yeri | düzen | `.snk` altta ortalı, `bottom:106`, içeriğe göre genişlik | `Toast.tsx:44` `top = TOAST_TOP` 63.5; `messages/index.tsx:154` üstte (alt seçeneği `bottom` var ama verilmiyor; MasaIstekBekliyor'da kullanılıyor) |
| 2 | Bildirim biçimi | ölçü | yükseklik 44, iç 0 18, köşe 999, tek satır 600 14/18, gölge 0 12 30 .3 | `Toast.tsx:104–115` kenarlardan 20, köşe 20, dikey iç 12 (≈43), sol iç 14, başlık 14/19; kapsül değil |
| 3 | Bildirim rengi (koyu) | koyu | koyu: beyaz zemin #fff, yazı #031B0B | `KIT.layer.dark.toast` #FFFFFF ✓ (uyuyor) |
| 4 | Furkan sessiz ikonu | özellik yok | var | bkz. 105 #2 |
| 5 | Silinen satırın listede olmaması | davranış | satır yok | `InboxRows.tsx:51–58 MOVES.clear = 'leave'` ✓ UYUYOR |
| 6 | "yazıyor" | fazla | yok | bkz. 104 s13 |

Uyuyan: başlık/yuvarlaklar/arama/sekme (ORTAK ölçüler hariç bkz. 104), "Sabitlenenler" + Adem satırı, 3 satır (Furkan, S2c!56 "Henüz mesaj yok", Kadir), Arşivlenenler (12), alt sekme çubuğu, metin "Sohbet silindi" (`tr.messages.cleared` ✓).

---

## 107 DM · 15 dakika geçmiş kendi mesajı — project/DmMenuSureDoldu.dc.html
Kod: `app/(app)/(tabs)/messages/[threadId].tsx` (üst bar 537–572, `ServerBubble` 762–836), `src/components/ChatBubble.tsx`, `MessagePop.tsx`, `src/motion/Menu.tsx` (`MenuNote` 172), `Composer.tsx`, `theme/dm.ts`.
Öğe sayısı: 38 · uyuyor: 24 · fark: 8 · fazla: 1 · doğrulanamadı: 3 · özellik yok: 4

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst bar "Sohbette ara" düğmesi | özellik yok | `.ib` 40×44, arama ikonu, kapsülün içinde "Diğer"in solunda | `[threadId].tsx:558–571` yalnız "Diğer" (`Round moreV`); DM içi arama yok. Bilinen |
| 2 | Basılı mesajın menüsü: genişlik | ölçü | `.hold .pop` 220 | `motion/Menu.tsx:93 float` `L.holdWidth` 268 (auraKit.ts:1275) |
| 3 | Menü satırları | uyuyor | Yanıtla, Kopyala, ayırıcı, Sil | `ChatBubble.tsx:624–639` Yanıtla, Kopyala, Sil ✓; "Düzenle" yok çünkü `canEdit` false ✓ |
| 4 | Menü notu | uyuyor | "Mesajın 15 dakika içinde düzenlenebilir." 500 12/16, üst 4, iç 8/12/6, üstte çizgi | `MenuNote` + `tr.dm.editWindowNote` ✓ |
| 5 | Tepki çubuğu: yuva boyu | ölçü | `.rbar .f` 40×40, yüz 36, çubuk dolgu 4, aralık 2 | `MessagePop.tsx:177` yuva genişliği `SPACING[10]+SPACING[0.5]` = 42, yükseklik 40 (dolgu 4 ✓, aralık 2 ✓) |
| 6 | Tepki çubuğu: seçili yuva | görünüm | `.f.sel` zemin `--surface2` + 2px iç halka `--text` (koyu #262E2B + #EEF3F0) | `MessagePop.tsx:182` yalnız `colors.surface2` (halka yok, koyu #1B211F) |
| 7 | Tepki çubuğu gölgesi | renk, koyu | `0 12 32 rgba(3,27,11,.18)`; koyuda 1px halka .08 | `MessagePop.tsx:98` `shape.shadow.sheet` (tokens `0 8 22 .13`); koyuda gölge yok |
| 8 | Alan: yazı ve simgeler | özellik yok | "Mesaj yaz", sağda dosya, kamera, ses düğmeleri (40'lık, 3 adet) | `Composer.tsx` yalnız metin alanı; dosya/kamera/ses yok. Bilinen (ÖNERİ'ler 120/121 alınmadı) |
| 9 | Alan: placeholder metni | metin | "Mesaj yaz" | `tr.dm.placeholder` "Mesaj yaz…" (üç nokta karakteri) |
| 10 | Alan: emoji düğmesi | özellik yok | var | yok (bkz. 99 #11) |
| 11 | "2 yeni mesaj" çizgisi | metin | "2 yeni mesaj" | "Okunmamış mesajlar" (bkz. 99 #3) |
| 12 | Üst bant | renk | `.band` #D9E8F7 → saydam (koyu #000) | `WallBand` duvar şeridi (bkz. 99 #13) |
| 13 | "yazıyor" balonu | uyuyor | 34 yüksek, 14 iç, 8 nokta, 5 aralık, renkler #FF4F8B/#FFB547/#7DB2FF | `dm.ts:typing` + `typingDots` ✓ |
| 14 | Duvar blob'ları (`564f…`, `e7ec…`) | resim | 1290×2796 | `assets/riso/wall-dm-light/dark.webp` 1290×2796: içerik DOĞRULANAMADI |
| 15 | Yüz harfi "F" (c2) ve gönderen yüz resmi | resim | | gerçek foto: DOĞRULANAMADI |
| 16 | Scrim | uyuyor | `.ubs` rgba(3,27,11,.30)/.62 | `SheetScrim hold` ✓ (bulanıklık bkz. 104 s6) |
| 17 | Menü yerleşimi | düzen | mesajın altına 8; sağa hizalı | `MessagePop.tsx:119` `gap` 8; sağa hizalama ✓ |
| 18 | Gönder düğmesi | davranış | alan boşken yok | `Composer.tsx:350` boşken gizli ✓ UYUYOR |
| 19 | Mesaj tepki hapları | uyuyor | `.rx` 30 yüksek, iç 4/10, yüz 22 | `dm.ts:reactions` ✓ |

Uyuyan: üst kapsül (52, yüz 40 halka 2, ad 16/20 600, "Profili gör" 12/16), geri yuvarlağı, daha fazla düğmesi (44), gün hapları ("Dün", "Bugün"), balon renkleri ve köşeler (18/6), alıntı bloğu (`.q`), zaman damgası ve okundu tiki, "Sen" etiketi, tepki yüzleri.

---

## 108 DM · düzenlerken klavye açık — project/DmDuzenleKlavye.dc.html
Kod: `Composer.tsx` (`DraftComposer` 730, `EditStrip` 809, `DmStrip`, `SendIn` 562), `[threadId].tsx` (düzenleme), `theme/dm.ts:strip/editing`.
Öğe sayısı: 28 · uyuyor: 22 · fark: 2 · fazla: 0 · doğrulanamadı: 2 · özellik yok: 2

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Sohbette ara" üst düğmesi | özellik yok | var | bkz. 107 #1 |
| 2 | Alanın solundaki emoji düğmesi | özellik yok | var | bkz. 99 #11 |
| 3 | Üst bant | renk | `.band` #D9E8F7 solan, koyu #000 | bkz. 99 #13 |
| 4 | Duvar blob'ları | resim | 1290×2796 | bkz. 107 #14 (DOĞRULANAMADI) |
| 5 | Klavye çizimi | — | 292 yüksek örnek klavye | sistem klavyesi, kodla karşılaştırılmaz (DOĞRULANAMADI) |
| 6 | Alan placeholder'ı ve düzenleme alanı metni | uyuyor | değer "Vampir masası 9'da kuruluyor" + imleç | örnek veri |

Uyuyan: düzenleme şeridi (`.eb`: köşe 20, iç 8/6/8/14, aralık 10, ikon 20, başlık 700 13/17 "Mesajı düzenle", metin 500 13/17 tek satır "…", × 36 ikon 18 = `dm.ts:strip` ✓ ve `tr.dm.editing` ✓), düzenlenen balonun 2px dış çizgisi (`DM.editing` outline 2, offset 2 ✓), gönder düğmesi 52 ink + tik 22 / 18 (dm.ts:composer, `SendIn confirm` ✓), alan 52 / kapsül (cam ✓), düzenlendi etiketi yok ✓, tepki hapları, gün hapları, balonlar, üst kapsül.

---

## 109 Mesajlar · boş — project/MesajlarBos.dc.html
Kod: `messages/index.tsx:276–288` (boş), `src/components/EmptyState.tsx` (`Empty` 252, `StateWords` 189, `RISO_BOARD` 78), `assets/riso/empty-messages.webp` (360×294).
Öğe sayısı: 14 · uyuyor: 9 · fark: 3 · fazla: 0 · doğrulanamadı: 2

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| e1 | Açıklama genişliği (ORTAK-EMPTY) | ölçü | `.ed` max-width 240 | `auraKit.ts:946 emptyNoteMax` 260 |
| e2 | Boş blok dikey yeri | düzen | `.emp` flex:1 ortası, `padding-bottom:190` ile yukarı kayık; üst boşluk yok | `EmptyState.tsx:262` `paddingTop emptyTopSm` 18, alt dolgu yok, `flex-1 justify-center` (`index.tsx:276`): pano ortası ~95 dp yukarıda; DOĞRULANAMADI (alt sekme payı Screen'e göre değişir, telefonda bakılmalı) |
| e3 | Resim `edd857…` | resim | 640×520 PNG, 120×98 çizim | `empty-messages.webp` 360×294 (oran .817 / .8125), çizim 120×98 ✓ (`EmptyState.tsx:78`); içerik DOĞRULANAMADI |
| e4 | Sekme "İstekler" rozetsiz | uyuyor | | rozet yalnız sayı >0 |

Uyuyan: başlık, yuvarlaklar (zil noktası yok ✓ `badge` yok), arama alanı (bkz. 104 s1/s2), sekme kapsülü, "Henüz mesajın yok." (600 15/20, üst 12 ✓ `kit stateTitle` + `emptyTitleTop`), "Arkadaş olduğun kişilerle burada yazışırsın." (13/18 500 muted ✓), alt sekme çubuğu.

---

## 110 Bildirimler · boş — project/BildirimlerBos.dc.html
Kod: `app/(app)/notifications.tsx` (96–140 boş hâl), `src/components/RouteSheet.tsx`, `SheetCard.tsx`, `aura/Peek.tsx` (`RisoPeek` 80–150), `theme/messages.ts:32 peek`, `theme/flatLists.ts:sheetEmpty`, `EmptyState.tsx`.
Öğe sayısı: 24 · uyuyor: 11 · fark: 9 · fazla: 2 · doğrulanamadı: 2

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Zemin sayfası (Mesajlar listesi, bulanık) | düzen | altta gerçek sayfa görünür | rota olarak üstüne açılır ✓ (RouteSheet şeffaf) UYUYOR; ayrı satır yok |
| 2 | Scrim | renk, görünüm | `.scrim` rgba(3,27,11,.20) (koyu .45) + blur(8px) | `SheetScrim.tsx:25` `layer.scrim` .42 / .70, bulanıklık yok (A.8 kararı, düz) |
| 3 | Durum çubuğu üstü | fazla | yok | `RouteSheet.tsx:104 StatusScrim` koyu fade ve açık ikonlar |
| 4 | Sayfa yüzeyi | renk | `.sheet.glass.nsh` cam gradyanı (beyaz .80→.54) + blur 24 (koyu #121614) | `notifications.tsx:93–98` `KIT.layer.light.sheet` düz #FFFFFF (koyu #121614); cam kapalı kararı (`cam-kapali.md`) |
| 5 | Sayfa üst boşluğu | boşluk | `padding-top:12` | `SheetCard.tsx:114` `sheetPadTop` 10 (auraKit.ts:1042) |
| 6 | Tutamaç | ölçü | `.grab` 40×4, `--control` | `auraKit.ts:1054 grabH` 5, `layer.sheetGrab` rgba(3,27,11,.18) (açık), #2A332F (koyu) |
| 7 | Başlık satırı | boşluk | tutamaçtan 12 sonra "Bildirimler" `.title` 600 21/27 | `SheetCard.tsx:143` `headTop` 10 (`sheetHeadGap`), başlık satırı min yükseklik 44 (`sheetClose`) |
| 8 | Kapat düğmesi | fazla | yok | `SheetCard.tsx:80,155` `closeButton = true` varsayılan: sağda "Kapat" yuvarlağı (RouteSheet `closeButton` verilmiyor) |
| 9 | Boş durum resmi | ölçü, resim | 120×98, `47c650…` (640×520) | `EmptyState.tsx:72` RISO_SMALL 120×83 (asset 640×440 `empty-notifications.webp`, oran .6875, farklı resim); 640×520 blob depoda yok |
| 10 | Boş blok iç boşluğu | boşluk | `.nsh .emp` 28 24 40 | `flatLists.ts:sheetEmpty` üst 28, alt 40 ✓; yan 24 ✓ (`emptyPad`) |
| 11 | Başlık "Henüz bildirim yok" | uyuyor | 600 15/20, üst 12 | `tr.notifications.empty` ✓ |
| 12 | Açıklama | uyuyor | max 260 (bu panoda) | `emptyNoteMax` 260 ✓, metin ✓ |
| 13 | Kanki 1 (sol) | ölçü | 64×80, sol 44, alt 356 (sayfanın üstünde durur) | `messages.ts:32` 56×70, sol 40, `up` 62: yukarı çıkma payı |
| 14 | Kanki 2 (sağ, aynalı) | ölçü | 64×80, sağ 52, `scaleX(-1)` | `messages.ts:32` 56×70, sağ 44; `peek-2.webp` ayrı resim (aynalama yok); iki resim 160×200 ✓ |
| 15 | Kankilerin yeri | düzen | sayfa üstünden ~27 yukarıda (alt:356, sayfa üstü ≈ 329 hesaplı, DOĞRULANAMADI) | `RisoPeek`: sayfa kenarına 62 binen, 40 aşağıdan yükselen |
| 16 | "Tümünü okundu say" | uyuyor | boşta yok | `notifications.tsx:150` yalnız yeni satır varken ✓ |

Uyuyan: sayfa kenarlardan 8 (`sheetInset` 8), iç yan 20 (`sheetPadX`), alt 28 (`FLAT.sheet.padBottom`), köşe 28, başlık yazısı (`KIT_TYPE.title` 600 21/27, -0.3px), alt sekme çubuğu gizli (scrim altında).

---

## 111 Arkadaşlar · boş — project/ArkadaslarBos.dc.html
Kod: `app/(app)/(tabs)/profile/friends.tsx` (`FriendsScreen` 38–), `FLAT.bar`, `EmptyState` (riso="friends", compact), `BarBack`.
Öğe sayısı: 13 · uyuyor: 6 · fark: 6 · fazla: 0 · doğrulanamadı: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Peek kankisi (arama alanı yerinde) | eksik | `.sw .pk` 204×116 PNG (`b0c6d6…` 900×510), sağ üstte, alan olmadan | `friends.tsx:72` boşken alan da peek de çizilmiyor; `assets/riso/peek-explore.webp` 600×340 (oran 1.76 ✓) var ama Arkadaşlar'da kullanılmıyor. Bilinen (pano-kod-denetimi 16) |
| 2 | Başlık "Arkadaşlar" | yazı | `.title` 600 21/27 | `friends.tsx:63` `pageBarTitle` 700 21/26 (auraKit.ts:197) |
| 3 | Boş durum resmi | resim, ölçü | `a43565…` 640×520, 120×98 | `empty-friends.webp` 640×440 (oran .6875), `RISO_SMALL` 120×83 (`EmptyState.tsx:72`, `RISO_BOARD`'da `friends` yok): farklı resim ve 15 dp kısa |
| 4 | Açıklama genişliği | ölçü | max 240 | `emptyNoteMax` 260 (bkz. 109 e1) |
| 5 | Boş blok dikey yeri | düzen | `.emp` ortası, `padding-bottom:150` | bkz. 109 e2; ayrıca `friends.tsx:104` yüklenmiş boş için `compact` üst 18 |
| 6 | Açıklama metni | uyuyor | "Birlikte oynadığın masaları Bildirimler'de bulabilirsin." (düz ') | ✓ `tr.friends.emptyHint` |
| 7 | Resim `a43565…` içerik | resim | | DOĞRULANAMADI (blob depoda yok) |

Uyuyan: geri yuvarlağı (44, `BarBack`), `.tb2` 56 yüksek (`FLAT.bar.row`), gap 12, başlık altı alt başlık yok ✓ (`friendsSub` yalnız dolu listede), başlık metni, "Henüz arkadaşın yok", alt sekme çubuğu (Profil seçili).

---

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 99 | 31 | 11 (+1 fazla, 2 doğrulanamadı) | evet |
| 100 | 10 | 3 | evet |
| 101 | 8 | 3 | evet |
| 102 | 10 | 4 (+4 fazla, 1 doğrulanamadı) | evet |
| 103 | 18 | EKRAN YOK (+3 özellik yok/kural) | evet |
| 104 | 32 | 6 (+4 özellik yok/eksik, 1 fazla) | evet |
| 105 | 24 | 4 (+1 özellik yok) | evet |
| 106 | 22 | 4 (+1 özellik yok) | evet |
| 107 | 38 | 8 (+4 özellik yok, 3 doğrulanamadı) | evet |
| 108 | 28 | 2 (+2 özellik yok, 2 doğrulanamadı) | evet |
| 109 | 14 | 3 (2 doğrulanamadı) | evet |
| 110 | 24 | 9 (+2 fazla, 2 doğrulanamadı) | evet |
| 111 | 13 | 6 (1 doğrulanamadı) | evet |
