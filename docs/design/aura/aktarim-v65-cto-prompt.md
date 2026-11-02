Sen skall uygulamasının (Kabuk deposu, github.com/WazzupDevs/Kabuk, `apps/mobile`) kodunu yazan oturumsun. Tasarım tamamlandı ve onaylandı. Görevin, yeni görünüşü uygulamaya aktarmak.

## Tek kaynak
- Görünüşün tek ve kesin kaynağı Aura tuvali **v65**'tir (sürüm kimliği 1793569092-718f): https://claude.ai/artifact/Fcdza7SJs4i7xyYQJnhRVe
- "skall temiz tuval" ve eski raporlar kaynak değildir. Eski `aktarim-raporu.md`, `cto-aktarim-raporu-aura.md` (v63) ve `28-riso-acilis/cto-aktarim-raporu.md` bu teslimin içinde birleşti; onları ayrıca uygulama.
- Rapor ile tuval çelişirse tuval geçerlidir; çelişkiyi bana yaz.

## Okuyacağın dosyalar (Gökay iletti)
1. `birlesik-aktarim-raporu.md`: ne yapılacağının tamamı. Bölüm 5 (U1–U38), 13 (U39–U42, kayıt ekranları; 13.1 kanki hareketi), 14 (riso açılış) uygulama maddeleridir; bölüm 15 kabul maddeleridir (K1–K28, K-C1–K-C3).
2. `aura-v64/skall.css` (v65 ile aynı), `ekran.css`, `koyu.css`: tokenların ve bileşenlerin tuvaldeki tanımı. `.dark.pA` tek koyu temadır. `hareket.json`: yay ve eğri değerleri.
3. `skall-riso-gorseller-v64.zip`: hazır riso görseller (mekân simgeleri, boş hâller, sahneler, duvar kâğıtları, oyun kapakları, bakan kankiler, 12 süs kanki), kayıt sahnesi `riso-kayit.png`, Masa bitti sahnesi `riso-sahne.png`, Main kankilerinin kapalı göz görselleri (`*_c.png`), wordmark yolu ve 30 kapsül ikon SVG'si. Dosya yolları raporun 9.1 tablosundakiyle aynıdır.
4. 55 masa kartı (yatay 2000x1200 ve uzun 900x1950) ve `masa-adlari.md`: ayrı klasör olarak gelir.
5. Panolar: tuvalde `project/<Pano>.dc.html`. Yalnız üzerinde çalıştığın ekranın panosunu ve kullandığı ortak bileşen panolarını (Renkler, Yazi, Olculer, Ikonlar, IkonlarYeni, IkonlarRevize, BilesenEylem, BilesenYuzey, Sablon*) oku. Yeni 20 ve revize 10 ikonun çizimi IkonlarYeni ve IkonlarRevize panolarındaki inline SVG'dir.

## Uygulama sırası
Her aşama ayrı PR; PR açıklamasında karşıladığı U ve K maddelerini listele.
1. Tokenlar ve koyu tema (U1–U3): `theme.ts`, styleGuard testi.
2. Ölçek, bileşen ölçüleri, pasif düğme, sheet, sabit alt alan (U4, U5, U8–U10).
3. İkon ailesi (U6): kapsül ikonları; Ionicons ve çizgi aile kaldırılır.
4. Alt menü (U7).
5. Ekranlar (U13–U36), raporun sırasıyla. Hâller bölüm 6 tablosundaki kurallarla.
6. Riso görseller (U12, bölüm 9): görselleri `apps/mobile/assets/` altına WebP olarak koy (kaynaklar @2x; büyütme). Masa simgesinde yalnız 9.3'teki 14 eşleşme.
7. Kayıt ekranları ve Masa bitti (U37, U39–U42): riso sahne, 7 kanki yerleşimi, yuvarlak masa görselinin kaldırılması. Sonra 13.1: Main kankilerinin nefes, salınım, göz kırpma ve zıplaması (Reanimated, yalnız transform ve görünürlük; zemin durağan).
8. Oyunların arayüz katmanı (U38).
9. Riso açılış (bölüm 14): `LaunchCurtain.tsx`, `launchMotion.ts`. Zamanlamalar değişmez; SVG `Mask` kalkar; perde yalnız transform ve opacity ile oynar. Doku seti henüz üretilmedi (9.2): katman yapısını, kaynama ve ayrılma hareketini düz renkli yer tutucu katmanlarla kur, doku görselleri gelince yalnız görsel kaynağı değişsin.

## Kurallar
- Hiçbir metni değiştirme. Bölüm 10'daki ürün davranışları ve gizlilik kuralları aynen kalır.
- Yeni titreşim ekleme; mevcutların süresi, şiddeti ve tetiği değişmez. Yeni efekt türü (yeni bulanıklık katmanı, karışım modu, video arka plan) ekleme.
- Native geçişler korunur. Reduced Motion her yerde anında geçiş.
- Hazır olmayan görselleri (9.2) uydurma, üretme ya da başka görselle doldurma: bugünkü görsel kalır, PR'da "görsel bekliyor" diye yaz.
- Açık kararlarda (bölüm 12) tahmin yapma; bugünkü davranış kalır. Özellikle: 100 masa simgesinin 55 riso karta eşleşmesi (12.6) ve ilk açılışın halka/parıltısının riso olup olmayacağı (12.11) karar bekliyor.
- Kayıt ekranında yalnız kankiler hareket eder. `27-riso-animasyon/kayit-riso-animasyon-demo.mp4` içindeki zemin hareketlerini (lamba, ışık zinciri, buhar, kaynama) uygulama.
- Tuvalde görünmeyen bir öğe, mevcut davranışın kaldırıldığı anlamına gelmez. Yalnız raporda açıkça "kaldırılır" yazanları kaldır (ör. Main ve Masa bitti'deki yuvarlak masa görseli, Ionicons, pencere maskesi).
- Bir değer raporda ya da tuvalde yoksa varsayma; bana tek soru olarak yaz.

## Bitince
Her aşamada: değişen dosyalar, karşılanan K maddeleri, karşılanamayanlar ve nedeni, cihazda kontrol edilecekler (K-C1–K-C3 son toplu testte). Tasarımla çelişen ya da uygulanamayan bir madde çıkarsa uygulamadan önce bildir.
