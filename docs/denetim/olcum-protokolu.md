# Sekme geçişi ölçüm protokolü

Kaynak: `docs/denetim/performans-2026-11.md` (B4). Bu protokol, sekme geçişi paketindeki her değişikliğin önce ve sonra aynı yolla ölçülmesi içindir. Bir değişiklik ölçümle iyileştiği görülmeden birleşmez, B1 ve B12 gibi native değişiklikler de cihazda bulgu çıkmadan yapılmaz.

## Araç

Ayarlar → Tasarım (test) → Çizim ölçümü. Panel yalnızca preview kanalında ve geliştirmede görünür (`DRAW_LAB`). Üretimde hiçbir şey kapanmaz ve ölçüm koşmaz.

- **Geçişte kapat:** her biri tek başına kapatılır, panel kapanınca hepsi açılır.
  - `Buzlu`: düğmelerin, çiplerin ve alanların buzlu camı. Kontrol kendi dolgusunu tutar, Android 12 altındaki gibi.
  - `Bulanma`: sekme gelişindeki Dissolve bulanıklığı. Solma ve yükselme kalır.
  - `Geliş`: TabScene'in solması ve yükselmesi. Bulanıklık kalır.
  - `Kademe`: her açılışta yeniden oynayan ekran kademesi (Screen, Keşfet satırları). Açılışta odak context'i değişmez, altındaki ağaç yeniden çizilmez.
  - `Cam`: sekme çubuğunun ve yazma alanının camı.
