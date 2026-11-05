# Kibrit ekranları: gizli soru, gizli oy (5 Kasım 2026)

Aura v90 "Kibrit (gizli soru, gizli oy)" satırı (11 pano), kurallar `docs/SPEC_V4.md` → Adım 4.6.9 ve K-86 (Görünüş tablosundaki karar farklarıyla). Ekranlar `features/games/kibrit/KibritGame.tsx`, ölçüler `theme/kibrit.ts`; üst çubuk, şerit, deste, kankiler ve yüzler riso ortak parçaları (`features/games/riso/`), faz hapı, göz başlığı ve Hazır çipi Krot'unkiler. Sunucu #476 değişmedi. `content/games.json` → `kibrit.available` hâlâ `false` (ayrı PR, proje sahibinin onayıyla).

## Oturumun seçtikleri (tasarım tanımlamıyor; proje sahibi telefonda bakınca onaylar ya da düzeltir)

- Tur çipi: sahip dokundukça bir artar, oyuncu sayısından sonra 1'e döner (varsayılan `min(5, n)`); başkasında yalnız gösterir.
- "Bildir" (herkes) ve "Atla" (sahip) ana düğmenin üstünde küçük cam düğmeler; bildirim nedenleri masadaki şikayetinkiler, "Yanlış cinsiyet beyanı" hariç (kâğıt kişi değildir). Bildirince satır "Şikayetin alındı" olur, düğme bir daha basılmaz.
- Kâğıtlar kavanozda (3 sn) ve gözlemcinin yazma süresi kavanoz panosuyla, düğmesiz; şerit "Kâğıtlar kavanozda" + "n/m kişi yazdı".
- Gözlemci oylamada ızgarayı basılamaz görür, şeridin alt satırı "n/m kişi oy verdi".
- Oylar açıldı: 3–4 oyuncuda tablo yok, yalnız sahnedeki yüz(ler) ve ad(lar); beraberlikte yüzler yan yana. Katılım ("5 kişiden 4'ü oy verdi") tablonun altında. Sahip olmayan oyuncuda "Hazırım".
- Uzun soru kâğıtta en çok beş satıra sığacak kadar küçülür (en az %60).
- Süre bitince titreşim (timeUp) yazma ve oylama süresi dolup aşama değişince bir kez.

## Tasarıma sorulacaklar (çizilmedi)

"Yeterli kâğıt yok" (şimdilik oyun sonu düzeni, başlık ve açıklamayla), yükleniyor ve bağlantı hatası, 320 dp (oy ızgarası 3 sütun kaldı; 2 sütun önerisi), en büyük yazı, 7+ oyuncuda ızgara ve tablo, beraberlik, uzun soru.
