# Vampir Köylü: kapsül masa (4 Kasım 2026)

Proje sahibinin onayı: Aura v83, panolar VampirRolun, VampirGece, VampirSabah, VampirOylama, VampirSonuc, VampirOylama12 (K-84). Kaynak `docs/design/vampir/kapsul-masa/` (kabul raporu, referans çizim kodu).

- **Çizim:** oda (zemin, halı, oda objeleri, pencere ışığı, faz rengi, vinyet) faz başına hazır görsel (`assets/vampir/scene/room-*.webp`). Masa faz başına bir kez çizilen görsel (`scripts/art/vampirScene.ts`; lamba ışığı ve vinyet içinde). Tabureler, mumlar, alev ve duman, süre kadranı react-native-svg ile, kişi sayısına ve ölenlere göre. Faz rengi (multiply) ve gündüz aydınlatması (screen) düz renkte toplama ve çarpma olduğu için her renk `paint` ile dönüştürülür; sonuç referansla aynı. Mumların ışığı `mixBlendMode: 'screen'` ile (referansta `lighter`; React Native'de yok, en yakını). Skia kullanılmadı: native bağımlılık ve build gerektirirdi.
- **Proje sahibinin kararları (4 Kasım):** ana düğme 48 (K12'nin 56'sı yerine, 2 Kasım kuralı); Gündüz ve Eleme yeni masada, ortaları (madalyon, kum saati) eskisi gibi; hareketler var olan sürelerle (sahne geçişi 450 ms, kart dönüşü 550 ms; hareketi azaltta anında); minder rengi koltuk sırasıyla (8 kişide build.py P8, fazlasında P12 sırası).
- **Çizgiler kalktı:** kapsül masada koltuklar arası çizgi sahnenin üstünden geçmeden çizilemiyor. Oy verenler adayın yüzünün çevresinde (K7); vampirin gördüğü diğer vampirlerin gece seçimi (kural 3) seçilen koltuğun çevresinde pembe kenarlı küçük yüzle.
- **Tasarımın tanımlamadığı yerler:** 8 kişide de 2'den fazla ek adayda yalnız sayı hapı; en çok 1 + 3 aday ortada (diğerleri koltuktaki sayı hapında). Kazanan ikiden fazlaysa yüzler 30 ve satır satır. "Hazırım" kart bir kez basılı tutulmadan pasif (K6).

## Eksik hâller (5 Kasım 2026, Aura v93)

Panolar VampirRolKarti, VampirGunduz, VampirEleme yeni masa diline çevrildi; yeni panolar VampirOylamaDar, VampirYukleniyor, VampirHata (kabul raporu aynı klasörde).

- **Kalkanlar:** kum saati ve madalyon (Gündüz, Eleme); süre her fazda pirinç kadranda yalnız sayı. Madalyon ve kum saati resimleri, betiği ve testi silindi. Eleme şafak ışığında.
- **Proje sahibinin kararları (5 Kasım):** "Geceyi başlat" herkes hazır olana kadar pasif; yalnızca uygulama tutar, sunucu ve rolün 30 saniyesi aynı. Büyük yazıda uzun koltuk adı baştan "…" ile kısalır ("…sul-sd62"), ayırt edici son ek görünsün diye; CLAUDE.md'nin "'...' ile kesilmez" kuralının tek istisnası.
- **Oturumun seçtikleri:** Yükleniyor uygulamanın kapsül yükleyicisiyle (Tahterevalli, 56; yeni hareket yok). Bağlantı hatası telefonun kendi görünümü (`vampir/view`) okunamayınca; düğme hataları eskisi gibi düğmelerin üstünde. Büyük yazı düzeni sistem yazısı 1,15 ve üstünde Oylama'da; boylar panelin 320 dp değerleri sahnenin ölçeğine göre (`narrowScale`). Eşitlikte elemede Sabah'ın güneşi yerine ay (56). Cam blok bulanıklaştırmaz (oyunun diğer camları gibi yarı saydam).
