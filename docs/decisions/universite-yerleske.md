# Üniversite ve yerleşke (3 Kasım 2026)

Karar (proje sahibi): Üniversite → Yerleşke → Konum doğrulama → Sosyal alan. Ürün metni `docs/SPEC_V4.md` §4.Q.

- Yeni tablo yalnızca `universities`; yerleşke ikinci bir venue sistemi değil, `university_id` taşıyan kampüs türü venue. Gerekçe: check-in, lobi, sohbet, masa, davet ve Realtime politikalarının hepsi `venue_id` ile sınırlı; yerleşkeyi venue tutmak bunların hiçbirine dokunmadan çok yerleşkeyi açar.
- `venue_contains` ve `explore_venues` pasif üniversitenin yerleşkelerini dışarıda bırakır (migration `20261121090000_universities.sql`). Tolerans 50 m kaldı.
- Tek etkin yerleşkeli üniversite grup satırı olmaz (Sakarya Esentepe'nin satırı değişmesin, tek satırlık alt sayfa gereksiz). Grubun kararı arama ve semtten bağımsızdır: üniversitenin Keşfet'teki etkin yerleşke sayısına bakar (`@shared/explore.ts` → `groupByUniversity`).
- Bitişik yerleşkelerde tolerans çakışması: toleransı daraltmak yerine iki yerleşke ayrı `venue_id` kalır, kişi seçtiğine girer ve yalnızca onun sosyal alanını görür. Aynı çevreyi paylaşan bloklar tek yerleşkenin noktası yapılır.
- İGÜ'nün coğrafi verisi bu oturumdan doğrulanamadı (resmî site ve OSM bu ortamın ağından açılmıyor); tahminle sınır yazılmadı, yerleşke eklenmedi.

## Üniversite sohbeti (4 Kasım 2026)

Karar (proje sahibi): mekan sohbeti yerleşkeye değil üniversiteye bağlıdır. Uygulama: mesaj tablosu değişmedi (mesaj gönderenin yerleşkesinde yazılır), okuma yetkisi ve süzgeçler sohbetin kapsamına genişledi (`20261125090000_university_venue_chat.sql`). Konu adları ve istemci değişmedi: sunucu yayını kapsamın her yerleşkesine yollar. Masa, lobi, davet ve check-in yerleşkede kaldı. Kural 4 ve 9'un metni buna göre güncellendi.
