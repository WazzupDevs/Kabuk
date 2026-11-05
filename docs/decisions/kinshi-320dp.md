# Kinshi destesi 320 dp ve en büyük yazıda (5 Kasım 2026)

Proje sahibinin kararı (5 Kas 01:53, Aura v95 not `kinshiSource`): kart ekran genişliği − 94 (390'da 296), 3:4; kenar katmanları, yelpaze kartlar, gölge, kelime bandı, yasak listesi, kankiler ve tahmincinin paneli kartla ölçeklenir. Yazı ölçeklenmez: kelime 800/30, yasaklar 800/20; sığmazsa tek satırda en az 22 ve 16'ya küçülür. Çipler kartın yeni alt kenarına göre yerleşir.

Kodda `theme/kinshi.ts` → `kinshiDeck` (testi `kinshiDeck.test.ts`). Oturumun seçimi: kart çizilen 296'dan büyümez (geniş telefonda tuvaldeki gibi kalır); tahmincinin paneli kartın iki yanında 16 bırakır.

## Denetim (5 Kasım 2026)

Ölçüm: kartın fontu (Plus Jakarta Sans 800) ve harf aralığıyla, `upperTr` ile büyük harf; Chromium'da kerning'li ve testte (`kinshiDeck.test.ts`, kerning'siz üst sınır) aynı sonuç. Kelime bandı 320/360/390 dp'de 171/201/224 dp, yasak listesi 159/187/208 dp.

- Düzeldi: tahmincinin paneli 320 dp'de uzun kelimelerle (her satır iki satıra iner) 334 dp'ye çıkıp kartın altından taşıyor, Doğru/Pas/Yasak sayaçlarının üstüne biniyordu; en büyük yazıda 360 ve 390 dp'de de. Destenin kutusu artık panelin ölçülen altına kadar uzar (`kinshiDeckHeight`), sayaçlar onun 37 altında; ölçüler değişmedi, sığmazsa `StageFit`'in ortası kayar.
- Açık (P2): 3-2-1'in kankileri ve Oyun sonunun konfetisi 390'a göre sabit konumda; 320'de ortadaki kanki sağdakinin üstüne biner, sağdaki konfeti ekran dışında kalır. Ayrı PR (planı `docs/PROGRESS.md`'de).

## Proje sahibinin kararları (5 Kasım 2026, denetimden sonra)

- Uzun kelimeler iki satır (`theme/kinshiWord.ts` → `kinshiWordLayout`). 22'de tek satıra sığan kelime tuvaldeki gibi kalır (800/30, tek satırda küçülür). Sığmayan ifade boşluğundan iki satıra bölünür, ortalanır; en küçük 22, kesilmez, "…" yok, içerik değişmez. Satır aralığı kelimenin kendi harflerinden: birinci satırın en alt mürekkebi ile ikincinin en üstü arasında 2 dp (fontun `glyf` sınırları; Ğ 1014, Ç/Ş −240 birim). Android'in yerleşimi (RN 0.86 `CustomLineHeightSpan`: yarım boşluk ascent'in üstüne) hesaba katılır, mürekkep pembenin ortasına oturur.
- Pembe bant görselin içinde çizili (296'da 27,5–85,5; `KINSHI.wordPink`); bant büyütülmez, görsel gerilmez. Sıra: pembe, kenarlarında 2 dp nefesle (yalnızca burada punto 30'a kadar büyür); olmazsa pembenin tamamı 22'de; olmazsa bant kutusu 22'de (yalnızca 320 dp'de Hayvanat bahçesi ve Emniyet kemeri: İ'nin noktası çerçeve çizgisine 1 dp'den az değer). Yasak listesi 26 dp aşağıda kalır.
- İki satıra inen: 320 dp'de 11, 360'ta 5, 390 ve 430'da yalnızca Hayvanat bahçesi (26 punto). 390'da öbür her kelime eskisi gibi.
- Skor hapı: dar hâlde (`lib/narrow.ts`) solda 12, aralar 5 (`KINSHI.scoreNarrow`); tur çipi haptaki sayılar gibi sistem yazısıyla büyümez (`Chip` → `fixed`). İki haneli skorda en çok 180 dp, 320'de kapat ve sohbet düğmelerinden en az 4 dp uzak; 44'lük düğmeler ve dokunma alanları aynı.
- Testler (`kinshiDeck.test.ts`): 547 kart dört genişlikte, fontun dosyasından okunan ölçülerle; kesilen kelime sıfır, iki satır pembede ve ayrık, glif tablosu fontla aynı, hap düğmelere değmez.
