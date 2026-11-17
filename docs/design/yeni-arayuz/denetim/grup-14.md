# Pano–kod denetimi, grup 14 (panolar 138–150)

Kanıt: hepsi koddan (görüntü yok); ölçüler token ve stil dosyalarından çözüldü, ekranda ölçülmedi. Telefonda bakılacaklar en sonda.

Ortak ölçüt kısaltmaları (aşağıda "O1…" diye anılır; her panoda yine denetlendi):
- O1 oyun yüzeyi (açık): pano `.card`, `.tmr`, `.sc span`, `.pc.on` düz `var(--surface)` #FFFFFF; koyuda #121614 + 1px halka rgba(255,255,255,.08). Kod `Glass`/`raisedChip`: açıkta gradyan rgba(255,255,255,.80→.54) (auraKit.ts:419) ya da .74 beyaz + #FFF kenar (auraKit.ts:437-438), koyuda kenar .09/.10 (auraKit.ts:517,530). Pano zamanlayıcıda `--shadow-raised` (0 2 8 rgba(3,27,11,.08)), kod gölgesiz.
- O2 koyuda `colors.surface` #151A18 (theme.ts:68); panolar kartı #121614 yazar (`.dark .card`, `.dark .tmr`, `.dark .pc.on`, `.dark .rr.cur`).
- O3 yuvarlak düğme koyu kenarı: pano `.dark .gt .round` border rgba(255,255,255,.08); kit `raisedEdge` .10 (auraKit.ts:530).
- O4 `.tag` (sonuç ve sayaç etiketleri): pano `--surface2` (#E6F0E8 / #1B211F), yatay iç boşluk 10, kenarsız; kod `Tag` glassy (kit.tsx:870-935): açıkta rgba(255,255,255,.74) + #FFF kenar, koyuda #121614 + .10 kenar, iç boşluk 8 (auraKit.ts:883).
- O5 takım rengi: pano `.mor` #7B5CFF, `.pem` #FF4F8B iki temada aynı. Kod pembe #E8336F (gameColors.ts:15), koyuda mor #9C86FF, pembe #FF7EA8 (gameColors.ts:48-62). Pembe sapma davranis-eksikleri.md'de kayıtlı karar; koyu mor/pembe kayıtlı değil.
- O6 `StageFit` aralıkları (GameStage.tsx:23,33-35): durum bölgesi ile orta arası 10 (+ kaydırma içi 4), orta içindeki öğeler 8 aralıklı ve dikeyde ORTALI; pano `.gs` üstten başlar, öğeler 12 aralıklı, çubuktan 16 aşağıda (112−96).

## 138 Masa · oyunu oyla (katılımcı, kaydırılmış) — project/MasaOyunOyla.dc.html
Kod: apps/mobile/app/(app)/room/[id].tsx; src/features/rooms/PosterCard.tsx (GameCard, PosterGrid); TableScene.tsx; src/theme/room.ts
Öğe sayısı: 18 (geri, masa hapı: ad + satır, sohbet, ⋮, "Oyunlar", "10 oyun", 10 oyun kartı) · uyuyor: 9 · fark: 8 · fazla: 2 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | masa hapının alt satırı | metin | "12/12 · Lobide" | "12/12 · Lobide açık" (tr.ts:2294 `lobbyOpen`, [id].tsx:366) |
| 2 | kaydırılmış hâl: masa kartı (resim, yüzler, düğmeler) kayıp, yalnız çubuk + Oyunlar | davranış | çubuk 52'de, oyunlar 116'dan başlar, kart kayar | baş (çubuk+kart) sabit, oyunlar altında kayar; kart hiç katlanmaz (TableScene.tsx:28-33, [id].tsx:437-455; 29 Ekim sahibin kararı, pano 17 Kasım) |
| 3 | kartlar | eksik | 10 kart: + İbre, Harf Kapmaca, Şarkıda Geçsin ("Yakında", soluk) | 7 kart (PosterCard.tsx:19-33 GAME_CARDS); ibre klasörü kodda var, kart yok |
| 4 | "Oyunlar" sayacı | metin | "10 oyun" | `gamesCount(GAME_CARDS.length)` = "7 oyun" (tr.ts:2388) |
| 5 | 3 "Yakında" kartının resmi | resim | blob 4cac5929…, 566e8272…, c766867b… (462×334) | assets/game-poster/ altında yok (yalnız 7 poster) |
| 6 | "Yakında" kart hâli | koyu | resim opaklık .42, doygunluk .4; hap rgba(255,255,255,.86), yazı #4A6550 | soluk yok (yalnız `needs_players` .55 soluk, PosterCard.tsx:97,196); etiket kit `art` (auraKit.ts:704) |
| 7 | köşe hapı "Oyla" | ölçü | beyaz #FFF hap, 42 yüksek, sol 4 üst 4, oynat ikonu 16 + yazı 700 14/18 | koyu cam etiket rgba(3,27,11,.55), 24 yüksek, sol 8 üst 8, ikonsuz, 600 12/16 (PosterCard.tsx:154-160, auraKit.ts:704,879,1138). Kayıtlı karar (davranis-eksikleri.md "oynat rozeti alınmadı") |
| 8 | oy etiketi `.vc` ("2 oy", "Oyun · 3") | renk | zemin rgba(3,27,11,.78), yazı 700 12/26, iç boşluk 10, yükseklik 26, sağ 6 alt 6 | zemin .55, yazı 600 12/16, iç boşluk 11 (kit.tsx:902; PosterCard.tsx:162-172, room.ts:30) |
| 9 | kart gölgesi | fazla | yok | `gameCardShadow` 0 12 26 rgba(4,73,35,.18) (PosterCard.tsx:93, auraKit.ts:840) |
| 10 | resim kırpması | ölçü | img %104, margin −%2 | %100 cover (PosterCard.tsx:135-143) |
| 11 | sohbet yuvarlağındaki okunmamış sayı | fazla | yok (`.nd` tanımlı, kullanılmamış) | `badge={unread}` (okunmamış varsa; [id].tsx:331) |
| 12 | geri/sohbet/⋮ yuvarlak ikon boyu | doğrulanamadı | ci 24 (geri) / md 20 | CapIcon boyu kit içinde; ekranda ölçülmedi |
Uyanlar: çubuk 52 üstte, kenar 16, boşluk 8, pano hap 52 yüksek/18 iç/700 16/20 + 500 12/16, "Oyunlar" 700 18/24, sayaç 500 13/18, 2 sütun 12 aralık, kart 126 yüksek/22 köşe, kendi oyu halkası 3 mürekkep, dizilim Vampir→Kibrit.

## 139 Vampir Köylü · Gündüz oylaması — project/VampirOylama.dc.html
Kod: src/features/games/vampir/VampirPlay.tsx (vote fazı :440-489, GamePage :672-763, Candidates :911), RoundTable.tsx, src/theme/vampirTableSize.ts
Öğe sayısı: 19 (çıkış, logo, başlık, alt satır, zamanlayıcı, kart: kick+soru+not, 8 aday ızgarası, ölü notu, "Oyun:" notu, "Oyumu ver") · uyuyor: 4 · fark: 14 · fazla: 3 · doğrulanamadı: 0
Genel: ekran pano düzenine geçirilmemiş; kod K-84 "kapsül masa" (karanlık oda + yuvarlak masa, her iki temada koyu: VampirPlay.tsx:679 `StatusBar light`). Pano geçerli ⇒ hepsi fark.
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | zemin | düzen | tema kanvası (#EFF7F1 / siyah), düz | karanlık oda sahnesi iki temada (RoundTable.tsx TableScene, VampirPlay.tsx:679) |
| 2 | üst çubuk | düzen | `.gt`: X yuvarlak 44 + logo 56×40 + başlık/alt satır + zamanlayıcı, tek satır 52'de | yalnız X (TableRound) solda, sağda "Rolüm"/Chip; logo, başlık, alt satır yok (VampirPlay.tsx:708-731) |
| 3 | başlık "Gündüz 2 · Oylama" + alt "Vampir Köylü" | eksik | var (700 17/22 + 500 13/18) | yok; yalnız hap "Oylama" (tr.ts:1451, VampirPlay.tsx:201) |
| 4 | zamanlayıcı | düzen | hap 40 yüksek, saat ikonu 22 + "0:42" 700 15/20 | masanın ortasında kadran sayısı (DialNumber, VampirPlay.tsx:552) |
| 5 | kart | düzen | `.card` 28 köşe, 20 iç, O1 yüzeyi | kart yok; sözler sahne üstünde (StageWords :831) |
| 6 | "OYLAMA" kick | eksik | 700 12/16 ls .4 muted | yok (tr'de ayrı dizge yok) |
| 7 | soru "Kimi eliyorsunuz?" / not | yazı | q1 700 24/30 ls −.4; q2 500 14/20 | metinler aynı (tr.ts:1538-1539); tipi sahnenin `TABLE_TYPE` (RoundTable/vampirTableSize), 24/30 değil (doğrulanamadı: boyu ayrıca okunmadı) |
| 8 | aday ızgarası | düzen | 4 sütun, 52 yuvarlak, ad 600 11/14, 8 kişi düz ızgara | yuvarlak masa çevresinde koltuklar (RoundTable.tsx Seat :384) |
| 9 | oy sayısı rozeti | düzen | siyah/beyaz yuvarlak rozet 20, kartın sağ üstü | kehribar sayaç ad hapında (NamePill RoundTable.tsx:514, Candidates :911) |
| 10 | seçili aday | düzen | `.pc.on`: O1 yüzeyi + 2px mürekkep iç halka | mum/pembe halka koltukta (RoundTable.tsx:322 ringOf) |
| 11 | ölü aday | koyu | opaklık .38 | gri + parlaklık .5 (RoundTable.tsx:380 DEAD_FACE, :499 DIM .55) |
| 12 | "terra-ud91 gece öldü · Ölüler oy vermez" | metin | ölü notu bütün oyunculara | yalnız ölünün kendisine "Ölüler oy vermez" (tr.ts:1542); "X gece öldü" dizgesi yok |
| 13 | "Oyun: terra-sd62" notu (düğme üstü) | eksik | var, ortalı 500 13/18 | yok; seçilen masada vurgulanır (`yourVote` oy sonrası: tr.ts:1541 "Oyun: X" başka yerde) |
| 14 | "Oyumu ver" | ölçü | `.btn.primary` 56 yüksek, ana renk siyah (koyuda beyaz .94), alttan 34 | `Button size="lg"` (VampirPlay.tsx:481-488), alt 26/inset+10 (vampirTableSize.ts:81, VampirPlay.tsx:741) |
| 15 | seçili olmayan kendi ("Sen" 'G' pembe daire #E2456F) | düzen | kendi de ızgarada (seçilemez) | kendi koltuğu `choosable:false` (VampirPlay.tsx:461) |
| 16 | oyun logosu (blob a28d6803…) | resim | 56×40 afiş | yok |
| 17 | hap "Oylama" (tone day) | fazla | yok | VampirPlay.tsx:547 |
| 18 | masa kadranı ve mum | fazla | yok | TABLE.dial (VampirPlay.tsx:442) |
| 19 | "Rolüm"/PeekRole sağ üstte | fazla | yok (çubukta zamanlayıcı var) | VampirPlay.tsx:208-214 |
Uyanlar: soru metni, açıklama metni, "Oyumu ver", "Ölüler oy vermez" harfi harfine aynı. KURAL: yok (oylar açık, K-78).

## 140 Vampir Köylü · Sonuç — project/VampirSonuc.dc.html
Kod: src/features/games/vampir/VampirGame.tsx (End :238-346), VampirParts.tsx (Confetti)
Öğe sayısı: 17 (X, logo, başlık "Oyun bitti", alt "Vampir Köylü", sohbet, h1, p, 6 kişi satırı, Masaya dön, Yeniden oyna) · uyuyor: 4 · fark: 9 · fazla: 3
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | çubuk | düzen | X + logo + "Oyun bitti"/"Vampir Köylü" + sohbet yuvarlağı | yalnız X, sohbet yok (VampirGame.tsx:324 `right` verilmemiş), başlık/logo yok |
| 2 | sonuç başlığı | düzen | h1 800 30/36 ls −.6 "Köylüler kazandı" + p 500 14/20 "Rolün Köylü. Takımın kazandı." | metin aynı (tr.ts:1555-1558) ama sahne sözü (`StageWords big`, VampirGame.tsx:310-318), pano tipi değil |
| 3 | kişi satırları (yüz 40, ad 600 15/20, alt satır rol + "· 2. gün elendi", sağda `.tag` rol) | eksik | 6 satır, her biri rolü açık | satır yok; roller masadaki açık kartlarda (VampirGame.tsx:271-274). "N. gün elendi" dizgesi yok (tr'de arama: bulunmadı) |
| 4 | rol etiketi `.tag` | eksik | Vampir/Doktor/Gözcü/Köylü etiketi | etiket yok (O4) |
| 5 | alt düğmeler | davranış | "Masaya dön" (soft) + "Yeniden oyna" (primary) herkeste | "Yeniden oyna" yalnız sahipte; sahip değilse tek "Masaya dön" birincil (VampirGame.tsx:322-352). Kayıtlı sahip kuralı |
| 6 | düğme boyu | ölçü | 56 yüksek, 8 aralık, alt 34 | `Button size="lg"` + GlassBtn (VampirGame.tsx:326-345), aralık 10 (vampirTableSize.ts:82) |
| 7 | zemin / konfeti | fazla | düz kanvas | karanlık sahne + konfeti (VampirGame.tsx:354 `{won ? <Confetti/>}`) + masa |
| 8 | kazanan yüzleri halkalı | fazla | yok | VampirGame.tsx:298-310 |
| 9 | ölü satırı notu "Köylü · öldü" | metin | var | `gone: 'öldü'` yalnız kart üstünde (tr.ts:1560) |
| 10 | logo (a28d6803…) | resim | 56×40 | yok |
KURAL: yok (roller oyun sonunda açık, K-80; oyundan çıkanın rolü pano satırında da var → "oyundan çıkan dışında" kuralına dikkat: pano oyundan çıkanı ayırmıyor, kod `result.roles` yalnız masadakilere veriyor).

## 141 Signum · Tahmin turu — project/SignumTahmin.dc.html
Kod: src/features/games/signum/SignumGame.tsx (BoardScreen :666-830), SignumParts.tsx (TopBar :61, Board :175, Tile :241, CluePanel :440), RisoParts.tsx TimeStrip :197, src/theme/signum.ts
Öğe sayısı: 16 (X, logo, başlık, alt satır, zamanlayıcı, Mor skoru, Pembe skoru, ipucu kartı: ad, kelime, sayı yuvarlağı, "Kalan tahmin", 25 kartlık ızgara, ipucu notu, Turu bitir, Tahmin et) · uyuyor: 3 · fark: 14 · fazla: 5
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | çubuk | düzen | `.gt` (X, logo, başlık, alt, zamanlayıcı) | `TopBar`: X solda, ortada cam skor hapı (44), sağda sohbet; logo/başlık yok (SignumParts.tsx:61-146) |
| 2 | başlık / alt satır | metin | "Mor takımın sırası" / "Tahmincisin · Kaptan: luna-zh78" | başlık `guess` "Tahmin et" ya da "X takım tahmin ediyor" (SignumGame.tsx:722-728) ve alt satır `guessHint`; "Tahmincisin · Kaptan:" bu ekranda yok (`guesserTag` = "Mor takım · Kaptan: X", tr.ts:1706, rol ekranında) |
| 3 | zamanlayıcı | düzen | hap 40, saat ikonu + "0:48" | riso zaman kapsülü görseli 60×90 + sayı (RisoParts.tsx:151,197; riso.ts:34) |
| 4 | skor çipleri | düzen | iki çip 36 yüksek, nokta 10 + "Mor 5" / "Pembe 6", çubuğun altında | tek cam hap çubuğun ortasında: iki takım çubuğu + sayı + ayraç (SignumParts.tsx:93-121); dizge `Mor 5` değil çubuk+sayı |
| 5 | ipucu kartı | düzen | `.card.clue` 28 köşe, 14/16 iç: metin + kelime + 36 yuvarlak sayı + sağda "Kalan tahmin 2" | `Glass` + yüz + eyebrow + kelime + 30 yuvarlak sayı (SignumParts.tsx:440-486; S.clue) |
| 6 | "luna-zh78 · ipucu" | yazı | normal harf 500 13/18 muted | büyük harf eyebrow "LUNA-ZH78 · İPUCU" (SignumParts.tsx:470, `upperTr`) |
| 7 | kaptan yüzü | fazla | yok | SignumParts.tsx:464 |
| 8 | ipucu kelimesi | yazı | 800 22/28 ls .4 | `ST.clue` (signum.ts; doğrulanamadı: boyu okunmadı) |
| 9 | sayı yuvarlağı | ölçü | 36, #7B5CFF dolu beyaz yazı 800 18 | 30, takım etiket tonu (S.clue.number; SignumParts.tsx:416-433, gameColors.ts:33-38 açık tag rgba(123,92,255,.14)) |
| 10 | "Kalan tahmin 2" | yazı | 13/18 muted + 16 kalın sayı | eyebrow büyük harf "KALAN TAHMİN" + h3 (SignumParts.tsx:477-482) |
| 11 | kart ızgarası | düzen | düz 5×5, kart 52 yüksek, 12 köşe, aralık 6, 700 10.5/12 ls .2, yüzeysiz | masa bezi resmi üzerinde 350 geniş tahta, 22 köşe, 10 iç, satır 50, kart dokulu görsel, 800 12/14 (signum.ts:53, SignumParts.tsx:175-340) |
| 12 | kart metni | metin | BÜYÜK HARF ("ELMA") | yazıldığı gibi (SignumParts.tsx:246-248 "never in capitals") |
| 13 | işaretli kart | düzen | `.tl.pt` 3px mor iç halka | pembe seçim gölgesi `selShadow(colors.buzz)` + işaret yüzleri (SignumParts.tsx:262,347) |
| 14 | açık kart renkleri | renk | mor #7B5CFF, pembe #FF4F8B, nötr #D9D2BC, düz | görsel dokulu (signumArt.tile); O5 |
| 15 | ipucu notu | metin | "Bir karta dokun, takımın görsün. LİMON işaretli." altta ortalı | "Bir karta dokun, takımın görsün." durum satırında (tr.ts:1732); "LİMON işaretli." yok |
| 16 | sağ düğme | metin | "Tahmin et" primary 56 | `{kelime} kartını aç` ya da "Bir kart seç" (SignumGame.tsx:777; tr.ts:1736-1737), 48 yüksek (Btn varsayılan) |
| 17 | "Turu bitir" | ölçü | soft 56 yüksek | 48 yüksek, glassy (SignumGame.tsx:763-770) |
| 18 | alt aralığı | ölçü | 8 | K.footGap = 12 (riso.ts:81, SignumGame.tsx:760) |
| 19 | oyun logosu (2b834a51…) | resim | 56×40 | yok |
| 20 | sohbet yuvarlağı | fazla | yok (zamanlayıcı var) | SignumGame.tsx:748 |
| 21 | 3B PeekBoard ve kankiler | fazla | yok | SignumGame.tsx:795-812 |
KURAL: yok.

## 142 Signum · Sonuç — project/SignumSonuc.dc.html
Kod: SignumGame.tsx (Over :1347-1568), SignumParts.tsx
Öğe sayısı: 17 (çubuk 5, h1, p, 2 skor çipi, 5 satır, 2 düğme) · uyuyor: 4 · fark: 9 · fazla: 5
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | çubuk | düzen | X + logo + "Oyun bitti"/"Signum" + sohbet | X + boşluk + sohbet; başlık/logo yok (SignumGame.tsx:1481-1486) |
| 2 | başlık bloğu | düzen | h1 800 30/36 "Mor takım kazandı" + p 14/20 "Mor takım bütün kartlarını açtı." | "Oyun bitti" ince + `display` 32/42 500 + ince mürekkep satırı (SignumGame.tsx:1489-1502); metinler aynı (tr.ts:1753-1754) |
| 3 | skor çipleri | düzen | `.sc` iki çip "Mor 9 / 9 kart açtı", "Pembe 6 / 8" (nokta + yazı, 36 yüksek) | iki cam kutu: eyebrow "MOR" + title `9 / 9` + "kart açtı" (SignumGame.tsx:1504-1519); metin parçalı |
| 4 | kişi satırları | eksik | 5 satır: yüz, ad, "Mor · Kaptan"/"Pembe", sağda "Kazanan" (kazananlarda, accent) | satır yok; kazanan yüzleri sahnede + "Kazanan" damga (SignumGame.tsx:1443-1478) |
| 5 | anahtar kartı | fazla | yok | KeyMini + "Aç" + Sheet (SignumGame.tsx:1520-1541, 1564) |
| 6 | sahne, bez, konfeti, kankiler | fazla | düz kanvas | SignumGame.tsx:1415-1478 |
| 7 | düğmeler | davranış/ölçü | "Masaya dön" soft + "Yeniden oyna" primary 56 herkeste | 48 yüksek; "Yeniden oyna" yalnız sahipte (kayıtlı kural) (SignumGame.tsx:1544-1557) |
| 8 | düğme aralığı | ölçü | 8 | 12 (riso.ts:81) |
| 9 | logo (2b834a51…) | resim | 56×40 | yok |
KURAL: yok.

## 143 Kinshi · Anlatıcı — project/KinshiAnlatici.dc.html
Kod: src/features/games/kinshi/KinshiBoard.tsx (PlayBar, PlayTimer, ScoreChips, WordCard, CountTags), KinshiGame.tsx:440-545, src/theme/kinshiPlay.ts, GameStage.tsx
Öğe sayısı: 17 (X, logo, başlık, alt, zamanlayıcı, 2 skor çipi, kart, kick, kelime, 5 yasak satır, 3 sayaç, Pas, Doğru) · uyuyor: 8 · fark: 9 · fazla: 2 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | zamanlayıcı yüzeyi | renk | O1 (açık düz #FFF + gölge; koyu #121614 + .08 halka) | `raisedChip` .74 beyaz + #FFF kenar, gölgesiz; koyu kenar .10 (KinshiBoard.tsx:100-111, auraKit.ts:437-438,529-530) |
| 2 | skor çipleri yüzeyi | renk | O1 | aynı (KinshiBoard.tsx:126-140) |
| 3 | skor çubuğunun çubuktan uzaklığı | boşluk | 16 (bar 96 → .sc 112) | 25: StageFit boşluğu 10 + marginTop 15 (GameStage.tsx:23, KinshiBoard.tsx:166; kinshiPlay.ts:22 "20 under the bar") |
| 4 | takım noktası | renk | #7B5CFF / #FF4F8B iki temada | O5 (KinshiBoard.tsx:142-148 `tone.color`) |
| 5 | kelime kartı yüzeyi | renk | O1 (`.card` düz surface + glass-shadow) | `Glass` (KinshiBoard.tsx:185), açıkta gradyan; koyu kenar .09 |
| 6 | kart, sayaçlar ve skor arası | boşluk | 12 (`.gs` gap), üstten hizalı | 8 aralık, ortalı (GameStage.tsx:33-35) — O6 |
| 7 | yasak kelime yazısı (açık) | renk | var(--danger) #A8301A | `KIT.danger` #C8331F (auraKit.ts:674, kinshiPlay.ts:76) |
| 8 | sayaç etiketleri ("Doğru 2"…) | renk | O4 (`.tag` surface2, iç 10) | glassy Tag, iç 8 (KinshiBoard.tsx:267) |
| 9 | Pas düğmesi yazısı | metin | "Pas · 2" tek yazı | "Pas" + ayrı `· 2` (yazıdan 8 uzak, opaklık .7) (KinshiGame.tsx:484, 603-611) |
| 10 | alt düğme aralığı | ölçü | 8 | K.footGap = 12 (riso.ts:81, KinshiGame.tsx:477) |
| 11 | sohbet yuvarlağı | fazla | yok (kayıtlı: yeri korundu, davranis-eksikleri.md) | KinshiBoard.tsx:87 |
| 12 | koyu kenar yuvarlaklarda | koyu | .08 | .10 (O3) |
| 13 | çubuk simgeleri (X, saat 22) | doğrulanamadı | ci md 20, saat 22 | CapIcon boyu ekranda ölçülmedi |
| 14 | "kum saati" → saat ikonu | ikon | kum saati (kayıtlı sapma) | saat (`CapIcon clock`) |
Uyanlar: çubuk üst 52, yan 16, aralık 10, logo 56×40/12, başlık 700 17/22, alt 500 13/18, zamanlayıcı 40/8-12/ikon 22/700 15 tabular, kelime 800 34/40 ls .5, yasak 40/14/6, Doğru primary, metinler ("Anlatıyorsun", "Tur 3/6 · Mor takım", "KELİME", "Doğru/Pas/Yasak").
Logo: panoda blob 8e86f32f… (png 230×148); kodda afiş (kayıtlı).

## 144 Kinshi · Sonuç — project/KinshiSonuc.dc.html
Kod: KinshiBoard.tsx (EndHeading, EndSection, EndRow, ScoreChip), KinshiGame.tsx:1076-1183, kinshiPlay.ts
Öğe sayısı: 14 (çubuk 5, h1, p, 2 skor çipi, "ÖNE ÇIKANLAR", 2 satır, 2 düğme; alt düğmeler 2) · uyuyor: 7 · fark: 7 · fazla: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | çubukla h1 arası | boşluk | 16 | 15 (`P.stage.top − P.bar.top`, KinshiGame.tsx:1127; kinshiPlay.ts:22) |
| 2 | skor çipleri | renk | O1 | `raisedChip` (KinshiBoard.tsx:137) |
| 3 | "ÖNE ÇIKANLAR" ağırlığı | yazı | 600 12/16 ls .24 | 700 (kinshiPlay.ts:73) |
| 4 | başlık ile ilk satır arası | boşluk | 16 (`.gs` gap; `.sec` 4 üst iç) | 0 (EndSection hemen ardından EndRow, KinshiGame.tsx:1141-1150) |
| 5 | satır adı | yazı | 600 15/20 | 700 (kinshiPlay.ts:75 `rowName`) |
| 6 | satır ayırıcı başlangıcı | ölçü | 56 (`.rr+.rr:before left:56`) | 52 (kinshiPlay.ts:36 hairIn) |
| 7 | takım noktası, zamanlayıcıyız yok | renk | O5 | O5 |
| 8 | foto "Sen" yüzü | doğrulanamadı | pembe #E2456F harf dairesi "G" | `Face`: foto yoksa `Av` (RisoParts.tsx:75), kapsül anonimde; renk ekranda ölçülmedi |
Uyanlar: çubuk metni "Oyun bitti · 6 tur bitti"/"Kinshi", h1 800 30/36, p 14/20, "Mor 11 · Pembe 8" metinleri, satır alt yazısı 500 13/17, satır 56 min/12 aralık/yüz 40, düğmeler 56 + 8 aralık.

## 145 Krot · İpucu turu — project/KrotIpucu.dc.html
Kod: src/features/games/sahtekar/KrotBoard.tsx, KrotGame.tsx (ClueScreen :555-640), src/theme/krot.ts:240-300
Öğe sayısı: 18 (X, logo, başlık, alt, zamanlayıcı, kart: kick+q1+q2, 6 satır, "Rolüm" kartı: başlık+not, Söyledim) · uyuyor: 9 · fark: 9 · fazla: 2
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | zamanlayıcı yüzeyi | renk | O1 | `Glass` (KrotBoard.tsx:60) |
| 2 | zamanlayıcı son 10 sn | fazla | yok (renk değişmez) | `colors.buzz` (KrotBoard.tsx:75,81) |
| 3 | kart yüzeyi | renk | O1 | `Glass` (KrotBoard.tsx:151) |
| 4 | çubuk ile kart arası | boşluk | 16 | 10 (GameStage.tsx:23) |
| 5 | satır listesi dikeyi | düzen | karttan 12 sonra üstten başlar | ortalı kaydırma bölgesi (GameStage.tsx:33) |
| 6 | düz satırların iç boşluğu | ölçü | 0 (yüz kenarda), ayırıcı 56'dan | 8 (krot.ts:278 padX), ayırıcı 64'ten (KrotBoard.tsx:228) |
| 7 | sıra sendeki satır `.cur` | koyu | koyu zemin #121614, halka 2 mürekkep, iç 12, kenar dışı −12 | koyu `colors.surface` #151A18 (O2); dışa taşma 4 (KrotBoard.tsx:213-218, krot.ts:278 curPadX 12) |
| 8 | söylenen kelime ("Söyledi: dalga") | metin | var | "Söyledi" (tr.ts:1823; kayıtlı: kelime sunucuda tutulmaz) |
| 9 | "Rolüm, basılı tut" kartı | fazla | ikon yok | göz ikonu 24 (KrotBoard.tsx:270, krot.ts:277) |
| 10 | "Rolüm" kartı yüzeyi | renk | O1 | `Glass` (KrotBoard.tsx:255) |
| 11 | "Söyledim" düğmesi | renk | primary (siyah/ koyuda beyaz .94), ikonsuz, 56 | sarı `colors.signal` dolgu + ikon `check` (KrotGame.tsx:608-616), 56 (`tall`) |
| 12 | alt boşluk | ölçü | 34 | insets.bottom + 16 (KrotGame.tsx:576) |
| 13 | alt öğe aralığı | ölçü | 8 | 8 ✓ |
Uyanlar: çubuk (X, logo 56×40, "İpucu turu 1/2"/"Krot", sohbet yok), kick/soru/not metinleri ("SIRA SENDE", "Tek kelime söyle", "Kelimeyle ilgili tek kelime söyle. Kelimeyi söyleme."), satır alt yazıları (Sıra sende/Söyledi/Sıradaki/Bekliyor), kart boşlukları 20/4/6, satır 56/12/40, "Rolüm, basılı tut"/"Kartı basılı tut, rolünü gör. Kimse görmesin." harfi harfine.

## 146 Krot · Sonuç — project/KrotSonuc.dc.html
Kod: KrotGame.tsx (Result :1000-1130), KrotBoard.tsx, krot.ts
Öğe sayısı: 16 (çubuk 5, h1, p, kelime kartı: kick+kelime+not, 1 sahtekar satırı + etiket, "DOĞRU OY VERENLER", 3 satır, 2 düğme) · uyuyor: 8 · fark: 8 · fazla: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | h1 satır yüksekliği | yazı | 800 30/36 | 800 30/38 (krot.ts:262 `winner`) |
| 2 | p ("Sahtekar kelimeyi bilemedi!") | yazı | 500 14/20 | `T v="fine"` 13/18 (KrotGame.tsx:1056-1060) |
| 3 | kelime kartı yüzeyi | renk | O1 | `Glass` (KrotBoard.tsx:151) |
| 4 | kelime ("Kumsal") satır yüksekliği | yazı | 700 22/30 | 22/28 (krot.ts:263 `word`) |
| 5 | kart notu | metin | "Kategori: Mekan · tahmin: Liman" | "Kategori: Mekan" (tr.ts:1811; kayıtlı: tahmin saklanmaz) |
| 6 | "Yakalandı" etiketi | renk | O4 | glassy `Tag` (KrotGame.tsx:1081) |
| 7 | "DOĞRU OY VERENLER" başlığı | boşluk | liste ile 16, üst iç 4 | liste ile 8 (KrotGame.tsx:1090-1092, krot.ts:283 `hold: 8`), üst iç yok |
| 8 | alt boşluk | ölçü | 34 | insets.bottom + 16 (KrotGame.tsx:1117) |
| 9 | satır boşluğu çubuğa | boşluk | 16 | 16 ✓ (paddingTop E.gap) |
Uyanlar: çubuk "Oyun bitti"/"Krot"+sohbet, "Masa kazandı", satırlar 56/12/40/600 15/20, ayırıcı 56, kick, düğmeler 8 aralıklı 56; "Yeniden oyna" yalnız sahipte (kayıtlı).

## 147 Sprengja · Bomba sende (süre gizli) — project/SprengjaBomba.dc.html
Kod: src/features/games/sprengja/SprengjaBoards.tsx (SprengjaHead :37-107, BombCard :171-220, ThrowOrder :225-290), SprengjaGame.tsx:558-620, src/theme/sprengja.ts:182-259
Öğe sayısı: 17 (X, logo, başlık, alt, "Süre gizli", kart: bomba, kick, KAR, not; "ATIŞ SIRASI", 5 aday, "Atışlar · 7", at düğmesi) · uyuyor: 10 · fark: 6 · fazla: 3
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | bomba kartı koyu zemin | koyu | #121614 | `colors.surface` #151A18 (SprengjaBoards.tsx:179; O2) |
| 2 | "Süre gizli" hapı koyu zemin | koyu | #121614 | #151A18 (SprengjaBoards.tsx:68) |
| 3 | seçili aday (Sen) koyu zemin | koyu | #121614 | #151A18 (SprengjaBoards.tsx:279) |
| 4 | "ATIŞ SIRASI" üst iç | boşluk | 4 | 0 (SprengjaBoards.tsx:263; ThrowOrder) |
| 5 | sohbet yuvarlağı | fazla | yok (süre etiketi son öğe) | `ChatRound` (SprengjaGame.tsx:580) |
| 6 | düğme ikonu | fazla | yok | `icon="bomb"` (SprengjaGame.tsx:595) |
| 7 | "Kelime kuralları" düğmesi | fazla | yok (kayıtlı) | SprengjaGame.tsx:607-614 |
| 8 | düğme metninde kesme işareti | metin | "luna-zh78’e at" (U+2019) | "luna-zh78'e at" ASCII (trText.ts:124 `inflectTr`) |
| 9 | orta bölge dikeyi | düzen | üstten, kartlar 12 aralıklı | ortalı, çubuktan 10+gap (SprengjaBoards.tsx:139, GameStage.tsx:23) |
Uyanlar: çubuk "Bomba sende"/"Tur 2/5", 56×40 logo, `.tmr.nt` 40/14/700 13 (O1 açıkta gölge ✓), bomba kartı 28/24-20, bomba 96, kick, "KAR" 800 64/70 ls 4, not, aday 64/52/11 600/8 aralık, "Atışlar · 7" 13/18, düğme 56 primary.
Sapma kaydı (kayıtlı): sahne ve halka yerine pano kartı; dar ekranda süre başın altına iner.

## 148 Sprengja · Sonuç — project/SprengjaSonuc.dc.html
Kod: SprengjaBoards.tsx (ResultHeading :295-318, ResultRow :323-374), SprengjaGame.tsx:960-1071
Öğe sayısı: 14 (çubuk 5, h1, p, 5 satır, 2 düğme) · uyuyor: 12 · fark: 2 · fazla: 0
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | p'de kesme işareti | metin | "Bomba sol-nz73’ün elinde hiç patlamadı." (U+2019) | ASCII ' (tr.ts:2087 `noteOne`, trText.ts:124) |
| 2 | h1/p ve satırlar boşluğu | boşluk | 16 | 16 ✓ ama ortalı (BoardPage SprengjaBoards.tsx:139); içerik kısa ise yukarı değil ortaya kayar — O6 |
Uyanlar: çubuk "Oyun bitti · 5 tur"/"Sprengja"+sohbet, h1 800 30/36, p 14/20, satır 56/12/40, ayırıcı 56, "Hiç/1 patlama/2 patlama", "0/−1/−2" (U+2212), kazanan accent, düğmeler.
Not: "Yeniden oyna" yalnız sahipte (kayıtlı).

## 149 Kaupholl · Tahmin — project/KauphollTahmin.dc.html
Kod: src/features/games/kaupholl/KauphollGame.tsx (GuessScreen :669, WriteScreen :914, SentScreen :1034), KauphollParts.tsx (QuestionStrip :77, GuessRow :226, FieldBox :261, ChipsRow :382), src/theme/kaupholl.ts, RisoParts.tsx (TimeStrip)
Öğe sayısı: 16 (X, logo, başlık "Soru 3/7", alt, zamanlayıcı, kart: kick+soru+"Cevap: metre", "TAHMİNİN · KİMSE GÖRMEZ", sayı kutusu (67, imleç, "metre"), 4 durum etiketi, "2/5 kişi yazdı…", "Tahmini gönder") · uyuyor: 4 · fark: 12 · fazla: 4
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | çubuk | düzen | `.gt`: X + logo + "Soru 3/7"/"Tahminini yaz" + zamanlayıcı | X (GameTopBar) + zaman kapsülü + başlık "Tahminini yaz" + satır "Kimse görmez · sayı yaz" (KauphollGame.tsx:830-840, tr.ts:2157-2158); logo yok |
| 2 | "Soru 3/7" | düzen | çubuk başlığı | soru kartının üstünde eyebrow "Soru 1/5" (KauphollGame.tsx:849-854, QuestionStrip :77) |
| 3 | zamanlayıcı | düzen | hap 40, saat ikonu + "0:24" | riso kapsül görseli + sayı (RisoParts.tsx:151,197) |
| 4 | soru kartı | düzen | `.card`: kick "SORU KARTI", soru 700 24/30, not "Cevap: metre" (500 14/20) | "kağıt" dokulu şerit + `Soru n/m` + soru + "Cevap: birim" etiketi (KauphollParts.tsx:45-185 PaperTexture, CardFace); "SORU KARTI" kick yok |
| 5 | "TAHMİNİN · KİMSE GÖRMEZ" | metin | başlık (600 12/16 ls .24) | dizge yok (`fieldLabel` "Tahminin", `writeLine` "Kimse görmez · sayı yaz") |
| 6 | sayı kutusu | ölçü | 64 yüksek, 20 köşe, 2 mürekkep iç halka, 800 30/36, imleç 2×30, "metre" sağda 600 15/20 | `FieldBox` 56'lı alan/ayrı birim sütunu (KauphollParts.tsx:226-295, kaupholl.ts K.ans); doğrulanamadı: sayısal değerler ayrıca okunmadı |
| 7 | durum etiketleri | düzen | düz `.tag` metin: "luna-zh78 · kesinleştirdi" (yeşil), "· yazdı" (yeşil), "· yazmadı" (gri); kendin yok | yüz + ad çipi + işaret halkası; kendin dahil tüm koltuklar; altında 3 satırlık gösterge (yazmadı/yazdı/kesinleştirdi) (KauphollParts.tsx:382-464) |
| 8 | "2/5 kişi yazdı · 1 kesinleştirdi" | düzen | altta ortalı not | çubuk altı satırda (KauphollGame.tsx:1049; tr.ts:2166) — yalnız Gönderildi ekranında |
| 9 | birincil düğme | düzen | tek "Tahmini gönder" 56, alttan 34, tek ekranda alan + düğme | "Tahmin yaz" → ayrı yazma ekranı → "Tahmini gönder" (KauphollGame.tsx:731-780) |
| 10 | kart/yüzey rengi | renk | O1 | `Glass`/kağıt |
| 11 | düzen: kaydırma bölgesi | düzen | üstten | O6 |
| 12 | logo (f7dee805…) | resim | 56×40 | yok |
| 13 | gösterge (legend) | fazla | yok | KauphollParts.tsx:431-460 |
| 14 | kanki (Buddy) Gönderildi'de | fazla | yok | KauphollGame.tsx:1067 |
| 15 | "Tahmini değiştir"/"Kesinleştir" | fazla | pano bu ekranda yok | KauphollGame.tsx:803-817 |
KURAL: yok (yalnız kimin yazdığı/kilitlediği gösteriliyor, sayısı değil; K-87 ile uyumlu).

## 150 Kaupholl · Sonuç — project/KauphollSonuc.dc.html
Kod: KauphollGame.tsx (End :1590-1705), KauphollParts.tsx (ScoreTable :1178, HeroWinners :1245), kaupholl.ts
Öğe sayısı: 15 (çubuk 5, h1, p, 5 satır, 2 düğme) · uyuyor: 5 · fark: 8 · fazla: 4
| # | öğe | tür | pano | kod (dosya:satır) |
|---|---|---|---|---|
| 1 | çubuk | düzen | X + logo + "Oyun bitti · 7 soru"/"Kaupholl" + sohbet | `GameTopBar` X + sohbet; başlık/logo yok (KauphollGame.tsx:1659-1662) |
| 2 | başlık bloğu | düzen | h1 800 30/36 "Kazandın" + p "14 puan" 14/20 | "Oyun bitti · N soru" ince + `display` + mürekkep satır (KauphollGame.tsx:1684-1694); metinler aynı (tr.ts:2213-2222) |
| 3 | skor listesi | düzen | düz satırlar 56 min: yüz 40, ad 600 15/20 + alt "Kazanan", puan 700 15/20 (kazanan accent) | tek `Glass` tablo, satır içi bonus etiketi, kazanç "+n", puan `signal` renkte (KauphollParts.tsx:1178-1243) |
| 4 | "Kazanan" satır yazısı | eksik | var | yok (bonus etiketi: "+bonus tahmin") |
| 5 | kazanan puan rengi | renk | accent #0B783D / #3DDC84 | `colors.signal` (KauphollParts.tsx:1226) |
| 6 | sandık sahnesi, konfeti, kazanan yüzleri | fazla | yok | KauphollGame.tsx:1645-1652, KauphollParts.tsx:1245 |
| 7 | düğmeler | davranış/ölçü | 56 + 8 aralık, herkeste "Yeniden oyna" | 48, 12 aralık, "Yeniden oyna" yalnız sahipte (KauphollGame.tsx:1666-1685, riso.ts:81) |
| 8 | satır ayırıcı | ölçü | 56'dan, 1 | tam genişlik üst çizgi (KauphollParts.tsx:1194-1196) |
| 9 | logo | resim | f7dee805… 56×40 | yok |
KURAL: yok.

## Telefonda bakılacaklar
- Masa: kaydırılmış hâlde kartın katlanıp katlanmayacağı (davranış kararı), 7 kartlık ızgara.
- Kinshi, Krot, Sprengja: koyuda #121614/#151A18 farkı, çubuk–skor aralığı (kodda 25, pano 16), sayaç ve sonuç etiketleri.
- Krot "Söyledim" sarı düğme; Sprengja ASCII kesme işareti.
- 320 dp ve en büyük yazıda Kaupholl yazma ekranı (K.narrowBelow) ve Signum tahta.

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
|---|---|---|---|
| 138 | 18 | 8 (+2 fazla) | evet |
| 139 | 19 | 14 (+3 fazla) | evet |
| 140 | 17 | 9 (+3 fazla) | evet |
| 141 | 16 | 14 (+5 fazla) | evet |
| 142 | 17 | 9 (+5 fazla) | evet |
| 143 | 17 | 9 (+2 fazla) | evet |
| 144 | 14 | 7 | evet |
| 145 | 18 | 9 (+2 fazla) | evet |
| 146 | 16 | 8 | evet |
| 147 | 17 | 6 (+3 fazla) | evet |
| 148 | 14 | 2 | evet |
| 149 | 16 | 12 (+4 fazla) | evet |
| 150 | 15 | 8 (+4 fazla) | evet |
