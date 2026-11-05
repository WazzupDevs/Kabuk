# Kinshi destesi 320 dp ve en büyük yazıda (5 Kasım 2026)

Proje sahibinin kararı (5 Kas 01:53, Aura v95 not `kinshiSource`): kart ekran genişliği − 94 (390'da 296), 3:4; kenar katmanları, yelpaze kartlar, gölge, kelime bandı, yasak listesi, kankiler ve tahmincinin paneli kartla ölçeklenir. Yazı ölçeklenmez: kelime 800/30, yasaklar 800/20; sığmazsa tek satırda en az 22 ve 16'ya küçülür. Çipler kartın yeni alt kenarına göre yerleşir.

Kodda `theme/kinshi.ts` → `kinshiDeck` (testi `kinshiDeck.test.ts`). Oturumun seçimi: kart çizilen 296'dan büyümez (geniş telefonda tuvaldeki gibi kalır); tahmincinin paneli kartın iki yanında 16 bırakır.
