# Pano–kod denetimi, grup 15 (151–158)

Genel not (panolar): bütün panolar 390x844; `.aura` `ekran.css`te `display:none !important` (düz zemin). Kodda zemin `AuraBackground` = AURA.ground (#EFF7F1 açık, #000000 koyu) = pano canvas'ı, UYUYOR. Başlık çubuğu `.gt` (top 52 = durum çubuğu 47 + 5, yanlar 16, gap 10), sahne `.gs` (top 112, yanlar 20), ayak `.gf` (bottom 34, gap 8, düğme 56). Kodda karşılığı yalnız Kibrit'te var (KibritHead/KibritBoards). İbre, Harf Kapmaca ve Şarkıda Geçsin: `content/games.json` → `available:false` (İbre; Harf ve Şarkı da Yakında, taraf modeli, SPEC_V4 4.6.x), oynanır ekran yok.

Ortak parça farkları (ilk yazım 151'de, sonrakilerde "bkz."):
- `.gt .round` kapat: ikon (pano tek yol, iki çizgi de tam opak; kod `close` simgesinde ikinci çizgi %50).
- Koyuda yuvarlak düğme kenarı (pano .08, kod .10).
- Yumuşak düğmenin (soft) koyu dolgusu (pano #121614 düz, kod %62 saydam).
- Sohbet düğmesi erişilebilirlik etiketi (pano "Masa sohbeti", kod "Sohbet").

---------------------------------------------------------------------------------------------------

## 151 Kibrit · Gizli oy — project/KibritOy.dc.html
Kod: oyun odası `app/(app)/room/[id].tsx` → `src/features/games/kibrit/KibritGame.tsx` `VoteScreen` (satır 1150–1199, `kibrit-vote`) + `KibritBoards.tsx` (KibritHead, TimerPill, PaperCard, VoteChips, BoardHint) + `src/theme/kibrit.ts` (KIBRIT_BOARD*). Metinler `tr.kibrit` (1871–1962). Değerlerin çoğu panodan birebir alınmış.
Öğe sayısı: 21 (zemin, kapat, poster, başlık, alt satır, sayaç, kâğıt kartı, kick, soru, not, 8 kişi kutusu, seçili hâl, ipucu satırı, "Oyumu ver") · uyuyor: 14 · fark: 10 · fazla: 5 · doğrulanamadı: 2

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Sayaç ikonu | ikon | kum saati (path "M6.4 4.4h11.2…", gövde .b %50, kapaklar .a), 22x22 | `CapIcon name="clock"` (daire + akrep), KibritBoards.tsx:111; capIcons.generated.ts:63. Kum saati simgesi CAP_ICONS'ta yok |
| 2 | Sayaç gölgesi, açık | koyu/renk | `var(--shadow-raised)` = 0 2px 8px rgba(3,27,11,.08) | `c.raisedShadow` = SHADOW.soft 0 6px 16px rgba(4,73,35,.10) (auraKit.ts:384,439; KibritBoards.tsx:107). Doğru token `c.faceShadow` (SHADOW.av, auraKit.ts:386,501) |
| 3 | Sayaç koyu zemin ve halka | koyu | bg #121614, dış halka 0 0 0 1px rgba(255,255,255,.08) | bg `colors.surface` koyu #151A18 (theme.ts:68); halka `inset` 1px (kibrit.ts:235 paperRing; KibritBoards.tsx:105-108) |
| 4 | Kapat düğmesi ikonu | ikon | tek path "M6.5 6.5l11 11m0-11-11 11", stroke 3, iki çizgi tam opak (--ci-a=--ci-b=text), `ci md` 20 | `CapIcon close`: a çizgisi tam, b çizgisi %50 (capIcons.generated.ts:68-71; Round kit.tsx:646). Boy 20 (KIT.size.icon) uyuyor |
| 5 | Kapat düğmesi koyu kenarı | koyu | border rgba(255,255,255,.08), bg #121614, gölge yok | `raisedEdge` koyu rgba(255,255,255,.10) (auraKit.ts:530); bg #121614 uyuyor |
| 6 | Sahne düzeni | düzen | `.gs` top 112 (başlığın 16 altı), içerik üstten başlar; 12 aralık | StageFit: başlık+10 aralık+4 iç boşluk, orta `justifyContent:'center'` (GameStage.tsx:23,34; KibritGame.tsx:1181 ek `justifyContent:'center'`): içerik dikey ortalanır, ilk satır ~110'da değil içeriğe göre kayar |
| 7 | Seçili kişi kutusu koyuda | koyu | bg #121614, iç halka 2 #EEF3F0 | bg `colors.surface` #151A18; halka `colors.text` #EEF3F0 (KibritBoards.tsx:192-193) |
| 8 | Kâğıt kartı gölgesi, açık | renk | `--glass-shadow`: 0 18px 44px .10, 0 2px 6px .05, **inset 0 1px 0 #FFFFFF** | `c.glassShadow` yalnız ilk ikisi (auraKit.ts:427); `c.glassInset` eklenmemiş (KibritBoards.tsx:133). Koyuda halka pano dış (0 0 0 1px), kod iç (inset) |
| 9 | Kişi adı taşması | davranış | tek satır, `text-overflow: clip`, 11/14 600 | küçülür (`adjustsFontSizeToFit`, min .6) KibritBoards.tsx:197-205; 320 dp kuralı gereği bilerek (fark kabul edilebilir) |
| 10 | Kapat düğmesi etiketi (sahip) | metin | "Oyundan çık" (herkes) | sahipte "Oyunu bitir" (tr.kibrit.endGame; KibritGame.tsx:390). Sahibin çıkışı oyunu bitirdiği için bilerek |
| 11 | Sohbet düğmesi | fazla | panoda sağ üstte yok (sayaç tek) | `ChatRound` KibritGame.tsx:1159 (ek 44 düğme sayaçla yarışır; 360 dp altında sayaç başlığın altına iner, KibritBoards.tsx:42) |
| 12 | Bildir satırı (+ "Bildirim gönderildi") | fazla | yok (ayakta yalnız "Oyumu ver") | `SafetyRow` KibritGame.tsx:1166, 901-941 (sm 36 "Bildir" ayakta düğmenin üstünde; ayak yüksekliği 56 → 100) |
| 13 | Hata satırları (`Failed`), "oy verdiğin kişi çıktı" notu | fazla | yok | KibritGame.tsx:1164-1165, 1183-1187 |
| 14 | Sayaç son 10 sn rengi | fazla | yok (hep --text) | `live.late ? colors.buzz` KibritBoards.tsx:91 |
| 15 | Sayaç başlığın altına inme | fazla | yok | `under` (genişlik <360 ya da yazı >1) KibritBoards.tsx:42,76-80 (320 dp kuralı) |
| 16 | Poster | resim | blob 93260fe0… (462x334, 56x40 cover) | `kibritArt.poster` = assets/games/kibrit/b-poster.webp (504x336; BLOBLAR: depoda eşi yok) | DOĞRULANAMADI: resim içeriği/bayt eşliği doğrulanamadı |
| 17 | "Sen" kutusu | resim/düzen | pembe #E2456F düz daire, beyaz "G" harfi 16/1 700 | `Face`: anonimse kapsül, fotoğraflıysa fotoğraf, yoksa `Av` baş harfi (RisoParts.tsx:51-78); pano her zaman baş harfli | DOĞRULANAMADI: kişinin durumuna göre değişir, Av rengi #E2456F mi bakılmadı |

Uyan ölçüler (örnek, sayıldı): rozet 28 köşe/20 iç/−1.2°, kick 12/16 ls .4, soru 24/30 ls −.4, not 14/20, ızgara 4 sütun 6x10, kutu 18 köşe 8/2 iç, yüz 52, ad 11/14 600, ipucu 13/18 ortalı, düğme 56, ayak aralığı 8, ayak alt 34, başlık 17/22 700 + 13/18 500, poster 56x40/12, sayaç 40 yüksek 8/12 iç gap 4. Metinler harfi harfine uyuyor: "Gizli oy", "Tur 2/6", "ÇEKİLEN KÂĞIT · YAZAN: GİZLİ", "Kime verdiğini kimse görmez.", "4/8 kişi oy verdi", "Oyumu ver".
Kural: KURAL yok (oy sayısı toplamı K-86'ya uygun, kimin kime verdiği yok).

---------------------------------------------------------------------------------------------------

## 152 Kibrit · Sonuç — project/KibritSonuc.dc.html
Kod: `KibritGame.tsx` `End` (1632–1735, `kibrit-end`) + `KibritBoards.tsx` (EndHeading, PastRow), `kibrit.ts` KIBRIT_BOARD.end.
Öğe sayısı: 19 (zemin, kapat, poster, başlık, alt, sohbet, h1, not, 5 satır + 4 ayırıcı, Masaya dön, Yeniden oyna) · uyuyor: 12 · fark: 7 · fazla: 2 · doğrulanamadı: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Kapat ikonu ve koyu kenar | ikon/koyu | bkz. 151 #4, #5 | KibritGame.tsx:1670 (Round close) |
| 2 | Sohbet düğmesi etiketi | metin | aria "Masa sohbeti" | "Sohbet" (RisoParts.tsx:146-148, tr.games.chat) |
| 3 | Sahne düzeni | düzen | `.gs` top 112, gap 14, içerik üstten | ortalı (`justifyContent:'center'`, KibritGame.tsx:1706); gap 14 uyuyor (BB.end.gap) |
| 4 | Satır dikey iç boşluğu | boşluk | `.rr` min-height 56, iç boşluk 0 | `paddingVertical: SPACING[2]` (8) + minHeight 56 (KibritBoards.tsx:259): iki satıra inen soruda satır 16 dp uzar |
| 5 | "Yeniden oyna" | davranış | iki düğme herkese (Masaya dön + Yeniden oyna) | yalnız sahipte (`owner ?`, KibritGame.tsx:1692); KURAL 3 (oyunu yalnız masa sahibi başlatır): panoyla ayrışıyor, karar proje sahibinin |
| 6 | "Masaya dön" koyu dolgusu | koyu | .btn.soft koyuda #121614 düz, kenar rgba(255,255,255,.10) | fill rgba(18,22,20,.62) (buttonGlass.ts:85), siyah zeminde ≈#0B0D0C |
| 7 | Poster | resim | blob 93260fe0… | b-poster.webp | DOĞRULANAMADI (bkz. 151 #16) |
| 8 | Hata satırı ("yeniden oyna" hatası) | fazla | yok | KibritGame.tsx:1678-1682 |
| 9 | "Yeterli kâğıt yok" hâli | fazla | yok (yalnız normal son) | KibritGame.tsx:1671-1672,1708-1709 (tr.kibrit.notEnough/notEnoughNote); durum panosu çizilmemiş |

Uyan: başlık "Oyun bitti · 6 kâğıt" (tr.kibrit.over, 1942) 17/22 700; alt "Kibrit"; h1 "Gecenin kâğıtları" 800/30/36 ls −.6 (kibrit.ts:191); not "Kimin kime oy verdiği gösterilmez." (tr.kibrit.hidden) 14/20 muted, başlık-not aralığı 4; ayırıcı sol 56 (hairIn); satır soru 15/20 600, kim 13/17 500 muted; kim metni biçimi "luna-te89 · 4", "Sen, sol-nz73 · 2", "Bu kâğıda oy çıkmadı" (tr.pastWho/noVotes) uyuyor; ayak gap 8, düğme 56.
Kural: pano 8 kişiyle sayı gösteriyor; kod 5 kişiden az masada sayıyı gizler (`showsCounts`, K-86) — panoyla çelişmez, 5+ için aynı.

---------------------------------------------------------------------------------------------------

## 153 İbre · Tahmin (Yakında) — project/IbreTahmin.dc.html
Kod: EKRAN YOK. `content/games.json:63` İbre `available:false`; canlı İbre ekranı yok (SPEC_V4 4.6.5, taraf modeli; `src/features/games/ibre/Ibre.tsx` yalnız parçalar, Atölye önizlemesi `features/design/previews.tsx`). Metinler kısmen `tr.ibre` (tr.ts:1371).
Öğe sayısı: 19 · uyuyor: 0 · fark: 0 · fazla: 0 · doğrulanamadı: 0 (hepsi EKRAN YOK)
Pano öğeleri: zemin; kapat (Oyundan çık); poster blob 4cac5929…; başlık "Tahmin · Mor takım" (17/700); alt "İbre · Tur 2/6"; sayaç kum saati "0:33"; skor çipi "Mor 7" (mor nokta #7B5CFF, 36 yüksek); skor çipi "Pembe 5" (#FF4F8B); kart (28 köşe, 22/20/18 iç) ; kick "İPUCU · luna-zh78"; q1 "Çay"; yarım kadran SVG 300x150 (gri yay 26 kalın, mavi #7DB2FF %70 sol çeyrek, turuncu #FF8A65 %70 sağ çeyrek, ibre çizgisi (150,140)→(224,40) kalınlık 7, merkez daire r12); uç yazıları "Soğuk" / "Sıcak" (15/700); ipucu "İbre 72 · Takımınla konuşup ibreyi ayarlayın."; düğme "← Sola" (soft, aria "İbreyi sola al"); düğme "Sağa →" (aria "İbreyi sağa al"); düğme "İbreyi onayla" (primary 56) + "ÖNERİ" rozeti.

| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Bütün ekran | özellik yok | tahmin turu, takım skorları, kadran, Sola/Sağa/Onayla | EKRAN YOK (oyun kapalı) |
| 2 | "ÖNERİ" rozeti ("İbreyi onayla") | özellik yok | `.ob` rozeti: ÖNERİ | rozetin işlevi belirsiz; ÖNERİ işaretli öğe, `tr.ibre`te "onayla" metni yok |
| 3 | Sola/Sağa düğmeleri | özellik yok | "← Sola", "Sağa →" | `tr.ibre.left/right` (1373-1374) yalnız erişilebilirlik; Ibre.tsx −/+ ve sürükleme; Sola/Sağa metinli düğme yok |

Kural: KURAL yok (hedef değeri tahmin ekranında yok, K3 ile uyumlu). Pano "taraf modeli" takım skoru gösteriyor (Mor/Pembe); kural 3 taraf modeli oyunları için `update_required` kapısı.

---------------------------------------------------------------------------------------------------

## 154 İbre · Sonuç (Yakında) — project/IbreSonuc.dc.html
Kod: EKRAN YOK (bkz. 153).
Öğe sayısı: 19 · uyuyor: 0 · fark: 0 · fazla: 0 · doğrulanamadı: 0
Pano öğeleri: zemin; kapat; poster 4cac5929…; başlık "Oyun bitti · 6 tur"; alt "İbre"; sohbet düğmesi; h1 "Mor takım kazandı"; not "Mor 16 puan · Pembe 12 puan"; skor çipi "Mor 16"; "Pembe 12"; satır 1: avatar 40 (blob 5b08ad27…), "luna-zh78" + "Mor · Hedef 72, ibre 70", "+4" (accent/yeşil, 15/700); ayırıcı; satır 2: avatar (7666823f…), "sol-nz73" + "Pembe · Hedef 31, ibre 45", "+2"; "Masaya dön" (soft); "Yeniden oyna" (primary).

| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Bütün ekran | özellik yok | takım sonucu, kişi puan satırları | EKRAN YOK |
| 2 | "Yeniden oyna" herkeste | kural | iki düğme herkese | KURAL 3: oyunu yalnız masa sahibi başlatır |
| 3 | Satır alt yazısı "Hedef 72, ibre 70" | davranış | tur başına hedef ve ibre (tek tur) | 6 turlu oyunda kişi satırı neyi toplar belli değil (tur başına mı, son tur mu) |

---------------------------------------------------------------------------------------------------

## 155 Harf Kapmaca · Tur (Yakında) — project/HarfTur.dc.html
Kod: EKRAN YOK. `content/games.json` harf `available:false`; yalnız `Say.tsx` parçaları (Atölye) ve `tr.say` (tr.ts:1348).
Öğe sayısı: 46 · uyuyor: 0 · fark: 0 · fazla: 0 · doğrulanamadı: 0
Pano öğeleri: zemin; kapat; poster 566e8272…; başlık "Mor takımın sırası"; alt "Harf Kapmaca"; sayaç "0:08"; skor çipleri "Mor 6", "Pembe 5"; kart (kick "KATEGORİ", q1 "Hayvan", q2 "Seçili harfle başlayan bir hayvan söyleyin: T"); 29 harf kutusu (7 sütun, gap 6, 40 yüksek, 12 köşe, 800/16; kapalı: A B Ç D K M (%28 opak, üstü çizili), seçili: T (düz text dolgu)); ipucu "Kapanan harfler bir daha seçilmez."; itiraz penceresi kartı (p "İtiraz penceresi · 4 sn" 14/20 600, etiket "Pembe · 2 hak" 24 yüksek); düğme "Söyledik" (primary 56). `.gs` bottom 220.

| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Bütün ekran | özellik yok | tur, harf ızgarası, itiraz penceresi | EKRAN YOK |
| 2 | Metin eşleşmesi | metin | "İtiraz penceresi · 4 sn", "Pembe · 2 hak" | tr.say.window (1357) "İtiraz penceresi · {s} sn" uyuyor; `objectionsShort` "{n} hak" uyuyor; "Söyledik" (tr.say.said) uyuyor; "Kategori" kick'i büyük harf "KATEGORİ" (tr.say.category "Kategori" + upperTr gerekir) |
| 3 | Harf ızgarası 29 harf | özellik yok | 7 sütunlu ızgara, kapalı/seçili harf | Say.tsx'te harf çarkı var; ızgara yok (karşılaştırılmadı, ekran yok) |

---------------------------------------------------------------------------------------------------

## 156 Harf Kapmaca · Sonuç (Yakında) — project/HarfSonuc.dc.html
Kod: EKRAN YOK (bkz. 155).
Öğe sayısı: 19 · uyuyor: 0 · fark: 0 · fazla: 0 · doğrulanamadı: 0
Pano öğeleri: zemin; kapat; poster 566e8272…; başlık "Oyun bitti"; alt "Harf Kapmaca"; sohbet; h1 "Pembe takım kazandı"; not "Pembe 14 · Mor 12"; çipler "Mor 12", "Pembe 14"; satır 1 avatar (7666823f…) "sol-nz73" + "Pembe · 2 itiraz kazandı"; ayırıcı; satır 2 avatar (5b08ad27…) "luna-zh78" + "Mor · en çok harf"; "Masaya dön"; "Yeniden oyna".

| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Bütün ekran | özellik yok | takım sonucu, kişi satırları | EKRAN YOK |
| 2 | "Yeniden oyna" herkeste | kural | iki düğme herkese | KURAL 3 (yalnız masa sahibi başlatır) |

---------------------------------------------------------------------------------------------------

## 157 Şarkıda Geçsin · Tur (Yakında) — project/SarkiTur.dc.html
Kod: EKRAN YOK. `content/games.json` sarki `available:false`; `tr.say.sayLine` (tr.ts:1359 "Geçtiği bir şarkıdan bir dize söyleyin") pano q2 ile aynı.
Öğe sayısı: 17 · uyuyor: 0 · fark: 0 · fazla: 0 · doğrulanamadı: 0
Pano öğeleri: zemin; kapat; poster c766867b…; başlık "Pembe takım"; alt "Sırada · Şarkıda Geçsin"; sayaç "0:21"; çipler "Mor 4", "Pembe 5"; kart ortalı, iç 28/20 (kick "KELİME", q1 "Yağmur" 40/48 700, q2 "Geçtiği bir şarkıdan bir dize söyleyin"); ipucu "Mor takım dinliyor · İtiraz edebilir"; itiraz kartı (p "İtiraz için 5 saniye", etiket "Mor · 3 hak"); "Söyledik". `.gs` bottom 220.

| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Bütün ekran | özellik yok | tur ekranı | EKRAN YOK |
| 2 | Metin | metin | "İtiraz için 5 saniye" | tr.say.windowLabel (1358) "İtiraz için {s} saniye" uyuyor; "Söyledik" uyuyor |

---------------------------------------------------------------------------------------------------

## 158 Şarkıda Geçsin · Sonuç (Yakında) — project/SarkiSonuc.dc.html
Kod: EKRAN YOK (bkz. 157).
Öğe sayısı: 19 · uyuyor: 0 · fark: 0 · fazla: 0 · doğrulanamadı: 0
Pano öğeleri: zemin; kapat; poster c766867b…; başlık "Oyun bitti"; alt "Şarkıda Geçsin"; sohbet; h1 "Berabere"; not "Mor 9 · Pembe 9"; çipler "Mor 9", "Pembe 9"; satır 1 avatar (beb8bad0…) "terra-fv10" + "Mor · 1 itiraz kazandı"; ayırıcı; satır 2 avatar (89846870…) "terra-sd62" + "Pembe · 2 itiraz kazandı"; "Masaya dön"; "Yeniden oyna".

| # | öğe | tür | pano | kod |
| --- | --- | --- | --- | --- |
| 1 | Bütün ekran | özellik yok | takım sonucu, berabere hâli | EKRAN YOK |
| 2 | "Yeniden oyna" herkeste | kural | iki düğme herkese | KURAL 3 |

---------------------------------------------------------------------------------------------------

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 151 | 21 | 10 (+5 fazla, 2 doğrulanamadı) | evet |
| 152 | 19 | 7 (+2 fazla, 1 doğrulanamadı) | evet |
| 153 | 19 | EKRAN YOK (3 özellik yok satırı, ÖNERİ rozeti) | evet |
| 154 | 19 | EKRAN YOK (+KURAL 3) | evet |
| 155 | 46 | EKRAN YOK | evet |
| 156 | 19 | EKRAN YOK (+KURAL 3) | evet |
| 157 | 17 | EKRAN YOK | evet |
| 158 | 19 | EKRAN YOK (+KURAL 3) | evet |
