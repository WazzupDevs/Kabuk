# Pano–kod denetimi, grup 13 (125–137)

Not: Panolar 390×844 çerçevede; kod değerleri `apps/mobile/src/theme/*` token'larından çözüldü. "Lobi arka planı" (125–129) için ortak parça farkları ilk panoda (125) tam yazıldı, sonrakilerde "bkz" denir ama her panoda yine denetlendi. Resimler (blob) depoda olmadığından resim içeriği karşılaştırılamadı (DOĞRULANAMADI olarak işaretlendi).

## 125 Masa · katılma isteği geldi (sahip) — MasaIstekGelen.dc.html
Kod: `src/features/rooms/IncomingRequest.tsx` (kart; `app/(app)/room/[id].tsx:608` ve `IncomingRequestHost` `app/(app)/_layout.tsx:48`), arka plan: `app/(app)/(tabs)/venue.tsx`, `src/features/rooms/Lobby.tsx`, `TableCard.tsx`, `src/features/venue/VenueHead.tsx`, `src/theme/venue.ts`
Öğe sayısı: 36 · uyuyor: 18 · fark: 14 · fazla: 2 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | İstek penceresi (alertdialog) bütünü | EKRAN YOK | Ekran ortasında dialog: sol/sağ 28, köşe 28, iç 24/20/20, zemin surface (koyu #151A18 + 1px halka rgba(255,255,255,.08)), gölge 0 18 48 rgba(3,27,11,.22), arkada scrim rgba(3,27,11,.42) / koyu .7 | Karşılığı dialog değil, yüzen/ekran içi kart: `IncomingRequest.tsx:150-187` (gradyan `k.c.sheet`, KIT.size.glassRadius, `Peek kind="request"`, üstte `insets.top+8`; masa ekranında akış içinde). Dialog iskeleti (`KIT.layer.size.dialog*`, `overlayStore → confirm`, OverlayHost) hazır ama bu istek için kullanılmıyor |
| 2 | Masa simgesi (başlık üstü) | resim | 64×64, köşe 20, masa simgesi (Zar Kedisi 240px webp), ortalı | Yok. Yüz: `Av size="row"` (KIT.size.av.row 48) içinde 72'lik halka (`IncomingRequest.tsx:261,349` RING_SIDE=72); masa simgesi hiç çizilmiyor |
| 3 | Başlık "Zar Kedisi katılmak istiyor" | yazı | 21/26, 700, ls -0.3, ortalı, üstten 14 | `T v="h3"` + `KIT_TYPE.requestTitle` 17/23 600 ls -0.085, sola dayalı (`IncomingRequest.tsx:263`, auraKit.ts:242); grup isteğinde başlık `requester_alias` (masa adı) ile kuruluyor (234-236) |
| 4 | Alt satır "3 kişi · Birlikte 5 kişi olursunuz" | metin | 15/22 500 muted, başlığın 6 altında, ortalı | Yok. `tr.rooms` içinde "Birlikte … kişi olursunuz" dizgesi yok; yerine mor etiket `tr.venue.people(n)` = "3 kişi" (`IncomingRequest.tsx:267`, tr.ts:2280). `tooMany` yalnız 12'yi aşınca (tr.ts:949) |
| 5 | İsteyen satırı (`who2`) | düzen | surface2 (koyu #1B211F) zemin, köşe 18, iç 10/12, gap 12; 40'lık avatar, "Mert, 24" 15/20 600 + alt satır "isteyen Mert" 13/17 500 muted, sağda etiket "Profiliyle" 12/16 600 (bg canvas, koyu #262E2B, pill, iç 4/10) | Böyle satır yok. Ad başlığın içinde (`previewName`), "isteyen …" ve "Profiliyle" ayrı mor `Tag`'ler olarak alt alta sarılıyor (`IncomingRequest.tsx:266-275`); avatar 48 (`Av size="row"`) |
| 6 | Geri sayım "42 sn" | yazı | Ortalı düz yazı 13/18 700, renk accent (#0B783D / koyu #3DDC84), altında 14 boşluk | `Tag` (nötr glassy, 12/16 600, yükseklik 24) etiketi `tr.rooms.secondsLeft` (`IncomingRequest.tsx:274`); metin aynı ("42 sn") |
| 7 | Düğmeler | düzen/sıra | Dikey yığın: "Kabul et" primary (48, tam genişlik, ikonsuz) önce, altında "Reddet" ghost (48, margin-top 8, zemin/kenar yok) | Yan yana satır: "Reddet" glassy `icon="close"` solda, "Kabul et" primary `icon="check"` sağda (`IncomingRequest.tsx:288-309`); sıra ve düzen tersi |
| 8 | Not "Reddedersen karşı masa yalnızca "Masa şu an müsait değil" görür." | metin | Görünür, 12/16 500 muted, ortalı, düğmelerin 10 altında | Yalnız Reddet'in `accessibilityLabel`'ı (`IncomingRequest.tsx:294`); ekranda görünmüyor (tr.ts:936 dizgesi aynı) |
| 9 | Üst bant: Masalar/Akış bölmeli seçici | düzen/davranış | `.sbar` içinde: başlık satırının altında (gap 10, iç 52 20 28), kaydırınca bantla birlikte tepede sabit | `Seg` sayfa içeriğinde, bantta değil; sayfayla kayar (`venue.tsx:231-245`); bant yalnız `VenueHead` (satır) |
| 10 | Kendi masa şeridi: resim | ölçü | 60×60, köşe 16, kenarlık 2; şerit (`.mc`) iç 8/10/8/8, köşe 22 → ~78 yüksek | 52×52, köşe 14 (`AURA.venueCollapse.stripPicture` aura.ts:135, `VENUE.strip.radius` venue.ts:78); şerit 72 (`tableStrip`) (`TableCard.tsx:540,548`) |
| 11 | Şerit alt satırı: kendi yüzü | eksik | 20'lik "G" avatar (`mme`) + "2/12 · Lobide" 13/18 500 | Avatar yok (`venue.ts:81 face: 20` tanımlı ama `Strip` kullanmıyor); 7'lik renkli nokta + metin (`TableCard.tsx:554-558`) |
| 12 | Durum metni "Lobide" | metin | "2/12 · Lobide" | "2/12 · Lobide açık" (`tr.venue.lobbyOpen` tr.ts:2294; `TableCard.tsx:127`); masa çubuğunda da aynı (`room/[id].tsx:~417`) |
| 13 | Açık masa satırı: üç yüz yığını (`mst`, 22'lik, -7 binme, kenar canvas) + "5/12" | eksik / KURAL 4 | Etiket, 3 küçük yüz, "5/12"; her satırda | Yok; kod bilerek çizmiyor: "No person's name and no face (rule 4)" (`Lobby.tsx:369`). KURAL 4: lobiye yalnız masa adı, simge, telefon sayısı, niyet, oyun etiketi gider; yüz yığını bunu bozar. Karar proje sahibinin |
| 14 | Niyet etiketi | ölçü | `ntag` her satırda (Oyun/Sohbet), genişlik 58 sabit, 22 yüksek, iç 8, bg surface2 (koyu #1B211F) | Yalnız `intent` varsa; `minWidth: 58` (sabit genişlik değil) (`Lobby.tsx:410-425`, venue.ts:105) |
| 15 | "Dolu" satırı düğmesi | renk (koyu) | `kt.off`: bg surface2, yazı muted, kenar yok; koyu bg #151A18, yazı rgba(238,243,240,.4) | DOĞRULANAMADI: `Btn variant="glassy" disabled` (`Lobby.tsx:261-272`) devre dışı stilini kit'in genel kuralı belirliyor; ölçülmedi |
| 16 | Üst bant zemini | renk | rgba(255,255,255,.32) + blur 24 saturate 1.1, alt 22 maske; koyu rgba(0,0,0,.86) | DOĞRULANAMADI: bant `AuraBand` ile çiziliyor (`aura.ts topBar.bandHeight 118`, blur yok: canlı cam kapalı kararı) |
| 17 | FAZLA: geri sayım halkası | fazla | Yok (yalnız yazı) | `Countdown` SVG halka 72/4 (`IncomingRequest.tsx:316-350`) |
| 18 | FAZLA: düğme ikonları (close/check) | fazla | Yok | `IncomingRequest.tsx:292,301` |

## 126 Mekan · katılma isteği bekliyor — MasaIstekBekliyor.dc.html
Kod: `Lobby.tsx` (`onNotice` 198-213), `src/components/Toast.tsx`, `venue.tsx:319-323`
Öğe sayısı: 35 · uyuyor: 29 · fark: 4 · fazla: 0 · doğrulanamadı: 2 (lobi arka planı farkları için bkz 125 #9–#14, her biri burada da geçerli)
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Bildirim (`.snk`) yan boşluk | ölçü | sol/sağ 16 | `KIT.layer.size.toastSide` 20 (auraKit.ts:1298, Toast.tsx:91) |
| 2 | Bildirim iç boşluk | boşluk | 12 18 (min-height 48) | 12/12/12/14 (`toastPad`, `toastPadLeft`, auraKit.ts:1300-1301), min-height yok (`Toast.tsx:111-122`) |
| 3 | Bekleyen satırın düğmesi | davranış | Yalnız istek giden masanın "Katıl"ı pasif (`off`, aria-busy); öteki satırların Katıl'ı etkin | Bütün "Katıl" ve "Bu masadayım" düğmeleri pasif: `disabled={full \|\| waitingOn !== null}` (`Lobby.tsx:266, 320`) |
| 4 | Bildirimde ön ikon | doğrulanamadı | İki çubuk 10×18, köşe 5: yeşil #3DDC84, pembe #FF4F8B (3 yukarıda) | DOĞRULANAMADI: `Loader kind="meet" size 22` (`Lobby.tsx:209`, venue.ts:112) çizimi çalıştırılmadan karşılaştırılamadı |
| 5 | Metin "İsteğin gönderildi. Yanıt bekleniyor (42 sn)." | metin | 14/19 600 | tr.lobby.waiting aynı metin (tr.ts:2455 civarı), 14/19 600 `toastTitle` (uyuyor) |
| 6 | Kendi şerit: "1/12 · Lobide değil" | doğrulanamadı | Metin "Lobide değil" | Metin aynı (tr.ts:2293); şerit resim/yüz farkları için bkz 125 #10, #11 |

## 127 Mekan · masa müsait değil — MasaIstekMusaitDegil.dc.html
Kod: `Lobby.tsx:182-212`, `Toast.tsx`
Öğe sayısı: 34 · uyuyor: 30 · fark: 2 · fazla: 0 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Bildirim yan boşluk / iç boşluk / min-height | ölçü | 16; 12 18; 48 | bkz 126 #1, #2 |
| 2 | Bildirimin ömrü | davranış | Pano durağan; ne kadar kaldığı yazılmamış | DOĞRULANAMADI: kod 1600 ms sonra kapatıyor (`TOAST.showMs` gameMotion.ts:45); pano süre belirtmiyor |
| 3 | Lobi arka planı | düzen | 125 ile aynı | bkz 125 #9–#14 (her biri burada geçerli) |

## 128 Mekan · süren masalar, Bu masadayım — MasaBuradayim.dc.html
Kod: `Lobby.tsx:284-334` (running), `venue.tsx`, `venue.ts:98-110`
Öğe sayısı: 24 · uyuyor: 20 · fark: 3 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Bölmeli seçici bantta | düzen | bkz 125 #9 | bkz 125 #9 |
| 2 | "Açık masalar" sayacı | metin | Başlıkta "6 masa", altında yalnız 2 satır (pano kendi içinde tutarsız) | Sayaç = gerçek satır sayısı (`Lobby.tsx:226`); DOĞRULANAMADI, pano örnek veri |
| 3 | Satır: yüz yığını | eksik / KURAL 4 | Açık masa satırlarında `mst` (bkz 125 #13) | bkz 125 #13 |
| 4 | Satır etiketi | ölçü | bkz 125 #14 | bkz 125 #14 |
Uyanlar: "Süren masalar" 18/24 700 + "3 masa" 13/18 500 (gap 10, `venueLobbyTitle`/`kesfetCount`), not metni "Lobide değiller. Oturduğun masa buysa "Bu masadayım"a bas, masa sahibi onaylasın." harfi harfine (tr.ts:2447), satırlar (60 resim r16 kenar 2, ad 16/21 600, "4 kişi" 12/16 600, "Bu masadayım" soft sm 36, iç 14, 14/18 600).

## 129 Masa · Bu masadayım isteği geldi (sahip) — MasaBuradayimGelen.dc.html
Kod: `IncomingRequest.tsx` (member = `request.as_member`)
Öğe sayısı: 35 · uyuyor: 19 · fark: 11 · fazla: 2 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | İstek penceresi bütünü | EKRAN YOK | bkz 125 #1 | bkz 125 #1 |
| 2 | Üstte yüz | resim | 64 daire (köşe 32), harf "E", renk #D63D74, beyaz 26/1 700 | `Av size="row"` 48 + halka (`IncomingRequest.tsx:261`); renk adından seçiliyor |
| 3 | Başlık "Ece masanda olduğunu söylüyor" | metin | 21/26 700 ortalı | "Ece, 24 katılmak istiyor" (`tr.rooms.wantsToJoin`, tr.ts:943); "masanda olduğunu söylüyor" dizgesi yok |
| 4 | Alt satır "Onaylarsan masana katılır." | metin | 15/22 500 muted | Yok (tr'de yok) |
| 5 | İsteyen satırı "Ece, 24 / Bu masadayım diyor / Profiliyle" | düzen | bkz 125 #5 | bkz 125 #5; "Bu masadayım diyor" metni tr.rooms.memberAsk ile aynı (tr.ts:946) ama mor etiket olarak ayrı |
| 6 | Sayaç, düğmeler, not | düzen | bkz 125 #6–#8; not "Reddedersen o yalnızca "Masa şu an müsait değil" görür." | bkz 125 #6–#8; not `declineMemberNote` yalnız erişilebilirlik etiketi (`IncomingRequest.tsx:294`), metin aynı (tr.ts:910) |
| 7 | Kendi şerit "4/12 · Lobide değil" | metin | — | metin aynı; resim/yüz için bkz 125 #10, #11 |
| 8 | Lobi arka planı | düzen | bkz 125 | bkz 125 #9, #13, #14 |
| 9 | FAZLA: halka, ikonlar | fazla | yok | bkz 125 #17, #18 |

## 130 Bildirimler · masa daveti geldi — MasaDavetGeldi.dc.html
Kod: `app/(app)/notifications.tsx`, `src/components/RouteSheet.tsx`, `SheetCard.tsx`, `src/aura/Peek.tsx:76-125`, `src/theme/flatLists.ts`, `src/theme/messages.ts:32`, `auraKit.ts layer.size`
Öğe sayısı: 30 (arka plan Mesajlar: 14, sheet: 16) · uyuyor: 17 · fark: 10 · fazla: 2 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Sheet üst iç boşluğu | boşluk | 12 (padding 12 20 28); sheet bottom 8, sol/sağ 8 | `sheetPadTop` 10 (auraKit.ts:1293); padBottom 28 uyuyor |
| 2 | Tutamaç | ölçü | 40×4 | 40×5 (`grabW/grabH` auraKit.ts:1295-1296) |
| 3 | Başlık satırı | düzen | "Bildirimler" (21/27 600) solda, "Tümünü okundu say" (14/18 600, accent, iç 8 0) sağda aynı satırda (`nh`, üstten 12); kapat düğmesi yok | Başlık `RouteSheet` başlığı + sağda kapat düğmesi (`closeButton` varsayılan true, SheetCard.tsx:35,79); "Tümünü okundu say" ayrıca "YENİ" etiketiyle aynı satırda (`notifications.tsx:146-162`) |
| 4 | "YENİ" etiketi | boşluk | `.sl` 12/16 600 ls .24, üstten 18, alttan 4 (ilk etiket de 18) | İlk etiket üstten 0 (`Label first`, `notifications.tsx:362-364`) |
| 5 | Kapat düğmesi | fazla | Yok | `SheetCard` kapat düğmesi (`notifications.tsx:93-101`'de `closeButton:false` verilmemiş) |
| 6 | Buddy'ler (peek) | ölçü | 64×80, sol 44 / sağ 52 (sheet'ten 36 / 44), sheet kenarının 70 üstünde, ikinci ayna (scaleX -1) | 56×70, sol 40, sağ 44, üstte 62 (`MESSAGES.peek` messages.ts:32; `Peek.tsx:76-125`); ayna yok (peek-2.webp ayrı dosya: DOĞRULANAMADI içerik) |
| 7 | Davet satırı 2. satır "Uçan Halı · 4 kişi" | renk | `.nr.un .tm2`: accent #0B783D (koyu #3DDC84) 13/18 700 | `T v="fine"` muted 500 (`notifications.tsx:338`) |
| 8 | Davet satırı cümlesi | yazı | 15/20 500 muted, ad 600 text | 15/22 (`T v="body"`, `notifications.tsx:332`) |
| 9 | Davet satırı düğmeleri | fazla / özellik | Yalnız "Katıl" primary sm (iç 18); Reddet yok | "Reddet" yuvarlak 44 + "Katıl" (`notifications.tsx:276-290`); Reddet pano'da yok |
| 10 | "Bak" düğmesi | renk | `btn soft sm` (soft/glassy) | `Btn sm` varsayılan primary (`notifications.tsx:243-249`) |
| 11 | "Mesaj yaz" yuvarlağı | ölçü | `.sm2` 40×40, ikon 20 | `Round` varsayılan `KIT.size.round` 44 (`notifications.tsx:376`, auraKit.ts:885) |
| 12 | Deniz satırı "YENİ" altında, nokta yok, saat muted | davranış | Yalnız davet satırı `un` (nokta + accent saat) | YENİ altındaki her satıra nokta ve accent saat (`isFresh` → `Row fresh`, `notifications.tsx:164-166, 318-342`) |
| 13 | Scrim | renk | `--scrim-bg` rgba(3,27,11,.20) (koyu .45) + blur 8 | Düz 42 % / koyu 70 %, blur yok (`SheetScrim.tsx`, bilinçli: ortak-temel-plan A.8; pano ayrışıyor) |
| 14 | Arka plan Mesajlar ekranı | doğrulanamadı | Başlık, Yeni mesaj + Bildirimler yuvarlakları (nokta), "Sohbet ara", Sohbetler/İstekler(3), Sabitlenenler, 5 satır, Arşivlenenler 12 | DOĞRULANAMADI: bu ekranın panosu başka grupta; metinler tr'de var (tr.ts:314-377) |
| 15 | Mesajlar'daki tab çubuğu | uyuyor | 60 yüksek, tab 50, ikon 20 | `AURA.tabBar` height 60 / pillHeight 50 / iconLabelled 20 |
Uyanlar: "Adem seni masaya davet etti", "Masa daveti · 1:42" (accent 13/18 700), "Deniz sana arkadaşlık isteği gönderdi", "ÖNCEKİ", "isteğini kabul etti", saat metinleri, YENİ noktası (6px buzz, -12 sol), satır dikey 10, gap 12, avatar 44, çizgi 2.

## 131 Bildirimler · davetin süresi doldu — MasaDavetSuresiDoldu.dc.html
Kod: aynı (`notifications.tsx:261-302`, `inviteState`)
Öğe sayısı: 24 · uyuyor: 14 · fark: 7 · fazla: 1 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Tümünü okundu say" düğmesi | davranış | Yeni öğe olmasa da görünür (başlık satırında), YENİ etiketi yok | Yalnız `newer.length > 0` iken, YENİ başlığının yanında (`notifications.tsx:144-163`) |
| 2 | Başlık satırı / kapat düğmesi / tutamaç / peek / sheet boşluğu | düzen | bkz 130 #1–#6 | bkz 130 #1–#6 |
| 3 | Süresi dolmuş davet satırı | uyuyor | "Adem seni masaya davet etti" / "Uçan Halı · 4 kişi" / "Süresi doldu" (üçü muted 13/18 500), düğme yok, nokta yok | `state 'gone'` → `tr.notifications.short.gone` "Süresi doldu", fine muted, eylem yok (`notifications.tsx:293-299`) |
| 4 | Arkadaş isteği "Bak", "Mesaj yaz" yuvarlakları | ölçü / renk | bkz 130 #10, #11 | bkz 130 #10, #11 |
| 5 | Mesajlar arka planı (İstekler rozeti yok) | doğrulanamadı | "İstekler" etiketinde sayı yok | DOĞRULANAMADI, başka grup |
| 6 | Scrim | renk | bkz 130 #13 | bkz 130 #13 |
Not: "ÖNCEKİ" altında davet satırı pano'da "Süresi doldu" (muted); kod aynı metin. Sıra (davet en üstte, 21 sa/9 Kasım satırları altında) kodda tarihe göre (`items` sırası sunucuda): DOĞRULANAMADI.

## 132 Masadan çıkarıldın — MasaCikarildin.dc.html
Kod: `src/features/rooms/TableEnd.tsx` (`removed`), `src/theme/tableSetup.ts:94-109`, `app/(app)/room/[id].tsx`, tr: `tableEnd` (tr.ts:2486-2504)
Öğe sayısı: 26 · uyuyor: 15 · fark: 9 · fazla: 1 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Satır adı | metin | "Elif, 23", "Mert, 24", "Zeynep, 22" (ad + yaş) | Yalnız `record.other_alias` (`TableEnd.tsx:251`); yaş yok. KURAL 4: yaş "yalnızca masa sürerken masanın bütün kişilerine gider"; çıkarılan kişi masa bittikten sonra yaş görüyor olur. Karar proje sahibinin |
| 2 | Anonim satır: yüz | resim | `ava.kp`: 44 daire surface2 içinde kapsül resmi | `Av size="md" name={alias}` harf (`TableEnd.tsx:249`); kapsül yok |
| 3 | Anonim satır alt metni | metin | "Anonim katıldı · eklenemez" | "Anonim katıldı" (`tr.tableEnd.anonymous` tr.ts:2502); "· eklenemez" yok |
| 4 | Alt not (anonim ise) | fazla | Yok | "Arkadaş olursanız anonim adının sen olduğunu görür…" (`TableEnd.tsx:151-157`, tr.ts:2503); pano'da yok |
| 5 | Satır düğmeleri yüksekliği | ölçü | 40 (iç 16, 14/18 600, ikon 16) | `Btn sm` = `KIT.size.btnSm` 36 (`TableEnd.tsx:197-227`, auraKit.ts:856) |
| 6 | "Eklendi" düğmesi | davranış/renk | `btn off` (pasif görünüm, kontrol ikonu) | glassy, basılabilir (geri alma, `withdraw`) (`TableEnd.tsx:206-215`); pasif değil. Ürün kuralı geri almaya izin veriyor (CLAUDE kural 5): pano ile çelişki kullanıcı kararı |
| 7 | Avatar harf boyu | yazı | 16/1 700 | `KIT_TYPE.av.md` 15/19 700 (auraKit.ts:350) |
| 8 | Alt düğme metni | metin | "Mekâna dön" (circumflex) | "Mekana dön" (`tr.tableEnd.back` tr.ts:2504) |
| 9 | Satır avatar renkleri | renk | Satır başına satır içi renk (#0E8745, #2C63D6, #7B5CFF) | `Av` adından renk seçiyor (aynı beşli palet: FLAT.requestFace.inks sadece İstekler'de); DOĞRULANAMADI hangi renk |
Uyanlar: üst boş bar 56, hero 350×200 köşe 28 gölge-kart, başlık 32/38 700 -0.6, alt satır "Uçan Halı · 4 kişi · 38 dk" (kodda `subtitle(table, people)` = "Uçan Halı · 4 kişi", süre eksik: aşağıda #10), "Masadakiler · İkiniz de eklerseniz arkadaş olursunuz" 12/16 600 .24, satır min 64 gap 12, ad 16/22 600 + alt 13/18, "Arkadaşsınız" success, Mesaj/Ekle düğmeleri, ince çizgi hair, "Mekana dön" 56 primary sabit.
| 10 | Alt satırda süre "· 38 dk" | metin | "Uçan Halı · 4 kişi · 38 dk" | `tr.tableEnd.subtitle(table, people)` yalnız ad ve kişi (`TableEnd.tsx:110`); süre yok |
(Sayım: bu 10. satır da fark; 132 fark toplamı 10, fazla 1.)

## 133 Kayıt · kod hatalı — KayitKodHatali.dc.html
Kod: `app/(auth)/otp.tsx`, `src/features/onboarding/SignupStep.tsx`, `CodeInput.tsx`, `ErrorLine.tsx`, `src/theme/signup.ts`, `authErrors.ts`
Öğe sayısı: 15 · uyuyor: 13 · fark: 2 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Açıklama: telefon biçimi | metin | "532 418 07 26 numarasına 6 haneli bir kod gönderdik." | `formatTrMobile` "+90 532 418 07 26" üretiyor (`_shared/pure/phone.ts:12-17`, `tr.auth.otpHint` tr.ts:193) → "+90 " öneki fazla |
| 2 | Hata satırı hizası | düzen | `.er` align-items:center (ikon ortada; iki satıra sarınca ortalı) | `alignItems: 'flex-start'` (`ErrorLine.tsx:19`) |
Uyanlar: geri 44 yuvarlak, 7 parçalı çubuk 4/5, "3/7" 13/18 600, resim 120×98 (-6 sol, 10 alt), başlık "Kodu gir" 32 800 -0.8, kutular 58/16/8, kırmızı çerçeve 2 (#A8301A / #FF977E), hata metni "Kod hatalı ya da süresi dolmuş." 14/20 600 ikon 18, "Yeniden gönder 0:31" 14/20 600 (+ b .4), "Numarayı değiştir" 700 altı çizili, "Doğrula" 56 primary, üstten 112/8 yerleşim. Resim içeriği (`kod.webp` ↔ blob 583a05…): DOĞRULANAMADI (blob depoda yok).

## 134 Kayıt · kodu yeniden gönder — KayitKodYeniden.dc.html
Kod: aynı
Öğe sayısı: 16 · uyuyor: 14 · fark: 1 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Açıklama telefon biçimi | metin | bkz 133 #1 | bkz 133 #1 |
| 2 | Klavye ve düğmenin klavye üstüne çıkışı | doğrulanamadı | Doğrula pasif, alt 341 (klavyenin üstünde) | DOĞRULANAMADI: `Screen footer` klavyeyle yükseliyor (SignupStep.tsx: "rise with the keyboard"); telefonda bakılmalı |
Uyanlar: aktif ilk kutu (2px mürekkep çerçeve, 2×26 imleç), "Yeniden gönder" altı çizili 700 link (süre bitince), Doğrula `off` (6 hane tamamlanmadan).

## 135 Kayıt · çok fazla deneme — KayitKodCokDeneme.dc.html
Kod: aynı, `authErrors.ts:9-12`
Öğe sayısı: 15 · uyuyor: 11 · fark: 4 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Telefon biçimi | metin | bkz 133 #1 | bkz 133 #1 |
| 2 | Hata satırı hizası | düzen | bkz 133 #2 | bkz 133 #2 |
| 3 | "Doğrula" durumu | davranış | `off` (pasif) 6 hane dolu ve çok fazla deneme hatasıyla | Yalnız `code.length !== 6` ile pasif (`otp.tsx:83`); 429 sonrası etkin kalır |
| 4 | Yeniden gönder sayacı | davranış | "Yeniden gönder 4:58" (5 dakikalık bekleme) | Sayaç her zaman 60 sn (`RESEND_SECONDS`, `otp.tsx:14`); hata sonrası 5 dk'ya uzatılmıyor |
Uyanlar: hata metni "Çok fazla deneme yapıldı. Biraz sonra tekrar dene." harfi harfine (tr.ts:200), kırmızı kutular, diğer öğeler 133 ile aynı.

## 136 Kayıt · 18 yaş altı — KayitYasAlti.dc.html
Kod: `src/features/onboarding/UnderAge.tsx`, `SignupStep.tsx`, `signup.ts`, tr: `underAge` (tr.ts:278)
Öğe sayısı: 7 · uyuyor: 3 · fark: 3 · fazla: 0 · doğrulanamadı: 1 · ÖNERİ: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Düğme metni | metin | "Tamam" | "Kapat" (`tr.common.close` tr.ts:169; `UnderAge.tsx:17`) |
| 2 | Düğmedeki "ÖNERİ" rozeti | özellik / ÖNERİ | `ob2` 8/11 700 rozet (bg rgba(255,255,255,.16), koyuda rgba(0,0,0,.08) ink #0E8745) "Tamam" yanında: tasarımcı önerisi işareti | Yok (ürün öğesi değil, öneri notu); not olarak bırakıldı |
| 3 | Sayfa üst boşluğu | boşluk | `.kc` top 112 (üst satır yok, `.ktop` 44 boş) → başlık/resim durum çubuğunun 65 altında | `contentTopBare` 29 → `top` 76'dan başlıyor (`signup.ts:40`, `SignupStep.tsx:155`): ~36 dp yukarıda |
| 4 | Resim | doğrulanamadı | `08e2d5…` "Doğum günü pastası ve kapsül kanki" 360×294 → 120×98 | `birth: dogum.webp` (`pictures.ts:10`): aynı resim mi? DOĞRULANAMADI (blob depoda yok) |
Uyanlar: başlık "skall 18 yaş ve üzeri içindir" (APP_NAME), alt metin "Hesabın açılmadı ve bilgilerin saklanmadı.", Tamam 56 primary altta.

## 137 Masa · oyun seç (sahip, kaydırılmış) — MasaOyunSec.dc.html
Kod: `app/(app)/room/[id].tsx:440-660`, `src/features/rooms/PosterCard.tsx`, `TableScene.tsx`, `src/theme/room.ts`, `aura/kit.tsx:860-940`
Öğe sayısı: 26 (çubuk 6, "Oyunlar" 2, kartlar 10 + 10 köşe etiketi ve oy rozetleri) · uyuyor: 14 · fark: 9 · fazla: 1 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Kaydırılmış durum | davranış | Masa kartı (resim, yüzler, düğmeler) kaydırınca tamamen çıkar; yalnız çubuk (Geri, masa hapı, sohbet, ⋮) kalır, oyunlar 116'dan başlar | Baş (çubuk + masa kartı) sabit, yalnız oyunlar altında kayar (`room/[id].tsx` "The head stays", `TableScene.tsx` açıklaması 28–29 Ekim kararı); kart hiç katlanmıyor |
| 2 | Oyun sayısı | eksik | 10 oyun: Vampir Köylü, Signum, Kinshi, Krot, Sprengja, Kaupholl, Kibrit + Yakında: İbre, Harf Kapmaca, Şarkıda Geçsin | `GAME_CARDS` yalnız 7 (`PosterCard.tsx:19-35`); başlık "7 oyun" (`tr.table.gamesCount`, tr.ts:2388) |
| 3 | "Yakında" kartları (3) | özellik yok | Soluk resim (opacity .42, saturate .4), pill "Yakında" | Kodda bu üç oyun için kart yok (İbre/Harf/Şarkı ses oyunları var: `VOICE_NAMES`, tr.ts roomEyebrow; kartları çizilmiyor). Pano başlığında "ÖNERİ" yok |
| 4 | "Aç" pili | ölçü/yazı/ikon | 42 yüksek (r21), bg #FFF, yazı #031B0B 14/18 700, oynat ikonu 16, iç 0 14 0 10, gap 4, sol 4 üst 4 | `Tag tone="artOk"` 24 yüksek, 12/16 600, ikon yok, konum sol 8 üst 8 (`PosterCard.tsx:149-155`, `GAME_CARD.tagX/Y` 8, KIT.size.tag 24) |
| 5 | "Yakında" pili | renk/ölçü | bg rgba(255,255,255,.86), yazı #4A6550, 42 yüksek, iç 0 12 | `Tag tone="art"` koyu cam rgba(3,27,11,.55), beyaz yazı (`kit.tsx:897-905`, auraKit.ts:704) |
| 6 | Oy rozeti `.vc` | renk/yazı | bg rgba(3,27,11,.78), 12/26 700, iç 0 10, 26 yüksek, sağ 6 alt 6 | bg `KIT.artTag` rgba(3,27,11,.55), 12/16 600, iç `chipPadX-1`=11 (`PosterCard.tsx:156-166`, auraKit.ts:704) |
| 7 | Kendi oyum halkası `.mine` | davranış | 3px mürekkep halka | uyuyor: `lit` halka `ROOM.vote.ring` 3 (`PosterCard.tsx:115-129`) |
| 8 | Resim ölçeği | ölçü | `img` %104 × %104, -2% kenar boşluğu (hafif büyütme) | `resizeMode="cover"` %100, büyütme yok (`PosterCard.tsx:139-148`) |
| 9 | Soluk kart (yeterli kişi yok) | davranış | Yakında kartı dışında soluklaştırma yok; pano 12/12 kişiyle hepsi "Aç" | `dim`: kartın tamamı opacity .55 (`DIMMED`, `PosterCard.tsx:174`) ve köşe "n+ kişi" (`tr.table.posterNeeds`): pano'da bu durum yok (12 kişiyle tetiklenmez); DOĞRULANAMADI |
| 10 | Masa hapı metni | metin | "12/12 · Lobide" | "12/12 · Lobide açık" (`room/[id].tsx:417`, tr.venue.lobbyOpen); bkz 125 #12 |
| 11 | Gece `.dark .gc` | doğrulanamadı | Siyah zemin #000 | DOĞRULANAMADI: poster resimlerinin altı |
| 12 | FAZLA: kartın dışında kalan çubuk altı | fazla | Sekme çubuğu ve alt solma (`.tb, .fade` gizli) | Sekme çubuğu ve `AuraBand` altta çiziliyor (`room/[id].tsx:~600`, `KIT.table.fade`): masa ekranında sekme çubuğu yok mu: DOĞRULANAMADI, `AuraBand` solması pano'da yok |
Uyanlar: çubuk (Geri 44, hap 52 pill iç 18, ad 16/20 700, satır 12/16 500, sohbet ve ⋮ yuvarlak 44; sol/sağ 16, gap 8, üst 5+status), "Oyunlar" 18/24 700 + sayı 13/18 500 baseline gap 8, grid 2 sütun gap 12, kart 126 yüksek köşe 22, "Vampir Köylü 2 oy", "Kinshi 3 oy", "Krot 1 oy", "Kibrit 1 oy" oy etiketleri (`posterVotes` tr.ts:2363 "2 oy"), "Aç" metni (`posterOpen`), "Yakında" metni.

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 125 | 36 | 14 (+2 fazla) | evet |
| 126 | 35 | 4 | evet |
| 127 | 34 | 2 | evet |
| 128 | 24 | 4 | evet |
| 129 | 35 | 11 (+2 fazla) | evet |
| 130 | 30 | 12 (+2 fazla) | evet |
| 131 | 24 | 7 (+1 fazla) | evet |
| 132 | 26 | 10 (+1 fazla) | evet |
| 133 | 15 | 2 | evet |
| 134 | 16 | 1 | evet |
| 135 | 15 | 4 | evet |
| 136 | 7 | 3 | evet |
| 137 | 26 | 9 (+1 fazla) | evet |

Toplam fark: 83 satır (fazla: 9 ayrı). Telefonda bakılması gerekenler: Loader "Buluş" ile pano'nun iki çubuk ikonu (126), klavyeyle yükselen Doğrula (134), poster resimleri ve masa simgesi blob karşılıkları (125, 136, 137), yüz yığını kararı (KURAL 4).
