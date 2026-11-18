# Pano–kod denetimi, grup 06 (pano 38–50)

Not: Ortak parça farkları ilk panoda tam yazıldı. Resimler (blob) dosya adı ve boyutla eşleşmedi, piksel karşılaştırması yapılmadı: DOĞRULANAMADI olarak her panoda tek satır. "Bilinçli" notu olan satırlar kodda yorumla yazılmış bir karardır (kit boyu, K-88 sözcüğü, yüz yüksekliği); yönerge gereği pano geçerli sayılıp yine bulgu yazıldı, karar proje sahibinindir.
Genel ortak farklar (her ekranda): (a) 4 dp tutamak ve renk: aşağıda 38 #9-#12; (b) düğme yükü: pano `.tb2 .btn` 40, `.btn.sm` 36 (skall.css), kod btnSm 36; (c) başlık satır yüksekliği `.kh` 38, kod 41 (signup.ts:104, "yüzün kendi yüksekliği" notu).

## 38 Masadan at onayı — MasaAt.dc.html
Kod: apps/mobile/app/(app)/room/[id].tsx; src/features/rooms/TableScene.tsx, RoomPeople.tsx (PeopleSheet), PosterCard.tsx; src/motion/Sheet.tsx, src/components/SheetCard.tsx, src/motion/Dialog.tsx; src/theme/room.ts
Öğe sayısı: 47 (üst çubuk 4, kart 6, oyunlar başlık 2 + 6 kart × 2, scrim, tutamak, başlık, alt başlık, 12 kişi satırı, not, ikinci scrim, diyalog yüzü/başlık/metin/2 düğme) · uyuyor: 31 · fark: 16 · fazla: 2 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Çubuktaki alt satır | metin | "12/12 · Lobide" | "12/12 · Lobide açık" (tr.ts:2294 `lobbyOpen`; [id].tsx:431) |
| 2 | Lobiden çek / Davet et | ölçü | 40 yüksek (`.tb2 .btn`) | 36 (KIT.size.btnSm, auraKit.ts; room.ts:3-4 bilinçli) |
| 3 | Oyun kartı köşe rozeti | düzen | 52×42 beyaz hap, ortada oynat ikonu (20), sol-üst 4,4; metin yok (`.pl`) | Metin etiketi "Yakında/Aç/Oyla/N+ kişi" Tag, tagX/tagY (PosterCard.tsx:121-128) |
| 4 | Oyun kartı görseli | resim | 104%×104%, margin −2% (hafif yakınlaştırılmış) | %100 cover (PosterCard.tsx:109-117); ayrıca pano 462×334 webp, kod g-*.webp 616×448: aynı çizim mi DOĞRULANAMADI |
| 5 | Alt sis bandı | fazla | `.fade{display:none!important}` (yok) | AuraBand çiziliyor ([id].tsx:668-673) |
| 6 | Yüz satırı ilk/son konum | ölçü | ilk yüz x=0, son yüz x=W−24 (ring gölge, yer kaplamaz) | ilk 2, son W−2−24; halka yer ayırıyor (TableScene.tsx:190-193,221) |
| 7 | Alt sayfa iç boşluk | boşluk | 10 üst / 16 yan / 34 alt (`.msh`) | yan 20 (KIT.size.sheetPadX), alt max(4+inset,24) (SheetCard.tsx:56-59,121) |
| 8 | Tutamak | ölçü | 40×4, #C6E0CC (koyu #2A332F) | 40×5 (KIT.layer.size.grabH 5); rgba(3,27,11,.18) / koyu rgba(255,255,255,.22) (auraKit.ts layer.sheetGrab) |
| 9 | Başlık yanında kapat (X) | fazla | yok (kapatma: scrim, tutamak) | 38 Round "sheet-close" (SheetCard.tsx:76-86) |
| 10 | Tutamak–başlık aralığı | boşluk | 16 (`.sh-t2` margin) | head marginTop 10 + satır minHeight 38 (SheetCard.tsx:150-160) |
| 11 | "At" düğmesi | ölçü | 28 yüksek, iç 9, 13/16 700, danger-soft (`.atb`) | Btn sm danger 36, 14/18 600 (RoomPeople.tsx:163-171) |
| 12 | "At" sözcüğü ve aria | metin | "At", "X kişisini masadan at" | "Çıkar", "…masadan çıkar" (tr.ts:2397-2398; K-88 bilinçli) |
| 13 | Diyalog başlığı | metin | "terra-sd62 masadan atılsın mı?" | "… masadan çıkarılsın mı?" (tr.ts:2399) |
| 14 | Diyalog düğmesi | metin | "Masadan at" | "Masadan çıkar" (tr.ts:2401) |
| 15 | Diyalog başlık yazısı | yazı | 20/26 700 −.3 (`.dt`) | 21/26 (KIT_TYPE.pageBarTitle, Dialog.tsx:149) |
| 16 | Diyalog dikey yeri | düzen | top:250 sabit | dikey ortalı (Dialog.tsx styles.root) |
| 17 | "Vazgeç" | düzen | `.ghost`: dolgusuz, çizgisiz yazı | variant="glassy" yumuşak hap (Dialog.tsx:~205); Btn'de `ghost` var |
| 18 | Alt sayfa diyalog altında | davranış | sayfa açık kalır, iki scrim üst üste | tek katman: diyalog açılınca sayfa kapanır (overlayStore openOverlay; CLAUDE.md "aynı anda yalnızca biri") |
| 19 | "Sen" satırı ilk sırada | düzen | ilk hücre "Sen · Masa sahibi" | sıralama yok, `table_people` RPC sırası (RoomPeople.tsx:95-99; queries.ts:198) DOĞRULANAMADI |
| 20 | Harf yüzü rengi ("G") | renk | sabit #E2456F, beyaz harf | addan türeyen 5 renk (KIT.avColors, auraKit.ts:~avColors; #E2456F yok) |
Diğer (uyuyor): çubuk (geri 44, pill 52/18 iç, 16/20 700 + 12/16 500, sohbet, ⋮), kart (radius 28, iç 8/12, resim 136/22), yüz satırı 24, "Masa dolu…" notu, Oyunlar 18/24 + "7 oyun" 13/18, kişi satırı 32 yüz, 13/17 600, "Masa sahibi" 11/14 yeşil, iki sütun 10, çizgi 40, not 12/16, scrim .42/.7, diyalog 28 kenar/28 köşe/24-20-20, yüz 64, danger düğme + ikon, açık ve koyu renkler (layer).

