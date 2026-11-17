# Pano–kod denetimi, grup 04 (16–27)

Not: Koyu pano değerleri `koyu.css` (.dark.pA) ve pano `<style>`'ından çözüldü. Resimler BLOBLAR.md'deki "depodaki karşılık: yok" kaydına göre depoda aynı dosya olarak yok; kodun kullandığı riso dosyası aynı çizim olabilir (piksel boyu farkı yazıldı). Öğe sayıları panoyu yukarıdan aşağıya numaralayıp sayılarak verildi; ortak parçalar (sekme çubuğu, ⋯ düğmesi, wordmark, kimlik anahtarı) her panoda ayrıca sayıldı.

Ortak parça farkları (ilk panoda tam yazıldı, sonrakilerde "bkz."):
- Wordmark: pano 95.3×32 (yükseklik 32), kod 28 (venue/VenueHead.tsx:236 WORDMARK_HEIGHT=28; 2 Kasım 6.6 sahibin kararı).
- Alt sekme çubuğu: pano `left/right 20, bottom 30, height 60`, kod `AURA.tabBar.bottom = 12` (aura.ts:101) + güvenli alan; DOĞRULANAMADI (telefonda ölçülmeli). Sekme etiketi pano 600 10/13 +.1 harf aralığı, kod ayrıca denetlenmedi (başka grup).

