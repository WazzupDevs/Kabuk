# Tuvalin sapmaları ve açık konular

Öncelik README.md'dedir: içerik ve davranışta spec, görünüşte tuval. Bu dosya tuvalin spec'te ya da v46'da karşılığı olmayan yerlerini toplar. Her madde proje sahibinin kararıyla kapanır; kapanan madde spec'e ya da kaldırıldığı panoya işlenir ve buradan silinir.

## Onay bekleyen metinler

Tuvalin yazdığı, spec'te ve v46'da olmayan metinler. Onaylanmadan uygulamaya girmez; uygulama o yerde bugünkü metnini korur.

| Pano | Metin | Neden gerekti |
| --- | --- | --- |
| ProfilNickBekle, ProfilNickYenilendi | "Anonim adın. 30 günde bir yenileyebilirsin; kapsülün aynı kalır." ve düğmenin altında "12 gün sonra yenileyebilirsin." | K-9: yenileme 30 günde bir. v46'nın "Karar bekliyor" hâli kalktı, bekleme hâlinin metni yok |
| MasaBitir | "Ayrılırsan masa sürer; sahiplik masaya en erken katılana geçer." | §4.C: sahibin "Masadan ayrıl"ı "Masayı bitir?" sayfasında ikinci düğme; iki düğmenin farkı yazmıyor |
| MasaKisiSecenekler | Engelle'nin altında "Masadan çıkarılır. Karşı tarafa bildirilmez." | K-13: sahibin engeli kişiyi masadan çıkarır. Katılımcının menüsünde metin "Masadan çıkarsın. Karşı tarafa bildirilmez." olmalı (pano yok) |
| Bildirimler | Eşleşme satırı: "Can ile arkadaş oldunuz", altında "Masa sonunda ikiniz de eklediniz" | K-70: satır var, metni yok |
| Bildirimler | Süresi geçen davet: "Burak seni masasına çağırmıştı" | §4.G: satır soluk görünür; metni yok ("Davet artık geçerli değil" spec'ten) |
| KesfetMekan | "Esentepe Kampüsü girişin biter; bulunduğun masadan ayrılırsın." | §4.E: yeni check-in eskisini bitirir; uyarının metni yok |
| KesfetKonumIzin | Başlık "Konum izni yok" | Gövde uygulamanın bugünkü metni; başlık yok |
| AktivitelerGecmisKayit, AktivitelerGecmisEklendi | Alt sayfanın alt satırı "Sahtekar · bugün 19:30"; eklenince "kapsul-vf61 bunu görmez. O da seni eklerse arkadaş olursunuz. Yeniden basarsan geri alırsın." | 4.3o: kayda basınca alt sayfa; v46'da çizilmemiş |

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
