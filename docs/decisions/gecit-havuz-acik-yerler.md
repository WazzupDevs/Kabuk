# Geçit soru havuzu, Skall Semti ve Skall Üniversitesi (27 Kasım 2026)

Proje sahibinin kararları (sohbette, 27 Kasım). PR A (sunucu) uygulandı: migration `20261227090000_gecit_pool_open_places.sql`, testler `supabase/tests/gecitPoolOpenPlaces.test.ts`; PR B (uygulama) sırada. Değişmez kural 6'ya (ve 4, 10'a) dokunduğu için sunucu PR'ı proje sahibinin sohbetteki "onaylandı"sıyla ve `guvenlik` denetiminden sonra birleşir.

## Kararlar

1. **Geçit soru havuzu.** Günlük takvim yerine bir kez yüklenen havuz (100–200 soru). Sunucu her gün havuzdan daha önce sorulmamış bir soruyu kendisi seçer; gün içinde herkese aynı. Sorusuz gün olmaz.
2. **Havuz bitince** en uzun süre önce sorulan soru yeniden sorulur; yükleme betiğinin `--status`'u kalan sorulmamış soru sayısını yalnız yöneticiye yazar ve 14 günden az kalınca uyarır.
3. **Yanlış cevap:** o gün kapanmaz. Yanlış cevaplayan 1 saat sonra yeni soru alır; hak sınırsız. Günün 1., 2., 3., … soruları herkese ortak sıralı sorulardır (kişiye özel değil: havuzu çok hesapla toplamayı zorlaştırır, havuz yavaş tükenir). Doğru cevap hiçbir telefona gitmez.
4. **Skall Semti:** konum istemeyen, herkese açık tek semt. Geçit sorusu yine sorulur (bir kez geçen hem kendi semtine hem Skall Semti'ne girer). Herkese, gerçek semtinin yanında seçenek olarak görünür; semt dışındaki ve konum izni vermeyen de girer. `locate` onu hiçbir zaman bulmaz; Skall Semti'ndeki oturum konumla kapanmaz.
5. **Skall Üniversitesi:** konum doğrulaması olmayan, herkesin check-in yapabildiği tek mekan; masa, oyunlar, mekan sohbeti ve akış normal mekan gibi (kural 4 değişmez). Keşfet listesinde şehir ve tür süzgecinden bağımsız en üstte. Haritada görünür: noktası gerçekten Irak'ta (proje sahibinin kararı, 27 Kasım, "keyfi öyle"; Erbil, 36.1912 K, 44.0094 D). Haritada iğnesi skall işareti (iki kapsül, `src/components/Mark.tsx`). Haritanın açılış çerçevesi (`ExploreMap.tsx` → `venueBounds`) bu noktayı saymaz; yoksa harita Türkiye ile Irak'ı birlikte gösterecek kadar uzaklaşır.
6. **Semte Git üretimde açılır** (`DISTRICT_VISIBLE` kalkar), havuz üretime yüklendikten sonra.
7. Görünüş: var olan parçalarla (Atölye taslağı yok). Kaupholl'a bu işte dokunulmaz.

## Plan (mimar, 27 Kasım)

**PR A, sunucu** (eski uygulama bozulmadan çalışır):

- Migration: `gecit_pool` (id, prompt, options, answer, `last_asked_on`; RLS açık, politikasız, istemciye kapalı); `gecit_questions` anahtarı `(day, slot)`, `pool_id`; `gecit_answers` anahtarı `(user_id, day, slot)` ve `created_at`; `private.gecit_pick(day, slot)` (yalnız service role; sorulmamış rastgele, bitince en eskisi). `districts.open boolean` (halka yalnız açık semtte boş olabilir); `district_enter`'e `target_district_id` (boşsa kendi semti). `venues.open_checkin boolean default false`; `explore_venues` bu kolonu döner.
- `district` fonksiyonu: `state` soruyu `gecit_pick`'le seçer, `question.slot`, `retryAt` (son yanlış + 1 saat); `answer { day, choice, slot? }` (slot'suz eski gövde kişinin o anki sorusunu kullanır; beklerken `gate_closed`, eski slot `question_expired`); `enter { ref? }`; `state.openDistrict`. `pure/gecitSamples.ts` → `sampleFor(day, slot)` (dev).
- `checkin` fonksiyonu: `locationCheckFor(user, venue)` açık mekanda `'skipped'`; açık mekanda koordinat ve konum onayı isteğe bağlı, sahte konum reddi ve `venue_contains` atlanır.
- Yükleme: `scripts/admin/gecit.ts` dosyası `[{prompt, options, answer}]` (gün yok; tekrar reddedilir), `admin-gecit-import.ts` havuza ekler, `--status`.
- İçerik: `content/districts.json` → `{ ref: "skall-semti", name: "Skall Semti", open: true }`; `content/venues-pilot.json` → Skall Üniversitesi `openCheckin: true`; seed betikleri ve testleri.
- Belgeler: SPEC_V4 §4.V güncellenir, yeni §4.AA Skall Üniversitesi; CLAUDE.md kural 4 (semt: Skall Semti kişinin semtini söylemez; havuz ve sayısı hiçbir istemciye gitmez), kural 6 (üçüncü istisna: Skall Üniversitesi ve Skall Semti konum almaz), kural 10 (Geçit gün danışma kilidi → `gecit_pool` → `gecit_questions`, başka kilit tutulmadan).
- Entegrasyon testleri: `district.test.ts` (aynı günde iki eşzamanlı `state` tek soru, `locks`; sorulan soru tekrar seçilmez, havuz bitince en eskisi; yanıtta cevap ve sayı yok; yanlış → `retryAt`, beklerken red, süre geçince farklı soru ve doğru cevap girişi açar; slot'suz eski gövde; konumsuz kişi Skall Semti'ne girer; `locate` Skall Semti'ni döndürmez ve oradaki oturumu kapatmaz; son yere iki giriş), `checkin.test.ts` (açık mekana koordinatsız check-in geçer, öbürüne `bad_request`; uzak ve sahte konum açık mekanda reddedilmez), `explore.test.ts`; `reviewAccount.test.ts` ve `checkinSkipLocation.test.ts` değişmeden geçer.

**PR B, uygulama** (A dev'e gittikten sonra; `mobil` ajanı, yalnız `apps/mobile/` ve `e2e/visual/`): `DISTRICT_VISIBLE` kalkar; `DistrictCard.tsx` ve `flow.ts`'te Skall Semti satırı her zaman (konum istemez, `enter { ref }`); kapalı ekran `retryAt`'e sayar; check-in ekranı `venue.openCheckin`'de konum istemez ve koordinatsız gönderir; `useExploreVenues.ts` açık mekanı en üste koyar. Native değişiklik yok, OTA.

**Yayın sırası (üretim, proje sahibi):** A'nın migration'ı ve fonksiyonları → `pnpm admin:gecit-import` ile havuz → B'nin OTA'sı. Havuz yüklenmeden B gönderilmez.

**Kabul edilen riskler:** eski istemci açık mekanı görür ama kendi 300 m kontrolü yüzünden check-in yapamaz (OTA'ya kadar); günün ortak 2. ve sonraki soruları sohbette yayılabilir.
