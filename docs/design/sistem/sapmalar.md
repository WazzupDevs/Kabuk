# Tuvalin sapmaları ve açık konular

Öncelik README.md'dedir: içerik ve davranışta spec, görünüşte tuval. Bu dosya tuvalin spec'te ya da v46'da karşılığı olmayan yerlerini toplar. Her madde proje sahibinin kararıyla kapanır; kapanan madde spec'e ya da kaldırıldığı panoya işlenir ve buradan silinir.

## Onay bekleyen metinler

Yok. Tuvalin yazdığı sekiz metin 27 Ekim'de onaylandı ve `docs/SPEC_V4.md` §4.C'ye taşındı.

## Kararla gelen değişiklik

- **Tepki seti** (proje sahibinin kararı, 26 Ekim, "B"): DM, masa ve mekan sohbetinde altı kapsül ifadesi: Beğendim, Bayıldım, Kahkaha, Şaşırdım, Üzüldüm, Kızdım (`uretec/veri/emotes.json`, tuvalin çizimi). Bugünkü altı emojiden (`_shared/pure/reactions.ts`) geçiş migration'la; eski tepkilerin eşlemesi tepki PR'ında proje sahibinin onayına gelir. SPEC_V4 §4.C'de yazılı.

## Görünüşte v46'dan ayrılan yapılar

Tuval v46'nın üstüne kurulmuş yeni bir sistemdir ve arayüz ondan temiz sayfa kurulur; v46 ile piksel karşılaştırması anlamlı değildir. Bilinen yapısal farklar (bugünkü uygulama v46'yı izlediği için ekran PR'larında bu farklar görünür):

| Yer | v46 | Tuval |
| --- | --- | --- |
| Gelen istek | Masa ekranının üstünde satır (`data-req`) | Sekmelerin üstünde kart; dört hâli ve "geliyor" (§4.C: satır görsel adımda) |
| Oyun posteri | Sol üstte "6 TUR · 60 SN" gibi rozet | Sağ üstte en az kişi sayısı ("4+ kişi"); masadaki telefon azsa soluk |
| Etkinlik kartı | Plaka kapağın üstünde | Plaka kapağın altında |
| Push | Yok | Sistem bildirimi önizlemesi; metinler `_shared/pure/push.ts`'ten (ad, masa ve mekan yok) |
| Bilgi balonu | Avatarlı (`.toast`) | Avatarsız; ad taşımaz |
| Satır sonu düğmeleri | Değişken genişlik | Hep 108 × 36 |

## Açık konular

- **Geçmiş satırı "X masasıyla":** 4.5'ten sonra kayıt kişi başınadır; tuval uygulamanın bugünkü metnini çizer ("Ece masasıyla"). Metin 4.6'da kişi modeline göre netleşmeli.
- **Kampüs noktaları:** panolardaki Kantin, Kütüphane, Mühendislik, Çimler örnektir; içerikte noktalar bugün "Örnek nokta 1–3".
- **Oyunlar:** Harf Kapmaca, Şarkıda Geçsin, İbre ve Sohbet kartları ekranları tuvalde yok; 4.6'da her oyun kendi adımında çizilir. Oyun sayfası (Kapsül Anlat, Sahtekar) bugünkü kurallarla çizilmiştir, 4.6'da yeniden bakılır.
- **Hareket:** tuvalde hareket panosu yok; hareket ve titreşim koddaki bugünkü değerlerdir (proje sahibinin kararı, 27 Ekim). Kodda karşılığı olmayan yeni bir parçanın (ör. push önizlemesi) hareketi hareket panosunda tanımlanır.
