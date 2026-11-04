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

- **Build:** preview kanalının APK'sı, yani release derlemesi (dev client değil). Dev build JS'i birkaç kat ağır çalıştırdığı için ölçüme girmez. Ölçülen build'in numarası ve OTA güncelleme kimliği (Ayarlar → Hakkında) kayda yazılır.
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

## Her değişiklikte

1. **Önce:** değişiklikten önceki build ya da OTA ile bu protokol koşulur ve tablo PR'a yazılır.
2. **Sonra:** aynı cihazlarda, aynı akışla yeniden koşulur ve tablo PR'a eklenir. İyileşme yoksa değişiklik birleşmez ya da geri alınır.
3. **Regresyon:** `pnpm check`, ilgili birim testi ve gece E2E'si. Görünüş değişmemeli; bunu proje sahibi telefonda bakarak doğrular (hareket, cam, kademe aynı).
4. **Yayın türü:** OTA (yalnızca JS) ya da yeni build (`modules/`, native). Native değişiklikler tek build'de toplanır.
5. **Geri alma:** OTA'da revert PR'ı birleşince düzeltilmiş güncelleme aynı yoldan gider (`.claude/skills/yayin`); acil durumda önceki güncelleme EAS Update'ten yeniden yayınlanır. Native'de önceki APK ya da revert ile yeni build. Native düzeltmenin JS tarafındaki anahtarı varsa önce o kapatılır.