## 16 Odadakiler — project/Odadakiler.dc.html
Kod: apps/mobile/app/(app)/district/room.tsx (ChatScreen, ChatTopBar, FirstHere, OptionsSheet), src/features/district/People.tsx (PeopleSheet), RoomSheets.tsx, theme/semt.ts (SEMT.people), theme/chatLook.ts
Öğe sayısı: 52 · uyuyor: 33 · fark: 14 · fazla: 1 · doğrulanamadı: 4
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst bar kapsülü altyazısı | kural | "Sadece sen buradasın" 500 12/16 muted, başlığın altında (`.who .nm span`) | yok; ChatTopBar yalnız başlık (room.tsx:501-533). Kişi sayısı bilgisi kural 4 (Odadakiler dışında sayı gitmez) ile çelişir: KURAL 4, sahibin kararı |
| 2 | Öneri çipleri (3: "Selam Beylikdüzü! 👋", "Bu akşam ne yapıyorsunuz?", "Önerin var mı?") | eksik | 36 yüksek, 13/18 600, yatay kayan, composer üstünde bottom 110 | çizilmiyor (room.tsx:648 "suggestion chips are not drawn"); ÖZELLİK YOK: çipe basınca ne olacağı pano/davranış belgesinde yok |
| 3 | Mesaj alanında emoji düğmesi | özellik yok | alanın solunda 40 ikon "Emoji" | yok; uygulamada emoji seçici yok (theme/dm.ts:63 yorumu) |
| 4 | Mesaj alanı yüksekliği | ölçü | `.fld` 52, köşe 26, `.snd` 52 (alan ve gönder aynı boy) | send 52 (dm.ts:65) ama alan boyu DraftComposer'da ayrıca doğrulanmadı: DOĞRULANAMADI |
| 5 | Gönder düğmesi boş alanda | renk | `--disabled` / `--on-disabled` (soluk) | DOĞRULANAMADI: boş alanda gönder görünümü koddan çözülmedi |
| 6 | Sayfanın geri oku | düzen | başlığın solunda yuvarlak 40 soft geri oku "Seçeneklere dön", sağda 40 boşluk | kapatma düğmesi sağda (Sheet.tsx:234); davranis-eksikleri.md:68 kararıyla alınmadı |
| 7 | Sayfa başlığı yazısı | yazı | `.sh-t` 700 21/26 -0.3; alt `.sh-s` 500 13/18 başlığın 2 altında | Sheet `title` = KIT_TYPE.title 600 21/27 -0.015em (auraKit.ts:248); altyazı sayfa gövdesinde `fine`, 12 üstte boşluk başlıkla ayrı değil (People.tsx:77) |
| 8 | Satır ⋮ "Seçenekler: profili gör, sessize al, şikâyet et" | özellik yok | 40 yuvarlak, 22 ikon, her profilli ve anonim satırda | yok (davranis-eksikleri.md:68: alınmadı). Profilli satırın tamamı basılır (People.tsx:209) |
| 9 | Profilli satırda "Arkadaş ekle" düğmesi | özellik yok | 40 yuvarlak, success-soft zemin, kişi+artı ikonu (Elif) | yok (alınmadı, aynı karar) |
| 10 | Anonim satırda "Sessize aldın" ve soluk avatar | davranış | 3. anonim satır `opacity .45`, "40 dk önce geldi · Sessize aldın" | anonim satır hiç sessize bağlanmaz (People.tsx:155); karar: nick/hesaba bağlar (kural 4) |
| 11 | Grup etiketi harf aralığı | yazı | `.gl` 600 12/16, letter-spacing .24 | `T v="tag"` 600 12/16 harf aralığı yok (People.tsx:117; eyebrow olmalıydı) |
| 12 | Satır alt satırı | yazı | `.pr p span` 500 13/17, tek satır, taşarsa "…" | `T v="fine"` 500 13/18 (auraKit.ts:263); çok satıra sarabilir |
| 13 | "Sen" halkası | renk | `0 0 0 2.5px var(--primary)` açık #0E8745, koyu #3DDC84 | `colors.accent` (People.tsx:189) açıkta #0B783D (skall.css --accent): açık temada 0E8745 yerine 0B783D |
| 14 | Anonim satır avatarı | resim | satır başına farklı kapsül (3 farklı png 192) | hepsi aynı varsayılan işaret (People.tsx:168); davranis-eksikleri.md:68 kararı |
| 15 | Arka plan duvarı | resim | e07afded (açık) / 32631775 (koyu) png 1290x2796 | semt/wall-semt-light/dark.webp 1290x2796; aynı çizim mi DOĞRULANAMADI (sha farklı) |
| 16 | Tek kişi boş hâli / yalnız-sen | düzen | bu panoda yok (OdaTek) | People.tsx:82 EmptyState "Odada şimdilik yalnızsın" (FAZLA, bu panoda çizilmeyen; OdaTek'e ait) |
Fazla: Sheet kapatma düğmesi (sağda 44), Sheet başlığı altında ayrı çizgi yok. Ses/metin eşleşmesi: "Odadakiler", "Beylikdüzü · 6 kişi burada", "Sen / Anonim görünüyorsun", "Profiliyle · 2", "Elif, 23 / Az önce geldi", "Mert, 25 / 12 dk önce geldi · Arkadaşın", "Anonim · 3" birebir (tr.ts:1212-1245).

## 17 Mekan detayı — project/MekanDetay.dc.html
Kod: apps/mobile/app/(app)/(tabs)/explore/[venueId].tsx (CoverPage), theme/venueDetail.ts, theme/auraKit.ts (venueCover), features/explore/Bucket.tsx, WeekEmpty.tsx
Öğe sayısı: 41 · uyuyor: 29 · fark: 8 · fazla: 3 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Sağ üst "Paylaş" yuvarlak düğmesi | özellik yok | 44 yuvarlak, yukarı ok ikonu, sağ üstte | yok; [venueId].tsx:332-369 yalnız geri; paylaşma özelliği/ucu da yok |
| 2 | Kapak resmi | resim | b7b87921 webp 1080x858, `object-position: center 40%` | venue-scene.webp 800x600 (resizeMode cover, merkez); farklı resim ve odak |
| 3 | Üst düğmelerin zemini | renk | `rgba(255,255,255,.82)` + 1px `rgba(255,255,255,.9)` + gölge `0 4 12 .12`; koyu `rgba(18,22,20,.78)`/.12 kenar | `Round light` (kit.tsx) cam; DOĞRULANAMADI |
| 4 | "Bu hafta" satırı | ikon | metin + aşağı ok 18 (`.wk`, 32 yüksek, 4 sağ iç boşluk) | ok yok, "note not a press" (venueDetail.ts:44; [venueId].tsx:271) |
| 5 | Kapakta üniversite adı | fazla | yok | venue.university adı ayrı satır (`T body`, [venueId].tsx:218) |
| 6 | Etkinlik kartları (varsa) | fazla | yok (yalnız boş hâl) | yatay Glass kartlar ([venueId].tsx:299); sahibin 31 Ekim kararı |
| 7 | Kaydırılınca bar | fazla | yok | BarBand+küçük ad ([venueId].tsx:331-368) |
| 8 | Boş hâl resmi | resim | ff99fe23 png 900x540, 150 genişlik | venue-week-empty.webp aynı mı DOĞRULANAMADI (boyut okunamadı) |
| 9 | Alt sekme çubuğu | ölçü | bkz. ortak parça | bkz. ortak parça |
Eşleşenler: meta satırı (Kampüs hapı 28/12, "Avcılar, İstanbul" 500 14/18, Sessiz hapı 28/7 nokta), başlık 700 26/32 -0.6 (venueNameTitle), ana düğme 48 + pin ikonu + "Buraya giriş yap" (btn 48, üstü 18), ipucu metni "Konumun yalnızca bir kez doğrulanır, saklanmaz." (13/18, kilit 16), "Etkinlikler" 700 16/22, "Bu hafta etkinlik yok" 600 15/20, "Plan eklenince burada görünür." 500 13/18, kart 28 köşe 300'de başlıyor (cardOverlap 30), 22/20 iç boşluk.

## 18 Konum doğrulama — project/MekanKonum.dc.html
Kod: apps/mobile/app/(app)/checkin/index.tsx, components/RouteSheet.tsx, features/checkin/LocateNotice.tsx, theme/venueDetail.ts (LOCATE_SHEET)
Öğe sayısı: 38 · uyuyor: 31 · fark: 3 · fazla: 3 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Arkadaki sayfada "Paylaş" düğmesi | özellik yok | bkz. 17 #1 | yok |
| 2 | Üst resim (peek) | resim | 0c0dc853 png 1080x480, 330 genişlik, `bottom:200` | assets/riso/locate.webp (peek: 'locate'); aynı çizim mi, boyut DOĞRULANAMADI |
| 3 | Başlık altı `.sh-s` | yazı | 500 13/18 muted, başlığın 2 altında | subtitle Sheet'e (venue.name) iletiliyor (index.tsx:145); boşluk/boy RouteSheet'te ayrıca doğrulanmadı: DOĞRULANAMADI |
| 4 | Kapatma düğmesi | düzen | yok (`.sh-h` yalnız başlık) | closeButton={false} ✓ uyuyor |
| 5 | Mekan noktası seçimi ("Neredesin?") | fazla | bu panoda yok (123 panosunda var) | index.tsx:211-223 |
| 6 | Eski mekandan ayrılma uyarısı ("... girişin biter") | fazla | yok | index.tsx:174 |
Eşleşen metinler: "Konumunu doğrula", "İstanbul Gelişim Üniversitesi", "Mekanda olduğunu doğrulamak için konumun yalnızca bir kez alınır ve saklanmaz." (tr.ts:876), "Konumumu kullan" + pin ikonu, ana düğme 20 üstte, gövde 14 üstte (LOCATE_SHEET.bodyTop/buttonTop). Arkadaki sayfa 17 ile aynı (aynı farklar).

## 19 Mekan · masan yok — project/MekanMasaYok.dc.html
Kod: apps/mobile/app/(app)/(tabs)/venue.tsx, features/venue/VenueHead.tsx, features/rooms/TableCard.tsx (NoTable), features/venueChat/VenueChatCard.tsx, features/rooms/Lobby.tsx, aura/kit.tsx (Seg), theme/venue.ts
Öğe sayısı: 64 · uyuyor: 39 · fark: 18 · fazla: 5 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Wordmark | ölçü | 32 yükseklik | 28 (VenueHead.tsx:236) |
| 2 | ⋯ düğmesi | ikon | `.round.soft` 44, YATAY üç nokta (cx 5/12/19, cy 12) | `Round glass="clear" icon="more"` 44 (VenueHead.tsx:109); ikon "more" yönü/biçimi DOĞRULANAMADI (Odadakiler pano #153 yatay) |
| 2b | ⋯ düğmesi zemini | renk | `soft`: soft-bg + 1px soft-line + soft-shadow | `glass="clear"` (şeffaf cam) |
| 3 | Masalar/Akış ayracı zemini | renk | `.sg.mseg` açık: `--surface` (#FFF), koyu `#151A18`, 1px glass-line, glass-shadow | `Glass frost` açık degrade rgba(255,255,255,.80→.54) (kit.tsx:1546) |
| 4 | Ayracın üstündeki kanki resmi | resim | `pk2` da480976 png 1080x510, genişlik 128, sağdan 10, ayracın üst kenarında | yok (venue.tsx:231-245 yalnız Seg); resim depoda yok |
| 5 | Mekan adı konumu | ölçü | `.vn` 14 üstte (bar altından), 700 24/30 | token ✓ (venueName); bar altı boşluk -3+10 hesaplı, DOĞRULANAMADI |
| 6 | "Mekandasın" yanında nokta atan | fazla | yok (statik nokta) | PulseDot (VenueHead.tsx:299) atıyor; ayrıca konum çipi `spot` Chip (FAZLA, VenueHead.tsx:267) |
| 7 | Kart boyu | ölçü | resim 152 + `.sb2` 14/16/16 | ✓ uyuyor (VENUE.none) |
| 8 | Kart başlığı | yazı | `.t1` 700 18/24 -0.3 | venueCardTitle ✓ |
| 9 | Alt düğmeler | metin | "Masa kur" (artı ikonlu, 48, 15) + "Açık masalar" | ✓ (tr.venue.createTable, tr.lobby.openTitle) |
| 10 | Mekan sohbeti kartı köşesi | ölçü | `.ch2` 24 köşe, iç 14/16/14, parçalar 10 aralık | chat.radius 27, pad 16, gap 12 (venue.ts:81; "earlier board's values") |
| 11 | Sohbet kartı başlığı | yazı | `.chh p` 700 16/22 | `setTitle` (auraKit.ts, 800 17) + "şu an aktif" Live hapı + okunmamış rozeti (FAZLA, VenueChatCard.tsx:120-134) |
| 12 | Sohbet kartında mesaj alanı | fazla | yok (yalnız başlık + 2 satır) | DraftComposer 44 yüksek + gönder 36 (VenueChatCard.tsx:208; venue.ts:84 field) |
| 13 | Sohbet kartı oku | ikon | chevron 18, stroke 2.6, muted | CapIcon "forward" 18 renk `look.chevron` #9AAEA1 (venue.ts); renk/biçim DOĞRULANAMADI |
| 14 | "Açık masalar" başlığı | yazı | `.sec` 700 16/22, 20 üstte, sayı yok | venueLobbyTitle 700 18/24 (auraKit.ts:325); pano-içi tutarsızlık: 23'te `.oh p` 18/24 |
| 15 | Mekan sohbeti satırlarındaki kapsül ve ad | kural | "terra-uc44", "luna-a7k2" nick + kapsül avatar (mekan sohbeti nick'i) | mekan sohbeti kuralına uygun (anonim nick). Not: kural 4 ihlali yok |
| 16 | Alt sekme çubuğu | ölçü | bkz. ortak parça | bkz. ortak parça |
Eşleşen: başlık metni, "Mekandasın" hapı (28/12/7/6), "Henüz masan yok", "Masa kur, arkadaşlarını çağır. Ya da açık bir masaya katıl.", resim venue-no-table.webp 1050x480 (BLOBLAR eşleşmesi var), düğme boyları 48, aralık 8, iç 10.

## 20 Mekan · masan var, lobide değil — project/MekanMasa.dc.html
Kod: venue.tsx, TableCard.tsx (state private), VenueHead.tsx
Öğe sayısı: 58 · uyuyor: 31 · fark: 16 · fazla: 6 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst satır, Wordmark, ⋯, Masalar/Akış, sohbet kartı | bkz. | bkz. 19 #1–#4, #10–#13 | aynı farklar |
| 2 | Panelde "Masa seçenekleri" ⋯ düğmesi | özellik yok | 32 yuvarlak, 20 yatay üç nokta, sayının sağında, aria "masadan kalk, masa adını değiştir" | yok (TableCard.tsx:236-245 yalnız ad + sayı). Masa adı değiştirme/kalkma eylemi karttan açılmıyor |
| 3 | Kart altı düğmeler | düzen | tek düğme "Davet et" (soft, 18 ikon, 40 yüksek, 14/18) | iki düğme: "Lobiye aç" + "Davet et" (TableCard.tsx:285-319), boy 36 (KIT.size.btnSm) ve yazı btnSm 14/18; yükseklik 40 ≠ 36 |
| 4 | Yüz sırası boyu | ölçü | `.avs` yüz 34 (kenar 2 dahil), sıra aralığı 26 (-8 margin), halka renk `--surface` | yüz 32 + halka 2.5 = 37, aralık 25 (venue.ts:56-58, TableCard.tsx:458) |
| 5 | Boş koltuk | fazla | yok (`.slot` css'te var, işaretlemede kullanılmıyor) | kesikli 32 koltuk + artı (TableCard.tsx:498-515) |
| 6 | Durum hapı | uyuyor | "Lobide değil" gri nokta 7 | ✓ |
| 7 | Sayı | yazı | `.cn` "1/12" 700 13/18 muted | ✓ (venueCount) |
| 8 | İlerleme çubuğu | ölçü | 6 yükseklik, genişlik 8.4% (1/12) | ✓ (Meter 6; 1/12) |
| 9 | Kendi yüzü | resim | harf "G" c2 (profilli), mekan kimliğiyle masa kapsülü | PersonFace; masa kimliği anonim → kapsül (kural: masa kimliği) ✓ davranış |
| 10 | Kart fotoğrafı | resim | 29229bd9 webp 1000x600 "Uçan Halı" örnek | TABLE_CARD_WIDE[room.icon] (masa simgesi) — örnek içerik, depoda yok (karar: örnek fotoğraflar alınmaz) |
| 11 | Panel içi metin | metin | "Uçan Halı", "Sadece sen varsın" | ✓ (tr.venue.seatsAlone) |
Eşleşen: kart içi kenar boşluk 6, kenar 2 `rgba(3,27,11,.22)`, köşe 20, min 250, panel köşe 16 kenar 2, iç 10/12, gölge, durum hapı 12/12.

## 21 Masanı lobiye aç — project/MekanLobiAc.dc.html
Kod: features/rooms/OpenLobbySheet.tsx, LobbyChoices.tsx (LobbyChoices), motion/Sheet.tsx, theme/venue.ts
Öğe sayısı: 33 (arka plan MekanMasa ile aynı 22 + sayfa 11) · uyuyor: 18 · fark: 7 · fazla: 3 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Arka plan | bkz. | bkz. 20 | aynı farklar |
| 2 | Sayfa başlığı | yazı | `.sh-t` 700 21/26 -0.3, grab altında 16 | Sheet title = KIT_TYPE.title 600 21/27 (auraKit.ts:248); sağda kapatma düğmesi FAZLA (Sheet.tsx:234) |
| 3 | Açıklama | metin | "Mekandaki masalar seni lobide görür ve katılmak isteyebilir." 500 15/22 muted, 6 altında | metin ✓ (tr.rooms.newHint) ama `T fine` 13/18 (OpenLobbySheet.tsx:94) |
| 4 | "Niyetin · isteğe bağlı" | yazı | `.lb` 600 13/18 ink + span 500 muted, 18 üstte | metin ✓; token kesfetSort/kesfetSub (LobbyChoices.tsx:29-34), değerleri doğrulanmadı: DOĞRULANAMADI |
| 5 | Niyet çipleri | düzen | tek çip "Sohbet", 8 üstte | iki çip "Oyun" ve "Sohbet" (INTENTS) (LobbyChoices.tsx:37-52); pano tek çip çizmiş (seçim durumu belirsiz) |
| 6 | Çip boyu | ölçü | 40 yüksek, iç 0 16 0 12, 14/18 600, ikon 20 | Chip 36 (KIT.size.chip), 13/17 (auraKit.ts:285,865) |
| 7 | Çip ikonu | ikon | 20 accent ikon (soft, kenarlı; koyu #1B211F) | ikon yok |
| 8 | Niyet ipucu | fazla | yok | "Sohbet etmek istiyorsun. Oyun yine önerilebilir." / "Oyun oynamak istiyorsun." (tr.ts:918-921, LobbyChoices.tsx:67) |
| 9 | Oyun çipleri satırı | fazla | pano çizmiyor (yalnız "Oyun" seçiliyken, ekran.css:89) | ✓ davranış aynı; "Yalnızca lobide görünür" ipucu FAZLA |
| 10 | "Lobiye aç" düğmesi | ölçü/ikon | primary 48, md ikon, 22 üstte (`.lg2`) | Btn block 48 icon "list" ✓; 22 üst boşluk footer'da: sheetGap/rowGap, DOĞRULANAMADI sayısı yok→ footer ayrı |
| 11 | Sayfa kabuğu | ölçü | left/right 8, bottom 8, köşe 28, iç 10/20/38 | Sheet kartı (SheetCard); alt iç 38 yerine insets; ayrıca doğrulanmadı |

## 22 Mekan · masa dolu, lobide — project/MekanMasaDolu.dc.html
Kod: TableCard.tsx (full), venue.ts
Öğe sayısı: 58 · uyuyor: 33 · fark: 14 · fazla: 4 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Ortak farklar | bkz. | bkz. 19/20 | aynı |
| 2 | Yüz sırası 12 kişi | ölçü | `.avs.full`: 12 yüz 34, `space-between`, margin -10 (tam genişlik) | TableCard Seats: hesaplı örtüşme (pitch ≥25) tek satır; kişi görünümü aynı fakat boy 37 ≠ 34 |
| 3 | Durum hapı | uyuyor | "Lobide · Dolu" pembe nokta | ✓ (tr.venue.statusLobbyFull) |
| 4 | Sayı / çubuk | uyuyor | "12/12", çubuk %100 pembe | ✓ |
| 5 | Cümle | metin | "Masa dolu. Biri kalkınca yer açılır." | ✓ (tr.venue.seatsFull) |
| 6 | "Davet et" dolu masada | davranış | normal soft düğme (devre dışı değil) | `disabled={full}` (TableCard.tsx:315); sunucu table_full verir (6.2), pano aktif çiziyor |
| 7 | "Lobiye aç"/"Lobiden çek" düğmesi | fazla | yok (tek düğme) | "Lobiden çek" (TableCard.tsx:297-307) |
| 8 | Etiket/oyun etiketi | fazla | yok | intent/game tag'leri panelde (TableCard.tsx:263-277) |
KURAL: yok (12 kişinin yüzü masa içi; masa kişilerine gider).

## 23 Mekan · kaydırılmış, açık masalar — project/MekanKaydir.dc.html
Kod: venue.tsx, VenueHead.tsx (BarName), TableCard.tsx (Strip), VenueChatCard.tsx (folded), Lobby.tsx, CollapsingCard, theme/aura.ts (venueCollapse), theme/venue.ts
Öğe sayısı: 87 (üst bar 9, ayraç 3, masa şeridi 8, sohbet şeridi 6, "Açık masalar" başlığı 2, 6 satır × 8, sekme 6) · uyuyor: 42 · fark: 21 · fazla: 3 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Kaydırılınca Masalar/Akış ayracı | davranış | `.sbar` içinde ADI + ⋯ + KİMLİK anahtarı ile birlikte ayraç da barda sabit (seg 44) | Seg içerikte kayar, barda yok (venue.tsx:231-245; VenueHead BarName yalnız ad) |
| 2 | Bar bandı | renk | `.sbar` açık `rgba(255,255,255,.32)` + blur(24) saturate(1.1), alt 22 maske; koyu `rgba(0,0,0,.86)` | BarBand `barBandCss` canvas degrade (TopBar.tsx:52; cam kapalı kararı) |
| 3 | Bar yüksekliği | ölçü | 52 üst + 44 satır + 10 + 44 ayraç + 28 alt ≈ 178 | band = 12+54+118×0.28 ≈ 99 (venue.tsx:174); AURA.topBar.bandHeight 118 |
| 4 | Masa şeridi üst konumu | ölçü | `.ms2 top:170` | fold.pinTop 104 (aura.ts:133) |
| 5 | Masa şeridi yüksekliği | ölçü | `.mc` 8+60+8 = 76 | tableStrip 72 (aura.ts:134) |
| 6 | Şerit resmi | ölçü | `.mth` 60, 16 köşe, kenar 2 | stripPicture 52, köşe 14 (aura.ts:135, venue.ts:strip) |
| 7 | Şerit yazısı | düzen | ad 600 16/21 + altında KENDİ YÜZÜ 20 "G" + "1/12 · Lobide değil" (nokta yok) | ad mapName ✓; altında durum noktası + `tr.table.status(count,status)` "1/12 · Lobide değil", yüz yok (TableCard.tsx:553-559) |
| 8 | Şerit düğmeleri | ölçü | 2 × `.s36` 40 yuvarlak soft, ikon 20 (Lobiye aç, Davet et) | ✓ strip.round 40/ikon 20 |
| 9 | Sohbet şeridi yüksekliği | ölçü | `.cc` 10+40+10 = 60 | chatStrip 54 |
| 10 | Sohbet şeridi içeriği | düzen | 40 ikon karosu (12 köşe, surface2, sohbet ikonu 22), "Mekan sohbeti" 600 16/21 + altında son mesaj `<b>nick</b> metin` 500 13/18, sağda chevron | başlık `giftBtn` + yanında tek satır önizleme + 38 yeşil GÖNDER yuvarlağı (VenueChatCard.tsx:147-169), ikon karosu yok |
| 11 | "Açık masalar" üst boşluğu | ölçü | `.oh margin-top 22` | gaps.lobby 20 (venue.ts) |
| 12 | "Açık masalar" başlığı | yazı | 700 18/24 + "6 masa" 500 13/18, 10 aralık, baseline | ✓ |
| 13 | Satırda kişi yüzleri (`.mst`) | kural | 3 yüz 22, -7 örtüşmeli (profilli ve kapsül), "5/12" sayısının yanında | yok; lobi satırında yüz yok (Lobby.tsx:367-369 "No face (rule 4)"). KURAL 4: lobiye yalnız ad, simge, telefon sayısı, niyet ve oyun etiketi gider; pano yüz gösteriyor (kod haklı) |
| 14 | Satır resmi | ölçü | `.oth` 60 kenar 2 `rgba(3,27,11,.22)`, köşe 16 | ✓ |
| 15 | Satır alt satırı | yazı | etiket hapı 22/58 + yüzler + sayı, 8 aralık, `.osb` 600 12/16 | ✓ (tag token 600 12/16); yüzler yok (13) |
| 16 | "Katıl" | ölçü | 76 × 36, 14 | ✓ |
| 17 | "Dolu" düğmesi | metin | "Dolu" devre dışı, `--surface2` zemin | ✓ metin; zemin DOĞRULANAMADI |
| 18 | Satır ayracı | ölçü | `rgba(3,27,11,.10)`, sol 72, sağ 8 | ✓ (inset 72) |
| 19 | Satır sayısı/oyun etiketi | fazla | "Oyun"/"Sohbet" hapı | ✓; ek olarak oyun adı etiketi (`Tag concept`, Lobby.tsx:430) FAZLA (pano yok) |
| 20 | Süren masalar bölümü | fazla | yok | "Süren masalar" + not + "Bu masadayım" (Lobby.tsx:286-334) |
| 21 | Masa-var durumunda sohbet kartı alt ayırıcı | düzen | `.cc margin-top 8` | gaps.chat 12 (şerit modunda 8 ?) DOĞRULANAMADI |

## 24 Mekan · seçenekler menüsü — project/MekanSecenek.dc.html
Kod: features/venue/VenueHead.tsx (Menu, Stay), motion/Menu.tsx, theme/auraKit.ts:1257 (menuWidth 292, menuRadius 28)
Öğe sayısı: 70 (arka plan MekanMasaDolu 58 + menü 12) · uyuyor: 8 (menü ölçüleri: 292/28/16-8-8/12 kenar) · fark: 5 · fazla: 0 · doğrulanamadı: 1 (üst konum 104)
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | İkinci satır | metin | "Profilim" | "Profilini aç" (tr.venue.openProfile, tr.ts:2301) |
| 2 | "Mekan bilgileri" satırı | özellik yok | (i) ikonlu satır + `ÖNERİ` rozeti | yok; ÖNERİ: davranış tanımı yok |
| 3 | Satır aralığı çizgileri | ölçü | `.pi+.pi:before` sol 48 sağ 12, `rgba(3,27,11,.10)`; `.psep` yok | MenuItem hairline: motion/Menu.tsx'te ayrıca doğrulanmadı |
| 4 | Menü içi satır sırası | sıra | Süre, Profilim, Mekan bilgileri, Mekandan ayrıl | Süre, Profilini aç, Mekandan ayrıl (Mekan bilgileri yok) |
| 5 | Kimlik anahtarı değişim satırı | fazla | yok | tr.identity.toProfile/toAnonymous satırları kodda Menu'de DEĞİL (VenueHead.tsx:121-137 yalnız 3 öğe); not: tr.ts:2271-2274 kullanılmıyor, ölü metin |
Eşleşen: "Mekanda kalma süren" + "3 sa 32 dk kaldı" (tr.venue.stay/remaining), 5 çubuk, %72 dolgu, "Mekandan ayrıl" kırmızı, menü sağdan 12.

## 25 Profiline geç onayı — project/MekanProfilGec.dc.html
Kod: features/checkin/IdentitySheet.tsx (Sheet, alt sayfa), motion/Dialog.tsx (merkez dialog var, kullanılmıyor)
Öğe sayısı: 26 (dialog 10 + arka plan 16) · uyuyor: 8 · fark: 12 · fazla: 2 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Konteyner | düzen | merkez dialog (alertdialog), sol/sağ 28, top 250, köşe 28, iç 24/20/20, ortalı | alt sayfa `Sheet` (IdentitySheet.tsx:97) |
| 2 | Yüz çifti | ölçü | 56 yuvarlak, kapsül → ok(22) → profil harfi/fotoğrafı, gap 10 | Av md 44, ok ICON.md 20, gap 8, sola yaslı (`self-start`) (IdentitySheet.tsx:100-103) |
| 3 | Başlık | metin | "Profiline geçilsin mi?" 700 21/26 ortalı | "Profilinle görün?" (tr.identity.profileTitle) |
| 4 | Açıklama | metin | "Mekandakiler adını ve fotoğrafını görür. Bunu bir kez yapabilirsin, sonra anonime dönemezsin." 500 15/22 muted ortalı | "Mekan sohbetinde ve masada adın ve fotoğrafın görünür." `fine` 13/18 + ayrı uyarı bandı |
| 5 | Uyarı bandı | fazla | yok | Banner warn "Bu girişte tek değişiklik hakkın var." + uzun gövde (+ masada ek cümle) (IdentitySheet.tsx:104-111) |
| 6 | Ana düğme | metin/ikon | "Profiline geç", kullanıcı ikonu (md), 48, birincil | "Profilimle görün", ikon yok (tr.identity.profileConfirm) |
| 7 | İkinci düğme | tür | "Vazgeç" hayalet (zemin ve kenar yok, 8 üstte) | "Vazgeç" glassy düğme (Btn variant glassy) |
| 8 | Başlık-uyarı-düğme boşlukları | ölçü | başlık 16 üstte, metin 6/20 | alt sayfa gap 12/10 |
| 9 | Perde | renk | `rgba(3,27,11,.42)` açık, `.7` koyu | SheetScrim (Sheet) farklı olabilir; DialogScrim `L.scrim` |
KURAL: yok. Not: fotoğrafsız hâl (photoNeeded) pano yok.

## 25b Mekan · anonime geç onayı — project/MekanAnonimGec.dc.html
Kod: aynı (IdentitySheet.tsx, toAnonymous)
Öğe sayısı: 30 · uyuyor: 12 · fark: 11 · fazla: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Konteyner | düzen | merkez dialog, top 200 | alt sayfa Sheet |
| 2 | Yüz çifti | ölçü/sıra | profil harfi → ok → kapsül, 56, gap 10 | face → ok → capsule ✓ sıra; 44/20/8, sola yaslı |
| 3 | Başlık | metin | "Anonim görünsün mü?" | "Anonim görün?" (kadın), "Mekan sohbetinde anonim yaz?" (erkek/belirtmeyen; pano yok) |
| 4 | Açıklama | metin | "Adın ve fotoğrafın görünmez. Mekan sohbetinde ve masada **luna-te89** adıyla, kapsül karakterinle görünürsün." (nick kalın 700) | metin ✓ aynı (tr.identity.anonBody) ama nick kalın değil, `fine` 13/18 muted, sola yaslı |
| 5 | Uyarı bandı | metin/yazı | amber `#FFF1D6` (koyu `rgba(255,181,71,.14)`), 18 köşe, 12/14 iç, kilit ikonu 20; başlık 700 14/19 "Bu girişte tek değişiklik hakkın var." + 500 13/18 "Sonra geri dönemezsin. Yeni mesajların yeni kimlikle görünür, öncekiler eski kimlikte kalır." | Banner warn, gövde "Değiştirince bu girişte geri dönemezsin. Yeni mesajların yeni kimlikle görünür, öncekiler eski kimlikte kalır; mekan sohbetini o an izleyen biri iki kimliği eşleştirebilir." (tr.identity.onceBody): ek cümle ve ilk cümle farklı; ikon Banner'ın |
| 6 | Ana düğme | metin/ikon | "Anonim görün" + maske ikonu | "Anonim görün" ✓ metin; ikon yok |
| 7 | "Vazgeç" | tür | hayalet | glassy |
| 8 | Erkek/belirtmeyen varyantı | fazla | yok | chatAnonTitle/Body/Confirm (IdentitySheet.tsx:63-70) |
KURAL: pano "luna-te89" nick'ini kişinin kendi telefonunda gösteriyor (kendi nick'i; kural 4 başkasına yasaklıyor): sorun yok.

## 26 Mekandan ayrıl onayı — project/MekanAyril.dc.html
Kod: apps/mobile/app/(app)/(tabs)/venue.tsx:88-102 (confirm), motion/Dialog.tsx, lib/overlayStore.ts
Öğe sayısı: 22 (dialog 7 + arka plan 15) · uyuyor: 5 · fark: 5 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Simge diski | renk | 56 yuvarlak `rgba(214,64,40,.10)` (koyu `rgba(255,151,126,.12)`), kırmızı çıkış ikonu 28 | `icon: 'logout'`, `tone: 'plain'` (venue.tsx:92-93): kırmızı disk için `tone: 'danger'` gerekir; DOĞRULANAMADI hangi disk çiziliyor (Dialog.tsx tone'a bağlı) |
| 2 | Açıklama | metin | "Uçan Halı masasından da kalkarsın. Geri gelmek için yeniden check-in yaparsın." (masa adı dinamik) | "Masan kapanır. Sonra yeniden giriş yapabilirsin." (tr.venue.leaveConfirmBody) |
| 3 | Ana düğme | metin/renk | "Mekandan ayrıl", `danger` (danger-soft zemin, kırmızı yazı, çıkış ikonu) | "Ayrıl" (tr.venue.leaveConfirm), plain → birincil stil |
| 4 | İkinci düğme | tür | "Vazgeç" hayalet | cancelLabel "Vazgeç" ✓ metin; hayalet/glassy DOĞRULANAMADI |
| 5 | Masa yokken metni | davranış | pano yalnız masa varken | masa yoksa metin değişmiyor, "Masan kapanır" yanlış olur |
Eşleşen: başlık "Mekandan ayrılıyor musun?", dialog ölçüleri (28 kenar, 28 köşe, 24/20/20, disk 56: KIT.layer.size).

## 27 Mekan · akış — project/MekanAkis.dc.html
Kod: venue.tsx (view === 'feed'), features/venueFeed/FeedView.tsx, WriteField.tsx, PostRow.tsx, theme/venueFeed.ts
Öğe sayısı: 78 (üst 12, yazma alanı 4, 4 gönderi × 11, paylaşım kartı 6, sekme 6, diğer 6) · uyuyor: 52 · fark: 12 · fazla: 5 · doğrulanamadı: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Kimlik anahtarı | fazla | akışta da görünüyor (anonim/profil anahtarı) | akışta gizli (`feed ? null`, VenueHead.tsx:98); kural 4 (akışta anonim yazılmaz): kod doğru, pano ile ayrışıyor: KURAL 4 işareti (pano akışta kimlik anahtarı gösteriyor) |
| 2 | Yazma alanı zemini | renk | `.cmp` açık glass-bg, koyu `#151A18` + .08 kenar | `c.field` + `c.glassEdge` (WriteField.tsx:41-42), koyu ayrıca doğrulanmadı |
| 3 | Gönderi adı | yazı | `.ph b` 700 15/20 | `T body ink strong` 600 15/22 (kit.tsx:272 F[600]) |
| 4 | Beğenilmiş renk | renk | sayı `#E2456F` (koyu `#FF7AA6`), ikon `#FF4F8B` | ikon ve sayı `KIT.pink` #FF4F8B (PostRow.tsx:ink) |
| 5 | Kalp ikonu biçimi | ikon | `.b` yumuşak dolgu (50%) | CapIcon "heart" (biçim/opaklık DOĞRULANAMADI) |
| 6 | Yanıt ikonu | ikon | sohbet balonu `.b` | CapIcon "reply" DOĞRULANAMADI |
| 7 | Yanıt sayısı gösterimi | metin | "3" / boş (0) / "1" | ✓ (0'da sayı yok) |
| 8 | Masa paylaşım kartı (Zar Kedisi + "Katıl") | özellik yok | `.shc` 48 resim, ad, "Oyun · 5/12 · Lobide", `Katıl` soft sm + `ÖNERİ · masa paylaşımı` rozeti | yok; akış masa taşımaz (CLAUDE.md kural 4: "Gönderi masa taşımaz"): KURAL 4 işareti, ÖNERİ |
| 9 | "Daha eskiler" | fazla | yok | FeedView.tsx:97 |
| 10 | Boş/yükleniyor/hata | fazla | yok | FeedView (EmptyState/Loader) (zorunlu hâller, pano yok) |
| 11 | Gönderi seçenek menüsü | fazla | yalnız ⋮ ikonu | Sil/Sessize al/Şikayet menüsü (PostRow.tsx:226-262) |
| 12 | Ayracın "Akış" seçili hâli | uyuyor | ✓ | ✓ |
| 13 | Gönderi avatar halkası | düzen | yüz 40 | ✓ KIT.size.av.list 40 |
| 14 | Başka sekmede pk2 resmi | resim | bkz. 19 #4 | yok |
Eşleşen: "Mekana bir şey yaz…", "Akışta herkes profiliyle yazar." (12/16 pano; kod `fine` 13/18: FARK ölçü: pano `.nt` 500 12/16, kod T fine 500 13/18), aralıklar 14/8, hairline sol 52 sağ 8, eylem boşluğu 20/32/18, gönderen yaşı "· 2 dk".

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 16 | 52 | 14 | evet |
| 17 | 41 | 8 | evet |
| 18 | 38 | 3 | evet |
| 19 | 64 | 18 | evet |
| 20 | 58 | 16 | evet |
| 21 | 33 | 7 | evet |
| 22 | 58 | 14 | evet |
| 23 | 87 | 21 | evet |
| 24 | 70 | 5 | evet |
| 25 | 26 | 12 | evet |
| 25b | 30 | 11 | evet |
| 26 | 22 | 5 | evet |
| 27 | 78 | 12 | evet |