## 39 Oyun lobisi, bekleniyor, başlat pasif — OyunLobi.dc.html
Kod: src/features/games/GameLobby.tsx; vampir/VampirGame.tsx:148-232 (Pregame); theme/lobby.ts; tr.vampir, tr.games
Öğe sayısı: 36 (kapat, poster, ad, aralık, sohbet, 2 çip, başlık, hazır hapı, 12 satır (yüz, rozet, ad, etiket, ⋮), Gözlemciler satırı, Nasıl oynanır satırı, not, düğme) · uyuyor: 20 · fark: 11 · fazla: 1 · doğrulanamadı: 2 · özellik yok: 5
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Kapat düğmesi aria | metin | "Lobiden çık" | "Sayfayı kapat" / "Masaya dön" (tr.ts:1445, 1563; VampirGame.tsx:199) |
| 2 | Hazır sayacı `.hp` | özellik yok | "Oyuncular" yanında 30 yüksek hap: 20 halka ilerleme + "10/12 hazır" (tam: yeşil dolgu) | "N kişi" düz yazı (GameLobby.tsx:256; tr.games.count) · sunucuda lobi hazır durumu yok (supabase'te `ready` yalnız oyun içi) |
| 3 | Kişi hazır rozeti `.rd` | özellik yok | yüzün sağ-altında 16 yuvarlak onay (−3) | yok (LobbyPeople, GameLobby.tsx:285-359) |
| 4 | "Bekleniyor" satır altı `.wt` | özellik yok | 11/14 500 muted | yok |
| 5 | Kişi satırı ⋮ (`.km`) | özellik yok | 32 düğme, sahipte her satırda (menü: bkz 43) | yok |
| 6 | Yüz boyu | ölçü | 36 (`.pav`) | 32: Face size="sm" = KIT.size.av.sm (VampirGame.tsx:187); LOBBY.people.face 36 yalnız çizgi hesabında |
| 7 | Harf yüzü | renk | #E2456F | bkz 38 #20 |
| 8 | Gözlemciler alt satırı | metin | "İzler, puan almaz · 0 kişi" | "İzler, puan almaz." (tr.ts:1436) |
| 9 | Nasıl oynanır alt satırı | metin | "Roller, gece ve gündüz, kazanma" | ~420 karakterlik kural paragrafı (tr.vampir.how, tr.ts:1440; GameLobby.tsx:574) |
| 10 | Nasıl oynanır sağ ok | eksik | chevron 18, basılabilir satır | ok yok, satır basılmıyor (LobbyRow `right` verilmiyor) |
| 11 | Alt not | metin | "2 kişi bekleniyor. Herkes hazır olunca başlatabilirsin." (muted 13/18, ikonsuz) | uyarı "En az 5 oyuncu gerekir." amber + uyarı ikonu 16 (tr.ts:1443; GameLobby.tsx:182-198) |
| 12 | Oyunu başlat ikonu | ikon | oynat ikonu 20 (pasifte de görünür, `.lf .btn svg`) | ikon yok (GameLobby.tsx:209-217) |
| 13 | Alt boşluk | düzen | 34 alt (`.lf`) | insets.bottom + 16 (GameLobby.tsx:173) DOĞRULANAMADI (aygıta bağlı) |
| 14 | Poster resmi | resim | blob a28d68 (png 230×148) | assets/vampir/poster.webp (roleArt.ts:18) DOĞRULANAMADI |
| 15 | Hata satırı | fazla | yok | `error` satırı (GameLobby.tsx:177-181; pano hata hâli çizmiyor) |
Uyuyor: başlık çubuğu (44 düğme, poster 84×54/14, ad 21/26 700, "5–12 kişi" 13/18), çipler (26, iç 10, 6), bölüm başlığı 18/24 üst 22 alt 4, iki sütun 12, satır min 46, yüz–ad 8, çizgi 46, satır 14/18 600, "Sen/Masa sahibi", Gözlemciler satırı (disk 40/ikon 20, 16/20 600, "Gözlemci ol" 36), düğme 56, koyu renkler.

## 40 Oyun lobisi, herkes hazır — OyunLobiHazir.dc.html
Kod: aynı (GameLobby.tsx, VampirGame.tsx)
Öğe sayısı: 37 · uyuyor: 21 · fark: 4 · özellik yok: 3 · doğrulanamadı: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Hazır hapı, tam | özellik yok | success-soft dolgu, tam halka, "12/12 hazır" (koyu rgba(61,220,132,.14)/#93EBB9) | yok; bkz 39 #2 |
| 2 | 12 kişinin hazır rozeti | özellik yok | tüm satırlarda `.rd` | yok; bkz 39 #3 |
| 3 | Alt not | metin | "Herkes hazır." | "Herkes hazırsa oyunu başlat." (tr.ts:1441, GameLobby.tsx:203-207) |
| 4 | Oyunu başlat ikonu | ikon | oynat 20 | yok; bkz 39 #12 |
| 5 | Kişi başı ⋮, yüz 36, harf rengi, Gözlemciler/Nasıl oynanır metinleri | tekrar | bkz 39 #5 #6 #7 #8 #9 #10 | aynı |

## 41 Oyun lobisi, katılımcı, hazır değil — OyunLobiKatilimci.dc.html
Kod: aynı
Öğe sayısı: 34 · uyuyor: 21 · fark: 6 · özellik yok: 4 · doğrulanamadı: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Hazır hapı "9/12 hazır" | özellik yok | var | yok; bkz 39 #2 |
| 2 | "Sen · Bekleniyor", rozetler | özellik yok | var | yok |
| 3 | Alt not | metin | "Hazır olunca bas. Oyunu masa sahibi başlatır." | "Oyunu masa sahibi başlatır." (tr.games.hintGuest, tr.ts:1287) |
| 4 | "Hazırım" düğmesi | özellik yok | birincil 56, ikonlu; katılımcıda da altta | katılımcıda düğme yok (GameLobby.tsx:208-218 `owner` değilse yok); lobi hazır ucu yok |
| 5 | Katılımcıda ⋮ yok | uyuyor | yok | yok |
| 6 | Masa sahibi etiketi | uyuyor | luna-zh78 altında | owner bayrağı ile (GameLobby.tsx:344) |
| 7 | Yüz 36, harf rengi, Gözlemciler/Nasıl oynanır alt satırı ve ok | tekrar | bkz 39 #6-#10 | aynı |

## 42 Oyun lobisi, katılımcı, hazır — OyunLobiKatilimciHazir.dc.html
Kod: aynı
Öğe sayısı: 34 · uyuyor: 21 · fark: 5 · özellik yok: 4 · doğrulanamadı: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Alt not | metin | "**Hazırsın.** 2 kişi bekleniyor, sonra masa sahibi başlatır." ("Hazırsın." 600 ink, kalan muted) | "Oyunu masa sahibi başlatır." |
| 2 | "Hazır değilim" düğmesi + ÖNERİ rozeti | özellik yok | yumuşak 48 (koyu #1B211F), rozet 10/14 700 accent/surface2, 7 iç | yok. Panoda "ÖNERİ" yazıyor; lobi hazır ucu yok |
| 3 | Hazır hapı 10/12, "Sen" hazır rozeti | özellik yok | var | yok |
| 4 | Düğme yüksekliği | ölçü | `.lf .btn` 56 | (yok) |
| 5 | Diğer | tekrar | bkz 39 #6-#10 | aynı |

## 43 Oyun lobisi, kişi menüsü (masa sahibi) — OyunLobiKisiMenu.dc.html
Kod: yok (GameLobby.tsx'te kişi menüsü yok); ilgili Menu src/components/Menu.tsx, tr.table, api.ts:272,280
Öğe sayısı: 39 (lobi 36 + menü: başlık yüz+ad, 2 satır, ayrıcı) · uyuyor: 20 · fark: 3 · özellik yok: 5 · ekran yok: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Kişi menüsü (açılır) | EKRAN YOK | `.pop.kp`: 248 geniş, sağ 16, üst 296, 28 köşe, iç 8; başlık: yüz 28 + ad 15/20 700 | lobide açılır menü yok |
| 2 | "Gözlemciye al" (alt: "Oynamaz, yalnızca izler") | özellik yok | menü satırı, 48 yük., ikon 22 | sunucuda `rooms/pick` yalnız çağıranın kendi seçimi (api.ts:272; supabase/functions/rooms/index.ts:116); sahibin başkasını gözlemciye alması yok |
| 3 | "Masadan at" (danger) | özellik yok (lobide) | menü satırı | `roomsApi.remove` var (api.ts:280, RoomPeople.tsx) ama lobi UI'ında yok; sözcük "Masadan çıkar" (tr.ts:2401, K-88) |
| 4 | ⋮ etkin hâli | eksik | `.km.act`: 32 yuvarlak, rgba(3,27,11,.08) / koyu rgba(255,255,255,.12) | yok |
| 5 | Menü genişliği | ölçü | 248 | kitte menuWidth 292 (auraKit.ts layer.size.menuWidth) |
| 6 | Alt sayfa/dialog ve satır özellikleri | tekrar | bkz 39 | aynı |
Not: pano 43'te alt not "2 kişi bekleniyor…" menü açıkken görünüyor (bkz 39 #11).

## 44 Oyun lobisi, gözlemciler var (masa sahibi) — OyunLobiGozlemci.dc.html
Kod: GameLobby.tsx LobbyWatchers/LobbyPeople quiet; VampirGame.tsx:221-228
Öğe sayısı: 41 · uyuyor: 24 · fark: 7 · özellik yok: 4 · doğrulanamadı: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Hazır hapı "8/9 hazır" (9 oyuncu) | özellik yok | var | yok; "9 kişi" (GameLobby.tsx:256) |
| 2 | Gözlemciler alt satırı | metin | "İzler, puan almaz · 3 kişi" | "İzler, puan almaz." |
| 3 | Gözlemci satırı alt etiketi | eksik | "İzliyor" (`.wt` 11/14) | yok (LobbyPeople quiet yalnız ad) |
| 4 | Gözlemci ⋮ | özellik yok | her satırda | yok |
| 5 | Gözlemci yüzü | resim | saturate .55, opaklık .8, 36 | yalnız opaklık .8 (LOBBY.people.quietFace), 32 |
| 6 | Gözlemci ağı konumu | uyuyor | `.og` margin −4/4, satır min 42 | quietTop −4, quietMin 42 |
| 7 | Alt not | metin | "1 kişi bekleniyor. Herkes hazır olunca başlatabilirsin." | "En az 5 oyuncu gerekir." ya da ipucu; bkz 39 #11 |
| 8 | Gözlemcide "Bekleniyor" (sol-nz73) | özellik yok | var | yok |
Diğer: bkz 39.

## 45 Takımlı oyun lobisi, Kinshi, masa sahibi — TakimLobi.dc.html
Kod: games/kinshi/KinshiGame.tsx:930-1071 (Teams); GameLobby.tsx (LobbyTeams, LobbyTeam, LobbyCard); theme/lobby.ts; theme/gameColors.ts; tr.kinshi
Öğe sayısı: 44 (başlık 5, 3 çip, başlık+Karıştır, 2 takım kutusu × (çubuk, ad, sayı, kişiler, Katıl/Takımdasın), "Henüz seçmeyenler", not, 8 kişi, Gözlemciler satırı, uyarı, düğme) · uyuyor: 27 · fark: 11 · özellik yok: 2 · doğrulanamadı: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Karıştır | ölçü | 34 yük., iç 12, ikon 18 | btnSm 36, iç 16 (KinshiGame.tsx:1035-1044; LOBBY başlığı notu bilinçli) |
| 2 | Takım zemini | renk | açık pembe rgba(255,79,139,.08); koyu mor rgba(160,140,255,.10), koyu pembe rgba(255,125,170,.10) | açık pembe rgba(232,51,111,.08); koyu mor rgba(156,134,255,.10), koyu pembe rgba(255,126,168,.10) (lobby.ts LOBBY_COLORS.team) |
| 3 | Takım rengi (çubuk, sayı, "Takımdasın") | renk | açık pembe #FF4F8B; koyu mor #A08CFF, koyu pembe #FF7DAA (açık mor #7B5CFF ✓) | açık pembe #E8336F (gameColors.ts:14); koyu mor #9C86FF, koyu pembe #FF7EA8 (gameColors.ts:51-58) |
| 4 | Katıl düğmesi dolgu/yazı | renk | var(--tcol) (açık #7B5CFF/#FF4F8B, koyu #A08CFF/#FF7DAA), yazı #fff, koyuda #0B0E0D | TEAM_FILLS #6A47F5/#D02860 (kontrast için), koyu #9C86FF/#FF7EA8 yazı #14112B (gameColors.ts:30,48-58) |
| 5 | Katıl yazısı | yazı | 14/18 700 | btnSm 14/18 600 (kit.tsx Btn sm; KinshiGame.tsx) |
| 6 | Takım içi "Masa sahibi" | yazı | 10/12 600 (`.tm2 .own2`) | 11/14 (KIT_TYPE.roomOwner, GameLobby.tsx:345) |
| 7 | Takım kişisi ⋮ | özellik yok | 26 düğme, sağ −6 | yok |
| 8 | "Henüz seçmeyenler" üst boşluk | boşluk | 18 (`.us`) | 22 (LOBBY.section.top, GameLobby.tsx:240) |
| 9 | Seçmeyen satır yüksekliği | ölçü | min 38 (`.ug .pr`) | min 46 (P.min, GameLobby.tsx:304) |
| 10 | Seçmeyenlerden sonra Gözlemciler | boşluk | üst 6 (`.ug+.lr`) | 10 (LOBBY.row.first, GameLobby.tsx:493) |
| 11 | Gözlemciler alt satırı | metin | "İzler, puan almaz · 0 kişi" | "Kartı görür, oynamaz." (tr.kinshi.watchersNote, tr.ts:1595) |
| 12 | Uyarı | metin | "Pembe takımda en az 2 kişi olmalı." | "Her takımda en az 2 kişi olmalı." (tr.kinshi.needs, tr.ts:1597) |
| 13 | Oyunu başlat ikonu | ikon | oynat 20 | yok; bkz 39 #12 |
| 14 | Üst aralık "5–12" → "4–12 kişi" | doğrulanamadı | "4–12 kişi" | `tr.games.range(tableGame('tabu'))` değeri koddan okunmadı (GameLobby.tsx:85) |
Uyuyor: çipler "6 tur/Turda 60 sn/Turda 3 pas" (TABU_GAME 6/60/3), "Takımlar" başlığı, Mor/Pembe takım adları, kutu 12 iç/22 köşe/6 aralık, çubuk 8×18/4, ad 15/20 700, sayı 13/18 700, liste min 108, yüz 28, ad 14/18 600, "Takımdasın" 36 yük. 13 600, uyarı amber (#A86A00 / #FFC861, ikon 16, 6) ✓.

## 46 Takımlı lobi, kişi menüsü (masa sahibi) — TakimLobiKisiMenu.dc.html
Kod: yok (kişi menüsü yok); Menu src/components/Menu.tsx
Öğe sayısı: 49 · uyuyor: 27 · fark: 11 (bkz 45) · özellik yok: 6 · ekran yok: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Kişi menüsü | EKRAN YOK | `.pop.kp.tp` 248 geniş, sağ 16, üst 528; başlık yüz 28 + ad 15/20 700; 4 satır: "Mor takıma al" (mor ikon), "Pembe takıma al" (pembe ikon), "Gözlemciye al" (alt: "Oynamaz, yalnızca izler"), "Masadan at" (danger) | yok |
| 2 | "Mor/Pembe takıma al" | özellik yok | sahip başkasını takıma atar | sunucuda hedef kişi alanı yok (`rooms/pick` yalnız kendi, api.ts:272) |
| 3 | "Gözlemciye al" | özellik yok | var | yok (bkz 43 #2) |
| 4 | "Masadan at" | özellik yok (lobide) | var | bkz 43 #3 |
| 5 | Menü ikon renkleri | renk | mor #7B5CFF/koyu #A08CFF, pembe #FF4F8B/#FF7DAA | (yok; takım renkleri bkz 45 #3) |
| 6 | Seçili ⋮ | eksik | `.km.act` seçmeyenlerde | yok |
Diğer fark: bkz 45.

## 47 Kayıt, Açılış — KayitAcilis.dc.html
Kod: app/(auth)/welcome.tsx; src/aura/IntroStage.tsx; theme/introScene.ts; theme/signup.ts; features/venue/VenueHead.tsx (WordmarkRow); tr.signup
Öğe sayısı: 16 (zemin, lamba, 3 yıldız, 4 kanki, masa, logo, başlık, açıklama, Başla, not) · uyuyor: 12 · fark: 4 · doğrulanamadı: 2
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Logo yüksekliği | ölçü | 34 (`.acx .wm svg`) | 26 (WORDMARK_SMALL, VenueHead.tsx:237; welcome.tsx WordmarkRow small) |
| 2 | Başlık satır yüksekliği | ölçü | 32/38 800 −.8 | 32/41 (signup.ts:104; bilinçli) |
| 3 | Düğme–not aralığı | boşluk | 12 (gap 8 + `.nt2` üst 4) | 8 (SIGNUP.footGap; welcome.tsx foot) |
| 4 | Sahnenin başlangıcı | düzen | sahne ekranın en üstünden (0), 470 yük., durum çubuğunun arkasında | SafeAreaView üst + paddingTop 12 altında başlar (welcome.tsx:150-160); piksel farkı aygıta bağlı |
| 5 | Resim eşleşmesi | doğrulanamadı | 10 blob (zemin 1170×600, lamba 420×570, kanki 282×546, masa 1020×450, yıldız 72×72) | assets/riso/acilis/*.webp var, çözünürlük/içerik karşılaştırılmadı; boyut oranları introScene.ts:21 pano ile aynı |
| 6 | Hareket | doğrulanamadı | gecikme/süre CSS (drop .7s, bob 2.6s…) | introScene.ts INTRO/INTRO_LOOPS pano değerleriyle aynı (okundu); eğriler CSS bezier ✓, çalışma anı telefonda bakılmalı |
Uyuyor: metinler (başlık iki yarı, açıklama, "Başla", "skall 18 yaş ve üzeri içindir."), açıklama 15/22 max 320, not 12/16, düğme 56, tablo/kanki/lamba/yıldız konum ve boyları.

## 48 Kayıt 1/7, Başlamadan önce — KayitOnay.dc.html
Kod: app/(auth)/agree.tsx; features/onboarding/SignupStep.tsx, ConsentBoxes.tsx; tr.consents
Öğe sayısı: 24 (adım çubuğu 7+1, resim, başlık, açıklama, 2 satır × (kutu, ad, alt satır, Oku), "Kısaca" + ÖNERİ, 3 bilgi satırı, not, düğme) · uyuyor: 12 · fark: 7 · eksik: 5
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Açıklama | metin | "skall'ı kullanmak için iki metni okuyup onaylaman gerekir." | "Devam etmek için ikisini de okuman gerekir." (tr.ts:206) |
| 2 | Kullanım Koşulları satırı | metin/düzen | ad "Kullanım Koşulları" + alt satır 12/16 500 muted "Okudum ve kabul ediyorum." | tek satır "Kullanım Koşulları’nı okudum ve kabul ediyorum." (tr.ts:207; ConsentBoxes.tsx:98-103; `rowNote` stili var, kullanılmıyor) |
| 3 | KVKK satırı | metin/düzen | "KVKK Aydınlatma Metni" + alt "Okudum." | "KVKK Aydınlatma Metni’ni okudum ve anladım." (tr.ts:209; KVKK Kurulu notu) |
| 4 | "Kısaca" bölümü (ÖNERİ) | eksik | etiket 13/18 700 muted (+ÖNERİ rozeti) + 3 satır: "skall 18 yaş ve üzeri içindir.", "Numaran ve doğum tarihin kimseye görünmez.", "Hesabını istediğin zaman silebilirsin." (22 ikonlar) | yok (agree.tsx; InfoRows var ama kullanılmıyor) |
| 5 | Alt not | metin | "İkisini de okuyup onaylaman gerekir." | "İkisini de okuman gerekir." (tr.ts:213) |
| 6 | Düğme | metin | "Onayla ve devam et" | "Devam et" (tr.ts:211) |
| 7 | Başlık satır yüksekliği | ölçü | 38 | 41 (bkz 47 #2) |
| 8 | Not–düğme aralığı | boşluk | 12 (not margin 0 0 4 + gap 8) | 8 (Screen.tsx FOOTER_GAP 8) |
| 9 | Resim | doğrulanamadı | blob f82779 (360×294) | assets/riso/kayit/onay.webp (içerik karşılaştırılmadı) |
Uyuyor: adım çubuğu (7 parça 4/2/5, "1/7" 13/18 600), geri düğmesi yok, resim 120×98 (−6, alt 10), kutu 24/7, onay 18, çizgi 38, satır 68, "Oku" 14/700 altı çizili, düğme 56, devre dışı hâl, koyu renkler (signup.ts).

## 49 Kayıt 2/7, Telefon numarası — KayitTelefon.dc.html
Kod: app/(auth)/phone.tsx; SignupField.tsx, InfoRows.tsx; tr.auth
Öğe sayısı: 18 (geri, çubuk+sayı, resim, başlık, alan (TR, +90, ok, numara, imleç), 2 bilgi satırı, düğme) · uyuyor: 15 · fark: 2 · özellik yok: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Ülke önekinde aşağı ok | özellik yok | `.dn2` 16 muted, "TR +90 ⌄" açılır görünümlü | ok yok, sabit "TR +90" (SignupField.tsx:64-87); başka ülke seçeneği yok |
| 2 | Başlık satır yüksekliği | ölçü | 38 | 41 (bkz 47 #2) |
| 3 | Resim | doğrulanamadı | blob 75ffff | assets/riso/kayit/telefon.webp |
Uyuyor: başlık "Telefon numaran", alan 56/18/18 iç, 18/24 600 +.2, önek 16/22 + sağ çizgi, "TR" 11/14 700 .4, odak çizgisi 2 ink, bilgi satırları (metinler "Sana SMS ile 6 haneli bir kod göndereceğiz." / "Numaran kimseye görünmez.", ikon 22), düğme "Kod gönder" 56 klavye üstünde, geri 44, adım 2/7.

## 50 Kayıt 3/7, SMS kodu — KayitKod.dc.html
Kod: app/(auth)/otp.tsx; components/CodeInput.tsx; tr.auth
Öğe sayısı: 19 · uyuyor: 17 · fark: 1 · doğrulanamadı: 1
| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Başlık satır yüksekliği | ölçü | 38 | 41 (bkz 47 #2) |
| 2 | Resim | doğrulanamadı | blob 583a05 (360×294) | assets/riso/kayit/kod.webp |
Uyuyor: "Kodu gir", açıklama "532 418 07 26 numarasına 6 haneli bir kod gönderdik." + altı çizili "Numarayı değiştir" (700), 6 kutu 58/16/8 aralık, 24/30 700, odaklı kutu 2 ink + imleç 2×26, "Yeniden gönder 0:42" (14/20 600, süre 700 opaklık .4; ÖNERİ rozeti pano notu: kodda 60 sn sayaç var, bitince bağlantı), "Doğrula" devre dışı 56, geri, adım 3/7; SMS önerisi sistem klavyesinde (autoComplete sms-otp).

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 38 | 47 | 20 (16 fark + 2 fazla + 2 doğrulanamadı) | evet |
| 39 | 36 | 15 (11 fark, 1 fazla, 5 özellik yok, 2 doğrulanamadı; bir kısmı örtüşür) | evet |
| 40 | 37 | 5 | evet |
| 41 | 34 | 7 | evet |
| 42 | 34 | 5 | evet |
| 43 | 39 | 6 | evet |
| 44 | 41 | 8 | evet |
| 45 | 44 | 14 | evet |
| 46 | 49 | 6 (+45'in 11'i) | evet |
| 47 | 16 | 6 | evet |
| 48 | 24 | 9 | evet |
| 49 | 18 | 3 | evet |
| 50 | 19 | 2 | evet |

Yan not (kural 3 / ürün belgesi): lobi hazır sistemi (pano 39-44) SPEC_V4'te yok; "Hazır değilim" panoda "ÖNERİ" etiketli. Pano 43/46'daki "Gözlemciye al" ve "Mor/Pembe takıma al" sahibin başkasının seçimini değiştirmesidir; bu, "oyun başında rollerin sunucuda atanması" kuralına (kural 3) çelişmez ama yeni sunucu ucu gerektirir. Pano 38-46'daki lobi satırlarında kişi sayısı gösterimi masanın kendi kişileri içindir (kural 4 ile uyumlu), konum/cinsiyet bilgisi yok.
