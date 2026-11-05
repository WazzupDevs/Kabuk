# İlerleme

## Devir notu (5 Kasım 2026, Signum ekranları)

- #472 kelime havuzu (`content/signum-words.json`, 279 kelime, `docs/decisions/signum-kelimeler.md`); bu PR Signum ekranları (Aura v87, 13 pano `Signum*`, rapor `docs/design/aura/aktarim-signum.md`): `features/games/signum/` (SignumGame, SignumParts), `lib/signumGame.ts`, `theme/signum.ts`, `api.ts` → `signumApi`. `games.json`'da `signum.available: false`.
- Bilerek yok: karo 180° dönüşü (raporda onay bekliyor). Rakibin işareti gösterilmez (kural 3). Raporda çizilmeyen dört yerde uygulanan öneriler (proje sahibince onaylı): kara karttan sonuca "Sonucu gör" düğmesi; açanın adı yerine takım adı ("Pembe takım … kartını açtı"; açık durum açanı tutmuyor); süs kankileri ve kapsül aşamaları Kinshi'ninkiler; kaptansız biten oyunun metni.
- Karo kelimeleri yazıldığı gibi (büyük harf yok; en geniş 36,97 px / 37). Görünüm önbelleği oturuma bağlı (`signumViewKey`). Dört öneri proje sahibince onaylı (5 Kasım). Açmadan önce: cihazda 320 dp ve en büyük yazı. Sonra ayrı PR'la `signum.available: true` ve `pnpm seed`.

## Devir notu (5 Kasım 2026, Krot ekranları)

- Krot ekranları (Aura v86, 13 pano): `features/games/sahtekar/KrotGame.tsx`, `KrotParts.tsx`, ölçüler `theme/krot.ts`; `sahtekar.available: true` + seed. Kinshi'nin çubuk, kapsül, deste ve kankileri ortak: `features/games/riso/`, `theme/riso.ts`. Kararlar `docs/decisions/krot-ekranlar.md`.
- Yayın: önce dev projesine #464 migration'ı, `sahtekar` fonksiyonu ve seed, sonra OTA. Native yok; cihazda denenmedi, görsel kontrol proje sahibinde.
- Proje sahibinin kararları ayrı PR'da: 1 oy düğmesi "1/2 şüpheli seç"; 2 Hazırım rol gösterilince açılır (#475'te karşılandı); 3 oyun sonunda tahminin tutup tutmadığı (tahmin metni saklanmaz); 4 6–12 oyuncuda iki sıra.

## Devir notu (5 Kasım 2026, Kaupholl)