- **Geçiş ölçümü:** her sekme açılışından sonra 1010 ms boyunca karelerin aralıkları ölçülür. Bu süre 450 ms gelişle en uzun kademenin toplamıdır (8 × 70 ms). Panel son geçişi UI ve JS için ayrı gösterir: p95, takılma oranı, kaçan kare. Altında son 10 geçişin ekran toplamı görünür. Hesap `src/lib/frameStats.ts` → `switchStats` içindedir:
  - Kare bütçesi ekranın kendi hızıdır (60, 90 ya da 120 Hz), aynı penceredeki en hızlı karelerden (%10'luk dilim) okunur.
  - Takılma, 1,5 bütçeden uzun kare demektir.
  - Kaçan kare, ilk bütçeden sonraki her bütçedir.
- **Zamanlı adımlar (Başlat):** durağan ekran için eski adımlar; `Buzlu düğmeler kapalı` adımı yeni eklendi.

Panelin sayıları UI iş parçacığının (Reanimated kare geri çağrısı) ve JS'in kareleridir, GPU'nunki değildir. Protokolün asıl sayıları `dumpsys gfxinfo`'dan gelir; panel telefonda hızlı bakış içindir.

## Cihazlar ve build

- **Build:** preview kanalının APK'sı, yani release derlemesi (dev client değil). Dev build JS'i birkaç kat ağır çalıştırdığı için ölçüme girmez. Ölçülen build'in numarası ve içerdiği son PR kayda yazılır.
- **Düşük sınıf:** Android 12 ya da üstü (cam ve Dissolve yalnızca orada çalışır), 3–4 GB RAM, Helio G/Unisoc sınıfı yonga, 60 ya da 90 Hz ekran.
- **Orta sınıf:** Android 13 ya da üstü, 6–8 GB RAM, Snapdragon 7 ya da Dimensity 7000 sınıfı yonga, 120 Hz ekran.
- **Telefonu hazırlama:** pil %50'nin üstünde, şarjda değil, güç tasarrufu kapalı, ekran parlaklığı sabit, uçak modu kapalı, Wi-Fi açık. Ölçümden önce arka plandaki uygulamalar kapatılır. Hareketi azalt kapalıdır; animatör ölçeği 1x.

## Akış

Her yapılandırma (Hepsi açık, `Buzlu`, `Bulanma`, `Geliş`, `Kademe`, `Cam`, `Bulanma` + `Buzlu`) için aynı akış koşulur:

1. **İlk açılış (soğuk):**
   - `adb shell am force-stop app.kabuk.mobile` ile uygulama kapatılır, sonra açılır.
   - Keşfet'te 5 sn beklenir, panel açılır ve yapılandırma seçilir.
   - `adb shell dumpsys gfxinfo app.kabuk.mobile reset`.
   - Aktiviteler, Mekan, Mesajlar ve Profil'e birer kez basılır, her basıştan sonra 2 sn beklenir.
   - `adb shell dumpsys gfxinfo app.kabuk.mobile > ilk-<cihaz>-<yapılandırma>-<n>.txt`.
2. **Tekrar (sıcak):**
   - Hemen ardından `dumpsys gfxinfo … reset`.
   - Keşfet → Mekan → Mesajlar → Profil → Aktiviteler → Keşfet döngüsü 4 kez, her basış arasında 1,5 sn (20 geçiş).
   - `dumpsys gfxinfo … > tekrar-<cihaz>-<yapılandırma>-<n>.txt`. Panelin "Son 10 geçiş" satırı da kayda yazılır.
3. Her yapılandırma 3 kez koşulur ve ortanca alınır.

Mekan için hesapta masa olmaması yeğlenir; masa varsa ayrıca yazılır, çünkü masa ekranı başka bir ağaçtır. Hesap ve mekan bütün koşularda aynı kalır.

## Kayda geçen sayılar

`dumpsys gfxinfo` çıktısından:

- `Janky frames` (oran, %): jank oranı.
- `50th`, `90th`, `95th`, `99th percentile`: kare süreleri. Asıl ölçüt p95'tir.
- `Number Slow UI thread`, `Number Slow bitmap uploads`, `Number Slow issue draw commands`, `Number Frame deadline missed`.
- Toplam kare.

Panelden: son 10 geçişin ekran p95'i ve takılma oranı, JS p95'i.

Sonuç tablosu (cihaz başına):

| Yapılandırma | İlk p95 | İlk jank % | Tekrar p95 | Tekrar jank % | Panel UI p95 | Panel JS p95 |
| ------------ | ------- | ---------- | ---------- | ------------- | ------------ | ------------ |

## Okuma

- Bir parça kapatılınca tekrar p95'i belirgin düşüyorsa (bütçenin yarısından çok ya da jank oranında 5 puandan çok), o parça geçişin maliyetidir. B1 ve B12 için cam ve bulanıklık, B2 ve B5 için kademe ve geliş beklenir.
- JS p95'i yüksek ama UI p95'i normalse sorun React tarafındadır (B2, B6). İkisi de yüksekse ya da `Slow issue draw commands` artıyorsa sorun çizimdedir (B1, B12).
- Gerekirse Perfetto ile bir geçişin izi alınır: `gfx`, `view`, `hwui`, `sched`, `freq` kategorileri, uygulama süreci için `atrace_apps`. RenderThread'de `DrawFrame` süreleri, UI'da `Record View#draw()`, JS'te commit dilimleri okunur.

## Kapsül ölçümü (M3 aşama 0; `docs/decisions/skia-build-plani.md`)

Kapsülün çizim yolundaki her değişiklik (T0 taban, T1 OTA düzeltmelerinden sonra, T2 Skia ile) aynı sahnelerle ölçülür. Cihaz hazırlığı ve build kuralı yukarıdaki gibidir; telefon USB ile bağlıdır (`adb`).

- **Cihazlar:** Nothing Phone 1, düşük donanımlı bir Android, bir iPhone (M3 kararı); eldeki başka telefon ayrıca yazılır. iPhone 0.11.0 iOS build'iyle ölçülür (Xcode Instruments: Time Profiler ve Allocations; `adb` satırları orada geçerli değildir).
- **Sahneler** (Ayarlar → Tasarım (test) → Kapsül ölçümü; panel sahneyi sabit aksesuarla çizer, hesabın sahip olduğu aksesuara bağlı değildir):
  1. Büyük kapsül, aksesuarsız.
  2. Büyük kapsül, `kistakimi` (Destansı; 19 SVG görünümü).
  3. Büyük kapsül, `gokkusagiatki` (79 SVG görünümü).
  4. 12 avatarlı ızgara, hepsi `kistakimi`.
  5. Paketler: açılan kart (gerçek ekran; açılabilir paket varsa).
- **Akış, sahne başına:**
  1. `adb shell am force-stop app.kabuk.mobile`, uygulama açılır, sahneye gidilir, 5 sn beklenir.
  2. `adb shell dumpsys gfxinfo app.kabuk.mobile reset`.
  3. Sahne 30 sn açık kalır.
  4. `adb shell dumpsys gfxinfo app.kabuk.mobile > kapsul-<cihaz>-<T>-<sahne>-<n>.txt`.
  5. `adb shell dumpsys meminfo app.kabuk.mobile > bellek-<cihaz>-<T>-<sahne>-<n>.txt`.
  6. Üç koşu, ortanca alınır.
- **Pil:** 2. ve 3. sahne 5 dakika açık bırakılır; önce `adb shell dumpsys batterystats --reset`, sonra `adb shell dumpsys batterystats app.kabuk.mobile` çıktısından uygulamanın tahmini tüketimi (mAh). Telefon ölçüm boyunca Wi-Fi üzerinden `adb`'ye bağlıdır (USB şarj eder, sayı bozulur); olmuyorsa pil ölçülmez ve öyle yazılır.
- **Kayda geçen sayılar:** `gfxinfo`'dan toplam kare, `Janky frames` (%), 50, 90, 95 ve 99. yüzdelik; `meminfo`'dan `Graphics`, `Native Heap`, `TOTAL PSS`; panelden UI ve JS p95'i; pil (mAh). Build numarası ve içerdiği son PR her tabloya yazılır.

| Sahne | Kare p50 | Kare p95 | Jank % | Graphics (MB) | Native Heap (MB) | TOTAL PSS (MB) | Panel UI p95 | Panel JS p95 | Pil (mAh / 5 dk) |
| ----- | -------- | -------- | ------ | ------------- | ---------------- | -------------- | ------------ | ------------ | ---------------- |

- **SVG ve Skia yan yana (T2):** aynı build'de panelin `skia` anahtarı kapalı ve açık, aynı sahneler. Görsel karşılaştırma: paneldeki galeride 15 aksesuar, solda SVG, sağda Skia; fark görülen aksesuarın ekran kaydı gönderilir.
- **Okuma:** 1. sahne tabandır; 2. ve 3. sahnenin 1.'den farkı kare yönteminin maliyetidir. Skia'nın kabulü: 2. ve 3. sahnede p95 ve `Graphics` T1'den kötü değil, en az birinde belirgin iyi (p95'te bütçenin yarısından çok ya da `Graphics`'te %20'den çok); 15 aksesuar göz karşılaştırmasında aynı.

