# Pano–kod denetimi, grup 05 (panolar 28–37, 13 pano)

Yöntem notu: her pano baştan sona okundu (HTML gövdesi + kendi `<style>` bloğu + skall.css/ekran.css/koyu.css), sınıflar çözüldü, kod tarafında rota + bileşen + tema dosyası (theme/venue.ts, venueFeed.ts, room.ts, tableSetup.ts, chatLook.ts, dm.ts, auraKit.ts) okundu. Tema dosyalarının "pano değeri" yorumlarına değil, sayıların kendisine bakıldı; bakılamayan yer "DOĞRULANAMADI" yazıldı. Önceki belgeli bilinçli sapmalar (`docs/design/yeni-arayuz/davranis-eksikleri.md`) yine de FARK olarak yazıldı, "belgeli" etiketiyle (kural: pano geçerli). Öğe sayıları panoyu yukarıdan aşağıya sayarak verildi (durum çubuğu, telefon çerçevesi ve sistem klavyesi hariç; Mekan sayfası başka panoların konusu olduğu için Masa kur panolarında arka plan tek öğe sayıldı).

Ortak parçalar (ilk geçtiği yerde tam yazıldı, sonrakilerde "bkz."):
- ORTAK-A Kimlik anahtarı (`.tog`): pano 36 slot, 3 çerçeve, 2 boşluk, seçili slotta düğmenin DIŞINA 2.5 `--primary` (koyu #3DDC84) halka, dolgu yok, seçili olmayan slot opaklık .55, gövde `--surface2` + 1px iç çizgi rgba(3,27,11,.06) (koyu #1B211F, çizgi yok). Kod `src/components/IdentityToggle.tsx:90-137` + `KIT.identityToggle` (auraKit.ts:803): slot/pad `VENUE.toggle` ile 36/3 ✓, ama seçili slot beyaz dolgu + 2 px halka İÇERİDE (borderWidth 2), seçili olmayan opaklık .45 (`dim`), gövde `c.hair` (açık rgba(3,27,11,.07), koyuda rgba(255,255,255,.08)).
- ORTAK-B Yuvarlak yumuşak düğme (`.round.soft`): pano `--soft-bg` + 1px `--soft-line` + `--soft-shadow` (koyuda #121614, çizgi .10). Mekan başlığı kodda `Round glass="clear"` (VenueHead.tsx:109-115).
- ORTAK-C Sohbet isim rengi (`.nk`): pano açık #B5560A, #C2185B, #0E8745, muted; koyu #FFB547, #FF7AA6, #3DDC84. Kod `src/theme/nameInk.ts:9-16` altı renk (#5A3AE6, #C51F62, #1C7843, #9A5300, #3B25A6, #0F6E8C), koyuda %38 beyazla karışım.
- ORTAK-D Anahtar (`.tgl`): pano 52×32, kapalı rgba(3,27,11,.14) / koyu #262E2B, açık #1C8C4E / koyu #3DDC84, düğme #FFF gölge 0 1px 3px .25 (koyu açıkken düğme #0B0E0D). Kod `Switch` (aura/kit.tsx:1607-1650): açık `KIT.primary` (#0E8745 her iki temada), kapalı `c.switchOff` (--control #C6E0CC / koyu #2A332F), düğme `c.switchKnob`.
- ORTAK-E Sayfa zemini (`.cz`, `.pg` = `var(--surface)`): açık #FFFFFF, koyu #000. Kod `Screen plain` → `AURA[scheme].ground` (aura.ts:13/54): açık #EFF7F1, koyu #000000 ✓.
- ORTAK-F Alt sekme çubuğu (`.tb` TB2, yalnız 28'de görünür): pano 60 yüksek, kenar 20, alttan 30, iç 5, sekme 50, etiket 10/13 600, aktif sekme açıkta #031B0B + beyaz yazı, koyuda rgba(255,255,255,.94). Kod `AURA.tabBar` (aura.ts:93-114): height 60 ✓, inset 20 ✓, padding 5 ✓, pillHeight 50 ✓, iconLabelled 20 ✓, bottom 12 (+ güvenli alan; panonun 30'u 34 dp alt alanda 18+12 ile tutar → cihaza bağlı, DOĞRULANAMADI).

---

## 28 Mekan · akış kaydırılmış — project/MekanAkisKaydir.dc.html
Kod: `apps/mobile/app/(app)/(tabs)/venue.tsx`, `src/features/venue/VenueHead.tsx`, `src/features/venueFeed/FeedView.tsx`, `PostRow.tsx`, `src/theme/venueFeed.ts`, `src/theme/venue.ts`
Öğe sayısı: 40 · uyuyor: 24 · fark: 9 · fazla: 3 · doğrulanamadı: 2 · özellik yok: 1 · kural: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Masalar / Akış" bölmeli seçici kaydırılınca üst banta yapışık kalır (`.sbar` içinde, 44 yüksek) | düzen/davranış | bantta: mekan adı küçük + Mekandasın + kimlik anahtarı + ⋮ + seçici | `venue.tsx:226-243` Seg kaydırma içeriğinde (VenueNameRow altında), `top` yalnız `VenueHead`; kaydırınca seçici ekrandan çıkar, bantta yok |
| 2 | Kimlik anahtarı akış görünümünde bantta durur | eksik | `.tog` görünür (Akış seçiliyken de) | `VenueHead.tsx:98` `feed ? null : <IdentityToggle>`; `venue.tsx:187` `feed={view==='feed'}` |
| 2k | (2'ye not) KURAL 4 / §4.Y: "akışta anonim yazılmaz"; anahtar akışta durursa anonim/profilli seçimi akışı etkiliyor gibi okunur; karar proje sahibinin | kural | — | — |
| 3 | ⋮ "Mekan seçenekleri" düğmesi yumuşak yuvarlak | renk/dolgu | `.round.soft` (soft-bg, 1px soft-line, soft-shadow; koyu #121614) | `VenueHead.tsx:109` `glass="clear"` (ORTAK-B) |
| 4 | Kimlik anahtarı halka/opaklık/gövde | ölçü/renk | ORTAK-A: halka dışta 2.5, dolgu yok, kapalı slot .55, gövde surface2 | `KIT.identityToggle` ring 2 içte, beyaz dolgu, dim .45, gövde c.hair (auraKit.ts:803-812; IdentityToggle.tsx:90-137) |
| 5 | Gönderi sahibi adı | yazı | 15/20, 700 (`.ph b`) | `PostRow.tsx:138` `T v="body" strong` = 15/22, ağırlık 600 (kit.tsx:272 `strong` F[600]) |
| 6 | Gönderi metni | yazı | 15/21, 500 (`.tx`) | `PostRow.tsx:74` `T v="body"` 15/22 (auraKit.ts:258) |
| 7 | Beğenilmiş kalp: sayı rengi / simge rengi | renk/koyu | sayı açık #E2456F, koyu #FF7AA6; simge #FF4F8B (`.pa2 .lk.on`) | `PostRow.tsx:72` tek renk `KIT.pink` #FF4F8B (auraKit.ts:668), iki temada ve hem sayıda hem simgede |
| 8 | Gönderiler arası ince çizgi | renk | rgba(3,27,11,.10) / koyu rgba(255,255,255,.10), 52'den 8 geriye | `PostRow.tsx:90-98` `c.hair` (açık .07, koyu .08); ölçü hairLeft 52 / hairRight 8 ✓ |
| 9 | Mert'in gönderisine eklenmiş masa kartı: "Zar Kedisi", "Oyun · 5/12 · Lobide", `Katıl` (btn soft sm), altında "ÖNERİ · masa paylaşımı" | özellik yok | `.shc` 48 resim + iki satır + düğme | gönderide masa alanı yok (`FeedView`/`PostRow`; `@shared/venueFeed.ts`'te masa kolonu yok); pano başlığında ÖNERİ |
| 9k | (9'a not) KURAL 4: "Gönderi masa taşımaz: akış kimseyi bir masaya bağlamaz" (§4.Y); kart masa adı + telefon sayısı + niyet etiketi + Katıl gösterir, gönderi-masa bağı kurar | kural | — | CLAUDE.md kural 4 "Mekan akışı" |
| 10 | Üst band zemini: rgba(255,255,255,.32) + blur 24 + alt maske 22; koyu rgba(0,0,0,.86) | renk/koyu | `.sbar` | `motion/TopBar.tsx:52-75` `BarBand` + `aura.ts:45-49,82-86`: açık rgba(239,247,241,.84) tuval rengi (beyaz .32 değil), koyu rgba(0,0,0,.84) (.86 değil), bulanıklık yok (cam-kapali kararı) → FARK renk |
| 11 | Alt sekme çubuğunun alttan konumu | ölçü | alttan 30 | `AURA.tabBar.bottom` 12 + güvenli alan: ORTAK-F → DOĞRULANAMADI (cihaza bağlı) |
| 12 | FAZLA: "Daha eskiler" düğmesi (`FeedView.tsx:83-104`), yükleme/boş/hata durumları (`FeedView.tsx:54-67`), `actions.note` Banner (`FeedView.tsx:48-52`) | fazla | panoda yok (yalnız dolu liste) | durum ekranları CLAUDE.md gereği; "Daha eskiler" panoda çizilmemiş |
| 13 | FAZLA: gönderi ⋮ menüsü (Sil / Sessize al / Şikayet et) | fazla | menü çizilmemiş (⋮ yalnız simge) | `PostRow.tsx:208-237` |

Not: alt çubuğun yazıları (Keşfet, Aktiviteler, Mekan, Mesajlar, Profil) ve zamanlar ("· 8 dk" … "· 1 sa") tr.ts ile uyuyor (`tr.venueFeed.ageMinutes/ageHours`).

---

## 29 Akışa yaz · boş — project/AkisYazBos.dc.html
Kod: `app/(app)/venue-feed/compose.tsx`, `src/theme/venueFeed.ts` (compose), `tr.venueFeed`
Öğe sayısı: 14 · uyuyor: 5 · fark: 6 · fazla: 3 · doğrulanamadı: 1 · özellik yok: 1 · kural: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Sayfa zemini | renk | `.cz` `var(--surface)` açık #FFFFFF (koyu #000) | `Screen plain` ground #EFF7F1 (ORTAK-E; compose.tsx:94) |
| 2 | Çubuk başlığı "Akışa yaz" | yazı | 17/22, 700 (`.ct`) | `compose.tsx:119` `T v="h3"` 16/22, 600 (auraKit.ts h3) |
| 3 | Metin alanı yazısı | yazı | 19/27, 500 (`.ta`) | `compose.tsx:152` `KIT_TYPE.body` 15/22, 500 |
| 4 | Yer tutucu rengi | renk/koyu | `--placeholder` #56785E; koyu rgba(238,243,240,.45) | `compose.tsx:150` `c.muted` (#4A6550; koyu #A3AEA8) |
| 5 | İmleç rengi | renk | açık #0E8745, koyu #3DDC84 (`.car`) | `compose.tsx:155` `selectionColor={KIT.pink}` #FF4F8B |
| 6 | Karakter sayacı yeri | düzen | altta 56 yüksek araç çubuğu satırının sağında, üstünde 1px çizgi rgba(3,27,11,.08) (koyu .08 beyaz), kenar 16 | `compose.tsx:106-118` `footer`: yalnız sağa yaslı sayaç, üst padding 12, çizgi yok, 56'lık satır yok (`L.footTop` 12) |
| 7 | "Masa ekle" çipi (36 yüksek, çizgili, liste simgesi 18) + yanında `ÖNERİ` etiketi | özellik yok | `.tchip` + `.ob2` | `compose.tsx`'te yok; gönderiye masa eklenemez (sunucu ucu / alan yok); pano başlığında ÖNERİ |
| 7k | (7'ye not) KURAL 4 / §4.Y "Gönderi masa taşımaz" | kural | — | CLAUDE.md kural 4 |
| 8 | Kimlik satırının üstü 18, yan 20 | boşluk | `.who2` margin 18 20 0 | yan 20 ✓ (`screenPadding` 20); üst: `L.whoTop` 18 kullanılmıyor, `Screen.tsx:197` `top` varken `TOP_FADE` = 20 → FARK 20 (pano 18) |
| 9 | FAZLA: fotoğraf yok uyarısı + "Fotoğraf ekle" (`compose.tsx:166-181`), hata Banner'ı, yanıt kipi (`replyTo`) ve sayaç aşımında kırmızı sayaç | fazla | panoda yok | `compose.tsx:166-193`, `:104` |

Uyanlar: "Vazgeç", "Paylaş" (kapalı, 84 en az), "Profilinle paylaşıyorsun", mekan adı satırı, "Mekanda neler oluyor?", "0 / 280".

---

## 30 Akışa yaz · yazılmış, masa ekli — project/AkisYaz.dc.html
Kod: aynı (`compose.tsx`)
Öğe sayısı: 16 · uyuyor: 6 · fark: 6 · fazla: 3 · özellik yok: 3 · kural: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1–6 | Sayfa zemini, başlık 17/22 700, metin 19/27, imleç rengi, sayaç yeri, 56'lık araç satırı ve çizgisi | — | bkz. 29 #1, #2, #3, #5, #6 (yer tutucu rengi yok: metin yazılı) | bkz. 29 |
| 7 | Eklenmiş masa kartı: 48 resim (14 köşe), "Zar Kedisi", "Oyun · 5/12 · Lobide", sağda 36 yuvarlak × kaldır düğmesi (`.rx`) | özellik yok | `.shc` (kenar çizgisi 1px, 20 köşe; koyu #121614) | yok (bkz. 29 #7) |
| 8 | Araç çipi "Zar Kedisi eklendi" (basılı, surface2 dolgu) + `ÖNERİ` | özellik yok | `.tchip.on` + `.ob2` | yok |
| 9 | Sayaç "78 / 280" | metin | araç satırında sağda | `tr.venueFeed.composeCount` ✓ metin; yer FARK (bkz. 29 #6) |
| 10 | KURAL 4 (masa eki gönderiyi masaya bağlar) | kural | — | bkz. 28 #9k |
| 11 | FAZLA | fazla | — | bkz. 29 #9 |

Uyanlar: Paylaş açık (36, birincil, 84 en az), kimlik satırı, metin yazısı içeriği (kod serbest metin).

---

## 31 Mekan sohbeti — project/MekanSohbet.dc.html
Kod: `app/(app)/venue-chat/index.tsx`, `src/components/ChatTopBar.tsx`, `ChatScreen.tsx`, `ChatBubble.tsx`, `Composer.tsx`, `src/theme/chatLook.ts`, `dm.ts`, `nameInk.ts`
Öğe sayısı: 26 · uyuyor: 12 · fark: 8 · fazla: 3 · doğrulanamadı: 3 · özellik yok: 2 · kural: 2

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Duvar kâğıdı | resim | açık blob 02674155 / koyu e72abde7 (PNG 1290×2796, tam ekran, `background-size:cover`) | `ChatScreen wall="mekan"` → `CHAT_WALLS.mekan` üretilmiş SVG deseni, zemin #DDEBE6 / #0A121A (chatWalls.generated.ts); iki blobun depoda karşılığı yok (BLOBLAR.md:13,164 "yok") |
| 2 | Bar altı band: 132 yüksek, #DDEFE2 (koyu #000) %40'a kadar düz, sonra sönük | düzen/renk | `.band` | `ChatScreen.tsx:1258-1267` bandUnderBar: duvar yeniden çizilir (düz renk bandı yok) → FARK, DOĞRULANAMADI derinliği |
| 3 | Üst çubuk altyazısı "14 kişi" | özellik yok | `.nm span` 12/16 | `venue-chat/index.tsx:436-442` yerine canlı nokta + son yazanların yüzleri (`Writers`, :818-851); kodda "kişi sayısı verisi yok" notu |
| 3k | (3'e not) KURAL 4: mekan sohbetinin kişi sayısı hiçbir yanıtta yok (sayı yalnız semt odası üyelerine, Odadakiler); presence yok | kural | — | CLAUDE.md kural 4 |
| 4 | Başlıkta canlı nokta ve yazan yüzleri | fazla | yok | `ChatTopBar.tsx:97-100` `live`, `under={<Writers>}` (belgeli: 8 Kasım kararı, davranis-eksikleri.md:73) |
| 5 | Kimlik anahtarı | ölçü/renk | bkz. ORTAK-A | `chatLook.ts:13` toggle slot 36 pad 3; ring/dim/gövde farkı aynı |
| 6 | ⋮ yuvarlak (dışarıda, `.round.soft`) | uyuyor | 44, moreV 20 | `venue-chat/index.tsx:457-464` Round 44 / ICON.md ✓ |
| 7 | Akıştaki karşı taraf yüzü | ölçü | 40×40 (`.ga` AVBUYUK) | `index.tsx:793` `faceOf(m, AVATAR_SIZE.sm, true)` = 32 (Avatar.tsx:22 `sm: SPACING[8]`) |
| 8 | Gönderen isim rengi | renk | bkz. ORTAK-C | `nameInk.ts` |
| 9 | Okunmamış çizgisi metni | metin | "1 yeni mesaj" (`.new`) | `tr.chat.newLine` "Okunmamış mesajlar" (tr.ts:1009; belgeli: CLAUDE.md "Okunmamış mesajlar çizgisi", 30 Ekim kararı) |
| 10 | "sol-k9p1 yazıyor" + üç noktalı yazıyor balonu | özellik yok | `.typing` (balon 34 yüksek, 3 nokta 8, renkli) | yok; mekan sohbetinde yazıyor kanalı yok |
| 10k | (10'a not) KURAL 9: istemcinin yayın yaptığı tek kanal `dm_typing`; mekan sohbetinde yazıyor göstergesi yeni kanal ister; ayrıca isim + "yazıyor" nick'i yazanı canlı açar | kural | — | CLAUDE.md kural 9 |
| 11 | Mesaj çubuğunda yazı başlangıcı | boşluk | alan iç 6 + yazı 4 = 10 (emojisiz) | `DM.composer.padLeft` 20 (dm.ts:65; yorum: "board draws them after its emoji") |
| 12 | Tepki hapları (`.rx` 30 yüksek, 4/10 iç, 22 yüz, 4 boşluk, altta 4/6, 6 aralık) | uyuyor | — | `dm.ts:18-29` değerler eşit (sayıya eklendi) |
| 13 | Gün hapı "Bugün": 28 yüksek (`.flow .day` height 28, 0 12 iç, 1px çizgi) | ölçü | 28 | `ChatScreen.tsx:1439-1500` + `dm.ts:47` padY 4 + 16 satır + 2×1 çizgi = 26; renk/kenar/12-600/üst 10 alt 8 ✓ |
| 14 | Takı balonu: gradyan #1F7A47→#0E5530, 2px #E8C14A çerçeve, 18 köşe, yaprak | renk/ölçü | `.msg.me.sk` | `setBalloons.ts:66-73` elf: dolgu #07391D→#0E6E4A, köşe 22 (sıkı 6), iç 12/18/12/20, kenar 2 ✓ (altın gradyan çizgi), yaprak yok (köşe süsleri ayrı) → FARK |
| 15 | FAZLA: yanıt şeridi, bilgi Banner'ı, kişi sayfası (Profil/Sessize al/Şikayet/Engelle) | fazla | yok | `index.tsx:468-482`, `:498-555` |

Uyanlar: geri 44, kapsül 52 + başlık 16/20 600 ✓ (`dmName`), "Mekan sohbeti", alan 52 + #FFFFFF/#121614, gönder 52, yer tutucu "Mekana yaz…", balon renkleri #17834D/#146B42, kenarlar, gölge .22 (30,154,92).

---

## 32 Mekan sohbeti · seçenekler menüsü — project/MekanSohbetSecenek.dc.html
Kod: `app/(app)/venue-chat/index.tsx:587-640` (`OptionsSheet`), `src/components/Menu.tsx` / `src/motion/Menu.tsx`
Öğe sayısı: 32 (31'in 26'sı + menü 6) · uyuyor: 12 · fark: 11 · fazla: 3 · doğrulanamadı: 3 · özellik yok: 3 · kural: 3

31'in bütün satırları geçerli (bkz. 31 #1–#15). Menüye özgü:

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Menü biçimi | düzen | ⋮'den büyüyen cam açılır menü: sağdan 12, üstten 112, 292 geniş, 28 köşe, iç 8, gölge `0 18 48 rgba(3,27,11,.22)` | `index.tsx:493-497` alt sayfa (`Sheet title="Mekan sohbeti"`, "Tamam" düğmeli); `KIT.layer.menu*` (292/28/16-8-8/12) kodda var ama burada kullanılmıyor |
| 2 | Satır "Mekandakiler" + sağda "14 kişi" | özellik yok | `.pi` simge (iki kişi) + `.rv` | yok |
| 2k | (2'ye not) KURAL 4: kişi sayısı + kimlerin mekanda olduğu listesi | kural | — | CLAUDE.md kural 4 |
| 3 | Satır "Sessize aldıkların" + sağda "Kimse yok" (kapalı satır, simge opaklık .5) | metin/düzen | satır + değer | `index.tsx:605-621` başlık `T fine ink` "Sessize aldıkların" + "Sessize aldığın kimse yok." (tr.ts:1076-1077: `mutedNone`); satır değil metin |
| 4 | Satır "Sohbet kuralları" | özellik yok | `.pi` bilgi simgesi | yok (belgeli benzeri: davranis-eksikleri.md:65 Masa için "davranışı tanımsız") |
| 5 | Satır içi ayırıcı: 48'den 12 içeri, rgba(3,27,11,.10) | renk | — | `menuHair` (KIT.layer menüsü) kullanılırsa ✓; bu sayfada Menu kullanılmadığı için yok |
| 6 | FAZLA: "Tamam" düğmesi, sayfa başlığı, sessize alınanlar listesi satırı "Sesi aç" | fazla | yok | `index.tsx:588-640` |

---

## 32a Masa kur — project/MasaKur.dc.html
Kod: `src/features/rooms/CreateTableSheet.tsx`, `src/features/rooms/LobbyChoices.tsx` (`CreateLobbyChoices`), `src/theme/tableSetup.ts`, `tr.createTable`
Öğe sayısı: 21 (arka plan Mekan sayfası tek öğe) · uyuyor: 15 · fark: 3 · fazla: 2 · doğrulanamadı: 2 · eksik: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Hızlı satırdaki 3 ek görsel | düzen | Lale Devri, Uğur Nalı, Yıldız Avcısı (seçili Uçan Halı ilk) | `CreateTableSheet.tsx:106-109`: seçilenin temasından listenin ilk üçü (01 Balinanın Feneri, 02 Ay Şişesi, 03 Duman Yılanı…); panonun seçim kuralı belli değil → DOĞRULANAMADI |
| 2 | "Lobide görünsün" anahtarı | renk | bkz. ORTAK-D | `CreateTableSheet.tsx:365` `Switch` |
| 3 | Arkadaki Mekan sayfasında seçici üstünde başını uzatan kanki resmi (`.pk2`, blob da480976, 128 geniş) | eksik | `.segw .pk2` | `BLOBLAR.md:157` depoda karşılığı "yok"; `venue.tsx`'te yok (Mekan panolarının konusu, burada arka plan) |
| 4 | Sheet zemini | renk | `.mks` açık `var(--canvas)` #EFF7F1 (koyu #121614 ✓) | `auraKit.ts:1183` `layer.light.sheet` #FFFFFF (koyu `:549` #121614 ✓; gölge `0 -8 40 .18` ✓) → açıkta FARK |
| 5 | FAZLA: profil fotoğrafı yok uyarısı ve hata satırı | fazla | yok | `CreateTableSheet.tsx:186-195` |

Uyanlar (ölçüldü, tableSetup.ts ile pano eşit): sheet üstten 60, başlık 21/26 700, alt yazı 13/18, önizleme 214/22 köşe/2px #031B0B kenar, ad hapı 32/14 iç/14-18 700, Rastgele 36/10-12/6/18 simge, ÖNERİ 10/14 700 +.4, "Masa görseli" 15/20 700, "Tümüne bak" 14/18 600 + 16 ok, küçük resimler 3:2/12 köşe/1.5 kenar/8 boşluk, seçili 3 halka 2 uzakta (#0E8745/#3DDC84), satır çizgisi .10, kimlik satırı 40 yüz, "Masayı kur" 56 + kapsül, perde rgba(3,27,11,.42)/rgba(0,0,0,.7) (KIT.layer scrim ✓), metinler harfi harfine.

---

## 32b Masa kur · lobide, niyet — project/MasaKurLobi.dc.html
Kod: `CreateTableSheet.tsx`, `LobbyChoices.tsx:80-205` (`CreateLobbyChoices`)
Öğe sayısı: 27 · uyuyor: 18 · fark: 5 · fazla: 2 · özellik yok: 1 · doğrulanamadı: 1

32a'nın farkları (#1–#5) geçerli (önizleme 150, satır boşlukları 16/14/12 uyuyor). Ek:

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Oyun çipleri listesi | metin/içerik | Vampir Köylü, Signum, Kinshi, Krot, Sprengja, Kaupholl (6 çip, her birinde oyun resmi 32) | `LobbyChoices.tsx:147` `CONCEPTS` = tabu, sohbet, sahtekar, harf, sarki, ibre → adlar Kinshi, Sohbet kartları, Krot, Harf Kapmaca, Şarkıda Geçsin, İbre (`brand.ts:11-18`); dördü panoda yok, dördü kodda fazla; Vampir Köylü, Signum, Sprengja, Kaupholl için `game_tag` değeri yok |
| 2 | Aynı konu, sunucu tarafı | özellik yok | 4 oyun etiketi seçilebilir | `supabase/migrations/20261027090000_table_lobby.sql:22` `rooms_game_tag_check` yalnız 6 eski değer; `rooms.ts:11` CONCEPTS aynı → yeni etiketler migration + `rooms` ucu ister |
| 3 | Çiplerdeki oyun resmi | resim | her çipte | `LobbyChoices.tsx:149-151,172-178` resim yalnız `conceptOf(card)` eşleşen iki oyun için (Kinshi, Krot); diğer dört çip resimsiz |
| 4 | Not satırı | metin/düzen | "Yalnızca lobide görünür; oyunu başlatmaz." her zaman (oyun çiplerinin altında, 12/16) | `LobbyChoices.tsx:203-208` not niyete göre değişir: Sohbet seçilince "Sohbet etmek istiyorsun. Oyun yine önerilebilir." (tr.ts:920) ve hiçbiri seçili değilken yok (FAZLA metin) |
| 5 | "Oyun" / "Sohbet" bölmeli seçici | uyuyor | 36 yükseklik, 4 iç, 4 boşluk, seçili #031B0B | `LobbyChoices.tsx:113-155` ✓ |

---

## 32c Masa kur · masa görseli seç — project/MasaKurGorsel.dc.html
Kod: `CreateTableSheet.tsx:124-168` (`picking`), `PictureGrid` :503-593, `tr.createTable`
Öğe sayısı: 24 (12 kare, 2 etiketli) · uyuyor: 19 · fark: 3 · fazla: 1 · doğrulanamadı: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Alt düğme metni | metin | "Uçan Halı'yı seç" (seçilen görselin adı, 56 yüksek) | `tr.createTable.pick` "Bu görseli seç" (tr.ts:2431; belgeli davranis-eksikleri.md:75 "ek yok"; `inflectTr` ile yapılabilir) |
| 2 | Kare sırası | sıra | seçili ilk, sonra Lale Devri, Uğur Nalı, Yıldız Avcısı, Demli Sohbet*, Zar Kedisi*, Bulut Şatosu, Güve Senfonisi, Kâhin Küresi, Uçan Ada, Mum Üfle, Geyik Ateşi (*başka masada) | `CreateTableSheet.tsx:519` `TABLE_ICONS` liste sırası (01-fener …); seçili başa alınmaz |
| 3 | Geri düğmesinin kimliği | davranış | — | `:136` `testID="table-icon-pick"` iki yerde (:136 ve :306) tekrar eder (ölçüt: kimlik tekil) |
| 4 | Tema çipleri | fazla | yok | `:524-541` yalnız birden çok tema olunca çizilir; bugün tek tema ("Masa") → görünmez |
| 5 | Alt yazı satırı "55 görsel · soluk olanlar mekandaki başka bir masada" | uyuyor | — | `pictureCount(55)` ✓ (55 görsel) |

Uyanlar: geri yuvarlak, başlık 21/26 700, 2 sütun 12 / satır 14, ad 6 altında, onay 20 + 14 tik, "Başka masada" etiketi 8/24/9, soluk .35, seçili halka.

---

## 33 Masa · dolu — project/Masa.dc.html
Kod: `app/(app)/room/[id].tsx`, `src/features/rooms/TableScene.tsx`, `PosterCard.tsx`, `src/theme/room.ts`, `tr.table`, `tr.venue`
Öğe sayısı: 36 (bar 4, kart: resim, 12 yüz + ok, not, 2 düğme; "Oyunlar" başlığı, 7 kart + 7 oynat rozeti) · uyuyor: 24 · fark: 6 · fazla: 5 · doğrulanamadı: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Kapsülün ikinci satırı | metin | "12/12 · Lobide" | `tr.table.status` = `${seats} · ${tr.venue.lobbyOpen}` → "12/12 · Lobide açık" (tr.ts:2294, 2329) |
| 2 | Kart düğmelerinin yüksekliği | ölçü | 40 (`.tb2 .btn`) | `room/[id].tsx:452-471` `Btn sm` = 36 (belgeli, davranis-eksikleri.md:65) |
| 3 | Oyun kartlarında beyaz oynat rozeti (52×42, sol üst) | eksik | `.pl` ×7 | `PosterCard.tsx` `GameCard` rozet yerine köşe etiketi (belgeli, davranis-eksikleri.md:65 ve :66) |
| 4 | Sohbet düğmesi | fazla | okunmamış rozeti yok | `room/[id].tsx:435-441` `badge={unread}` (durum, pano çizmemiş) |
| 5 | Yüzlerin yanındaki ok simgesi | ikon | yol `M9 5.5l6.5 6.5L9 18.5`, çizgi 2.6, 18 | `TableScene.tsx:216` `forward` (capIcons.generated.ts:117) iki dikdörtgen, çizgi 3.2, x 5.8–18.4 → FARK şekil/kalınlık |
| 6 | "Masa dolu…" notu | uyuyor | — | `tr.table.fullNote` harfi harfine ✓ |
| 7 | FAZLA: tek kişilik masa kartı `table-solo` | fazla | yok | `room/[id].tsx:610-615` |
| 8 | FAZLA: test botları (yalnız dev) | fazla | yok | `:616` |
| 9 | FAZLA: "oyun sürüyor" geri dön kartı, hata satırı, gelen istek kartı | fazla | yok | `:607-609`, `:617-618`, `:483-499` |
| 10 | Pano tutarsızlığı: "7 oyun" 7 kart (Kibrit dahil); `MasaSecenek` panosunda "7 oyun" yazıp 6 kart çizili | not | — | kod 7 kart (GAME_CARDS) |

Uyanlar: kenar 16, kapsül 52 yüksek 18 iç, ad 16/20 700 + 12/16, kart 28 köşe/8 iç/12 alt, resim 136/22, yüz satırı 24 + 2 halka + yüz boşluk, not 8/8, düğmeler 12/4/8, "Oyunlar" 18/24 700 + "7 oyun" 13/18, 126 yüksek kartlar 12 boşluk, kart kenar rengi, koyu kart #121614 + .08 kenar.

---

## 34 Masa · seçenekler menüsü — project/MasaSecenek.dc.html
Kod: `app/(app)/room/[id].tsx:545-569`, `src/components/Menu.tsx`, `KIT.layer.menu*`
Öğe sayısı: 41 (33'ün 36'sı − 1 oynat rozeti seti + 6 menü) · uyuyor: 29 · fark: 6 · fazla: 5 · doğrulanamadı: 1

33'ün #1–#10'u geçerli (bkz. 33). Menüye özgü:

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Masadakiler" satırının sağ değeri | eksik | "12 kişi" (`.rv` 14/18 muted) | `room/[id].tsx:547-552` değer yok (belgeli, davranis-eksikleri.md:65) |
| 2 | Menü geniş 292, sağdan 12, 28 köşe, iç 16/8/8, satır 48, simge 22, boşluk 14, çizgi 48'den | ölçü | — | `KIT.layer menu*` (auraKit.ts:1259-1271) ✓ uyuyor |
| 3 | "Masayı bitir" kırmızı | uyuyor | `.pi.dg` danger | `negative` ✓ |
| 4 | Menünün üst kısmında `.pt`/`.pbar` (kalan süre çubuğu) CSS'te tanımlı, HTML'de yok | not | — | kodda da yok ✓ |
| 5 | FAZLA: katılımcının menüsü ("Masadan ayrıl" kırmızı) | fazla | yok | `room/[id].tsx:561-566` |

---

## 35 Masadakiler · sheet — project/Masadakiler.dc.html
Kod: `src/features/rooms/RoomPeople.tsx`, `tr.table`, `theme/room.ts` (`people`)
Öğe sayısı: 36 (perde, sheet, tutamaç, başlık, alt yazı, 12 satır × yüz + ad, sahip etiketi, 11 "At", not) · uyuyor: 24 · fark: 5 · fazla: 3 · doğrulanamadı: 1 · özellik yok: 0

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Satırdaki düğme metni ve ölçüsü | metin/ölçü | "At" 13/16 700, 28 yüksek, 9–10 iç, `--danger-soft`; erişim adı "… kişisini masadan at" | `RoomPeople.tsx:171-180` "Çıkar" (tr.ts:2403), `Btn sm variant="danger"` 36 (belgeli, davranis-eksikleri.md:65: K-88) |
| 2 | Sheet yan iç boşluğu | ölçü | 16 (`.msh` padding 10 16 34) | `KIT.size.sheetPadX` 20 (auraKit.ts:1043; sheet 10/20/34) |
| 3 | Dar ekranda tek sütun | davranış | iki sütun sabit | `RoomPeople.tsx:90` `perRow = narrow ? 1 : 2` (CLAUDE.md 320 dp; belgeli) |
| 4 | Satıra basınca kişi sayfası (Profil, Şikayet, Çıkar, Engelle) | fazla | yok | `RoomPeople.tsx:213-269` (başka panonun konusu olabilir: MasaKisiSecenekler) |
| 5 | Sahip satırı "Sen / Masa sahibi" (11/14 600 yeşil) | uyuyor | — | `roomOwner` 11/14, `VENUE[scheme].here.ink` ✓ |
| 6 | Sheet zemini: açık beyaz, koyu #121614, perde .42/.70, gölge | renk | `.msh` | `auraKit.ts:1183,549,1164,1210,1185` eşit → uyuyor |

Uyanlar: başlık 21/26 700, alt yazı "Uçan Halı · 12/12 · Masa dolu" (`peopleSub`), not "Herkes kendi telefonuyla katılır. Masada en çok 12 kişi olur." 12/16 (`peopleNote`), iki sütun 10 boşluk (pano 12; `P.colGap` 10 — pano `.msh .ml{column-gap:10px}` ✓), yüz 32, ad 13/17 600, satır 10 üst/alt, 7 boşluk, çizgi 40'tan.

---

## 36 Masana davet et sayfası — project/MasaDavet.dc.html
Kod: `src/features/rooms/InvitePage.tsx`, `app/(app)/room-invite/[id].tsx`, `SettingsPage`, `tr.invite`, `theme/room.ts` (`invite`)
Öğe sayısı: 23 (geri, başlık, alt yazı, not, 5 satır × yüz + ad + eylem, ayırıcılar) · uyuyor: 18 · fark: 1 · fazla: 3 · doğrulanamadı: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Sayfa zemini | renk | `.pg` `var(--surface)` açık #FFFFFF | `SettingsPage` → `Screen plain` #EFF7F1 (ORTAK-E; SettingsParts.tsx:152-168) |
| 2 | FAZLA: masa doluyken uyarı kutusu, arkadaşlar yüklenmedi/boş durumları | fazla | yok | `InvitePage.tsx:96-141` |
| 3 | FAZLA: davet hata satırı | fazla | yok | `:200-204` |
| 4 | Geri yuvarlak (44) + başlık 12 boşluk, 52 üst, 16 kenar | uyuyor | `.ptop` | `settings.ts:9` barTop 5 (+47), barSide 16, barGap 12, round 44 ✓ |

Uyanlar: başlık 21/26, alt yazı "Uçan Halı · 7/12" (`tr.invite.sub`), not harfi harfine (`how`), satır 48 en az / 8 iç / 12 boşluk, çizgi 56'dan 8 geriye, yüz 44, ad 16/20 600, "Davet et" 36 birincil 96 en az, "Gönderildi" + tik 18 yeşil (#0E8745/#3DDC84), 4 boşluk, muted 14/18.

---

## 37 Masa sohbeti · boş — project/MasaSohbet.dc.html
Kod: `app/(app)/room-chat/[id].tsx`, `src/features/chat/ChatPanel.tsx:300-345`, `ChatEmptyCard.tsx`, `ChatTopBar.tsx`, `Composer.tsx`, `chatLook.ts`
Öğe sayısı: 13 · uyuyor: 6 · fark: 1 · fazla: 1 · özellik yok: 4 · doğrulanamadı: 1

| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Mesaj yer tutucusu | metin | "Masaya yaz…" | `tr.chat.placeholder` "Mesaj yaz…" (tr.ts:955; `RoomComposer` ChatPanel.tsx:498-510) |
| 2 | ⋮ menü yuvarlağı (sağ, 44) | özellik yok | "Masa sohbeti seçenekleri" | `room-chat/[id].tsx:93-96` yorum: "has no options to open" (belgeli) |
| 3 | Öneri çipleri: "Selam masa! 👋", "Hangi oyunu açalım?", "Ben hazırım" (36 yüksek, kartın altında) | özellik yok | `.sug` | `ChatPanel.tsx:326-327` "not drawn (no behaviour is given them)" (belgeli) |
| 4 | Mesaj alanında emoji düğmesi (40) | özellik yok | `.fld .ib` | yok (`dm.ts:62-64` "the app has not") |
| 5 | Yazı başlangıcı | boşluk | 6 + 40 + 2 + 4 = 52 | `DM.composer.padLeft` 20 (emoji düğmesi olmadığı için; ayrı karar) |
| 6 | Duvar resmi | resim | blob 520a563c (açık ve koyu aynı, 900×1950) | `room-chat/[id].tsx:70-72` `TABLE_CARD_TALL[icon]` (masanın uzun riso kartı); blobun depodaki karşılığı BLOBLAR.md:49 "yok", eşit mi → DOĞRULANAMADI |
| 7 | FAZLA: yanıt şeridi, not Banner'ı | fazla | yok | `ChatPanel.tsx:498-510` |

Uyanlar: geri yuvarlak 44, kapsül 52 (başlık "Masa sohbeti" 16/20 600, "Uçan Halı · 12 kişi" 12/16), boş kart ("Masada henüz mesaj yok" 16/22 700, "İlk mesajı sen yaz. Masadaki 12 kişi görür." 13/18; resim 150 geniş, 70 yukarıda, 40 yandan, 72 üstte; zemin #FFF/#121614), gönder 52, band yok ✓ (masa için `bandUnderBar` kapalı).

---

## Kapsam (güncel: açılan bileşenler ölçüldü)

| pano no | öğe sayısı | fark sayısı | doğrulanamadı | okundu |
| --- | --- | --- | --- | --- |
| 28 | 40 | 10 (+1 özellik yok, +1 kural) | 1 (sekme çubuğu alt konumu, cihaz güvenli alanı) | evet |
| 29 | 14 | 7 (+1 özellik yok, +1 kural) | 0 | evet |
| 30 | 16 | 6 (+3 özellik yok, +1 kural) | 0 | evet |
| 31 | 26 | 10 (+2 özellik yok, +2 kural) | 0 (tepki hapları uyuyor) | evet |
| 32 | 32 | 13 (+3 özellik yok, +3 kural) | 0 | evet |
| 32a | 21 | 4 (+1 eksik resim) | 1 (hızlı satır seçim kuralı panoda yok) | evet |
| 32b | 27 | 6 (+1 özellik yok sunucu; sheet zemini 32a #4) | 0 | evet |
| 32c | 24 | 4 (sheet zemini dahil) | 0 | evet |
| 33 | 36 | 7 | 0 | evet |
| 34 | 41 | 7 | 0 | evet |
| 35 | 36 | 5 (sheet zemini uyuyor) | 0 | evet |
| 36 | 23 | 1 | 0 | evet |
| 37 | 13 | 1 (+4 özellik yok) | 1 (duvar resmi içeriği blob 520a563c; yalnız resim) | evet |

Kalan DOĞRULANAMADI: 4 (alttan sekme çubuğu konumu; hızlı satır seçim kuralı; Masa sohbeti duvar resmi içeriği; 28'deki kapsamı aynı). Güncellemede ölçülenler: üst band renkleri (FARK), gün hapı 26/28 (FARK), takı balonu (FARK), tepki hapları (UYUYOR), açık sheet zemini #FFFFFF/#EFF7F1 (FARK; Masadakiler UYUYOR), Masa ok simgesi (FARK), SettingsPage üst satırı (UYUYOR), Akışa yaz kimlik satırı üst 20/18 (FARK).
