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

## Her değişiklikte

1. **Önce:** değişiklikten önceki build ya da OTA ile bu protokol koşulur ve tablo PR'a yazılır.
2. **Sonra:** aynı cihazlarda, aynı akışla yeniden koşulur ve tablo PR'a eklenir. İyileşme yoksa değişiklik birleşmez ya da geri alınır.
3. **Regresyon:** `pnpm check`, ilgili birim testi ve gece E2E'si. Görünüş değişmemeli; bunu proje sahibi telefonda bakarak doğrular (hareket, cam, kademe aynı).
4. **Yayın türü:** OTA (yalnızca JS) ya da yeni build (`modules/`, native). Native değişiklikler tek build'de toplanır.
5. **Geri alma:** OTA'da revert PR'ı birleşince düzeltilmiş güncelleme aynı yoldan gider (`.claude/skills/yayin`); acil durumda önceki güncelleme EAS Update'ten yeniden yayınlanır. Native'de önceki APK ya da revert ile yeni build. Native düzeltmenin JS tarafındaki anahtarı varsa önce o kapatılır.