- Onaylı kurallar ve plan: `docs/decisions/kaupholl.md` (v3.1 son hâl; açık karar yok, kurallar artık değişmez). #460 riso görselleri (`kauphollArt`), #474 gizli içerik kapısı (PR 0: `pnpm guard:secrets`, `docs/OPS.md` → Gizli içerik kapısı) birleşti.
- Sıradaki: **PR A**, yalnızca saf mantık `supabase/functions/_shared/pure/kaupholl.ts` + vitest (§7 "PR A"): tahta, C3 oranları, kazanan, puan, aşama makinesi (otomatik kesinleşme), `seq` kuralları, `publicState`/`viewFor`, soru seçimi ve gevşetme (masada tekrar yok, `questions_exhausted`), zor sorunun yeri, Türkçe sayı. Migration, fonksiyon, SPEC ve ekran yok.
- Sonra PR B (sunucu, SPEC 4.6.10 adayı: numara o gün main'de yeniden denetlenir), PR C (özel depolarda içerik), Aura farkları (§6), en son Prompt 3. Her PR birleşmeden önce proje sahibine kontrol sonuçları bildirilir.
- Açık iş: `supabase/tests/sahtekar.test.ts` → "ends the game without results when an impostor leaves" ara sıra düşüyor (sahtekâr sahip seçilince `leave-game` → `bad_request`); düzeltme yalnızca testte.

## Devir notu (5 Kasım 2026, Sprengja içerik ve dev doğrulaması)

- Birleşenler: #473 (harf grubu v3, 96 grup 40/36/20, `content/sprengja-letter-groups.json`; seed dev'e uygulandı), #478 (`pnpm latency:sprengja` bot masası; D-1–D-6 `docs/decisions/4.6.8-sprengja.md`, sonuçlar `4.6.8-sprengja-dev.md`: altısı geçti, Realtime p90 841 ms ölçütü az aşıyor). Dev'de `sprengja-explode` kapalı, `is_available: false`; ikisini açmak proje sahibinde.
- Sıradaki paket (3): Aura'da Sprengja panoları önce tuvalde güncellenir (canlı tuval `project/Sprengja*.dc.html`, 10 pano): halka 3–8 kişi, "Atışlar · n", "HARF GRUBU" (`SprengjaHece`), devralma, ortak kazanan, yarıda kalma, son turda "Sonuçları gör". Sonra `tuval-aktarim` ile ekranlar.
- Paket 4 (saha testi raporu) saha testinden sonra; `yol` ve `tut`'un atış süresi ayrıca izlenir (O-15).

## Devir notu (5 Kasım 2026, Kibrit sunucusu)

- #461 görseller (`features/games/kibrit/kibritArt.ts`), #465 SPEC Adım 4.6.9 ve K-86 (kural 3, 7, 10 ekleri; kart "Yakında"), #476 sunucu: `20261201090000_kibrit.sql`, `functions/kibrit`, `pure/kibrit.ts`, `tests/kibrit.test.ts`. `games.json`'da `kibrit.available: false`.
- API: `kibrit/start { rounds? }`, `view` (kendi kâğıdı ve oyu, `paperRev`/`voteRev`), `write { step, rev, text }`, `draw`, `to-vote`, `vote { step, rev, target }`, `skip`, `ready`, `next`, `advance`; bildirim `safety/report { target: 'kibrit_paper' }`. Açık durum `readKibritState`, sonuç `readKibritResult` (`lastGame.kibrit`).
- Sıradaki: Kibrit ekranları (Prompt 3: Aura v90, kararla değişen panolar SPEC 4.6.9 "Görünüş" tablosunda), proje sahibinin onayı gelince. Sonra ayrı PR'la `kibrit.available: true` ve `pnpm seed`.
- Açık: yanlışlıkla açılan `claude/kibrit-sunucu-v2` dalı silinmeli (proje sahibinin izni); `scripts/seed/signum.test.ts`'in 500 tahtalık testi 5 sn sınırına yakın, CI'da arada düşüyor.

## Devir notu (5 Kasım 2026, Sprengja sunucu motoru)

- Birleşenler: #454 (riso görselleri, `sprengjaArt`), #466 (motor, adım 4.6.8, K-85: `20261129090000_sprengja.sql`, `functions/sprengja`, `pure/sprengja.ts`, `tests/sprengja.test.ts`; kararlar `docs/decisions/4.6.8-sprengja.md`). Dev'e gitti; `sprengja-explode` cron işi kapalı, `available: false`.
- Sıradaki paketler, her biri ayrı PR, bu sırayla: (1) harf grubu içeriği (#473 ile birleşti): onaylı 96 grup, 40 kolay / 36 orta / 20 zor (bitişik dizi sıklığıyla, mastar eki hariç), `public.cards` deck `sprengja` (`word` grup, `theme` kademe), `content/` + seed; (2) dev doğrulaması D-1–D-6 (pg_cron sürümü, boşta ve yükte performans, maliyet, arka plan ve bağlantı dönüşü), `pnpm latency` Sprengja ölçümü ve bot masası, rapor proje sahibine, cron'u açmak onun onayıyla; (3) Aura ekranları (Prompt 3): 3–8 kişilik halka, bomba hareketi, devralma, ortak kazanan, yarıda kalma, son turda "Sonuçları gör", panolar önce Aura'da; (4) saha testi (ilk iki oyun ön kontrol; denge: oyuncu sayısı başına iki grup × üç oyun) ve rapor.
- Kurallar ve sınırlar SPEC_V4 → "Adım 4.6.8: Sprengja" ve K-85'te; harf grubu kademelerinin listesi proje sahibinin onayladığı v3 belgesindedir (sohbette, repoda değil: yeni oturuma eklenmeli).
- Bu ortamda yerel Supabase: imajlar `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` ile; Edge runtime npm indirmesi için proxy sertifikası eklenmiş yerel imaj ister.

## Devir notu (5 Kasım 2026, Krot sunucusu)

- #464 Krot kişi bazlı sunucu (4.6.3): `20261130090000_sahtekar_v4.sql`, `functions/sahtekar`, `pure/sahtekarGame.ts`, `tests/sahtekar.test.ts`; kararlar `docs/decisions/4.6.3-krot.md` (dört teknik karar proje sahibince onaylı). Hazırım, Söyledim ve oy yalnızca saat işlerken sayılır (`turn_over`). Kural 3 ve 10'a dokunduğu için birleşme proje sahibinin "onaylandı"sını bekler; Krot ekranları bu PR birleşince başlar.
- API: `sahtekar/start`, `view` (rol: player/impostor/watcher/null), `ready`, `said`, `vote { targets }`, `guess { text }`, `advance`; açık durum `readSahtekarState`, sonuç `readSahtekarResult` (`lastGame.sahtekar`). `games.json`'da `sahtekar.available: false`.
- Sıradaki: Krot ekranları (CTO promptları → Prompt 2; Aura v86 "Krot (gizli kart ve şüpheli sırası)" satırı ve `Krot` panosu canlı tuvalden; görseller `sahtekar/krotArt.ts`; kapsül, deste, kanki ve üst çubuk `kinshi/KinshiParts.tsx`). Sonra `sahtekar.available: true` ve `pnpm seed`. "Bir koltuk seç" etiketi proje sahibi karar verene kadar korunur (rapor açık soru 1).

## Devir notu (5 Kasım 2026, Kinshi 320 dp: iki satır ve skor hapı)

- Birleşenler: #463 (deste ölçeklenir), #468 (tahminci paneli sayaçlara binmez), bu PR (proje sahibinin kararları: uzun kelime iki satır, skor hapı dar hâlde; `docs/decisions/kinshi-320dp.md`). OTA, native yok.
- 3-2-1 kankileri ve Oyun sonu konfetisi 320 dp'de: sahne yatayda bütün olarak ölçeklenir (`kinshiScene`); yalnızca konum oranlamak binişi dört katına çıkarırdı.
- #469: 320 dp'de Hayvanat bahçesi ve Emniyet kemeri 22'de çerçeveden 0,13/0,22 dp eksik; proje sahibinin kararı A (olduğu gibi, cihazda doğrulanacak kabul istisnası; `docs/decisions/kinshi-320dp.md`). Hap −120…120 için boşluk daraltma ve gerekirse alt satır.
- Telefonda bakılacak (cihaz yok, hiçbiri denenmedi; testlerin modeli RN yerleşimini kanıtlamaz): 320 dp ve en büyük yazıda beş rol; iki satırlı kartlar (Hayvanat bahçesi 320/390, Pazar kahvaltısı 320) ortada mı, iki kartta çerçeve; hap 99/99, −99/−99 (alt satır), 100/100; tahminci paneli uzayınca sayaçlar.

## Devir notu (5 Kasım 2026, Kinshi ekranları bitti)

- Birleşenler: #456 (Kinshi tabu düzeni, Aura v85: Takımlar, Tur öncesi, 3-2-1, Anlatıcı, Tahminci, Rakip, Gözlemci, Tur sonu, Oyun sonu; `features/games/kinshi/`, ölçüler `theme/kinshi.ts`, koyu açılış `DarkGameScope`; poster `kinshi` → oyun `tabu`, `PosterCard.tsx` → `conceptOf`; `tabu.available: true` + seed), #458 (Aura v94: açıkta dolu takım yüzeyi `TEAM_FILLS` #6A47F5/#D02860, sahip olmayanların Tur sonunda salt okunur sayı hapı). Takım renkleri her yerde tuvalinki (SPEC_V4 §4.2).
- Yayın: önce dev projesine #451/#453 migration'ları, `tabu` fonksiyonu ve seed, sonra OTA. Native yok; cihazda denenmedi, görsel kontrol proje sahibinde.
- Bilerek yok: kartın Doğru/Pas/Yasak! çıkış hareketleri (`hareket.json`'a girince ayrı PR). Çizilmemiş: kart yükleniyor/bağlantı hatası (bugün `Loader` ve ortak hata). 320 dp ve en büyük yazı: deste ekranla ölçeklenir (`kinshiDeck`, `docs/decisions/kinshi-320dp.md`); Anlatıcı ve Gözlemci görüntüsü proje sahibinin telefonunda.
- Oturumun seçtikleri (proje sahibi telefonda bakar): zaman kapsülü üç kademe (Tur öncesi ve 3-2-1 dolu, tur yarım, son 10 sn az); tahmincinin panelinde son üç kelime en yenisi üstte.

## Devir notu (5 Kasım 2026, Kinshi tabu düzeni)

- Birleşenler: #446 (Kinshi riso görselleri `assets/games/kinshi/`, `features/games/kinshi/kinshiArt.ts`), #451 (Kapsül Anlat kişi bazlı sunucu, 4.6.1: `20261126090000_kapsul_anlat.sql`, `functions/tabu`, `pure/tabuGame.ts`, `tests/tabu.test.ts`; kararlar `docs/decisions/4.6.1-kapsul-anlat.md`). Yayın önce sunucu; istemci değişmedi.
- Sıradaki paket: CTO promptları → Prompt 2, Kinshi ekranları (Aura v85, "Kinshi (tabu düzeni)" satırı ve `Kinshi` panosu, 11 ekran; kabul raporu proje sahibinde). Repoda yalnızca eski `Kinshi.dc.html` var; v85 panoları canlı tuvalden okunur. Ekranlar gelince `content/games.json` → `tabu.available: true` ve `pnpm seed`.
- Proje sahibinin kararları (5 Kasım), aynı PR'da: Tur sonu 30 sn ve son turdan sonra da Tur sonu (`20261127090000_kapsul_anlat_tur_sonu.sql`, SPEC_V4 §4.6.1), `tabu_local_deck` silindi, kart görselleri 888×1184 WebP q90 (4,3 → 1,2 MB).

## Devir notu (5 Kasım 2026, Vampir Köylü kapsül masa)

- #448: Vampir Köylü kapsül masaya geçti (Aura v83, K-84; gerekçe `docs/decisions/vampir-kapsul-masa.md`, kaynak `docs/design/vampir/kapsul-masa/`). OTA, native yok; cihazda denenmedi, görsel kontrol proje sahibinde.
- Masa görseli `scripts/art/vampirScene.ts` ile üretilir (`vampirScene.test.ts` hash'i denetler); oda görselleri tasarımın `arka-plan-masasiz/` PNG'lerinden aynı betikle (repoda PNG yok).
- Açık: VampirRolKarti, VampirGunduz, VampirEleme panoları yeni dile çevrilmedi (kabul raporu açık soru 6); 320 dp, en büyük yazı, açık tema ve yükleniyor/hata hâlleri tuvalde çizilmedi.
- Tasarımın tanımlamadığı ve oturumun seçtiği yerler (proje sahibi telefonda bakınca onaylar ya da düzeltir): gece seçimleri küçük yüzle, ortada en çok 1 + 3 aday, ikiden fazla kazanan 30'luk yüzle, Gündüz/Eleme madalyonunun yeri.

## Devir notu (5 Kasım 2026, Keşfet tüm şehirler)

- Keşfet varsayılanı "Tüm şehirler" (K-38 değişti, `SPEC_V4` §4.C); eski saklı şehir seçimi okunmaz (`placeStore` `v: 2`, anahtar aynı). Hush Coffee ve Yedegör Dürüm kapatıldı (`venues-test.json` `isActive: false`). OTA + seed; native yok.

## Devir notu (4 Kasım 2026 akşam, açık işler bitti)

- Birleşenler: #434 (devir notu), #436 (ci `integration`'da `pnpm gen:types` + `git diff --exit-code database.ts`; #430'un elle hizalaması biçim farkıydı, düzeldi), #440 (masa ve mekan sohbetinde açık eski sayfalar silinen mesajda ve değişen tepkide yeniden okunur, `useOlderPages` → `reread`; OTA, cihazda denenmedi), #442 (canlı tuvalin Kapsul/KapsulKoyu panolarına 8.1 işlendi).
- Bu container'da Docker açılıyor (`dockerd`) ama imajlar inmiyor (Docker Hub 429, ECR CloudFront 403): yerel stack yok, şemaya CI bakar.
- Oturumun yapabileceği açık iş kalmadı. Proje sahibinde: üretim yayınları (iki drop migration), 6.2 boş durumu ve K-83 paleti tuvale, C2/C3 (oyunların yeni hâli).

## Devir notu (4 Kasım 2026, sekme geçişi paketi)

- Denetim `docs/denetim/performans-2026-11.md`; sekme geçişi paketi sıranın önünde. Önce B4 birleşti (Çizim ölçümü: `Buzlu`, `Bulanma`, `Geliş`, `Kademe`, `Cam` ayrı ayrı kapanır, Geçiş ölçümü p95/takılma; OTA, üretimde etkisiz).
- B2: sekme açılışı ekranı yeniden çizmiyor (`lib/tabOpenings.ts`; OTA). Önce/sonra ölçümü: bu PR'dan önceki OTA'da ve sonrakinde protokolün tekrar akışı (JS p95); `Kademe` kapalı sayısı B2'nin üst sınırıydı.
- B6: gizli sekmede saatler ve Keşfet yoklaması durur, dönüşte gelişten sonra bir kez yetişir (`lib/tabActivity.ts`; OTA). `RoomWatch` ölçüme bırakıldı.
- B5: geliş, giden sekme gizlenince hazırlanıyor; dönüşün ilk karesi gelişin ilk karesi (`LEAVE_PREPARE_MS`; OTA). Native adım yapılmadı.
- B3: arkadaşlık olayları yalnızca değiştirebildiği sorguları okur, DM sayfalarını hiç (`lib/friendRefresh.ts`; OTA). İki telefonla istek, kabul, çıkarma ve Masa bitti eşleşmesi denenmeli.
- Sıradaki: proje sahibi `docs/denetim/olcum-protokolu.md`'yi düşük ve orta sınıf Android'de koşar; rakamlarla B6 → B5 → B3 → B7 → B1/B12 (`docs/denetim/sekme-gecisi-plani.md`), her biri ayrı PR, önce/sonra ölçümlü. B1/B12 yalnızca cihaz bulgusuyla; K1–K11 proje sahibinin kararı.

## Devir notu (4 Kasım 2026, temizlik B ve C bitti)

- Birleşenler: #413 (B: tr §2.2'nin 84 anahtarı, AURA'nın bulut verisi ve `table`'ı, `game-card/` ve okunmayan dört poster), #415 (`nearby_venues`, `venue_distance_m`), #423 (dört eski `private` fonksiyonu), #425 (oyun sürerken ekran açık, `useGameAwake`; OTA, cihazda denenmedi). Sonuçlar `docs/temizlik-listesi.md` → "B'nin sonucu" ve C.
- Üretimde proje sahibinin elinde: `20261122090000_drop_unused_venue_rpcs.sql` ve `20261123090000_drop_unused_private_fns.sql` (uygulama çağırmıyor, sıra önemsiz).
- C2 (`update_required` saplamaları) ve C3 (taraf modelinin oyun kodu, SQL'i, `tabu_turns`, `room_used_cards`, önizleme ekranları, `HarfRequest`/`SarkiRequest`): proje sahibinin kararıyla oyunların yeni hâli belli olana dek dokunulmaz.
- Uzaktaki `temizlik-b` dalı proxy yüzünden silinemedi; proje sahibi GitHub'dan siler. Bu container'da yerel Edge Runtime işçi açamıyor (`InvalidWorkerCreation`): entegrasyon testlerine CI bakar.

## Devir notu (4 Kasım 2026, üniversite sohbeti)

- Mekan sohbeti üniversiteye bağlandı (`20261125090000_university_venue_chat.sql`, `SPEC_V4` §4.Q, kural 4 ve 9). Değişmez kurala dokunduğu için birleşme proje sahibinin "onaylandı"sını bekler. Native yok; yalnızca sunucu (migration + `venue-chat` fonksiyonu).

## Devir notu (4 Kasım 2026, İGÜ Gelişim Tower)

- `content/venues-campus.json` → `igu-tower` ("İstanbul Gelişim Üniversitesi", Avcılar): proje sahibinin çizdiği sınır, etkin. Dev'e birleşmeyle gider; içeriden ve 60 m dışından check-in denenmeli. Üretime seed proje sahibinin elinde.

## Devir notu (4 Kasım 2026, bildirim simgeleri, eski mesajlar, masa sohbetinde Bildir/Sil)

- Birleşenler: #428 bildirim çubuğu simgeleri (tür başına `kind`, yamalı `expo-notifications`, renk `--primary`/`--accent`; **native, version 0.9.6, yeni build gerekir**; önce sunucu, §4.S), #429 masa ve mekan sohbetinde eski mesajlar sayfa sayfa (OTA), #430 masa sohbetinde Bildir ve kendi mesajını Sil (migration `20261124090000`, `chat`/`safety`; önce sunucu sonra OTA; `guvenlik` denetledi, §4.T).
- `database.ts` #430'da elle hizalandı (Docker yok); yerel stack'le `pnpm gen:types` çalıştırılıp fark kontrol edilmeli. Cihazda doğrulanmadı.
- Bilinen sınır: eski sayfalardaki tepkiler ve başkasının sildiği mesaj, eski sayfalar açıkken yenilenmez (ekran yeniden açılınca düzelir). **Düzeldi (4 Kasım, `useOlderPages` → `reread`).**
- DM mavisi koyulaştı (`#2670E0`, 4,7:1; `docs/decisions/dm-mavisi.md`). Proje sahibinden beklenen: 6.2 boş durumu ve K-83 balon paleti tuvale.

## Devir notu (4 Kasım 2026, sohbetler ve bildirim simgeleri)

- Birleşenler: #419–#422 (3 Kasım UI paketleri 2–4, 6.3), #424 K-83 balon renkleri spec'i (§4.R), #426 (kendi balon beyaz, başkalarınınki düz renkli ve kuyruklu; `MessagePop` çubuk/menü ölçümden sonra açılır; masa sohbeti okunmamıştan açılır; grup sohbetlerinde gönderilirken saat ikonu). Native yok, OTA; cihazda doğrulanmadı.
- Sıradaki 1, bildirim simgeleri (pano `BildirimSimgeleri`, 3 Kas; native, yeni build): panodaki SVG'ler → `sharp` ile 5 yoğunluk beyaz alfa PNG; config plugin ile `res/drawable-*`; `expo-notifications` yaması (`ExpoNotificationBuilder.icon` push verisindeki tür anahtarından `getIdentifier`); `_shared/pure/push.ts` tür başına anahtar (`guvenlik`); renk `#7B5CFF` → `--primary` (panonun önerisi).
- Sıradaki 2 (onaylı): eski mesajları yükleme (istemci: mekan `page` `before` alıyor, masa RLS okuması `limit(100)`); 3: masa sohbetinde Bildir ve kendi mesajını Sil (sunucu, `guvenlik`, spec).
- DM'de eski mesaja uzun basınca sona atlama (katman açılırken; proje sahibi): `MessagePop` artık listenin satırında değil, `ChatScreen` kökünde (`popHost.tsx`); cihazda doğrulanmadı.
- Proje sahibine sorulan: açık temada DM mavisi 3,9:1 koyulaşsın mı; 6.2 tuvale çizilecek; K-83 paleti tuvale.

## Devir notu (3 Kasım 2026, arayüz hataları paketleri)

- Notlar `docs/ui-hatalar-2026-11-03.md` (#416). Paket 1 #417 birleşti: zemin dibe kadar (`AuraBackground`, `useGroundSize`; kök: dolgulu kökte `height: '100%'`), riso resimlerin kenar şeridi kırpıldı (2.1, 4.1). Native yok, OTA; telefonda kabul bekliyor.
- Paket 2 #419 (1.1, 1.2) ve paket 3 (5.1 Check-in ve Masa kur riso kankiler, 6.1 yasal metin kankisi kırpılır) birleşti; OTA, telefonda kabul bekliyor.
- Paket 4 (3.1 arama ipucu, 3.2 liste/harita yuvarlakları, 7.1 simge halkası, 8.1 kapsül kutusu kalktı + yerel tuval) birleşti; OTA. Canlı tuvalin Kapsul ve KapsulKoyu panolarına 8.1 işlendi (4 Kasım).
- 6.3: adres yokken "Gizlilik politikası" ayrı taslak metni açar (`legal/privacy`; pilottan önce hukuki kontrol). Açık: 6.2 boş durum başlığı, proje sahibi tuvale çizecek; çizilince aktarılır.
- Ders: yerel cam (`LiquidGlassView`) zemin hedefini yalnızca kardeşler arasında arar; `GlassTarget`'ı bir görünümle sarmalama.

## Devir notu (3 Kasım 2026 19:45, temizlik A1–A4)

- `docs/temizlik-listesi.md` (#404) ve paketleri: A1 #405, A2 #407 birleşti; #406 ile A1'in `VenueTags` kırığı #408'de düzeldi. Açık: #409 (A3, tr.ts'ten 232 anahtar) ve #411 (A4, belgeler + bu not); ikisi yeşilse squash birleştir. Native yok, OTA.
- Paket B #413 birleşti (tr §2.2, tema, `game-card`/`game-poster`); `nearby_venues`/`venue_distance_m` proje sahibinin onayıyla migration'la silindi (Paket B2). Sonuç ve `private`'ın çağrılmayan 12 fonksiyonu: `docs/temizlik-listesi.md` → "B'nin sonucu"; eski sürümden kalan dördü (`end_friendship`, `end_two_sided_room`, `owns_session`, `pair_key`) B3'te silindi.
- Ders: paralel PR'lar birbirinin sildiğini kullanabilir (#406 ↔ A1). Silme PR'ını birleştirmeden önce güncel main'i dala al ve `pnpm check`'i yeniden koş.
- Proje sahibinin kararı bekleyen (C): `expo-keep-awake` (SPEC_V3 kullanılır diyor, kod kullanmıyor), `update_required` saplamaları (`MIN_APP_BUILD` sonrası), taraf modelinin oyun kodu ve SQL'i (4.6.x).

## Devir notu (3 Kasım 2026, üniversite ve yerleşke altyapısı)

- `universities` tablosu, `venues.university_id`, `explore_venues`/`venue_contains` güncellemesi (`20261121090000_universities.sql`); Keşfet'te çok yerleşkeli üniversite tek satır + "Yerleşke seç" alt sayfası (`SPEC_V4` §4.Q, `docs/decisions/universite-yerleske.md`). Native yok, OTA; üretimde önce sunucu (migration + seed), sonra uygulama.
- Sakarya Esentepe `sakarya-universitesi`'ne bağlandı, Keşfet'te satırı değişmedi. İGÜ yalnızca üniversite kaydı: yerleşke verisi doğrulanamadı (`docs/yerleske/igu-dogrulama.md`), check-in noktası yok.
- `database.ts` bu ortamda Docker olmadığı için elle hizalandı; yerel stack'le `pnpm gen:types` çalıştırılıp fark kontrol edilmeli. `universities.test.ts` yalnızca CI'da koştu.

## Devir notu (3 Kasım 2026 13:30, E2E yeşil)

- #397 birleşti, E2E sekiz parçada ve görsel kapı yeşil. Kök neden: Modal (alt sayfa, tutulan mesaj) kapanınca odakta kalan alan klavyeyi yeniden açıyordu; DM'nin son mesajını (05b) ve sekme çubuğunu (02) örtüyordu. Düzeltme `src/lib/modalKeyboard.ts` → `useLeaveKeyboard`, her Modal dosyası çağırır (`theme/modalKeyboard.test.ts`). Alt sayfa kesilen kapanışta da çıkar (`sheetSlide.ts`). Native yok, OTA.
- 320 dp'de süzülen sekme çubuğunun altındaki satıra Maestro'nun basışı çubuğa denk gelir: akışta önce `scrollUntilVisible` + `centerElement`.
- Tanı: düşen adımda iş logunda "focused window" ve ekran ağacı (`run-on-emulator.sh`); log `gh api repos/WazzupDevs/Kabuk/actions/jobs/<id>/logs` ile tam çekilir (artifact proxy'den inmez).
- K12/K14 E2E (`e2e-k12-k14`) bu PR'da. Telefonda: K1–K17 kabul turu (proje sahibi).

## Devir notu (3 Kasım 2026, Aura v71 P4, eksik hâller v75, F1 alt alta)

- Birleşenler: #392 Aura v71 P4 (8 pano; K8 `venue_chat_mutes.look` migration'ı, eski kayıtlar doldurulmaz, `guvenlik` denetledi; üretimde önce sunucu), #393 eksik hâller v75 (koyu kayıt sahnesi ve kod kutuları, riso etkinlik kartı, Aktiviteler hâlleri, dar hâl `src/lib/narrow.ts`), F1 dar hâlde alt alta (bu PR). Native yok, OTA.
- Telefonda bakılacak: v76 §11 K1–K17 kabul turu (proje sahibi) ve #392/#393 ekranları; dar hâl 320 dp ya da en büyük yazıda Masa, Keşfet, Aktiviteler, arkadaş profili.
- Açık: Aktiviteler alt solması (ortak `TabBarFade` 32, pano 150) ve eyebrow 17 ayrı iş.
- Not: `invites.test.ts` "the bell" bir kez imzalı foto adresi farkıyla düştü (iki okumada farklı token), yeniden koşuda geçti; tekrarlarsa test adresin sorgu dizesini karşılaştırmamalı.

## Devir notu (3 Kasım 2026, UI hataları P-E…P-I, F1 birleşti)

- Birleşenler: #384 P-E (masa kartı, lobi, Lobiye aç/Masa kur çipleri; SPEC_V4'e yazıldı), #385 P-F Keşfet, #386 P-G (geçmiş sayfası, "Arkadaşlıktan çıkar", büyük foto, şikayet footer), #387 P-I1 ve #388 P-I2 (eski bileşen göçü: ekranlar, oyunlar), #389 F1, #390 P-H riso boş durumlar. Native yok, OTA. Aura v71 P4'ün yeniden kuracağı ekranlar (ReportModal, ConfirmWithReport, UpdateRequired, IdentitySheet, spot, venue-chat/[messageId]) göçe girmedi.
- Telefonda bakılacak: F1 320 dp ve en büyük yazıda sığıyor mu (sığmazsa alt alta hâl tasarım onayı bekliyor), 4.4 koyu haritada etiket yok (stil bu ortamdan okunamadı, 4.2 POI'ler kalktı).
- Sıradaki: Aura v71 P4 (`aktarim-v71-fark.md` fark-2; K8 `guvenlik`); sonra eksik hâller `docs/design/aura/aktarim-v75-eksik-hal.md`: yalnızca karşılaştırma + uygulama + test planı, onaysız uygulama yok; `riso-kayit-koyu.png` ve `riso-etkinlik.png` proje sahibinden istenecek. En son K1–K17 kabul turu (`aktarim-v76-2kasim.md` §11, Android cihazda, proje sahibi).
- Not: ESLint ve Prettier `.claude/worktrees/` altındaki ajan kopyalarını da tarıyor; `mobil` ajanı bitince kopyası `git worktree remove` ile kaldırılmadan `pnpm check` kırmızı.

## Devir notu (3 Kasım 2026, UI hataları P-A…P-D birleşti)

- Proje sahibinin sırası: önce `docs/ui-hatalar-2026-11-02.md` §5 paketleri, sonra Aura v71 P4. #378 belge, #379 P-A (K1: RN `Image` + `absoluteFill` resmi piksel boyunda çiziyordu → `PICTURE_FILL`, `styleGuard.test.ts` yasaklar), #380 P-B (üst düğmeler `Screen` → `top`, Kapsül `HidingHeadScreen`, düzenlemede `useHideTabBar`), #381 P-C (ölçek 48/36/44, koyuda siyah primary gölgesi, sheet içi kart/düğme ayrışır, `RowList` cam kartta), #382 P-D (Composer düz yüzey, alan/gönder/ad kapsülü 44). Native yok, OTA.
- Telefonda bakılacak: 6.4 (lobi boş durumu sekme çubuğu altında kesik mi), Kapsül'ün kaydırınca gizlenen başlığı, K8 (sheet bulanıklığı 0.9.4 build'iyle).
- Sıradaki: P-E (mekan, masa kartı, lobi sayfaları; 15.1–15.2 `SPEC_V4`'e), P-F Keşfet, P-G (17.1 `guvenlik`), P-H boş durumlar riso (önce tuvale çizilir), P-I eski bileşen göçü. Sonra Aura v71 P4 (`aktarim-v71-fark.md` fark-2; K8 `guvenlik`).
- Not: dal silme bu ortamda proxy'den 403 veriyor; birleşen dallar (`ui-p*`, `claude/modest-bell-rss6sb`) GitHub'da elle silinebilir.

## Devir notu (2 Kasım 2026, Aura v71 P2 ve P3 birleşti)

- #374 P2 kayıt: yedi adımın hepsi riso sahne + konuşan/bakan riso kankiler (`SIGNUP_KANKI`, adım başına `fieldTop` ve balon), koyuda nokta accent, "n/7" kalktı, düğme ikonları, Ad `Input big` cam 72, foto seçici 120/kesikli 3, KayitMetinler tek kanki. #375 P3: Arkadaşlar (peek-1), Kapsül karakterler, Hesap, Gizlilik (sayılar kalktı), Bildirim ayarları, Engellenenler (`Screen` `backdrop` köşe kankisi). Native yok, OTA.
- Blob eşlemesi tamam (`aktarim-v71-fark.md` başı): bütün pano kankileri repoda var; `peek-1`/`peek-2` `KankiId`'de.
- Sıradaki P4 mekân ve ortak (fark-2): MekanNoktaDegistir (SpotPicker v71 iki yerde, karar 2), MekanKimlikDegistir, MekanSohbetiProfil ("Geri" sabit alt alan), SikayetEt, EngelleOnay (K6 `Btn danger`), YasalMetin, GuncellemeGerekli, SessizeAlinanlar (K8: yanıta anonim satır için `look`, `guvenlik` denetler; kanki e8ff31→3c95b1).
- Not: Arkadaşlar panosunda geri düğmesi ikonu da accent; `PageTop` ortak olduğu için uygulanmadı.

## Devir notu (2 Kasım 2026, U8 ve Aura v71 P1 birleşti)

- #371 U8 sheet arkası bulanıklık: yeni yerel `BackdropBlurView` (`skall-glass`, PixelCopy ile bir kez küçük kopya, 8 dp; `SheetScrim`), `version` 0.9.4: proje sahibi yeni preview build alacak. Tuval v71 panoları `docs/design/aura/project/`'te.
- Aura v71 "Eklenen 20 ekran" planı onaylı (`docs/decisions/aura-v71-eklenen.md`, 3 karar). #372 P1 ortak bileşenler (Checkbox `boxed`, ConsentBoxes, Choice radyo sağda, Banner warn, Input `box`/`big`, Li/RowList `person`/SettingsRow, Sheet `titleIcon`, kit `stepDot`/`checkInk`, F1–F2). OTA.
- Sıradaki: P2 kayıt (SignupStep: koyu nokta `accent`, `stepDot`, "n/7" kalkar, düğme ikonları, adım başına `fieldTop`; bütün adımlara riso sahne + kankiler; Ad `Input big`; fotoğraf seçici 120/kesikli 3; KayitMetinler), P3 profil ve ayarlar (settings.tsx kendi satırlarını çiziyor), P4 mekân ve ortak (SpotPicker v71 iki yerde, K6 `Btn danger`, K8 Sessize alınanlar kapsül: sunucu yanıtına `look`, `guvenlik` denetler).
- Ayrıntılı fark listesi `docs/design/aura/aktarim-v71-fark.md` (P1 uygulandı, B ve fark-2 kaldı); 6 riso kanki blob'unun repo karşılığı tuvalden doğrulanacak.

## Devir notu (2 Kasım 2026, Aura v65 aktarımı bitti: U36, §13, §14, kararlar)

- #366 U36 hâller (yükleniyor Buluş, hata cloudOff disk + "Tekrar dene" sm soft), #367 §13 (riso kayıt sahnesi, 7 kanki hareketi `kankiMotion.ts`, Telefon/Kod, Masa bitti, Masa isteği), #368 §14 riso açılış (baskı ayrılır, kırpılmış dokular `pnpm launch:textures`), #369 kararlar (`docs/decisions/aura-v65-kararlar.md`). Native yok, OTA.
- Cihazda bakılacak: geniş ekranda açılış parıltısının yan kenarı (kaynak 390 dp'de kesik); açılışta kapsül kırpmasının boyu her karede değişiyor (takılma?).
- Kalan: U8 sheet arkası bulanıklığı (ayrı iş). Rapor 12.8 eksik hâller proje sahibi tarafından tuvale çizilecek; çizilince aktarılır.

## Devir notu (2 Kasım 2026, U29–U35 birleşti)

- #358 U29 DM arkadaşlık sayfası (sheet menüsü: kart sheet kartı rengi, ikon 24, ayraç yazı hizasından), #359 U30 Bildirimler (riso kankiler `peek-1/2`), #360 U31 başkasının profili (`Av` `hero` 120), #361 U32 Profil, #362 U33 Ayarlar (NickCard kit'le), #363 U34 Profili düzenle (`Input boxed`, `Av` `edit` 88), #364 U35 Kapsülün. Native yok, OTA.
- U35: sağ üstteki grid2x2 düğmesi eski işini (karıştır) yapıyor; pano ne yaptığını söylemiyor, proje sahibine soruldu.
- Sıradaki: U36 hâl matrisi (rapor §6; GaleriProfil, GaleriKesfet panoları; `EmptyState` ikonu hâlâ `BRAND.purple`, kural "cloudOff + metin + Tekrar dene btn sm soft"), sonra §13, §14 (karar 12.11 tek soru). Ayrı iş: U8 sheet arkası bulanıklığı.
- Not: `mobil` ajanının worktree'si (`.claude/worktrees/`) kökteki ESLint'i bozar; ajan bitince worktree kaldırılır.

## Devir notu (2 Kasım 2026, U20–U28 birleşti, OTA düzeldi)

- #351–#356: U20 Mekan masalı, U22–U24 Masa/Davet/Masadakiler, U25 Masa sohbeti (duvar uzun riso kart), U26 Mekan sohbeti boş kartı, U27 Mesajlar, U28 DM başlığı ve okundu tiki. Rapor 12.2 kapandı: boş alanda gönder pasif (bütün sohbetler). Native yok, OTA.
- deploy-dev 31 Ekim'den beri OTA'yı bekletiyordu (#338 mobil `package.json`'dan yalnızca JS paket çıkardı); 2 Kasım'da `force_ota` ile elle koşuldu, artık yeşil. Bir daha kırmızı biterse loguna bakılır.
- Sıradaki: U29 DmArkadaslik, U30 Bildirimler, U31–U35 profil, U36 hâller; sonra §13 (kayıt, Masa bitti) ve §14 (açılış, karar 12.11 tek soru). Ayrı iş: U8 sheet arkası bulanıklığı. Panolar canlı tuvalden (`Artifact read`).

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
