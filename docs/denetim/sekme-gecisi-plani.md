# Sekme geçişi paketi: uygulama planları

Kaynaklar: `docs/denetim/performans-2026-11.md` (bulgular) ve `docs/denetim/olcum-protokolu.md` (ölçüm).

İlke: animasyon kaldırılmaz. Aynı görünüş ve hareket daha az işle çizilir. Her madde ayrı PR'dır ve önce/sonra ölçümü protokolle yapılır. Sıra B4 (bu PR) → B2 → B6 → B5 → B3 → B7 → B1/B12'dir. K1–K11 proje sahibinin kararı olmadan uygulanmaz.

## B2 — Sekme açılışında odak React state'i olmaktan çıkar (M, OTA)

- **Durum (4 Kasım):** 1. ve 2. adım yapıldı. `lib/tabOpenings.ts` sekmenin ömrü boyunca tek nesnedir; `Reveal` → `openings` açılışı dinleyip native sürücüde oynar. Sekmenin ekranı açılışta yeniden çizilmez, yalnızca Dissolve'un `run`'ı TabScene'i çizer. 3. adım yapılmadı: ekran kaydırılmışsa 8'den sonraki satırlar görünür olabilir, onları tekrar oynatmamak görünüşü değiştirir. 4. adım ölçüme bırakıldı: sekme geçişinde artık satırlar çizilmiyor, memo yalnızca tür seçiminde kazandırır.

- **Ne:** `TabScene`'deki (`src/components/TabBar.tsx`) `{focused, opened}` state'i her focus ve blur'da bütün sekmeyi yeniden çiziyor; Keşfet'te `replay` bütün satırları JS'te yeniden çizip ~43 animasyonu birden başlatıyor.
- **Adımlar:**
  1. Blur'daki ve sayfa ya da üst ekran kapanınca çalışan `setFocus` kaldırılır. `focused` alanını okuyan yer yok (önce grep ile doğrulanır).
  2. `opened`, kimliği sabit, abone olunabilir bir değere taşınır: sekme başına küçük bir dinleyici kümesi. `TabFocusContext` artık sabit bir nesne taşır, değer değişince context değişmez. `Reveal` ve `Screen` → `cascade` dinleyiciden `p.setValue(0)` + `start()` ile tekrar oynatır; React commit'i olmaz.
  3. Keşfet'te ekran dışındaki satırlara (`index >= görünen + stagger.max`) replay verilmez. Bunlar görünmediği için görünüş aynıdır.
  4. `VenueList` satırları memo'lu bileşene ayrılır, `onPress` id ile verilir.
- **Dokunulmayanlar:** veri sorguları, Realtime, oda ve masa akışı. Değişiklik yalnızca hareketi tetikleyen yoldur.
- **Regresyon:** sekmeye ilk açılışta, sekmeye dönüşte, sayfa kapanınca (Bildirimler, Ayarlar) kademenin oynamadığını ve hareketi azaltta hiç oynamadığını bir birim testi (dinleyici kümesi saf modül) ve elle bakış denetler. Kademenin zamanlaması `MOTION`'dan okunmaya devam eder (`aura.test.ts`).
- **Ölçüm:** protokolde `Kademe` kapalı ile Hepsi açık arasındaki fark B2'nin üst sınırıdır. Hedef, Hepsi açık'ın `Kademe` kapalı'ya yaklaşması (JS p95).
- **Geri alma:** tek PR'ın revert'i, OTA.

## B6 — Gizli sekmeler saat ve yoklamayla çizilmez (S, OTA)