### T0: taban ölçüm (10 Kasım 2026)

- **Cihaz:** Samsung Galaxy S23 (SM-S911B, Snapdragon 8 Gen 2, 8 GB, Android 16, 120 Hz). M3 kararındaki üç cihazdan biri değil, eldeki telefon; Nothing Phone 1, düşük donanımlı Android ve iPhone ölçülmedi.
- **Build:** 0.10.0 (20), preview kanalı; #554'ü (ölçüm sahnesi) içeren güncelleme. 4. sahne #557'yi (12 avatarlı ızgara) içeren güncellemeyle ölçüldü.
- **Koşul:** güç tasarrufu kapalı, animatör 1x, koyu tema, pil %100, USB bağlı. Ham çıktılar `docs/denetim/kanit/kapsul-t0/` (`kapsul-`, `bellek-`, `panel-s23-T0-<sahne>-<n>`; koşudan önce ve sonra ekran görüntüsü). Sayılar üç koşunun ortancası.

| Sahne                    | Toplam kare | Kare p50 | Kare p95 | Kare p99 | Jank % | Graphics (MB) | Native Heap (MB) | TOTAL PSS (MB) | Panel UI p95 | Panel JS p95 | Pil (mAh / 5 dk) |
| ------------------------ | ----------- | -------- | -------- | -------- | ------ | ------------- | ---------------- | -------------- | ------------ | ------------ | ---------------- |
| 1. Aksesuarsız           | 1618        | 5 ms     | 5 ms     | 11 ms    | 1,4    | 80            | 111              | 355            | 8,3 ms       | 8,9 ms       | ölçülmedi        |
| 2. `kistakimi`           | 1699        | 6 ms     | 9 ms     | 15 ms    | 7,5    | 128           | 193              | 508            | 8,3 ms       | 9 ms         | ölçülmedi        |
| 3. `gokkusagiatki`       | 254         | 200 ms   | 200 ms   | 250 ms   | 100    | 239           | 219              | 666            | 125,2 ms     | 123,3 ms     | ölçülmedi        |
| 4. Izgara, 12 avatar     | 1699        | 14 ms    | 21 ms    | 27 ms    | 80,2   | 85            | 476              | 947            | 8,3 ms       | 12,6 ms      | ölçülmedi        |
| 5. Paketler, açılan kart | 0           | —        | —        | —        | 0      | 169           | 180              | 510            | —            | —            | ölçülmedi        |

