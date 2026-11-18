# Pano görüntüleri

Yeni arayüz tuvalinin 203 panosunun görüntüleri (açık ve koyu; telefon 390×844, 2 kat: 780×1688; "Dar" panolar 640×1688; kural ve hareket panoları tam sayfa). Görsel doğrulamada uygulama görüntüsüyle yan yana konur (`docs/decisions/gorsel-dogrulama.md`).

- Kaynak: panolar depodaki `docs/design/yeni-arayuz/project/*.dc.html` (ESLEME sürümü 1794920928); çalışma dosyası ve resimler canlı tuvalden (sürüm 1794958528). Hareketler durdurularak çizildi.
- Biçim WebP (kalite 90). `dizin.json`: dosya, pano no, tema, görüntü adı, boy.
- Tek commit, tuval değişince yeniden yazılır; main'e görüntü girmez.