- **Ne:** sekmeler bilinçli olarak canlı tutuluyor (#279), ama gizliyken de `useNow` 30 ve 60 sn'de, `explore_venues` dakikada bir, `RoomWatch` 4 sn'de bir çalışıyor.
- **Adımlar:**
  1. Ekran düzeyinde `useNow(ms, isFocused)`. `useNow` zaten `active` alır ve geri gelince hemen okur. `EventTag` kendi zamanlayıcısı yerine `now`'ı prop olarak alır.
  2. `useExploreVenues`: `refetchInterval: focused ? 60_000 : false`, odaklanınca bayatsa bir okuma. Aktiviteler aynı sorguyu kullanıyor, iki odak birleştirilir (biri açıksa yoklama sürer).
  3. `RoomWatch` en son ve ayrı commit'te ele alınır, çünkü masadan atılma ve masanın kapanması için yedek yoldur. Gizliyken 4 sn yerine örneğin 15 sn olur, Realtime aboneliği değişmez, sekmeye dönüşte hemen bir kontrol yapılır. Ölçüm kazanç göstermezse bu adım yapılmaz.
- **Dokunulmayanlar:** Realtime kanalları ve abonelikleri, gelen kutusu ve rozet sorguları, masa sorgusu. `subscribed: isFocused` kullanılmaz (dönüşte commit'i geçiş anına taşır).
- **Regresyon:**
  - Mekan gizliyken ikinci telefondan masadan atılma ya da masanın kapanması, dönüşte doğru görünmeli (`tableModel` akışı, gece E2E'si).
  - Keşfet'e dönüşte etkinlik etiketlerinin süresi güncel olmalı.
- **Ölçüm:** React DevTools Profiler'da Profil açıkken 2 dk boyunca ExploreScreen ve VenueScreen commit'i olmamalı. Supabase API logunda Mesajlar açıkken 3 dk boyunca `explore_venues` çağrısı olmamalı (bugün tahminen 3). Protokolün tekrar akışında JS p95.
- **Geri alma:** revert, OTA.

## B5 — Gelişin başlangıç değerleri blur'da hazırlanır (S, OTA)

- **Ne:** `p` bir önceki gelişten 1 kalıyor ve focus dinleyicisinde 0'a çekiliyor. Arada bir iki kare ekran net görünüp sonra saydamlaşabilir.
- **Adımlar:** blur'da, başka bir sekmeye geçiliyorsa (`leftTab`) `p.setValue(0)` yapılır; Reveal'lerin başlangıç değeri de B2'nin dinleyicisiyle aynı anda sıfırlanır. Focus'ta yalnızca `start()` çalışır. Native tetikleme (`onAttachedToWindow`) ancak ölçüm ilk karede sıçrama gösterirse yapılır, ayrı ve yeni build ister.
- **Bağımlılık:** B2'den sonra yapılır; aynı dinleyiciyi kullanır.
- **Dokunulmayanlar:** hareketin eğrisi, süresi ve mesafesi. Sayfa ve üst ekran dönüşünde geliş oynamaz (bugünkü davranış).
- **Regresyon:** sekmeden bir sayfaya gidip dönünce ekran saydam kalmamalı. Hareketi azaltta `p` hep 1 olmalı.
- **Ölçüm:** animatör ölçeği 10x ve 60 fps ekran kaydıyla dönüşün ilk kareleri sayılır: net kare ve ardından saydamlaşma olmamalı. Protokolde `Geliş` kapalı ile fark.
- **Geri alma:** revert, OTA.

## B3 — Arkadaşlık olaylarında yalnızca değişen sorgular okunur (M, OTA)

- **Ne:** `friendKeys.all` (`['friends']`) liste, istekler, geçmiş, gelen kutusu, bildirimler ve açık DM'in bütün sayfalarının önekidir. Her arkadaşlık olayı (bu olayın yayını ve 8 çağrı yeri) hepsini yeniden okutuyor.
- **Adımlar:**
  1. `friends/queries.ts`'e tek bir saf eşleme eklenir: `invalidateFor(event)` → anahtar listesi. Örnekler:
     - `friendRequest` → incoming, incomingChat, notifications.
     - `friendshipChanged` → list, inbox, history.
     - "Arkadaş ekle"/"Geri al" → history.
     - İstek yanıtı → incoming, list, inbox, notifications.
  2. DM anahtarı (`friendKeys.dms`) hiçbir arkadaşlık olayında geçersiz kılınmaz: DM, `dm:{thread_id}` kanalı ve `refreshDm` ile tazelenir. Arkadaşlık bitince `pruneDmCache` bugünkü gibi çalışır.
  3. Çağrı yerleri (`TableEnd`, `RequestList`, `historyActions`, `notifications`, `people/[publicId]`, `venue-chat`, `messages/[threadId]`) bu eşlemeyi kullanır.
- **Dokunulmayanlar:** sunucu, yanıtlar, kural 5'in sessizliği (bastığın ya da geri aldığın şeyi karşı taraf hiçbir biçimde görmez), Realtime yayınları. Yalnızca istemcinin neyi yeniden okuduğu değişir.
- **Risk ve regresyon:** dar anahtar bir ekranı bayat bırakabilir. Eşleme saf modüldür ve her olay için hangi ekranın tazelendiğini bir vitest testi sabitler.
  - İki telefonla elle denenir: istek gönderme ve kabul (Mesajlar listesi, zil), arkadaşlıktan çıkarma (Mesajlar'dan kaybolma, DM önbelleğinin silinmesi), Masa bitti'de karşılıklı ekleme (bildirim ve "Arkadaşsınız").
  - Entegrasyon testleri sunucu tarafında değişmez.
- **Ölçüm:** "Arkadaş ekle"ye basış başına Edge Function çağrısı (Supabase Invocations; tahmin 8–10, hedef 1–2). DM açıkken gelen istekte `dm_messages_page` çağrısı (hedef 0).
- **Geri alma:** revert, OTA.

## B7 — Sekmeler boşta önceden kurulur; bellek maliyeti ayrıca ölçülür (S, OTA)

- **Ne:** Aktiviteler, Mekan, Mesajlar ve Profil ilk basışta kuruluyor ve sorguları gelişle aynı anda gidiyor. Bu maliyet her sekmenin yalnızca ilk açılışında ödenir.
- **Bellek:** bugün sekmeler bir kez açıldıktan sonra zaten canlı tutuluyor (#279). Önceden kurma, oturum boyunca açılmayacak sekmelerin maliyetini de baştan öder. Tahmin: sekme başına JS heap'te birkaç MB (React ağacı ve sorgu verisi), native tarafta görünüm ağacı. Görünmeyen sekme çizmez, ama kurulan resimler (riso, kapsül) bellekte kalır.
  - Önce ölçülür: `adb shell dumpsys meminfo app.kabuk.mobile` ile soğuk açılıştan 10 sn sonra (a) bugünkü hâl, (b) bütün sekmeler elle bir kez açılmış hâl. Fark, önceden kurmanın üst sınırıdır. Düşük sınıf cihazda PSS ve Graphics satırları ayrıca yazılır.
  - Fark düşük sınıf cihazda belirgin yüksekse (ör. 40 MB'tan çok) yalnızca veri ön çekimi (`prefetchQuery`) yapılır, ağaç kurulmaz.
- **Adımlar:**
  1. Açılış perdesi ve Keşfet kademesi bittikten sonra, `InteractionManager` ya da boşta zamanlayıcıyla, sırayla ve aralarında bekleyerek Aktiviteler ve Profil için `prefetchQuery`.
  2. Bellek ölçümü izin verirse `navigation.preload` ile sekme ağaçları sırayla, her biri ayrı karede kurulur.
  3. staleTime genel olarak değiştirilmez. Realtime'la tazelenen sorgular (inbox, friends) için ayrı bir öneridir (B10).
- **Dokunulmayanlar:** Mekan sekmesinin masa yönlendirmesi (`tabOpenedBy`). Mekan önceden kurulmaz, çünkü masa varken başka ekran açar.
- **Regresyon:** soğuk açılış süresi (perde) uzamamalı. Ön kurma açılış perdesinden sonra başlar; Sentry'de açılış hatası olmamalı.
- **Ölçüm:** protokolün ilk açılış akışı (ilk p95, jank) ve basıştan içeriğe kadar kare sayısı (ekran kaydı).
- **Geri alma:** revert, OTA.

## B1 ve B12 — Native cam ve Dissolve (M ve S, yeni build, gerçek cihaz bulgusuna bağlı)

Bu iki madde, protokol düşük ya da orta sınıf cihazda şunu göstermeden yapılmaz: `Buzlu`, `Bulanma` ya da `Cam` kapatılınca tekrar p95'i ya da jank oranı belirgin düşüyor, ya da Perfetto'da geçiş sırasında RenderThread `DrawFrame` uzuyor. Bulgu yoksa bu maddeler kapanır.

- **B1:**
  1. `LiquidGlassView`, `drawnAt` yerine camla hedef arasındaki farkı saklar; fark değişmediyse yeniden kaydı atlar.
  2. Dissolve koşarken içindeki camlar son resmi gösterir, bitince bir kez yeniden çizilir.
  3. `DissolveView`, `RenderEffect`'i yarıçapı yuvarlayarak önbellekte tutar.
     Üçü de görünüşü değiştirmez.
- **B12:** `GlassTargetView`'da `Rect`'ler alan olarak yeniden kullanılır. Kirli alanlar kare başına bir kez birleştirilir. `dispatchDraw`'da bütün camlar yalnızca çocuklar değiştiyse geçersiz kılınır. Pay, sabit 48 dp yerine gerçek taşmadan hesaplanır.
- **Dokunulmayanlar:** camın bulanıklığı, doygunluğu, örnek alanı ve renkleri (`TAB_GLASS`). `SEEN` eşiği ve bar camının seyreltilmesi K3'tür, proje sahibinin kararıdır.
- **Regresyon:** cam ve Dissolve ekran görüntüsü önce ve sonra aynı olmalı (görsel kapı gece koşusu), yazma alanının camı klavyeyle doğru güncellenmeli, kaydırmada cam bayatlamamalı.
- **Yayın ve geri alma:** tek native build'de toplanır (`app.json` → `version` artar, `.claude/skills/yayin`). Geri alma önceki APK ya da revert ile yeni build'dir. Bu yüzden her native değişiklik bir JS anahtarıyla gelir (ör. `glassSkipUnchanged` prop'u); sorun çıkarsa OTA ile kapatılır.

## Karar bekleyenler

K1–K11 (`performans-2026-11.md` → Karar gerekenler) uygulanmaz. K1'in sorusu (dönüşlerde kademe ve bulanıklık), protokolde `Kademe` ve `Bulanma` kapalı ölçümü çıktıktan sonra rakamla birlikte proje sahibine sorulur.