- **3. sahne:** 30 saniyede 244–264 kare (saniyede yaklaşık 8,5), her kare bütçenin üstünde; panelde ekran p50 116,8 ms. `gfxinfo` 150 ms'nin üstünü 50 ms'lik dilimlerle sayar, 200 ms kaba değerdir. Panelin takılma oranı bu sahnede %0–4,7 gösterir: bütçeyi penceredeki en hızlı karelerden okuduğu için her kare yavaşken yanıltır. Koşudan koşuya `Graphics` 245, 240, 311 MB, TOTAL PSS 619, 682, 752 MB; pil sıcaklığı 27,5 °C'den 36,7 °C'ye çıktı.
- **4. sahne:** "Izgara, 48 avatar" seçilince uygulama iki denemede de ölçüm başlamadan çöktü: `java.lang.OutOfMemoryError`, Java yığını 256 MB sınırında, `com.horcrux.svg` görünümleri kurulurken (`kapsul-s23-T0-4-cokme.txt`). Sahne 48 avatar kurar, protokol 12 der. Bulgu: `docs/denetim/uctan-uca-2026-11.md` → M3-15. Sahne 12 avatara inince (#557) yalnız bu satır yeniden ölçüldü (aynı gün, pil %76–78, kaydırma yok): çökme yok, üç koşuda 1669–1724 kare, p50 14 ms, p95 21–22 ms, jank %78–80,6; karelerin çoğu 8,3 ms'lik bütçenin üstünde ama kare sayısı düşmüyor. `Graphics` 85 MB'ta sabit; `Native Heap` koşudan koşuya 325, 476, 494 MB, TOTAL PSS 946, 976, 947 MB (2. sahnedeki tek büyük kapsülün yaklaşık iki katı). Panelde ekran p95 8,3 ms, takılma %2,4–3,2.
- **5. sahne:** test hesabında üç Bronz paket açıldı. Açılan kart dururken 30 saniyede hiç kare çizilmiyor (üç koşuda 0 kare); bellek tablodaki gibi, panel bu ekranda yok. Protokolde olmayan iki ek pencere: yırtma ve kartın gelişi (Aç'tan sonraki 12 sn, iki koşu) 554–555 kare, p50 6 ms, p95 10–11 ms, p99 20–25 ms, jank %0,7–1,3 (`kapsul-s23-T0-5-acilis-<n>.txt`); kart sürüklenerek çevrilirken (10 gidiş geliş, tek koşu) 2378 kare, p50 8 ms, p95 11 ms, p99 16 ms, jank %1,8, `Graphics` 175 MB (`kapsul-s23-T0-5-cevirme.txt`).
- **Pil:** ölçülmedi (telefon USB ile bağlıydı).
- **Sapma:** 2. sahnenin ilk koşusundan birkaç saniye önce başka bir uygulamanın bildirimi düştü (ekran görüntüsü başka uygulamanın bildirim metnini taşıdığı için depoya konmadı); sayıları öteki iki koşudan ayrışmadı. Ölçüm betiği her koşuda Ölç'e de basar, `gfxinfo` penceresi panelin 30 saniyesiyle aynıdır.

### T1: OTA düzeltmelerinden sonra (11 Kasım 2026)

- **Cihaz:** T0'daki Samsung Galaxy S23; öteki cihazlar ölçülmedi.
- **Build:** 0.10.0 (20), son PR #562 (preview kanalı; uygulama iki kez kapatılıp açıldı, "güncelleme yok" dedi, Süsle'de #562'nin "Rastgele karıştır" etiketi görünüyor).
- **Koşul:** güç tasarrufu kapalı, animatör 1x, koyu tema, USB bağlı ve şarj oluyor; pil ölçüm boyunca %25'ten %48'e çıktı (T0'da %100), pil sıcaklığı 26,6–28,1 °C. Ham çıktılar `docs/denetim/kanit/kapsul-t1/` (`kapsul-`, `bellek-`, `panel-s23-T1-<sahne>-<n>`; koşudan önce ve sonra ekran görüntüsü). Sayılar üç koşunun ortancası; 4. sahne kaydırmasız.

| Sahne                    | Toplam kare | Kare p50 | Kare p95 | Kare p99 | Jank % | Graphics (MB) | Native Heap (MB) | TOTAL PSS (MB) | Panel UI p95 | Panel JS p95 | Pil (mAh / 5 dk) |
| ------------------------ | ----------- | -------- | -------- | -------- | ------ | ------------- | ---------------- | -------------- | ------------ | ------------ | ---------------- |
| 1. Aksesuarsız           | 1610        | 5 ms     | 5 ms     | 13 ms    | 1,6    | 80            | 112              | 353            | 8,3 ms       | 8,9 ms       | ölçülmedi        |
| 2. `kistakimi`           | 1691        | 5 ms     | 6 ms     | 13 ms    | 1,7    | 92            | 146              | 413            | 8,3 ms       | 8,9 ms       | ölçülmedi        |
| 3. `gokkusagiatki`       | 3080        | 8 ms     | 10 ms    | 11 ms    | 12,6   | 117           | 203              | 523            | 8,3 ms       | 9,1 ms       | ölçülmedi        |
| 4. Izgara, 12 avatar     | 1677        | 12 ms    | 15 ms    | 18 ms    | 75,7   | 81            | 352              | 698            | 8,3 ms       | 10 ms        | ölçülmedi        |
| 5. Paketler, açılan kart | 0           | —        | —        | —        | 0      | 165           | 201              | 535            | —            | —            | ölçülmedi        |

- **T0'a göre:** 1. sahne aynı. 2. sahnede p95 9 → 6 ms, jank %7,5 → %1,7, `Graphics` 128 → 92 MB, TOTAL PSS 508 → 413 MB. 3. sahnede 30 saniyede 254 → 3080 kare, p95 200 → 10 ms, jank %100 → %12,6, `Graphics` 239 → 117 MB, TOTAL PSS 666 → 523 MB; panelde ekran p50 116,8 → 8,3 ms. 4. sahnede p95 21 → 15 ms, `Native Heap` 476 → 352 MB, TOTAL PSS 947 → 698 MB; jank %80,2 → %75,7, karelerin çoğu hâlâ 8,3 ms'lik bütçenin üstünde. 5. sahne aynı (açılan kart dururken kare çizilmiyor).
- **3. sahne:** üç koşuda 2703, 3094, 3080 kare; jank %22,5, %12,6, %9,6; p95 üçünde de 10 ms. Koşudan koşuya bellek büyümüyor (`Graphics` 117 MB, TOTAL PSS 496–527 MB), sıcaklık artmıyor. Ekran bu sahnede boşa geçmediği için panel sonucu ekran görüntüsünden okundu (`panel-` dosyaları elle yazıldı). Sahnenin alt kenarı koşularda ekranın birkaç piksel dışında kaldı.
- **4. sahne:** çökme yok; üç koşuda 1672–1685 kare, p95 14–15 ms, jank %72,8–81,6. `Native Heap` koşudan koşuya sabit (350–354 MB; T0'da 325, 476, 494 MB).
- **5. sahne:** test hesabında üç Bronz paket açıldı; açılan kart dururken üç koşuda 0 kare. Ek pencere, yırtma ve kartın gelişi (yırtmadan sonraki 12 sn, üç koşu): 295–303 kare, p50 6 ms, p95 10–12 ms, p99 12–14 ms, jank %1–2,4 (`kapsul-s23-T1-5-acilis-<n>.txt`); T0'da aynı pencerede 554–555 kare, p95 10–11 ms. Kart çevirme penceresi ölçülmedi.
- **Pil:** ölçülmedi (telefon USB ile bağlıydı).
- **Sapma:** 3. sahnenin ilk üç koşusu sayılmadı ve yeniden alındı: birincisine gelen bir arama girdi (görüntüsü depoya konmadı), öteki ikisinde betik Ölç'e basamadı (panel çalışmadan 2264 ve 2283 kare, p95 10 ms, jank %44 ve %42). Tablodaki sayılar ikinci üç koşunundur; ilk koşuların dosyaları üzerine yazıldı.

### T2: SVG ve Skia yan yana (11 Kasım 2026)

- **Cihaz:** T0 ve T1'deki Samsung Galaxy S23; öteki cihazlar ölçülmedi.
- **Build:** 0.11.0 (21), preview kanalı; panelde #565'in "Skia çizimi" anahtarı ve "Skia yan yana" sahnesi görünüyor, "Skia çalışıyor" yazıyor. Güncelleme denetimi yapılmadı.
- **Koşul:** güç tasarrufu kapalı, animatör 1x, koyu tema, Rahatsız Etmeyin açık, USB bağlı ve şarj oluyor; pil ölçüm boyunca %30'dan %58'e çıktı (T1'de %25–48), pil sıcaklığı 31,6–36 °C (SVG koşularında 31,6–33,2, panel açık koşularda 31,8–36; T1'de 26,6–28,1). Ham çıktılar `docs/denetim/kanit/kapsul-t2/` (`kapsul-`, `bellek-`, `panel-s23-T2-<sahne>-<svg|svg-panel|skia>-<n>`; koşudan önce ve sonra ekran görüntüsü, durum çubuğu kırpıldı; `panel-` dosyaları ekran görüntüsünden elle yazıldı). Sayılar üç koşunun ortancası; 4. sahne 12 avatar, kaydırmasız.
- **Panel:** "Skia çizimi" anahtarı yalnız Çizim ölçümü paneli açıkken açık kalır (panel kapanınca Skia da kapanır), bu yüzden Skia satırları panel açıkken ölçüldü. "SVG" satırları T1'deki gibi panel kapalı; "SVG, panel açık" satırları aynı panel açık, anahtar kapalı kontrol koşusudur. Skia, "SVG, panel açık" satırıyla karşılaştırılır.

| Sahne                         | Toplam kare | Kare p50 | Kare p95 | Kare p99 | Jank % | Graphics (MB) | Native Heap (MB) | TOTAL PSS (MB) | Panel UI p95 | Panel JS p95 | Pil (mAh / 5 dk) |
| ----------------------------- | ----------- | -------- | -------- | -------- | ------ | ------------- | ---------------- | -------------- | ------------ | ------------ | ---------------- |
| 1. Aksesuarsız, SVG           | 1635        | 5 ms     | 5 ms     | 12 ms    | 1,5    | 80            | 114              | 358            | 8,3 ms       | 8,9 ms       | ölçülmedi        |
| 2. `kistakimi`, SVG           | 1699        | 5 ms     | 7 ms     | 15 ms    | 2,8    | 92            | 147              | 394            | 8,3 ms       | 8,9 ms       | ölçülmedi        |
| 2. SVG, panel açık            | 1724        | 7 ms     | 9 ms     | 12 ms    | 9,3    | 108           | 169              | 467            | 8,3 ms       | 9 ms         | ölçülmedi        |
| 2. Skia (panel açık)          | 3817        | 9 ms     | 10 ms    | 11 ms    | 0,03   | 128           | 144              | 448            | 8,3 ms       | 9,6 ms       | ölçülmedi        |
| 3. `gokkusagiatki`, SVG       | 2740        | 8 ms     | 10 ms    | 11 ms    | 29,2   | 116           | 206              | 528            | 8,3 ms       | 9,4 ms       | ölçülmedi        |
| 3. SVG, panel açık            | 3224        | 8 ms     | 10 ms    | 11 ms    | 16,2   | 133           | 227              | 578            | 8,3 ms       | 9,1 ms       | ölçülmedi        |
| 3. Skia (panel açık)          | 3816        | 9 ms     | 11 ms    | 11 ms    | 0,03   | 121           | 145              | 434            | 8,3 ms       | 9,6 ms       | ölçülmedi        |
| 4. Izgara, 12 avatar, SVG     | 1694        | 13 ms    | 15 ms    | 23 ms    | 82,1   | 81            | 354              | 710            | 8,3 ms       | 10,7 ms      | ölçülmedi        |
| 4. SVG, panel açık            | 1697        | 14 ms    | 17 ms    | 21 ms    | 80,9   | 97            | 375              | 753            | 8,3 ms       | 10,8 ms      | ölçülmedi        |
| 4. Skia (panel açık)          | 3171        | 16 ms    | 25 ms    | 27 ms    | 20,5   | 103           | 176              | 470            | 16,7 ms      | 24,7 ms      | ölçülmedi        |
| 5. Paketler, açılan kart, SVG | 0           | —        | —        | —        | 0      | 168           | 170              | 484            | —            | —            | ölçülmedi        |

- **T1'e göre (SVG satırları, panel kapalı):** 1. sahne aynı. 2. sahnede p95 6 → 7 ms, jank %1,7 → %2,8, `Graphics` 92 MB'ta aynı, TOTAL PSS 413 → 394 MB. 3. sahnede 30 saniyede 3080 → 2740 kare, p95 10 ms'de aynı, jank %12,6 → %29,2, `Graphics` 117 → 116 MB, TOTAL PSS 523 → 528 MB. 4. sahnede p95 15 ms'de aynı, jank %75,7 → %82,1, `Native Heap` 352 → 354 MB, TOTAL PSS 698 → 710 MB. 5. sahne aynı (açılan kart dururken kare çizilmiyor); `Native Heap` 201 → 170 MB, TOTAL PSS 535 → 484 MB.
- **T1'e göre (Skia satırları):** 2. sahnede p95 6 → 10 ms, `Graphics` 92 → 128 MB, TOTAL PSS 413 → 448 MB, jank %1,7 → %0,03. 3. sahnede p95 10 → 11 ms, `Graphics` 117 → 121 MB, `Native Heap` 203 → 145 MB, TOTAL PSS 523 → 434 MB, jank %12,6 → %0,03. 4. sahnede p95 15 → 25 ms, jank %75,7 → %20,5, `Native Heap` 352 → 176 MB, TOTAL PSS 698 → 470 MB, `Graphics` 81 → 103 MB. Protokolün kabul ölçütü (2. ve 3. sahnede p95 ve `Graphics` T1'den kötü değil) bu sayılarla karşılanmıyor; T1 panel kapalı ölçüldüğü için fark yalnız Skia'nın değildir.
- **Panelin payı (SVG, panel kapalı → panel açık):** 2. sahnede p95 7 → 9 ms, `Graphics` 92 → 108 MB, TOTAL PSS 394 → 467 MB; 3. sahnede `Graphics` 116 → 133 MB, TOTAL PSS 528 → 578 MB; 4. sahnede p95 15 → 17 ms, `Graphics` 81 → 97 MB, TOTAL PSS 710 → 753 MB.
- **Skia, aynı koşulda SVG'ye göre (ikisi de panel açık):** 2. sahnede p95 9 → 10 ms, `Graphics` 108 → 128 MB, `Native Heap` 169 → 144 MB, TOTAL PSS 467 → 448 MB, jank %9,3 → %0,03. 3. sahnede p95 10 → 11 ms, `Graphics` 133 → 121 MB, `Native Heap` 227 → 145 MB, TOTAL PSS 578 → 434 MB, jank %16,2 → %0,03. 4. sahnede p50 14 → 16 ms, p95 17 → 25 ms, jank %80,9 → %20,5, `Graphics` 97 → 103 MB, `Native Heap` 375 → 176 MB, TOTAL PSS 753 → 470 MB; panelde ekran p95 8,3 → 16,7 ms, JS p95 10,8 → 24,7 ms.
- **Kare sayısı:** Skia 2. ve 3. sahnede üç koşuda da 3810–3822 kare çizdi (pencere yaklaşık 32 sn); SVG 2. sahnede 1641–1761, 3. sahnede 2727–3241 kare. Neden ölçülmedi.
- **4. sahne, Skia:** üç koşuda 3112, 3171, 3603 kare; p50 18, 16, 11 ms; p95 25, 25, 23 ms; jank %22,7, %20,5, %5,9; panelde ekran p95 16,7, 16,7, 8,3 ms, takılma %21,7, %19,2, %4,4, JS p95 24,7, 25, 23,1 ms. Bellek koşudan koşuya sabit (`Graphics` 102–103 MB, `Native Heap` 174–177 MB). Çökme yok.
- **5. sahne:** test hesabında açılabilir üç paket açıldı: Bronz, Gümüş, Altın (T1'de üç Bronz). Açılan kart dururken üç koşuda 0 kare. Ek pencere, yırtma ve kartın gelişi (yırtmadan sonraki 12 sn, üç koşu): 300–304 kare, p50 6 ms, p95 11 ms, p99 12–14 ms, jank %1–1,3 (`kapsul-s23-T2-5-acilis-svg-<n>.txt`); T1'de 295–303 kare, p95 10–12 ms. Kart çevirme penceresi ölçülmedi.
- **Galeri (15 aksesuar, solda SVG, sağda Skia; `galeri-s23-T2-<n>a.png`, dokuz durağan görüntü):** Astronot, Büyücü, Dalgıç, Doktor, Hawaii, Kış, Korsan, Rock, Şef ve Yıldız takımı, Gece teni, Orman teni, Gökkuşağı atkı, Kunai kolyesi, Neon gözlük. Durağan görüntülerde on beşinde de şekil, renk ve yer iki yanda aynı; eksik ya da kaymış parça görülmedi. İki yan aynı anda aynı karede değil: parlama şeridi bir görüntüde yalnız solda (Doktor, Gece teni, Kış takımı), bir başkasında yalnız sağda (Orman teni, Rock, Şef, Yıldız takımı) görünüyor; Gökkuşağı atkı'nın şeritleri ve Astronot takımı'nın vizör parlaması iki yanda farklı konumda. Bunun yalnız zamanlama mı yoksa hareket farkı mı olduğu durağan görüntüden ayrılamadı; hareketin kendisi (hız, eğri, parlamanın kırpılması) karşılaştırılmadı. Dört konumda onar saniyelik ekran kaydı alındı ve proje sahibine gönderildi (depoda değil).
- **Proje sahibinin gözlemi (aynı telefon, galeri):** yan yana dururken Skia çok akıcı, bugünkü çizim takılıyor. Tablodaki jank ve kare sayısı bununla aynı yönde (2. ve 3. sahnede Skia jank %0,03 ve yaklaşık 3817 kare; SVG, panel açık, jank %9,3 ve %16,2, 1724 ve 3224 kare); p95 ve `Graphics` aynı yönde değil. Kabul ölçütü yalnız p95 ve `Graphics`'e bakar, akıcılığı (jank, çizilen kare) saymaz.
- **Pil:** ölçülmedi (telefon USB ile bağlıydı).
- **Sapma:** uygulamada `uiautomator` dökümü alınamadığı için betik ekranı sabit koordinatla sürdü ve her dokunuştan önce öndeki uygulamanın skall olduğunu denetledi. Her koşuda `gfxinfo reset`, Ölç, 31,5 sn bekleme, sonra döküm; pencere panelin 30 saniyesinden yaklaşık 2 sn uzun. Panel açık koşularda Ölç düğmesi panelin altında kaldığı için sayfa, panel kapalı koşulardan farklı bir kaydırma konumunda durdu (büyük kapsül iki konumda da ekranın içinde). Telefonun güç tuşu arızalı olduğu için asistan uygulaması ölçüm sırasında birkaç kez kendiliğinden öne geldi: 2. ve 3. sahnenin ilk SVG koşusu ile 3. sahnenin üçüncü panel açık SVG koşusu ölçüm başlamadan durdu ve baştan alındı; sayılan koşuların önce ve sonra görüntülerinde skall önde. 4. sahnenin ikinci panel açık SVG koşusu iki kez yeniden alındı: kaydırma kısa kaldığı için betik Ölç'e basamadı (Ölç'süz pencerede 142 ve 141 kare, p95 36 ms; ilki `kapsul-s23-T2-4-svg-panel-olcsuz.txt`); tablodaki sayı üçüncü denemenindir. Betiği kurarken alınan iki deneme koşusu (2. ve 4. sahne, Skia) sayılmadı.

## Her değişiklikte

1. **Önce:** değişiklikten önceki build ya da OTA ile bu protokol koşulur ve tablo PR'a yazılır.
2. **Sonra:** aynı cihazlarda, aynı akışla yeniden koşulur ve tablo PR'a eklenir. İyileşme yoksa değişiklik birleşmez ya da geri alınır.
3. **Regresyon:** `pnpm check`, ilgili birim testi ve gece E2E'si. Görünüş değişmemeli; bunu proje sahibi telefonda bakarak doğrular (hareket, cam, kademe aynı).
4. **Yayın türü:** OTA (yalnızca JS) ya da yeni build (`modules/`, native). Native değişiklikler tek build'de toplanır.
5. **Geri alma:** OTA'da revert PR'ı birleşince düzeltilmiş güncelleme aynı yoldan gider (`.claude/skills/yayin`); acil durumda önceki güncelleme EAS Update'ten yeniden yayınlanır. Native'de önceki APK ya da revert ile yeni build. Native düzeltmenin JS tarafındaki anahtarı varsa önce o kapatılır.
