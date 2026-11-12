# Ortak tasarım ve hareket dili: iskelet (12 Kasım 2026)

Karar (proje sahibi, 12 Kasım 2026, sohbette verilen iş paketi): uygulamanın arayüzü tek bir ortak dile ve iOS akıcılığına taşınır. Kurallar `docs/design/iskelet.md`'dedir (iş paketinin 2 ile 6 arasındaki bölümleri); görsel kaynak https://claude.ai/artifact/WJmhCyXCHejJcnaFk8ZfcR. Veri, sunucu, mantık ve navigasyon yapısı aynı kalır.

## Değiştirdiği önceki kararlar

- **Riso düğmeler (8 Kasım, `riso-dugme.md`): geçersiz.** Düğmelerin hepsi cam (prominent, clear, danger); riso çizimlerde ve kankilerde kalır.
- **Canlı cam kapalı (6 Kasım, `cam-kapali.md`): daraltıldı.** Canlı bulanıklık yalnız üst bar bandında, sekme çubuğunda, alt sayfalarda, menülerde ve sabitlenen şeritlerde geri gelir (buzlu cam modülü; Liquid Glass merceği değil). Düğmelerde ve kartlarda canlı bulanıklık yine yok. Bulanıklık kaydırmada yeniden hesaplanmaz: katman bir kez çizilir, yalnız opaklığı değişir. 6 Kasım'ın gerekçesi (her karede yeniden hesaplanan cam) bu koşulla karşılanır.
- **Tasarım kapısı (11 Kasım):** bu paketin ekranları proje sahibinin onayıyla gelir; Atölye'de ayrıca taslak istenmez.
- **Süreç:** paket hızlı yolla yürür (adım başına PR, `ci` yeşil olunca birleşir, OTA).

## Teslim sırası

1. `iskelet.md`, `MOTION` eklemeleri, hareket kiti (`src/motion`: Tap, Rise, PopIn, Sheet, Menu, TopBar, ScrollScreen, StickyField, TabBar), cam `Btn`, styleGuard yasakları.
2. Ekranlar 5.1'den 5.11'e.
3. Bölüm 6'daki hatalar.
4. 6.5 (iPhone'da 120 Hz) bir sonraki native build'e.

## Açık kalan iki soru (12 Kasım, proje sahibine soruldu)

- **5.6 "Birlikte oynanan oyunlar" ve değişmez kural 4.** Ortak `play_history` kaydını profilde göstermek, masada anonim oturmuş bir arkadaşın o masadaki anonim kişi olduğunu açar; kural 4 ve K-75 bunu bilerek gizliyor ("Arkadaşsınız" yalnızca kişi masada profilliyse görünür). Cevap gelene kadar bu bölüm yazılmaz.
- **5.10 Kapsül düzenleyici ve 11 Kasım'ın ölçüm kuralı.** Deneme şeridi, bugün iki kez hata çıkaran şerit kodunun yerine geçiyor; "telefonda ölçmeden ya da ekran kaydı görmeden gönderme" kuralı bu ekranda geçerli mi, yoksa bu paket onu da kaldırıyor mu.

## Belgeye yazarken düzeltilen atıflar

İş paketindeki üç iç atıf numarası başka bölümü gösteriyordu; `iskelet.md`'de anlamına göre düzeltildi: kapak türü "5.7, 5.6 ve 5.2", Mesajlar'daki arama "5.4", menünün yayı "4.3 → `springs.menu`".
