# Keşfet: Mekan | Semt sekmeleri (26 Kasım 2026)

Proje sahibinin kararı, Keşfet revizesinde yapıtla (claude.ai yapıtı "Keşfet yeniden düzen") seçildi.

- **Sorun:** Semte Git kartı listenin içinde duruyordu; mekan sayısı arttıkça ya kart aşağıda kayboluyor ya da mekanları aşağı itiyordu. Semt sohbeti önemli olduğu için listeden çıkarıldı.
- **Karar:** Keşfet'in en üstünde "Keşfet" sayfa başlığı, altında Mesajlar ve Aktiviteler'in anahtarıyla aynı görünüşte "Mekan | Semt", altında seçili sekmenin kendi başlığı. Mekan sekmesi bugünkü liste (soru başlığı ya da "Şu an buradasın", arama, çipler, şehir satırı, biletler); Semt sekmesi kendi başlığı ("Evde misin? Semtin sohbette.") ve Semte Git kartı.
- **Başlık boyu:** sekme başlıkları 24 (kit `title`); üstteki "Keşfet" 30. İkisi 30 olunca iki sayfa başlığı gibi okunuyordu.
- **Kalkanlar:** listedeki semt kartı, kaydırınca arama alanının altına gelen semt şeridi (`DistrictStrip`), check-in varken semtin tek satırlık hâli.
- **Açılış:** Keşfet her açılışta Mekan sekmesinde. Semte Git kapalı derlemede (`DISTRICT_VISIBLE` yanlış) anahtar çizilmez.
- Ürün belgesi: `docs/SPEC_V4.md` §4.V → Giriş.
