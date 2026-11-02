# İlerleme

## Devir notu (2 Kasım 2026, riso görseller repoda, U19/U21 ve masa kimliği birleşti)

- #347: rapor §9.1 riso görselleri, 55 masa kartı ve açılış doku seti repoda (`assets/riso`, `assets/table-cards`, `assets/launch`; `docs/decisions/aura-v65-riso.md`). Zip artık istenmez. #348: U19 Mekan, U21 Seçenekler. #349: K-82, masanın kimliği 55 riso kart (12.6 kapandı; `docs/decisions/masa-kimligi-riso.md`), yayın tohum + OTA.
- Sıradaki: U20 (Mekan masalı kart: `TABLE_CARD_WIDE`, MekanMasali panosu), U22–U24 Masa, U25 masa sohbeti (`TABLE_CARD_TALL` duvar), U26–U36; sonra 7 (kayıt, Masa bitti: `riso/scene-*`, `riso/buddies`), 8, 9 (açılış: `assets/launch`).
- Açık karar: 12.11 (ilk açılışın halka/parıltısı), sırası gelince tek soru.

## Devir notu (2 Kasım 2026, Aura v65 5. aşama: Keşfet ve giriş birleşti)

- #344 (U13–U14 Keşfet liste ve harita) ve #345 (U15–U18 Aktiviteler, mekân sayfası, check-in noktası) birleşti; native yok, yayın OTA. Ortak: glass sm 22, chip iç 12, tag iç 8, `Sec` h3, `EmptyState` h3 + body, tag ok/lively v65, sekme ekranlarında `TabBarFade`, `Round light`, `Tag` `scene`/`sceneCalm`.
- Engelli: harita pin etiketi cam kapsül (GL katmanı), (i) 40 cam (MapLibre'nin kendi düğmesi), sokak adı 600 (yazı sunucusunda yok). Haritada su/ara yol/ray/sınır tuvalin renklerinden türetildi, proje sahibinin onayı bekliyor.
- Sıradaki: rapor §5 U19 (Mekan) → U25, sonra U26–U30 sohbetler, U31–U35 profil, U36 hâller; sonra 6 (riso görseller, masa kartları), 7, 8, 9. Panolar canlı tuvalden (`Artifact read`).
- Proje sahibinin gönderdikleri sohbette (repoda değil; yeni oturumda yeniden istenir): `skall-riso-gorseller-v64.zip`, `masa-karti-webp-1of7…7of7.zip`, `masa-adlari.md`, `acilis-riso-doku.zip`. Açık kararlar: 12.6 ve 12.11 (sırası gelince tek soru).

## Devir notu (2 Kasım 2026, Aura v67 koyu ve U7 birleşti)

- #340: tuval v67 `koyu.css` (koyu `border` #626D68, kontrast istisnası kalktı; `calm` #091F12 ve `featureMuted` #4A6550 onaylı). #341: rapor `docs/design/aura/aktarim-v65.md` (v66–v67'de koyu tema dışında değişen pano yok). #342: U7 alt menü, kapsül ikonlar (compass/calendar/chat/user, Mekân işareti aynı), nokta `buzz`. Yayın OTA.
- Proje sahibinin gönderdikleri tamam (sohbette zip olarak, repoda değil; yeni oturumda yeniden istenir): 55 masa kartı (`yatay/` 2000x1200, `uzun/` 900x1950, `masa-adlari.md`), riso açılış doku seti (22 WebP + README, rapor §14), 30 ikon (#338'dekiyle aynı), wordmark (`wordmark.ts` doğru).
- Kalan: U8 sheet arkası bulanıklığı (ayrı iş). Sıradaki: rapor §5 "Ekranlar" U13–U36 sırasıyla, sonra riso görseller (§9, masa kartları dahil) ve açılış (§14). Yordam `.claude/skills/tuval-aktarim`.

## Devir notu (2 Kasım 2026, Aura v65 aktarımı: Temel birleşti)

- #338 birleşti: aktarım raporunun 1–3. aşamaları (U1–U6, U8–U10): v65 tokenları, `.dark.pA` koyu tema, ölçüler, sheet, sabit alt alan, pasif düğme, tek kapsül ikon ailesi (`docs/design/aura/ikonlar` → `scripts/sistem/capIcons.ts`; Ionicons, çizgi ve çubuk aileleri kalktı). Gerekçe ve türetilen değerler: `docs/decisions/aura-v65-temel.md`. Yayın OTA.
- Kalan: sheet perdesinin 8 bulanıklığı (Modal ayrı pencere, yerel camla örneklenemiyor). Ekran düzeyinde mor kalanlar: `mapStyle.ts` (U14), `nameInk.ts`, `avatar.ts`, `venueScene.ts`, `introScene.ts`, `eventCovers.ts`; ilgili ekran aşamasında.
- Sıradaki: aktarım sırasıyla 4. aşama alt menü (U7, GaleriAltMenu; TabGlyph → compass/calendar/chat/user), sonra ekranlar U13–U36. Yordam `.claude/skills/tuval-aktarim`; v65 CSS'i ve Temel panoları `docs/design/aura/project/` altında, diğer panolar tuvalden (`Artifact read`, v65) okunur.
- Proje sahibinden beklenen: 55 masa kartı ve `masa-adlari.md`, wordmark yolu (zip'te yok), riso açılış doku seti; türetilen koyu `calm` (#091F12) ve `featureMuted` (#4A6550) için onay.

## Devir notu (1 Kasım 2026, 4.8b birleşti)

- 4.8b iki PR'la bitti: #333 (mekan sohbetinin `profiled` alanı kalktı, `identity` zorunlu) ve #334 (`20261119090000_v4_cleanup.sql`; proje sahibi onayladı, `guvenlik`: bulgu yok). Kural 10'dan `game_proposals` çıktı. Native yok; yayın deploy-dev + OTA; üretimde önce #333'ün fonksiyonu, sonra migration.
- Kalan eski model: oyunların taraf SQL'i (`tabu_*`, `sahtekar_*`, `ibre_*`, `say_*`, `open_turn`, `start_voice_tabu`) bırakılan kolonları okuyor; çağrılırsa 500 döner, her oyunun kişi bazlı adımıyla (4.6.x) gider. `requester_headcount` ve `other_headcount` okunduğu için kalıyor.
- Sıradaki: SPEC_V4 sırasına göre 4.6.x (kişi bazlı oyun adımları) ya da cihaz kabulü; yeni oturumda seçilir.

## Devir notu (31 Ekim 2026, 4.8a birleşti)

- 4.8a #331 birleşti (`guvenlik`: bulgu yok): eski modelin okuyanları uygulamadan, fonksiyonlardan, betiklerden ve testlerden çıktı; `scripts/v4-cleanup.test.ts` adları denetler. Migration ve native yok; yayın deploy-dev + OTA.
- Sıradaki: **4.8b** migration (`…_v4_cleanup.sql`, SPEC_V4 §4.H): `game_proposals` ve öneri fonksiyonları, taraf kolonları ve fonksiyonları, dört eski lobi okuması, `table_sessions`/`rooms` eski kolonları, `rooms_end` → `decision_seconds`, `checkin_key`; sonra `pnpm gen:types`, `rooms.test.ts`'teki `rooms_propose_game` satırı. Kural 10 metninden `game_proposals` çıkar → proje sahibinin "onaylandı"sı gerekir.
- 4.8b'den ayrı tutulacak: mekan sohbetinin `profiled` alanı ve `venue_chat_profiled` (0.9.3 öncesi build'ler gönderiyor); `MIN_APP_BUILD` 0.9.3'e çekildikten sonra.
- Oyunların taraf kodu (Sahtekar koltukları, Tabu modları, kapışma hakları) 4.8'de değil, her oyunun kişi bazlı adımıyla (4.6.x) gider.

## Devir notu (31 Ekim 2026, Grup 7 kod tamamlandı)

- Grup 7 (Keşfet ve Ayarlar, aura v51): **kod tamamlandı**: K1 #324, K2 #325, K3 #326, K4 #327, K5 #328, K6 #329 (`guvenlik`: bulgu yok); native yok, yayın OTA. **Cihaz kabulü bekliyor** (kabul raporu §7), son toplu kabulde.
- Cihazda bakılacak yeni seçimler: harita kartında etkinlik etiketi `Tag` amber; Engellenenler/Sessize alınanlar'da anonim kişi `Av` ile nick'in ilk harfi. Ayarlar'da `NickCard` ve `DesignPicker` eski bileşenle (rapor kapsamı dışı). `Btn`'ye `variant="danger"` eklendi (Hesabımı sil).
- Temizlik adım 2–4 zaten birleşmişti (#291–#295). Birleşen `grup7-*` dalları ve eski dallar proje sahibinin bilgisayarından silinir (guard hook uzak dal silmeyi main push'u sanıp durduruyor).
- Sıradaki: Grup 1–7 panolarının kodu bitti; bir sonraki paket PROGRESS ve SPEC_V4 sırasına göre yeni oturumda seçilir.

## Devir notu (31 Ekim 2026, Grup 7 planı onaylandı)

- Grup 7 (Keşfet, aura v51; rapor: kabul raporu §6 ve §9) planı proje sahibince onaylandı. Sıra, her biri ayrı PR, OTA: **K1** boş sonuç nedene göre (saf fonksiyon + vitest; arama → tür → semt, veri yoksa `tr.explore.empty`; §9 metinleri birebir, yalnızca tür metni `tr.ts`'e eklenir; harita aynı fonksiyon) → **K2** harita mekan/yığın kartı aura opak kart (`ExploreMap.tsx:426–489`; `androidView="texture"` korunur) → **K3** 320 dp/1,3x: canlılık ve "Mekana dön" alta (ölçüt 360 dp ya da `fontScale > 1.15`) → **K4** `PlaceSheet` aura → **K5** Ayarlar: `RouteSheet` `footer`'da sabit "Tamam", segment/anahtar mevcut parçalarla (`segOn` ve Masa kur anahtarı token'larına dokunma), menü `cap` → **K6** Ayarlar alt sayfaları aura; Hesap gizliliği korunur, birleşmeden önce `guvenlik`.
- Sınırlar: ortak aura token'ları değişmez (Grup 1, 4, 5, 6 regresyonu yok); Grup 5 çubuğu ve gezinme aynı; Nokta değiştir, Kapsül karakterler, Engellenenler için yeni pano yok, davranış aynı; yeni native, hareket, titreşim, üretim yayını yok. `ci` yeşilse squash; cihaz kontrolleri son toplu kabulde.
- Durumlar: Grup 4, 5, 6 kod tamamlandı / cihaz kabulü bekliyor. Sıradaki: K1 (yeni oturum).

## Devir notu (31 Ekim 2026, Grup 4–6)

- Grup 4 (Masa kur, aura v47): **kod tamamlandı** (M1 #314, M2 #315, M3 #316); **cihaz kabulü bekliyor** (K1–K6, Android 12+ ve altı, açık/koyu, 390 ve 320 dp/1,3x); **ürün olarak tamamlanma** son toplu kabul testinden sonra. Kararlar: docs/decisions/grup4-masa-kur.md.
- Native değişiklik yok, yayın OTA.
- Grup 5 (Alt menü ve geçişler, aura v48): **kod uyumlu** (raporun dokuz referans değeri kodla aynı; çubuk 64 dp, eski panolardaki 70 dp referans değil; koyu disk beyaz %94); yeni kod ve PR yok. **Cihaz kabulü bekliyor**: K1–K8 son toplu kabul aşamasında.
- Grup 6 (Profil, aura v50): **kod tamamlandı** (P5 #318, P1 #319, P4 #320, P2 #321, P3 bu PR); **cihaz kabulü bekliyor** (K1–K7). Kararlar: docs/decisions/grup6-profil.md. Sıradaki: Grup 7 (Keşfet, aura v51) fark analizi ve plan; kod plan onayından sonra.

## Devir notu (31 Ekim 2026, Grup 3)

- Grup 3 kodu main'de: P1 #309, P2+P3 #311, P4 #312, P5 sunucu #310, P5 istemci #313 (outbox, aynı `clientId` ile Tekrar dene, `mergeOutbox` sıralaması). Kararlar: docs/decisions/grup3-mekan-balonlari.md. Sıradaki: Grup 4 (Masa Kur), sonra 5, 6, 7; cihaz kabulü en sonda.
- BEKLİYOR, dev canlı testi: `dev-live.yml` yalnızca main'den elle koşar; koşmadı; `dev-live` ortamı (yalnızca main) ve üç sırrı (`DEV_PUBLISHABLE_KEY`, `DEV_TEST_PHONE`, `DEV_TEST_OTP`) kabul aşamasında kurulacak. Yerel karşılığı `supabase/tests/venueChat.test.ts` ci'da yeşil.
- BEKLİYOR, iki cihaz testi (development build + Metro): bekleyen mesaj varken gelen mesajın sırası, Gönderilemedi, Tekrar dene, Sil, en alta inme oku.
- BEKLİYOR, P1–P6 gerçek cihaz kabulü (iOS/Android, açık/koyu, 390 ve 320 dp/1,3x): proje sahibinde, yapılmadı.
- deploy-dev: OTA, `app.config.ts`'teki yorum değişikliği yüzünden bekletiliyordu; P1–P4 için elle preview OTA proje sahibince başlatıldı, yenisi başlatılmadı.

## Devir notu (31 Ekim 2026)

- Temizlik bitti (#291–#295, #297); saha testi yapıldı (proje sahibi, 31 Ekim), `docs/FIELD_TEST.md`'nin Faz 4 sürümü yazılmayacak.
- Tuval sürüm 35, Grup 1 (Mekan ve lobi) aktarıldı; kararlar `docs/decisions/aura-31.md` sonunda.
- Aura 31 eşitlemesi bitti: (a) #301, (b) #303, (c) #304, (d) #305, (e) Aktiviteler ve ortak boş hâl. Rapor `docs/design/aura/aktarim-31.md`, kararlar `docs/decisions/aura-31.md` (her grubun kararı orada). Açık sorularda bugünkü davranış korundu; satırdan morph ve swap ayrı iş (yapılmadı); Vampir Köylü ve oyun ekranlarına dokunulmadı. Sıradaki iş proje sahibinden.
- Yayın: #300'ün migration'ı ve #301'in `checkin` fonksiyonu (konum rızası `draft-1`, eski `draft-0` de kabul) dev'e otomatik gider; üretimde önce sunucu, sonra OTA. Konum rızasının düğme metniyle verilmesi pilottan önce hukuki kontrole girer. Bekleyen kararlar (proje sahibinde): mekan sohbetinde eski mesajları yükleme (son 50'yi gösteriyor, mesajlar 24 saat duruyor) ve oyun geçmişinde 100 kaydın ötesi (masa başına sayfalama); öneri pilot oyunlarından sonra, 4.8'de.
- Pilottan önce: onay ekranı yayımlanan yasal sayfaya bağlanır ve onay sürümü o zaman artar (bugün `tr.ts` yer tutucu gösteriyor); dev projesinde `auth.audit_log_entries`'te telefon numarası var mı bakılır.
- 0.9.3 build'i proje sahibinde bekliyor; 280 eski dal proje sahibinin bilgisayarından silinir (bulut oturumu dal silemiyor).

Eski M0 ile M7 ilerlemesi: [arsiv/PROGRESS-M0-M7.md](arsiv/PROGRESS-M0-M7.md).
