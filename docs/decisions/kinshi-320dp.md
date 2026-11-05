# Kinshi destesi 320 dp ve en büyük yazıda (5 Kasım 2026)

Proje sahibinin kararı (5 Kas 01:53, Aura v95 not `kinshiSource`): kart ekran genişliği − 94 (390'da 296), 3:4; kenar katmanları, yelpaze kartlar, gölge, kelime bandı, yasak listesi, kankiler ve tahmincinin paneli kartla ölçeklenir. Yazı ölçeklenmez: kelime 800/30, yasaklar 800/20; sığmazsa tek satırda en az 22 ve 16'ya küçülür. Çipler kartın yeni alt kenarına göre yerleşir.

Kodda `theme/kinshi.ts` → `kinshiDeck` (testi `kinshiDeck.test.ts`). Oturumun seçimi: kart çizilen 296'dan büyümez (geniş telefonda tuvaldeki gibi kalır); tahmincinin paneli kartın iki yanında 16 bırakır.

## Denetim (5 Kasım 2026)

Ölçüm: kartın fontu (Plus Jakarta Sans 800) ve harf aralığıyla, `upperTr` ile büyük harf; Chromium'da kerning'li ve testte (`kinshiDeck.test.ts`, kerning'siz üst sınır) aynı sonuç. Kelime bandı 320/360/390 dp'de 171/201/224 dp, yasak listesi 159/187/208 dp.

- Düzeldi: tahmincinin paneli 320 dp'de uzun kelimelerle (her satır iki satıra iner) 334 dp'ye çıkıp kartın altından taşıyor, Doğru/Pas/Yasak sayaçlarının üstüne biniyordu; en büyük yazıda 360 ve 390 dp'de de. Destenin kutusu artık panelin ölçülen altına kadar uzar (`kinshiDeckHeight`), sayaçlar onun 37 altında; ölçüler değişmedi, sığmazsa `StageFit`'in ortası kayar.
- Açık (tasarıma soruldu): 22'de tek satıra sığmayan kelimeler Android'de "…" ile biter. 320 dp'de 11 kart (Hayvanat bahçesi, Süper kahraman, Pazar kahvaltısı, Nasreddin Hoca, Nazar boncuğu, Robot süpürge, Hesap makinesi, Emniyet kemeri, Oyun konsolu, Sosyal medya, Tost makinesi), 360'ta 4, 390 ve 430'da Hayvanat bahçesi (226,5 / 224, sınırda). Hepsi iki kelime. Yasakların hepsi her genişlikte 16'da sığar (en uzunu Gerçekleşmek 134 / 159).
- Açık (P2): üstteki skor hapı 320 dp'de iki haneli skorla 194 dp, yer 192 (büyük yazıda tur çipiyle 207): kapat ve sohbet düğmelerine değer. 3-2-1'in kankileri ve Oyun sonunun konfetisi 390'a göre sabit konumda; 320'de ortadaki kanki sağdakinin üstüne biner, sağdaki konfeti ekran dışında kalır.
